"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { hojeEmIvoti, planoAtivo, diasParaVencer } from "@/lib/planos";

/**
 * Liga e desliga o premium de um estabelecimento.
 *
 * Não cobra nada nem fala com banco nenhum: você combina o pagamento fora e
 * marca aqui até quando vale. Quando a data passa, o site rebaixa sozinho.
 */
export default function ControlePlano({
  local,
  nome,
  plano,
  planoAte,
  planoDesde,
}: {
  local: string;
  nome: string;
  plano: string;
  planoAte: string | null;
  planoDesde: string | null;
}) {
  const ativo = planoAtivo(plano, planoAte);
  const dias = diasParaVencer(planoAte);

  const [abrindo, setAbrindo] = useState(false);
  const [ate, setAte] = useState(planoAte ?? emUmMes());
  const [observacao, setObservacao] = useState("");
  const [indo, setIndo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  async function ligar() {
    if (!ate) return setErro("Escolha até quando o plano vale.");
    setErro(null);
    setIndo(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const desde = planoDesde ?? hojeEmIvoti();

    const { error } = await supabase
      .from("locais")
      .update({ plano: "premium", plano_desde: desde, plano_ate: ate })
      .eq("id", local);

    if (error) {
      setErro(error.message);
      setIndo(false);
      return;
    }

    await supabase.from("planos_historico").insert({
      local_id: local,
      plano: "premium",
      inicio: desde,
      fim: ate,
      quem: user?.id ?? null,
      observacao: observacao.trim() || null,
    });

    setIndo(false);
    setAbrindo(false);
    setObservacao("");
    router.refresh();
  }

  async function desligar() {
    setIndo(true);
    const supabase = createClient();

    await supabase
      .from("locais")
      .update({ plano: "gratuito", plano_ate: null, plano_desde: null })
      .eq("id", local);

    // Fecha o período aberto no histórico em vez de apagá-lo: o registro de
    // que este comércio já foi cliente é justamente o que interessa depois.
    await supabase
      .from("planos_historico")
      .update({ fim: hojeEmIvoti() })
      .eq("local_id", local)
      .eq("plano", "premium")
      .gte("fim", hojeEmIvoti());

    setIndo(false);
    router.refresh();
  }

  return (
    <div className="mt-3 border-t border-carvalho/15 pt-3">
      {ativo === "premium" ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-sol-100 px-3 py-1 text-xs font-semibold text-sol-900">
            ⭐ Premium
          </span>
          <span className="text-sm text-tinta/60">
            {planoAte
              ? dias === 0
                ? "vence hoje"
                : dias === 1
                  ? "vence amanhã"
                  : `vence em ${dias} dias (${porExtenso(planoAte)})`
              : "sem data de vencimento"}
          </span>
          <div className="ml-auto flex gap-2">
            <button
              type="button"
              onClick={() => setAbrindo(true)}
              className="border-2 border-carvalho px-3 py-1.5 text-sm font-medium hover:bg-cal-sombra"
            >
              Renovar
            </button>
            <button
              type="button"
              onClick={desligar}
              disabled={indo}
              className="border-2 border-carvalho px-3 py-1.5 text-sm font-medium text-red-700 disabled:opacity-50"
            >
              Encerrar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-tinta/10 px-3 py-1 text-xs font-semibold text-tinta/70">
            Gratuito
          </span>
          {plano === "premium" && (
            <span className="text-sm text-red-700">
              venceu em {porExtenso(planoAte)}
            </span>
          )}
          <button
            type="button"
            onClick={() => setAbrindo(true)}
            className="ml-auto rounded-lg bg-sol-500 px-4 py-1.5 text-sm font-semibold text-white hover:bg-sol-600"
          >
            Ativar Premium
          </button>
        </div>
      )}

      {abrindo && (
        <div className="mt-3 rounded-xl bg-sol-50 p-4">
          <p className="text-sm font-medium">
            Premium para <strong>{nome}</strong>
          </p>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="text-xs font-medium text-tinta/60">Vale até</span>
              <input
                type="date"
                value={ate}
                min={hojeEmIvoti()}
                onChange={(e) => setAte(e.target.value)}
                className="mt-1 block border-2 border-carvalho bg-creme px-3 py-2 text-sm"
              />
            </label>
            <div className="flex gap-1.5">
              {[1, 3, 6, 12].map((meses) => (
                <button
                  key={meses}
                  type="button"
                  onClick={() => setAte(emUmMes(meses))}
                  className="border-2 border-carvalho bg-creme px-2.5 py-2 text-xs font-medium hover:bg-cal-sombra"
                >
                  {meses === 12 ? "1 ano" : `${meses} ${meses === 1 ? "mês" : "meses"}`}
                </button>
              ))}
            </div>
          </div>

          <input
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Observação (opcional): como foi pago, combinado com quem..."
            className="mt-3 w-full border-2 border-carvalho bg-creme px-3 py-2 text-sm"
          />

          {erro && <p className="mt-2 text-sm text-red-700">{erro}</p>}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={ligar}
              disabled={indo}
              className="border-2 border-carvalho bg-carvalho px-5 py-2 text-sm font-semibold text-white disabled:opacity-50"
            >
              {indo ? "Salvando..." : "Confirmar"}
            </button>
            <button
              type="button"
              onClick={() => setAbrindo(false)}
              className="border-2 border-carvalho bg-creme px-4 py-2 text-sm font-medium"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/** Data de hoje mais N meses, em AAAA-MM-DD. */
function emUmMes(meses = 1): string {
  const d = new Date(`${hojeEmIvoti()}T12:00:00-03:00`);
  d.setMonth(d.getMonth() + meses);
  return d.toISOString().slice(0, 10);
}

function porExtenso(data: string | null): string {
  if (!data) return "—";
  return new Intl.DateTimeFormat("pt-BR", { timeZone: "America/Sao_Paulo" }).format(
    new Date(`${data}T12:00:00-03:00`),
  );
}
