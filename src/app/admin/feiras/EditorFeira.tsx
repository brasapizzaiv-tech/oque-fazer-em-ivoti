"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  Aviso,
  CAMPO,
  ESTILO_CAMPO,
  Caixa,
  Rotulo,
} from "@/components/painel/pecas";
import type { Tema } from "@/lib/temas";

const TAMANHO_MAXIMO = 4 * 1024 * 1024;

/**
 * O editor de uma feira.
 *
 * As imagens vão para o mesmo balde das fotos dos estabelecimentos, numa
 * pasta "temas". Um balde só é menos coisa para configurar, e a regra de
 * leitura pública já vale para os dois casos.
 *
 * O botão de publicar fica separado do de salvar de propósito: salvar um
 * rascunho no meio do cadastro não pode acender a feira no site, e é
 * exatamente isso que aconteceria se fossem o mesmo botão.
 */
export default function EditorFeira({ tema }: { tema: Tema }) {
  const router = useRouter();
  const supabase = createClient();

  const [f, setF] = useState({
    nome: tema.nome,
    subtitulo: tema.subtitulo ?? "",
    inicio: tema.inicio ?? "",
    fim: tema.fim ?? "",
    cor: tema.cor,
    cor_destaque: tema.cor_destaque ?? "",
    onde: tema.onde ?? "",
    link_programacao: tema.link_programacao ?? "",
    programacao: tema.programacao ?? "",
    expositores: tema.expositores ?? "",
  });
  const [logo, setLogo] = useState(tema.logo_url);
  const [capa, setCapa] = useState(tema.capa_url);
  const [publicado, setPublicado] = useState(tema.publicado);
  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function muda(campo: keyof typeof f) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setF({ ...f, [campo]: e.target.value });
      setSalvo(false);
    };
  }

  async function subir(
    arquivo: File,
    qual: "logo" | "capa",
  ): Promise<string | null> {
    if (arquivo.size > TAMANHO_MAXIMO) {
      setErro(`A imagem passa de 4 MB. Diminua e tente de novo.`);
      return null;
    }
    const extensao = arquivo.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const caminho = `temas/${tema.slug}-${qual}-${crypto.randomUUID()}.${extensao}`;

    const { error } = await supabase.storage
      .from("locais")
      .upload(caminho, arquivo, { cacheControl: "3600", upsert: false });

    if (error) {
      setErro(error.message);
      return null;
    }
    return supabase.storage.from("locais").getPublicUrl(caminho).data.publicUrl;
  }

  async function escolher(
    e: React.ChangeEvent<HTMLInputElement>,
    qual: "logo" | "capa",
  ) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;
    setErro(null);
    setSalvando(true);
    const url = await subir(arquivo, qual);
    setSalvando(false);
    if (!url) return;
    if (qual === "logo") setLogo(url);
    else setCapa(url);
    setSalvo(false);
  }

  async function salvar(tambemPublicar?: boolean) {
    setErro(null);
    setSalvando(true);

    const { error } = await supabase
      .from("temas")
      .update({
        nome: f.nome.trim(),
        subtitulo: f.subtitulo.trim() || null,
        inicio: f.inicio || null,
        fim: f.fim || null,
        cor: f.cor.trim(),
        cor_destaque: f.cor_destaque.trim() || null,
        onde: f.onde.trim() || null,
        link_programacao: f.link_programacao.trim() || null,
        programacao: f.programacao.trim() || null,
        expositores: f.expositores.trim() || null,
        logo_url: logo,
        capa_url: capa,
        ...(tambemPublicar === undefined ? {} : { publicado: tambemPublicar }),
      })
      .eq("id", tema.id);

    setSalvando(false);
    if (error) {
      setErro(error.message);
      return;
    }
    if (tambemPublicar !== undefined) setPublicado(tambemPublicar);
    setSalvo(true);
    router.refresh();
  }

  const semPeriodo = !f.inicio || !f.fim;

  return (
    <div className="space-y-5">
      {/* ---------------- identidade ---------------- */}
      <Caixa className="space-y-4">
        <label className="block">
          <Rotulo>Nome da feira</Rotulo>
          <input
            value={f.nome}
            onChange={muda("nome")}
            className={CAMPO}
            style={ESTILO_CAMPO}
          />
        </label>

        <label className="block">
          <Rotulo dica="O que vem antes do nome no selo: “19ª edição”, “31º”.">
            Edição
          </Rotulo>
          <input
            value={f.subtitulo}
            onChange={muda("subtitulo")}
            className={CAMPO}
            style={ESTILO_CAMPO}
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <Rotulo>Cor principal</Rotulo>
            <div className="mt-1 flex gap-2">
              <input
                type="color"
                value={f.cor}
                onChange={muda("cor")}
                className="h-11 w-14 shrink-0 cursor-pointer rounded-[9px]"
                aria-label="Escolher a cor principal"
              />
              <input
                value={f.cor}
                onChange={muda("cor")}
                className={CAMPO.replace("mt-1 ", "")}
                style={ESTILO_CAMPO}
              />
            </div>
          </label>

          <label className="block">
            <Rotulo>Cor de destaque</Rotulo>
            <div className="mt-1 flex gap-2">
              <input
                type="color"
                value={f.cor_destaque || "#FFFFFF"}
                onChange={muda("cor_destaque")}
                className="h-11 w-14 shrink-0 cursor-pointer rounded-[9px]"
                aria-label="Escolher a cor de destaque"
              />
              <input
                value={f.cor_destaque}
                onChange={muda("cor_destaque")}
                className={CAMPO.replace("mt-1 ", "")}
                style={ESTILO_CAMPO}
              />
            </div>
          </label>
        </div>
      </Caixa>

      {/* ---------------- quando ---------------- */}
      <Caixa className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block">
            <Rotulo>Começa em</Rotulo>
            <input
              type="date"
              value={f.inicio}
              onChange={muda("inicio")}
              className={CAMPO}
              style={ESTILO_CAMPO}
            />
          </label>
          <label className="block">
            <Rotulo>Termina em</Rotulo>
            <input
              type="date"
              value={f.fim}
              onChange={muda("fim")}
              className={CAMPO}
              style={ESTILO_CAMPO}
            />
          </label>
        </div>

        {semPeriodo && (
          <Aviso tom="erro">
            Sem as duas datas a feira nunca aparece no site, mesmo publicada.
          </Aviso>
        )}

        <label className="block">
          <Rotulo dica="Aparece no bloco e vira o botão “Como chegar”.">
            Onde acontece
          </Rotulo>
          <input
            value={f.onde}
            onChange={muda("onde")}
            placeholder="Parque Municipal, Centro"
            className={CAMPO}
            style={ESTILO_CAMPO}
          />
        </label>

        <label className="block">
          <Rotulo dica="Endereço do site ou da página da prefeitura, se houver.">
            Link da programação
          </Rotulo>
          <input
            value={f.link_programacao}
            onChange={muda("link_programacao")}
            placeholder="https://"
            className={CAMPO}
            style={ESTILO_CAMPO}
          />
        </label>
      </Caixa>

      {/* ---------------- conteúdo ---------------- */}
      <Caixa className="space-y-4">
        <label className="block">
          <Rotulo dica="Um item por linha. Cada linha vira uma linha da lista.">
            Programação
          </Rotulo>
          <textarea
            rows={5}
            value={f.programacao}
            onChange={muda("programacao")}
            placeholder={
              "Sexta, 19h — Abertura com a banda\nSábado, 10h — Feira aberta"
            }
            className={CAMPO}
            style={ESTILO_CAMPO}
          />
        </label>

        <label className="block">
          <Rotulo dica="Um nome por linha.">Expositores</Rotulo>
          <textarea
            rows={4}
            value={f.expositores}
            onChange={muda("expositores")}
            className={CAMPO}
            style={ESTILO_CAMPO}
          />
        </label>
      </Caixa>

      {/* ---------------- imagens ---------------- */}
      <Caixa className="space-y-5">
        <Imagem
          rotulo="Logo oficial"
          dica="Aparece no selo e no bloco, dentro de um círculo branco. Fundo transparente fica melhor."
          url={logo}
          quadrado
          aoEscolher={(e) => escolher(e, "logo")}
          aoTirar={() => {
            setLogo(null);
            setSalvo(false);
          }}
        />
        <Imagem
          rotulo="Foto de capa"
          dica="Substitui a foto da capa da Início durante a feira."
          url={capa}
          aoEscolher={(e) => escolher(e, "capa")}
          aoTirar={() => {
            setCapa(null);
            setSalvo(false);
          }}
        />
      </Caixa>

      {erro && <Aviso>{erro}</Aviso>}

      {/* ---------------- salvar e publicar ---------------- */}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => salvar()}
          disabled={salvando}
          className="botao-cheio px-6 py-3 text-[14px] disabled:opacity-50"
        >
          {salvando ? "Salvando..." : "Salvar"}
        </button>

        <button
          type="button"
          onClick={() => salvar(!publicado)}
          disabled={salvando || (!publicado && semPeriodo)}
          className="botao-vazado px-5 py-2.5 text-[14px] disabled:opacity-40"
        >
          {publicado ? "Tirar do ar" : "Publicar"}
        </button>

        {publicado && (
          <span
            className="inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold tracking-[0.08em] uppercase"
            style={{
              backgroundColor: "var(--color-v-verde)",
              color: "#FFFFFF",
            }}
          >
            No ar
          </span>
        )}

        {salvo && !salvando && (
          <span className="text-[14px] font-medium text-[color:var(--color-v-verde)]">
            Salvo ✓
          </span>
        )}
      </div>
    </div>
  );
}

