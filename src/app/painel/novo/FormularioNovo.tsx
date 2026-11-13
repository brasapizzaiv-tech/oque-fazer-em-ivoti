"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { paraSlug } from "@/lib/texto";
import { explicarErro } from "@/lib/erro-do-banco";
import type { Categoria } from "@/lib/tipos";

export default function FormularioNovo({
  categorias,
}: {
  categorias: Categoria[];
}) {
  const [nome, setNome] = useState("");
  const [categoriaId, setCategoriaId] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [indo, setIndo] = useState(false);
  const router = useRouter();

  const principais = categorias.filter((c) => c.pai_id === null);

  async function criar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setIndo(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setErro("Sua sessão expirou. Entre de novo.");
      setIndo(false);
      return;
    }

    // O endereço do local no site vem do nome. Se já existir alguém com o
    // mesmo nome, acrescenta um número no fim.
    //
    // Quem decide se o endereço está livre é a própria gravação, e não uma
    // consulta antes dela: a consulta só enxerga os lugares que esta conta
    // pode ver. Um nome igual ao de um rascunho de outra pessoa passava
    // como livre, a gravação era recusada, e o comerciante lia um erro em
    // inglês sem nunca conseguir cadastrar.
    const base = paraSlug(nome) || "local";
    let data: { id: string } | null = null;
    let error: { code?: string; message?: string } | null = null;

    for (let tentativa = 1; tentativa <= 30; tentativa++) {
      const resposta = await supabase
        .from("locais")
        .insert({
          nome: nome.trim(),
          slug: tentativa === 1 ? base : `${base}-${tentativa}`,
          categoria_id: categoriaId ? Number(categoriaId) : null,
          dono_id: user.id,
          status: "rascunho",
        })
        .select("id")
        .single();

      data = resposta.data;
      error = resposta.error;
      // 23505 é "já existe um com esse endereço": tenta o próximo número.
      if (error?.code !== "23505") break;
    }

    if (error || !data) {
      setErro(explicarErro(error, "Não consegui criar agora. Tente de novo."));
      setIndo(false);
      return;
    }

    router.push(`/painel/${data.id}`);
    router.refresh();
  }

  return (
    <form onSubmit={criar} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Nome do local</span>
        <input
          required
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Pizzaria da Esquina"
          className="mt-1 w-full caixa-painel px-4 py-3 outline-none"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium">O que é</span>
        <select
          required
          value={categoriaId}
          onChange={(e) => setCategoriaId(e.target.value)}
          className="mt-1 w-full caixa-painel px-4 py-3 outline-none"
        >
          <option value="">Escolha...</option>
          {principais.map((pai) => (
            <optgroup key={pai.id} label={`${pai.emoji ?? ""} ${pai.nome}`}>
              <option value={pai.id}>{pai.nome} (geral)</option>
              {categorias
                .filter((c) => c.pai_id === pai.id)
                .map((f) => (
                  <option key={f.id} value={f.id}>
                    {f.emoji} {f.nome}
                  </option>
                ))}
            </optgroup>
          ))}
        </select>
      </label>

      {erro && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[color:var(--color-v-fechado-claro)]">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={indo}
        className="botao-cheio w-full py-3 text-[15px] transition disabled:opacity-50"
      >
        {indo ? "Criando..." : "Criar e continuar"}
      </button>
    </form>
  );
}
