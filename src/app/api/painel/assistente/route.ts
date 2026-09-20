import Anthropic from "@anthropic-ai/sdk";
import { NOME_DO_SITE } from "@/lib/marca";
import { createClient } from "@/lib/supabase/server";
import { podeConversar } from "@/lib/limite-chat";
import { planoAtivo, podeUsar } from "@/lib/planos";
import { resumoDoLocal } from "@/lib/metricas-resumo";
import { NOME_DO_TIPO, type TipoMetrica } from "@/lib/metricas";
import { resumoSemana } from "@/lib/horarios";
import type { Horario } from "@/lib/tipos";

export const runtime = "nodejs";
export const maxDuration = 60;

const MODELO = process.env.CHAT_MODELO || "claude-opus-5";
const FAMILIAS_COM_ESFORCO = [
  "claude-opus-",
  "claude-sonnet-5",
  "claude-fable-",
];
const ACEITA_ESFORCO = FAMILIAS_COM_ESFORCO.some((f) => MODELO.startsWith(f));

const INSTRUCOES = `Voce e o assistente do ${NOME_DO_SITE} no painel do comerciante. Quem conversa com voce e o dono do estabelecimento, nao um turista.

SEU PAPEL
- Ajudar esta pessoa a tirar mais proveito do guia: melhorar o cadastro, escrever textos, entender os numeros dela e decidir o que fazer a seguir.
- Voce enxerga apenas os dados do estabelecimento dela, que estao abaixo. Nao ha dado de concorrente aqui, e voce nunca deve inventar um.

COMO VOCE ESCREVE
- Portugues do Brasil correto, frases completas, concordancia certa.
- Direto e pratico: ele esta no meio do expediente. Duas a cinco frases, ou uma lista de ate quatro itens.
- Simpatico, sem bajulacao. Nada de "que otima pergunta".
- Escreva por extenso: "para" (nunca "pra"), "esta" (nunca "ta"), "voce" (nunca "vc").
- Emojis com moderacao: no maximo um por resposta.

REGRA DE OURO
- So afirme o que estiver nos dados abaixo. Se ele perguntar algo que os dados nao respondem, diga com franqueza que essa informacao nao esta aqui.
- Nunca invente numero, comparacao com outros estabelecimentos, ou previsao de faturamento.
- Quando os numeros forem pequenos demais para concluir alguma coisa, diga isso em vez de forcar uma leitura.

QUANDO ELE PEDIR TEXTO
- Escrever descricao, resumo, nome de promocao ou texto de evento e uma das coisas mais uteis que voce faz.
- Entregue o texto pronto para copiar, no tamanho certo para o campo, sem rodeio em volta.
- O resumo do estabelecimento tem no maximo uma frase. A descricao, de tres a seis frases.

O QUE SUGERIR
- Se faltar informacao no cadastro (foto, horario, endereco, resumo, descricao, cardapio), aponte isso primeiro: e o que mais muda o resultado dele.
- Ligue a sugestao ao numero quando der: muitos acessos e poucos cliques no contato quer dizer que a pagina interessa mas nao convence.
- Promocao e evento sao as ferramentas que ele tem para aparecer mais no guia. Lembre delas quando fizer sentido, sem repetir toda hora.`;

