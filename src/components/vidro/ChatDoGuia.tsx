"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { CasaEnxaimel, Torii } from "./icones";
import {
  enderecoCurto,
  lerRoteiro,
  linkGoogleMaps,
  type Parada,
} from "@/lib/roteiro";

type Mensagem = { papel: "pessoa" | "guia"; texto: string };

type LocalMini = {
  id: string;
  slug: string;
  nome: string;
  bairro: string | null;
  lat: number | null;
  lng: number | null;
  endereco: string | null;
  numero?: string | null;
};

/**
 * A lista dos lugares publicados, que a tela usa para trocar marcador por
 * nome e link. Devolve nada se a busca falhar: os nomes saem sem link e a
 * conversa continua.
 */
async function buscarLista(
  deNovo = false,
): Promise<Record<string, LocalMini> | null> {
  try {
    const r = await fetch("/api/locais/mini", {
      // "reload" passa por cima da cópia guardada no navegador.
      cache: deNovo ? "reload" : "default",
    });
    const d: { locais: LocalMini[] } = await r.json();
    const mapa: Record<string, LocalMini> = {};
    for (const l of d.locais ?? []) mapa[l.slug] = l;
    return mapa;
  } catch {
    return null;
  }
}

/** Todo lugar que a resposta cita, no texto ou dentro de um roteiro. */
function lugaresCitados(texto: string): string[] {
  const achados = new Set<string>();
  for (const m of texto.matchAll(/\[\[([^\[\]]+)\]\]/g)) {
    const dentro = m[1];
    if (!dentro.includes(":")) {
      achados.add(enderecoCurto(dentro));
      continue;
    }
    // "roteiro: 09:00 cafe | 12:00 brasa" — o lugar é a última palavra.
    for (const parada of dentro.slice(dentro.indexOf(":") + 1).split("|")) {
      const lugar = parada.trim().split(/\s+/).pop();
      if (lugar) achados.add(enderecoCurto(lugar));
    }
  }
  achados.delete("");
  return [...achados];
}

