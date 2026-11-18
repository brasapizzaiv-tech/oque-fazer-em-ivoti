import Anthropic from "@anthropic-ai/sdk";
import { NOME_DO_ASSISTENTE, NOME_DO_SITE } from "@/lib/marca";
import { catalogo } from "@/lib/catalogo";
import {
  diasDeFeira,
  emLinhas,
  jaComecou,
  periodoPorExtenso,
  temaAtivo,
} from "@/lib/temas";
import { hojeEmIvoti } from "@/lib/planos";
import { respostaDemo } from "@/lib/demo";
import { podeConversar } from "@/lib/limite-chat";
import { conversaLimpa } from "@/lib/conversa";
import { ROTAS_PARA_O_GUIA } from "@/lib/rotas-regionais";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";
// Dois minutos. No ar, em 18/11/2026, o Haiku 5.5 levou 33 s pensando antes
// de escrever um roteiro de dia inteiro; com o teto de 60 s, um pedido um
// pouco maior seria cortado no meio e o visitante ficaria sem resposta.
export const maxDuration = 120;

// Modelo configuravel: da pra trocar (claude-haiku-5-5, claude-sonnet-5-5,
// claude-opus-5-5) sem mexer no codigo, so mudando a variavel na Vercel.
// Usa "||" e nao "??" de proposito: uma variavel vazia (CHAT_MODELO=) tem que
// cair no padrao, e o "??" so cairia se ela nao existisse.
const MODELO = process.env.CHAT_MODELO || "claude-opus-5";

// O parametro de esforco (o quanto o modelo "pensa" antes de responder) so
// existe nos modelos maiores. Mandar ele pro Haiku 4.5 devolve erro 400, entao
// so mandamos pra quem aceita — e, na duvida, nao mandamos.
const FAMILIAS_COM_ESFORCO = [
  "claude-opus-",
  "claude-sonnet-5",
  "claude-fable-",
  // O Haiku 5.5 aceita (o 4.5 nao). Ele pensa antes de responder por
  // padrao, e sem o esforco baixo gastaria tempo e resposta nisso.
  "claude-haiku-5",
];
const ACEITA_ESFORCO = FAMILIAS_COM_ESFORCO.some((f) => MODELO.startsWith(f));

// O Haiku 5.5 fica com a etapa de pensar LIGADA, de propósito. Medido em
// 18/11/2026, com as mesmas perguntas:
//   - desligada: primeira letra em 1 s, resposta inteira em 2 a 3 s, mas
//     ele volta a errar o que as regras proíbem (três paradas num passeio
//     de uma hora, "a poucos passos dali" sem a linha "Perto" confirmar,
//     a lista de paradas repetida em texto);
//   - ligada: pergunta simples em 3 a 7 s, roteiro de dia inteiro em 15 a
//     25 s, e as regras são cumpridas.
// Um guia que manda a pessoa a um lugar fechado custa mais do que alguns
// segundos de espera. Para inverter a escolha, basta mandar
// `thinking: { type: "disabled" }` no pedido abaixo.

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
- O site transforma o marcador em um link para a pagina do lugar. Use no maximo 4 por resposta.

HORARIOS
- Cada lugar da lista traz tres linhas de horario: "Agora" (se esta aberto neste momento), "Hoje" (as faixas de hoje) e "Horarios da semana". Para falar de hoje, use so as duas primeiras.
- Copie a hora como esta escrita, sem arredondar: 11:00 e "11h", nunca "meio-dia" nem "por volta das 11h".
- Nao calcule quanto tempo falta para abrir nem quanto a pessoa leva para chegar: voce nao sabe onde ela esta.
- Um horario que voce ja disse nesta conversa nao muda na resposta seguinte. Antes de citar um horario de novo, confira na lista.
- A parte do dia vem da hora que esta no topo da lista: ate 11:59 e manha, de 12:00 a 17:59 e tarde, de 18:00 em diante e noite.

COMO CHEGAR
Quando a pessoa perguntar como chegar, onde fica, ou pedir a rota, o mapa ou a localizacao de um lugar, diga o endereco em uma frase e escreva, na ULTIMA linha da resposta, um marcador assim:

[[rota: pizzaria-do-ze]]

- O site transforma esse marcador em um botao que abre a rota no mapa, saindo de onde a pessoa estiver. Por isso voce NUNCA responde que nao tem rota, mapa ou direcoes: voce tem, e e esse botao.
- Se a pessoa nao disser de qual lugar esta falando, e o ultimo lugar citado na conversa.
- Nao descreva o caminho rua por rua: voce nao sabe de onde ela sai, e o mapa faz isso melhor.
- Um lugar so por marcador de rota. Para varias paradas, use o roteiro.

