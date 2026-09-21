import Image from "next/image";
import Link from "next/link";
import {
  emLinhas,
  periodoPorExtenso,
  variaveisDoTema,
  type Tema,
} from "@/lib/temas";
import { CardAzul, CardVidro, Legenda } from "./pecas";
import { Petunia } from "./icones";

/* ==================================================================== */
/* A roupagem da feira                                                  */
/* ==================================================================== */

/**
 * As variáveis do tema, aplicadas ao site inteiro.
 *
 * Um `<div>` com três variáveis em vez de uma folha de estilo trocada:
 * assim a feira é um valor que desce pela árvore, e qualquer bloco que já
 * usa a cor de link ou o vidro de destaque muda junto sem saber que há
 * uma festa acontecendo.
 *
 * Fora de feira não renderiza nada — nem o `<div>` — para o site normal
 * não carregar um envelope vazio.
 */
export function RoupaDaFeira({
  tema,
  children,
}: {
  tema: Tema | null;
  children: React.ReactNode;
}) {
  if (!tema) return <>{children}</>;

  return (
    <div
      style={variaveisDoTema(tema) as React.CSSProperties}
      data-feira={tema.slug}
    >
      {children}
    </div>
  );
}

/**
 * O selo com o nome e as datas da feira.
 *
 * Vai sobre a capa, onde a pessoa chega. Traz o logo oficial quando há um
 * — é o que o visitante reconhece de cartaz e de rádio, antes de ler o
 * nome escrito.
 */
export function SeloDaFeira({ tema }: { tema: Tema }) {
  const periodo = periodoPorExtenso(tema);

  return (
    <span
      className="inline-flex items-center gap-2.5 rounded-full py-1.5 pr-4 pl-1.5"
      style={{
        backgroundColor:
          "rgb(var(--vidro-azul-rgb) / calc(var(--vidro-azul-alfa) + 0.1))",
        backdropFilter: "blur(10px)",
      }}
    >
      {tema.logo_url ? (
        <span className="relative block h-9 w-9 shrink-0 overflow-hidden rounded-full bg-white">
          <Image
            src={tema.logo_url}
            alt=""
            fill
            sizes="36px"
            className="object-contain p-0.5"
          />
        </span>
      ) : (
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-white">
          <Petunia tamanho={20} />
        </span>
      )}

      <span className="flex flex-col leading-none">
        <span
          className="text-[14px] font-bold text-white"
          style={{ fontFamily: "var(--fonte-titulo-nova)" }}
        >
          {tema.subtitulo ? `${tema.subtitulo} ${tema.nome}` : tema.nome}
        </span>
        {periodo && (
          <span className="mt-1 text-[11px] font-semibold text-white/85">
            {periodo}
          </span>
        )}
      </span>
    </span>
  );
}

/**
 * O bloco da feira na Início: programação, expositores e rota.
 *
 * Fica logo abaixo da capa, acima de tudo o mais, durante os dias da
 * feira. É o que a cidade inteira está procurando naquela semana, e
 * empurrá-lo para baixo dos eventos comuns seria esconder a manchete.
 *
 * Cada pedaço só aparece se tiver conteúdo: uma feira sem lista de
 * expositores cadastrada mostra a programação e a rota, e não um título
 * seguido de vazio.
 */