/** "nei-lanches" vira "Nei Lanches", para quando só se tem o endereço curto. */
function nomeProvisorio(slug: string): string {
  return slug
    .split("-")
    .filter(Boolean)
    .map((p) => p[0].toUpperCase() + p.slice(1))
    .join(" ");
}

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
 * O fundo e a foto fixa do site: os baloes de vidro precisam de imagem
 * por baixo para o desfoque ter o que desfocar.
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

  const vivo = useRef(true);
  const jaProcurados = useRef(new Set<string>());

  useEffect(() => {
    vivo.current = true;
    buscarLista().then((lista) => {
      if (vivo.current && lista) setLocais(lista);
    });
    return () => {
      vivo.current = false;
    };
  }, []);

  /**
   * O Guia citou um lugar que esta tela não conhece: a lista daqui ficou
   * velha. Acontece com quem deixa a conversa aberta enquanto um lugar novo
   * é publicado. Busca de novo, uma vez por lugar — se ele não existir
   * mesmo, perguntar de novo a cada resposta não o faria aparecer.
   */
  function conferirLugares(resposta: string) {
    const novos = lugaresCitados(resposta).filter(
      (slug) => !locais[slug] && !jaProcurados.current.has(slug),
    );
    if (novos.length === 0) return;
    for (const slug of novos) jaProcurados.current.add(slug);
    buscarLista(true).then((lista) => {
      if (vivo.current && lista) setLocais(lista);
    });
  }

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

      conferirLugares(acumulado);
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
      className="mx-auto flex min-h-[calc(100dvh-var(--barra-de-baixo))] flex-col lg:min-h-[calc(100dvh-84px)] lg:max-w-[760px]"
    >
      <Cabecalho />

      {/* Sem textura de fundo: a foto fixa do site aparece por tras dos
          baloes, e e ela que faz o vidro deles funcionar. */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-4 py-4">
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
                    borderColor: "var(--color-v-torii)",
                    color: "var(--color-v-torii)",
                    backgroundColor: "rgba(255, 255, 255, 0.7)",
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
        className="sticky bottom-[var(--barra-de-baixo)] flex gap-2 px-4 py-3 lg:bottom-0"
        style={{
          backgroundColor: "rgba(250, 247, 241, 0.86)",
          backdropFilter: "blur(14px)",
          borderTop: "1px solid rgba(255, 255, 255, 0.8)",
        }}
      >
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Pergunte ao Guia"
          aria-label="Pergunte ao Guia"
          className="h-12 flex-1 rounded-[11px] px-4 text-[14px] outline-none"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            backdropFilter: "blur(14px)",
            border: "1px solid rgba(255, 255, 255, 0.8)",
            color: "var(--color-v-texto)",
          }}
        />
        <button
          type="submit"
          disabled={pensando || !texto.trim()}
          aria-label="Enviar"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-full text-[18px] disabled:opacity-40"
          style={{ backgroundColor: "var(--color-v-torii)", color: "#FFFFFF" }}
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
        backgroundColor: "rgb(var(--vidro-azul-rgb) / var(--vidro-azul-alfa))",
        backdropFilter: "blur(14px)",
        borderBottom: "1px solid rgba(255, 255, 255, 0.25)",
      }}
    >
      <span
        className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
        style={{ backgroundColor: "var(--color-v-torii)" }}
      >
        <Torii tamanho={22} style={{ color: "#FFFFFF" }} />
      </span>
      <span>
        <span className="flex items-center gap-1.5">
          <span
            className="text-[18px] leading-none font-bold"
            style={{
              color: "#FFFFFF",
              fontFamily: "var(--fonte-titulo-nova)",
            }}
          >
            O Guia
          </span>
          <CasaEnxaimel tamanho={20} style={{ color: "#FFFFFF" }} />
        </span>
        <span className="mt-0.5 block text-[12px] text-white/85">
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
            backgroundColor:
              "rgb(var(--vidro-azul-rgb) / var(--vidro-azul-alfa))",
            backdropFilter: "blur(14px)",
            color: "#FFFFFF",
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
  const lido = lerRoteiro(mensagem.texto);
  // Enquanto a resposta chega, o marcador vem pela metade ("[[praca-bo").
  // Fica de fora até fechar, em vez de piscar na tela letra por letra.
  const limpo = lido.limpo.replace(/\[\[[^\]]*\]?$/, "");

  // A parada que esta tela não conhece continua no roteiro, com o nome
  // tirado do endereço curto e sem link. Antes ela era descartada, e o
  // cartão mostrava três paradas de um passeio que o texto dizia ter
  // quatro — a que sumiu era justamente o almoço.
  const doRoteiro: Parada[] = lido.paradas.map((p) => {
    const l = locais[p.slug];
    return l
      ? {
          id: l.id,
          slug: l.slug,
          nome: l.nome,
          hora: p.hora,
          lat: l.lat,
          lng: l.lng,
          endereco: l.endereco,
          numero: l.numero,
          bairro: l.bairro,
        }
      : {
          slug: p.slug,
          nome: nomeProvisorio(p.slug),
          hora: p.hora,
          lat: null,
          lng: null,
          endereco: null,
          bairro: null,
        };
  });

  return (
    <div className="space-y-2">
      <div className="flex">
        <p
          className="max-w-[85%] rounded-[14px] px-3.5 py-2.5 text-[14px] whitespace-pre-wrap"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.7)",
            border: "1px solid rgba(255, 255, 255, 0.8)",
            color: "var(--color-v-texto)",
          }}
        >
          {limpo.trim() ? (
            <TextoDoGuia texto={limpo} locais={locais} />
          ) : (
            <span style={{ color: "var(--color-v-texto-suave)" }}>
              escrevendo...
            </span>
          )}
        </p>
      </div>

      {doRoteiro.length === 1 && <CartaoComoChegar parada={doRoteiro[0]} />}
      {doRoteiro.length > 1 && <CartaoRoteiroSugerido paradas={doRoteiro} />}
    </div>
  );
}

