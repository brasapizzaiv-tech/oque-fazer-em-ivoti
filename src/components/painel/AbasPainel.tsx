"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ABAS = [
  { href: "/painel", rotulo: "Meus locais" },
  { href: "/painel/eventos", rotulo: "Eventos" },
  { href: "/painel/promocoes", rotulo: "Promoções" },
  { href: "/painel/metricas", rotulo: "Métricas" },
  { href: "/painel/assistente", rotulo: "Assistente" },
];

/**
 * Navegação entre as seções do painel.
 *
 * No celular as cinco abas quebram em duas linhas em vez de rolarem de lado.
 * Fileira que rola esconde o que não coube, e quem não adivinha que dá para
 * arrastar nunca encontra a última aba — foi reclamação real na barra do
 * Explorar. Duas linhas custam 40px e não escondem nada.
 *
 * A régua embaixo só existe a partir de `sm`, quando tudo cabe numa linha:
 * em duas linhas ela cortaria a fileira no meio.
 */
export default function AbasPainel() {
  const caminho = usePathname();

  return (
    <nav aria-label="Seções do painel">
      <div
        className="flex flex-wrap gap-x-1 gap-y-0.5 sm:flex-nowrap"
        style={{ borderBottom: "2px solid var(--color-v-texto)" }}
      >
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
              aria-current={ativa ? "page" : undefined}
              className="-mb-[2px] px-3 py-2.5 text-[14px] font-semibold whitespace-nowrap transition sm:px-4"
              style={{
                borderBottom: `3px solid ${ativa ? "var(--color-v-torii)" : "transparent"}`,
                color: ativa
                  ? "var(--color-v-texto)"
                  : "var(--color-v-texto-suave)",
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
