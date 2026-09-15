// Copia o conteudo de um projeto do Supabase para outro.
//
// Uso:
//   1. npm run migrate            (com .env.novo, pra criar a estrutura la)
//   2. node scripts/migrar-supabase.mjs
//
// Le a ORIGEM do .env.local e o DESTINO do .env.novo.
//
// O que copia: arquivos do Storage, os locais e tudo que pendura neles
// (horarios, etiquetas, itens, fotos) e os eventos.
//
// O que NAO copia, de proposito:
//   - Usuarios. A senha fica guardada embaralhada e passar isso de um projeto
//     pro outro na mao e pedir problema. Hoje existe um unico usuario, que se
//     cadastra de novo em 30 segundos.
//   - visitas e chat_uso. Sao contadores; comecar do zero nao custa nada.
//
// Roda quantas vezes precisar: cada local e regravado pelo slug, e as tabelas
// filhas sao trocadas em vez de acumular duplicata.
import { readFileSync } from "node:fs";
import dns from "node:dns";
import { Agent, setGlobalDispatcher } from "undici";
import { createClient } from "@supabase/supabase-js";

const BUCKET = "locais";

/* ---------------- credenciais ---------------- */

function lerEnv(arquivo) {
  const valores = {};
  for (const linha of readFileSync(arquivo, "utf8").split(/\r?\n/)) {
    const m = linha.match(/^([A-Z_]+)=(.*)$/);
    if (m) valores[m[1]] = m[2].trim().replace(/^["']|["']$/g, "");
  }
  return valores;
}

function conectar(valores, nome) {
  const endereco = valores.NEXT_PUBLIC_SUPABASE_URL;
  const chave = valores.SUPABASE_SERVICE_ROLE_KEY;
  if (!endereco || !chave) {
    console.error(`\nFaltam as chaves do ${nome}.\n`);
    process.exit(1);
  }
  return {
    endereco,
    cliente: createClient(endereco, chave, {
      auth: { autoRefreshToken: false, persistSession: false },
    }),
  };
}

/** Mesmo contorno de DNS do subir-fotos.mjs: provedor teimoso nao trava a obra. */
async function contornarDns(...enderecos) {
  const mapa = new Map();
  for (const e of enderecos) {
    const host = new URL(e).hostname;
    try {
      await dns.promises.lookup(host);
    } catch {
      const r = new dns.promises.Resolver();
      r.setServers(["1.1.1.1", "8.8.8.8"]);
      mapa.set(host, await r.resolve4(host));
      console.log(`(DNS do provedor falhou para ${host}; usando 1.1.1.1)`);
    }
  }
  if (mapa.size === 0) return;

  setGlobalDispatcher(
    new Agent({
      connect: {
        lookup(nome, opcoes, retorno) {
          const ips = mapa.get(nome);
          if (!ips) return dns.lookup(nome, opcoes, retorno);
          return opcoes.all
            ? retorno(null, [{ address: ips[0], family: 4 }])
            : retorno(null, ips[0], 4);
        },
      },
    }),
  );
}

const origem = conectar(lerEnv(".env.local"), "projeto de origem (.env.local)");
const destino = conectar(lerEnv(".env.novo"), "projeto de destino (.env.novo)");

if (origem.endereco === destino.endereco) {
  console.error("\nOrigem e destino sao o mesmo projeto. Confira o .env.novo.\n");
  process.exit(1);
}

await contornarDns(origem.endereco, destino.endereco);

console.log(`origem : ${origem.endereco}`);
console.log(`destino: ${destino.endereco}\n`);

/* ---------------- Storage ---------------- */

/** Percorre as pastas do bucket e devolve o caminho de cada arquivo. */
async function listarArquivos(cliente, pasta = "") {
  const { data, error } = await cliente.storage
    .from(BUCKET)
    .list(pasta, { limit: 1000 });

  if (error) throw new Error(`nao consegui listar "${pasta}": ${error.message}`);

  const caminhos = [];
  for (const item of data ?? []) {
    const caminho = pasta ? `${pasta}/${item.name}` : item.name;
    // Pasta nao tem metadados; arquivo tem.
    if (item.id === null || item.metadata === null) {
      caminhos.push(...(await listarArquivos(cliente, caminho)));
    } else {
      caminhos.push(caminho);
    }
  }
  return caminhos;
}

console.log("— Arquivos —");
const arquivos = await listarArquivos(origem.cliente);
let copiados = 0;

for (const caminho of arquivos) {
  const { data, error } = await origem.cliente.storage.from(BUCKET).download(caminho);
  if (error) {
    console.error(`  ! nao baixei ${caminho}: ${error.message}`);
    continue;
  }

  const conteudo = Buffer.from(await data.arrayBuffer());
  const { error: erroEnvio } = await destino.cliente.storage
    .from(BUCKET)
    .upload(caminho, conteudo, {
      contentType: data.type || "application/octet-stream",
      upsert: true,
    });

  if (erroEnvio) {
    console.error(`  ! nao enviei ${caminho}: ${erroEnvio.message}`);
    continue;
  }

  copiados++;
  console.log(`  ${caminho}  (${(conteudo.length / 1024).toFixed(0)} KB)`);
}
console.log(`  -> ${copiados} de ${arquivos.length} arquivo(s)\n`);

/* ---------------- endereços das fotos ---------------- */

// As fotos ficam gravadas no banco pela URL completa, que carrega o nome do
// projeto antigo. Sem trocar isso, o site novo continuaria buscando imagem no
// projeto velho — e pararia de funcionar no dia que ele fosse apagado.
const trocarEndereco = (url) =>
  typeof url === "string" ? url.replaceAll(origem.endereco, destino.endereco) : url;

/* ---------------- tabelas de apoio ---------------- */

async function mapaPorSlug(cliente, tabela) {
  const { data, error } = await cliente.from(tabela).select("id, slug");
  if (error) throw new Error(`${tabela}: ${error.message}`);
  return new Map((data ?? []).map((l) => [l.slug, l.id]));
}

// As categorias e etiquetas ja nascem no destino pelas migrations, mas os
// numeros de identificacao podem nao bater. Traduz tudo pelo slug.
const categoriasOrigem = await mapaPorSlug(origem.cliente, "categorias");
const categoriasDestino = await mapaPorSlug(destino.cliente, "categorias");
const tagsOrigem = await mapaPorSlug(origem.cliente, "tags");
const tagsDestino = await mapaPorSlug(destino.cliente, "tags");

const slugDaCategoria = new Map([...categoriasOrigem].map(([s, id]) => [id, s]));
const slugDaTag = new Map([...tagsOrigem].map(([s, id]) => [id, s]));

/* ---------------- locais ---------------- */

console.log("— Locais —");

const { data: locais, error: erroLocais } = await origem.cliente
  .from("locais")
  .select("*")
  .order("criado_em");

if (erroLocais) {
  console.error(`Nao consegui ler os locais: ${erroLocais.message}`);
  process.exit(1);
}

const filhas = [
  ["locais_horarios", "dia_semana, abre, fecha, observacao"],
  ["locais_itens", "secao, nome, descricao, preco, ordem"],
  ["locais_fotos", "url, legenda, ordem"],
];

for (const local of locais ?? []) {
  const { id: idAntigo, busca: _busca, ...campos } = local;
  void _busca; // coluna calculada pelo banco: nao se escreve nela

  campos.categoria_id = campos.categoria_id
    ? (categoriasDestino.get(slugDaCategoria.get(campos.categoria_id)) ?? null)
    : null;

  // O dono e um usuario que nao existe no projeto novo. Fica sem dono ate a
  // pessoa se cadastrar la; o admin religa depois pelo painel.
  campos.dono_id = null;
  campos.capa_url = trocarEndereco(campos.capa_url);

  const { data: gravado, error } = await destino.cliente
    .from("locais")
    .upsert(campos, { onConflict: "slug" })
    .select("id")
    .single();

  if (error) {
    console.error(`  ! ${local.nome}: ${error.message}`);
    continue;
  }

  const idNovo = gravado.id;
  const resumo = [];

  for (const [tabela, colunas] of filhas) {
    const { data: linhas } = await origem.cliente
      .from(tabela)
      .select(colunas)
      .eq("local_id", idAntigo);

    await destino.cliente.from(tabela).delete().eq("local_id", idNovo);
    if (!linhas?.length) continue;

    const novas = linhas.map((l) => ({
      ...l,
      local_id: idNovo,
      ...(tabela === "locais_fotos" ? { url: trocarEndereco(l.url) } : {}),
    }));

    const { error: erroFilha } = await destino.cliente.from(tabela).insert(novas);
    if (erroFilha) console.error(`  ! ${tabela} de ${local.nome}: ${erroFilha.message}`);
    else resumo.push(`${novas.length} ${tabela.replace("locais_", "")}`);
  }

  // Etiquetas: traduz cada uma pelo slug antes de gravar.
  const { data: etiquetas } = await origem.cliente
    .from("locais_tags")
    .select("tag_id")
    .eq("local_id", idAntigo);

  await destino.cliente.from("locais_tags").delete().eq("local_id", idNovo);

  const novasTags = (etiquetas ?? [])
    .map((t) => tagsDestino.get(slugDaTag.get(t.tag_id)))
    .filter(Boolean)
    .map((tag_id) => ({ local_id: idNovo, tag_id }));

  if (novasTags.length) {
    const { error: erroTags } = await destino.cliente
      .from("locais_tags")
      .insert(novasTags);
    if (erroTags) console.error(`  ! etiquetas de ${local.nome}: ${erroTags.message}`);
    else resumo.push(`${novasTags.length} etiquetas`);
  }

  console.log(`  ${local.nome}${resumo.length ? ` — ${resumo.join(", ")}` : ""}`);
}

/* ---------------- eventos ---------------- */

const { data: eventos } = await origem.cliente.from("eventos").select("*");
if (eventos?.length) {
  const locaisDestino = await mapaPorSlug(destino.cliente, "locais");
  const locaisOrigem = new Map(
    (locais ?? []).map((l) => [l.id, l.slug]),
  );

  const novos = eventos.map(({ id: _id, ...e }) => {
    void _id;
    return {
      ...e,
      local_id: e.local_id
        ? (locaisDestino.get(locaisOrigem.get(e.local_id)) ?? null)
        : null,
      criado_por: null,
      imagem_url: trocarEndereco(e.imagem_url),
    };
  });

  const { error } = await destino.cliente.from("eventos").insert(novos);
  console.log(
    error ? `\n! eventos: ${error.message}` : `\n— Eventos —\n  ${novos.length} copiado(s)`,
  );
}

console.log("\nPronto. ✅");
console.log("Falta: cadastrar sua conta no site novo e voltar a ser admin.");
