import Image from "next/image";
import Link from "next/link";
import type { CSSProperties } from "react";
import { CasaEnxaimel, Petunia } from "./icones";
import LinkDeContato from "@/components/LinkDeContato";
import type { TipoMetrica } from "@/lib/metricas";
import { telefoneBonito } from "@/lib/texto";
import { Botao, CardAzul, CardVidro, Legenda, SeloHanko } from "./pecas";

/* ==================================================================== */
/* O cabeçalho de tela, no celular                                      */
/* ==================================================================== */

/**
 * A faixa de vidro azul sobre a foto, no alto das telas internas.
 *
 * Cada tela do celular traz o próprio cabeçalho, com o título dela e o que
 * ela precisa embaixo — busca no Explorar, nada na agenda. No computador
 * some: lá a barra do menu já diz onde a pessoa está, e uma segunda faixa
 * só roubaria altura.
 *
 * O azul vem sobre um pedaço de foto e não sobre o fundo do site, porque
 * vidro sobre vidro não se lê: o desfoque precisa de imagem por baixo.
 */
export function CabecalhoDeTela({
  titulo,
  foto = "/fotos/eu-amo-ivoti.jpg",
  children,
  acao,
}: {
  titulo: string;
  foto?: string;
  /** Busca, filtros, contador — o que a tela precisa logo abaixo do título. */
  children?: React.ReactNode;
  /** Um botão à direita do título. */
  acao?: React.ReactNode;
}) {
  return (
    <header className="relative isolate lg:hidden">
      <Image
        src={foto}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div aria-hidden className="veu-do-topo absolute inset-0" />

      <div className="relative px-4 pt-4 pb-4">
        <div className="vidro-azul px-4 py-3.5" style={{ borderRadius: 18 }}>
          <div className="flex items-center gap-2">
            <h1
              className="sobre-foto text-[22px] leading-none font-bold text-white"
              style={{ fontFamily: "var(--fonte-titulo-nova)" }}
            >
              {titulo}
            </h1>
            <CasaEnxaimel tamanho={26} className="shrink-0" />
            {acao && <span className="ml-auto shrink-0">{acao}</span>}
          </div>

          {children && <div className="mt-3">{children}</div>}
        </div>
      </div>
    </header>
  );
}

/* ==================================================================== */
/* Título de seção                                                      */
/* ==================================================================== */

/** O selo à esquerda e o nome da seção. */
export function TituloSecao({
  children,
  selo,
  aoLado,
}: {
  children: React.ReactNode;
  selo?: "evento" | "promocao";
  /** "Ver todas", à direita. */
  aoLado?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2">
      {selo && <SeloHanko tipo={selo} />}
      <h2
        className="text-[22px] leading-none font-bold lg:text-[30px]"
        style={{
          color: "var(--color-v-texto)",
          fontFamily: "var(--fonte-titulo-nova)",
        }}
      >
        {children}
      </h2>
      {aoLado && <span className="ml-auto shrink-0">{aoLado}</span>}
    </div>
  );
}

/* ==================================================================== */
/* Fileira que rola de lado                                             */
/* ==================================================================== */

/**
 * A fileira rolável, com o aviso de que continua à direita.
 *
 * O degradê na borda direita existe porque já foi reclamação real: uma
 * fileira cortada rente à margem parece uma lista que acabou, e o que
 * estava além ficava inacessível para quem não adivinhava que dava para
 * arrastar. O degradê deixa o próximo item meio aparecendo e a seta diz o
 * resto.
 *
 * No computador o degradê some quando tudo cabe — `semRolagemNoComputador`
 * troca a fileira por uma grade a partir de `lg`.
 *
 * "overscroll-x-contain" existe por causa do iPhone: arrastar a fileira
 * ate o comeco e continuar arrastando disparava o gesto de voltar do
 * Safari, e a pessoa saia da pagina sem querer.
 */
export function Fileira({
  children,
  semRolagemNoComputador = false,
}: {
  children: React.ReactNode;
  semRolagemNoComputador?: boolean;
}) {
  return (
    <div className="relative">
      <div
        className={`flex gap-2.5 overflow-x-auto overscroll-x-contain px-4 pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden ${
          semRolagemNoComputador
            ? "lg:flex-wrap lg:overflow-visible lg:px-0"
            : ""
        }`}
      >
        {children}
      </div>

      <span
        aria-hidden
        className={`pointer-events-none absolute inset-y-0 right-0 flex w-12 items-center justify-end pr-1.5 ${
          semRolagemNoComputador ? "lg:hidden" : ""
        }`}
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(250,247,241,0) 0%, rgba(250,247,241,0.85) 70%)",
        }}
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="var(--color-v-texto-suave)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m9 5 7 7-7 7" />
        </svg>
      </span>
    </div>
  );
}

/* ==================================================================== */
/* Blocos de conteúdo                                                   */
/* ==================================================================== */

