import Link from "next/link";
import { WHATSAPP_DO_GUIA } from "@/lib/marca";
import {
  DIAS_DE_PRAZO,
  DIAS_GRATIS,
  dataPorExtenso,
  menorMensalidade,
  periodoGratis,
  planoAtivo,
  prazoDoLugar,
} from "@/lib/planos";

/**
 * O combinado de preço, dito antes de a pessoa começar.
 *
 * O cadastro era livre e não falava de dinheiro em lugar nenhum: o
 * comerciante criava a conta, publicava, e a cobrança viria como surpresa.
 * Este aviso aparece na página de cadastro e na tela de criar o lugar, com
 * as mesmas palavras, para ninguém poder dizer que não sabia.
 */
export function AvisoDeCobranca({ className = "" }: { className?: string }) {
  return (
    <div className={className}>
      <p className="text-[15px] font-bold">
        {DIAS_GRATIS} dias grátis, depois mensalidade
      </p>
      <p className="mt-1 text-[14px]">
        Os primeiros {DIAS_GRATIS} dias no guia são grátis, contados do dia em
        que o seu lugar entra no ar. É o tempo para você ver o guia
        funcionando. Depois, a mensalidade é a partir de {menorMensalidade()},
        sem fidelidade.
      </p>
      <p className="mt-1 text-[14px]">
        Nada é cobrado sozinho: não pedimos cartão. Ao fim do período, a gente
        avisa e você tem {DIAS_DE_PRAZO} dias para escolher um plano. Sem
        plano depois disso, o lugar sai do ar até você escolher; nada é
        apagado.{" "}
        <Link href="/planos" className="font-bold underline">
          Ver os planos
        </Link>
      </p>
    </div>
  );
}

/**
 * Em que pé está o período grátis deste lugar, dentro do painel.
 *
 * Não desenha nada para ponto da cidade (lugar sem dono) nem para quem já
 * tem plano pago valendo: para esses o prazo não quer dizer nada.
 */
export function SituacaoDoPeriodoGratis({
  local,
}: {
  local: {
    dono_id: string | null;
    plano: string;
    plano_ate: string | null;
    gratis_ate?: string | null;
  };
}) {
  if (!local.dono_id) return null;
  if (planoAtivo(local.plano, local.plano_ate) !== "gratuito") return null;

  const periodo = periodoGratis(local.gratis_ate);

  if (periodo.situacao === "nao_comecou") {
    return (
      <p className="mt-3 text-[14px] texto-suave">
        Os {DIAS_GRATIS} dias grátis começam a contar no dia em que o seu lugar
        entrar no ar. Depois, a mensalidade é a partir de {menorMensalidade()}.{" "}
        <Link href="/planos" className="font-bold underline">
          Ver os planos
        </Link>
      </p>
    );
  }

  if (periodo.situacao === "valendo") {
    return (
      <p className="mt-3 text-[14px] texto-suave">
        <strong className="text-[color:var(--color-v-texto)]">
          Período grátis até {dataPorExtenso(periodo.ate)}
        </strong>{" "}
        {periodo.dias === 0
          ? "(termina hoje)"
          : periodo.dias === 1
            ? "(falta 1 dia)"
            : `(faltam ${periodo.dias} dias)`}
        . Depois, a mensalidade é a partir de {menorMensalidade()}.{" "}
        <Link href="/planos" className="font-bold underline">
          Ver os planos
        </Link>
      </p>
    );
  }

  // Terminou. Daqui em diante quem fala é o prazo: uma semana para
  // escolher um plano e, depois dela, o lugar fora do ar.
  const prazo = prazoDoLugar(local);
  if (prazo.situacao === "em_dia") return null;

  const oQueTerminou =
    prazo.motivo === "plano"
      ? `O seu plano venceu em ${dataPorExtenso(prazo.terminou)}.`
      : `O período grátis terminou em ${dataPorExtenso(prazo.terminou)}.`;

  return (
    <p className="mt-3 aviso-painel px-4 py-3 text-[14px]">
      {prazo.situacao === "no_prazo" ? (
        <>
          <strong>{oQueTerminou}</strong> Escolha um plano até{" "}
          <strong>{dataPorExtenso(prazo.ate)}</strong>
          {prazo.dias === 0
            ? " (é hoje)"
            : prazo.dias === 1
              ? " (falta 1 dia)"
              : ` (faltam ${prazo.dias} dias)`}{" "}
          para continuar no guia. Depois dessa data, o seu lugar sai do ar até
          você escolher um plano. Nada é apagado.
        </>
      ) : (
        <>
          <strong>
            Seu lugar está fora do ar desde {dataPorExtenso(prazo.desde)}.
          </strong>{" "}
          {oQueTerminou} Nenhum plano foi escolhido nos {DIAS_DE_PRAZO} dias
          de prazo. O cadastro, as fotos e os textos continuam guardados: ao
          escolher um plano, ele volta ao ar.
        </>
      )}{" "}
      <a
        href={`https://wa.me/${WHATSAPP_DO_GUIA}?text=${encodeURIComponent(
          "Olá! Quero escolher um plano para o meu estabelecimento no guia.",
        )}`}
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold underline"
      >
        Falar com a gente
      </a>{" "}
      ou{" "}
      <Link href="/planos" className="font-bold underline">
        ver os planos
      </Link>
      .
    </p>
  );
}
