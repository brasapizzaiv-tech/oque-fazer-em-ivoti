"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AreaTexto, Bloco, BotaoSalvar, Texto } from "@/components/painel/Campos";
import EditorFotos from "@/components/painel/EditorFotos";
import EditorHorarios from "@/components/painel/EditorHorarios";
import EditorItens from "@/components/painel/EditorItens";
import EscolherPosicao from "@/components/painel/EscolherPosicao";
import type { Categoria, LocalCompleto, Tag } from "@/lib/tipos";

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

  return (
    <div className="mt-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">{local.nome}</h1>
          <p className="text-sm text-tinta/55">
            {local.categoria?.nome ?? "Sem categoria"}
          </p>
        </div>
        {local.status === "publicado" && (
          <Link
            href={`/local/${local.slug}`}
            className="rounded-full border border-mata-200 px-4 py-2 text-sm font-medium hover:bg-mata-50"
          >
            Ver no site ↗
          </Link>
        )}
      </div>

      <BarraPublicacao local={local} />

      <nav className="sem-barra mt-6 flex gap-1 overflow-x-auto border-b border-mata-100">
        {ABAS.map((a) => (
          <button
            key={a.id}
            type="button"
            onClick={() => setAba(a.id)}
            className={[
              "shrink-0 border-b-2 px-4 py-2.5 text-sm font-medium transition",
              aba === a.id
                ? "border-mata-600 text-mata-700"
                : "border-transparent text-tinta/55 hover:text-tinta",
            ].join(" ")}
          >
            {a.nome}
          </button>
        ))}
      </nav>

      <div className="mt-5 space-y-5">
        {aba === "sobre" && (
          <>
            <Sobre local={local} categorias={categorias} />
            <Etiquetas local={local} tags={tags} />
          </>
        )}
        {aba === "endereco" && <Endereco local={local} />}
        {aba === "horarios" && (
          <EditorHorarios localId={local.id} horarios={local.horarios} />
        )}
        {aba === "fotos" && (
          <EditorFotos
            localId={local.id}
            fotos={local.fotos}
            capa={local.capa_url}
          />
        )}
        {aba === "itens" && (
          <EditorItens localId={local.id} itens={local.itens} />
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
    setIndo(false);
    router.refresh();
  }

  if (local.status === "publicado") {
    return (
      <div className="mt-4 rounded-xl bg-mata-50 px-4 py-3 text-sm text-mata-900">
        ✅ <strong>No ar.</strong> Toda alteração que você salvar aparece no
        site em poucos minutos.
      </div>
    );
  }

  if (local.status === "em_analise") {
    return (
      <div className="mt-4 rounded-xl bg-sol-50 px-4 py-3 text-sm text-sol-900">
        ⏳ <strong>Em análise.</strong> Recebemos seu cadastro — logo publicamos
        no guia. Você pode continuar editando enquanto isso.
      </div>
    );
  }

  return (
    <div className="mt-4 rounded-xl border border-mata-200 bg-white p-4">
      {local.status === "rejeitado" && local.motivo_rejeicao && (
        <p className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-800">
          <strong>Precisa de ajuste:</strong> {local.motivo_rejeicao}
        </p>
      )}

      {faltando.length > 0 ? (
        <>
          <p className="text-sm font-medium">
            Falta pouco pra publicar. Ainda precisa de:
          </p>
          <ul className="mt-1.5 list-inside list-disc text-sm text-tinta/65">
            {faltando.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </>
      ) : (
        <p className="text-sm font-medium">
          Tudo pronto! Mande pra análise que a gente publica.
        </p>
      )}

      <button
        type="button"
        onClick={enviar}
        disabled={indo || faltando.length > 0}
        className="mt-3 rounded-full bg-mata-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-mata-700 disabled:opacity-40"
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
    setSalvando(true);

    const { error } = await createClient()
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
      })
      .eq("id", local.id);

    if (error) setErro(error.message);
    else setSalvo(true);

    setSalvando(false);
    router.refresh();
  }

  return (
    <form onSubmit={salvar} className="space-y-5">
      <Bloco titulo="Identidade" descricao="É o que aparece na busca e nos cards.">
        <Texto rotulo="Nome" valor={dados.nome} onChange={mudar("nome")} />

        <label className="block">
          <span className="text-sm font-medium">Categoria</span>
          <select
            value={dados.categoria_id}
            onChange={(e) => mudar("categoria_id")(e.target.value)}
            className="mt-1 w-full rounded-xl border border-mata-200 bg-white px-4 py-2.5 outline-none focus:border-mata-500 focus:ring-2 focus:ring-mata-100"
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
          dica="Uma frase curta. Ex: “Pizza na lenha e chope gelado, com pátio pra criançada”."
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
            className="mt-1 w-full rounded-xl border border-mata-200 bg-white px-4 py-2.5"
          >
            <option value="">Não informar</option>
            <option value="1">$ — baratinho</option>
            <option value="2">$$ — médio</option>
            <option value="3">$$$ — mais caro</option>
            <option value="4">$$$$ — alto</option>
          </select>
        </label>
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
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
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
  const router = useRouter();

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setSalvando(true);

    const supabase = createClient();
    await supabase.from("locais_tags").delete().eq("local_id", local.id);
    if (marcadas.length > 0) {
      await supabase
        .from("locais_tags")
        .insert(marcadas.map((tag_id) => ({ local_id: local.id, tag_id })));
    }

    setSalvando(false);
    setSalvo(true);
    router.refresh();
  }

  return (
    <form onSubmit={salvar}>
      <Bloco
        titulo="Etiquetas"
        descricao="Marque tudo que se aplica. É assim que o guia acha vocês quando alguém pede “um lugar ao ar livre pra levar as crianças”."
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
                    ? "border-mata-600 bg-mata-600 text-white"
                    : "border-mata-200 bg-white text-tinta/70 hover:bg-mata-50",
                ].join(" ")}
              >
                {t.emoji} {t.nome}
              </button>
            );
          })}
        </div>

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

  const mudar = (campo: "endereco" | "numero" | "bairro" | "cep") => (v: string) => {
    setDados((a) => ({ ...a, [campo]: v }));
    setSalvo(false);
  };

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setSalvando(true);

    const { error } = await createClient()
      .from("locais")
      .update({
        endereco: dados.endereco.trim() || null,
        numero: dados.numero.trim() || null,
        bairro: dados.bairro.trim() || null,
        cep: dados.cep.trim() || null,
        lat: dados.lat,
        lng: dados.lng,
      })
      .eq("id", local.id);

    if (error) setErro(error.message);
    else setSalvo(true);

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
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
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
