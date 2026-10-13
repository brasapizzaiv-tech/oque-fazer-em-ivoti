import { ehTipoValido, somar, origemDoAcesso } from "@/lib/metricas";
import { ehRobo } from "@/lib/robo";
import { contaAcesso, contaPagina } from "@/lib/site";

export const runtime = "nodejs";

/**
 * Recebe do navegador o que deve ser contado.
 *
 * Por que do navegador e nao do servidor: as paginas do guia ficam guardadas
 * em cache por alguns minutos para carregar rapido. Se a contagem fosse feita
 * ao montar a pagina, registraria uma visita a cada dois minutos em vez de
 * uma por pessoa.
 *
 * Responde 204 (sem conteudo) sempre, ate quando recusa: quem chamou nao tem
 * nada a fazer com a resposta, e assim um contador nunca vira erro na tela.
 */
export async function POST(request: Request) {
  // Dois filtros antes de qualquer coisa, e os dois respondem 204 igual a
  // uma contagem bem-sucedida: quem chamou nao tem o que fazer com a
  // resposta, e um robo que descobre que foi barrado so tentaria de outro
  // jeito.
  //
  // 1. So conta no site de verdade. O ambiente de desenvolvimento gravava
  //    nesta mesma tabela, e cada tela aberta para conferir largura virava
  //    acesso no painel do comerciante.
  const host = request.headers.get("host");
  if (!contaAcesso(host)) return new Response(null, { status: 204 });

  // 2. So conta gente.
  if (ehRobo(request.headers.get("user-agent")))
    return new Response(null, { status: 204 });

  try {
    const corpo = (await request.json()) as {
      tipo?: string;
      local?: string;
      alvo?: string;
      chave?: string;
      de?: string;
    };

    if (!corpo.tipo || !ehTipoValido(corpo.tipo)) {
      return new Response(null, { status: 204 });
    }

    // 3. Painel, administracao e telas de conta nao sao visita ao guia.
    //    O navegador ja nao manda, mas a regra mora aqui tambem: endereco
    //    publico e quem decide o que entra na conta e o servidor.
    const daPagina = caminhoDoReferer(request.headers.get("referer"));
    if (corpo.tipo === "site_pagina" && !contaPagina(corpo.chave ?? null)) {
      return new Response(null, { status: 204 });
    }
    if (corpo.tipo === "site_origem" && daPagina && !contaPagina(daPagina)) {
      return new Response(null, { status: 204 });
    }

    if (corpo.tipo === "site_origem") {
      // De onde a pessoa veio quem sabe e o navegador, em
      // document.referrer. O cabeçalho "referer" DESTA chamada e sempre a
      // propria pagina do guia, entao a conta antiga so sabia dizer
      // "direto": foram 755 registros, todos iguais, sem uma excecao.
      //
      // Aceitar do navegador abre a porta para alguem escrever "veio do
      // Instagram" sem ter vindo. E um risco pequeno e assumido: o numero
      // e para o dono do site se orientar, nao para cobrar ninguem, e
      // metrica que so sabe dizer uma coisa nao informa nada. O servidor
      // ainda assim so guarda o nome do servidor de origem, curto.
      const host = new URL(request.url).hostname;
      await somar("site_origem", {
        chave: origemDoAcesso(corpo.de ?? null, host).slice(0, 80),
      });
      return new Response(null, { status: 204 });
    }

    await somar(corpo.tipo, {
      local: corpo.local,
      alvo: corpo.alvo,
      // O caminho da pagina e o unico texto livre aceito, e cortado curto.
      chave: corpo.chave ? corpo.chave.slice(0, 120) : null,
    });
  } catch (erro) {
    console.error("Metrica recusada:", erro);
  }

  return new Response(null, { status: 204 });
}

/** O caminho da pagina que fez esta chamada, para saber se ela conta. */
function caminhoDoReferer(referer: string | null): string | null {
  if (!referer) return null;
  try {
    return new URL(referer).pathname;
  } catch {
    return null;
  }
}
