import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";
import { SUPABASE_CONFIGURADO } from "./supabase/config";
import { CATEGORIAS_DEMO, LOCAIS_DEMO, TAGS_DEMO } from "./demo";
import type { Categoria, LocalCompleto, Tag } from "./tipos";
import { agoraNaCidade, situacao } from "./horarios";
import { normalizar } from "./texto";

// Tudo que a pagina de um local (e o chat) precisam, em uma consulta so.
const CAMPOS = `
  *,
  categoria:categorias(*),
  horarios:locais_horarios(dia_semana, abre, fecha, observacao),
  fotos:locais_fotos(id, url, legenda, ordem),
  itens:locais_itens(id, secao, nome, descricao, preco, ordem),
  locais_tags(tag:tags(*))
`;

type LinhaBruta = Record<string, unknown> & {
  locais_tags?: { tag: Tag | null }[] | null;
  fotos?: LocalCompleto["fotos"] | null;
  itens?: LocalCompleto["itens"] | null;
  horarios?: LocalCompleto["horarios"] | null;
};

/**
 * Aplica os filtros que não dependem do banco (etiquetas, aberto agora) e
 * ordena. Serve tanto para o resultado do Supabase quanto para os locais de
 * demonstração.
 */
function afinar(
  locais: LocalCompleto[],
  { tags, abertoAgora }: Pick<FiltrosBusca, "tags" | "abertoAgora">,
): LocalCompleto[] {
  let saida = locais;

  if (tags && tags.length) {
    saida = saida.filter((l) =>
      tags.every((slug) => l.tags.some((t) => t.slug === slug)),
    );
  }

  if (abertoAgora) {
    const agora = agoraNaCidade();
    saida = saida.filter((l) => situacao(l.horarios, agora).aberto);
  }

  // Destaques primeiro, depois em ordem alfabética.
  return [...saida].sort((a, b) => {
    if (a.destaque !== b.destaque) return a.destaque ? -1 : 1;
    return a.nome.localeCompare(b.nome, "pt-BR");
  });
}

/** Busca nos locais de demonstração, imitando o que o banco faria. */
function buscarNaDemonstracao(filtros: FiltrosBusca): LocalCompleto[] {
  const { q, categoria, limite = 200 } = filtros;
  let locais = LOCAIS_DEMO;

  if (categoria) {
    const alvo = CATEGORIAS_DEMO.find((c) => c.slug === categoria);
    if (alvo) {
      const ids = [
        alvo.id,
        ...CATEGORIAS_DEMO.filter((c) => c.pai_id === alvo.id).map((c) => c.id),
      ];
      locais = locais.filter((l) => l.categoria_id != null && ids.includes(l.categoria_id));
    }
  }

  if (q && q.trim()) {
    const alvo = normalizar(q);
    locais = locais.filter((l) =>
      normalizar(
        [l.nome, l.resumo, l.descricao, l.bairro, l.categoria?.nome]
          .filter(Boolean)
          .join(" "),
      ).includes(alvo),
    );
  }

  return afinar(locais, filtros).slice(0, limite);
}

/** Arruma a linha crua do banco no formato que o site usa. */
function montar(linha: LinhaBruta): LocalCompleto {
  const tags = (linha.locais_tags ?? [])
    .map((lt) => lt.tag)
    .filter((t): t is Tag => Boolean(t))
    .sort((a, b) => a.ordem - b.ordem);

  const fotos = [...(linha.fotos ?? [])].sort((a, b) => a.ordem - b.ordem);
  const itens = [...(linha.itens ?? [])].sort((a, b) => a.ordem - b.ordem);
  const horarios = [...(linha.horarios ?? [])];

  const { locais_tags: _ignorar, ...resto } = linha;
  void _ignorar;

  return { ...resto, tags, fotos, itens, horarios } as LocalCompleto;
}

export async function listarCategorias(
  supabase?: SupabaseClient,
): Promise<Categoria[]> {
  if (!SUPABASE_CONFIGURADO) return CATEGORIAS_DEMO;
  const sb = supabase ?? (await createClient());
  const { data } = await sb
    .from("categorias")
    .select("*")
    .order("ordem", { ascending: true });
  return (data ?? []) as Categoria[];
}

