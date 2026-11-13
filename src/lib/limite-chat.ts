import { createHash } from "node:crypto";
import { createAdminClient } from "./supabase/admin";

// ============================================================
// Limite de uso do chat
// ============================================================
// A chave da Anthropic fica atras de um endereco publico: sem trava, uma
// pessoa mal-intencionada (ou um robo) chama /api/chat num laco e torra o
// credito da conta numa noite.
//
// Sao duas travas:
//   - por visitante, por hora  — segura o exagero individual
//   - do site inteiro, por dia — teto de gasto, aconteca o que acontecer
//
// A contagem fica no banco de proposito: a Vercel roda varias copias do
// servidor ao mesmo tempo, e um contador na memoria de cada copia nao
// serviria de nada.
// ============================================================

/**
 * O limite escrito na configuracao, ou o padrao.
 *
 * Um valor mal digitado ("vinte", "20/h") viraria NaN, e nenhum numero e
 * maior que NaN: o chat ficaria sem limite nenhum, calado sobre isso.
 */
function limite(valor: string | undefined, padrao: number): number {
  const numero = Number(valor);
  return Number.isFinite(numero) && numero > 0 ? numero : padrao;
}

const POR_VISITANTE_POR_HORA = limite(process.env.CHAT_LIMITE_POR_HORA, 20);
const DO_SITE_POR_DIA = limite(process.env.CHAT_LIMITE_POR_DIA, 500);

export type Veredito =
  | { liberado: true }
  | { liberado: false; motivo: string };

/** Resumo embaralhado do endereco de rede — nao da pra voltar ao original. */
export function identificar(request: Request): string {
  const cabecalho =
    request.headers.get("x-forwarded-for") ??
    request.headers.get("x-real-ip") ??
    "desconhecido";
  const ip = cabecalho.split(",")[0].trim();
  const tempero = process.env.SUPABASE_SERVICE_ROLE_KEY ?? "guia-ivoti";
  return createHash("sha256").update(ip + tempero).digest("hex").slice(0, 32);
}

/**
 * As duas faixas de tempo que servem de gaveta pra contagem.
 *
 * A da hora pode ser em UTC — o que importa e agrupar 60 minutos, nao que
 * hora do relogio e. Ja a do dia precisa virar na meia-noite de Ivoti, senao
 * o teto diario zeraria as 21h. O Brasil nao tem mais horario de verao desde
 * 2019, entao o fuso e -03:00 o ano todo.
 */
function janelas() {
  const agora = new Date();

  const hora = new Date(agora);
  hora.setUTCMinutes(0, 0, 0);

  const [dataLocal] = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "America/Sao_Paulo",
  })
    .format(agora)
    .split(" "); // "sv-SE" ja devolve no formato 2026-09-02

  return { hora: hora.toISOString(), dia: `${dataLocal}T03:00:00.000Z` };
}

/**
 * Conta mais um uso e diz se pode responder.
 *
 * Se o banco nao estiver configurado ou der erro, libera: melhor o chat
 * funcionar sem trava do que ficar mudo por causa de um problema de
 * contagem. O teto de gasto de verdade fica na propria Anthropic, no limite
 * mensal da conta.
 */
export async function podeConversar(request: Request): Promise<Veredito> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return { liberado: true };

  try {
    const admin = createAdminClient();
    const { hora, dia } = janelas();

    // Primeiro o visitante, e so depois o site. Somar os dois de uma vez
    // fazia cada pedido RECUSADO gastar do teto da cidade: uma pessoa ja
    // barrada, insistindo, calava o Guia para todo mundo ate a meia-noite.
    const visitante = await admin.rpc("somar_uso_chat", {
      p_chave: `ip:${identificar(request)}`,
      p_janela: hora,
    });

    if (typeof visitante.data === "number" && visitante.data > POR_VISITANTE_POR_HORA) {
      return {
        liberado: false,
        motivo:
          "Você fez bastante pergunta nesta última hora! 😅 Descanse um pouco e volte daqui a pouco. Enquanto isso, dá para explorar o guia normalmente.",
      };
    }

    const site = await admin.rpc("somar_uso_chat", {
      p_chave: "site",
      p_janela: dia,
    });

    if (typeof site.data === "number" && site.data > DO_SITE_POR_DIA) {
      return {
        liberado: false,
        motivo:
          "Já conversei bastante hoje e preciso descansar 😴 Volte amanhã! Enquanto isso, você pode usar a busca e o mapa normalmente.",
      };
    }

    return { liberado: true };
  } catch (erro) {
    console.error("Nao consegui conferir o limite do chat:", erro);
    return { liberado: true };
  }
}

/**
 * Conta mais um uso de qualquer coisa que precise de teto por hora, e diz
 * se ainda cabe.
 *
 * Usa a mesma gaveta de contagem do chat. Como la, erro de contagem
 * libera: um contador com problema nao pode travar o site.
 */
export async function dentroDoLimite(
  chave: string,
  maximoPorHora: number,
): Promise<boolean> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return true;

  try {
    const { data } = await createAdminClient().rpc("somar_uso_chat", {
      p_chave: chave,
      p_janela: janelas().hora,
    });
    return typeof data !== "number" || data <= maximoPorHora;
  } catch (erro) {
    console.error(`Nao consegui conferir o limite de "${chave}":`, erro);
    return true;
  }
}