/** O convite para montar um roteiro. Sempre azul: roteiro é azul. */
export function BlocoRoteiro({ className = "" }: { className?: string }) {
  return (
    <CardAzul className={`p-5 ${className}`}>
      <Legenda cor="#FFFFFF">Monte seu roteiro</Legenda>
      <p
        className="mt-1.5 text-[19px] leading-tight font-bold"
        style={{ fontFamily: "var(--fonte-titulo-nova)" }}
      >
        Diga quanto tempo você tem e o Guia monta o passeio
      </p>
      <p className="mt-1.5 text-[14px] text-white/85">
        Rota pronta para abrir no Google Maps, com as paradas na ordem.
      </p>
      <div className="mt-4">
        <Botao href="/chat" pilula>
          Montar meu roteiro
        </Botao>
      </div>
    </CardAzul>
  );
}

/** O convite ao Guia, na página do estabelecimento. */
export function ConviteAoGuia({ nome }: { nome?: string }) {
  return (
    <CardAzul className="p-5">
      <Legenda cor="#FFFFFF">Pergunte ao Guia</Legenda>
      <p
        className="mt-1.5 text-[17px] leading-tight font-bold"
        style={{ fontFamily: "var(--fonte-titulo-nova)" }}
      >
        {nome ? `O que pedir no ${nome}?` : "O que pedir aqui?"}
      </p>
      <p className="mt-1.5 text-[14px] text-white/85">
        Ou peça um roteiro pela cidade, começando por aqui.
      </p>
      <div className="mt-4">
        <Botao href="/chat" pilula>
          Falar com o Guia
        </Botao>
      </div>
    </CardAzul>
  );
}

/** O vazio de uma seção: nunca só "nada aqui". */
export function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <CardVidro className="px-4 py-5">
      <p
        className="text-[14px]"
        style={{ color: "var(--color-v-texto-suave)" }}
      >
        {children}
      </p>
    </CardVidro>
  );
}

/* ==================================================================== */
/* A fileira de petúnias                                                */
/* ==================================================================== */

/**
 * A linha de petúnias que separa dois blocos.
 *
 * É o que sobrou das faixas do desenho antigo, e de propósito: cinco
 * flores pequenas dizem "Cidade das Flores" sem virar textura, que é o que
 * o documento pediu para tirar.
 */
export function FileiraDePetunias({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`flex items-center justify-center gap-3 py-4 ${className}`}
    >
      {[0, 1, 2, 3, 4].map((i) => (
        <Petunia key={i} tamanho={i === 2 ? 16 : 11} />
      ))}
    </div>
  );
}

/* ==================================================================== */
/* Promoção                                                             */
/* ==================================================================== */

/** A promoção em vidro branco, com o selo laranja à esquerda. */
export function CardPromocao({
  href,
  titulo,
  quando,
  local,
  style,
}: {
  href: string;
  titulo: string;
  /** "Toda quinta, das 18h às 23h" */
  quando: string;
  local?: string;
  style?: CSSProperties;
}) {
  return (
    <Link href={href} className="block">
      <CardVidro className="flex items-start gap-3 p-4" style={style}>
        <SeloHanko tipo="promocao" className="mt-0.5" />
        <span className="min-w-0 flex-1">
          <span
            className="block text-[16px] leading-tight font-bold"
            style={{
              color: "var(--color-v-texto)",
              fontFamily: "var(--fonte-titulo-nova)",
            }}
          >
            {titulo}
          </span>
          <span
            className="mt-1 block text-[13px]"
            style={{ color: "var(--color-v-texto-suave)" }}
          >
            {quando}
            {local ? ` · ${local}` : ""}
          </span>
        </span>
      </CardVidro>
    </Link>
  );
}

/* ==================================================================== */
/* As ações do estabelecimento                                          */
/* ==================================================================== */

/**
 * WhatsApp, Como chegar, Instagram, Cardápio — em vidro, lado a lado.
 *
 * Quatro por linha no celular e não duas: são as ações que a pessoa veio
 * fazer, e empurrar duas delas para a segunda linha faria o "Como chegar"
 * ficar abaixo da dobra em telas curtas. O rótulo cabe em uma palavra.
 *
 * Quando há menos de quatro, as que existem dividem a linha por igual em
 * vez de ficarem apertadas à esquerda.
 */
