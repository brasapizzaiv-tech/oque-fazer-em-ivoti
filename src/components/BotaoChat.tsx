"use client";

import { usePathname } from "next/navigation";
import { NOME_DO_SITE } from "@/lib/marca";
import { useState } from "react";
import Chat from "./Chat";

/**
 * Bolha do guia, presente em todas as paginas.
 * Na pagina /chat ela some, senao ficaria um chat dentro do outro.
 */
export default function BotaoChat() {
  const [aberto, setAberto] = useState(false);
  const rota = usePathname();

  if (rota?.startsWith("/chat")) return null;
  if (rota?.startsWith("/painel") || rota?.startsWith("/admin")) return null;

  return (
    <>
      {aberto && (
        <div className="fixed inset-0 z-50 flex items-end justify-end p-0 sm:p-4">
          <button
            type="button"
            aria-label="Fechar o chat"
            onClick={() => setAberto(false)}
            className="absolute inset-0 bg-tinta/30 backdrop-blur-[2px]"
          />
          <div className="relative flex h-[min(600px,100dvh)] w-full flex-col overflow-hidden bg-creme shadow-2xl sm:h-[600px] sm:w-[400px] sm:rounded-2xl">
            <div className="flex items-center gap-2 border-b-2 border-carvalho bg-carvalho px-4 py-3 text-creme">
              <span className="text-lg">🌿</span>
              <div className="leading-tight">
                <p className="text-sm font-semibold">{NOME_DO_SITE}</p>
                <p className="text-xs text-mata-100">
                  Pergunte o que fazer hoje
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAberto(false)}
                aria-label="Fechar"
                className="ml-auto grid h-8 w-8 place-items-center rounded-full hover:bg-white/15"
              >
                ✕
              </button>
            </div>
            <div className="min-h-0 flex-1">
              <Chat compacto />
            </div>
          </div>
        </div>
      )}

      {!aberto && (
        <button
          type="button"
          onClick={() => setAberto(true)}
          className="fixed right-4 bottom-4 z-40 flex items-center gap-2 border-2 border-carvalho bg-sol-700 py-3 pr-5 pl-4 font-semibold text-creme shadow-lg transition hover:bg-sol-800"
        >
          <span className="text-lg">🌿</span>
          <span className="text-sm">O que fazer hoje?</span>
        </button>
      )}
    </>
  );
}
