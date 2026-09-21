import type { SupabaseClient } from "@supabase/supabase-js";
import { createClient, createClientPublico } from "./supabase/server";
import { SUPABASE_CONFIGURADO } from "./supabase/config";
import { hojeEmIvoti } from "./planos";

// ============================================================
// Temas das feiras
// ============================================================
// Durante a feira o site veste a roupa da festa. Comeca e termina
// sozinho, pela data: ninguem precisa lembrar de desligar na segunda de
// manha, que e justamente quando ninguem lembra.
// ============================================================

export type Tema = {
  id: string;
  slug: string;
  nome: string;
  subtitulo: string | null;
  inicio: string | null;
  fim: string | null;
  cor: string;
  cor_destaque: string | null;
  cor_escura: string | null;
  logo_url: string | null;
  capa_url: string | null;
  programacao: string | null;
  expositores: string | null;
  onde: string | null;
  lat: number | null;
  lng: number | null;
  link_programacao: string | null;
  locais: string[];
  publicado: boolean;
};

const CAMPOS =
  "id, slug, nome, subtitulo, inicio, fim, cor, cor_destaque, cor_escura, logo_url, capa_url, programacao, expositores, onde, lat, lng, link_programacao, locais, publicado";

/**
 * O tema que está valendo hoje, ou nada.
 *
 * A comparação é por data de Ivoti e não pela do servidor: a Vercel roda
 * em UTC, e no fim da noite de uma sexta de feira lá já é sábado — o site
 * trocaria de roupa três horas antes da hora.
 *
 * Se dois temas se sobrepuserem por engano, vence o que começou por
 * último: é o que a pessoa que cadastrou provavelmente quis dizer.
 */
export async function temaAtivo(
  supabase?: SupabaseClient,
): Promise<Tema | null> {
  if (!SUPABASE_CONFIGURADO) return null;
  // Sem cookie: o tema e igual para todo mundo, e ler cookie tiraria o
  // site inteiro do cache.
  const sb = supabase ?? createClientPublico();
  const hoje = hojeEmIvoti();

  const { data, error } = await sb
    .from("temas")
    .select(CAMPOS)
    .eq("publicado", true)
    .not("inicio", "is", null)
    .not("fim", "is", null)
    .lte("inicio", hoje)
    .gte("fim", hoje)
    .order("inicio", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    // Um tema que não carrega não pode derrubar a capa do site: sem ele a
    // página continua no desenho de sempre.
    console.error("Nao consegui ler o tema ativo:", error.message);
    return null;
  }

  return (data as Tema) ?? null;
}

/** Todos os temas, para a administração. */
export async function listarTemas(supabase?: SupabaseClient): Promise<Tema[]> {
  if (!SUPABASE_CONFIGURADO) return [];
  const sb = supabase ?? (await createClient());
  const { data } = await sb
    .from("temas")
    .select(CAMPOS)
    .order("inicio", { ascending: false, nullsFirst: false })
    .order("nome");
  return (data ?? []) as Tema[];
}

export async function temaPorSlug(
  slug: string,
  supabase?: SupabaseClient,
): Promise<Tema | null> {
  if (!SUPABASE_CONFIGURADO) return null;
  const sb = supabase ?? (await createClient());
  const { data } = await sb
    .from("temas")
    .select(CAMPOS)
    .eq("slug", slug)
    .maybeSingle();
  return (data as Tema) ?? null;
}

/* ------------------------------------------------------------------ */
/* Cor                                                                 */
/* ------------------------------------------------------------------ */

/** "#3E7A3C" vira "62 122 60", que é como o CSS recebe uma cor com alfa. */
export function emRgb(hex: string): string {
  const h = hex.replace("#", "").trim();
  const cheio =
    h.length === 3
      ? h
          .split("")
          .map((c) => c + c)
          .join("")
      : h;
  const n = Number.parseInt(cheio, 16);
  if (!Number.isFinite(n)) return "31 78 156";
  return `${(n >> 16) & 255} ${(n >> 8) & 255} ${n & 255}`;
}

/** O brilho de uma cor, na conta que a norma de contraste usa. */
function brilho([r, g, b]: number[]): number {
  const canal = (c: number) => {
    const v = c / 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * canal(r) + 0.7152 * canal(g) + 0.0722 * canal(b);
}

/**
 * Quanto do vidro precisa ser cor para o texto branco continuar legível.
 *
 * O azul do site é escuro e passa com 78% de cor. As feiras não: o verde
 * da Feira das Flores e o terracota da Feira do Mel são mais claros, e a
 * 78% o branco em cima deles dá 3,4 de contraste — abaixo dos 4,5 que
 * texto pequeno precisa. Como a cor muda a cada feira, a conta também tem
 * de mudar, em vez de um número fixo escolhido para o azul.
 *
 * O pior caso é o mesmo de sempre: um pixel claro da foto de fundo, que
 * neste site é o letreiro branco do "Eu amo Ivoti".
 */
export function alfaDoVidro(hex: string): number {
  const cor = emRgb(hex).split(" ").map(Number);
  // a foto clara, já sob o véu de 70%
  const fundo = [250, 247, 241].map((c) => Math.round(0.7 * c + 0.3 * 255));

  for (let a = 78; a <= 96; a++) {
    const composta = cor.map((c, i) =>
      Math.round((a / 100) * c + (1 - a / 100) * fundo[i]),
    );
    const contraste = (1 + 0.05) / (brilho(composta) + 0.05);
    if (contraste >= 4.5) return a / 100;
  }
  // Cor clara demais para receber texto branco em qualquer opacidade. O
  // limite evita um vidro opaco: quem cadastrar amarelo-claro vai ver que
  // não dá, em vez de o site fingir que deu.
  return 0.96;
}

/**
 * As variáveis que o tema troca no site inteiro.
 *
 * O vermelho da ação principal NÃO muda — é ele que diz "aperte aqui" em
 * todo o site, e trocá-lo durante a feira faria a pessoa reaprender o
 * botão na semana em que mais gente nova chega.
 */
export function variaveisDoTema(tema: Tema): Record<string, string> {
  return {
    "--color-v-azul": tema.cor,
    "--vidro-azul-rgb": emRgb(tema.cor),
    "--vidro-azul-alfa": String(alfaDoVidro(tema.cor)),
    "--color-v-tema-destaque": tema.cor_destaque ?? "#FFFFFF",
  };
}

/** Quebra a programação ou a lista de expositores em linhas. */
export function emLinhas(texto: string | null): string[] {
  if (!texto) return [];
  return texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
}

/** "12 a 15 de outubro" — o período do selo, por extenso. */
export function periodoPorExtenso(tema: Tema): string | null {
  if (!tema.inicio || !tema.fim) return null;

  const dia = (d: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      day: "numeric",
    }).format(new Date(`${d}T12:00:00-03:00`));

  const mes = (d: string) =>
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      month: "long",
    }).format(new Date(`${d}T12:00:00-03:00`));

  if (tema.inicio === tema.fim)
    return `${dia(tema.inicio)} de ${mes(tema.inicio)}`;

  // Dentro do mesmo mês não repete o mês: "12 a 15 de outubro".
  return mes(tema.inicio) === mes(tema.fim)
    ? `${dia(tema.inicio)} a ${dia(tema.fim)} de ${mes(tema.fim)}`
    : `${dia(tema.inicio)} de ${mes(tema.inicio)} a ${dia(tema.fim)} de ${mes(tema.fim)}`;
}