export function BlocoDaFeira({ tema }: { tema: Tema }) {
  const programacao = emLinhas(tema.programacao);
  const expositores = emLinhas(tema.expositores);
  const periodo = periodoPorExtenso(tema);

  const rota =
    tema.lat != null && tema.lng != null
      ? `https://www.google.com/maps/dir/?api=1&destination=${tema.lat},${tema.lng}`
      : tema.onde
        ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(
            `${tema.onde} Ivoti RS`,
          )}`
        : null;

  return (
    <CardAzul className="p-5">
      <div className="flex items-start gap-3">
        {tema.logo_url && (
          <span className="relative block h-12 w-12 shrink-0 overflow-hidden rounded-full bg-white">
            <Image
              src={tema.logo_url}
              alt=""
              fill
              sizes="48px"
              className="object-contain p-1"
            />
          </span>
        )}
        <div className="min-w-0">
          <Legenda cor="#FFFFFF">Acontecendo agora</Legenda>
          <p
            className="mt-1 text-[20px] leading-tight font-bold"
            style={{ fontFamily: "var(--fonte-titulo-nova)" }}
          >
            {tema.subtitulo ? `${tema.subtitulo} ${tema.nome}` : tema.nome}
          </p>
          {periodo && (
            <p className="mt-0.5 text-[13px] text-white/85">{periodo}</p>
          )}
          {tema.onde && (
            <p className="text-[13px] text-white/85">{tema.onde}</p>
          )}
        </div>
      </div>

      {programacao.length > 0 && (
        <div className="mt-4">
          <RiscoDoTema />
          <Legenda cor="#FFFFFF">Programação</Legenda>
          <ul className="mt-2 space-y-1">
            {programacao.map((linha) => (
              <li key={linha} className="text-[14px] text-white/90">
                {linha}
              </li>
            ))}
          </ul>
        </div>
      )}

      {expositores.length > 0 && (
        <div className="mt-4">
          <RiscoDoTema />
          <Legenda cor="#FFFFFF">Expositores</Legenda>
          <p className="mt-2 text-[14px] text-white/90">
            {expositores.join(" · ")}
          </p>
        </div>
      )}

      <div className="mt-5 flex flex-wrap gap-2">
        {tema.link_programacao && (
          <BotaoDaFeira href={tema.link_programacao} externo>
            Ver programação
          </BotaoDaFeira>
        )}
        {rota && (
          <BotaoDaFeira href={rota} externo>
            Como chegar
          </BotaoDaFeira>
        )}
        {tema.locais.length > 0 && (
          <BotaoDaFeira href="/explorar?feira=1">Expositores</BotaoDaFeira>
        )}
      </div>
    </CardAzul>
  );
}

/**
 * O risco na cor de destaque, acima de cada titulo do bloco.
 *
 * A cor clara do tema saiu das letras: sobre o vidro da feira ela dava 2,5
 * de contraste, e texto pequeno precisa de 4,5. Como risco ela aparece do
 * mesmo jeito e ninguem precisa le-la.
 */
function RiscoDoTema() {
  return (
    <span
      aria-hidden
      className="mb-2 block h-[3px] w-8 rounded-full"
      style={{ backgroundColor: "var(--color-v-tema-destaque)" }}
    />
  );
}

/** O botão secundário do bloco: vazado em branco sobre a cor do tema. */
function BotaoDaFeira({
  href,
  children,
  externo = false,
}: {
  href: string;
  children: React.ReactNode;
  externo?: boolean;
}) {
  const classe =
    "inline-flex h-11 items-center rounded-full border-2 border-white/70 px-5 text-[13px] font-bold text-white";

  if (externo)
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classe}
      >
        {children}
      </a>
    );

  return (
    <Link href={href} className={classe}>
      {children}
    </Link>
  );
}

/**
 * O aviso da feira nas telas internas.
 *
 * Uma linha em vidro, discreta: quem já está lendo a página de um
 * restaurante não precisa do bloco inteiro de novo, só de saber que a
 * feira está acontecendo e onde clicar.
 */
export function AvisoDaFeira({ tema }: { tema: Tema }) {
  return (
    <Link href="/" className="block">
      <CardVidro className="flex items-center gap-3 px-4 py-3">
        <span
          aria-hidden
          className="h-9 w-1.5 shrink-0 rounded-full"
          style={{ backgroundColor: "var(--color-v-azul)" }}
        />
        <span className="min-w-0 flex-1">
          <Legenda cor="var(--color-v-azul)">Acontecendo agora</Legenda>
          <span
            className="block text-[15px] leading-tight font-bold"
            style={{
              color: "var(--color-v-texto)",
              fontFamily: "var(--fonte-titulo-nova)",
            }}
          >
            {tema.subtitulo ? `${tema.subtitulo} ${tema.nome}` : tema.nome}
          </span>
        </span>
      </CardVidro>
    </Link>
  );
}
