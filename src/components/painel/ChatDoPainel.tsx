"use client";

import { useEffect, useRef, useState } from "react";

type Mensagem = { papel: "pessoa" | "guia"; texto: string };

const SUGESTOES = [
  "Escreva a descrição do meu negócio",
  "O que falta no meu cadastro?",
  "Como estou indo nos últimos 30 dias?",
  "Sugira uma promoção para a semana",
];

/**
 * O assistente dentro do painel.
 *
 * E o mesmo modelo do guia publico, mas com outra cabeca: aqui ele enxerga
 * o cadastro e os numeros deste estabelecimento, e conversa com quem e dono
 * dele. Por isso nao tem cartao de lugar nem roteiro — nada disso faz
 * sentido para quem ja esta do lado de dentro.
 */
export default function ChatDoPainel({
  local,
  nome,
}: {
  local: string;
  nome: string;
}) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([
    {
      papel: "guia",
      texto: `Olá! Posso ajudar com o ${nome}: escrever a descrição, entender os números do mês, pensar numa promoção. O que você quer resolver agora?`,
    },
  ]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const fim = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fim.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensagens]);

  async function enviar(pergunta: string) {
    const limpa = pergunta.trim();
    if (!limpa || pensando) return;

    const historico: Mensagem[] = [
      ...mensagens,
      { papel: "pessoa", texto: limpa },
    ];
    setMensagens([...historico, { papel: "guia", texto: "" }]);
    setTexto("");
    setPensando(true);

    try {
      const resposta = await fetch("/api/painel/assistente", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          local,
          // A abertura é escrita aqui, não pelo modelo: mandá-la de volta
          // faria ele achar que já se apresentou do jeito dele.
          mensagens: historico.slice(1),
        }),
      });

      if (!resposta.ok || !resposta.body) {
        const erro = await resposta.json().catch(() => null);
        throw new Error(erro?.erro ?? "não consegui responder agora.");
      }

      const leitor = resposta.body.getReader();
      const decodificador = new TextDecoder();
      let acumulado = "";

      for (;;) {
        const { done, value } = await leitor.read();
        if (done) break;
        acumulado += decodificador.decode(value, { stream: true });
        setMensagens([...historico, { papel: "guia", texto: acumulado }]);
      }
    } catch (erro) {
      setMensagens([
        ...historico,
        {
          papel: "guia",
          texto:
            erro instanceof Error
              ? `Desculpe, ${erro.message}`
              : "Desculpe, tive um problema aqui. Tente de novo em instantes.",
        },
      ]);
    } finally {
      setPensando(false);
    }
  }

  const soAbertura = mensagens.length === 1;

  return (
    <div className="flex h-[70vh] min-h-96 flex-col overflow-hidden border-2 border-carvalho bg-creme">
      <div className="flex-1 space-y-3 overflow-y-auto p-4">
        {mensagens.map((m, i) => (
          <div
            key={i}
            className={m.papel === "pessoa" ? "flex justify-end" : "flex"}
          >
            <div
              className={[
                "max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap",
                m.papel === "pessoa"
                  ? "bg-carvalho text-creme"
                  : "bg-cal-sombra text-tinta",
              ].join(" ")}
            >
              {m.texto || (
                <span className="text-tinta/40">escrevendo...</span>
              )}
            </div>
          </div>
        ))}

        {soAbertura && (
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGESTOES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => enviar(s)}
                className="border-2 border-carvalho px-3 py-1.5 text-sm text-tinta/75 transition hover:bg-cal-sombra"
              >
                {s}
              </button>
            ))}
          </div>
        )}

        <div ref={fim} />
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(texto);
        }}
        className="flex gap-2 border-t-2 border-carvalho/20 p-3"
      >
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Pergunte alguma coisa sobre o seu negócio..."
          className="flex-1 border-2 border-carvalho px-4 py-2.5 text-sm outline-none focus:border-sol-600 focus:ring-2 focus:ring-sol-200"
        />
        <button
          type="submit"
          disabled={pensando || !texto.trim()}
          className="border-2 border-carvalho bg-carvalho px-5 py-2.5 text-sm font-semibold text-white transition hover:border-sol-700 hover:bg-sol-700 disabled:opacity-40"
        >
          Enviar
        </button>
      </form>
    </div>
  );
}
