"use client";

import { useState } from "react";

/**
 * O link da campanha, com um botão para copiar.
 *
 * O link aparece escrito inteiro ao lado do botão: se a cópia falhar — e
 * em navegador de aplicativo ela falha —, ainda dá para selecionar na mão.
 */
export default function CopiarLink({ link }: { link: string }) {
  const [copiado, setCopiado] = useState(false);

  async function copiar() {
    try {
      await navigator.clipboard.writeText(link);
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    } catch {
      // sem permissão de área de transferência: o link está na tela
    }
  }

  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      <code className="caixa-painel px-3 py-2 text-[13px] break-all select-all">
        {link}
      </code>
      <button
        type="button"
        onClick={copiar}
        className="botao-vazado px-3.5 py-2 text-[13px]"
      >
        {copiado ? "Copiado" : "Copiar link"}
      </button>
    </div>
  );
}
