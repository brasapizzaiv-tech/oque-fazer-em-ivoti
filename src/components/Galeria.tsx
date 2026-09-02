"use client";

import Image from "next/image";
import { useState } from "react";
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

  if (imagens.length === 0) {
    return (
      <div className="mt-4 grid aspect-[16/7] place-items-center rounded-2xl bg-mata-50 text-6xl">
        {emoji}
      </div>
    );
  }

  return (
    <div className="mt-4">
      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl bg-mata-50 sm:aspect-[16/7]">
        <Image
          src={imagens[atual]}
          alt={nome}
          fill
          priority
          sizes="(max-width: 1024px) 100vw, 1024px"
          className="object-cover"
        />

        {imagens.length > 1 && (
          <>
            <Seta
              lado="esquerda"
              onClick={() =>
                setAtual((i) => (i - 1 + imagens.length) % imagens.length)
              }
            />
            <Seta
              lado="direita"
              onClick={() => setAtual((i) => (i + 1) % imagens.length)}
            />
            <div className="absolute right-3 bottom-3 rounded-full bg-tinta/60 px-2.5 py-1 text-xs font-medium text-white">
              {atual + 1}/{imagens.length}
            </div>
          </>
        )}
      </div>

      {imagens.length > 1 && (
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
      aria-label={lado === "esquerda" ? "Foto anterior" : "Próxima foto"}
      className={[
        "absolute top-1/2 grid h-9 w-9 -translate-y-1/2 place-items-center rounded-full bg-white/85 text-tinta shadow transition hover:bg-white",
        lado === "esquerda" ? "left-3" : "right-3",
      ].join(" ")}
    >
      {lado === "esquerda" ? "‹" : "›"}
    </button>
  );
}
