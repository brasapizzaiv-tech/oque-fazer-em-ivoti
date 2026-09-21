import Link from "next/link";
import type { CSSProperties } from "react";
import { CasaEnxaimel, Petunia, Torii } from "./icones";
import { ASSINATURA, NOME_DO_SITE } from "@/lib/marca";

/* ==================================================================== */
/* Cartões                                                              */
/* ==================================================================== */

/**
 * O cartão de vidro: o padrão de tudo o que não tem foto.
 *
 * O desfoque só existe porque há foto por trás do site inteiro. Num fundo
 * chapado ele não apareceria, e o cartão viraria um retângulo branco
 * qualquer — por isso o fundo fixo da cidade não é enfeite, é o que faz
 * esta peça funcionar.
 */
export function CardVidro({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`vidro ${className}`} style={style}>
      {children}
    </div>
  );
}

/** O vidro azul: os blocos de destaque, sempre com texto branco. */
export function CardAzul({
  children,
  className = "",
  style,
}: {
  children: React.ReactNode;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div className={`vidro-azul ${className}`} style={style}>
      {children}
    </div>
  );
}

/* ==================================================================== */
/* Legendas e selos                                                     */
/* ==================================================================== */

/**
 * A legenda em caixa alta que abre um bloco ou etiqueta um card.
 *
 * Sobre o vidro azul ela vai BRANCA, não no rosa-claro da marca: medido
 * sobre a parte clara da foto de fundo, o rosa dá 3,5 de contraste e o
 * mínimo para texto pequeno é 4,5. O rosa continua valendo onde nasceu —
 * a assinatura do logo e a etiqueta sobre foto, que têm o degradê escuro
 * por baixo.
 */
export function Legenda({
  children,
  cor = "var(--color-v-texto-suave)",
  className = "",
}: {
  children: React.ReactNode;
  cor?: string;
  className?: string;
}) {
  return (
    <span
      className={`text-[11px] font-bold tracking-[0.1em] uppercase ${className}`}
      style={{ color: cor }}
    >
      {children}
    </span>
  );
}

/**
 * O selo de seção, no formato de um hanko — o carimbo japonês.
 *
 * Quadrado de canto levemente arredondado, com o símbolo vazado em branco.
 * Vem à esquerda do título e diz de que assunto é a seção pela cor, antes
 * de a pessoa ler a palavra.
 */
