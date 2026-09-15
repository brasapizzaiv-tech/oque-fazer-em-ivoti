import type { Horario } from "./tipos";

// Tudo aqui trabalha no fuso de Ivoti. O servidor da Vercel roda em UTC, entao
// nunca use `new Date()` direto pra saber "que horas sao agora na cidade".
export const FUSO = "America/Sao_Paulo";

export const DIAS = [
  "Domingo",
  "Segunda",
  "Terça",
  "Quarta",
  "Quinta",
  "Sexta",
  "Sábado",
] as const;

export const DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

export type AgoraNaCidade = {
  diaSemana: number; // 0 = domingo
  minutos: number; // minutos desde a meia-noite
  hhmm: string; // "19:42"
};

/** Que dia e que hora sao agora em Ivoti. */
export function agoraNaCidade(momento = new Date()): AgoraNaCidade {
  // Locale "en-US" de proposito: os nomes curtos de dia vem sem acento
  // ("Sun", "Mon", ...), o que evita depender da codificacao do arquivo.
  const partes = new Intl.DateTimeFormat("en-US", {
    timeZone: FUSO,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(momento);

  const pega = (tipo: string) =>
    partes.find((p) => p.type === tipo)?.value ?? "";

  const mapa: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  const chave = pega("weekday");

  const hora = Number(pega("hour"));
  const minuto = Number(pega("minute"));

  return {
    diaSemana: mapa[chave] ?? 0,
    minutos: hora * 60 + minuto,
    hhmm: `${String(hora).padStart(2, "0")}:${String(minuto).padStart(2, "0")}`,
  };
}

/** "19:30:00" ou "19:30" -> 1170 minutos. */
export function paraMinutos(hora: string): number {
  const [h, m] = hora.split(":");
  return Number(h) * 60 + Number(m ?? 0);
}

/** "19:30:00" -> "19:30" */
export function hhmm(hora: string): string {
  return hora.slice(0, 5);
}

export type SituacaoLocal = {
  aberto: boolean;
  /** Frase pronta: "Aberto ate as 23h", "Abre as 18h", "Fechado hoje". */
  texto: string;
  /** Minutos ate fechar (se aberto) ou ate abrir (se fechado hoje ainda). */
  minutosAte: number | null;
};

/**
 * Diz se o local esta aberto agora, levando em conta faixas que viram a
 * madrugada (um bar que abre 19h e fecha 02h fica aberto a 01h de sabado
 * por causa da faixa lancada na sexta).
 */
export function situacao(
  horarios: Horario[],
  agora = agoraNaCidade(),
): SituacaoLocal {
  if (!horarios || horarios.length === 0) {
    return { aberto: false, texto: "Horario nao informado", minutosAte: null };
  }

  const { diaSemana, minutos } = agora;
  const ontem = (diaSemana + 6) % 7;

  for (const h of horarios) {
    const abre = paraMinutos(h.abre);
    const fecha = paraMinutos(h.fecha);
    const viraDia = fecha <= abre;

    // Faixa que comeca hoje.
    if (h.dia_semana === diaSemana) {
      const fim = viraDia ? fecha + 24 * 60 : fecha;
      if (minutos >= abre && minutos < fim) {
        return {
          aberto: true,
          texto: `Aberto ate ${formatoHora(h.fecha)}`,
          minutosAte: fim - minutos,
        };
      }
    }

    // Faixa de ontem que atravessou a madrugada e ainda esta valendo.
    if (viraDia && h.dia_semana === ontem && minutos < fecha) {
      return {
        aberto: true,
        texto: `Aberto ate ${formatoHora(h.fecha)}`,
        minutosAte: fecha - minutos,
      };
    }
  }

  // Fechado agora: procura a proxima abertura de hoje.
  const proximaHoje = horarios
    .filter((h) => h.dia_semana === diaSemana && paraMinutos(h.abre) > minutos)
    .sort((a, b) => paraMinutos(a.abre) - paraMinutos(b.abre))[0];

  if (proximaHoje) {
    return {
      aberto: false,
      texto: `Abre ${formatoHora(proximaHoje.abre)}`,
      minutosAte: paraMinutos(proximaHoje.abre) - minutos,
    };
  }

  // Senao, o proximo dia da semana que tem horario.
  for (let i = 1; i <= 7; i++) {
    const dia = (diaSemana + i) % 7;
    const doDia = horarios
      .filter((h) => h.dia_semana === dia)
      .sort((a, b) => paraMinutos(a.abre) - paraMinutos(b.abre))[0];
    if (doDia) {
      const quando = i === 1 ? "amanha" : DIAS[dia].toLowerCase();
      return {
        aberto: false,
        texto: `Abre ${quando} ${formatoHora(doDia.abre)}`,
        minutosAte: null,
      };
    }
  }

  return { aberto: false, texto: "Fechado", minutosAte: null };
}

/** 19:00 -> "as 19h" | 19:30 -> "as 19h30" */
export function formatoHora(hora: string): string {
  const [h, m] = hhmm(hora).split(":");
  return m === "00" ? `as ${Number(h)}h` : `as ${Number(h)}h${m}`;
}

/**
 * Agrupa os horarios pra mostrar na pagina do local:
 * [{ dia: "Segunda", faixas: "11:30 as 14:00, 18:00 as 23:00" }, ...]
 */
export function porDia(horarios: Horario[]) {
  return DIAS.map((nome, dia) => {
    const faixas = horarios
      .filter((h) => h.dia_semana === dia)
      .sort((a, b) => paraMinutos(a.abre) - paraMinutos(b.abre))
      .map((h) => `${hhmm(h.abre)} as ${hhmm(h.fecha)}`);
    return { dia, nome, faixas, fechado: faixas.length === 0 };
  });
}

/** Resumo em uma linha, do jeito que o chat gosta de ler. */
export function resumoSemana(horarios: Horario[]): string {
  const linhas = porDia(horarios)
    .filter((d) => !d.fechado)
    .map((d) => `${d.nome}: ${d.faixas.join(", ")}`);
  return linhas.length ? linhas.join(" | ") : "Horario nao informado";
}
