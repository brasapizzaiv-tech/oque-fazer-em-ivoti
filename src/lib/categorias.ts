import type { Categoria } from "./tipos";

// ============================================================
// Mais de uma categoria por lugar
// ============================================================
// Um lugar tem uma categoria principal e até duas outras. A principal é a
// que aparece junto do nome, dá o emoji do pino no mapa e diz ao buscador
// que tipo de lugar é. As outras fazem o lugar aparecer também nos
// filtros e na busca delas: o café colonial que é padaria e confeitaria
// tem de ser achado por quem procura qualquer uma das três.
//
// Este arquivo não fala com o banco, de propósito: os formulários do
// painel rodam no navegador e precisam das mesmas contas.
// ============================================================

/**
 * Quantas categorias cabem além da principal. O mesmo 2 está no banco
 * (migration 0031), que recusa a terceira.
 */
export const MAXIMO_DE_CATEGORIAS_EXTRAS = 2;

type ComCategorias = {
  categoria_id: number | null;
  /** Pode faltar em quem foi lido com uma lista de campos enxuta. */
  categorias_extras?: number[] | null;
};

/** Todas as categorias do lugar, a principal primeiro, sem repetir. */
export function categoriasDoLugar(local: ComCategorias): number[] {
  const todas = [local.categoria_id, ...(local.categorias_extras ?? [])];
  return [...new Set(todas.filter((id): id is number => id != null))];
}

/** As outras categorias do lugar, já com nome e emoji, na ordem escolhida. */
export function outrasCategorias(
  local: ComCategorias,
  categorias: Categoria[],
): Categoria[] {
  const porId = new Map(categorias.map((c) => [c.id, c]));
  return categoriasDoLugar(local)
    .filter((id) => id !== local.categoria_id)
    .map((id) => porId.get(id))
    .filter((c): c is Categoria => Boolean(c));
}

/** "Café colonial · Padaria · Café e confeitaria" */
export function nomesDasCategorias(local: {
  categoria: Categoria | null;
  outras_categorias?: Categoria[] | null;
}): string {
  return [local.categoria, ...(local.outras_categorias ?? [])]
    .filter((c): c is Categoria => Boolean(c))
    .map((c) => c.nome)
    .join(" · ");
}
