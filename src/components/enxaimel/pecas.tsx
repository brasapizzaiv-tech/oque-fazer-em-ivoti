import { CasaEnxaimel, Petunia, Torii } from "./icones";
import { ASSINATURA, NOME_DO_SITE } from "@/lib/marca";

/**
 * As peças menores do sistema: selos, faixa, pílulas, botões e logo.
 *
 * Todas usam só os tokens do redesenho. Nenhuma sabe de dado nem busca nada —
 * é vocabulário visual, para as telas montarem em cima.
 */

/* ------------------------------------------------------------------ */
/* Faixa de enxaimel                                                    */
/* ------------------------------------------------------------------ */

/** A divisória entre seções: 14px de parede enxaimel. */
export function FaixaEnxaimel({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`faixa-enxaimel ${className}`} />;
}

/* ------------------------------------------------------------------ */
/* Selo de seção (hanko)                                                */
/* ------------------------------------------------------------------ */

/**
 * O selo quadrado que marca o título da seção, no formato dos carimbos
 * japoneses. Vermelho com torii para evento, verde com casinha para promoção
 * — a cor já diz o assunto antes de a pessoa ler o título.
 */
export function SeloHanko({
  tipo,
  className = "",
}: {
  tipo: "evento" | "promocao";
  className?: string;
}) {
  const evento = tipo === "evento";
  return (
    <span
      aria-hidden
      className={`grid h-6 w-6 shrink-0 place-items-center rounded-[4px] ${className}`}
      style={{
        backgroundColor: evento
          ? "var(--color-torii)"
          : "var(--color-veneziana)",
        color: "var(--color-superficie)",
      }}
    >
      {evento ? <Torii tamanho={15} /> : <CasaEnxaimel tamanho={15} />}
    </span>
  );
}

/** Título de seção com o selo à esquerda. */
export function TituloSecao({
  children,
  selo,
  className = "",
}: {
  children: React.ReactNode;
  selo?: "evento" | "promocao";
  className?: string;
}) {
  return (
    <h2
      className={`flex items-center gap-2 text-[22px] leading-tight font-bold ${className}`}
      style={{
        color: "var(--color-texto)",
        fontFamily: "var(--fonte-titulo-nova)",
      }}
    >
      {selo && <SeloHanko tipo={selo} />}
      {children}
    </h2>
  );
}

/* ------------------------------------------------------------------ */
/* Pílulas de categoria                                                 */
/* ------------------------------------------------------------------ */

/**
 * A pílula de filtro. Ativa em madeira ou em vermelho, conforme o peso que a
 * tela quiser dar.
 *
 * Altura mínima de 38px porque é alvo de dedo, não de mouse.
 */
