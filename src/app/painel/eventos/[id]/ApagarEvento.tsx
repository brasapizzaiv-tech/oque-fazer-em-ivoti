"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Apagar evento, com uma confirmacao no meio do caminho.
 *
 * Um clique so seria facil demais pra quem esta no celular com o dedo grande:
 * evento apagado nao volta.
 */
export default function ApagarEvento({
  id,
  titulo,
}: {
  id: string;
  titulo: string;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [indo, setIndo] = useState(false);
  const router = useRouter();

  async function apagar() {
    setIndo(true);
    const { error } = await createClient().from("eventos").delete().eq("id", id);
    if (error) {
      setIndo(false);
      return;
    }
    router.push("/painel/eventos");
    router.refresh();
  }

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="text-sm font-medium text-red-700 underline"
      >
        Apagar este evento
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="text-sm">
        Apagar <strong>{titulo}</strong> de vez? Não dá para desfazer.
      </p>
      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={apagar}
          disabled={indo}
          className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {indo ? "Apagando..." : "Sim, apagar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="border-2 border-carvalho bg-creme px-4 py-2 text-sm font-medium"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
