"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { normalizar } from "@/lib/texto";
import CartaoRoteiro from "./CartaoRoteiro";
import { lerRoteiro, type Parada } from "@/lib/roteiro";

type Mensagem = { papel: "pessoa" | "guia"; texto: string };

type LocalMini = {
  id: string;
  slug: string;
  nome: string;
  capa_url: string | null;
  resumo: string | null;
  bairro: string | null;
  lat: number | null;
  lng: number | null;
  endereco: string | null;
  categoria: { nome: string; emoji: string | null } | null;
};

const SUGESTOES = [
  "O que fazer hoje à noite?",
  "Quero comer um hambúrguer",
  "Um lugar tranquilo para levar as crianças",
  "Onde tomar um café agora?",
  "Programa de domingo ao ar livre",
  "Monte um roteiro de um dia em Ivoti",
];

const ABERTURA =
  "Olá! 👋 Eu sou o Gui, o assistente do Guia de Ivoti. Me diga o que você está com vontade de fazer — comer, passear, tomar alguma coisa — que eu indico onde ir.";

export default function Chat({ compacto = false }: { compacto?: boolean }) {
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

  // Carrega uma vez a listinha de locais, pra virar cartao dentro da resposta.
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
    fim.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [mensagens, pensando]);

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
          mensagens: historico.slice(1), // a abertura nao vai pro modelo
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
              ? `Desculpe, ${erro.message} Tente de novo em instantes.`
              : "Desculpe, tive um problema aqui. Tente de novo em instantes.",
        },
      ]);
    } finally {
      setPensando(false);
    }
  }

  const soAbertura = mensagens.length === 1;

  return (
    <div className="flex h-full flex-col">
      <div
        className={[
          "flex-1 space-y-4 overflow-y-auto p-4",
          compacto ? "" : "mx-auto w-full max-w-3xl",
        ].join(" ")}
      >
        {mensagens.map((m, i) => (
          <Balao
            key={i}
            mensagem={m}
            locais={locais}
            carregando={
              pensando && i === mensagens.length - 1 && m.texto === ""
            }
          />
        ))}

        {soAbertura && (
          <div className="flex flex-wrap gap-2 pt-1">
            {SUGESTOES.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => enviar(s)}
                className="rounded-full border border-mata-200 bg-white px-3 py-1.5 text-sm text-mata-700 transition hover:bg-mata-50"
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
        className="border-t border-mata-100 bg-white p-3"
      >
        <div className="mx-auto flex w-full max-w-3xl items-center gap-2">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            placeholder="O que você está com vontade de fazer?"
            aria-label="Escreva sua pergunta"
            className="flex-1 rounded-full border border-mata-200 px-4 py-3 text-sm outline-none focus:border-mata-500 focus:ring-2 focus:ring-mata-100"
          />
          <button
            type="submit"
            disabled={pensando || !texto.trim()}
            className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-mata-600 text-white transition hover:bg-mata-700 disabled:opacity-40"
            aria-label="Enviar"
          >
            ➤
          </button>
        </div>
      </form>
    </div>
  );
}

function Balao({
  mensagem,
  locais,
  carregando,
}: {
  mensagem: Mensagem;
  locais: Record<string, LocalMini>;
  carregando: boolean;
}) {
  if (mensagem.papel === "pessoa") {
    return (
      <div className="flex justify-end">
        <p className="max-w-[85%] rounded-2xl rounded-br-sm bg-mata-600 px-4 py-2.5 text-sm text-white">
          {mensagem.texto}
        </p>
      </div>
    );
  }

  return (
    <div className="flex gap-2.5">
      <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-full bg-mata-100 text-base">
        🌿
      </span>
      <div className="max-w-[90%] space-y-2">
        {carregando ? (
          <Digitando />
        ) : (
          <Resposta texto={mensagem.texto} locais={locais} />
        )}
      </div>
    </div>
  );
}

function Digitando() {
  return (
    <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-white px-4 py-3">
      {[0, 150, 300].map((atraso) => (
        <span
          key={atraso}
          className="h-1.5 w-1.5 animate-bounce rounded-full bg-mata-400"
          style={{ animationDelay: `${atraso}ms` }}
        />
      ))}
    </div>
  );
}

/**
 * Reduz um texto a letras, numeros e tracos — sem acento e sem corte de
 * tamanho. Serve pra casar o marcador [[...]] com o endereco do local e pra
 * saber se o nome do lugar ja apareceu antes na frase.
 */
function chave(texto: string): string {
  return normalizar(texto)
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * O nome do lugar acabou de ser dito?
 *
 * Aceita o nome inteiro e tambem a versao abreviada que o guia costuma usar:
 * ele escreve "Praça Ecológica Vereador Edio Klein" para um lugar cadastrado
 * como "Praça Ecológica Vereador Edio Klein – Oscar Nicolao Müller". Sem isso
 * o nome sairia duas vezes na mesma frase.
 */
function jaMencionado(anterior: string, nome: string): boolean {
  const alvo = chave(nome);
  const cauda = chave(anterior.slice(-160));
  if (!alvo || !cauda) return false;

  // Do nome inteiro para o pedaco menor aceitavel: 12 caracteres evita casar
  // por acaso com uma palavra solta como "praca".
  for (let corte = alvo.length; corte >= 12; corte--) {
    if (cauda.endsWith(alvo.slice(0, corte))) return true;
  }
  return cauda.endsWith(alvo);
}

/**
 * Mostra a resposta do guia trocando os marcadores [[slug]] por cartoes
 * clicaveis do local. O que nao for marcador vira texto normal, com **negrito**
 * e quebras de linha respeitadas.
 */
function Resposta({
  texto: original,
  locais,
}: {
  texto: string;
  locais: Record<string, LocalMini>;
}) {
  let texto = original;
  // O roteiro sai primeiro: ele vira um cartao proprio, e o resto da
  // resposta segue o caminho normal dos marcadores de lugar.
  const { limpo, paradas: pedidas } = lerRoteiro(texto);
  texto = limpo;

  const roteiro: Parada[] = pedidas
    .map((p) => {
      const local = locais[p.slug] ?? locais[chave(p.slug)];
      if (!local) return null;
      return {
        id: local.id,
        slug: local.slug,
        nome: local.nome,
        hora: p.hora,
        lat: local.lat,
        lng: local.lng,
        endereco: local.endereco,
        bairro: local.bairro,
        categoria: local.categoria?.nome ?? null,
      } satisfies Parada;
    })
    .filter(Boolean) as Parada[];

  // Aceita qualquer coisa dentro dos colchetes de proposito: o guia as vezes
  // devolve o marcador "corrigido" com acento ([[praça-bom-jardim]] em vez de
  // [[praca-bom-jardim]]). Normaliza antes de procurar, e o marcador que nao
  // bater com nenhum local some em vez de aparecer cru na tela.
  const marcador = /\[\[([^\]]{1,80})\]\]/g;
  const cartoes: LocalMini[] = [];
  let corrido = "";
  let ultimo = 0;

  for (const achado of texto.matchAll(marcador)) {
    const inicio = achado.index ?? 0;
    corrido += texto.slice(ultimo, inicio);
    ultimo = inicio + achado[0].length;

    const local = locais[achado[1]] ?? locais[chave(achado[1])];
    if (!local) continue;

    if (!cartoes.some((c) => c.slug === local.slug)) cartoes.push(local);

    // Ora o guia escreve "o Pórtico [[portico-de-ivoti]]", ora usa o marcador
    // no lugar do nome ("passa no [[portico-de-ivoti]]"). No primeiro caso
    // basta tirar o marcador; no segundo, sem por o nome a frase fica com um
    // buraco. Entao so escreve o nome quando ele ainda nao veio antes.
    if (!jaMencionado(corrido, local.nome)) corrido += local.nome;
  }
  corrido += texto.slice(ultimo);

  const corridos = [corrido];

  return (
    <>
      <div className="rounded-2xl rounded-bl-sm bg-white px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap">
        {/* Colapsa so espacos repetidos — as quebras de linha precisam
            sobreviver, senao a listinha do guia vira um paragrafao. E tira o
            espaco que sobra antes da pontuacao quando o marcador [[slug]] sai
            do meio da frase ("Pizzaria do Morro ." vira "Pizzaria do Morro."). */}
        {formatar(
          corridos
            .join("")
            .replace(/[ \t]{2,}/g, " ")
            .replace(/[ \t]+([.,!?;:])/g, "$1")
            .trim(),
        )}
      </div>

      {roteiro.length > 0 && <CartaoRoteiro paradas={roteiro} />}

      {/* Com roteiro na tela os cartoes soltos sobram: repetiriam as mesmas
          paradas logo abaixo da lista numerada. */}
      {roteiro.length === 0 && cartoes.length > 0 && (
        <div className="grid gap-2 sm:grid-cols-2">
          {cartoes.map((l) => (
            <Link
              key={l.slug}
              href={`/local/${l.slug}`}
              className="flex items-center gap-3 rounded-xl border border-mata-100 bg-white p-2 transition hover:border-mata-300 hover:shadow"
            >
              <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-mata-50">
                {l.capa_url ? (
                  <Image
                    src={l.capa_url}
                    alt={l.nome}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                ) : (
                  <span className="grid h-full place-items-center text-xl">
                    {l.categoria?.emoji ?? "📍"}
                  </span>
                )}
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold">{l.nome}</p>
                <p className="truncate text-xs text-tinta/50">
                  {l.categoria?.nome}
                  {l.bairro ? ` · ${l.bairro}` : ""}
                </p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </>
  );
}

/** Negrito simples (**assim**) — o resto vai como texto puro. */
function formatar(texto: string) {
  return texto.split(/(\*\*[^*]+\*\*)/g).map((parte, i) =>
    parte.startsWith("**") && parte.endsWith("**") ? (
      <strong key={i}>{parte.slice(2, -2)}</strong>
    ) : (
      <span key={i}>{parte}</span>
    ),
  );
}
