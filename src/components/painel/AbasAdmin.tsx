"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/admin", rotulo: "Fila e cadastros" },
  { href: "/admin/metricas", rotulo: "Movimento" },
  { href: "/admin/roteiros", rotulo: "Roteiros" },
  { href: "/admin/planos", rotulo: "Planos" },
  { href: "/admin/feiras", rotulo: "Feiras" },
];

/** Navegação entre as seções da administração. Mesmas regras das do painel. */
export default function AbasAdmin() {
  const caminho = usePathname();

  return (
    <nav aria-label="Seções da administração">
      <div
        className="flex flex-wrap gap-x-1 gap-y-0.5 sm:flex-nowrap"
        style={{ borderBottom: "2px solid var(--color-madeira)" }}
      >
        {ABAS.map((aba) => {
          const secoes = ABAS.filter((a) => a.href !== "/admin");
          const ativa =
            aba.href === "/admin"
              ? !secoes.some((s) => caminho.startsWith(s.href))
              : caminho.startsWith(aba.href);

          return (
            <Link
              key={aba.href}
              href={aba.href}
              aria-current={ativa ? "page" : undefined}
              className="-mb-[2px] px-3 py-2.5 text-[14px] font-semibold whitespace-nowrap transition sm:px-4"
              style={{
                borderBottom: `3px solid ${ativa ? "var(--color-torii)" : "transparent"}`,
                color: ativa
                  ? "var(--color-texto)"
                  : "var(--color-texto-suave)",
              }}
            >
              {aba.rotulo}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