/** A moldura dos dois cartões que o Guia entrega: a rota e o roteiro. */
function Cartao({
  titulo,
  children,
}: {
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[14px] p-3"
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        backdropFilter: "blur(14px)",
        border: "1.5px solid var(--color-v-azul)",
      }}
    >
      <p
        className="text-[11px] font-bold tracking-[0.12em] uppercase"
        style={{ color: "var(--color-v-torii)" }}
      >
        {titulo}
      </p>
      {children}
    </div>
  );
}

/** O botão vermelho que abre o mapa, em outra aba. */
function BotaoDoMapa({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="mt-3 flex h-11 items-center justify-center rounded-[10px] text-[14px] font-bold"
      style={{ backgroundColor: "var(--color-v-torii)", color: "#FFFFFF" }}
    >
      {children}
    </a>
  );
}

/** O nome da parada: link para a página dela, quando a tela a conhece. */
function NomeDaParada({ parada }: { parada: Parada }) {
  if (!parada.id) {
    return (
      <span className="font-medium" style={{ color: "var(--color-v-texto)" }}>
        {parada.nome}
      </span>
    );
  }
  return (
    <Link
      href={`/local/${parada.slug}`}
      className="font-medium"
      style={{ color: "var(--color-v-texto)" }}
    >
      {parada.nome}
    </Link>
  );
}

/**
 * A resposta para "como chegar": o endereço e o botão que abre a rota.
 *
 * O mapa parte de onde a pessoa está quando toca no botão, então o Guia
 * não precisa saber de onde ela sai nem descrever rua por rua.
 */
function CartaoComoChegar({ parada }: { parada: Parada }) {
  const rota = linkGoogleMaps([parada]);
  const rua = [parada.endereco, parada.numero].filter(Boolean).join(", ");
  const endereco = [rua, parada.bairro].filter(Boolean).join(" · ");

  return (
    <Cartao titulo="Como chegar">
      <p className="mt-2 text-[14px]">
        <NomeDaParada parada={parada} />
      </p>
      {endereco && (
        <p
          className="text-[13px]"
          style={{ color: "var(--color-v-texto-suave)" }}
        >
          {endereco}
        </p>
      )}
      {rota && <BotaoDoMapa href={rota}>Abrir a rota no mapa</BotaoDoMapa>}
    </Cartao>
  );
}

/** O roteiro que o Guia montou, com a rota já pronta. */
function CartaoRoteiroSugerido({ paradas }: { paradas: Parada[] }) {
  const rota = linkGoogleMaps(paradas);

  return (
    <Cartao titulo="Roteiro sugerido">
      <ol className="mt-2 space-y-1.5">
        {paradas.map((p, i) => (
          <li
            key={`${i}-${p.slug}`}
            className="flex items-baseline gap-2 text-[14px]"
          >
            <span
              className="w-4 shrink-0 text-[12px] font-bold"
              style={{ color: "var(--color-v-torii)" }}
            >
              {i + 1}
            </span>
            <NomeDaParada parada={p} />
            {p.hora && (
              <span
                className="text-[12px]"
                style={{ color: "var(--color-v-texto-suave)" }}
              >
                {p.hora}
              </span>
            )}
          </li>
        ))}
      </ol>

      {rota && <BotaoDoMapa href={rota}>Ver rota</BotaoDoMapa>}
    </Cartao>
  );
}

/* ------------------------------------------------------------------ */
/* O texto do Guia                                                     */
/* ------------------------------------------------------------------ */

/** Um pedaço da resposta: palavra comum, negrito, ou nome de um lugar. */
type Pedaco =
  | { tipo: "texto"; valor: string }
  | { tipo: "forte"; valor: string }
  | { tipo: "lugar"; slug: string };

