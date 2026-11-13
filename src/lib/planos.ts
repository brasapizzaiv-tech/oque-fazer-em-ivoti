// ============================================================
// Planos e módulos
// ============================================================
// Este arquivo é o único lugar que decide o que cada plano libera e
// quanto ele custa.
//
// Para mover um módulo de degrau, troque uma palavra na tabela MODULOS.
// Para mudar um preço, troque um número na tabela PLANOS. Não há
// `if (plano === ...)` espalhado pelo resto do código: as telas
// perguntam aqui.
//
// O modelo, desde novembro de 2026: todo comércio paga uma mensalidade,
// em três degraus. "gratuito" continua existindo como palavra, mas quer
// dizer SEM plano pago — vale para os pontos da cidade (praças, ponte,
// memorial), que não têm dono e nunca vão pagar, e para o comércio cujo
// plano venceu.
// ============================================================

export type Plano = "gratuito" | "presenca" | "movimento" | "campanha";

/** Os planos que se vendem, do mais barato ao mais caro. */
export type PlanoPago = Exclude<Plano, "gratuito">;

/**
 * A altura de cada degrau. As telas perguntam "tem pelo menos o plano
 * tal?", e assim o de cima herda tudo o que o de baixo libera.
 */
const NIVEL: Record<Plano, number> = {
  gratuito: 0,
  presenca: 1,
  movimento: 2,
  campanha: 3,
};

export const PLANOS: Record<
  PlanoPago,
  {
    nome: string;
    /** Mensalidade em centavos, para a conta nunca tropeçar em vírgula. */
    centavos: number;
    /** Para quem é, numa frase. */
    resumo: string;
  }
> = {
  presenca: {
    nome: "Presença",
    centavos: 4990,
    resumo: "Para quem quer estar no guia da cidade.",
  },
  movimento: {
    nome: "Movimento",
    centavos: 9990,
    resumo: "Para quem quer divulgar e medir o resultado.",
  },
  campanha: {
    nome: "Campanha",
    centavos: 19990,
    resumo: "Para quem quer o turista na porta.",
  },
};

/**
 * A cota de uma campanha com influenciador, em centavos.
 *
 * Cada vídeo visita quatro estabelecimentos, e cada um paga uma cota — à
 * parte da mensalidade. Quatro cotas de R$ 500 cobrem um influenciador de
 * R$ 2.000, que é a faixa dos mais engajados da região.
 */
export const COTA_DE_CAMPANHA_CENTAVOS = 50000;

export const ORDEM_DOS_PLANOS: PlanoPago[] = [
  "presenca",
  "movimento",
  "campanha",
];

/** "R$ 49,90" */
export function precoPorExtenso(centavos: number): string {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(centavos / 100);
}

/** O nome do plano como aparece nas telas. */
export function nomeDoPlano(plano: Plano): string {
  return plano === "gratuito" ? "Sem plano" : PLANOS[plano].nome;
}

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
  exige: PlanoPago;
  /** A frase que aparece no bloqueio. Diz o que se ganha, não o que falta. */
  convite: string;
};

export const MODULOS: Record<Modulo, Definicao> = {
  eventos: {
    nome: "Eventos",
    exige: "movimento",
    convite: "Divulgue shows, feiras e festas na agenda do guia.",
  },
  promocoes: {
    nome: "Promoções",
    exige: "movimento",
    convite: "Mostre suas promoções fixas para quem procura hoje.",
  },
  metricas: {
    nome: "Métricas",
    exige: "movimento",
    convite:
      "Veja quantas pessoas clicaram no seu WhatsApp, de onde vieram e quantas o guia mandou até você.",
  },
  guia_painel: {
    nome: "Assistente no painel",
    exige: "campanha",
    convite:
      "Um assistente para escrever a descrição do seu negócio, sugerir promoções e responder dúvidas.",
  },
  prioridade_guia: {
    nome: "Prioridade nas indicações",
    exige: "campanha",
    convite:
      "Apareça primeiro quando o Guia indicar um lugar e quando montar um roteiro.",
  },
  roteiro_guia: {
    nome: "Aparecer nos roteiros",
    exige: "campanha",
    convite: "Entre nos roteiros que o Guia monta para quem visita a cidade.",
  },
};

/**
 * O plano que vale hoje.
 *
 * Plano vencido responde "gratuito", sem ninguém precisar rebaixar nada.
 * A mesma regra existe no banco, na função `plano_ativo`, para o site e
 * as consultas nunca discordarem.
 *
 * "premium" é o nome antigo do degrau de cima. Continua sendo entendido
 * para o site não tirar os recursos de ninguém no intervalo entre a
 * publicação deste código e a troca dos nomes no banco.
 */
export function planoAtivo(
  plano: string | null | undefined,
  plano_ate: string | null | undefined,
): Plano {
  const nome = plano === "premium" ? "campanha" : plano;
  if (nome !== "presenca" && nome !== "movimento" && nome !== "campanha") {
    return "gratuito";
  }
  if (!plano_ate) return nome;

  // Comparação por texto de propósito: as duas datas estão no formato
  // AAAA-MM-DD, onde a ordem alfabética é a ordem cronológica. Evita criar um
  // objeto de data e cair no fuso errado bem na virada do dia.
  return plano_ate >= hojeEmIvoti() ? nome : "gratuito";
}

/** O plano alcança o degrau pedido? */
export function temPlano(plano: Plano, minimo: Plano): boolean {
  return NIVEL[plano] >= NIVEL[minimo];
}

/** Libera o módulo para este estabelecimento? */
export function podeUsar(modulo: Modulo, plano: Plano): boolean {
  return temPlano(plano, MODULOS[modulo].exige);
}

/** "plano Movimento" — o nome do degrau que libera o módulo. */
export function planoDoModulo(modulo: Modulo): string {
  return `plano ${PLANOS[MODULOS[modulo].exige].nome}`;
}

/** A data de hoje em Ivoti, no formato AAAA-MM-DD. */
export function hojeEmIvoti(): string {
  // "sv-SE" entrega exatamente AAAA-MM-DD.
  return new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date());
}

/** Quantos dias faltam para vencer. Negativo já venceu; nulo não vence. */
export function diasParaVencer(
  plano_ate: string | null | undefined,
): number | null {
  if (!plano_ate) return null;
  const umDia = 24 * 60 * 60 * 1000;
  return Math.round(
    (new Date(`${plano_ate}T12:00:00-03:00`).getTime() -
      new Date(`${hojeEmIvoti()}T12:00:00-03:00`).getTime()) /
      umDia,
  );
}