export async function listarTags(supabase?: SupabaseClient): Promise<Tag[]> {
  if (!SUPABASE_CONFIGURADO) return TAGS_DEMO;
  const sb = supabase ?? (await createClient());
  const { data } = await sb
    .from("tags")
    .select("*")
    .order("ordem", { ascending: true });
  return (data ?? []) as Tag[];
}

export type FiltrosBusca = {
  /** Texto digitado pelo visitante. */
  q?: string;
  /** Slug da categoria (aceita a categoria pai: traz as filhas junto). */
  categoria?: string;
  /** Slugs de etiquetas que o local precisa ter (todas). */
  tags?: string[];
  /** Só o que estiver aberto neste momento. */
  abertoAgora?: boolean;
  limite?: number;
};

/**
 * Busca de locais publicados.
 *
 * O filtro de "aberto agora" é aplicado depois da consulta, em memória: são
 * poucas centenas de locais numa cidade do tamanho de Ivoti, e assim a regra
 * de horário (inclusive a virada da madrugada) fica num lugar só.
 */
export async function buscarLocais(
  filtros: FiltrosBusca = {},
  supabase?: SupabaseClient,
): Promise<LocalCompleto[]> {
  if (!SUPABASE_CONFIGURADO) return buscarNaDemonstracao(filtros);
  const sb = supabase ?? (await createClient());
  const { q, categoria, limite = 200 } = filtros;

  let consulta = sb
    .from("locais")
    .select(CAMPOS)
    .eq("status", "publicado")
    .limit(limite);

  if (categoria) {
    const categorias = await listarCategorias(sb);
    const alvo = categorias.find((c) => c.slug === categoria);
    if (alvo) {
      const filhas = categorias
        .filter((c) => c.pai_id === alvo.id)
        .map((c) => c.id);
      consulta = consulta.in("categoria_id", [alvo.id, ...filhas]);
    }
  }

  if (q && q.trim()) {
    // websearch_to_tsquery entende "pizza -doce" e frases entre aspas.
    consulta = consulta.textSearch("busca", q.trim(), {
      type: "websearch",
      config: "portuguese",
    });
  }

  const { data, error } = await consulta;
  if (error) {
    console.error("Erro ao buscar locais:", error.message);
    return [];
  }

  return afinar(
    (data ?? []).map((l) => montar(l as LinhaBruta)),
    filtros,
  );
}

export async function localPorSlug(
  slug: string,
  supabase?: SupabaseClient,
): Promise<LocalCompleto | null> {
  if (!SUPABASE_CONFIGURADO)
    return LOCAIS_DEMO.find((l) => l.slug === slug) ?? null;
  const sb = supabase ?? (await createClient());
  const { data } = await sb
    .from("locais")
    .select(CAMPOS)
    .eq("slug", slug)
    .maybeSingle();
  return data ? montar(data as LinhaBruta) : null;
}

export async function localPorId(
  id: string,
  supabase?: SupabaseClient,
): Promise<LocalCompleto | null> {
  if (!SUPABASE_CONFIGURADO)
    return LOCAIS_DEMO.find((l) => l.id === id) ?? null;
  const sb = supabase ?? (await createClient());
  const { data } = await sb
    .from("locais")
    .select(CAMPOS)
    .eq("id", id)
    .maybeSingle();
  return data ? montar(data as LinhaBruta) : null;
}

/** Locais parecidos: mesma categoria, tirando o próprio. */
export async function locaisParecidos(
  local: LocalCompleto,
  quantidade = 4,
  supabase?: SupabaseClient,
): Promise<LocalCompleto[]> {
  if (!local.categoria_id) return [];
  if (!SUPABASE_CONFIGURADO)
    return LOCAIS_DEMO.filter(
      (l) => l.categoria_id === local.categoria_id && l.id !== local.id,
    ).slice(0, quantidade);
  const sb = supabase ?? (await createClient());
  const { data } = await sb
    .from("locais")
    .select(CAMPOS)
    .eq("status", "publicado")
    .eq("categoria_id", local.categoria_id)
    .neq("id", local.id)
    .limit(quantidade);
  return (data ?? []).map((l) => montar(l as LinhaBruta));
}
