"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Apagar promoção, com confirmação.
 *
 * Quem só quer tirar do ar por um tempo tem o interruptor "Promoção no ar" no
 * formulário — por isso o aviso aqui lembra disso antes de apagar de vez.
 */
export default function ApagarPromocao({
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
    const { error } = await createClient()
      .from("promocoes")
      .delete()
      .eq("id", id);
    if (error) {
      setIndo(false);
      return;
    }
    router.push("/painel/promocoes");
    router.refresh();
  }

  if (!confirmando) {
    return (
      <button
        type="button"
        onClick={() => setConfirmando(true)}
        className="text-sm font-medium text-[color:var(--color-telha-funda)] underline"
      >
        Apagar esta promoção
      </button>
    );
  }

  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-4">
      <p className="text-sm">
        Apagar <strong>{titulo}</strong> de vez? Não dá para desfazer.
      </p>
      <p className="mt-1 text-sm texto-suave">
        Se for só para tirar do ar por um tempo, desmarque “Promoção no ar” lá
        em cima — assim ela fica guardada para religar depois.
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
          className="caixa-painel px-4 py-2 text-sm font-medium"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
