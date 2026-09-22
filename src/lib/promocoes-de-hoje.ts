import { createClient } from "./supabase/server";
import { SUPABASE_CONFIGURADO } from "./supabase/config";
import type { PromocaoNaTela } from "@/lib/promocoes";

/**
 * As promoções que valem hoje, na cidade inteira.
 *
 * A regra de "vale hoje" mora no banco, na função `promocoes_de_hoje`, que
 * também confere se o estabelecimento está no ar. Assim a página inicial e o
 * Explorar nunca discordam sobre o que está valendo.
 *
 * Saiu de dentro do Explorar quando a página inicial passou a precisar da
 * mesma lista: duas cópias da mesma consulta acabam divergindo na primeira
 * vez que alguém mexe numa delas.
 */
export async function promocoesDeHoje(
  limite = 6,
): Promise<PromocaoNaTela[]> {
  if (!SUPABASE_CONFIGURADO) return [];

  const supabase = await createClient();
  const { data } = await supabase.rpc("promocoes_de_hoje", { p_local: null });
  const promocoes = ((data ?? []) as PromocaoNaTela[]).slice(0, limite);
  if (promocoes.length === 0) return [];

  // A função devolve a promoção crua; o cartão precisa do nome do lugar.
  const { data: locais } = await supabase
    .from("locais")
    .select("id, slug, nome")
    .in("id", [...new Set(promocoes.map((p) => p.local_id))]);

  const porId = new Map((locais ?? []).map((l) => [l.id, l]));
  return promocoes.map((p) => ({ ...p, local: porId.get(p.local_id) ?? null }));
}
