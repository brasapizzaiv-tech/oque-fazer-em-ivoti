"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/painel", rotulo: "Meus locais" },
  { href: "/painel/eventos", rotulo: "Eventos" },
];

/** Troca entre as duas partes do painel: os locais e a agenda. */
export default function AbasPainel() {
  const caminho = usePathname();

  return (
    <nav className="mt-4 flex gap-1 border-b border-mata-100">
      {ABAS.map((aba) => {
        // "/painel" so acende em si mesmo e nas telas de local; "/painel/eventos"
        // acende em qualquer tela de evento.
        const ativa =
          aba.href === "/painel"
            ? !caminho.startsWith("/painel/eventos")
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
