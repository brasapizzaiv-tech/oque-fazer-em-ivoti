"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Foto } from "@/lib/tipos";

export default function Galeria({
  capa,
  fotos,
  nome,
  emoji,
}: {
  capa: string | null;
  fotos: Foto[];
  nome: string;
  emoji: string;
}) {
  // A capa entra como primeira imagem, sem repetir se já estiver na galeria.
  const imagens = [
    ...(capa ? [capa] : []),
    ...fotos.map((f) => f.url).filter((u) => u !== capa),
  ];
  const [atual, setAtual] = useState(0);
  const [cheia, setCheia] = useState(false);

  const total = imagens.length;
  const anterior = useCallback(
    () => setAtual((i) => (i - 1 + total) % total),
    [total],
  );
  const proxima = useCallback(() => setAtual((i) => (i + 1) % total), [total]);

  // Com a tela cheia aberta, o teclado manda: seta troca de foto e Esc fecha.
  // Quem abriu uma foto grande nao quer voltar o mouse ate um X pequeno.
  useEffect(() => {
    if (!cheia) return;

    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") setCheia(false);
      if (e.key === "ArrowLeft") anterior();
      if (e.key === "ArrowRight") proxima();
    }

    // Trava a rolagem do fundo: sem isto a pagina desliza atras da foto.
    const guardado = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", tecla);

    return () => {
      document.body.style.overflow = guardado;
      window.removeEventListener("keydown", tecla);
    };
  }, [cheia, anterior, proxima]);

  if (total === 0) {
    return (
      <div className="mt-4 grid aspect-[16/7] place-items-center rounded-2xl bg-mata-50 text-6xl">
        {emoji}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-mata-50 sm:aspect-[16/7]">
        {/* A mesma foto, ampliada e desfocada, preenchendo o fundo.
            A foto de cima aparece inteira, sem corte — e como quase nenhuma
            tem o formato exato da moldura, sobrariam tarjas vazias dos lados.
            Assim a moldura fica preenchida pelas cores da propria foto. */}
        <Image
          src={imagens[atual]}
          alt=""
          fill
          aria-hidden
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="scale-110 object-cover blur-xl"
        />

        <button
          type="button"
          onClick={() => setCheia(true)}
          aria-label={`Ver ${nome} em tela cheia`}
          className="group absolute inset-0 cursor-zoom-in"
        >
          <Image
            src={imagens[atual]}
            alt={nome}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-contain"
          />
          <span className="absolute top-3 right-3 rounded-full bg-tinta/55 px-2.5 py-1 text-xs font-medium text-white opacity-0 transition group-hover:opacity-100">
            Ampliar
          </span>
        </button>

        {total > 1 && (
          <>
            <Seta lado="esquerda" onClick={anterior} />
            <Seta lado="direita" onClick={proxima} />
            <div className="absolute right-3 bottom-3 rounded-full bg-tinta/60 px-2.5 py-1 text-xs font-medium text-white">
              {atual + 1}/{total}
            </div>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="sem-barra mt-2 flex gap-2 overflow-x-auto">
          {imagens.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setAtual(i)}
              aria-label={`Foto ${i + 1}`}
              className={[
                "relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition",
                i === atual ? "border-mata-600" : "border-transparent",
              ].join(" ")}
            >
              <Image src={url} alt="" fill sizes="96px" className="object-cover" />
            </button>
          ))}
        </div>
      )}

      {/* Fora da pagina, direto no corpo do documento: dentro do conteudo, o
          cabecalho fixo e os botoes flutuantes passavam por cima da foto.
          So abre por clique, entao nunca roda no servidor. */}
      {cheia && createPortal(
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Fotos de ${nome}`}
          className="fixed inset-0 z-[100] flex flex-col bg-tinta/95"
          onClick={() => setCheia(false)}
        >
          <div className="flex items-center justify-between px-4 py-3 text-white">
            <p className="text-sm font-medium">
              {nome}
              {total > 1 && (
                <span className="ml-2 text-white/60">
                  {atual + 1}/{total}
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={() => setCheia(false)}
              aria-label="Fechar"
              className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-xl transition hover:bg-white/25"
            >
              ✕
            </button>
          </div>

          {/* O clique no fundo fecha; o clique na foto, nao — senao fica
              impossivel olhar a imagem sem fechar por engano. */}
          <div
            className="relative min-h-0 flex-1"
            onClick={(e) => e.stopPropagation()}
          >
            <Image
              src={imagens[atual]}
              alt={nome}
              fill
              sizes="100vw"
              className="object-contain"
            />

            {total > 1 && (
              <>
                <Seta lado="esquerda" onClick={anterior} clara />
                <Seta lado="direita" onClick={proxima} clara />
              </>
            )}
          </div>

          <p className="px-4 py-3 text-center text-xs text-white/50">
            Toque fora da foto para fechar
          </p>
        </div>,
        document.body,
      )}
    </div>
  );
}

function Seta({
  lado,
  onClick,
  clara = false,
}: {
  lado: "esquerda" | "direita";
  onClick: () => void;
  clara?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={lado === "esquerda" ? "Foto anterior" : "Próxima foto"}
      className={[
        "absolute top-1/2 z-10 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full shadow transition",
        clara
          ? "bg-white/20 text-white hover:bg-white/35"
          : "bg-white/85 text-tinta hover:bg-white",
        lado === "esquerda" ? "left-3" : "right-3",
      ].join(" ")}
    >
      {lado === "esquerda" ? "‹" : "›"}
    </button>
  );
}
