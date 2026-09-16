import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient } from "./supabase/server";
import { SUPABASE_CONFIGURADO } from "./supabase/config";
import { CLIQUES_DE_CONTATO, type TipoMetrica } from "./metricas";
import { hojeEmIvoti } from "./planos";

// ============================================================
// Os números prontos para as telas
// ============================================================
// A tabela guarda linha por dia e por tipo. Aqui ela vira o que o painel
// mostra: total do período, série diária e ranking.
//
// As regras de acesso do banco já limitam o que cada um enxerga — o dono vê
// os locais dele, o admin vê tudo. Por isso usamos o cliente normal, com a
// sessão da pessoa, e não a chave de serviço.
// ============================================================

export type Linha = {
  dia: string;
  tipo: string;
  local_id: string | null;
  alvo: string | null;
  chave: string | null;
  contagem: number;
};

export type ResumoLocal = {
  /** Um ponto por dia do período, inclusive os dias sem nenhum acesso. */
  porDia: { dia: string; contagem: number }[];
  acessos: number;
  indicacoes: number;
  cliques: { tipo: TipoMetrica; contagem: number }[];
  eventosVistos: number;
  promocoesVistas: number;
};

/** A data de N dias atrás, em AAAA-MM-DD, no fuso de Ivoti. */
export function diasAtras(n: number): string {
  const d = new Date(`${hojeEmIvoti()}T12:00:00-03:00`);
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

async function buscarLinhas(
  desde: string,
  filtro: { local?: string; semLocal?: boolean },
  supabase?: SupabaseClient,
): Promise<Linha[]> {
  if (!SUPABASE_CONFIGURADO) return [];
  const sb = supabase ?? (await createClient());

  let consulta = sb
    .from("metricas_dia")
    .select("dia, tipo, local_id, alvo, chave, contagem")
    .gte("dia", desde);

  if (filtro.local) consulta = consulta.eq("local_id", filtro.local);
  if (filtro.semLocal) consulta = consulta.is("local_id", null);

  const { data, error } = await consulta;
  if (error) {
    console.error("Erro ao ler as métricas:", error.message);
    return [];
  }
  return (data ?? []) as Linha[];
}

/** Os números de um estabelecimento nos últimos N dias. */
export async function resumoDoLocal(
  localId: string,
  dias: number,
  supabase?: SupabaseClient,
): Promise<ResumoLocal> {
  const desde = diasAtras(dias - 1);
  const linhas = await buscarLinhas(desde, { local: localId }, supabase);

  const somaPorTipo = (tipo: string) =>
    linhas.filter((l) => l.tipo === tipo).reduce((s, l) => s + l.contagem, 0);

  // Dias sem acesso viram zero em vez de sumir: um gráfico que pula os dias
  // vazios faz uma semana fraca parecer uma semana cheia.
  const porDiaBruto = new Map<string, number>();
  for (const l of linhas.filter((x) => x.tipo === "pagina")) {
    porDiaBruto.set(l.dia, (porDiaBruto.get(l.dia) ?? 0) + l.contagem);
  }

  const porDia: { dia: string; contagem: number }[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const dia = diasAtras(i);
    porDia.push({ dia, contagem: porDiaBruto.get(dia) ?? 0 });
  }

  return {
    porDia,
    acessos: somaPorTipo("pagina"),
    indicacoes: somaPorTipo("indicacao"),
    cliques: CLIQUES_DE_CONTATO.map((tipo) => ({
      tipo,
      contagem: somaPorTipo(tipo),
    }))
      .filter((c) => c.contagem > 0)
      .sort((a, b) => b.contagem - a.contagem),
    eventosVistos: somaPorTipo("evento_visto"),
    promocoesVistas: somaPorTipo("promocao_vista"),
  };
}

export type ResumoDoSite = {
  porDia: { dia: string; contagem: number }[];
  acessos: number;
  paginas: { chave: string; contagem: number }[];
  origens: { chave: string; contagem: number }[];
  locais: { local_id: string; contagem: number }[];
  indicacoes: number;
};

/** Os números do site inteiro — a tela do administrador. */
export async function resumoDoSite(
  dias: number,
  supabase?: SupabaseClient,
): Promise<ResumoDoSite> {
  const desde = diasAtras(dias - 1);
  const sb = supabase ?? (await createClient());

  // Duas buscas: as do site (sem local) e as dos estabelecimentos.
  const [doSite, dosLocais] = await Promise.all([
    buscarLinhas(desde, { semLocal: true }, sb),
    buscarLinhas(desde, {}, sb),
  ]);

  const porChave = (linhas: Linha[], tipo: string) => {
    const mapa = new Map<string, number>();
    for (const l of linhas.filter((x) => x.tipo === tipo && x.chave)) {
      mapa.set(l.chave!, (mapa.get(l.chave!) ?? 0) + l.contagem);
    }
    return [...mapa.entries()]
      .map(([chave, contagem]) => ({ chave, contagem }))
      .sort((a, b) => b.contagem - a.contagem);
  };

  const porDiaBruto = new Map<string, number>();
  for (const l of doSite.filter((x) => x.tipo === "site_pagina")) {
    porDiaBruto.set(l.dia, (porDiaBruto.get(l.dia) ?? 0) + l.contagem);
  }

  const porDia: { dia: string; contagem: number }[] = [];
  for (let i = dias - 1; i >= 0; i--) {
    const dia = diasAtras(i);
    porDia.push({ dia, contagem: porDiaBruto.get(dia) ?? 0 });
  }

  const porLocal = new Map<string, number>();
  for (const l of dosLocais.filter((x) => x.tipo === "pagina" && x.local_id)) {
    porLocal.set(l.local_id!, (porLocal.get(l.local_id!) ?? 0) + l.contagem);
  }

  return {
    porDia,
    acessos: porDia.reduce((s, d) => s + d.contagem, 0),
    paginas: porChave(doSite, "site_pagina"),
    origens: porChave(doSite, "site_origem"),
    locais: [...porLocal.entries()]
      .map(([local_id, contagem]) => ({ local_id, contagem }))
      .sort((a, b) => b.contagem - a.contagem),
    indicacoes: dosLocais
      .filter((l) => l.tipo === "indicacao")
      .reduce((s, l) => s + l.contagem, 0),
  };
}
