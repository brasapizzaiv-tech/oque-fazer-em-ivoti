import { LOCAIS_DEMO } from "@/lib/demo";
import { SUPABASE_CONFIGURADO } from "@/lib/supabase/config";
import { createClientPublico } from "@/lib/supabase/server";

export const runtime = "nodejs";
// Lista pública: a Vercel guarda a resposta por um minuto em vez de
// consultar o Supabase a cada visita. Eram cinco, e isso apareceu na tela:
// em 14/11/2026 o Nei lanches foi publicado e, três minutos depois, o Guia
// já o indicava — mas esta lista ainda não o conhecia. O nome sumiu da
// frase e a parada sumiu do roteiro.
export const revalidate = 60;

// Lista enxuta de todos os locais publicados: nome, foto e categoria.
// O chat usa isso pra transformar os marcadores [[slug]] em cartoes.
export async function GET() {
  if (!SUPABASE_CONFIGURADO) {
    return Response.json({
      locais: LOCAIS_DEMO.map((l) => ({
        id: l.id,
        lat: l.lat,
        lng: l.lng,
        endereco: l.endereco,
        numero: l.numero,
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

  const supabase = createClientPublico();
  const { data, error } = await supabase
    .from("locais")
    .select(
      "id, slug, nome, capa_url, resumo, bairro, lat, lng, endereco, numero, categoria:categorias(nome, emoji)",
    )
    .eq("status", "publicado");

  // Falha do banco não fica guardada: com o cabeçalho de sempre, a lista
  // vazia era servida a todo mundo até o cache vencer, e o Guia mostrava
  // os nomes dos lugares sem link.
  if (error) {
    console.error("Lista curta de lugares falhou:", error.message);
    return Response.json(
      { locais: [] },
      { headers: { "Cache-Control": "no-store" } },
    );
  }

  return Response.json(
    { locais: data ?? [] },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=60" } },
  );
}
