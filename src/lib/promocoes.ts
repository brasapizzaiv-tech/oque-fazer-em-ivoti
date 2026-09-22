import { DIAS, DIAS_CURTOS, hhmm, agoraNaCidade, paraMinutos } from "./horarios";

export type Promocao = {
  id: string;
  local_id: string;
  titulo: string;
  descricao: string | null;
  dias_semana: number[];
  hora_inicio: string | null;
  hora_fim: string | null;
  vale_ate: string | null;
  imagem_url: string | null;
  ativa: boolean;
};

/**
 * "Toda quinta, das 18h às 20h" — a promoção escrita como o cliente lê.
 *
 * Lista vazia de dias significa todos os dias: é o que o comerciante espera
 * ao não marcar nada, e evita a promoção sumir por esquecimento.
 */
export function quandoVale(p: Pick<Promocao, "dias_semana" | "hora_inicio" | "hora_fim">): string {
  const dias = [...(p.dias_semana ?? [])].sort((a, b) => a - b);

  let quando: string;
  if (dias.length === 0 || dias.length === 7) {
    quando = "Todos os dias";
  } else if (dias.length === 2 && dias[0] === 0 && dias[1] === 6) {
    // Sábado e domingo ficam nas pontas da semana, então a ordem numérica
    // produziria "Dom, Sáb" — ninguém fala assim.
    quando = "Fins de semana";
  } else if (dias.length === 5 && ehSequencia(dias) && dias[0] === 1) {
    quando = "De segunda a sexta";
  } else if (dias.length === 1) {
    quando = `Toda ${DIAS[dias[0]].toLowerCase()}`;
  } else if (ehSequencia(dias)) {
    quando = `De ${DIAS_CURTOS[dias[0]].toLowerCase()} a ${DIAS_CURTOS[dias[dias.length - 1]].toLowerCase()}`;
  } else {
    quando = dias.map((d) => DIAS_CURTOS[d]).join(", ");
  }

  const horario = faixaDeHorario(p.hora_inicio, p.hora_fim);
  return horario ? `${quando}, ${horario}` : quando;
}

function faixaDeHorario(inicio: string | null, fim: string | null): string {
  if (inicio && fim) return `das ${hhmm(inicio)} às ${hhmm(fim)}`;
  if (inicio) return `a partir das ${hhmm(inicio)}`;
  if (fim) return `até as ${hhmm(fim)}`;
  return "";
}

function ehSequencia(dias: number[]): boolean {
  return dias.every((d, i) => i === 0 || d === dias[i - 1] + 1);
}

/**
 * Está valendo neste exato momento?
 *
 * O banco já filtrou o dia da semana e o prazo. Aqui sobra só o horário —
 * usado para dizer "acontecendo agora" em vez de só "hoje".
 */
export function valendoAgora(
  p: Pick<Promocao, "hora_inicio" | "hora_fim">,
  agora = agoraNaCidade(),
): boolean {
  if (!p.hora_inicio && !p.hora_fim) return true;

  const minutos = agora.minutos;
  const comeco = p.hora_inicio ? paraMinutos(p.hora_inicio) : 0;
  const fim = p.hora_fim ? paraMinutos(p.hora_fim) : 24 * 60;

  // Happy hour que atravessa a meia-noite (22h às 2h).
  if (fim <= comeco) return minutos >= comeco || minutos < fim;
  return minutos >= comeco && minutos < fim;
}

/**
 * A promoção com o nome do lugar junto.
 *
 * Morava no componente do cartão antigo, que saiu com o desenho de
 * madeira — e o tipo ficou de refém dele. Aqui, ao lado do que descreve,
 * ninguém precisa importar uma tela para usar um dado.
 */
export type PromocaoNaTela = Promocao & {
  local?: { slug: string; nome: string } | null;
};
