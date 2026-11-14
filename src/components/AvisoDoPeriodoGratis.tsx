import Link from "next/link";
import { WHATSAPP_DO_GUIA } from "@/lib/marca";
import {
  DIAS_GRATIS,
  dataPorExtenso,
  menorMensalidade,
  periodoGratis,
  planoAtivo,
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
        Nada é cobrado sozinho: não pedimos cartão. Ao fim do período, você
        escolhe um plano para continuar.{" "}
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

  return (
    <p className="mt-3 aviso-painel px-4 py-3 text-[14px]">
      <strong>
        O período grátis terminou em {dataPorExtenso(periodo.ate)}.
      </strong>{" "}
      Para continuar no guia, escolha um plano.{" "}
      <a
        href={`https://wa.me/${WHATSAPP_DO_GUIA}?text=${encodeURIComponent(
          "Olá! Meu período grátis no guia terminou e quero escolher um plano.",
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
