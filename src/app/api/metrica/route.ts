import { ehTipoValido, somar, origemDoAcesso } from "@/lib/metricas";
import { ehRobo } from "@/lib/robo";
import { contaAcesso, contaPagina } from "@/lib/site";
import { idDaCampanha } from "@/lib/campanhas";
import { dentroDoLimite, identificar } from "@/lib/limite-chat";

/**
 * Quanto um mesmo visitante pode contar por hora.
 *
 * Uma pessoa navegando de verdade gera algumas dezenas de contagens numa
 * visita longa. O teto existe porque este endereço é público: sem ele,
 * um laço de pedidos inflava os números de um estabelecimento — ou os de
 * uma campanha, que são os que se mostram para vender a próxima cota.
 */
const POR_VISITANTE_POR_HORA = 300;
const NA_CAMPANHA_POR_VISITANTE_POR_HORA = 40;

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

  const visitante = identificar(request);
  if (!(await dentroDoLimite(`metrica:${visitante}`, POR_VISITANTE_POR_HORA))) {
    return new Response(null, { status: 204 });
  }

  try {
    const corpo = (await request.json()) as {
      tipo?: string;
      local?: string;
      alvo?: string;
      chave?: string;
      de?: string;
      campanha?: string;
    };

    if (!corpo.tipo || !ehTipoValido(corpo.tipo)) {
      return new Response(null, { status: 204 });
    }

    // "campanha" e tipo que so o servidor grava. Se o navegador pudesse
    // manda-lo direto, qualquer um inflaria o relatorio de uma campanha —
    // que e o numero usado para vender a proxima cota.
    if (corpo.tipo === "campanha") return new Response(null, { status: 204 });

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
      await contarNaCampanha(visitante, corpo.campanha, "site_origem", null);
      return new Response(null, { status: 204 });
    }

    await somar(corpo.tipo, {
      local: corpo.local,
      alvo: corpo.alvo,
      // O caminho da pagina e o unico texto livre aceito, e cortado curto.
      chave: corpo.chave ? corpo.chave.slice(0, 120) : null,
    });
    await contarNaCampanha(
      visitante,
      corpo.campanha,
      corpo.tipo,
      corpo.local ?? null,
    );
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

/**
 * Soma a mesma acao na conta da campanha de onde a visita veio.
 *
 * E uma segunda linha, ao lado da contagem normal — nunca no lugar dela:
 * os numeros do comerciante e do site continuam inteiros, e a campanha
 * ganha a sua propria conta, com a campanha no alvo, a acao na chave e o
 * estabelecimento no local.
 *
 * So conta campanha cadastrada. O que vem depois do "?de=" e escrito por
 * quem quiser; sem conferir, a tabela encheria de campanha inventada.
 */
async function contarNaCampanha(
  visitante: string,
  slug: string | undefined,
  acao: string,
  local: string | null,
) {
  const campanha = await idDaCampanha(slug);
  if (!campanha) return;

  // O nome da campanha está no link que o influenciador divulga, então
  // qualquer um pode mandá-lo. O teto por visitante é o que impede uma
  // pessoa só de fabricar o relatório.
  if (
    !(await dentroDoLimite(
      `campanha:${campanha}:${visitante}`,
      NA_CAMPANHA_POR_VISITANTE_POR_HORA,
    ))
  ) {
    return;
  }
  await somar("campanha", { alvo: campanha, chave: acao, local });
}
