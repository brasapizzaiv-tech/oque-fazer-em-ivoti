"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Bloco, BotaoSalvar } from "./Campos";
import type { Item } from "@/lib/tipos";

type Linha = {
  secao: string;
  nome: string;
  descricao: string;
  preco: string;
};

export default function EditorItens({
  localId,
  itens,
  titulo = "Cardápio e serviços",
  descricao = "O que vocês fazem, vendem ou oferecem. Isso é o que o guia usa para responder “onde como uma pizza de calabresa?”.",
}: {
  localId: string;
  itens: Item[];
  titulo?: string;
  descricao?: string;
}) {
  const [linhas, setLinhas] = useState<Linha[]>(() =>
    itens.map((i) => ({
      secao: i.secao ?? "",
      nome: i.nome,
      descricao: i.descricao ?? "",
      preco: i.preco != null ? String(i.preco) : "",
    })),
  );
  const [salvando, setSalvando] = useState(false);
  const router = useRouter();
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function mudar(i: number, campo: keyof Linha, valor: string) {
    setLinhas((atual) =>
      atual.map((l, j) => (j === i ? { ...l, [campo]: valor } : l)),
    );
    setSalvo(false);
  }

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setSalvando(true);

    const validas = linhas.filter((l) => l.nome.trim());
    const supabase = createClient();

    const { error: erroApagar } = await supabase
      .from("locais_itens")
      .delete()
      .eq("local_id", localId);

    if (erroApagar) {
      setErro(erroApagar.message);
      setSalvando(false);
      return;
    }

    if (validas.length > 0) {
      const { error } = await supabase.from("locais_itens").insert(
        validas.map((l, ordem) => ({
          local_id: localId,
          secao: l.secao.trim() || null,
          nome: l.nome.trim(),
          descricao: l.descricao.trim() || null,
          preco: l.preco ? Number(l.preco.replace(",", ".")) : null,
          ordem,
        })),
      );
      if (error) setErro(error.message);
    }

    setSalvando(false);
    setSalvo(true);
    // Pede ao painel que recalcule o que ainda falta. Sem isto o aviso
    // "Ainda precisa de: os horários" continuava na tela depois de salvar os
    // horários — o dado ia para o banco, mas a lista e montada no servidor e
    // ficava velha. O comerciante lia que nao salvou e tentava de novo.
    router.refresh();
  }

  return (
    <form onSubmit={salvar}>
      <Bloco titulo={titulo} descricao={descricao}>
        {linhas.length === 0 && (
          <p className="text-sm texto-suave">
            Nada cadastrado ainda. Isso é opcional, mas ajuda bastante.
          </p>
        )}

        <div className="space-y-3">
          {linhas.map((linha, i) => (
            <div
              key={i}
              className="grid gap-2 rounded-xl border border-[color:var(--color-v-texto)]/20 p-3 sm:grid-cols-[1fr_2fr_1fr_auto]"
            >
              <input
                value={linha.secao}
                onChange={(e) => mudar(i, "secao", e.target.value)}
                placeholder="Seção (Pizzas)"
                className="campo-painel px-3 py-2 text-[14px]"
              />
              <div className="space-y-2">
                <input
                  value={linha.nome}
                  onChange={(e) => mudar(i, "nome", e.target.value)}
                  placeholder="Nome do item"
                  className="w-full campo-painel px-3 py-2 text-[14px]"
                />
                <input
                  value={linha.descricao}
                  onChange={(e) => mudar(i, "descricao", e.target.value)}
                  placeholder="Descrição (opcional)"
                  className="w-full campo-painel px-3 py-2 text-[14px]"
                />
              </div>
              <input
                value={linha.preco}
                onChange={(e) => mudar(i, "preco", e.target.value)}
                placeholder="Preço"
                inputMode="decimal"
                className="h-min campo-painel px-3 py-2 text-[14px]"
              />
              <button
                type="button"
                aria-label="Remover item"
                onClick={() => {
                  setLinhas((a) => a.filter((_, j) => j !== i));
                  setSalvo(false);
                }}
                className="h-min rounded-lg px-2 py-2 texto-suave hover:text-[color:var(--color-v-fechado-claro)]"
              >
                ✕
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          onClick={() =>
            setLinhas((a) => [
              ...a,
              {
                secao: a[a.length - 1]?.secao ?? "",
                nome: "",
                descricao: "",
                preco: "",
              },
            ])
          }
          className="botao-vazado px-4 py-2.5 text-[14px]"
        >
          + Adicionar item
        </button>

        {erro && (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[color:var(--color-v-fechado-claro)]">
            {erro}
          </p>
        )}

        <BotaoSalvar salvando={salvando} salvo={salvo}>
          Salvar itens
        </BotaoSalvar>
      </Bloco>
    </form>
  );
}
