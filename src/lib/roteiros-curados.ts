import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";
import { SUPABASE_CONFIGURADO } from "./supabase/config";
import type { Parada } from "./roteiro";

// ============================================================
// Roteiros prontos
// ============================================================
// Os passeios que voce monta no admin e publica no Explorar: "Ivoti em um
// dia", "Rota gastronomica". Sao a mesma tabela dos roteiros que o visitante
// salva com o Guia — o que separa os dois e a coluna "curado".
//
// A diferenca pratica: o do visitante se abre por um token sorteado, e este
// se abre por um endereco escolhido por voce, aparece em lista e e indexado
// pelo Google.
// ============================================================

export type RoteiroCurado = {
  id: string;
  slug: string;
  titulo: string;
  descricao: string | null;
  capa_url: string | null;
  publicado: boolean;
  ordem: number;
  paradas: Parada[];
};

/** O cabecalho de cada roteiro, sem resolver as paradas. Serve a lista. */
export type ResumoRoteiro = Omit<RoteiroCurado, "paradas"> & {
  quantas: number;
};

export async function listarRoteirosCurados(
  { incluirRascunhos = false } = {},
  supabase?: SupabaseClient,
): Promise<ResumoRoteiro[]> {
  if (!SUPABASE_CONFIGURADO) return [];
  const sb = supabase ?? (await createClient());

  let consulta = sb
    .from("roteiros")
    .select("id, slug, titulo, descricao, capa_url, publicado, ordem, locais")
    .eq("curado", true)
    .order("ordem")
    .order("titulo");

  if (!incluirRascunhos) consulta = consulta.eq("publicado", true);

  const { data, error } = await consulta;
  if (error) {
    console.error("Erro ao listar roteiros prontos:", error.message);
    return [];
  }

  const linhas = data ?? [];

  // Capa automatica: a foto da primeira parada. Assim voce nao precisa
  // escolher imagem nenhuma para o cartao ficar apresentavel — e continua
  // podendo definir uma propria quando quiser.
  const primeiras = linhas
    .map((r) => ((r.locais ?? []) as string[])[0])
    .filter(Boolean) as string[];

  const fotos = new Map<string, string | null>();
  if (primeiras.length > 0) {
    const { data: capas } = await sb
      .from("locais")
      .select("id, capa_url")
      .in("id", primeiras);
    for (const l of capas ?? []) fotos.set(l.id, l.capa_url);
  }

  return linhas.map((r) => ({
    id: r.id,
    slug: r.slug ?? "",
    titulo: r.titulo,
    descricao: r.descricao,
    capa_url:
      r.capa_url ?? fotos.get(((r.locais ?? []) as string[])[0]) ?? null,
    publicado: r.publicado,
    ordem: r.ordem,
    quantas: ((r.locais ?? []) as string[]).length,
  }));
}

/**
 * Um roteiro pronto, com as paradas na ordem em que voce montou.
 *
 * Guardamos os identificadores dos locais, nao os enderecos curtos: se um
 * estabelecimento mudar de nome, o roteiro continua apontando para o lugar
 * certo. Em compensacao a consulta volta em qualquer ordem, e a ordem aqui e
 * o roteiro em si — por isso ela e remontada a partir da lista guardada.
 *
 * Parada de local que saiu do ar simplesmente some do passeio: e melhor um
 * roteiro com tres paradas do que um que manda a pessoa para uma porta
 * fechada.
 */
export async function roteiroCurado(
  slug: string,
  supabase?: SupabaseClient,
): Promise<RoteiroCurado | null> {
  if (!SUPABASE_CONFIGURADO) return null;
  const sb = supabase ?? (await createClient());

  const { data: roteiro } = await sb
    .from("roteiros")
    .select("id, slug, titulo, descricao, capa_url, publicado, ordem, locais")
    .eq("curado", true)
    .eq("slug", slug)
    .maybeSingle();

  if (!roteiro) return null;

  const ids = (roteiro.locais ?? []) as string[];
  const { data: locais } = await sb
    .from("locais")
    .select("id, slug, nome, lat, lng, endereco, bairro")
    .in("id", ids.length > 0 ? ids : ["00000000-0000-0000-0000-000000000000"])
    .eq("status", "publicado");

  const porId = new Map((locais ?? []).map((l) => [l.id, l]));
  const paradas: Parada[] = ids
    .map((id) => porId.get(id))
    .filter((l) => l != null)
    .map((l) => ({
      id: l.id,
      slug: l.slug,
      nome: l.nome,
      lat: l.lat,
      lng: l.lng,
      endereco: l.endereco,
      bairro: l.bairro,
    }));

  return {
    id: roteiro.id,
    slug: roteiro.slug ?? slug,
    titulo: roteiro.titulo,
    descricao: roteiro.descricao,
    capa_url: roteiro.capa_url,
    publicado: roteiro.publicado,
    ordem: roteiro.ordem,
    paradas,
  };
}
