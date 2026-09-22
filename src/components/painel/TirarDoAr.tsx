"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Tira um local do ar, ou devolve.
 *
 * Nada e apagado: o cadastro, as fotos, os eventos e as metricas continuam
 * inteiros. So para de aparecer no guia.
 *
 * Tirar do ar pede confirmacao porque o efeito e publico e imediato — a
 * pessoa que procurar o lugar na cidade nao vai mais encontrar. Devolver ao
 * ar nao pede: e o sentido seguro, e quem clicou errado desfaz num toque.
 */
export default function TirarDoAr({
  id,
  nome,
  ativo,
}: {
  id: string;
  nome: string;
  ativo: boolean;
}) {
  const [confirmando, setConfirmando] = useState(false);
  const [indo, setIndo] = useState(false);
  const [erro, setErro] = useState(false);
  const router = useRouter();

  async function mudar(para: "publicado" | "inativo") {
    setIndo(true);
    setErro(false);

    const { error } = await createClient()
      .from("locais")
      .update({ status: para })
      .eq("id", id);

    setIndo(false);
    setConfirmando(false);

    if (error) {
      console.error("Nao consegui mudar o status:", error.message);
      setErro(true);
      return;
    }

    router.refresh();
  }

  if (erro) {
    return (
      <button
        type="button"
        onClick={() => mudar(ativo ? "inativo" : "publicado")}
        className="shrink-0 text-xs font-medium text-[color:var(--color-v-fechado-claro)] underline"
      >
        não deu certo — tentar de novo
      </button>
    );
  }

  if (!ativo) {
    return (
      <button
        type="button"
        onClick={() => mudar("publicado")}
        disabled={indo}
        className="botao-vazado shrink-0 px-3.5 py-2 text-[12px] transition disabled:opacity-50"
      >
        {indo ? "..." : "Voltar ao ar"}
      </button>
    );
  }

  if (confirmando) {
    return (
      <span className="flex shrink-0 items-center gap-1.5">
        <button
          type="button"
          onClick={() => mudar("inativo")}
          disabled={indo}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
        >
          {indo ? "..." : "Tirar"}
        </button>
        <button
          type="button"
          onClick={() => setConfirmando(false)}
          className="botao-vazado px-2.5 py-1.5 text-[12px]"
        >
          Não
        </button>
      </span>
    );
  }

  return (
    <button
      type="button"
      onClick={() => setConfirmando(true)}
      aria-label={`Tirar ${nome} do ar`}
      className="shrink-0 text-xs texto-suave underline transition hover:text-[color:var(--color-v-fechado-claro)]"
    >
      tirar do ar
    </button>
  );
}