/** Compara nomes sem ligar para maiúscula ou espaço nas pontas. */
function igual(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

/**
 * Tira o nome do lugar que acabou de ser escrito, logo antes do marcador.
 *
 * O Guia escreve o nome e depois o marcador, mas nunca do mesmo jeito.
 * Numa frase sai "relaxe na **Praça Neldo Holler** [[praca-neldo-holler]]",
 * com o negrito em cima do nome; na seguinte sai "**Comece visitando o
 * Memorial da Colônia Japonesa** [[memorial-da-colonia-japonesa]]", com a
 * frase inteira em negrito e o nome no fim dela.
 *
 * Por isso a conta é "termina com o nome", e não "é o nome": a primeira
 * versão disto só pegava o caso fácil, e a tela mostrava "Memorial da
 * Colônia Japonesa Memorial da Colônia Japonesa".
 */
function tiraNomeRepetido(pedacos: Pedaco[], nome: string) {
  let i = pedacos.length - 1;

  // Entre o nome e o marcador costuma haver um espaço, em um pedaço só dele.
  let espaco = -1;
  const ultimo = pedacos[i];
  if (ultimo && ultimo.tipo === "texto" && ultimo.valor.trim() === "") {
    espaco = i;
    i--;
  }
  if (i < 0) return;

  const alvo = pedacos[i];
  if (alvo.tipo === "lugar") return;

  const semEspaco = alvo.valor.trimEnd();

  // Quanto do nome já está escrito. O Guia abrevia tanto quanto escreve
  // por inteiro: "vá ao **Memorial** [[memorial-da-colonia-japonesa]]"
  // saía "vá ao Memorial Memorial da Colônia Japonesa". Vale o maior
  // começo do nome, em palavras inteiras, com que o texto termina. Uma
  // palavra só conta se tiver quatro letras ou mais: "a", "de" e "do"
  // são começo de nome e fim de frase o tempo todo.
  const palavras = nome.trim().split(/\s+/);
  let escrito = "";
  for (let k = palavras.length; k >= 1; k--) {
    const comeco = palavras.slice(0, k).join(" ");
    if (k === 1 && comeco.length < 4) break;
    if (comeco.length > semEspaco.length) continue;
    if (!igual(semEspaco.slice(-comeco.length), comeco)) continue;
    // Tem de começar em palavra: "compraça" não termina com "Praça".
    const antes = semEspaco.charAt(semEspaco.length - comeco.length - 1);
    if (antes && /[\p{L}\p{N}]/u.test(antes)) continue;
    escrito = comeco;
    break;
  }
  if (!escrito) return;

  const resto = semEspaco.slice(0, semEspaco.length - escrito.length).trimEnd();

  // Sobrou só o nome: o pedaço inteiro sai, e o espaço que vinha depois
  // dele vai junto, senão fica um buraco duplo antes do link.
  if (resto === "") {
    pedacos.splice(i, espaco >= 0 ? 2 : 1);
    return;
  }

  // O negrito não leva espaço no fim — quem separa é o pedaço seguinte.
  alvo.valor = alvo.tipo === "forte" ? resto : resto + " ";
}

/**
 * Tira o marcador de dentro do negrito.
 *
 * O Guia escreve "**Brasa Pizzaria [[brasa-pizzaria]]**" tanto quanto
 * "**Brasa Pizzaria** [[brasa-pizzaria]]". No primeiro jeito o negrito
 * engolia o marcador, e a tela mostrava o colchete cru no meio do nome.
 * Aqui os dois jeitos viram o segundo, que o resto já sabe ler.
 */
function soltaMarcadores(texto: string): string {
  return texto.replace(/\*\*([^*]+)\*\*/g, (tudo, dentro: string) => {
    if (!dentro.includes("[[")) return tudo;
    return dentro
      .split(/(\[\[[^\[\]]+\]\])/)
      .map((parte) => {
        if (parte.startsWith("[[")) return parte;
        return parte.trim() ? `**${parte.trim()}**` : "";
      })
      .filter(Boolean)
      .join(" ");
  });
}

/**
 * Quebra a resposta do Guia em pedaços para a tela montar.
 *
 * Dois defeitos moravam aqui, os dois visíveis em 20/10/2026:
 *
 *   1. O marcador [[slug]] era APAGADO. Quando o Guia escrevia só o
 *      marcador, confiando que a tela sabia o nome, a frase saía sem
 *      ele: "visitando a , uma obra de 1864".
 *   2. O negrito saía cru, com os asteriscos na tela.
 *
 * Agora o marcador vira o nome do lugar, em link para a página dele —
 * que é melhor que o texto de antes, porque dali a pessoa chega no
 * endereço, no horário e na rota. Marcador de lugar que não existe some,
 * como antes: a frase sem ele é melhor que um colchete cru.
 *
 * Em 17/11/2026 o colchete cru voltou por dois caminhos que esta função
 * não cobria: o marcador dentro do negrito e o marcador com acento. Os
 * dois estão explicados onde são tratados.
 */
function emPedacos(bruto: string, locais: Record<string, LocalMini>): Pedaco[] {
  const texto = soltaMarcadores(bruto);
  const pedacos: Pedaco[] = [];
  // O marcador aceita qualquer coisa entre os colchetes, e não só letra
  // sem acento: o Guia às vezes escreve [[praça-bom-jardim]], e o padrão
  // estreito de antes não o reconhecia — o colchete ia cru para a tela.
  const padrao = /\[\[([^\[\]]+)\]\]|\*\*([^*]+)\*\*/g;
  let fim = 0;
  let achado: RegExpExecArray | null;

  // Quando um marcador some, sobra o espaço que vinha antes dele: "Passe
  // no  também", "no Nei Lanches ." Esta marca manda acertar a emenda.
  let colar = false;
  function empurraTexto(valor: string) {
    let v = valor;
    if (colar) {
      colar = false;
      const anterior = pedacos[pedacos.length - 1];
      const semEspaco = v.replace(/^ +/, "");
      if (/^[.,;:!?)]/.test(semEspaco)) {
        // Pontuação não leva espaço antes.
        if (anterior?.tipo === "texto") {
          anterior.valor = anterior.valor.trimEnd();
          if (!anterior.valor) pedacos.pop();
        }
        v = semEspaco;
      } else if (anterior?.tipo === "texto" && /\s$/.test(anterior.valor)) {
        v = semEspaco;
      }
    }
    if (v) pedacos.push({ tipo: "texto", valor: v });
  }

  while ((achado = padrao.exec(texto)) !== null) {
    if (achado.index > fim) empurraTexto(texto.slice(fim, achado.index));
    fim = padrao.lastIndex;

    if (achado[2] !== undefined) {
      pedacos.push({ tipo: "forte", valor: achado[2].trim() });
      continue;
    }

    const slug = enderecoCurto(achado[1]);
    // Marcador de um lugar que não existe some, como sempre foi: a frase
    // sem ele é melhor que um colchete cru na tela.
    if (!locais[slug]) {
      colar = true;
      continue;
    }

    // O Guia às vezes põe o próprio nome entre colchetes e o marcador em
    // seguida: "[[Praça Concórdia]] [[praca-concordia]]". Os dois viram o
    // mesmo link, e a tela mostrava o nome duas vezes. O segundo some.
    const ultimo = pedacos[pedacos.length - 1];
    const emBranco = ultimo?.tipo === "texto" && ultimo.valor.trim() === "";
    const antes = emBranco ? pedacos[pedacos.length - 2] : ultimo;
    if (antes?.tipo === "lugar" && antes.slug === slug) {
      if (emBranco) pedacos.pop();
      colar = true;
      continue;
    }

    tiraNomeRepetido(pedacos, locais[slug].nome);
    pedacos.push({ tipo: "lugar", slug });
  }

  if (fim < texto.length) empurraTexto(texto.slice(fim));
  return pedacos;
}

/** A resposta do Guia na tela, com os nomes virando link. */
function TextoDoGuia({
  texto,
  locais,
}: {
  texto: string;
  locais: Record<string, LocalMini>;
}) {
  return (
    <>
      {emPedacos(texto, locais).map((p, i) => {
        if (p.tipo === "forte") {
          return (
            <strong key={i} className="font-bold">
              {p.valor}
            </strong>
          );
        }
        if (p.tipo === "lugar") {
          return (
            <Link
              key={i}
              href={`/local/${p.slug}`}
              className="font-bold underline decoration-1 underline-offset-2"
              style={{ color: "var(--color-v-azul)" }}
            >
              {locais[p.slug].nome}
            </Link>
          );
        }
        return <span key={i}>{p.valor}</span>;
      })}
    </>
  );
}
