"use client";

import Link from "next/link";
import { useState } from "react";

export default function MenuMobile({
  links,
}: {
  links: { href: string; texto: string }[];
}) {
  const [aberto, setAberto] = useState(false);

  return (
    <div className="ml-auto md:hidden">
      <button
        type="button"
        onClick={() => setAberto((v) => !v)}
        aria-label={aberto ? "Fechar menu" : "Abrir menu"}
        aria-expanded={aberto}
        className="grid h-10 w-10 place-items-center border-2 border-carvalho text-tinta"
      >
        {aberto ? "✕" : "☰"}
      </button>

      {aberto && (
        <div className="absolute top-16 right-0 left-0 border-b-2 border-carvalho bg-creme p-4 shadow-lg">
          <nav className="flex flex-col gap-1">
            {links.map((l) => (
              <Link
                key={l.href}
                href={l.href}
                onClick={() => setAberto(false)}
                className="px-3 py-3 font-medium text-tinta/80 hover:bg-cal-sombra"
              >
                {l.texto}
              </Link>
            ))}
            <Link
              href="/painel"
              onClick={() => setAberto(false)}
              className="mt-2 border-2 border-carvalho bg-carvalho px-3 py-3 text-center font-semibold text-creme"
            >
              Sou um estabelecimento
            </Link>
          </nav>
        </div>
      )}
    </div>
  );
}
