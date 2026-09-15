// Sobe fotos de um local para o Storage e liga no banco.
//
// Uso: node scripts/subir-fotos.mjs <arquivo-de-lista.json>
//
// O arquivo de lista descreve o que vai pra onde:
// [
//   { "slug": "portico-de-ivoti", "arquivos": ["C:/.../foto.jpg"], "capa": 0 }
// ]
// "capa" e o indice da foto que vira a imagem principal do local (padrao 0).
//
// As fotos sao reduzidas antes de subir: foto de camera vem com 6000px e uns
// 5 MB, o que deixaria a pagina pesada no celular de quem esta na rua.
import { readFileSync } from "node:fs";
import { basename } from "node:path";
import dns from "node:dns";
import { Agent, setGlobalDispatcher } from "undici";
import sharp from "sharp";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

/**
 * Contorna DNS de provedor teimoso.
 *
 * Quando um projeto do Supabase fica pausado, o endereco dele some do DNS. Ao
 * voltar, alguns provedores seguram por horas a resposta velha de "dominio
 * inexistente", e o computador nao acha o servidor mesmo com tudo no ar.
 *
 * Se o resolvedor do sistema falhar, este trecho pergunta direto ao DNS da
 * Cloudflare e do Google e passa o endereco ja resolvido para as conexoes.
 * Nao altera nenhuma configuracao do computador — vale so enquanto o script
 * estiver rodando.
 */
async function contornarDnsSeNecessario(endereco) {
  const host = new URL(endereco).hostname;

  try {
    await dns.promises.lookup(host);
    return;
  } catch {
    // o sistema nao resolveu — segue para o plano B
  }

  const resolvedor = new dns.promises.Resolver();
  resolvedor.setServers(["1.1.1.1", "8.8.8.8"]);
  const ips = await resolvedor.resolve4(host);

  setGlobalDispatcher(
    new Agent({
      connect: {
        lookup(nome, opcoes, retorno) {
          if (nome !== host) return dns.lookup(nome, opcoes, retorno);
          return opcoes.all
            ? retorno(null, [{ address: ips[0], family: 4 }])
            : retorno(null, ips[0], 4);
        },
      },
    }),
  );

  console.log(`(DNS do provedor falhou para ${host}; usando 1.1.1.1)`);
}

const ENDERECO = process.env.NEXT_PUBLIC_SUPABASE_URL;
const CHAVE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!ENDERECO || !CHAVE) {
  console.error("\nFaltam NEXT_PUBLIC_SUPABASE_URL e SUPABASE_SERVICE_ROLE_KEY no .env.local\n");
  process.exit(1);
}

const BUCKET = "locais";
const LARGURA_MAXIMA = 1600;
const QUALIDADE = 82;

await contornarDnsSeNecessario(ENDERECO);

const supabase = createClient(ENDERECO, CHAVE, {
  auth: { autoRefreshToken: false, persistSession: false },
});

const lista = JSON.parse(readFileSync(process.argv[2], "utf8"));

for (const item of lista) {
  const { slug, arquivos, capa = 0 } = item;

  const { data: local, error: erroLocal } = await supabase
    .from("locais")
    .select("id, nome")
    .eq("slug", slug)
    .maybeSingle();

  if (erroLocal || !local) {
    console.error(`  ! nao achei o local "${slug}" — pulando`);
    continue;
  }

  console.log(`\n${local.nome}`);

  // Troca as fotos anteriores deste local em vez de acumular duplicata a cada
  // vez que o script roda.
  await supabase.from("locais_fotos").delete().eq("local_id", local.id);

  const urls = [];

  for (const [i, caminho] of arquivos.entries()) {
    const original = readFileSync(caminho);

    const reduzida = await sharp(original)
      .rotate() // respeita a orientacao gravada pela camera
      .resize({ width: LARGURA_MAXIMA, withoutEnlargement: true })
      .jpeg({ quality: QUALIDADE, mozjpeg: true })
      .toBuffer();

    const destino = `pontos/${slug}-${i + 1}.jpg`;

    const { error: erroUpload } = await supabase.storage
      .from(BUCKET)
      .upload(destino, reduzida, { contentType: "image/jpeg", upsert: true });

    if (erroUpload) {
      console.error(`  ! erro ao subir ${basename(caminho)}: ${erroUpload.message}`);
      continue;
    }

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(destino);
    urls.push(data.publicUrl);

    const antes = (original.length / 1048576).toFixed(1);
    const depois = (reduzida.length / 1024).toFixed(0);
    console.log(`  ${basename(caminho)}  ${antes} MB -> ${depois} KB`);
  }

  if (urls.length === 0) continue;

  const linhas = urls.map((url, ordem) => ({
    local_id: local.id,
    url,
    ordem,
  }));

  const { error: erroFotos } = await supabase.from("locais_fotos").insert(linhas);
  if (erroFotos) console.error(`  ! erro ao gravar as fotos: ${erroFotos.message}`);

  const { error: erroCapa } = await supabase
    .from("locais")
    .update({ capa_url: urls[capa] ?? urls[0] })
    .eq("id", local.id);
  if (erroCapa) console.error(`  ! erro ao gravar a capa: ${erroCapa.message}`);

  console.log(`  -> ${urls.length} foto(s), capa definida`);
}

console.log("\nPronto. ✅");
