import Image from "next/image";
import Link from "next/link";
import CardMadeira from "./CardMadeira";
import { Trelica } from "./icones";
import { Botao, Legenda, SeloStatus } from "./pecas";
import { quandoPorExtenso } from "@/lib/horarios";
import { quandoVale } from "@/lib/promocoes";
import type { EventoNaTela } from "@/lib/eventos";
import type { PromocaoNaTela } from "@/components/CartaoPromocao";

/**
 * Os blocos montados a partir dos componentes: evento, promoção e a chamada
 * do roteiro.
 *
 * Ficam separados das peças porque estes já sabem de dado — recebem um evento,
 * uma promoção — enquanto as peças são só vocabulário visual.
 */

/* ------------------------------------------------------------------ */
/* Evento                                                               */
/* ------------------------------------------------------------------ */

/**
 * O card de evento da fileira horizontal do Início.
 *
 * Largura fixa porque a fileira rola de lado: card elástico numa fileira
 * rolável fica de tamanho diferente conforme o conteúdo, e a fileira perde o
 * ritmo.
 */
export function CardEvento({
  evento,
  variante = 1,
}: {
  evento: EventoNaTela;
  variante?: 1 | 2;
}) {
  const onde = evento.local?.nome ?? evento.local_texto;

  return (
    <div className="w-[260px] shrink-0">
      <CardMadeira variante={variante}>
        <Link href={evento.local ? `/local/${evento.local.slug}` : "/agenda"}>
          <div className="relative h-[130px]">
            {evento.imagem_url ? (
              <Image
                src={evento.imagem_url}
                alt=""
                fill
                sizes="260px"
                className="object-cover"
              />
            ) : (
              <Trelica />
            )}
            <span className="absolute top-2 right-2">
              <SeloStatus tipo="evento" />
            </span>
          </div>

          <div className="p-3">
            <Legenda cor="var(--color-torii)">
              {quandoPorExtenso(evento.inicio)}
            </Legenda>
            <p
              className="mt-1 line-clamp-2  text-[16px] leading-tight font-bold"
              style={{
                color: "var(--color-texto)",
                fontFamily: "var(--fonte-titulo-nova)",
              }}
            >
              {evento.titulo}
            </p>
            {onde && (
              <p
                className="mt-1 truncate text-[13px]"
                style={{ color: "var(--color-texto-suave)" }}
              >
                {onde}
              </p>
            )}
          </div>
        </Link>
      </CardMadeira>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Promoção                                                             */
/* ------------------------------------------------------------------ */

/** A promoção fixa: o que vale, quando vale e onde. */
export function CardPromocao({
  promocao,
  variante = 1,
}: {
  promocao: PromocaoNaTela;
  variante?: 1 | 2;
}) {
  return (
    <CardMadeira variante={variante}>
      <Link
        href={promocao.local ? `/local/${promocao.local.slug}` : "/explorar"}
        className="flex gap-3 p-3"
      >
        <span
          aria-hidden
          className="grid h-11 w-11 shrink-0 place-items-center rounded-[6px] text-[20px]"
          style={{
            backgroundColor: "var(--color-veneziana)",
            color: "var(--color-superficie)",
          }}
        >
          %
        </span>

        <span className="min-w-0 flex-1">
          <span
            className="block  text-[16px] leading-tight font-bold"
            style={{
              color: "var(--color-texto)",
              fontFamily: "var(--fonte-titulo-nova)",
            }}
          >
            {promocao.titulo}
          </span>
          <span
            className="mt-0.5 block text-[13px]"
            style={{ color: "var(--color-texto-suave)" }}
          >
            {quandoVale(promocao)}
          </span>
          {promocao.local && (
            <span
              className="mt-0.5 block truncate text-[13px] font-medium"
              style={{ color: "var(--color-texto)" }}
            >
              {promocao.local.nome}
            </span>
          )}
        </span>
      </Link>
    </CardMadeira>
  );
}

/* ------------------------------------------------------------------ */
/* Chamada do roteiro                                                   */
/* ------------------------------------------------------------------ */

/**
 * O bloco vermelho que leva ao roteiro.
 *
 * É o único bloco cheio de cor da página, e é de propósito: montar um roteiro
 * é o que o guia faz que nenhuma lista de endereços faz, e precisa ser a
 * coisa mais visível depois do que está acontecendo hoje.
 */
export function BlocoRoteiro() {
  return (
    <section
      className="px-4 py-7 text-center"
      style={{ backgroundColor: "var(--color-torii)" }}
    >
      <p
        className=" text-[22px] leading-tight font-bold"
        style={{ color: "#fff7ea", fontFamily: "var(--fonte-titulo-nova)" }}
      >
        Monte seu roteiro
      </p>
      <p
        className="mx-auto mt-2 max-w-[300px] text-[14px]"
        style={{ color: "#f7dcd2" }}
      >
        Diga quanto tempo você tem. A rota sai pronta para abrir no Google Maps.
      </p>
      <div className="mt-5 flex justify-center">
        {/* O link E o botao, e nao um link dentro de uma caixa estilizada:
            assim a area de toque inteira leva ao roteiro, em vez de so o
            texto no meio dela. */}
        <Link
          href="/chat"
          className="inline-flex h-12 items-center justify-center rounded-[11px] px-6 text-[14px] font-bold"
          style={{
            backgroundColor: "var(--color-superficie)",
            color: "var(--color-torii)",
          }}
        >
          Começar agora
        </Link>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Fileira rolável                                                      */
/* ------------------------------------------------------------------ */

/**
 * A fileira que rola de lado, com o degradê e a seta que dizem que continua.
 *
 * O degradê não é enfeite: sem ele, e com a barra de rolagem escondida, nada
 * na tela avisa que existe mais conteúdo para o lado — foi assim que o
 * Explorar antigo escondeu 18 das 21 etiquetas de quem visitava.
 */
export function Fileira({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <div className="sem-barra flex gap-3 overflow-x-auto px-4 pb-1">
        {children}
      </div>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-12"
        style={{
          backgroundImage:
            "linear-gradient(to left, var(--color-reboco), transparent)",
        }}
      />
      <span
        aria-hidden
        className="pointer-events-none absolute top-1/2 right-2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-full text-[15px]"
        style={{
          backgroundColor: "var(--color-superficie)",
          border: "1.5px solid var(--color-madeira)",
          color: "var(--color-madeira)",
        }}
      >
        ›
      </span>
    </div>
  );
}

/** O bloco que aparece quando uma seção não tem nada para mostrar. */
export function Vazio({ children }: { children: React.ReactNode }) {
  return (
    <p
      className="px-4 text-[14px]"
      style={{ color: "var(--color-texto-suave)" }}
    >
      {children}
    </p>
  );
}

export { Botao };
