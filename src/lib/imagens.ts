import { cache } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient, createClientPublico } from "./supabase/server";
import { SUPABASE_CONFIGURADO } from "./supabase/config";

// ============================================================
// As imagens do site
// ============================================================
// A foto de fundo e as capas das telas, trocáveis pelo painel. Enquanto
// estavam escritas no código, trocar qualquer uma exigia publicar o site
// — e por isso as duas únicas fotos do projeto vestiam dez telas.
// ============================================================

export type ChaveDeImagem =
  | "fundo"
  | "capa-inicio"
  | "capa-explorar"
  | "capa-agenda"
  | "capa-mapa"
  | "capa-roteiros"
  | "capa-caminhos"
  | "capa-conta";

/**
 * A foto que cada lugar usa quando ninguém subiu outra.
 *
 * Fica no código de propósito: tela sem imagem é tela quebrada, e um
 * cadastro em branco não pode causar isso. O painel substitui, não
 * preenche um vazio.
 */
export const PADRAO: Record<ChaveDeImagem, string> = {
  fundo: "/fotos/eu-amo-ivoti.jpg",
  "capa-inicio": "/fotos/portico-ivoti.jpg",
  "capa-explorar": "/fotos/portico-ivoti.jpg",
  "capa-agenda": "/fotos/portico-ivoti.jpg",
  "capa-mapa": "/fotos/portico-ivoti.jpg",
  "capa-roteiros": "/fotos/eu-amo-ivoti.jpg",
  "capa-caminhos": "/fotos/portico-ivoti.jpg",
  "capa-conta": "/fotos/eu-amo-ivoti.jpg",
};

export type ImagemCadastrada = {
  chave: string;
  url: string | null;
  descricao: string;
  ordem: number;
};

/**
 * O que está cadastrado, já misturado com os padrões.
 *
 * Envolvido em `cache` porque várias telas pedem na mesma renderização —
 * o layout quer o fundo, a página quer a própria capa. Sem isso seriam
 * duas consultas para a mesma resposta.
 *
 * Lê sem cookie: as imagens são iguais para todo mundo, e ler cookie
 * tiraria as páginas do cache.
 */
export const imagensDoSite = cache(
  async (): Promise<Record<ChaveDeImagem, string>> => {
    if (!SUPABASE_CONFIGURADO) return { ...PADRAO };

    const { data, error } = await createClientPublico()
      .from("imagens_do_site")
      .select("chave, url");

    if (error) {
      // Uma consulta que falha não pode deixar o site sem imagem.
      console.error("Nao consegui ler as imagens do site:", error.message);
      return { ...PADRAO };
    }

    const escolhidas = { ...PADRAO };
    for (const linha of data ?? []) {
      const chave = linha.chave as ChaveDeImagem;
      if (linha.url && chave in escolhidas) escolhidas[chave] = linha.url;
    }
    return escolhidas;
  },
);

/** Uma imagem só, pelo nome. */
export async function imagemDoSite(chave: ChaveDeImagem): Promise<string> {
  return (await imagensDoSite())[chave];
}

/** A lista para a tela da administração, com descrição e ordem. */
export async function listarImagens(
  supabase?: SupabaseClient,
): Promise<ImagemCadastrada[]> {
  if (!SUPABASE_CONFIGURADO) return [];
  const sb = supabase ?? (await createClient());
  const { data } = await sb
    .from("imagens_do_site")
    .select("chave, url, descricao, ordem")
    .order("ordem");
  return (data ?? []) as ImagemCadastrada[];
}
