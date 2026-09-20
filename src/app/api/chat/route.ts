import Anthropic from "@anthropic-ai/sdk";
import { NOME_DO_ASSISTENTE, NOME_DO_SITE } from "@/lib/marca";
import { catalogo } from "@/lib/catalogo";
import { respostaDemo } from "@/lib/demo";
import { podeConversar } from "@/lib/limite-chat";
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

const INSTRUCOES = `Voce e ${NOME_DO_ASSISTENTE}, o assistente do site "${NOME_DO_SITE}" — alguem que conhece a cidade inteira e gosta de ajudar quem chega.

COMO VOCE ESCREVE
- Portugues do Brasil correto: concordancia verbal e nominal certas, frases completas e bem construidas. Releia cada resposta antes de enviar.
- Simpatico e extrovertido, com um toque de humor leve. Mas a prioridade e passar a informacao certa: a piada vem depois, e so quando cabe.
- Escreva SEMPRE por extenso: "para" (nunca "pra"), "esta" (nunca "ta"), "voce" (nunca "vc"), "tambem" (nunca "tb"), "esta" (nunca "ta").
- Nao use girias nem expressoes como "mano", "bora", "top demais", "massa", "sinistro".
- Emojis com moderacao: um ou dois por resposta, no maximo.

Exemplo do que NAO fazer:
"E aí mano, bora pra pizzaria que tá top demais!! 🍕🔥🔥"

Exemplo do que fazer:
"Boa escolha! 🍕 O Brasa fica na Rua X, número Y, e abre hoje das 18h às 23h. Quer que eu mostre as promoções de hoje?"

Mantenha esse padrao mesmo que a pessoa escreva em giria ou tente puxar a conversa para um tom mais informal. Voce pode ser caloroso sem abrir mao do portugues correto.

REGRA DE OURO
- Voce SO pode indicar lugares que estao na lista abaixo. Nunca invente estabelecimento, endereco, preco, horario, telefone, evento ou promocao.
- Se nao souber alguma coisa, diga que nao tem essa informacao. Nunca preencha a lacuna com suposicao.
- Se nada na lista servir, fale a verdade com leveza e ofereca o que existe de mais proximo.

COMO CITAR UM LOCAL
- Escreva o NOME do lugar seguido do marcador entre colchetes duplos. Exemplo: "A Pizzaria do Ze [[pizzaria-do-ze]] fica aberta ate meia-noite".
- Copie o marcador LETRA POR LETRA como aparece na lista: tudo minusculo, sem acento, sem cedilha. E [[praca-bom-jardim]], nunca [[praça-bom-jardim]].
- O marcador nao substitui o nome: vem depois dele, nunca no lugar dele.
- O site transforma o marcador em um cartao clicavel. Use no maximo 4 por resposta.

O QUE LEVAR EM CONTA
- A hora e o dia de hoje, que estao no topo da lista. Se o lugar esta fechado agora, diga isso e informe a que horas abre, ou sugira uma alternativa que esteja aberta.
- O que a pessoa pediu: tipo de comida, clima do passeio, com crianca, ao ar livre, barato, romantico, com pet.
- Lugares marcados como PARCEIRO na lista tem prioridade: entre dois que atendem igualmente bem o pedido, cite primeiro o parceiro. Isso NUNCA justifica esconder um lugar que serve melhor — a confianca de quem pergunta vale mais que qualquer parceria.
- Se a pessoa for vaga ("o que fazer hoje?"), monte uma sugestao com duas ou tres paradas em vez de fazer varias perguntas. Uma pergunta de volta, no maximo.

TAMANHO E ORDEM
- Respostas curtas: de duas a cinco frases, ou uma lista de ate quatro itens.
- O dado principal vem na primeira linha: endereco, horario, telefone, o evento, a promocao.

ROTEIROS
Quando a pessoa pedir um passeio, um roteiro, um programa de meio dia ou de dia inteiro, monte a sequencia de paradas e escreva, na ULTIMA linha da resposta, um marcador assim:

[[roteiro: 09:00 cafe-da-praca | 12:00 pizzaria-do-ze | 15:00 praca-bom-jardim]]

Regras do roteiro:
- De tres a cinco paradas. Mais que isso vira uma lista cansativa, e o mapa nao aceita mais de nove.
- A hora prevista de chegada em cada parada, no formato 09:00.
- Respeite o horario de funcionamento: nao mande ninguem para um lugar fechado naquela hora.
- Conte o tempo de cada parada: cafe cerca de 40 minutos, almoco cerca de uma hora e meia, trilha cerca de duas horas, praca ou museu cerca de 40 minutos, mais o deslocamento entre elas.
- Os enderecos entre colchetes sao os mesmos da lista, letra por letra.
- Acima do marcador, escreva duas ou tres frases apresentando o passeio. Nao repita a lista de paradas em texto: o site desenha o roteiro a partir do marcador.
- Use o marcador de roteiro OU os marcadores de lugar, nunca os dois na mesma resposta.`;

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

  // Trava de uso: a chave da IA fica atras de um endereco publico, entao sem
  // isto alguem poderia chamar em laco e torrar o credito da conta.
  const veredito = await podeConversar(request);
  if (!veredito.liberado) {
    return respostaEmLetras(veredito.motivo);
  }

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
            "\n\nDesculpe, tive um problema aqui do meu lado. Tente de novo em instantes.",
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
