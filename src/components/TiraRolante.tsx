"use client";

import { useCallback, useEffect, useRef, useState } from "react";

/**
 * Uma fileira de filtros que nao esconde nada.
 *
 * A versao antiga era um `overflow-x-auto` com a barra de rolagem escondida.
 * No Explorar isso deixava 78% das categorias e 88% das etiquetas fora da
 * tela — de 21 etiquetas, 18 simplesmente nao existiam para quem visitava.
 * Rolar por toque ate funcionava; o problema e que nada na tela dizia que
 * havia mais, e no computador a roda do mouse so rola na vertical.
 *
 * Tres coisas resolvem, juntas:
 *
 *   1. um esmaecido na borda, que aparece so do lado onde ha mais conteudo —
 *      e a pista visual de que a fileira continua;
 *   2. setas, para quem esta no mouse e nao tem como arrastar;
 *   3. um botao que abre a fileira em varias linhas, deixando tudo a vista de
 *      uma vez. E a saida para quem nao percebeu as outras duas.
 *
 * Aberta, a fileira nao rola: some o motivo de existir esconderijo.
 */
export default function TiraRolante({
  children,
  /** Palavra que aparece no botao: "categorias", "etiquetas". */
  nome,
  className = "",
}: {
  children: React.ReactNode;
  nome?: string;
  className?: string;
}) {
  const trilho = useRef<HTMLDivElement>(null);
  const [aberta, setAberta] = useState(false);
  const [temEsquerda, setTemEsquerda] = useState(false);
  const [temDireita, setTemDireita] = useState(false);

  const medir = useCallback(() => {
    const el = trilho.current;
    if (!el || aberta) {
      setTemEsquerda(false);
      setTemDireita(false);
      return;
    }
    // A folga de 2px evita a seta piscando por arredondamento no fim do trilho.
    setTemEsquerda(el.scrollLeft > 2);
    setTemDireita(el.scrollLeft + el.clientWidth < el.scrollWidth - 2);
  }, [aberta]);

  useEffect(() => {
    medir();
    const el = trilho.current;
    if (!el) return;

    // Precisa das duas: a rolagem muda de que lado ha conteudo, e o
    // redimensionamento muda se ha conteudo escondido.
    const observador = new ResizeObserver(medir);
    observador.observe(el);
    el.addEventListener("scroll", medir, { passive: true });

    return () => {
      observador.disconnect();
      el.removeEventListener("scroll", medir);
    };
  }, [medir, children]);

  function deslizar(lado: -1 | 1) {
    const el = trilho.current;
    if (!el) return;
    // Quatro quintos da largura: sobra um pedaco do que estava a vista, para
    // a pessoa nao perder a referencia de onde estava.
    el.scrollBy({ left: lado * el.clientWidth * 0.8, behavior: "smooth" });
  }

  const podeAbrir = aberta || temDireita || temEsquerda;

  return (
    <div className={`relative ${className}`}>
      <div
        ref={trilho}
        className={
          aberta
            ? "flex flex-wrap gap-2"
            : "sem-barra flex gap-2 overflow-x-auto pb-1"
        }
      >
        {children}
      </div>

      {/* Esmaecidos: so aparecem do lado onde ainda ha conteudo. Ficam fora
          do caminho do toque para nao roubarem o arrasto da fileira. */}
      {temEsquerda && (
        <div className="pointer-events-none absolute inset-y-0 left-0 w-10 bg-linear-to-r from-creme to-transparent" />
      )}
      {temDireita && (
        <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-linear-to-l from-creme to-transparent" />
      )}

      {temEsquerda && <Seta lado="esquerda" onClick={() => deslizar(-1)} />}
      {temDireita && <Seta lado="direita" onClick={() => deslizar(1)} />}

      {podeAbrir && (
        <button
          type="button"
          onClick={() => setAberta((v) => !v)}
          aria-expanded={aberta}
          className="-mx-1 mt-1 inline-block px-1 py-2 text-sm font-medium text-mata-700 underline decoration-mata-300 underline-offset-2"
        >
          {aberta
            ? "Mostrar menos"
            : `Ver ${nome ? `todas as ${nome}` : "tudo"}`}
        </button>
      )}
    </div>
  );
}

function Seta({
  lado,
  onClick,
}: {
  lado: "esquerda" | "direita";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={lado === "esquerda" ? "Ver anteriores" : "Ver mais"}
      className={[
        // 36px de alvo: menor que isto o dedo erra, e a fileira tem 30px.
        "absolute top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full border border-mata-200 bg-white text-tinta shadow-sm transition hover:bg-mata-50",
        lado === "esquerda" ? "left-0" : "right-0",
      ].join(" ")}
    >
      {lado === "esquerda" ? "‹" : "›"}
    </button>
  );
}