export function AcoesDoLocal({
  acoes,
  local,
}: {
  acoes: {
    rotulo: string;
    href: string;
    icone: string;
    tipo?: TipoMetrica;
  }[];
  /** O identificador do estabelecimento, para contar o clique. */
  local: string;
}) {
  if (acoes.length === 0) return null;

  const classe =
    "vidro flex min-w-0 flex-1 flex-col items-center gap-1 px-1 py-3";

  return (
    <div className="flex gap-2">
      {acoes.map((a) => {
        const dentro = (
          <>
            <span aria-hidden className="text-[19px] leading-none">
              {a.icone}
            </span>
            {/* Quebra em duas linhas em vez de cortar: em 320px o
                "Como chegar" virava "Como cheg...", e o rotulo de um botao
                nao pode ser adivinhacao. As quatro caixas crescem juntas
                porque a fileira estica os filhos. */}
            <span
              className="w-full text-center text-[11px] leading-tight font-semibold"
              style={{ color: "var(--color-v-texto)" }}
            >
              {a.rotulo}
            </span>
          </>
        );

        // Com tipo, o clique conta como indicacao no painel do comerciante.
        // Sem tipo — o cardapio, que e um pulo dentro da propria pagina —
        // e um link comum.
        return a.tipo ? (
          <LinkDeContato
            key={a.rotulo}
            href={a.href}
            tipo={a.tipo}
            local={local}
            externo={a.href.startsWith("http")}
            className={classe}
          >
            {dentro}
          </LinkDeContato>
        ) : (
          <a key={a.rotulo} href={a.href} className={classe}>
            {dentro}
          </a>
        );
      })}
    </div>
  );
}

/** "https://beeis.com.br/" vira "beeis.com.br". */
function semProtocolo(endereco: string): string {
  const sem = endereco.replace("https://", "").replace("http://", "");
  return sem.endsWith("/") ? sem.slice(0, -1) : sem;
}

/**
 * Telefone e site, embaixo das quatro acoes.
 *
 * Nao entram na fileira de cima porque la cabem quatro, e o documento
 * escolheu quais sao. Mas sumir com eles tirava do ar o telefone de quem
 * so tem telefone — e o clique deles conta como indicacao igual.
 */
export function ContatosDoLocal({
  telefone,
  site,
  local,
}: {
  telefone?: string | null;
  site?: string | null;
  local: string;
}) {
  if (!telefone && !site) return null;

  const enderecoDoSite = site
    ? site.startsWith("http")
      ? site
      : `https://${site}`
    : null;

  return (
    <div className="mt-2 space-y-2">
      {telefone && (
        <LinkDeContato
          href={`tel:${telefone.replace(/\D/g, "")}`}
          tipo="clique_telefone"
          local={local}
          externo={false}
          className="vidro flex items-center gap-3 px-4 py-3"
        >
          <span aria-hidden className="text-[17px] leading-none">
            📞
          </span>
          <span
            className="text-[14px] font-semibold"
            style={{ color: "var(--color-v-texto)" }}
          >
            {telefoneBonito(telefone)}
          </span>
        </LinkDeContato>
      )}

      {enderecoDoSite && (
        <LinkDeContato
          href={enderecoDoSite}
          tipo="clique_site"
          local={local}
          className="vidro flex items-center gap-3 px-4 py-3"
        >
          <span aria-hidden className="text-[17px] leading-none">
            🌐
          </span>
          <span
            className="truncate text-[14px] font-semibold"
            style={{ color: "var(--color-v-azul)" }}
          >
            {semProtocolo(site!)}
          </span>
        </LinkDeContato>
      )}
    </div>
  );
}

/** Uma linha de evento na página do estabelecimento: data à esquerda. */
export function LinhaEvento({
  titulo,
  dia,
  mes,
  hora,
  onde,
  descricao,
  foto,
}: {
  titulo: string;
  /** "14" */
  dia: string;
  /** "set" */
  mes: string;
  hora?: string;
  onde?: string;
  /** As duas primeiras linhas do que o evento é. */
  descricao?: string | null;
  foto?: string | null;
}) {
  return (
    <CardVidro className="flex items-start gap-3 p-3.5">
      <span
        className="grid h-12 w-12 shrink-0 place-items-center rounded-[12px] leading-none"
        style={{ backgroundColor: "var(--color-v-petunia)", color: "#FFFFFF" }}
      >
        <span
          className="text-[17px] font-bold"
          style={{ fontFamily: "var(--fonte-titulo-nova)" }}
        >
          {dia}
        </span>
        <span className="text-[9px] font-bold tracking-[0.08em] uppercase">
          {mes}
        </span>
      </span>
      <span className="min-w-0 flex-1">
        <span
          className="block text-[15px] leading-tight font-bold"
          style={{
            color: "var(--color-v-texto)",
            fontFamily: "var(--fonte-titulo-nova)",
          }}
        >
          {titulo}
        </span>
        <span
          className="block text-[13px]"
          style={{ color: "var(--color-v-texto-suave)" }}
        >
          {[hora, onde].filter(Boolean).join(" · ")}
        </span>
        {descricao && (
          <span
            className="mt-1 line-clamp-2 block text-[13px]"
            style={{ color: "var(--color-v-texto-suave)" }}
          >
            {descricao}
          </span>
        )}
      </span>

      {/* A foto do evento só no espaço que tem: numa tela de 320px ela
          espremeria o texto, e o que a pessoa precisa ler é a data. */}
      {foto && (
        <span className="relative hidden h-20 w-28 shrink-0 overflow-hidden rounded-[12px] sm:block">
          <Image
            src={foto}
            alt=""
            fill
            sizes="112px"
            className="object-cover"
          />
        </span>
      )}
    </CardVidro>
  );
}
