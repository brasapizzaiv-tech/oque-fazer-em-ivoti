import { SUPABASE_CONFIGURADO } from "@/lib/supabase/config";
import { dentroDoLimite } from "@/lib/limite-chat";
import { avisarPrazos } from "@/lib/avisos-de-prazo";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * A rodada diária dos avisos de prazo.
 *
 * A Vercel chama este endereço uma vez por dia (está em vercel.json). Ele
 * manda o e-mail de "seu período grátis terminou, você tem 7 dias" e o de
 * "seu lugar saiu do ar" para quem ainda não recebeu.
 *
 * QUEM CHAMA NÃO DIZ NADA. O endereço não recebe lugar, e-mail nem data:
 * lê a situação de hoje no banco e decide sozinho o que mandar, e cada
 * recado sai uma vez só. Chamar de fora, portanto, não faz ninguém receber
 * e-mail que não devia — no máximo adianta em algumas horas a rodada do
 * dia. Mesmo assim:
 *
 *   - com CRON_SECRET configurada na Vercel, só passa quem trouxer a
 *     senha (a própria Vercel manda no cabeçalho);
 *   - sem ela, há um teto de seis rodadas por hora, para ninguém usar o
 *     endereço para ficar consultando o banco em laço.
 */
export async function GET(request: Request) {
  if (!SUPABASE_CONFIGURADO) return new Response(null, { status: 204 });

  const segredo = process.env.CRON_SECRET;
  if (segredo) {
    if (request.headers.get("authorization") !== `Bearer ${segredo}`) {
      return new Response(null, { status: 401 });
    }
  } else if (!(await dentroDoLimite("cron:prazos", 6))) {
    return new Response(null, { status: 429 });
  }

  try {
    // Só os números: nome de lugar e e-mail não saem por aqui.
    return Response.json(await avisarPrazos(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (erro) {
    console.error("Rodada dos avisos de prazo falhou:", erro);
    return new Response(null, { status: 500 });
  }
}
