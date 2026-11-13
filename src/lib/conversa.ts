// ============================================================
// A conversa que chega no pedido
// ============================================================
// O Guia do site e o assistente do painel recebem do navegador a conversa
// inteira a cada pergunta. É texto de fora, então passa por aqui antes de
// ir para a IA.
// ============================================================

export type MensagemDoPedido = { papel: string; texto: string };

/** Quantas mensagens da conversa seguem para a IA. */
const MAXIMO_DE_MENSAGENS = 12;

/**
 * O tamanho de cada mensagem.
 *
 * Uma pergunta de visitante cabe em duas linhas. Sem teto, o limite de
 * pedidos por hora não limitava o gasto: bastava mandar um livro em cada
 * pedido, e a conta da IA é cobrada por texto lido.
 */
const MAXIMO_POR_MENSAGEM = 2000;

/**
 * As últimas mensagens da conversa, já no tamanho e na ordem que a IA
 * aceita.
 *
 * A conversa precisa começar por uma fala da pessoa. Cortar "as últimas
 * doze" numa conversa longa pode deixar uma resposta do Guia na frente, e
 * por isso as falas dele no começo são descartadas.
 */
export function conversaLimpa(bruto: unknown): MensagemDoPedido[] {
  if (!Array.isArray(bruto)) return [];

  const mensagens: MensagemDoPedido[] = [];
  for (const m of bruto) {
    if (!m || typeof m.texto !== "string" || !m.texto.trim()) continue;
    mensagens.push({
      papel: m.papel === "guia" ? "guia" : "pessoa",
      texto: m.texto.slice(0, MAXIMO_POR_MENSAGEM),
    });
  }

  const ultimas = mensagens.slice(-MAXIMO_DE_MENSAGENS);
  while (ultimas.length > 0 && ultimas[0].papel === "guia") ultimas.shift();
  return ultimas;
}
