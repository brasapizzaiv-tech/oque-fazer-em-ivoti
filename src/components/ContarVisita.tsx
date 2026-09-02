"use client";

import { useEffect } from "react";

/**
 * Avisa o servidor que alguem abriu a pagina deste local.
 * Nao desenha nada na tela e nao atrapalha se falhar.
 */
export default function ContarVisita({ localId }: { localId: string }) {
  useEffect(() => {
    // Um respiro antes de contar: quem abriu e fechou na hora nao conta como
    // visita de verdade, e evita somar quando a pessoa so passou raspando.
    const t = setTimeout(() => {
      fetch("/api/visita", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: localId }),
        keepalive: true,
      }).catch(() => {});
    }, 2500);

    return () => clearTimeout(t);
  }, [localId]);

  return null;
}
