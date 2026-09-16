import { createAdminClient } from "./supabase/admin";

// ============================================================
// Metricas do guia
// ============================================================
// Todo numero que os paineis mostram passa por aqui. A gravacao usa a chave
// de servico porque quem esta contando e um visitante sem conta nenhuma.
//
// Nada disso guarda dado pessoal: sao contadores por dia.
// ============================================================

/** Tudo que o guia sabe contar. */
export const TIPOS = [
  "pagina",
  "clique_telefone",
  "clique_whatsapp",
  "clique_site",
  "clique_instagram",
  "clique_rota",
  "clique_cardapio",
  "evento_visto",
  "promocao_vista",
  "indicacao",
  "site_pagina",
  "site_origem",
] as const;

export type TipoMetrica = (typeof TIPOS)[number];

/** Os cliques que levam a pessoa para fora do guia, direto para o comercio. */
export const CLIQUES_DE_CONTATO: TipoMetrica[] = [
  "clique_telefone",
  "clique_whatsapp",
  "clique_site",
  "clique_instagram",
  "clique_rota",
  "clique_cardapio",
];

/** Como cada tipo aparece escrito nos paineis. */
export const NOME_DO_TIPO: Record<TipoMetrica, string> = {
  pagina: "Acessos à página",
  clique_telefone: "Telefone",
  clique_whatsapp: "WhatsApp",
  clique_site: "Site",
  clique_instagram: "Instagram",
  clique_rota: "Como chegar",
  clique_cardapio: "Cardápio",
  evento_visto: "Eventos vistos",
  promocao_vista: "Promoções vistas",
  indicacao: "Indicações do Guia",
  site_pagina: "Páginas do site",
  site_origem: "Origem dos acessos",
};

export function ehTipoValido(valor: string): valor is TipoMetrica {
  return (TIPOS as readonly string[]).includes(valor);
}

/**
 * Soma 1 no contador do dia.
 *
 * Nunca lanca erro: metrica e informacao de apoio, e derrubar a navegacao de
 * um visitante por causa de um contador seria trocar o essencial pelo
 * acessorio.
 */
export async function somar(
  tipo: TipoMetrica,
  onde: { local?: string | null; alvo?: string | null; chave?: string | null } = {},
): Promise<void> {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;

  try {
    await createAdminClient().rpc("somar_metrica", {
      p_tipo: tipo,
      p_local: onde.local ?? null,
      p_alvo: onde.alvo ?? null,
      p_chave: onde.chave ?? null,
      p_quanto: 1,
    });
  } catch (erro) {
    console.error(`Nao consegui contar "${tipo}":`, erro);
  }
}

/**
 * De onde o visitante veio, resumido ao nome do site.
 *
 * "https://www.google.com/search?q=..." vira "google.com". Quem chegou
 * digitando o endereco ou por link sem origem vira "direto". Guardar so isso
 * evita registrar o caminho completo, que as vezes carrega o que a pessoa
 * pesquisou.
 */
export function origemDoAcesso(referer: string | null, proprioHost: string): string {
  if (!referer) return "direto";
  try {
    const host = new URL(referer).hostname.replace(/^www\./, "");
    if (host === proprioHost.replace(/^www\./, "")) return "direto";
    return host;
  } catch {
    return "direto";
  }
}
