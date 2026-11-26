"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import type { PaginaDoCardapio } from "@/lib/tipos";

/**
 * O cardápio que o estabelecimento enviou em imagem.
 *
 * Na página aparecem as miniaturas; o toque abre o cardápio em tela cheia,
 * com as páginas uma embaixo da outra, para ler rolando, como se lê um
 * cardápio de papel. Diferente da galeria de fotos, aqui a imagem nunca é
 * encaixada inteira na tela: um cardápio em pé encolhido para caber num
 * celular fica com a letra ilegível. Ela ocupa a largura toda, e o botão de
 * ampliar dobra o tamanho para quem precisa.
 */
export default function CardapioEmFotos({
  paginas,
  nome,
}: {
  paginas: PaginaDoCardapio[];
  nome: string;
}) {
  /** A página pela qual o cardápio foi aberto; nulo = fechado. */
  const [aberto, setAberto] = useState<number | null>(null);
  const [ampliado, setAmpliado] = useState(false);
  const comeco = useRef<HTMLLIElement | null>(null);

  useEffect(() => {
    if (aberto === null) return;

    function tecla(e: KeyboardEvent) {
      if (e.key === "Escape") setAberto(null);
    }

    // Trava a rolagem do fundo: sem isto a página desliza atrás do cardápio.
    const guardado = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", tecla);
    // Abre já na página que a pessoa tocou.
    comeco.current?.scrollIntoView({ block: "start" });

    return () => {
      document.body.style.overflow = guardado;
      window.removeEventListener("keydown", tecla);
    };
  }, [aberto]);

  if (paginas.length === 0) return null;

  const varias = paginas.length > 1;

  function fechar() {
    setAberto(null);
    setAmpliado(false);
  }

  return (
    <>
      <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
        {paginas.map((pagina, i) => (
          <li key={pagina.id}>
            <button
              type="button"
              onClick={() => setAberto(i)}
              aria-label={
                varias
                  ? `Abrir o cardápio de ${nome} na página ${i + 1}`
                  : `Abrir o cardápio de ${nome}`
              }
              className="relative block aspect-[3/4] w-full cursor-zoom-in overflow-hidden rounded-[12px]"
              style={{
                border: "1px solid rgba(43, 35, 32, 0.18)",
                backgroundColor: "rgba(255, 255, 255, 0.7)",
              }}
            >
              <Image
                src={pagina.url}
                alt=""
                fill
                sizes="(max-width: 640px) 33vw, 180px"
                className="object-cover object-top"
              />
              {varias && (
                <span
                  className="absolute right-1.5 bottom-1.5 rounded-full px-2 py-0.5 text-[11px] font-bold text-white tabular-nums"
                  style={{ backgroundColor: "rgba(20, 14, 10, 0.6)" }}
                >
                  {i + 1}/{paginas.length}
                </span>
              )}
            </button>
          </li>
        ))}
      </ul>
      <p
        className="mt-2 text-[13px]"
        style={{ color: "var(--color-v-texto-suave)" }}
      >
        Toque para abrir e ler.
      </p>

      {/* Fora da página, direto no corpo do documento, como a galeria: dentro
          do conteúdo, o cabeçalho fixo passaria por cima. Só abre por
          clique, então nunca roda no servidor. */}
      {aberto !== null &&
        createPortal(
          <div
            role="dialog"
            aria-modal="true"
            aria-label={`Cardápio de ${nome}`}
            className="fixed inset-0 z-[100] flex flex-col"
            style={{ backgroundColor: "rgba(20, 14, 10, 0.97)" }}
          >
            <div className="flex items-center justify-between gap-2 px-4 py-3 text-white">
              <p className="min-w-0 truncate text-[14px] font-medium">
                Cardápio · {nome}
              </p>
              <div className="flex shrink-0 items-center gap-2">
                <button
                  type="button"
                  onClick={() => setAmpliado((a) => !a)}
                  aria-pressed={ampliado}
                  className="h-11 rounded-full bg-white/15 px-4 text-[13px] font-bold text-white transition hover:bg-white/25"
                >
                  {ampliado ? "Reduzir" : "Ampliar"}
                </button>
                <button
                  type="button"
                  onClick={fechar}
                  aria-label="Fechar o cardápio"
                  className="grid h-11 w-11 place-items-center rounded-full bg-white/15 text-[19px] text-white transition hover:bg-white/25"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-auto overscroll-contain">
              <ol
                className="mx-auto space-y-3 px-0 pb-6 sm:px-4"
                style={{
                  // Ampliado, a página fica com o dobro da largura da tela e
                  // rola para os lados; no computador o teto também dobra.
                  width: ampliado ? "200%" : "100%",
                  maxWidth: ampliado ? "1800px" : "900px",
                }}
              >
                {paginas.map((pagina, i) => (
                  <li
                    key={pagina.id}
                    ref={i === aberto ? comeco : undefined}
                    className="bg-white"
                  >
                    {/* A imagem inteira, sem a compressão do site: é texto
                        pequeno, e o que se perde ali é justamente a letra. */}
                    <Image
                      src={pagina.url}
                      alt={
                        varias
                          ? `Cardápio de ${nome}, página ${i + 1} de ${paginas.length}`
                          : `Cardápio de ${nome}`
                      }
                      width={pagina.largura ?? 1200}
                      height={pagina.altura ?? 1600}
                      unoptimized
                      loading={i === aberto ? "eager" : "lazy"}
                      className="block h-auto w-full"
                    />
                  </li>
                ))}
              </ol>
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
