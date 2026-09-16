"use client";

import { contar } from "@/lib/contar";
import type { TipoMetrica } from "@/lib/metricas";

/**
 * Um link que leva o visitante do guia para o comercio — e avisa que levou.
 *
 * Cada clique conta duas coisas: o tipo (WhatsApp, telefone, rota...) e uma
 * "indicacao", que e o numero que o comerciante mais quer ver: quantas
 * pessoas o guia mandou para ele.
 *
 * Em links de site e Instagram acrescenta utm_source=guiaivoti, para o
 * comerciante enxergar o guia tambem nas ferramentas dele — e nao ter que
 * acreditar so no nosso numero.
 */
export default function LinkDeContato({
  href,
  tipo,
  local,
  externo = true,
  className,
  children,
}: {
  href: string;
  tipo: TipoMetrica;
  local: string;
  externo?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const endereco = comAssinatura(href, tipo);

  return (
    <a
      href={endereco}
      target={externo ? "_blank" : undefined}
      rel={externo ? "noopener noreferrer" : undefined}
      onClick={() => {
        contar(tipo, { local });
        contar("indicacao", { local });
      }}
      className={className}
    >
      {children}
    </a>
  );
}

/**
 * Marca o link com a origem, quando faz sentido.
 *
 * So em site e Instagram: telefone, WhatsApp e o mapa nao entendem esse tipo
 * de marca, e sujar o endereco atrapalharia.
 */
function comAssinatura(href: string, tipo: TipoMetrica): string {
  if (tipo !== "clique_site" && tipo !== "clique_instagram") return href;

  try {
    const url = new URL(href);
    url.searchParams.set("utm_source", "guiaivoti");
    url.searchParams.set("utm_medium", "referral");
    return url.toString();
  } catch {
    // Endereco que nao dá pra interpretar: vai como veio.
    return href;
  }
}