O QUE LEVAR EM CONTA
- A hora e o dia de hoje, que estao no topo da lista. Se o lugar esta fechado agora, diga isso e informe a que horas abre, ou sugira uma alternativa que esteja aberta.
- So ofereca o que voce consegue entregar: indicar lugares, dizer endereco, horario, contato, evento e promocao, abrir a rota de um lugar e montar um roteiro. Voce nao faz reserva, nao faz pedido e nao envia nada para a pessoa.
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
- Se a pessoa pedir um roteiro sem dizer do que gosta, nao devolva uma pergunta: monte um passeio equilibrado (um ponto historico, uma refeicao, uma praca) e, numa frase no fim do texto, ofereca trocar o que ela quiser.
- Quando a pessoa diz quanto tempo tem ("tenho uma hora", "tenho so a tarde", "estou de passagem"), isso e um pedido de roteiro, mesmo sem a palavra roteiro. Entregue o passeio pronto, com o marcador. Nao responda com uma lista de opcoes seguida de uma pergunta.
- O numero de paradas segue o tempo. Ate uma hora: duas paradas vizinhas. De duas a tres horas: tres. Meio dia ou dia inteiro: de tres a cinco. Mais que cinco vira uma lista cansativa.
- O tempo que a pessoa tem inclui o deslocamento. A linha "Perto" de cada lugar diz quanto se leva ate os vizinhos, a pe ou de carro. So ponha duas paradas em sequencia num passeio de ate uma hora se uma aparecer na linha "Perto" da outra com ate 10 minutos a pe ou ate 5 minutos de carro. Entre duas opcoes, prefira a que se faz a pe. Lugar que nao aparece na linha "Perto" de outro fica longe dele.
- Nunca diga que um lugar fica "pertinho", "a poucos minutos" ou a tantos quilometros sem a linha "Perto" confirmar. Voce nao sabe onde a pessoa esta, entao nao diga que algo fica perto dela nem do centro.
- A hora prevista de chegada em cada parada, no formato 09:00. Se a pessoa nao disser quando sai, a primeira parada e daqui a 15 minutos, contados da hora que esta no topo da lista, e a ultima parada termina dentro do tempo que ela tem.
- Respeite o horario de funcionamento. Num passeio para agora, so entram lugares da lista ABERTOS AGORA, que esta no topo do catalogo, e que continuem abertos na hora da parada (confira a linha "Hoje" do lugar). Lugar fechado nao entra no passeio, nem como segunda parada, por mais bonito que seja. Se a essa hora quase tudo ja fechou, diga isso em uma frase, entregue o passeio so com o que esta aberto e ofereca montar outro para amanha.
- Lugar com a marca PARCEIRO DE ROTEIRO tem preferencia nos passeios. Quando o passeio tem uma parada que um desses lugares atende (uma refeicao, um cafe, um lanche, uma compra), e ele esta aberto na hora da parada e cabe na distancia, e ele que entra. Entre dois lugares que servem igualmente bem, entra o parceiro. A preferencia nunca passa por cima das outras regras: parceiro fechado, longe ou fora do que a pessoa pediu nao entra, e nao se inventa uma parada so para encaixa-lo.
- Conte o tempo de cada parada, mais o deslocamento entre elas. Num passeio de meio dia ou mais: cafe cerca de 40 minutos, almoco cerca de uma hora e meia, trilha cerca de duas horas, praca ou museu cerca de 40 minutos. Num passeio de ate uma hora: de 20 a 25 minutos em cada parada, e sem refeicao, a menos que a pessoa peca.
- Os enderecos entre colchetes sao os mesmos da lista, letra por letra.
- Acima do marcador, escreva duas ou tres frases apresentando o passeio. Nao repita a lista de paradas em texto: o site desenha o roteiro a partir do marcador.
- Todo lugar que o texto apresenta como parada tem de estar no marcador, e so eles: quem le o cartao nao pode achar um passeio diferente do que voce descreveu.
- O roteiro ja vai pronto, com o botao da rota. Nao pergunte, depois de monta-lo, se a pessoa quer que voce o monte.
- Use o marcador de roteiro OU os marcadores de lugar, nunca os dois na mesma resposta.