/** Um campo de imagem: a prévia, o botão de trocar e o de tirar. */
function Imagem({
  rotulo,
  dica,
  url,
  quadrado = false,
  aoEscolher,
  aoTirar,
}: {
  rotulo: string;
  dica: string;
  url: string | null;
  quadrado?: boolean;
  aoEscolher: (e: React.ChangeEvent<HTMLInputElement>) => void;
  aoTirar: () => void;
}) {
  return (
    <div>
      <Rotulo dica={dica}>{rotulo}</Rotulo>

      <div className="mt-2 flex flex-wrap items-center gap-3">
        {url ? (
          <span
            className={`relative block shrink-0 overflow-hidden rounded-[9px] ${
              quadrado ? "h-20 w-20" : "h-20 w-36"
            }`}
            style={{ border: "2px solid var(--color-v-texto)" }}
          >
            <Image
              src={url}
              alt=""
              fill
              sizes="144px"
              className={quadrado ? "object-contain p-1" : "object-cover"}
            />
          </span>
        ) : (
          <span
            className={`grid shrink-0 place-items-center rounded-[9px] text-[12px] ${
              quadrado ? "h-20 w-20" : "h-20 w-36"
            }`}
            style={{
              border: "2px dashed var(--color-v-texto)",
              color: "var(--color-v-texto-suave)",
            }}
          >
            sem imagem
          </span>
        )}

        <label className="botao-vazado cursor-pointer px-4 py-2.5 text-[14px]">
          {url ? "Trocar" : "Escolher"}
          <input
            type="file"
            accept="image/*"
            onChange={aoEscolher}
            className="hidden"
          />
        </label>

        {url && (
          <button
            type="button"
            onClick={aoTirar}
            className="text-[13px] font-semibold text-[color:var(--color-v-fechado-claro)] underline"
          >
            Tirar
          </button>
        )}
      </div>
    </div>
  );
}
