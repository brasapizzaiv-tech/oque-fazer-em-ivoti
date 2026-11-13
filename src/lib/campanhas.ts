import type { SupabaseClient } from "@supabase/supabase-js";
import { createAdminClient } from "./supabase/admin";
import { slugValido } from "./campanha-link";

// ============================================================
// Campanhas com influenciador
// ============================================================
// Cada campanha tem um link próprio — oquefazeremivoti.com.br/?de=slug —
// e tudo o que o visitante faz depois de chegar por ele é contado também
// na conta da campanha. É o que permite dizer ao comerciante, no fim:
// "desta campanha vieram 340 pessoas, e 51 clicaram no seu WhatsApp".
// ============================================================

export type Campanha = {
  id: string;
  slug: string;
  nome: string;
  influenciador: string | null;
  inicio: string | null;
  fim: string | null;
  locais: string[];
  observacao: string | null;
  criada_em: string;
};

const CAMPOS =
  "id, slug, nome, influenciador, inicio, fim, locais, observacao, criada_em";

/* ------------------------------------------------------------------ */
/* Conferir um link, do lado do servidor                               */
/* ------------------------------------------------------------------ */

// O contador é chamado a cada página e a cada clique. Perguntar ao banco
// toda vez se "juliana-nov" existe seria uma consulta por contagem; a
// resposta muda uma vez por mês, então fica guardada por cinco minutos —
// inclusive o "não existe", para um link inventado não virar consulta
// repetida.
const guardadas = new Map<string, { id: string | null; ate: number }>();
const VALIDADE = 5 * 60 * 1000;

/**
 * O id da campanha deste slug, ou nulo se ela não existe.
 *
 * O link vem do navegador, então qualquer um pode escrever qualquer coisa
 * depois do "?de=". Só conta o que estiver cadastrado: sem isso, a tabela
 * de métricas encheria de campanhas que ninguém criou.
 */
export async function idDaCampanha(
  slug: string | null | undefined,
): Promise<string | null> {
  if (!slug || !slugValido(slug)) return null;
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return null;

  const agora = Date.now();
  const guardada = guardadas.get(slug);
  if (guardada && guardada.ate > agora) return guardada.id;

  try {
    const { data } = await createAdminClient()
      .from("campanhas")
      .select("id")
      .eq("slug", slug)
      .maybeSingle();
    const id = data?.id ?? null;
    guardadas.set(slug, { id, ate: agora + VALIDADE });
    return id;
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Para a tela da administração                                        */
/* ------------------------------------------------------------------ */

export async function listarCampanhas(
  supabase: SupabaseClient,
): Promise<Campanha[]> {
  const { data } = await supabase
    .from("campanhas")
    .select(CAMPOS)
    .order("criada_em", { ascending: false });
  return (data ?? []) as Campanha[];
}

export type RelatorioDaCampanha = {
  /** Quantas visitas começaram pelo link. */
  visitantes: number;
  /** Quantas páginas do guia essas visitas abriram. */
  paginas: number;
  /** O que aconteceu em cada estabelecimento, por tipo de ação. */
  porLocal: Record<string, Record<string, number>>;
};

/**
 * O que a campanha trouxe, somado desde o primeiro dia.
 *
 * As linhas ficam na tabela de métricas com tipo "campanha": o alvo é a
 * campanha, a chave é a ação (site_origem, pagina, clique_whatsapp...) e o
 * local_id diz em qual estabelecimento.
 */
export async function relatoriosDasCampanhas(
  supabase: SupabaseClient,
  ids: string[],
): Promise<Record<string, RelatorioDaCampanha>> {
  const saida: Record<string, RelatorioDaCampanha> = {};
  for (const id of ids) {
    saida[id] = { visitantes: 0, paginas: 0, porLocal: {} };
  }
  if (ids.length === 0) return saida;

  const { data } = await supabase
    .from("metricas_dia")
    .select("alvo, chave, local_id, contagem")
    .eq("tipo", "campanha")
    .in("alvo", ids);

  for (const linha of data ?? []) {
    const r = saida[linha.alvo as string];
    if (!r || !linha.chave) continue;

    if (linha.chave === "site_origem") r.visitantes += linha.contagem;
    else if (linha.chave === "site_pagina") r.paginas += linha.contagem;
    else if (linha.local_id) {
      const doLocal = (r.porLocal[linha.local_id] ??= {});
      doLocal[linha.chave] = (doLocal[linha.chave] ?? 0) + linha.contagem;
    }
  }
  return saida;
}
