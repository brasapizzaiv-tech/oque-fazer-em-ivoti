"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/** Publicar ou devolver um evento que está esperando aprovação. */
export default function AcoesEvento({ id }: { id: string }) {
  const [indo, setIndo] = useState(false);
  const router = useRouter();

  async function mudar(status: "publicado" | "rejeitado") {
    setIndo(true);
    await createClient().from("eventos").update({ status }).eq("id", id);
    setIndo(false);
    router.refresh();
  }

  return (
    <div className="mt-3 flex gap-2 border-t border-carvalho/15 pt-3">
      <button
        type="button"
        onClick={() => mudar("publicado")}
        disabled={indo}
        className="border-2 border-carvalho bg-carvalho px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {indo ? "..." : "Publicar na agenda"}
      </button>
      <button
        type="button"
        onClick={() => mudar("rejeitado")}
        disabled={indo}
        className="border-2 border-carvalho px-4 py-2 text-sm font-medium disabled:opacity-50"
      >
        Devolver
      </button>
    </div>
  );
}
