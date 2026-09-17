import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_CONFIGURADO } from "@/lib/supabase/config";
import { SITE } from "@/lib/site";

// O mapa do site se refaz de hora em hora. Cadastro novo nao precisa esperar
// um deploy para o Google saber que existe.
export const revalidate = 3600;

/**
 * O mapa do site para os buscadores.
 *
 * Sem ele o Google precisa descobrir cada pagina seguindo link por link, o
 * que leva semanas. Com ele, chega a lista pronta.
 *
 * Fica de fora tudo o que nao e para ser encontrado por busca: o painel, a
 * administracao e os roteiros que o visitante salvou — esses ultimos se
 * abrem por um token sorteado, que faz o papel de senha, e listar isso em
 * arquivo publico entregaria o passeio de estranhos.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const fixas: MetadataRoute.Sitemap = [
    { url: SITE, changeFrequency: "daily", priority: 1 },
    { url: `${SITE}/explorar`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE}/mapa`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE}/agenda`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE}/roteiros`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${SITE}/chat`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${SITE}/cadastrar`, changeFrequency: "monthly", priority: 0.5 },
  ];

  if (!SUPABASE_CONFIGURADO) return fixas;

  const supabase = await createClient();

  const [{ data: locais }, { data: roteiros }] = await Promise.all([
    supabase
      .from("locais")
      .select("slug, atualizado_em")
      .eq("status", "publicado"),
    supabase
      .from("roteiros")
      .select("slug, criado_em")
      .eq("curado", true)
      .eq("publicado", true)
      .not("slug", "is", null),
  ]);

  return [
    ...fixas,
    ...(locais ?? []).map((l) => ({
      url: `${SITE}/local/${l.slug}`,
      lastModified: l.atualizado_em ? new Date(l.atualizado_em) : undefined,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...(roteiros ?? []).map((r) => ({
      url: `${SITE}/roteiros/${r.slug}`,
      lastModified: r.criado_em ? new Date(r.criado_em) : undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
