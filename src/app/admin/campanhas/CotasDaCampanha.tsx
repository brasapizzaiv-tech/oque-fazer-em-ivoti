"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { explicarErro } from "@/lib/erro-do-banco";

/** Quantos estabelecimentos um vídeo visita: é o número de cotas à venda. */
const COTAS = 4;

/**
 * Marca quem comprou cota numa campanha que já existe.
 *
 * A tela de criar dizia "pode deixar em branco e marcar depois", mas não
 * havia depois: a campanha era criada e nunca mais dava para mexer. Como
 * as cotas são vendidas aos poucos, isto é o uso normal, e não a exceção.
 */
export default function CotasDaCampanha({
  campanha,
  atuais,
  comercios,
}: {
  campanha: string;
  atuais: string[];
  comercios: { id: string; nome: string }[];
}) {
  const [abrindo, setAbrindo] = useState(false);
  const [escolhidos, setEscolhidos] = useState<string[]>(atuais);
  const [indo, setIndo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  function alternar(id: string) {
    setEscolhidos((a) =>
      a.includes(id)
        ? a.filter((x) => x !== id)
        : a.length < COTAS
          ? [...a, id]
          : a,
    );
  }

  async function salvar() {
    setErro(null);
    setIndo(true);

    const { data, error } = await createClient()
      .from("campanhas")
      .update({ locais: escolhidos })
      .eq("id", campanha)
      .select("id");

    setIndo(false);

    if (error || !data || data.length === 0) {
      setErro(explicarErro(error, "Não consegui salvar as cotas. Tente de novo."));
      return;
    }

    setAbrindo(false);
    router.refresh();
  }

  if (!abrindo) {
    return (
      <button
        type="button"
        onClick={() => {
          setEscolhidos(atuais);
          setAbrindo(true);
        }}
        className="botao-vazado mt-3 px-3.5 py-2 text-[14px]"
      >
        {atuais.length === 0
          ? "Marcar quem comprou cota"
          : `Cotas: ${atuais.length} de ${COTAS} · alterar`}
      </button>
    );
  }

  return (
    <div className="aviso-painel mt-3 p-4">
      <p className="text-sm font-medium">
        Quem comprou cota ({escolhidos.length} de {COTAS})
      </p>

      {comercios.length === 0 ? (
        <p className="mt-2 text-sm texto-suave">
          Nenhum comércio publicado com conta de dono ainda.
        </p>
      ) : (
        <div className="mt-2 flex flex-wrap gap-2">
          {comercios.map((l) => {
            const marcado = escolhidos.includes(l.id);
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => alternar(l.id)}
                aria-pressed={marcado}
                disabled={!marcado && escolhidos.length >= COTAS}
                className={`min-h-11 px-3 py-1.5 text-[13px] disabled:opacity-40 ${
                  marcado ? "pilula-ativa" : "pilula"
                }`}
              >
                {l.nome}
              </button>
            );
          })}
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

      <div className="mt-3 flex gap-2">
        <button
          type="button"
          onClick={salvar}
          disabled={indo}
          className="botao-cheio px-5 py-2.5 text-[14px] disabled:opacity-50"
        >
          {indo ? "Salvando..." : "Salvar cotas"}
        </button>
        <button
          type="button"
          onClick={() => setAbrindo(false)}
          disabled={indo}
          className="botao-vazado px-4 py-2.5 text-[14px]"
        >
          Voltar
        </button>
      </div>
    </div>
  );
}
