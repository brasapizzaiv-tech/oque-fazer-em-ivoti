"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function AcoesAdmin({ id }: { id: string }) {
  const [motivo, setMotivo] = useState("");
  const [pedindoMotivo, setPedindoMotivo] = useState(false);
  const [indo, setIndo] = useState(false);
  const router = useRouter();

  async function publicar() {
    setIndo(true);
    await createClient()
      .from("locais")
      .update({
        status: "publicado",
        publicado_em: new Date().toISOString(),
        motivo_rejeicao: null,
      })
      .eq("id", id);
    setIndo(false);
    router.refresh();
  }

  async function rejeitar() {
    if (!motivo.trim()) return;
    setIndo(true);
    await createClient()
      .from("locais")
      .update({ status: "rejeitado", motivo_rejeicao: motivo.trim() })
      .eq("id", id);
    setIndo(false);
    setPedindoMotivo(false);
    router.refresh();
  }

  return (
    <div className="mt-3 border-t border-carvalho/15 pt-3">
      {pedindoMotivo ? (
        <div className="flex flex-wrap gap-2">
          <input
            value={motivo}
            onChange={(e) => setMotivo(e.target.value)}
            placeholder="O que precisa ser ajustado?"
            className="min-w-56 flex-1 border-2 border-carvalho px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={rejeitar}
            disabled={indo || !motivo.trim()}
            className="rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-40"
          >
            Devolver
          </button>
          <button
            type="button"
            onClick={() => setPedindoMotivo(false)}
            className="border-2 border-carvalho px-4 py-2 text-sm"
          >
            Cancelar
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={publicar}
            disabled={indo}
            className="border-2 border-carvalho bg-carvalho px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
          >
            {indo ? "..." : "Publicar"}
          </button>
          <button
            type="button"
            onClick={() => setPedindoMotivo(true)}
            className="border-2 border-carvalho px-4 py-2 text-sm font-medium"
          >
            Pedir ajuste
          </button>
        </div>
      )}
    </div>
  );
}
