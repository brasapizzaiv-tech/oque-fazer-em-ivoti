import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

/**
 * Soma uma visita na pagina de um local.
 *
 * E o numero que o dono ve no painel ("seu perfil foi visto 340 vezes esse
 * mes") e o argumento de venda do plano pago mais adiante.
 *
 * A contagem vem do navegador, e nao do servidor, porque a pagina do local
 * fica guardada em cache por alguns minutos: contar no servidor registraria
 * uma visita a cada dois minutos, nao uma por pessoa.
 */
export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return new Response(null, { status: 204 });
  }

  try {
    const { id } = (await request.json()) as { id?: string };
    if (!id) return new Response(null, { status: 204 });

    await createAdminClient().rpc("registrar_visita", { p_local: id });
  } catch (erro) {
    // Contagem de visita nunca pode atrapalhar quem esta navegando.
    console.error("Nao consegui contar a visita:", erro);
  }

  return new Response(null, { status: 204 });
}
