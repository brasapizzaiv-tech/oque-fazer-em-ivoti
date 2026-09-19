"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CasaEnxaimel, Torii } from "./icones";
import { lerRoteiro, linkGoogleMaps, type Parada } from "@/lib/roteiro";

type Mensagem = { papel: "pessoa" | "guia"; texto: string };

type LocalMini = {
  id: string;
  slug: string;
  nome: string;
  bairro: string | null;
  lat: number | null;
  lng: number | null;
  endereco: string | null;
};

const ABERTURA =
  "Olá! 👋 Eu sou o Guia, bem-vindo à cidade das petúnias. 🌸 Posso indicar onde comer, o que visitar e montar um roteiro para você em Ivoti. Por onde começamos?";

const SUGESTOES = [
  "O que fazer hoje?",
  "Onde almoçar bem",
  "Um passeio ao ar livre",
  "Monte um roteiro de um dia",
];

/**
 * A conversa com o Guia.
 *
 * O fundo leva a trama asanoha, o padrão de folha de cânhamo — é o traço
 * japonês da cidade, e aqui ele cabe bem: fica atrás de tudo, dá textura sem
 * competir com o que está escrito.
 *
 * Quando a resposta traz um roteiro, ele sai do texto e vira um cartão com a
 * rota pronta. Ler cinco paradas escritas em linha e depois ter de copiar
 * cada endereço no mapa seria jogar fora justamente o que o Guia fez.
 */
export default function ChatDoGuia() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([
    { papel: "guia", texto: ABERTURA },
  ]);
  const [texto, setTexto] = useState("");
  const [pensando, setPensando] = useState(false);
  const [locais, setLocais] = useState<Record<string, LocalMini>>({});
  const fim = useRef<HTMLDivElement>(null);
  const sessao = useRef<string>("");

  if (!sessao.current && typeof crypto !== "undefined") {
    sessao.current = crypto.randomUUID();
  }

  useEffect(() => {
    let vivo = true;
    fetch("/api/locais/mini")
      .then((r) => r.json())
      .then((d: { locais: LocalMini[] }) => {
        if (!vivo) return;
        const mapa: Record<string, LocalMini> = {};
        for (const l of d.locais ?? []) mapa[l.slug] = l;
        setLocais(mapa);
      })
      .catch(() => {});
    return () => {
      vivo = false;
    };
  }, []);

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
      const resposta = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mensagens: historico.slice(1),
          sessao: sessao.current,
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
    <div
      // Desconta a barra de baixo, que so existe no celular: sem isso a
      // conversa fica mais alta do que o espaco disponivel e o campo de
      // escrever some por tras dela.
      className="flex min-h-[calc(100dvh-72px)] flex-col md:min-h-[100dvh]"
      style={{ backgroundColor: "var(--color-reboco)" }}
    >
      <Cabecalho />

      <div className="asanoha flex-1 overflow-y-auto px-4 py-4">
        <div className="space-y-3">
          {mensagens.map((m, i) => (
            <Balao key={i} mensagem={m} locais={locais} />
          ))}

          {soAbertura && (
            <div className="flex flex-wrap gap-2 pt-1">
              {SUGESTOES.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => enviar(s)}
                  className="h-9 rounded-full border-[1.5px] px-3.5 text-[13px] font-medium"
                  style={{
                    borderColor: "var(--color-torii)",
                    color: "var(--color-torii)",
                    backgroundColor: "var(--color-superficie)",
                  }}
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <div ref={fim} />
        </div>
      </div>

      <form
        onSubmit={(e) => {
          e.preventDefault();
          enviar(texto);
        }}
        className="sticky bottom-[72px] flex gap-2 px-4 py-3 md:bottom-0"
        style={{
          backgroundColor: "var(--color-reboco)",
          borderTop: "2px solid var(--color-madeira)",
        }}
      >
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Pergunte ao Guia"
          aria-label="Pergunte ao Guia"
          className="h-12 flex-1 rounded-[11px] px-4 text-[14px] outline-none"
          style={{
            backgroundColor: "var(--color-superficie)",
            border: "2px solid var(--color-madeira)",
            color: "var(--color-texto)",
          }}
        />
        <button
          type="submit"
          disabled={pensando || !texto.trim()}
          aria-label="Enviar"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-[18px] disabled:opacity-40"
          style={{ backgroundColor: "var(--color-torii)", color: "#fff7ea" }}
        >
          ↑
        </button>
      </form>
    </div>
  );
}

