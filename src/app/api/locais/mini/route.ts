import { LOCAIS_DEMO } from "@/lib/demo";
import { SUPABASE_CONFIGURADO } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

// Lista enxuta de todos os locais publicados: nome, foto e categoria.
// O chat usa isso pra transformar os marcadores [[slug]] em cartoes.
export async function GET() {
  if (!SUPABASE_CONFIGURADO) {
    return Response.json({
      locais: LOCAIS_DEMO.map((l) => ({
        slug: l.slug,
        nome: l.nome,
        capa_url: l.capa_url,
        resumo: l.resumo,
        bairro: l.bairro,
        categoria: l.categoria
          ? { nome: l.categoria.nome, emoji: l.categoria.emoji }
          : null,
      })),
    });
  }

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
