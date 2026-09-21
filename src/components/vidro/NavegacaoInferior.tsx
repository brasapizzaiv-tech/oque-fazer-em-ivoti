"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconeExplorar, IconeGuia, IconeInicio, IconeRoteiros } from "./icones";

const ITENS = [
  { href: "/", rotulo: "Início", Icone: IconeInicio },
  { href: "/explorar", rotulo: "Explorar", Icone: IconeExplorar },
  { href: "/roteiros", rotulo: "Roteiros", Icone: IconeRoteiros },
  { href: "/chat", rotulo: "Guia", Icone: IconeGuia },
];

/**
 * A barra de baixo, só no celular: quatro destinos em vidro branco.
 *
 * Quatro e não cinco porque cinco alvos numa tela de 320px deixam cada um
 * com 64px, e a etiqueta já não cabe sem abreviar — e o guia não abrevia.
 *
 * O respiro de baixo acompanha a área segura do iPhone: sem ele a barra
 * fica por baixo da faixa de gestos e o último item não recebe o toque.
 */
export default function NavegacaoInferior() {
  const caminho = usePathname();

  return (
    <nav
      className="vidro-leve fixed inset-x-0 bottom-0 z-40 flex lg:hidden"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.72)",
        borderLeft: "none",
        borderRight: "none",
        borderBottom: "none",
        paddingBottom: "env(safe-area-inset-bottom)",
      }}
    >
      {ITENS.map(({ href, rotulo, Icone }) => {
        const ativo = href === "/" ? caminho === "/" : caminho.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? "page" : undefined}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
            style={{
              color: ativo
                ? "var(--color-v-torii)"
                : "var(--color-v-texto-suave)",
            }}
          >
            <Icone tamanho={22} />
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