${ROTAS_PARA_O_GUIA}`;

export async function POST(request: Request) {
  let corpo: {
    mensagens?: { papel: string; texto: string }[];
    sessao?: string;
  };
  try {
    corpo = await request.json();
  } catch {
    return Response.json({ erro: "Pedido invalido." }, { status: 400 });
  }

  const mensagens = conversaLimpa(corpo.mensagens);

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

  const [{ texto: lista }, feira] = await Promise.all([
    catalogo(),
    temaAtivo(),
  ]);
  const cliente = new Anthropic();

  // A feira da semana entra como um bloco proprio, fora do cache: ela muda
  // e o catalogo nao, e misturar os dois jogaria fora o cache do catalogo
  // toda vez que uma feira comecasse ou terminasse.
  const sobreAFeira = feira ? blocoDaFeira(feira) : null;

  const stream = cliente.messages.stream({
    model: MODELO,
    // Folga para os modelos que pensam antes de escrever: o pensamento
    // conta neste teto. Com 3000, o Haiku 5.5 gastava tudo pensando num
    // roteiro de dia inteiro e a resposta voltava vazia (18/11/2026). O
    // tamanho da resposta em si e pedido nas instrucoes, nao aqui.
    max_tokens: 10000,
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
      ...(sobreAFeira ? [{ type: "text" as const, text: sobreAFeira }] : []),
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

        // O modelo pode terminar sem escrever nada (recusou a pergunta, ou
        // gastou o teto pensando). Sem isto o balao ficava em
        // "escrevendo..." para sempre.
        if (!resposta.trim()) {
          // Fica no registro o motivo: sem ele, "voltou vazio" não dizia se
          // foi o teto (max_tokens), uma recusa (refusal) ou outra coisa.
          const fim = await stream.finalMessage().catch(() => null);
          console.error(
            "Chat voltou sem texto:",
            fim?.stop_reason,
            JSON.stringify(fim?.usage ?? null),
          );
          resposta =
            "Desculpe, não consegui responder a essa pergunta. Pode tentar com outras palavras?";
          controle.enqueue(codificador.encode(resposta));
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
    // Conta tambem o lugar da rota e as paradas do roteiro: o padrao de
    // antes so via [[lugar]], e "como chegar" ficaria sem lugar citado.
    const citados = [
      ...new Set(
        [...resposta.matchAll(/\[\[([^\[\]]+)\]\]/g)].flatMap((m) =>
          m[1].includes(":")
            ? m[1]
                .slice(m[1].indexOf(":") + 1)
                .split("|")
                .map((parada) => parada.trim().split(/\s+/).pop() ?? "")
            : [m[1]],
        ),
      ),
    ].filter((slug) => /^[a-z0-9-]+$/.test(slug));
    const admin = createAdminClient();
    const { data } = await admin
      .from("locais")
      .select("id")
      .in("slug", citados.length ? citados : ["-"]);
    await admin.from("chat_conversas").insert({
      // Vem do navegador: só texto, e curto. Sem o corte, cada pergunta
      // podia gravar no banco um campo do tamanho que o remetente quisesse.
      sessao: typeof sessao === "string" ? sessao.slice(0, 64) : null,
      pergunta,
      resposta,
      locais_citados: (data ?? []).map((l) => l.id),
    });
  } catch (erro) {
    console.error("Nao consegui registrar a conversa:", erro);
  }
}

/* ------------------------------------------------------------------ */

/** "2026-10-23" vira "23/10". */
function emDiaEMes(data: string): string {
  const [, mes, dia] = data.split("-");
  return dia + "/" + mes;
}

/**
 * O que o Guia sabe sobre a feira.
 *
 * O bloco antigo comecava com "A FEIRA QUE ESTA ACONTECENDO AGORA" e era
 * mandado sempre que havia tema ativo. Mas tema ativo nao quer dizer
 * feira aberta: ele liga sete dias antes e fica ligado nos dias de
 * intervalo. Em 20/10/2026, uma terca sem feira, o Guia respondeu que a
 * 19a Feira das Flores "esta acontecendo" e que abre as 9h — portao
 * fechado. O bloco visual ja tinha sido corrigido; este nao.
 *
 * Agora o estado de HOJE vem escrito e separado dos dias da temporada,
 * porque e a unica coisa que o Guia nao consegue deduzir sozinho de uma
 * lista de datas sem errar de vez em quando.
 */
function blocoDaFeira(
  feira: NonNullable<Awaited<ReturnType<typeof temaAtivo>>>,
) {
  const hoje = hojeEmIvoti();
  const dias = diasDeFeira(feira);
  const abertaHoje = dias.length === 0 || dias.includes(hoje);
  const proximo = dias.find((d) => d > hoje);

  const situacao = !jaComecou(feira, hoje)
    ? "HOJE a feira AINDA NAO COMECOU. O primeiro dia e " +
      emDiaEMes(feira.inicio!) +
      "."
    : abertaHoje
      ? "HOJE a feira esta ABERTA."
      : "HOJE a feira esta FECHADA." +
        (proximo ? " Ela volta no dia " + emDiaEMes(proximo) + "." : "");

  return [
    "A FEIRA DA TEMPORADA EM IVOTI",
    "",
    "Nome: " + (feira.subtitulo ? feira.subtitulo + " " : "") + feira.nome,
    periodoPorExtenso(feira) ? "Temporada: " + periodoPorExtenso(feira) : "",
    feira.onde ? "Onde: " + feira.onde : "",
    dias.length
      ? "Dias em que ela ABRE: " + dias.map(emDiaEMes).join(", ")
      : "",
    situacao,
    emLinhas(feira.programacao).length
      ? "Programacao:\n" +
        emLinhas(feira.programacao)
          .map((l) => "- " + l)
          .join("\n")
      : "",
    emLinhas(feira.expositores).length
      ? "Na feira a pessoa encontra: " + emLinhas(feira.expositores).join(", ")
      : "",
    "",
    "Quando a pergunta tiver a ver com a feira, responda com estes dados.",
    "NUNCA diga que a feira esta acontecendo hoje se a linha HOJE acima",
    "disser que ela esta fechada ou que ainda nao comecou. Nesse caso diga",
    "quando ela abre e sugira outras coisas para hoje.",
    "So cite o horario de 9h as 18h para um dia em que ela abre.",
    "Nao invente atracao, horario nem expositor que nao esteja escrito aqui.",
  ]
    .filter(Boolean)
    .join("\n");
}
