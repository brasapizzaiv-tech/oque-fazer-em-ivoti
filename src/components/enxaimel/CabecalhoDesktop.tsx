"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Logo } from "./pecas";

const MENU = [
  { href: "/", rotulo: "Início" },
  { href: "/explorar", rotulo: "Explorar" },
  { href: "/agenda", rotulo: "Eventos" },
  { href: "/explorar?promocao=1", rotulo: "Promoções" },
  { href: "/roteiros", rotulo: "Roteiros" },
];

/**
 * O cabeçalho de computador: 84px com a foto da cidade por baixo.
 *
 * No celular cada tela traz o próprio cabeçalho, com a busca e o título dela;
 * aqui em cima é uma barra só, igual em todas, porque na tela grande há
 * espaço para o menu e a pessoa navega por ele, não por voltar e avançar.
 *
 * Por isso ele vive na casca e não nas páginas: barra de navegação que muda
 * de página para página faz a pessoa reprocurar o mesmo botão toda vez.
 */
export default function CabecalhoDesktop() {
  const caminho = usePathname();

  return (
    <header className="relative isolate hidden h-[84px] lg:block">
      <Image
        src="/fotos/eu-amo-ivoti.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(46, 26, 16, 0.85)" }}
      />

      <div className="relative mx-auto flex h-full max-w-[1440px] items-center gap-8 px-16">
        <Link href="/" className="shrink-0">
          <Logo claro />
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
                className="px-3 py-2 text-[14px] font-medium"
                style={{
                  color: ativo
                    ? "var(--color-petunia-clara)"
                    : "var(--color-creme-claro)",
                }}
              >
                {item.rotulo}
              </Link>
            );
          })}
        </nav>

        <span className="ml-auto flex shrink-0 items-center gap-2">
          <Link
            href="/chat"
            className="flex h-11 items-center rounded-[11px] px-5 text-[14px] font-bold"
            style={{ backgroundColor: "var(--color-torii)", color: "#fff7ea" }}
          >
            Falar com o Guia
          </Link>
          <Link
            href="/painel"
            className="flex h-11 items-center rounded-[11px] border-2 px-5 text-[14px] font-bold"
            style={{
              borderColor: "var(--color-creme-claro)",
              color: "var(--color-creme-claro)",
            }}
          >
            Sou comerciante
          </Link>
        </span>
      </div>

      {/* As telhas fecham a barra, como fecham o cabeçalho do celular. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-[7px]"
        style={{
          backgroundImage:
            "repeating-linear-gradient(90deg, var(--color-telha) 0 9px, var(--color-telha-funda) 9px 18px)",
        }}
      />
    </header>
  );
}
