import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Lista enxuta de todos os locais publicados: nome, foto e categoria.
// O chat usa isso pra transformar os marcadores [[slug]] em cartoes.
export async function GET() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("locais")
    .select("slug, nome, capa_url, resumo, bairro, categoria:categorias(nome, emoji)")
    .eq("status", "publicado");

  return Response.json(
    { locais: data ?? [] },
    { headers: { "Cache-Control": "public, max-age=60, s-maxage=300" } },
  );
}
