"use client";

import { useEffect, useRef } from "react";
import { contar } from "@/lib/contar";
import type { TipoMetrica } from "@/lib/metricas";

/**
 * Conta quando o que está dentro aparece na tela de alguém.
 *
 * É o que alimenta "Eventos vistos", "Promoções vistas" e "Cardápio" no
 * painel do comerciante. Os três números eram prometidos (e o do cardápio,
 * vendido na página de planos), mas nada no site os contava: o painel
 * mostraria zero para sempre.
 *
 * Conta uma vez por pessoa por visita ao site, e só quando o bloco chega
 * de fato ao meio da tela: estar no fim de uma página que ninguém rolou
 * não é ter sido visto.
 *
 * Sem `local` não conta nada: evento de rua, sem estabelecimento, não tem
 * painel de ninguém para aparecer.
 */
export default function ContarAoVer({
  tipo,
  local,
  alvo,
  id,
  className,
  children,
}: {
  tipo: TipoMetrica;
  local?: string | null;
  /** O evento ou a promoção; fica vazio para o cardápio. */
  alvo?: string;
  id?: string;
  className?: string;
  children: React.ReactNode;
}) {
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const elemento = caixa.current;
    if (!elemento || !local) return;

    const marca = `visto:${tipo}:${alvo ?? local}`;
    try {
      if (sessionStorage.getItem(marca)) return;
    } catch {
      // navegação anônima pode recusar: conta mesmo assim
    }

    const olheiro = new IntersectionObserver(
      (entradas) => {
        if (!entradas.some((e) => e.isIntersecting)) return;
        olheiro.disconnect();
        try {
          sessionStorage.setItem(marca, "1");
        } catch {
          // idem
        }
        contar(tipo, { local, alvo });
      },
      // A faixa do meio da tela: funciona igual para um cartão pequeno e
      // para um cardápio mais alto que a tela inteira.
      { rootMargin: "-25% 0px -25% 0px" },
    );

    olheiro.observe(elemento);
    return () => olheiro.disconnect();
  }, [tipo, local, alvo]);

  return (
    <div ref={caixa} id={id} className={className}>
      {children}
    </div>
  );
}
