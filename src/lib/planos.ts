// ============================================================
// Planos e módulos
// ============================================================
// Este arquivo é o único lugar que decide o que é gratuito e o que é premium.
//
// Para mover um módulo de lado, troque uma palavra na tabela MODULOS abaixo.
// Não há `if (premium)` espalhado pelo resto do código: as telas perguntam
// aqui.
// ============================================================

export type Plano = "gratuito" | "premium";

export type Modulo =
  | "eventos"
  | "promocoes"
  | "metricas"
  | "guia_painel"
  | "prioridade_guia"
  | "roteiro_guia";

type Definicao = {
  /** Como o módulo se chama nas telas. */
  nome: string;
  /** Plano mínimo para usar. */
  exige: Plano;
  /** A frase que aparece no bloqueio. Diz o que se ganha, não o que falta. */
  convite: string;
};

export const MODULOS: Record<Modulo, Definicao> = {
  eventos: {
    nome: "Eventos",
    exige: "gratuito",
    convite: "Divulgue shows, feiras e festas na agenda do guia.",
  },
  promocoes: {
    nome: "Promoções",
    exige: "gratuito",
    convite: "Mostre suas promoções fixas para quem procura hoje.",
  },
  metricas: {
    nome: "Métricas",
    exige: "premium",
    convite:
      "Veja quantas pessoas clicaram no seu WhatsApp, de onde vieram e quantas o guia mandou até você.",
  },
  guia_painel: {
    nome: "Assistente no painel",
    exige: "premium",
    convite:
      "Um assistente para escrever a descrição do seu negócio, sugerir promoções e responder dúvidas.",
  },
  prioridade_guia: {
    nome: "Prioridade nas indicações",
    exige: "premium",
    convite:
      "Apareça primeiro quando o Guia indicar um lugar e quando montar um roteiro.",
  },
  roteiro_guia: {
    nome: "Aparecer nos roteiros",
    exige: "premium",
    convite: "Entre nos roteiros que o Guia monta para quem visita a cidade.",
  },
};

/**
 * O plano vale hoje?
 *
 * Premium vencido responde como gratuito, sem ninguém precisar rebaixar nada.
 * A mesma regra existe no banco, na função `eh_premium`, para o site e as
 * consultas nunca discordarem.
 */
export function planoAtivo(
  plano: string | null | undefined,
  plano_ate: string | null | undefined,
): Plano {
  if (plano !== "premium") return "gratuito";
  if (!plano_ate) return "premium";

  // Comparação por texto de propósito: as duas datas estão no formato
  // AAAA-MM-DD, onde a ordem alfabética é a ordem cronológica. Evita criar um
  // objeto de data e cair no fuso errado bem na virada do dia.
  return plano_ate >= hojeEmIvoti() ? "premium" : "gratuito";
}

/** Libera o módulo para este estabelecimento? */
export function podeUsar(modulo: Modulo, plano: Plano): boolean {
  return MODULOS[modulo].exige === "gratuito" || plano === "premium";
}

/** A data de hoje em Ivoti, no formato AAAA-MM-DD. */
export function hojeEmIvoti(): string {
  // "sv-SE" entrega exatamente AAAA-MM-DD.
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

/** Quantos dias faltam para vencer. Negativo já venceu; nulo não vence. */
export function diasParaVencer(plano_ate: string | null | undefined): number | null {
  if (!plano_ate) return null;
  const umDia = 24 * 60 * 60 * 1000;
  return Math.round(
    (new Date(`${plano_ate}T12:00:00-03:00`).getTime() -
      new Date(`${hojeEmIvoti()}T12:00:00-03:00`).getTime()) /
      umDia,
  );
}