export function Chip({
  children,
  ativo = false,
  destaque = false,
  flor = false,
  onClick,
  href,
}: {
  children: React.ReactNode;
  ativo?: boolean;
  /** Ativa em vermelho torii, para o filtro que a tela quer empurrar. */
  destaque?: boolean;
  /** Põe a petúnia à esquerda, para a categoria Flores. */
  flor?: boolean;
  onClick?: () => void;
  href?: string;
}) {
  const estilo: React.CSSProperties = ativo
    ? {
        backgroundColor: destaque
          ? "var(--color-torii)"
          : "var(--color-madeira)",
        borderColor: destaque ? "var(--color-torii)" : "var(--color-madeira)",
        color: "var(--color-superficie)",
      }
    : {
        backgroundColor: "var(--color-superficie)",
        borderColor: "var(--color-madeira)",
        color: "var(--color-texto)",
      };

  const conteudo = (
    <>
      {flor && <Petunia tamanho={14} />}
      {children}
    </>
  );

  const classe =
    "inline-flex h-[38px] shrink-0 items-center gap-1.5 rounded-full border-[1.5px] px-4 text-[13px] font-medium whitespace-nowrap transition";

  if (href) {
    return (
      <a href={href} className={classe} style={estilo}>
        {conteudo}
      </a>
    );
  }
  return (
    <button type="button" onClick={onClick} className={classe} style={estilo}>
      {conteudo}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Selos de status                                                      */
/* ------------------------------------------------------------------ */

/** Aberto, fechado, evento, promoção — em caixa alta, pequenos e firmes. */
export function SeloStatus({
  tipo,
  children,
}: {
  tipo: "aberto" | "fechado" | "evento" | "promocao";
  children?: React.ReactNode;
}) {
  const cores: Record<string, string> = {
    aberto: "var(--color-veneziana)",
    fechado: "var(--color-telha)",
    evento: "var(--color-torii)",
    promocao: "var(--color-veneziana)",
  };
  const rotulos: Record<string, string> = {
    aberto: "Aberto",
    fechado: "Fechado",
    evento: "Evento",
    promocao: "Promoção",
  };

  return (
    <span
      className="inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold tracking-[0.08em] uppercase"
      style={{ backgroundColor: cores[tipo], color: "var(--color-superficie)" }}
    >
      {children ?? rotulos[tipo]}
    </span>
  );
}

/** A legenda em caixa alta que abre um bloco. */
export function Legenda({
  children,
  cor = "var(--color-texto-suave)",
}: {
  children: React.ReactNode;
  cor?: string;
}) {
  return (
    <span
      className="text-[11px] font-bold tracking-[0.12em] uppercase"
      style={{ color: cor }}
    >
      {children}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Botões                                                               */
/* ------------------------------------------------------------------ */

/** Ação principal em vermelho torii; secundária vazada na madeira. */
export function Botao({
  children,
  tom = "principal",
  href,
  onClick,
  larguraTotal = false,
  type = "button",
}: {
  children: React.ReactNode;
  tom?: "principal" | "secundario";
  href?: string;
  onClick?: () => void;
  larguraTotal?: boolean;
  type?: "button" | "submit";
}) {
  const principal = tom === "principal";
  const estilo: React.CSSProperties = principal
    ? { backgroundColor: "var(--color-torii)", color: "#fff7ea" }
    : {
        backgroundColor: "transparent",
        color: "var(--color-madeira)",
        borderColor: "var(--color-madeira)",
      };

  // 48px de altura: acima do mínimo de toque, com folga para o dedo grande.
  const classe = [
    "inline-flex h-12 items-center justify-center gap-2 rounded-[11px] px-5 text-[14px] font-bold transition active:translate-y-px",
    principal ? "" : "border-2",
    larguraTotal ? "w-full" : "",
  ].join(" ");

  if (href) {
    return (
      <a href={href} className={classe} style={estilo}>
        {children}
      </a>
    );
  }
  return (
    <button type={type} onClick={onClick} className={classe} style={estilo}>
      {children}
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Logo                                                                 */
/* ------------------------------------------------------------------ */

/**
 * A marca: torii à esquerda, nome ao centro, casa enxaimel à direita.
 *
 * Os dois ícones têm o mesmo tamanho e a mesma linha de base — são as duas
 * heranças da cidade, e uma não pode parecer maior que a outra.
 *
 * O nome entra por parâmetro porque está em discussão: o site foi rebatizado
 * para "O Guia de Ivoti" em 15/09/2026, e o domínio no ar é esse.
 */
export function Logo({
  nome = NOME_DO_SITE,
  claro = false,
}: {
  nome?: string;
  /** Sobre o cabeçalho escuro, o texto e os ícones viram creme. */
  claro?: boolean;
}) {
  const tinta = claro ? "var(--color-creme-claro)" : "var(--color-madeira)";

  return (
    <span className="flex items-center gap-2.5">
      <Torii
        tamanho={34}
        className="shrink-0"
        style={{ color: "var(--color-torii)" }}
      />

      <span className="flex flex-col items-center leading-none">
        <span
          className=" text-[17px] font-bold"
          style={{ color: tinta, fontFamily: "var(--fonte-titulo-nova)" }}
        >
          {nome}
        </span>
        <span className="mt-1 flex items-center gap-1">
          <span
            className="text-[10px] font-medium"
            style={{
              color: claro
                ? "var(--color-petunia-clara)"
                : "var(--color-petunia)",
            }}
          >
            {ASSINATURA}
          </span>
          <Petunia tamanho={11} />
        </span>
      </span>

      <CasaEnxaimel
        tamanho={34}
        className="shrink-0"
        style={{ color: tinta }}
      />
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Faixa de telhas                                                      */
/* ------------------------------------------------------------------ */

/** As telhas na base do cabeçalho: listras verticais em dois terracotas. */
export function FaixaTelhas({ altura = 7 }: { altura?: number }) {
  return (
    <div
      aria-hidden
      style={{
        height: altura,
        backgroundImage:
          "repeating-linear-gradient(90deg, var(--color-telha) 0 9px, var(--color-telha-funda) 9px 18px)",
      }}
    />
  );
}
