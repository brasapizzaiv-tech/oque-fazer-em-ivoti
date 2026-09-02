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

const POR_VISITANTE_POR_HORA = Number(
  process.env.CHAT_LIMITE_POR_HORA ?? 20,
);
const DO_SITE_POR_DIA = Number(process.env.CHAT_LIMITE_POR_DIA ?? 500);

export type Veredito =
  | { liberado: true }
  | { liberado: false; motivo: string };

/** Resumo embaralhado do endereco de rede — nao da pra voltar ao original. */
function identificar(request: Request): string {
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

    const [visitante, site] = await Promise.all([
      admin.rpc("somar_uso_chat", {
        p_chave: `ip:${identificar(request)}`,
        p_janela: hora,
      }),
      admin.rpc("somar_uso_chat", { p_chave: "site", p_janela: dia }),
    ]);

    if (typeof visitante.data === "number" && visitante.data > POR_VISITANTE_POR_HORA) {
      return {
        liberado: false,
        motivo:
          "Opa, tu perguntou bastante coisa nessa ultima hora! 😅 Da uma respirada e volta daqui a pouco — enquanto isso da pra explorar o guia normalmente.",
      };
    }

    if (typeof site.data === "number" && site.data > DO_SITE_POR_DIA) {
      return {
        liberado: false,
        motivo:
          "O guia ja conversou demais hoje e precisa descansar 😴 Volta amanha! Enquanto isso, da pra usar a busca e o mapa normalmente.",
      };
    }

    return { liberado: true };
  } catch (erro) {
    console.error("Nao consegui conferir o limite do chat:", erro);
    return { liberado: true };
  }
}
