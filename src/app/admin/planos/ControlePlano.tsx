"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import {
  ORDEM_DOS_PLANOS,
  PLANOS,
  diasParaVencer,
  hojeEmIvoti,
  planoAtivo,
  precoPorExtenso,
  type PlanoPago,
} from "@/lib/planos";

/**
 * Liga, troca e encerra o plano de um estabelecimento.
 *
 * Não cobra nada nem fala com banco nenhum: você combina o pagamento fora e
 * marca aqui qual plano vale e até quando. Quando a data passa, o site
 * fecha os recursos do plano sozinho.
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
  // Plano pago gravado, mas com a data vencida.
  const vencido = ativo === "gratuito" && plano !== "gratuito";

  const [abrindo, setAbrindo] = useState(false);
  const [escolhido, setEscolhido] = useState<PlanoPago>(
    ativo === "gratuito" ? "presenca" : ativo,
  );
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

    // Renovar o mesmo plano mantém a data em que o cliente entrou; trocar
    // de plano começa a contar de hoje.
    const desde =
      escolhido === ativo && planoDesde ? planoDesde : hojeEmIvoti();

    const { error } = await supabase
      .from("locais")
      .update({ plano: escolhido, plano_desde: desde, plano_ate: ate })
      .eq("id", local);

    if (error) {
      setErro(error.message);
      setIndo(false);
      return;
    }

    // Fecha o período que estava aberto antes de abrir o novo: assim o
    // histórico mostra "Presença até ontem, Movimento a partir de hoje",
    // e não dois planos valendo ao mesmo tempo.
    if (escolhido !== ativo) await fecharPeriodoAberto(supabase);

    await supabase.from("planos_historico").insert({
      local_id: local,
      plano: escolhido,
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

    await fecharPeriodoAberto(supabase);

    setIndo(false);
    router.refresh();
  }

  // Fecha em vez de apagar: o registro de que este comércio já foi cliente
  // é justamente o que interessa depois.
  async function fecharPeriodoAberto(
    supabase: ReturnType<typeof createClient>,
  ) {
    await supabase
      .from("planos_historico")
      .update({ fim: hojeEmIvoti() })
      .eq("local_id", local)
      .gte("fim", hojeEmIvoti());
  }

  return (
    <div className="mt-3 border-t border-[color:var(--color-v-texto)]/20 pt-3">
      {ativo !== "gratuito" ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[color:var(--color-v-petunia)] px-3 py-1 text-[11px] font-bold text-[#FFFFFF]">
            {PLANOS[ativo].nome} · {precoPorExtenso(PLANOS[ativo].centavos)}
          </span>
          <span className="text-sm texto-suave">
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
              className="botao-vazado px-3.5 py-2 text-[14px]"
            >
              Renovar ou trocar
            </button>
            <button
              type="button"
              onClick={desligar}
              disabled={indo}
              className="botao-vazado px-3.5 py-2 text-[14px] text-[color:var(--color-v-fechado-claro)] disabled:opacity-50"
            >
              Encerrar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <span className="pilula px-3 py-1 text-[11px]">Sem plano</span>
          {vencido && (
            <span className="text-sm text-[color:var(--color-v-fechado-claro)]">
              venceu em {porExtenso(planoAte)}
            </span>
          )}
          <button
            type="button"
            onClick={() => setAbrindo(true)}
            className="botao-cheio ml-auto px-4 py-2 text-[14px]"
          >
            Ativar um plano
          </button>
        </div>
      )}

      {abrindo && (
        <div className="aviso-painel mt-3 p-4">
          <p className="text-sm font-medium">
            Plano para <strong>{nome}</strong>
          </p>

          <div className="mt-3 flex flex-wrap gap-2">
            {ORDEM_DOS_PLANOS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setEscolhido(p)}
                aria-pressed={escolhido === p}
                className={`px-3.5 py-2 text-[14px] ${
                  escolhido === p ? "botao-cheio" : "botao-vazado"
                }`}
              >
                {PLANOS[p].nome} · {precoPorExtenso(PLANOS[p].centavos)}
              </button>
            ))}
          </div>

          <div className="mt-3 flex flex-wrap items-end gap-3">
            <label className="block">
              <span className="text-xs font-medium texto-suave">Vale até</span>
              <input
                type="date"
                value={ate}
                min={hojeEmIvoti()}
                onChange={(e) => setAte(e.target.value)}
                className="mt-1 block caixa-painel px-3 py-2 text-sm"
              />
            </label>
            <div className="flex gap-1.5">
              {[1, 3, 6, 12].map((meses) => (
                <button
                  key={meses}
                  type="button"
                  onClick={() => setAte(emUmMes(meses))}
                  className="caixa-painel px-2.5 py-2 text-xs font-medium"
                >
                  {meses === 12
                    ? "1 ano"
                    : `${meses} ${meses === 1 ? "mês" : "meses"}`}
                </button>
              ))}
            </div>
          </div>

          <input
            value={observacao}
            onChange={(e) => setObservacao(e.target.value)}
            placeholder="Observação (opcional): como foi pago, combinado com quem..."
            className="mt-3 w-full caixa-painel px-3 py-2 text-sm"
          />

          {erro && (
            <p className="mt-2 text-sm text-[color:var(--color-v-fechado-claro)]">
              {erro}
            </p>
          )}

          <div className="mt-3 flex gap-2">
            <button
              type="button"
              onClick={ligar}
              disabled={indo}
              className="botao-cheio px-5 py-2.5 text-[14px] disabled:opacity-50"
            >
              {indo ? "Salvando..." : "Confirmar"}
            </button>
            <button
              type="button"
              onClick={() => setAbrindo(false)}
              className="caixa-painel px-4 py-2 text-sm font-medium"
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
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date(`${data}T12:00:00-03:00`));
}
