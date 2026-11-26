import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";
import { SUPABASE_CONFIGURADO } from "./supabase/config";
import { CATEGORIAS_DEMO, LOCAIS_DEMO, TAGS_DEMO } from "./demo";
import type { Categoria, LocalCompleto, Tag } from "./tipos";
import { agoraNaCidade, situacao } from "./horarios";
import { normalizar } from "./texto";
import { aindaNoAr } from "./planos";
import { categoriasDoLugar, outrasCategorias } from "./categorias";

// Tudo que a pagina de um local (e o chat) precisam, em uma consulta so.
const CAMPOS = `
  *,
  categoria:categorias(*),
  horarios:locais_horarios(dia_semana, abre, fecha, observacao),
  fotos:locais_fotos(id, url, legenda, ordem),
  itens:locais_itens(id, secao, nome, descricao, preco, ordem),
  cardapio_fotos:locais_cardapio_fotos(id, url, largura, altura, ordem),
  locais_tags(tag:tags(*))
`;

type LinhaBruta = Record<string, unknown> & {
  locais_tags?: { tag: Tag | null }[] | null;
  fotos?: LocalCompleto["fotos"] | null;
  itens?: LocalCompleto["itens"] | null;
  cardapio_fotos?: LocalCompleto["cardapio_fotos"] | null;
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
  /** Os nomes de todas as categorias do lugar e das categorias-mãe delas. */
  nomesDeCategoria: string,
): number {
  const cantos: [number, string][] = [
    [8, local.nome],
    [5, nomesDeCategoria],
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

  const porId = new Map(categorias.map((c) => [c.id, c]));

  // A principal, as outras e a categoria-mãe de cada uma: quem digita
  // "padaria" acha o café colonial que também é padaria, e quem digita
  // "comer" acha os dois.
  const nomesDeCategoria = (local: LocalCompleto) =>
    [local.categoria, ...local.outras_categorias]
      .filter((c): c is Categoria => Boolean(c))
      .flatMap((c) => [
        c.nome,
        c.pai_id != null ? (porId.get(c.pai_id)?.nome ?? "") : "",
      ])
      .join(" ");

  return locais
    .map((local) => ({
      local,
      pontos: pontosNaBusca(local, palavras, nomesDeCategoria(local)),
    }))
    .filter((x) => x.pontos > 0)
    // A ordenação do JavaScript é estável: empate mantém a ordem que já
    // veio (destaque primeiro, depois alfabética).
    .sort((a, b) => b.pontos - a.pontos)
    .map((x) => x.local);
}

/**
 * Só os lugares desta categoria ou das filhas dela.
 *
 * Vale a principal e vale qualquer uma das outras: o lugar que é café
 * colonial e padaria aparece nos dois filtros.
 */
function naCategoria(
  locais: LocalCompleto[],
  alvo: Categoria,
  categorias: Categoria[],
): LocalCompleto[] {
  const ids = new Set([
    alvo.id,
    ...categorias.filter((c) => c.pai_id === alvo.id).map((c) => c.id),
  ]);
  return locais.filter((l) => categoriasDoLugar(l).some((id) => ids.has(id)));
}

/** Busca nos locais de demonstração, imitando o que o banco faria. */
function buscarNaDemonstracao(filtros: FiltrosBusca): LocalCompleto[] {
  const { q, categoria, limite = 200 } = filtros;
  let locais = LOCAIS_DEMO;

  if (categoria) {
    const alvo = CATEGORIAS_DEMO.find((c) => c.slug === categoria);
    if (alvo) {
      locais = naCategoria(locais, alvo, CATEGORIAS_DEMO);
    }
  }

  return filtrarPorTexto(afinar(locais, filtros), q, CATEGORIAS_DEMO).slice(
    0,
    limite,
  );
}

/**
 * Arruma a linha crua do banco no formato que o site usa.
 *
 * A lista de categorias vem junto porque as "outras categorias" do lugar
 * são guardadas só pelo número: é aqui que elas ganham nome e emoji.
 */
function montar(linha: LinhaBruta, categorias: Categoria[]): LocalCompleto {
  const tags = (linha.locais_tags ?? [])
    .map((lt) => lt.tag)
    .filter((t): t is Tag => Boolean(t))
    .sort((a, b) => a.ordem - b.ordem);

  const fotos = [...(linha.fotos ?? [])].sort((a, b) => a.ordem - b.ordem);
  const itens = [...(linha.itens ?? [])].sort((a, b) => a.ordem - b.ordem);
  const cardapio_fotos = [...(linha.cardapio_fotos ?? [])].sort(
    (a, b) => a.ordem - b.ordem,
  );
  const horarios = [...(linha.horarios ?? [])];

  const { locais_tags: _ignorar, ...resto } = linha;
  void _ignorar;

  const categoria_id = (resto.categoria_id as number | null) ?? null;
  const categorias_extras = (resto.categorias_extras as number[] | null) ?? [];

  return {
    ...resto,
    categorias_extras,
    outras_categorias: outrasCategorias(
      { categoria_id, categorias_extras },
      categorias,
    ),
    tags,
    fotos,
    itens,
    cardapio_fotos,
    horarios,
  } as LocalCompleto;
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
  let usadas: number[];
  let categorias: Categoria[];

  if (!SUPABASE_CONFIGURADO) {
    categorias = CATEGORIAS_DEMO;
    usadas = LOCAIS_DEMO.flatMap((l) => categoriasDoLugar(l));
  } else {
    const sb = supabase ?? (await createClient());
    // As duas consultas saem juntas, e a página chama esta função ao lado
    // das outras buscas dela: os atalhos não podem custar uma espera a
    // mais na abertura da capa.
    const [todas, { data, error }] = await Promise.all([
      listarCategorias(sb),
      sb
        .from("locais")
        .select("categoria_id, categorias_extras")
        .eq("status", "publicado")
        .or(aindaNoAr())
        .limit(1000),
    ]);
    categorias = todas;
    // Na dúvida, mostra todas: atalho que leva a uma lista vazia é ruim,
    // mas capa sem atalho nenhum é pior.
    if (error) return categorias.filter((c) => c.pai_id === null);
    // Conta a principal e as outras: o atalho "Compras" aparece se um
    // restaurante também se cadastrou como loja.
    usadas = (data ?? []).flatMap((l) =>
      categoriasDoLugar(l as { categoria_id: number | null; categorias_extras: number[] | null }),
    );
  }

  const comLugar = new Set<number>();
  const paiDe = new Map(categorias.map((c) => [c.id, c.pai_id]));
  for (const id of usadas) {
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
  // As categorias saem junto com os lugares, na mesma espera: é com elas
  // que as "outras categorias" de cada lugar ganham nome.
  const [categorias, { data, error }] = await Promise.all([
    listarCategorias(sb),
    sb
      .from("locais")
      .select(CAMPOS)
      .eq("status", "publicado")
      .or(aindaNoAr())
      .limit(1000),
  ]);
  if (error) {
    console.error("Erro ao buscar locais:", error.message);
    return [];
  }

  let locais = (data ?? []).map((l) => montar(l as LinhaBruta, categorias));

  // O filtro de categoria é feito aqui, e não no banco, pelo mesmo motivo
  // das etiquetas: a lista inteira já está na mão, e a regra ("a principal
  // ou qualquer uma das outras, nela ou nas filhas") fica num lugar só.
  if (categoria) {
    const alvo = categorias.find((c) => c.slug === categoria);
    if (alvo) locais = naCategoria(locais, alvo, categorias);
  }

  return filtrarPorTexto(afinar(locais, filtros), q, categorias).slice(
    0,
    limite,
  );
}

export async function localPorSlug(
  slug: string,
  supabase?: SupabaseClient,
): Promise<LocalCompleto | null> {
  if (!SUPABASE_CONFIGURADO)
    return LOCAIS_DEMO.find((l) => l.slug === slug) ?? null;
  const sb = supabase ?? (await createClient());
  const [categorias, { data }] = await Promise.all([
    listarCategorias(sb),
    sb.from("locais").select(CAMPOS).eq("slug", slug).maybeSingle(),
  ]);
  return data ? montar(data as LinhaBruta, categorias) : null;
}

export async function localPorId(
  id: string,
  supabase?: SupabaseClient,
): Promise<LocalCompleto | null> {
  if (!SUPABASE_CONFIGURADO)
    return LOCAIS_DEMO.find((l) => l.id === id) ?? null;
  const sb = supabase ?? (await createClient());
  const [categorias, { data }] = await Promise.all([
    listarCategorias(sb),
    sb.from("locais").select(CAMPOS).eq("id", id).maybeSingle(),
  ]);
  return data ? montar(data as LinhaBruta, categorias) : null;
}

/**
 * Locais parecidos: os que têm alguma categoria em comum, tirando o
 * próprio. Vale a principal e valem as outras, dos dois lados: a padaria
 * aparece como parecida do café colonial que também é padaria.
 */
export async function locaisParecidos(
  local: LocalCompleto,
  quantidade = 4,
  supabase?: SupabaseClient,
): Promise<LocalCompleto[]> {
  const ids = categoriasDoLugar(local);
  if (ids.length === 0) return [];
  if (!SUPABASE_CONFIGURADO)
    return LOCAIS_DEMO.filter(
      (l) =>
        l.id !== local.id &&
        categoriasDoLugar(l).some((id) => ids.includes(id)),
    ).slice(0, quantidade);
  const sb = supabase ?? (await createClient());
  const lista = ids.join(",");
  const [categorias, { data }] = await Promise.all([
    listarCategorias(sb),
    sb
      .from("locais")
      .select(CAMPOS)
      .eq("status", "publicado")
      .or(aindaNoAr())
      // "ov" é "tem algum em comum": a lista de outras categorias do lugar
      // cruza com as categorias deste.
      .or(`categoria_id.in.(${lista}),categorias_extras.ov.{${lista}}`)
      .neq("id", local.id)
      .limit(quantidade),
  ]);
  return (data ?? []).map((l) => montar(l as LinhaBruta, categorias));
}