export function SeloHanko({
  tipo,
  tamanho = 25,
  className = "",
}: {
  tipo: "evento" | "promocao";
  tamanho?: number;
  className?: string;
}) {
  const evento = tipo === "evento";
  return (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center ${className}`}
      style={{
        width: tamanho,
        height: tamanho,
        borderRadius: 4,
        backgroundColor: evento
          ? "var(--color-v-petunia)"
          : "var(--color-v-laranja)",
      }}
    >
      {evento ? (
        <Torii tamanho={tamanho - 9} style={{ color: "#FFFFFF" }} />
      ) : (
        <CasaBranca tamanho={tamanho - 9} />
      )}
    </span>
  );
}

/** A casinha vazada em branco, para dentro do selo laranja. */
function CasaBranca({ tamanho }: { tamanho: number }) {
  return (
    <svg
      width={tamanho}
      height={(tamanho * 30) / 34}
      viewBox="0 0 34 30"
      fill="none"
      aria-hidden
    >
      <path d="M17 3 32 14.5h-4V28H6V14.5H2z" fill="#FFFFFF" />
      <path d="M14.5 20h5v8h-5z" fill="var(--color-v-laranja)" />
    </svg>
  );
}

/** Aberto, fechado, evento, promoção — pequenos e firmes. */
export function SeloStatus({
  tipo,
  sobreFoto = false,
  children,
}: {
  tipo: "aberto" | "fechado" | "evento" | "promocao";
  /** Sobre foto o "fechado" vira laranja, que o vermelho some no escuro. */
  sobreFoto?: boolean;
  children?: React.ReactNode;
}) {
  const cores: Record<string, string> = {
    aberto: "var(--color-v-verde)",
    fechado: sobreFoto
      ? "var(--color-v-fechado-escuro)"
      : "var(--color-v-fechado-claro)",
    evento: "var(--color-v-petunia)",
    promocao: "var(--color-v-laranja)",
  };
  const rotulos: Record<string, string> = {
    aberto: "Aberto",
    fechado: "Fechado",
    evento: "Evento",
    promocao: "Promoção",
  };

  return (
    <span
      className="inline-flex items-center rounded-full px-2 py-[3px] text-[10px] font-bold tracking-[0.08em] uppercase"
      style={{ backgroundColor: cores[tipo], color: "#FFFFFF" }}
    >
      {children ?? rotulos[tipo]}
    </span>
  );
}

/* ==================================================================== */
/* Pílulas de categoria                                                 */
/* ==================================================================== */

/**
 * A pílula de categoria.
 *
 * Vidro branco quando não escolhida, vermelha quando escolhida — uma cor
 * só para "é esta que está valendo", em qualquer lugar do site.
 */
export function Chip({
  children,
  href,
  ativo = false,
  flor = false,
}: {
  children: React.ReactNode;
  href?: string;
  ativo?: boolean;
  /** Acende a petúnia à esquerda, na categoria das flores. */
  flor?: boolean;
}) {
  const classe =
    "inline-flex h-[37px] shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] font-medium whitespace-nowrap transition";

  const estilo: CSSProperties = ativo
    ? { backgroundColor: "var(--color-v-torii)", color: "#FFFFFF" }
    : { color: "var(--color-v-texto)" };

  const conteudo = (
    <>
      {flor && <Petunia tamanho={13} />}
      {children}
    </>
  );

  if (href)
    return (
      <Link
        href={href}
        className={`${classe} ${ativo ? "" : "vidro-leve"}`}
        style={estilo}
        aria-current={ativo ? "page" : undefined}
      >
        {conteudo}
      </Link>
    );

  return (
    <span className={`${classe} ${ativo ? "" : "vidro-leve"}`} style={estilo}>
      {conteudo}
    </span>
  );
}

/* ==================================================================== */
/* Botões                                                               */
/* ==================================================================== */

/**
 * Principal vermelho, secundário em vidro com letra azul.
 *
 * 48px de altura: acima do mínimo de toque de 44px, com folga para o dedo
 * que erra um pouco.
 */
export function Botao({
  children,
  tom = "principal",
  href,
  onClick,
  type = "button",
  larguraTotal = false,
  pilula = false,
  className = "",
}: {
  children: React.ReactNode;
  tom?: "principal" | "secundario" | "ouro";
  href?: string;
  onClick?: () => void;
  type?: "button" | "submit";
  larguraTotal?: boolean;
  pilula?: boolean;
  className?: string;
}) {
  const estilos: Record<string, CSSProperties> = {
    principal: { backgroundColor: "var(--color-v-torii)", color: "#FFFFFF" },
    secundario: {
      color: "var(--color-v-azul)",
      borderColor: "var(--color-v-azul)",
    },
    ouro: { backgroundColor: "var(--color-v-ouro)", color: "#2B2320" },
  };

  const classe = [
    "inline-flex h-12 items-center justify-center gap-2 px-6 text-[14px] font-bold transition active:translate-y-px",
    pilula ? "rounded-full" : "rounded-[11px]",
    tom === "secundario" ? "vidro-leve border" : "",
    larguraTotal ? "w-full" : "",
    className,
  ].join(" ");

  if (href)
    return (
      <Link href={href} className={classe} style={estilos[tom]}>
        {children}
      </Link>
    );

  return (
    <button
      type={type}
      onClick={onClick}
      className={classe}
      style={estilos[tom]}
    >
      {children}
    </button>
  );
}

/* ==================================================================== */
/* Logo                                                                 */
/* ==================================================================== */

/**
 * A marca: torii à esquerda, nome ao centro, casa enxaimel à direita.
 *
 * Os dois ícones têm o mesmo tamanho e a mesma linha de base — são as duas
 * heranças da cidade, e uma não pode parecer maior que a outra. A petúnia
 * fecha a assinatura embaixo: é a terceira identidade, e cabe pequena
 * porque já dá nome à frase.
 *
 * Sobre foto o nome vai branco com sombra; a assinatura, em rosa-claro.
 */
export function Logo({
  sobreFoto = false,
  nome = NOME_DO_SITE,
}: {
  sobreFoto?: boolean;
  nome?: string;
}) {
  const tinta = sobreFoto ? "#FFFFFF" : "var(--color-v-texto)";

  return (
    <span className="flex items-center gap-2.5">
      <Torii tamanho={34} className="shrink-0" />

      <span className="flex flex-col items-center leading-none">
        <span
          className={`text-[17px] font-bold ${sobreFoto ? "sobre-foto" : ""}`}
          style={{ color: tinta, fontFamily: "var(--fonte-titulo-nova)" }}
        >
          {nome}
        </span>
        <span className="mt-1 flex items-center gap-1">
          <span
            className="text-[10px] font-bold tracking-[0.08em] uppercase"
            style={{
              color: sobreFoto
                ? "var(--color-v-rosa-clara)"
                : "var(--color-v-petunia)",
            }}
          >
            {ASSINATURA}
          </span>
          <Petunia tamanho={11} />
        </span>
      </span>

      <CasaEnxaimel tamanho={34} className="shrink-0" />
    </span>
  );
}
