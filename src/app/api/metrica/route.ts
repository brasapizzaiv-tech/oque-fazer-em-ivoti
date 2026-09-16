import { ehTipoValido, somar, origemDoAcesso } from "@/lib/metricas";

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
  try {
    const corpo = (await request.json()) as {
      tipo?: string;
      local?: string;
      alvo?: string;
      chave?: string;
    };

    if (!corpo.tipo || !ehTipoValido(corpo.tipo)) {
      return new Response(null, { status: 204 });
    }

    // A origem o servidor descobre sozinho; nao se aceita do navegador, senao
    // qualquer um poderia inflar "veio do Instagram" sem ter vindo de la.
    if (corpo.tipo === "site_origem") {
      const host = new URL(request.url).hostname;
      await somar("site_origem", {
        chave: origemDoAcesso(request.headers.get("referer"), host),
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
