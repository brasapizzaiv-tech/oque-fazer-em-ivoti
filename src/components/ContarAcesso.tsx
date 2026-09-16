"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { contar } from "@/lib/contar";

/**
 * Conta o acesso a uma pagina. Nao desenha nada.
 *
 * Montado no layout, conta toda pagina do site (para o painel do admin). Com
 * "local", conta tambem o acesso daquele estabelecimento — o numero que o
 * comerciante ve.
 *
 * Espera dois segundos e meio de proposito: quem abriu e fechou na hora, ou
 * so passou raspando de um link, nao conta como visita de verdade.
 */
export default function ContarAcesso({ local }: { local?: string }) {
  const caminho = usePathname();
  const jaContou = useRef<string>("");

  useEffect(() => {
    // Em navegacao interna o componente do layout nao remonta; a chave abaixo
    // garante uma contagem por pagina, e nao uma por renderizacao.
    const chave = `${caminho}|${local ?? ""}`;
    if (jaContou.current === chave) return;

    const relogio = setTimeout(() => {
      jaContou.current = chave;

      // Divisao de trabalho entre as duas copias deste componente: a do
      // layout cuida do site, a da pagina do local cuida do estabelecimento.
      // Sem isso as duas contariam o caminho e o painel do admin mostraria o
      // dobro de acesso em toda pagina de estabelecimento.
      if (local) {
        contar("pagina", { local });
        return;
      }

      contar("site_pagina", { chave: caminho });

      // De onde a pessoa veio so interessa na primeira pagina da visita:
      // depois disso a origem passa a ser o proprio site.
      if (!sessionStorage.getItem("origem-contada")) {
        try {
          sessionStorage.setItem("origem-contada", "1");
        } catch {
          // navegacao anonima pode recusar; contar duas vezes e melhor que
          // travar a pagina
        }
        contar("site_origem");
      }
    }, 2500);

    return () => clearTimeout(relogio);
  }, [caminho, local]);

  return null;
}
