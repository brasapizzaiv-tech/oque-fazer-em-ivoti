import Anthropic from "@anthropic-ai/sdk";
import { catalogo } from "@/lib/catalogo";
import { respostaDemo } from "@/lib/demo";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
export const maxDuration = 60;

// Modelo configuravel: da pra trocar por um mais barato (claude-sonnet-5 ou
// claude-haiku-4-5) sem mexer no codigo, so mudando a variavel na Vercel.
// Usa "||" e nao "??" de proposito: uma variavel vazia (CHAT_MODELO=) tem que
// cair no padrao, e o "??" so cairia se ela nao existisse.
const MODELO = process.env.CHAT_MODELO || "claude-opus-5";

// O parametro de esforco (o quanto o modelo "pensa" antes de responder) so
// existe nos modelos maiores. Mandar ele pro Haiku 4.5 devolve erro 400, entao
// so mandamos pra quem aceita — e, na duvida, nao mandamos.
const FAMILIAS_COM_ESFORCO = ["claude-opus-", "claude-sonnet-5", "claude-fable-"];
const ACEITA_ESFORCO = FAMILIAS_COM_ESFORCO.some((f) => MODELO.startsWith(f));

const INSTRUCOES = `Voce e o guia do site "O que fazer em Ivoti" — um amigo local que conhece a cidade inteira e adora dar dica boa.

COMO VOCE FALA
- Portugues do Brasil, informal e caloroso, com o jeito gaucho do interior (sem exagero, nada de caricatura).
- Animado e espontaneo, como quem esta genuinamente empolgado em mostrar a cidade. Frases curtas.
- Emoji com moderacao: um ou dois por resposta, quando cabe.
- Nunca soa como catalogo ou robo. Voce recomenda, nao lista.

REGRA DE OURO
- Voce SO pode indicar locais que estao na lista abaixo. Nunca invente estabelecimento, endereco, preco, horario ou telefone.
- Se nao tem nada que sirva, fale a verdade com leveza e ofereca a coisa mais proxima que existe.

COMO CITAR UM LOCAL
- Sempre escreva o nome seguido do marcador entre colchetes duplos, exatamente como aparece na lista. Exemplo: "A Pizzaria do Ze [[pizzaria-do-ze]] ta aberta ate meia-noite".
- O site transforma esse marcador num cartao clicavel com foto. Use no maximo 4 por resposta.

O QUE LEVAR EM CONTA
- A hora e o dia de hoje (estao no topo da lista). Se o lugar esta fechado agora, diga e sugira alternativa aberta, ou avise que hora abre.
- O que a pessoa pediu: tipo de comida, clima do rolê, com crianca, ao ar livre, barato, romantico, pet.
- Se a pessoa for vaga ("o que fazer hoje?"), monte uma sugestao de programa com 2 ou 3 paradas em vez de fazer um monte de pergunta. Uma pergunta de volta, no maximo.

TAMANHO
- Respostas curtas: 2 a 5 frases, ou uma listinha de ate 4 itens. Nada de textao.`;

export async function POST(request: Request) {
  let corpo: { mensagens?: { papel: string; texto: string }[]; sessao?: string };
  try {
    corpo = await request.json();
  } catch {
    return Response.json({ erro: "Pedido invalido." }, { status: 400 });
  }

  const mensagens = (corpo.mensagens ?? [])
    .filter((m) => m && typeof m.texto === "string" && m.texto.trim())
    .slice(-12);

  if (mensagens.length === 0) {
    return Response.json({ erro: "Sem mensagem." }, { status: 400 });
  }

  const ultima = mensagens[mensagens.length - 1]?.texto ?? "";

  // Sem a chave da Anthropic o guia de verdade nao roda. Em vez de dar erro,
  // responde no modo demonstracao — mesmo formato, inteligencia bem menor.
  if (!process.env.ANTHROPIC_API_KEY) {
    return respostaEmLetras(respostaDemo(ultima));
  }

  const { texto: lista } = await catalogo();
  const cliente = new Anthropic();

  const stream = cliente.messages.stream({
    model: MODELO,
    max_tokens: 1200,
    ...(ACEITA_ESFORCO ? { output_config: { effort: "low" as const } } : {}),
    system: [
      // A parte estavel vai primeiro e fica em cache: barateia bastante,
      // porque o catalogo inteiro se repete em toda conversa.
      { type: "text", text: INSTRUCOES },
      {
        type: "text",
        text: `LOCAIS DO GUIA\n\n${lista}`,
        cache_control: { type: "ephemeral" },
      },
    ],
    messages: mensagens.map((m) => ({
      role: m.papel === "guia" ? ("assistant" as const) : ("user" as const),
      content: m.texto,
    })),
  });

  const codificador = new TextEncoder();
  let resposta = "";

  const corpoResposta = new ReadableStream({
    async start(controle) {
      try {
        for await (const evento of stream) {
          if (
            evento.type === "content_block_delta" &&
            evento.delta.type === "text_delta"
          ) {
            resposta += evento.delta.text;
            controle.enqueue(codificador.encode(evento.delta.text));
          }
        }
      } catch (erro) {
        console.error("Erro no chat:", erro);
        controle.enqueue(
          codificador.encode(
            "\n\nOpa, deu um problema aqui do meu lado. Tenta de novo?",
          ),
        );
      } finally {
        controle.close();
        void registrar(
          corpo.sessao,
          mensagens[mensagens.length - 1]?.texto ?? "",
          resposta,
        );
      }
    },
  });

  return new Response(corpoResposta, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/**
 * Manda um texto pronto letra por letra, com um respiro entre elas — assim o
 * modo demonstracao aparece na tela igualzinho ao guia de verdade.
 */
function respostaEmLetras(texto: string) {
  const codificador = new TextEncoder();

  const fluxo = new ReadableStream({
    async start(controle) {
      // Array.from separa por caractere de verdade: cortar por indice
      // partiria um emoji no meio (ele ocupa duas posicoes) e chegaria
      // quebrado na tela.
      const letras = Array.from(texto);
      for (let i = 0; i < letras.length; i += 3) {
        controle.enqueue(codificador.encode(letras.slice(i, i + 3).join("")));
        await new Promise((r) => setTimeout(r, 12));
      }
      controle.close();
    },
  });

  return new Response(fluxo, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

/** Guarda a conversa pra voce ver depois o que o pessoal anda procurando. */
async function registrar(
  sessao: string | undefined,
  pergunta: string,
  resposta: string,
) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) return;
  try {
    const citados = [...resposta.matchAll(/\[\[([a-z0-9-]+)\]\]/g)].map(
      (m) => m[1],
    );
    const admin = createAdminClient();
    const { data } = await admin
      .from("locais")
      .select("id")
      .in("slug", citados.length ? citados : ["-"]);
    await admin.from("chat_conversas").insert({
      sessao: sessao ?? null,
      pergunta,
      resposta,
      locais_citados: (data ?? []).map((l) => l.id),
    });
  } catch (erro) {
    console.error("Nao consegui registrar a conversa:", erro);
  }
}
