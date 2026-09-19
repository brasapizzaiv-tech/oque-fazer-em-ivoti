"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

/**
 * Cria o roteiro vazio e leva direto para a montagem.
 *
 * Pede so o titulo: pedir tudo de uma vez numa tela de criacao, e depois
 * repetir os mesmos campos na tela de edicao, seria trabalho em dobro.
 */
export default function NovoRoteiro() {
  const [abrindo, setAbrindo] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [indo, setIndo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  async function criar() {
    if (!titulo.trim()) return;
    setIndo(true);
    setErro(null);

    // O token e obrigatorio na tabela porque nasceu para os roteiros que o
    // visitante salva. Aqui ele nao e o endereco publico — quem faz esse
    // papel e o slug — mas continua util como link direto antes de publicar.
    const token = crypto.randomUUID().replace(/-/g, "").slice(0, 12);

    const { data, error } = await createClient()
      .from("roteiros")
      .insert({
        token,
        titulo: titulo.trim().slice(0, 80),
        curado: true,
        publicado: false,
        locais: [],
      })
      .select("id")
      .single();

    setIndo(false);

    if (error || !data) {
      console.error("Nao consegui criar o roteiro:", error?.message);
      setErro("Não consegui criar agora. Tente de novo.");
      return;
    }

    router.push(`/admin/roteiros/${data.id}`);
  }

  if (!abrindo) {
    return (
      <button
        type="button"
        onClick={() => setAbrindo(true)}
        className="border-2 border-carvalho bg-carvalho px-5 py-2.5 text-sm font-semibold text-white transition hover:border-sol-700 hover:bg-sol-700"
      >
        + Novo roteiro
      </button>
    );
  }

  return (
    <div className="w-full border-2 border-carvalho bg-creme p-4">
      <label className="block">
        <span className="text-sm font-medium">Título do roteiro</span>
        <input
          autoFocus
          value={titulo}
          onChange={(e) => setTitulo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") criar();
            if (e.key === "Escape") setAbrindo(false);
          }}
          placeholder="Ivoti em um dia"
          className="mt-1 w-full border-2 border-carvalho px-4 py-2.5 outline-none focus:border-sol-600 focus:ring-2 focus:ring-sol-200"
        />
      </label>

      {erro && (
        <p className="mt-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {erro}
        </p>
      )}

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={criar}
          disabled={indo || !titulo.trim()}
          className="border-2 border-carvalho bg-carvalho px-5 py-2 text-sm font-semibold text-white disabled:opacity-40"
        >
          {indo ? "Criando..." : "Criar e montar"}
        </button>
        <button
          type="button"
          onClick={() => setAbrindo(false)}
          className="border-2 border-carvalho px-4 py-2 text-sm"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
