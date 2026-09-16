import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";
import { SUPABASE_CONFIGURADO } from "./supabase/config";

// ============================================================
// Eventos visíveis
// ============================================================
// A agenda, a página do local, o Explorar e o Gui perguntam aqui. Antes cada
// um montava a própria consulta, e "publicado" corria o risco de significar
// uma coisa em cada tela.
//
// A regra de visibilidade em si mora no banco, na função eventos_visiveis:
// está publicado, a data de publicação já chegou, e ainda não passou (com
// seis horas de folga, porque um evento das 14h ainda interessa às 16h).
// ============================================================

export type EventoNaTela = {
  id: string;
  titulo: string;
  descricao: string | null;
  inicio: string;
  fim: string | null;
  local_id: string | null;
  local_texto: string | null;
  imagem_url: string | null;
  url: string | null;
  local: { slug: string; nome: string; categoria_id: number | null } | null;
};

export type FiltroEventos = {
  /** Só os deste estabelecimento. */
  local?: string;
  /** Só os que acontecem até esta data (AAAA-MM-DD, incluindo o dia todo). */
  ate?: string;
  /** Só os de estabelecimentos desta categoria ou das filhas dela. */
  categorias?: number[];
  limite?: number;
};

export async function eventosVisiveis(
  filtro: FiltroEventos = {},
  supabase?: SupabaseClient,
): Promise<EventoNaTela[]> {
  if (!SUPABASE_CONFIGURADO) return [];

  const sb = supabase ?? (await createClient());
  const { local, ate, categorias, limite = 40 } = filtro;

  // A função do banco devolve os eventos crus; o join com locais vem depois,
  // porque função que retorna tabela não aceita "select" encadeado.
  const { data, error } = await sb.rpc("eventos_visiveis");
  if (error) {
    console.error("Erro ao buscar eventos:", error.message);
    return [];
  }

  let eventos = (data ?? []) as EventoNaTela[];
  if (local) eventos = eventos.filter((e) => e.local_id === local);

  if (ate) {
    // Até o fim daquele dia, em Ivoti.
    const limiteData = new Date(`${ate}T23:59:59-03:00`).toISOString();
    eventos = eventos.filter((e) => e.inicio <= limiteData);
  }

  if (eventos.length === 0) return [];

  // Traz o nome e a categoria do local de uma vez só.
  const ids = [...new Set(eventos.map((e) => e.local_id).filter(Boolean))];
  const porId = new Map<string, EventoNaTela["local"]>();

  if (ids.length > 0) {
    const { data: locais } = await sb
      .from("locais")
      .select("id, slug, nome, categoria_id")
      .in("id", ids as string[]);

    for (const l of locais ?? []) {
      porId.set(l.id, {
        slug: l.slug,
        nome: l.nome,
        categoria_id: l.categoria_id,
      });
    }
  }

  eventos = eventos.map((e) => ({
    ...e,
    local: e.local_id ? (porId.get(e.local_id) ?? null) : null,
  }));

  if (categorias && categorias.length > 0) {
    // Evento sem local cadastrado (feira de rua) não tem categoria, então sai
    // quando o visitante filtra por uma.
    eventos = eventos.filter(
      (e) => e.local?.categoria_id != null && categorias.includes(e.local.categoria_id),
    );
  }

  return eventos.slice(0, limite);
}
