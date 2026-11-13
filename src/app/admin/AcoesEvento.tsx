"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { explicarErro } from "@/lib/erro-do-banco";
import { pedirAvisoDoEvento } from "@/lib/avisar";

/**
 * Publicar ou devolver um evento que está esperando aprovação.
 *
 * "Devolver" pede um segundo toque: era um clique só, ao lado do
 * "Publicar", e tirava o evento da fila sem pergunta. Quem cadastrou é
 * avisado por e-mail nos dois casos; ao corrigir e salvar, o evento volta
 * sozinho para a fila.
 */
export default function AcoesEvento({ id }: { id: string }) {
  const [indo, setIndo] = useState(false);
  const [devolvendo, setDevolvendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  async function mudar(status: "publicado" | "rejeitado") {
    setErro(null);
    setIndo(true);

    const { data, error } = await createClient()
      .from("eventos")
      .update({ status })
      .eq("id", id)
      .select("id");

    setIndo(false);
    setDevolvendo(false);

    if (error || !data || data.length === 0) {
      setErro(
        explicarErro(error, "Não consegui gravar a decisão. Tente de novo."),
      );
      return;
    }

    void pedirAvisoDoEvento(id);
    router.refresh();
  }

  return (
    <div className="mt-3 border-t border-[color:var(--color-v-texto)]/20 pt-3">
      {devolvendo ? (
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium">
            Devolver para quem cadastrou corrigir?
          </span>
          <button
            type="button"
            onClick={() => mudar("rejeitado")}
            disabled={indo}
            className="botao-cheio px-4 py-2.5 text-[14px] disabled:opacity-50"
          >
            {indo ? "..." : "Devolver"}
          </button>
          <button
            type="button"
            onClick={() => setDevolvendo(false)}
            disabled={indo}
            className="botao-vazado px-4 py-2.5 text-[14px]"
          >
            Voltar
          </button>
        </div>
      ) : (
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => mudar("publicado")}
            disabled={indo}
            className="botao-cheio px-5 py-2.5 text-[14px] disabled:opacity-50"
          >
            {indo ? "..." : "Publicar na agenda"}
          </button>
          <button
            type="button"
            onClick={() => setDevolvendo(true)}
            disabled={indo}
            className="botao-vazado px-4 py-2.5 text-[14px] disabled:opacity-50"
          >
            Devolver
          </button>
        </div>
      )}

      {erro && (
        <p
          role="alert"
          className="mt-2 text-sm text-[color:var(--color-v-fechado-claro)]"
        >
          {erro}
        </p>
      )}
    </div>
  );
}
