"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { enderecoCurto } from "@/lib/roteiro";
import { SITE_LIMPO } from "@/lib/site";

type LocalDisponivel = { id: string; nome: string; bairro: string | null };

type Dados = {
  id: string;
  titulo: string;
  descricao: string | null;
  slug: string | null;
  locais: string[];
  publicado: boolean;
  ordem: number;
};

/**
 * Monta um roteiro pronto: titulo, descricao e as paradas na ordem.
 *
 * A ordem das paradas e o roteiro em si — e o que decide se a pessoa almoca
 * antes ou depois da trilha. Por isso as setas de subir e descer ficam a
 * vista, e nao escondidas atras de arrastar, que no celular quase nunca
 * funciona bem.
 */
export default function EditorRoteiro({
  roteiro,
  disponiveis,
}: {
  roteiro: Dados;
  disponiveis: LocalDisponivel[];
}) {
  const [titulo, setTitulo] = useState(roteiro.titulo);
  const [descricao, setDescricao] = useState(roteiro.descricao ?? "");
  const [slug, setSlug] = useState(roteiro.slug ?? "");
  const [paradas, setParadas] = useState<string[]>(roteiro.locais ?? []);
  const [publicado, setPublicado] = useState(roteiro.publicado);
  const [ordem, setOrdem] = useState(String(roteiro.ordem));

  const [salvando, setSalvando] = useState(false);
  const [recado, setRecado] = useState<string | null>(null);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  const porId = new Map(disponiveis.map((l) => [l.id, l]));
  const sobrando = disponiveis.filter((l) => !paradas.includes(l.id));

  // O endereço da página acompanha o título enquanto ninguém mexer nele à
  // mão. Depois de editado, fica quieto: mudar o endereço de uma página já
  // divulgada quebraria os links que as pessoas guardaram.
  const enderecoAutomatico = !roteiro.slug;
  const enderecoFinal = (
    enderecoAutomatico && !slug ? enderecoCurto(titulo, 60) : slug
  ).trim();

  function mover(de: number, para: number) {
    if (para < 0 || para >= paradas.length) return;
    const copia = [...paradas];
    const [item] = copia.splice(de, 1);
    copia.splice(para, 0, item);
    setParadas(copia);
  }

  async function salvar() {
    setSalvando(true);
    setErro(null);
    setRecado(null);

    if (!titulo.trim()) {
      setErro("O roteiro precisa de um título.");
      setSalvando(false);
      return;
    }
    if (publicado && paradas.length < 2) {
      setErro("Um roteiro publicado precisa de pelo menos duas paradas.");
      setSalvando(false);
      return;
    }
    if (!enderecoFinal) {
      setErro("Falta o endereço da página.");
      setSalvando(false);
      return;
    }

    const { error } = await createClient()
      .from("roteiros")
      .update({
        titulo: titulo.trim().slice(0, 80),
        descricao: descricao.trim() || null,
        slug: enderecoFinal,
        locais: paradas,
        publicado,
        ordem: Number(ordem) || 0,
      })
      .eq("id", roteiro.id);

    setSalvando(false);

    if (error) {
      console.error("Nao consegui salvar o roteiro:", error.message);
      setErro(
        error.code === "23505"
          ? "Já existe um roteiro com esse endereço. Escolha outro."
          : "Não consegui salvar agora. Tente de novo.",
      );
      return;
    }

    setRecado("Salvo.");
    setSlug(enderecoFinal);
    router.refresh();
  }

  async function excluir() {
    setSalvando(true);
    const { error } = await createClient()
      .from("roteiros")
      .delete()
      .eq("id", roteiro.id);

    if (error) {
      setErro("Não consegui excluir.");
      setSalvando(false);
      return;
    }
    router.push("/admin/roteiros");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <div className="space-y-4 caixa-painel p-4">
        <label className="block">
          <span className="text-sm font-medium">Título</span>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ivoti em um dia"
            className="campo-painel mt-1 w-full px-3.5 py-2.5 text-[15px]"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Descrição</span>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            placeholder="Uma ou duas frases dizendo para quem é o passeio e quanto tempo leva."
            className="campo-painel mt-1 w-full px-3.5 py-2.5 text-[15px]"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <label className="block">
            <span className="text-sm font-medium">Endereço da página</span>
            <input
              value={
                slug || (enderecoAutomatico ? enderecoCurto(titulo, 60) : "")
              }
              onChange={(e) => setSlug(e.target.value)}
              className="campo-painel mt-1 w-full px-3.5 py-2.5 font-mono text-[14px]"
            />
            <span className="mt-1 block text-xs texto-suave">
              {SITE_LIMPO}/roteiros/{enderecoFinal || "..."}
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Posição na lista</span>
            <input
              type="number"
              value={ordem}
              onChange={(e) => setOrdem(e.target.value)}
              className="campo-painel mt-1 w-full px-3.5 py-2.5 text-[15px]"
            />
            <span className="mt-1 block text-xs texto-suave">
              menor aparece antes
            </span>
          </label>
        </div>
      </div>

      {/* ---- as paradas ---- */}
      <div className="caixa-painel p-4">
        <p className="font-semibold">Paradas ({paradas.length})</p>
        <p className="text-sm texto-suave">
          Na ordem em que a pessoa vai visitar. É essa ordem que vira a rota no
          mapa.
        </p>

        {paradas.length === 0 ? (
          <p className="mt-3 border-2 border-dashed border-[color:var(--color-madeira)]/40 px-3 py-6 text-center text-sm texto-suave">
            Nenhuma parada ainda. Escolha a primeira ali embaixo.
          </p>
        ) : (
          <ol className="mt-3 divide-y divide-[color:var(--color-madeira)]/20">
            {paradas.map((id, i) => {
              const l = porId.get(id);
              return (
                <li key={id} className="flex items-center gap-3 py-2">
                  <span className="grid h-7 w-7 shrink-0 place-items-center botao-cheio text-[13px]">
                    {i + 1}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">
                      {/* Local desativado depois de entrar no roteiro: some da
                          página pública, mas aqui precisa aparecer, senão você
                          não teria como tirar. */}
                      {l?.nome ?? "(local fora do ar)"}
                    </span>
                    {l?.bairro && (
                      <span className="text-sm texto-suave">{l.bairro}</span>
                    )}
                  </span>

                  <span className="flex shrink-0 gap-1">
                    <Setinha
                      rotulo="Subir"
                      sinal="↑"
                      desativada={i === 0}
                      onClick={() => mover(i, i - 1)}
                    />
                    <Setinha
                      rotulo="Descer"
                      sinal="↓"
                      desativada={i === paradas.length - 1}
                      onClick={() => mover(i, i + 1)}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setParadas(paradas.filter((p) => p !== id))
                      }
                      aria-label="Tirar do roteiro"
                      className="rounded-lg px-2 py-1 text-sm texto-suave transition hover:bg-red-50 hover:text-[color:var(--color-telha-funda)]"
                    >
                      ✕
                    </button>
                  </span>
                </li>
              );
            })}
          </ol>
        )}

        <label className="mt-4 block">
          <span className="text-sm font-medium">Adicionar parada</span>
          <select
            value=""
            onChange={(e) => {
              if (e.target.value) setParadas([...paradas, e.target.value]);
            }}
            className="mt-1 w-full caixa-painel px-4 py-2.5 outline-none"
          >
            <option value="">Escolha um lugar...</option>
            {sobrando.map((l) => (
              <option key={l.id} value={l.id}>
                {l.nome}
                {l.bairro ? ` — ${l.bairro}` : ""}
              </option>
            ))}
          </select>
        </label>
      </div>

      {/* ---- publicar e salvar ---- */}
      <div className="caixa-painel p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={publicado}
            onChange={(e) => setPublicado(e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            <span className="block text-sm font-medium">Publicar no guia</span>
            <span className="block text-sm texto-suave">
              Aparece no Explorar e na página de roteiros. Desmarcado, fica só
              para você.
            </span>
          </span>
        </label>

        {erro && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-[color:var(--color-telha-funda)]">
            {erro}
          </p>
        )}
        {recado && (
          <p className="mt-3 px-3 py-2 text-[14px] text-[color:var(--color-veneziana)]">
            {recado}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="botao-cheio px-6 py-3 text-[14px] transition disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar"}
          </button>

          <BotaoExcluir onConfirmar={excluir} desativado={salvando} />
        </div>
      </div>
    </div>
  );
}

function Setinha({
  rotulo,
  sinal,
  desativada,
  onClick,
}: {
  rotulo: string;
  sinal: string;
  desativada: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={desativada}
      aria-label={rotulo}
      className="botao-vazado px-2.5 py-1.5 text-[14px] transition disabled:opacity-25"
    >
      {sinal}
    </button>
  );
}

/** Excluir some com o roteiro e com o endereço dele, então pergunta antes. */
function BotaoExcluir({
  onConfirmar,
  desativado,
}: {
  onConfirmar: () => void;
  desativado: boolean;
}) {
  const [perguntando, setPerguntando] = useState(false);

  if (!perguntando) {
    return (
      <button
        type="button"
        onClick={() => setPerguntando(true)}
        className="ml-auto text-sm texto-suave underline transition hover:text-[color:var(--color-telha-funda)]"
      >
        excluir roteiro
      </button>
    );
  }

  return (
    <span className="ml-auto flex items-center gap-2">
      <span className="text-sm texto-suave">Excluir de vez?</span>
      <button
        type="button"
        onClick={onConfirmar}
        disabled={desativado}
        className="rounded-lg bg-red-600 px-3 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
      >
        Excluir
      </button>
      <button
        type="button"
        onClick={() => setPerguntando(false)}
        className="botao-vazado px-3.5 py-2 text-[14px]"
      >
        Não
      </button>
    </span>
  );
}
