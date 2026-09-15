import { IVOTI } from "./geo";

// ============================================================
// Temperatura de Ivoti
// ============================================================
// Vem do Open-Meteo: gratuito, sem cadastro e sem chave pra guardar.
//
// A resposta fica guardada por 15 minutos. Temperatura nao muda de minuto em
// minuto, e assim o site faz umas 100 consultas por dia no total — e nao uma
// por visitante, que seria falta de educacao com um servico gratuito.
//
// Se a consulta falhar, devolve nulo e a saudacao aparece sem a temperatura.
// Clima e enfeite: nunca pode derrubar a home.
// ============================================================

const MINUTOS = 15;

export type Clima = {
  /** Ja arredondada, pronta pra escrever: 18 */
  graus: number;
  emoji: string;
  /** "céu limpo", "chuva", "nublado" */
  descricao: string;
};

/**
 * Cada codigo de tempo do Open-Meteo (padrao da OMM) vira um emoji e uma
 * palavra. Os codigos vem agrupados de tres em tres (fraco, medio, forte);
 * aqui a intensidade nao importa, entao viram a mesma coisa.
 */
const TEMPOS: Record<number, [string, string]> = {
  0: ["☀️", "céu limpo"],
  1: ["🌤️", "quase limpo"],
  2: ["⛅", "parcialmente nublado"],
  3: ["☁️", "nublado"],
  45: ["🌫️", "neblina"],
  48: ["🌫️", "neblina"],
  51: ["🌦️", "garoa"],
  53: ["🌦️", "garoa"],
  55: ["🌦️", "garoa"],
  56: ["🌧️", "garoa gelada"],
  57: ["🌧️", "garoa gelada"],
  61: ["🌧️", "chuva"],
  63: ["🌧️", "chuva"],
  65: ["🌧️", "chuva forte"],
  66: ["🌧️", "chuva gelada"],
  67: ["🌧️", "chuva gelada"],
  71: ["❄️", "neve"],
  73: ["❄️", "neve"],
  75: ["❄️", "neve"],
  77: ["❄️", "neve"],
  80: ["🌦️", "pancadas de chuva"],
  81: ["🌦️", "pancadas de chuva"],
  82: ["⛈️", "temporal"],
  85: ["❄️", "neve"],
  86: ["❄️", "neve"],
  95: ["⛈️", "trovoada"],
  96: ["⛈️", "trovoada com granizo"],
  99: ["⛈️", "trovoada com granizo"],
};

export async function climaDeIvoti(): Promise<Clima | null> {
  const endereco =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${IVOTI.lat}&longitude=${IVOTI.lng}` +
    `&current=temperature_2m,weather_code,is_day` +
    `&timezone=America%2FSao_Paulo`;

  try {
    const resposta = await fetch(endereco, {
      next: { revalidate: MINUTOS * 60 },
    });
    if (!resposta.ok) return null;

    const dados = (await resposta.json()) as {
      current?: {
        temperature_2m?: number;
        weather_code?: number;
        is_day?: number;
      };
    };

    const graus = dados.current?.temperature_2m;
    if (typeof graus !== "number") return null;

    const codigo = dados.current?.weather_code ?? 0;
    const [emojiDia, descricao] = TEMPOS[codigo] ?? ["🌡️", "tempo firme"];

    // De noite o sol nao cabe: céu limpo vira lua.
    const noite = dados.current?.is_day === 0;
    const emoji = noite && codigo === 0 ? "🌙" : emojiDia;

    return { graus: Math.round(graus), emoji, descricao };
  } catch (erro) {
    console.error("Nao consegui buscar o clima:", erro);
    return null;
  }
}
