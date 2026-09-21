"use client";

import Image from "next/image";
import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { Foto } from "@/lib/tipos";

/**
 * As fotos do estabelecimento.
 *
 * A capa entra como primeira imagem, sem repetir se já estiver na galeria.
 *
 * O fundo é a própria foto ampliada e desfocada: a de cima aparece
 * inteira, sem corte, e como quase nenhuma tem o formato exato da moldura
 * sobrariam tarjas vazias dos lados. Assim a moldura fica preenchida pelas
 * cores da própria imagem.
 */
export default function Galeria({
  capa,
  fotos,
  nome,
  aoLado,
}: {
  capa: string | null;
  fotos: Foto[];
  nome: string;
  /** Os botões de voltar e favoritar, que ficam por cima da foto. */
  aoLado?: React.ReactNode;
}) {
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

  // Com a tela cheia aberta, o teclado manda: seta troca de foto e Esc
  // fecha. Quem abriu uma foto grande não quer voltar o mouse até um X.
  useEffect(() => {
    if (!cheia) return;

    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") setCheia(false);
      if (e.key === "ArrowLeft") anterior();
      if (e.key === "ArrowRight") proxima();
    }

    // Trava a rolagem do fundo: sem isto a página desliza atrás da foto.
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
      <div className="relative h-[250px] overflow-hidden lg:mt-4 lg:rounded-[18px]">
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #d8cfc2 0%, #bfb3a2 50%, #a99c8a 100%)",
          }}
        />
        {aoLado && (
          <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
            {aoLado}
          </div>
        )}
      </div>
    );
  }

  return (
    <>
      <div className="relative h-[250px] overflow-hidden lg:mt-4 lg:rounded-[18px]">
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
          aria-label={`Ver as fotos de ${nome} em tela cheia`}
          className="absolute inset-0 cursor-zoom-in"
        >
          <Image
            src={imagens[atual]}
            alt={nome}
            fill
            priority
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-contain"
          />
        </button>

        {aoLado && (
          <div className="pointer-events-none absolute inset-x-0 top-0 flex items-start justify-between p-3 [&>*]:pointer-events-auto">
            {aoLado}
          </div>
        )}

        {total > 1 && (
          <>
            <Seta lado="esquerda" onClick={anterior} />
            <Seta lado="direita" onClick={proxima} />
            <span
              className="absolute right-3 bottom-3 rounded-full px-2.5 py-1 text-[12px] font-bold text-white tabular-nums"
              style={{ backgroundColor: "rgba(20, 14, 10, 0.6)" }}
            >
              {atual + 1}/{total}
            </span>
          </>
        )}
      </div>

      {total > 1 && (
        <div className="mt-2 flex gap-2 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none] lg:px-0 [&::-webkit-scrollbar]:hidden">
          {imagens.map((url, i) => (
            <button
              key={url}
              type="button"
              onClick={() => setAtual(i)}
              aria-label={`Foto ${i + 1} de ${total}`}
              aria-current={i === atual ? "true" : undefined}
              className="relative h-16 w-24 shrink-0 overflow-hidden rounded-[10px] transition"
              style={{
                border:
                  i === atual
                    ? "2.5px solid var(--color-v-torii)"
                    : "1px solid rgba(255, 255, 255, 0.8)",
                opacity: i === atual ? 1 : 0.75,
              }}
            >
              <Image
                src={url}
                alt=""
                fill
                sizes="96px"
                className="object-cover"
              />
            </button>
          ))}
        </div>
      )}

      {/* Fora da página, direto no corpo do documento: dentro do conteúdo,
          o cabeçalho fixo e a barra de baixo passavam por cima da foto.
          Só abre por clique, então nunca roda no servidor. */}
      {cheia &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Fotos de ${nome}`}
            className="fixed inset-0 z-[100] flex flex-col"
            style={{ backgroundColor: "rgba(20, 14, 10, 0.96)" }}
            onClick={() => setCheia(false)}
          >
            <div className="flex items-center justify-between px-4 py-3 text-white">
              <p className="text-[14px] font-medium">
                {nome}
                {total > 1 && (
                  <span className="ml-2 tabular-nums text-white/60">
                    {atual + 1}/{total}
                  </span>
                )}
              </p>
              <button
                type="button"
                onClick={() => setCheia(false)}
                aria-label="Fechar"
                className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-[19px] text-white transition hover:bg-white/25"
              >
                ✕
              </button>
            </div>

            {/* O clique no fundo fecha; o clique na foto, não — senão fica
                impossível olhar a imagem sem fechar por engano. */}
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
                  <Seta lado="esquerda" onClick={anterior} />
                  <Seta lado="direita" onClick={proxima} />
                </>
              )}
            </div>

            <p className="px-4 py-3 text-center text-[12px] text-white/50">
              Toque fora da foto para fechar
            </p>
          </div>,
          document.body,
        )}
    </>
  );
}

/** A seta de trocar de foto. 44px, que é o mínimo para o dedo. */
function Seta({
  lado,
  onClick,
}: {
  lado: "esquerda" | "direita";
  onClick: () => void;
}) {
  const esquerda = lado === "esquerda";
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={esquerda ? "Foto anterior" : "Próxima foto"}
      className={`absolute top-1/2 grid h-11 w-11 -translate-y-1/2 place-items-center rounded-full text-white transition ${
        esquerda ? "left-2" : "right-2"
      }`}
      style={{
        backgroundColor: "rgba(20, 14, 10, 0.55)",
        backdropFilter: "blur(10px)",
      }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={esquerda ? "m14.5 5-7 7 7 7" : "m9.5 5 7 7-7 7"} />
      </svg>
    </button>
  );
}
