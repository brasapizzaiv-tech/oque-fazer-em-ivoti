"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { Botao, Logo } from "./pecas";

const MENU = [
  { href: "/", rotulo: "Início" },
  { href: "/explorar", rotulo: "Explorar" },
  { href: "/agenda", rotulo: "Eventos" },
  { href: "/explorar?promocao=1", rotulo: "Promoções" },
  { href: "/roteiros", rotulo: "Roteiros" },
];

/**
 * A barra de cima do computador: transparente sobre a capa, vidro branco
 * depois.
 *
 * Na capa ela não tem fundo próprio — a foto passa por baixo e o menu
 * flutua sobre ela. Assim que a página rola além da capa, ou quando a
 * tela não tem capa nenhuma, vira vidro branco: sobre o conteúdo claro um
 * texto branco sumiria.
 *
 * A troca acontece por rolagem e não por altura fixa da capa, porque a
 * capa da Início tem 760px e a das telas internas não existe. Quem decide
 * é `temCapa`, que a página informa.
 */
export default function CabecalhoDesktop({
  temCapa = false,
}: {
  temCapa?: boolean;
}) {
  const caminho = usePathname();
  const [rolou, setRolou] = useState(false);

  useEffect(() => {
    if (!temCapa) return;
    const aoRolar = () => setRolou(window.scrollY > 120);
    aoRolar();
    window.addEventListener("scroll", aoRolar, { passive: true });
    return () => window.removeEventListener("scroll", aoRolar);
  }, [temCapa]);

  const vidro = !temCapa || rolou;

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 hidden h-[84px] transition-colors duration-300 lg:block ${
        vidro ? "vidro" : ""
      }`}
      style={
        vidro
          ? {
              borderRadius: 0,
              borderLeft: "none",
              borderRight: "none",
              borderTop: "none",
            }
          : undefined
      }
    >
      <div className="mx-auto flex h-full max-w-[1440px] items-center gap-8 px-16">
        <Link href="/" className="shrink-0">
          <Logo sobreFoto={!vidro} />
        </Link>

        <nav className="flex items-center gap-1">
          {MENU.map((item) => {
            const ativo =
              item.href === "/"
                ? caminho === "/"
                : caminho.startsWith(item.href.split("?")[0]);
            return (
              <Link
                key={item.rotulo}
                href={item.href}
                aria-current={ativo ? "page" : undefined}
                className={`flex h-11 items-center px-3 text-[14px] font-medium ${vidro ? "" : "sobre-foto"}`}
                style={{
                  color: ativo
                    ? vidro
                      ? "var(--color-v-torii)"
                      : "var(--color-v-rosa-clara)"
                    : vidro
                      ? "var(--color-v-azul)"
                      : "#FFFFFF",
                }}
              >
                {item.rotulo}
              </Link>
            );
          })}
        </nav>

        <span className="ml-auto flex shrink-0 items-center gap-2">
          <Botao href="/chat" className="h-11">
            Falar com o Guia
          </Botao>
          <Link
            href="/painel"
            className="vidro-leve inline-flex h-11 items-center rounded-[11px] px-5 text-[14px] font-bold"
            style={{ color: vidro ? "var(--color-v-texto)" : "#FFFFFF" }}
          >
            Sou comerciante
          </Link>
        </span>
      </div>
    </header>
  );
}
