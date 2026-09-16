"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/painel", rotulo: "Meus locais" },
  { href: "/painel/eventos", rotulo: "Eventos" },
  { href: "/painel/promocoes", rotulo: "Promoções" },
  { href: "/painel/metricas", rotulo: "Métricas" },
];

/** Navegação entre as seções do painel do estabelecimento. */
export default function AbasPainel() {
  const caminho = usePathname();

  return (
    <nav className="mt-4 flex gap-1 border-b border-mata-100">
      {ABAS.map((aba) => {
        // "/painel" e a aba dos locais: acende em si mesma e nas telas de
        // local, mas nao nas secoes que tem aba propria.
        const secoes = ABAS.filter((a) => a.href !== "/painel");
        const ativa =
          aba.href === "/painel"
            ? !secoes.some((s) => caminho.startsWith(s.href))
            : caminho.startsWith(aba.href);

        return (
          <Link
            key={aba.href}
            href={aba.href}
            className={`-mb-px border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              ativa
                ? "border-mata-600 text-mata-800"
                : "border-transparent text-tinta/55 hover:text-mata-700"
            }`}
          >
            {aba.rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