export async function POST(request: Request) {
  let corpo: { mensagens?: { papel: string; texto: string }[]; local?: string };
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ erro: "Entre para conversar." }, { status: 401 });
  }

  const { data: perfil } = await supabase
    .from("perfis")
    .select("papel")
    .eq("id", user.id)
    .maybeSingle();
  const admin = perfil?.papel === "admin";

  // As regras do banco ja limitam quem enxerga qual local: pedir o
  // identificador de outro estabelecimento volta vazio.
  const { data: local } = await supabase
    .from("locais")
    .select(
      "id, nome, resumo, descricao, endereco, bairro, telefone, whatsapp, site, instagram, capa_url, status, plano, plano_ate, categoria:categorias(nome)",
    )
    .eq("id", corpo.local ?? "")
    .maybeSingle();

  if (!local) {
    return Response.json({ erro: "Não encontrei." }, { status: 404 });
  }

  const plano = planoAtivo(local.plano, local.plano_ate);
  if (!admin && !podeUsar("guia_painel", plano)) {
    return Response.json(
      { erro: "O assistente faz parte do plano premium." },
      { status: 403 },
    );
  }

  // A trava de uso vale aqui tambem: a conta da IA e a mesma.
  const veredito = await podeConversar(request);
  if (!veredito.liberado) {
    return respostaEmLetras(veredito.motivo);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    return respostaEmLetras(
      "O assistente está fora do ar por enquanto. Tente de novo mais tarde.",
    );
  }

  const ficha = await montarFicha(local, supabase);
  const cliente = new Anthropic();

  const stream = cliente.messages.stream({
    model: MODELO,
    max_tokens: 1200,
    ...(ACEITA_ESFORCO ? { output_config: { effort: "low" as const } } : {}),
    system: [
      { type: "text", text: INSTRUCOES },
      { type: "text", text: ficha },
    ],
    messages: mensagens.map((m) => ({
      role: m.papel === "guia" ? ("assistant" as const) : ("user" as const),
      content: m.texto,
    })),
  });

  const codificador = new TextEncoder();

  const corpoResposta = new ReadableStream({
    async start(controle) {
      try {
        for await (const evento of stream) {
          if (
            evento.type === "content_block_delta" &&
            evento.delta.type === "text_delta"
          ) {
            controle.enqueue(codificador.encode(evento.delta.text));
          }
        }
      } catch (erro) {
        console.error("Erro no assistente do painel:", erro);
        controle.enqueue(
          codificador.encode(
            "\n\nDesculpe, tive um problema aqui do meu lado. Tente de novo em instantes.",
          ),
        );
      } finally {
        controle.close();
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

/* ------------------------------------------------------------------ */

type LocalDoPainel = {
  id: string;
  nome: string;
  resumo: string | null;
  descricao: string | null;
  endereco: string | null;
  bairro: string | null;
  telefone: string | null;
  whatsapp: string | null;
  site: string | null;
  instagram: string | null;
  capa_url: string | null;
  status: string;
  categoria: unknown;
};

/**
 * Tudo o que o assistente sabe sobre este estabelecimento, em texto.
 *
 * Nada aqui vem de outro estabelecimento: e o cadastro dele, os numeros dele
 * e as coisas que ele publicou. O que o assistente nao tiver nesta ficha, ele
 * nao tem como responder — e e melhor assim, porque e o que impede a conversa
 * de virar chute com cara de relatorio.
 */
async function montarFicha(
  local: LocalDoPainel,
  supabase: Awaited<ReturnType<typeof createClient>>,
): Promise<string> {
  const categoria = (local.categoria as { nome: string } | null)?.nome ?? null;

  const [{ data: horarios }, { data: fotos }, { data: itens }, resumo30] =
    await Promise.all([
      supabase
        .from("locais_horarios")
        .select("dia_semana, abre, fecha")
        .eq("local_id", local.id),
      supabase.from("locais_fotos").select("id").eq("local_id", local.id),
      supabase
        .from("locais_itens")
        .select("nome, preco")
        .eq("local_id", local.id),
      resumoDoLocal(local.id, 30, supabase),
    ]);

  const [{ data: eventos }, { data: promocoes }] = await Promise.all([
    supabase
      .from("eventos")
      .select("titulo, inicio, status")
      .eq("local_id", local.id)
      .order("inicio", { ascending: false })
      .limit(5),
    supabase
      .from("promocoes")
      .select("titulo, descricao, ativa")
      .eq("local_id", local.id)
      .limit(10),
  ]);

  const quantasFotos = (fotos ?? []).length + (local.capa_url ? 1 : 0);

  const faltando: string[] = [];
  if (!local.resumo) faltando.push("a frase de resumo");
  if (!local.descricao) faltando.push("a descricao");
  if (!local.endereco) faltando.push("o endereco");
  if ((horarios ?? []).length === 0) faltando.push("os horarios");
  if (quantasFotos === 0) faltando.push("as fotos");
  if (!local.telefone && !local.whatsapp) faltando.push("telefone ou WhatsApp");
  // O cardapio do guia sao os itens cadastrados; nao ha link externo.
  if ((itens ?? []).length === 0) faltando.push("os itens do cardapio");

  const cliques = resumo30.cliques
    .map((c) => `${NOME_DO_TIPO[c.tipo as TipoMetrica]}: ${c.contagem}`)
    .join(", ");

  const linhas = [
    "DADOS DESTE ESTABELECIMENTO",
    "",
    `Nome: ${local.nome}`,
    `Categoria: ${categoria ?? "nao informada"}`,
    `Situacao no guia: ${local.status}`,
    `Endereco: ${local.endereco ?? "nao informado"}${local.bairro ? `, ${local.bairro}` : ""}`,
    `Resumo cadastrado: ${local.resumo ?? "(vazio)"}`,
    `Descricao cadastrada: ${local.descricao ?? "(vazia)"}`,
    `Horarios: ${(horarios ?? []).length > 0 ? resumoSemana((horarios ?? []) as Horario[]) : "nao informados"}`,
    `Fotos: ${quantasFotos}`,
    `Itens no cardapio: ${(itens ?? []).length}`,
    `Contatos: ${
      [
        local.telefone && "telefone",
        local.whatsapp && "WhatsApp",
        local.site && "site",
        local.instagram && "Instagram",
      ]
        .filter(Boolean)
        .join(", ") || "nenhum"
    }`,
    "",
    faltando.length > 0
      ? `Falta preencher: ${faltando.join(", ")}.`
      : "O cadastro esta completo.",
    "",
    "NUMEROS DOS ULTIMOS 30 DIAS",
    `Acessos a pagina: ${resumo30.acessos}`,
    `Indicacoes do Guia (pessoas que sairam da conversa para a pagina dele): ${resumo30.indicacoes}`,
    `Cliques nos contatos: ${cliques || "nenhum"}`,
    `Eventos vistos: ${resumo30.eventosVistos}`,
    `Promocoes vistas: ${resumo30.promocoesVistas}`,
    "",
    "EVENTOS CADASTRADOS",
    (eventos ?? []).length === 0
      ? "Nenhum."
      : (eventos ?? [])
          .map((e) => `- ${e.titulo} (${e.inicio.slice(0, 10)}, ${e.status})`)
          .join("\n"),
    "",
    "PROMOCOES CADASTRADAS",
    (promocoes ?? []).length === 0
      ? "Nenhuma."
      : (promocoes ?? [])
          .map(
            (p) =>
              `- ${p.titulo}${p.ativa ? "" : " (desligada)"}${p.descricao ? `: ${p.descricao}` : ""}`,
          )
          .join("\n"),
  ];

  return linhas.join("\n");
}

/** Manda um texto pronto letra por letra, no mesmo formato do assistente. */
function respostaEmLetras(texto: string) {
  const codificador = new TextEncoder();

  const fluxo = new ReadableStream({
    async start(controle) {
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
