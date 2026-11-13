"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import TirarDoAr from "@/components/painel/TirarDoAr";
import {
  AreaTexto,
  Bloco,
  BotaoSalvar,
  Texto,
} from "@/components/painel/Campos";
import EditorFotos from "@/components/painel/EditorFotos";
import EditorHorarios from "@/components/painel/EditorHorarios";
import EditorItens from "@/components/painel/EditorItens";
import EscolherPosicao from "@/components/painel/EscolherPosicao";
import type { Categoria, LocalCompleto, Tag } from "@/lib/tipos";
import { pedirAviso } from "@/lib/avisar";
import { videoParaMostrar } from "@/lib/video";
import { explicarErro, SESSAO_TERMINOU } from "@/lib/erro-do-banco";

const ABAS = [
  { id: "sobre", nome: "Sobre" },
  { id: "endereco", nome: "Endereço" },
  { id: "horarios", nome: "Horários" },
  { id: "fotos", nome: "Fotos" },
  { id: "itens", nome: "Cardápio" },
] as const;

type Aba = (typeof ABAS)[number]["id"];

export default function Editor({
  local,
  categorias,
  tags,
}: {
  local: LocalCompleto;
  categorias: Categoria[];
  tags: Tag[];
}) {
  const [aba, setAba] = useState<Aba>("sobre");
  // As abas que a pessoa já abriu continuam montadas, só escondidas. Antes
  // cada aba era desmontada ao sair: quem escrevia a descrição, ia conferir
  // os horários e voltava encontrava o texto antigo, sem aviso nenhum.
  const [abertas, setAbertas] = useState<Aba[]>(["sobre"]);

  function abrir(qual: Aba) {
    setAba(qual);
    setAbertas((a) => (a.includes(qual) ? a : [...a, qual]));
  }

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1
            className="text-[22px] font-bold sm:text-[26px]"
            style={{
              color: "var(--color-v-texto)",
              fontFamily: "var(--fonte-titulo-nova)",
            }}
          >
            {local.nome}
          </h1>
          <p className="text-sm texto-suave">
            {local.categoria?.nome ?? "Sem categoria"}
          </p>
        </div>
        {local.status === "publicado" && (
          <Link
            href={`/local/${local.slug}`}
            className="botao-vazado px-4 py-2.5 text-[14px]"
          >
            Ver no site ↗
          </Link>
        )}
      </div>

      <BarraPublicacao local={local} />

      {/* Quebra em duas linhas no celular em vez de rolar de lado: com cinco
          abas, quem nao adivinha que da para arrastar nunca acha o "Cardapio".
          Mesma decisao das abas do painel. */}
      <nav
        className="mt-6 flex flex-wrap gap-x-1 gap-y-0.5 sm:flex-nowrap"
        style={{ borderBottom: "2px solid var(--color-v-texto)" }}
        aria-label="Partes do cadastro"
      >
        {ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => abrir(a.id)}
            aria-current={aba === a.id ? "true" : undefined}
            className="-mb-[2px] px-3 py-2.5 text-[14px] font-semibold whitespace-nowrap transition sm:px-4"
            style={{
              borderBottom: `3px solid ${aba === a.id ? "var(--color-v-torii)" : "transparent"}`,
              color:
                aba === a.id
                  ? "var(--color-v-texto)"
                  : "var(--color-v-texto-suave)",
            }}
          >
            {a.nome}
          </button>
        ))}
      </nav>

      <div className="mt-5">
        {abertas.includes("sobre") && (
          <div hidden={aba !== "sobre"} className="space-y-5">
            <Sobre local={local} categorias={categorias} />
            <Etiquetas local={local} tags={tags} />
          </div>
        )}
        {abertas.includes("endereco") && (
          <div hidden={aba !== "endereco"}>
            <Endereco local={local} />
          </div>
        )}
        {abertas.includes("horarios") && (
          <div hidden={aba !== "horarios"}>
            <EditorHorarios localId={local.id} horarios={local.horarios} />
          </div>
        )}
        {abertas.includes("fotos") && (
          <div hidden={aba !== "fotos"}>
            <EditorFotos
              localId={local.id}
              fotos={local.fotos}
              capa={local.capa_url}
            />
          </div>
        )}
        {abertas.includes("itens") && (
          <div hidden={aba !== "itens"}>
            <EditorItens localId={local.id} itens={local.itens} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Faixa de status + botão de mandar pra análise                       */
/* ------------------------------------------------------------------ */

function BarraPublicacao({ local }: { local: LocalCompleto }) {
  const [indo, setIndo] = useState(false);
  const router = useRouter();

  // O mínimo pra valer a pena publicar.
  const faltando: string[] = [];
  if (!local.resumo) faltando.push("uma frase de resumo");
  if (!local.endereco) faltando.push("o endereço");
  if (local.horarios.length === 0) faltando.push("os horários");
  if (!local.capa_url && local.fotos.length === 0) faltando.push("uma foto");

  async function enviar() {
    setIndo(true);
    await createClient()
      .from("locais")
      .update({ status: "em_analise", motivo_rejeicao: null })
      .eq("id", local.id);
    await pedirAviso(local.id);
    setIndo(false);
    router.refresh();
  }

  if (local.status === "publicado") {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-2 border-[color:var(--color-v-texto)]/25 bg-[color:var(--color-v-fundo)] px-4 py-3 text-sm text-mata-900">
        <span>
          ✅ <strong>No ar.</strong> Toda alteração que você salvar aparece no
          site em poucos minutos.
        </span>
        <TirarDoAr id={local.id} nome={local.nome} ativo />
      </div>
    );
  }

  // Fechou para reforma, mudou de dono, parou por um tempo: em vez de ligar
  // para a administração e esperar, ele mesmo tira do ar e devolve quando
  // reabrir. Nada se perde no caminho.
  if (local.status === "inativo") {
    return (
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 caixa-painel border-dashed px-4 py-3 text-sm">
        <span className="texto-suave">
          <strong>Fora do ar.</strong> Seu estabelecimento não aparece no guia
          agora. Tudo continua guardado: fotos, horários e números.
        </span>
        <TirarDoAr id={local.id} nome={local.nome} ativo={false} />
      </div>
    );
  }

  if (local.status === "em_analise") {
    return (
      <div className="mt-4 aviso-painel px-4 py-3 text-[14px]">
        ⏳ <strong>Em análise.</strong> Recebemos seu cadastro — logo publicamos
        no guia. Você pode continuar editando enquanto isso.
      </div>
    );
  }

  return (
    <div className="mt-4 caixa-painel p-4">
      {local.status === "rejeitado" && local.motivo_rejeicao && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-[color:var(--color-v-fechado-claro)]">
          <strong>Precisa de ajuste:</strong> {local.motivo_rejeicao}
        </p>
      )}

      {faltando.length > 0 ? (
        <>
          <p className="text-sm font-medium">
            Falta pouco para publicar. Ainda precisa de:
          </p>
          <ul className="mt-1.5 list-inside list-disc text-sm texto-suave">
            {faltando.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm font-medium">
          Tudo pronto! Mande para análise que a gente publica.
        </p>
      )}

      <button
        type="button"
        onClick={enviar}
        disabled={indo || faltando.length > 0}
        className="botao-cheio mt-3 px-6 py-3 text-[14px] transition disabled:opacity-40"
      >
        {indo ? "Enviando..." : "Enviar para análise"}
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Sobre: identidade e contatos                                        */
/* ------------------------------------------------------------------ */

function Sobre({
  local,
  categorias,
}: {
  local: LocalCompleto;
  categorias: Categoria[];
}) {
  const [dados, setDados] = useState({
    nome: local.nome,
    categoria_id: local.categoria_id ? String(local.categoria_id) : "",
    resumo: local.resumo ?? "",
    descricao: local.descricao ?? "",
    faixa_preco: local.faixa_preco ? String(local.faixa_preco) : "",
    telefone: local.telefone ?? "",
    whatsapp: local.whatsapp ?? "",
    email: local.email ?? "",
    site: local.site ?? "",
    instagram: local.instagram ?? "",
    video: local.video_url ?? "",
  });
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  const principais = categorias.filter((c) => c.pai_id === null);
  const mudar = (campo: keyof typeof dados) => (valor: string) => {
    setDados((a) => ({ ...a, [campo]: valor }));
    setSalvo(false);
  };

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (!dados.nome.trim()) {
      setErro("O nome não pode ficar vazio.");
      return;
    }

    setSalvando(true);

    // O "select" no fim devolve as linhas que mudaram. Com a sessão
    // vencida o banco não dá erro: só não muda nada. Sem conferir, a tela
    // dizia "Salvo" para um texto que nunca foi gravado.
    const { data, error } = await createClient()
      .from("locais")
      .update({
        nome: dados.nome.trim(),
        categoria_id: dados.categoria_id ? Number(dados.categoria_id) : null,
        resumo: dados.resumo.trim() || null,
        descricao: dados.descricao.trim() || null,
        faixa_preco: dados.faixa_preco ? Number(dados.faixa_preco) : null,
        telefone: dados.telefone.trim() || null,
        whatsapp: dados.whatsapp.trim() || null,
        email: dados.email.trim() || null,
        site: dados.site.trim() || null,
        instagram: dados.instagram.trim() || null,
        video_url: dados.video.trim() || null,
      })
      .eq("id", local.id)
      .select("id");

    if (error) {
      setErro(explicarErro(error, "Não consegui salvar. Tente de novo."));
    } else if (!data || data.length === 0) {
      setErro(SESSAO_TERMINOU);
    } else {
      setSalvo(true);
      // Pede ao painel que recalcule o que ainda falta. Sem isto o aviso
      // "Ainda precisa de: os horários" continuava na tela depois de salvar os
      // horários — o dado ia para o banco, mas a lista e montada no servidor e
      // ficava velha. O comerciante lia que nao salvou e tentava de novo.
      router.refresh();
    }

    setSalvando(false);
    router.refresh();
  }

  return (
    <form onSubmit={salvar} className="space-y-5">
      <Bloco
        titulo="Identidade"
        descricao="É o que aparece na busca e nos cards."
      >
        <Texto rotulo="Nome" valor={dados.nome} onChange={mudar("nome")} />

        <label className="block">
          <span className="text-sm font-medium">Categoria</span>
          <select
            value={dados.categoria_id}
            onChange={(e) => mudar("categoria_id")(e.target.value)}
            className="mt-1 w-full caixa-painel px-4 py-2.5 outline-none"
          >
            <option value="">Sem categoria</option>
            {principais.map((pai) => (
              <optgroup key={pai.id} label={`${pai.emoji ?? ""} ${pai.nome}`}>
                <option value={pai.id}>{pai.nome} (geral)</option>
                {categorias
                  .filter((c) => c.pai_id === pai.id)
                  .map((f) => (
                    <option key={f.id} value={f.id}>
                      {f.emoji} {f.nome}
                    </option>
                  ))}
              </optgroup>
            ))}
          </select>
        </label>

        <Texto
          rotulo="Resumo"
          dica="Uma frase curta. Ex: “Pizza na lenha e chope gelado, com pátio para a criançada”."
          valor={dados.resumo}
          onChange={mudar("resumo")}
        />

        <AreaTexto
          rotulo="Sobre o lugar"
          dica="Conte com suas palavras: o que vocês fazem, o clima do lugar, o que tem de especial."
          valor={dados.descricao}
          onChange={mudar("descricao")}
        />

        <label className="block">
          <span className="text-sm font-medium">Faixa de preço</span>
          <select
            value={dados.faixa_preco}
            onChange={(e) => mudar("faixa_preco")(e.target.value)}
            className="mt-1 w-full caixa-painel px-4 py-2.5"
          >
            <option value="">Não informar</option>
            <option value="1">$ — baratinho</option>
            <option value="2">$$ — médio</option>
            <option value="3">$$$ — mais caro</option>
            <option value="4">$$$$ — alto</option>
          </select>
        </label>
      </Bloco>

      <Bloco
        titulo="Vídeo"
        descricao="Um vídeo curto do lugar, tocando na sua página."
      >
        <Texto
          rotulo="Link do vídeo"
          placeholder="Cole o link de um Reel do Instagram ou de um vídeo do YouTube"
          valor={dados.video}
          onChange={mudar("video")}
        />
        {dados.video.trim() && !videoParaMostrar(dados.video) && (
          <p className="mt-2 text-[13px] text-[color:var(--color-v-fechado-claro)]">
            Não reconheci esse link. Precisa ser o endereço de um Reel do
            Instagram ou de um vídeo do YouTube — copie pelo botão
            &quot;Compartilhar&quot; do próprio vídeo.
          </p>
        )}
      </Bloco>

      <Bloco titulo="Contato" descricao="Como as pessoas falam com vocês.">
        <div className="grid gap-4 sm:grid-cols-2">
          <Texto
            rotulo="WhatsApp"
            placeholder="(51) 99999-9999"
            valor={dados.whatsapp}
            onChange={mudar("whatsapp")}
          />
          <Texto
            rotulo="Telefone"
            placeholder="(51) 3563-0000"
            valor={dados.telefone}
            onChange={mudar("telefone")}
          />
          <Texto
            rotulo="Instagram"
            placeholder="@seuperfil"
            valor={dados.instagram}
            onChange={mudar("instagram")}
          />
          <Texto
            rotulo="Site"
            placeholder="www.seusite.com.br"
            valor={dados.site}
            onChange={mudar("site")}
          />
          <Texto
            rotulo="E-mail"
            tipo="email"
            valor={dados.email}
            onChange={mudar("email")}
          />
        </div>

        {erro && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[color:var(--color-v-fechado-claro)]">
            {erro}
          </p>
        )}

        <BotaoSalvar salvando={salvando} salvo={salvo} />
      </Bloco>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Etiquetas                                                           */
/* ------------------------------------------------------------------ */

function Etiquetas({ local, tags }: { local: LocalCompleto; tags: Tag[] }) {
  const [marcadas, setMarcadas] = useState<number[]>(
    local.tags.map((t) => t.id),
  );
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setSalvando(true);

    const supabase = createClient();

    // Primeiro grava as marcadas, depois tira as desmarcadas. Na ordem
    // contrária (apagar tudo e inserir de novo), uma falha no meio deixava
    // o lugar sem etiqueta nenhuma — e a tela dizendo "Salvo".
    let falha: { code?: string; message?: string } | null = null;

    if (marcadas.length > 0) {
      const { error } = await supabase.from("locais_tags").upsert(
        marcadas.map((tag_id) => ({ local_id: local.id, tag_id })),
        { onConflict: "local_id,tag_id", ignoreDuplicates: true },
      );
      falha = error;
    }

    if (!falha) {
      let tirar = supabase
        .from("locais_tags")
        .delete()
        .eq("local_id", local.id);
      if (marcadas.length > 0) {
        tirar = tirar.not("tag_id", "in", `(${marcadas.join(",")})`);
      }
      const { error } = await tirar;
      falha = error;
    }

    setSalvando(false);

    if (falha) {
      setErro(
        explicarErro(falha, "Não consegui salvar as etiquetas. Tente de novo."),
      );
      return;
    }

    setSalvo(true);
    // Pede ao painel que recalcule o que ainda falta. Sem isto o aviso
    // "Ainda precisa de: os horários" continuava na tela depois de salvar os
    // horários — o dado ia para o banco, mas a lista e montada no servidor e
    // ficava velha. O comerciante lia que nao salvou e tentava de novo.
    router.refresh();
    router.refresh();
  }

  return (
    <form onSubmit={salvar}>
      <Bloco
        titulo="Etiquetas"
        descricao="Marque tudo que se aplica. É assim que o guia acha vocês quando alguém pede “um lugar ao ar livre para levar as crianças”."
      >
        <div className="flex flex-wrap gap-2">
          {tags.map((t) => {
            const ativa = marcadas.includes(t.id);
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => {
                  setMarcadas((a) =>
                    ativa ? a.filter((i) => i !== t.id) : [...a, t.id],
                  );
                  setSalvo(false);
                }}
                className={[
                  "rounded-full border px-3 py-1.5 text-sm transition",
                  ativa
                    ? "pilula-ativa"
                    : "pilula bg-[color:rgba(255, 255, 255, 0.7)] texto-suave ",
                ].join(" ")}
              >
                {t.emoji} {t.nome}
              </button>
            );
          })}
        </div>

        {erro && (
          <p
            role="alert"
            className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[color:var(--color-v-fechado-claro)]"
          >
            {erro}
          </p>
        )}

        <BotaoSalvar salvando={salvando} salvo={salvo}>
          Salvar etiquetas
        </BotaoSalvar>
      </Bloco>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Endereço e posição no mapa                                          */
/* ------------------------------------------------------------------ */

function Endereco({ local }: { local: LocalCompleto }) {
  const [dados, setDados] = useState({
    endereco: local.endereco ?? "",
    numero: local.numero ?? "",
    bairro: local.bairro ?? "",
    cep: local.cep ?? "",
    lat: local.lat,
    lng: local.lng,
  });
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  const mudar =
    (campo: "endereco" | "numero" | "bairro" | "cep") => (v: string) => {
      setDados((a) => ({ ...a, [campo]: v }));
      setSalvo(false);
    };

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setSalvando(true);

    // O "select" no fim devolve as linhas que mudaram. Com a sessão
    // vencida o banco não dá erro: só não muda nada. Sem conferir, a tela
    // dizia "Salvo" para um texto que nunca foi gravado.
    const { data, error } = await createClient()
      .from("locais")
      .update({
        endereco: dados.endereco.trim() || null,
        numero: dados.numero.trim() || null,
        bairro: dados.bairro.trim() || null,
        cep: dados.cep.trim() || null,
        lat: dados.lat,
        lng: dados.lng,
      })
      .eq("id", local.id)
      .select("id");

    if (error) {
      setErro(explicarErro(error, "Não consegui salvar. Tente de novo."));
    } else if (!data || data.length === 0) {
      setErro(SESSAO_TERMINOU);
    } else {
      setSalvo(true);
      // Pede ao painel que recalcule o que ainda falta. Sem isto o aviso
      // "Ainda precisa de: os horários" continuava na tela depois de salvar os
      // horários — o dado ia para o banco, mas a lista e montada no servidor e
      // ficava velha. O comerciante lia que nao salvou e tentava de novo.
      router.refresh();
    }

    setSalvando(false);
    router.refresh();
  }

  return (
    <form onSubmit={salvar}>
      <Bloco
        titulo="Onde fica"
        descricao="O endereço aparece na página e o pino no mapa da cidade."
      >
        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <Texto
            rotulo="Rua"
            placeholder="Rua Bento Gonçalves"
            valor={dados.endereco}
            onChange={mudar("endereco")}
          />
          <Texto
            rotulo="Número"
            valor={dados.numero}
            onChange={mudar("numero")}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Texto
            rotulo="Bairro"
            valor={dados.bairro}
            onChange={mudar("bairro")}
          />
          <Texto rotulo="CEP" valor={dados.cep} onChange={mudar("cep")} />
        </div>

        <EscolherPosicao
          lat={dados.lat}
          lng={dados.lng}
          onMudar={(lat, lng) => {
            setDados((a) => ({ ...a, lat, lng }));
            setSalvo(false);
          }}
        />

        {erro && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[color:var(--color-v-fechado-claro)]">
            {erro}
          </p>
        )}

        <BotaoSalvar salvando={salvando} salvo={salvo}>
          Salvar endereço
        </BotaoSalvar>
      </Bloco>
    </form>
  );
}
