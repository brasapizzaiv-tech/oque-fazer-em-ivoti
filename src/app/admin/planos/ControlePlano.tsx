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
    <div className="mt-3 border-t border-[color:var(--color-madeira)]/20 pt-3">
      {ativo === "premium" ? (
        <div className="flex flex-wrap items-center gap-3">
          <span className="rounded-full bg-[color:var(--color-petunia)] px-3 py-1 text-[11px] font-bold text-[#fff7ea]">
            ⭐ Premium
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
              Renovar
            </button>
            <button
              type="button"
              onClick={desligar}
              disabled={indo}
              className="botao-vazado px-3.5 py-2 text-[14px] text-[color:var(--color-telha-funda)] disabled:opacity-50"
            >
              Encerrar
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <span className="pilula px-3 py-1 text-[11px]">Gratuito</span>
          {plano === "premium" && (
            <span className="text-sm text-[color:var(--color-telha-funda)]">
              venceu em {porExtenso(planoAte)}
            </span>
          )}
          <button
            type="button"
            onClick={() => setAbrindo(true)}
            className="botao-cheio ml-auto px-4 py-2 text-[14px]"
          >
            Ativar Premium
          </button>
        </div>
      )}

      {abrindo && (
        <div className="aviso-painel mt-3 p-4">
          <p className="text-sm font-medium">
            Premium para <strong>{nome}</strong>
          </p>

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
            <p className="mt-2 text-sm text-[color:var(--color-telha-funda)]">
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
