"use client";

import { useSyncExternalStore } from "react";

const CHAVE = "guia-ivoti:favoritos";
const AVISO = "guia-ivoti:favoritos-mudou";

/**
 * O botão de favoritar.
 *
 * A lista mora no próprio aparelho, e não numa conta: o guia só tem conta
 * para comerciante, e pedir cadastro a um visitante só para ele guardar uma
 * pizzaria seria cobrar caro por pouco.
 *
 * O preço disso é honesto e vale dizer: trocando de celular, a lista não vai
 * junto. Quando existir conta de visitante, os favoritos passam para lá — o
 * que está guardado é uma lista de endereços curtos, fácil de subir.
 *
 * A leitura usa `useSyncExternalStore` porque é exatamente disso que se
 * trata: o armazenamento do navegador é um estado que vive fora do React. Ler
 * dentro de um efeito e chamar `setState` também funcionaria, mas provoca uma
 * renderização a mais em toda visita e o próprio React desaconselha.
 *
 * Toda leitura e escrita vai dentro de try: em aba anônima, ou com os dados
 * do site bloqueados, o navegador lança erro em vez de devolver vazio — e um
 * coração não pode derrubar a página do estabelecimento.
 */
export default function Favoritar({ slug }: { slug: string }) {
  const favorito = useSyncExternalStore(
    assinar,
    () => ler().includes(slug),
    // No servidor não há aparelho, então nada é favorito. A primeira pintura
    // no navegador corrige, se for o caso.
    () => false,
  );

  function alternar() {
    const atuais = ler();
    gravar(
      atuais.includes(slug)
        ? atuais.filter((s) => s !== slug)
        : [...atuais, slug],
    );
  }

  return (
    <button
      type="button"
      onClick={alternar}
      aria-pressed={favorito}
      aria-label={favorito ? "Tirar dos favoritos" : "Guardar nos favoritos"}
      className="grid h-11 w-11 place-items-center rounded-full text-[19px]"
      style={{
        backgroundColor: "rgba(46, 26, 16, 0.72)",
        color: favorito
          ? "var(--color-petunia-clara)"
          : "var(--color-creme-claro)",
      }}
    >
      {favorito ? "♥" : "♡"}
    </button>
  );
}

/**
 * Avisa quando a lista muda.
 *
 * O evento próprio cobre esta aba; o "storage" cobre as outras, para dois
 * cartões do mesmo lugar abertos lado a lado não discordarem.
 */
function assinar(aoMudar: () => void) {
  window.addEventListener(AVISO, aoMudar);
  window.addEventListener("storage", aoMudar);
  return () => {
    window.removeEventListener(AVISO, aoMudar);
    window.removeEventListener("storage", aoMudar);
  };
}

function ler(): string[] {
  try {
    const cru = localStorage.getItem(CHAVE);
    const lista = cru ? JSON.parse(cru) : [];
    return Array.isArray(lista)
      ? lista.filter((x) => typeof x === "string")
      : [];
  } catch {
    return [];
  }
}

function gravar(lista: string[]) {
  try {
    localStorage.setItem(CHAVE, JSON.stringify(lista));
  } catch {
    // Sem espaço ou sem permissão: o botão deixa de guardar, mas a página
    // continua de pé.
  }
  window.dispatchEvent(new Event(AVISO));
}