function Cabecalho() {
  return (
    <header
      className="flex items-center gap-3 px-4 py-3"
      style={{
        backgroundColor: "var(--color-superficie)",
        borderBottom: "2px solid var(--color-madeira)",
      }}
    >
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
        style={{ backgroundColor: "var(--color-torii)" }}
      >
        <Torii tamanho={22} style={{ color: "#fff7ea" }} />
      </span>
      <span>
        <span className="flex items-center gap-1.5">
          <span
            className="text-[18px] leading-none font-bold"
            style={{
              color: "var(--color-texto)",
              fontFamily: "var(--fonte-titulo-nova)",
            }}
          >
            O Guia
          </span>
          <CasaEnxaimel
            tamanho={20}
            style={{ color: "var(--color-madeira)" }}
          />
        </span>
        <span
          className="mt-0.5 block text-[12px]"
          style={{ color: "var(--color-texto-suave)" }}
        >
          Seu assistente em Ivoti
        </span>
      </span>
    </header>
  );
}

function Balao({
  mensagem,
  locais,
}: {
  mensagem: Mensagem;
  locais: Record<string, LocalMini>;
}) {
  const daPessoa = mensagem.papel === "pessoa";

  if (daPessoa) {
    return (
      <div className="flex justify-end">
        <p
          className="max-w-[85%] rounded-[14px] px-3.5 py-2.5 text-[14px] whitespace-pre-wrap"
          style={{
            backgroundColor: "var(--color-madeira)",
            color: "var(--color-creme-claro)",
          }}
        >
          {mensagem.texto}
        </p>
      </div>
    );
  }

  // O roteiro sai do texto antes de a mensagem ser escrita na tela: ele vira
  // cartão, e repetir a lista em palavras logo acima seria dizer tudo duas
  // vezes.
  const { limpo, paradas } = lerRoteiro(mensagem.texto);
  const doRoteiro = paradas
    .map((p) => {
      const l = locais[p.slug];
      return l
        ? ({
            id: l.id,
            slug: l.slug,
            nome: l.nome,
            hora: p.hora,
            lat: l.lat,
            lng: l.lng,
            endereco: l.endereco,
            bairro: l.bairro,
          } satisfies Parada)
        : null;
    })
    .filter(Boolean) as Parada[];

  const semMarcadores = limpo.replace(/\[\[[a-z0-9-]+\]\]/gi, "").trim();

  return (
    <div className="space-y-2">
      <div className="flex">
        <p
          className="max-w-[85%] rounded-[14px] px-3.5 py-2.5 text-[14px] whitespace-pre-wrap"
          style={{
            backgroundColor: "var(--color-superficie)",
            border: "2px solid var(--color-madeira)",
            color: "var(--color-texto)",
          }}
        >
          {semMarcadores || (
            <span style={{ color: "var(--color-texto-suave)" }}>
              escrevendo...
            </span>
          )}
        </p>
      </div>

      {doRoteiro.length > 0 && <CartaoRoteiroSugerido paradas={doRoteiro} />}
    </div>
  );
}

/** O roteiro que o Guia montou, com a rota já pronta. */
function CartaoRoteiroSugerido({ paradas }: { paradas: Parada[] }) {
  const rota = linkGoogleMaps(paradas);

  return (
    <div
      className="rounded-[14px] p-3"
      style={{
        backgroundColor: "var(--color-superficie)",
        border: "2px solid var(--color-torii)",
      }}
    >
      <p
        className="text-[11px] font-bold tracking-[0.12em] uppercase"
        style={{ color: "var(--color-torii)" }}
      >
        Roteiro sugerido
      </p>

      <ol className="mt-2 space-y-1.5">
        {paradas.map((p, i) => (
          <li key={p.slug} className="flex items-baseline gap-2 text-[14px]">
            <span
              className="w-4 shrink-0 text-[12px] font-bold"
              style={{ color: "var(--color-torii)" }}
            >
              {i + 1}
            </span>
            <Link
              href={`/local/${p.slug}`}
              className="font-medium"
              style={{ color: "var(--color-texto)" }}
            >
              {p.nome}
            </Link>
            {p.hora && (
              <span
                className="text-[12px]"
                style={{ color: "var(--color-texto-suave)" }}
              >
                {p.hora}
              </span>
            )}
          </li>
        ))}
      </ol>

      {rota && (
        <a
          href={rota}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-3 flex h-11 items-center justify-center rounded-[10px] text-[14px] font-bold"
          style={{ backgroundColor: "var(--color-torii)", color: "#fff7ea" }}
        >
          Ver rota
        </a>
      )}
    </div>
  );
}
