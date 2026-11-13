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

/** Palavras que não ajudam a achar nada: saem da busca. */
const PALAVRAS_VAZIAS = new Set([
  "de", "do", "da", "dos", "das", "em", "no", "na", "nos", "nas",
  "para", "pra", "com", "um", "uma", "e", "o", "a", "os", "as",
]);

/**
 * As palavras que o visitante digitou, prontas para comparar: sem acento,
 * em minúsculas e no singular ("pizzas" acha "pizza").
 */
function palavrasDaBusca(q: string): string[] {
  const todas = normalizar(q)
    .split(/[^a-z0-9]+/)
    .filter((p) => p.length >= 2);
  const uteis = todas.filter((p) => !PALAVRAS_VAZIAS.has(p));
  return (uteis.length > 0 ? uteis : todas).map((p) =>
    p.length > 3 && p.endsWith("s") ? p.slice(0, -1) : p,
  );
}

/**
 * O quanto um lugar responde à busca. Zero quer dizer "não é este".
 *
 * Todas as palavras precisam aparecer em algum canto do cadastro. Cada
 * uma vale mais conforme onde foi achada: no nome pesa mais que na
 * categoria, que pesa mais que no texto corrido.
 *
 * A busca é feita aqui, e não no banco, por três motivos que a auditoria
 * de 13/11/2026 mediu: a do banco não achava palavra digitada sem acento
 * ("nucleo", "portico", "sao pedro" davam zero), não olhava a categoria
 * ("hamburgueria" e "museu" davam zero) nem o cardápio. Numa cidade do
 * tamanho de Ivoti a lista inteira cabe na memória com folga.
 */
function pontosNaBusca(
  local: LocalCompleto,
  palavras: string[],
  categoriaPai: string | undefined,
): number {
  const cantos: [number, string][] = [
    [8, local.nome],
    [5, `${local.categoria?.nome ?? ""} ${categoriaPai ?? ""}`],
    [4, local.tags.map((t) => t.nome).join(" ")],
    [3, local.resumo ?? ""],
    [2, local.itens.map((i) => `${i.secao ?? ""} ${i.nome}`).join(" ")],
    [1, `${local.descricao ?? ""} ${local.bairro ?? ""} ${local.endereco ?? ""}`],
  ];
  const prontos = cantos.map(([peso, texto]) => [peso, normalizar(texto)] as const);

  let total = 0;
  for (const palavra of palavras) {
    const achou = prontos.find(([, texto]) => texto.includes(palavra));
    if (!achou) return 0;
    total += achou[0];
  }
  return total;
}

/** Fica só com o que responde à busca, do mais certeiro para o menos. */
function filtrarPorTexto(
  locais: LocalCompleto[],
  q: string | undefined,
  categorias: Categoria[],
): LocalCompleto[] {
  if (!q || !q.trim()) return locais;
  const palavras = palavrasDaBusca(q);
  if (palavras.length === 0) return locais;

  const nomeDaCategoria = new Map(categorias.map((c) => [c.id, c.nome]));

  return locais
    .map((local) => ({
      local,
      pontos: pontosNaBusca(
        local,
        palavras,
        local.categoria?.pai_id != null
          ? nomeDaCategoria.get(local.categoria.pai_id)
          : undefined,
      ),
    }))
    .filter((x) => x.pontos > 0)
    // A ordenação do JavaScript é estável: empate mantém a ordem que já
    // veio (destaque primeiro, depois alfabética).
    .sort((a, b) => b.pontos - a.pontos)
    .map((x) => x.local);
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

  return filtrarPorTexto(afinar(locais, filtros), q, CATEGORIAS_DEMO).slice(
    0,
    limite,
  );
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

/**
 * As categorias principais que têm ao menos um lugar no ar, nela ou numa
 * das filhas.
 *
 * É o que os atalhos da capa e do Explorar mostram. Com a lista inteira,
 * seis dos nove atalhos levavam a "Nada encontrado": o guia oferecia
 * hospedagem, vida noturna e compras sem ter um lugar sequer para mostrar.
 * A categoria volta a aparecer sozinha quando o primeiro lugar dela for
 * publicado.
 */
export async function categoriasComLugar(
  supabase?: SupabaseClient,
): Promise<Categoria[]> {
  let usadas: (number | null)[];
  let categorias: Categoria[];

  if (!SUPABASE_CONFIGURADO) {
    categorias = CATEGORIAS_DEMO;
    usadas = LOCAIS_DEMO.map((l) => l.categoria_id);
  } else {
    const sb = supabase ?? (await createClient());
    // As duas consultas saem juntas, e a página chama esta função ao lado
    // das outras buscas dela: os atalhos não podem custar uma espera a
    // mais na abertura da capa.
    const [todas, { data, error }] = await Promise.all([
      listarCategorias(sb),
      sb.from("locais").select("categoria_id").eq("status", "publicado").limit(1000),
    ]);
    categorias = todas;
    // Na dúvida, mostra todas: atalho que leva a uma lista vazia é ruim,
    // mas capa sem atalho nenhum é pior.
    if (error) return categorias.filter((c) => c.pai_id === null);
    usadas = (data ?? []).map((l) => l.categoria_id as number | null);
  }

  const comLugar = new Set<number>();
  const paiDe = new Map(categorias.map((c) => [c.id, c.pai_id]));
  for (const id of usadas) {
    if (id == null) continue;
    comLugar.add(id);
    const pai = paiDe.get(id);
    if (pai != null) comLugar.add(pai);
  }

  return categorias.filter((c) => c.pai_id === null && comLugar.has(c.id));
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

  // Traz todos os publicados e só corta no fim, depois de filtrar e
  // ordenar. Cortar aqui deixaria de fora lugares que o filtro escolheria.
  let consulta = sb
    .from("locais")
    .select(CAMPOS)
    .eq("status", "publicado")
    .limit(1000);

  const categorias =
    categoria || (q && q.trim()) ? await listarCategorias(sb) : [];

  if (categoria) {
    const alvo = categorias.find((c) => c.slug === categoria);
    if (alvo) {
      const filhas = categorias
        .filter((c) => c.pai_id === alvo.id)
        .map((c) => c.id);
      consulta = consulta.in("categoria_id", [alvo.id, ...filhas]);
    }
  }

  const { data, error } = await consulta;
  if (error) {
    console.error("Erro ao buscar locais:", error.message);
    return [];
  }

  return filtrarPorTexto(
    afinar(
      (data ?? []).map((l) => montar(l as LinhaBruta)),
      filtros,
    ),
    q,
    categorias,
  ).slice(0, limite);
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
