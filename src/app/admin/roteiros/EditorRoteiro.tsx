"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { enderecoCurto } from "@/lib/roteiro";

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
      <div className="space-y-4 rounded-2xl border border-mata-100 bg-white p-4">
        <label className="block">
          <span className="text-sm font-medium">Título</span>
          <input
            value={titulo}
            onChange={(e) => setTitulo(e.target.value)}
            placeholder="Ivoti em um dia"
            className="mt-1 w-full rounded-xl border border-mata-200 px-4 py-2.5 outline-none focus:border-mata-500 focus:ring-2 focus:ring-mata-100"
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium">Descrição</span>
          <textarea
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
            rows={3}
            placeholder="Uma ou duas frases dizendo para quem é o passeio e quanto tempo leva."
            className="mt-1 w-full rounded-xl border border-mata-200 px-4 py-2.5 outline-none focus:border-mata-500 focus:ring-2 focus:ring-mata-100"
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-[2fr_1fr]">
          <label className="block">
            <span className="text-sm font-medium">Endereço da página</span>
            <input
              value={slug || (enderecoAutomatico ? enderecoCurto(titulo, 60) : "")}
              onChange={(e) => setSlug(e.target.value)}
              className="mt-1 w-full rounded-xl border border-mata-200 px-4 py-2.5 font-mono text-sm outline-none focus:border-mata-500 focus:ring-2 focus:ring-mata-100"
            />
            <span className="mt-1 block text-xs text-tinta/45">
              oguiaivoti.com.br/roteiros/{enderecoFinal || "..."}
            </span>
          </label>

          <label className="block">
            <span className="text-sm font-medium">Posição na lista</span>
            <input
              type="number"
              value={ordem}
              onChange={(e) => setOrdem(e.target.value)}
              className="mt-1 w-full rounded-xl border border-mata-200 px-4 py-2.5 outline-none focus:border-mata-500 focus:ring-2 focus:ring-mata-100"
            />
            <span className="mt-1 block text-xs text-tinta/45">
              menor aparece antes
            </span>
          </label>
        </div>
      </div>

      {/* ---- as paradas ---- */}
      <div className="rounded-2xl border border-mata-100 bg-white p-4">
        <p className="font-semibold">Paradas ({paradas.length})</p>
        <p className="text-sm text-tinta/55">
          Na ordem em que a pessoa vai visitar. É essa ordem que vira a rota no
          mapa.
        </p>

        {paradas.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-mata-200 px-3 py-6 text-center text-sm text-tinta/50">
            Nenhuma parada ainda. Escolha a primeira ali embaixo.
          </p>
        ) : (
          <ol className="mt-3 divide-y divide-mata-50">
            {paradas.map((id, i) => {
              const l = porId.get(id);
              return (
                <li key={id} className="flex items-center gap-3 py-2">
                  <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-mata-600 text-sm font-semibold text-white">
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
                      <span className="text-sm text-tinta/50">{l.bairro}</span>
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
                      className="rounded-lg px-2 py-1 text-sm text-tinta/40 transition hover:bg-red-50 hover:text-red-700"
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
            className="mt-1 w-full rounded-xl border border-mata-200 bg-white px-4 py-2.5 outline-none focus:border-mata-500 focus:ring-2 focus:ring-mata-100"
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
      <div className="rounded-2xl border border-mata-100 bg-white p-4">
        <label className="flex items-start gap-3">
          <input
            type="checkbox"
            checked={publicado}
            onChange={(e) => setPublicado(e.target.checked)}
            className="mt-1 h-4 w-4"
          />
          <span>
            <span className="block text-sm font-medium">
              Publicar no guia
            </span>
            <span className="block text-sm text-tinta/55">
              Aparece no Explorar e na página de roteiros. Desmarcado, fica só
              para você.
            </span>
          </span>
        </label>

        {erro && (
          <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
            {erro}
          </p>
        )}
        {recado && (
          <p className="mt-3 rounded-lg bg-mata-50 px-3 py-2 text-sm text-mata-800">
            {recado}
          </p>
        )}

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="rounded-full bg-mata-600 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-mata-700 disabled:opacity-50"
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
      className="rounded-lg border border-mata-200 px-2 py-1 text-sm transition hover:bg-mata-50 disabled:opacity-25"
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
        className="ml-auto text-sm text-tinta/45 underline transition hover:text-red-700"
      >
        excluir roteiro
      </button>
    );
  }

  return (
    <span className="ml-auto flex items-center gap-2">
      <span className="text-sm text-tinta/60">Excluir de vez?</span>
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
        className="rounded-lg border border-mata-200 px-3 py-1.5 text-sm"
      >
        Não
      </button>
    </span>
  );
}
