import type { CSSProperties } from "react";

/* ==================================================================== */
/* Os três símbolos de Ivoti                                            */
/* ==================================================================== */
/* A cidade tem três heranças e elas aparecem nos símbolos, não em
   textura de fundo: o torii da colônia japonesa, a casa enxaimel da
   colonização alemã e a petúnia da Cidade das Flores.

   Os três têm a mesma altura de desenho e a mesma linha de base. Um
   maior que o outro no logo diria que uma herança vale mais. */

type Props = {
  tamanho?: number;
  className?: string;
  style?: CSSProperties;
};

/** O torii: dois montantes e duas travessas, em traço vermelho. */
export function Torii({ tamanho = 34, className = "", style }: Props) {
  const a = (tamanho * 30) / 34;
  return (
    <svg
      width={tamanho}
      height={a}
      viewBox="0 0 34 30"
      fill="none"
      aria-hidden
      className={className}
      style={{ color: "var(--color-v-torii)", ...style }}
    >
      {/* a travessa de cima, com as pontas viradas para cima */}
      <path
        d="M2 5.5 Q17 2.5 32 5.5"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      <path
        d="M5 9.5h24"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* os dois montantes, ligeiramente abertos como nos torii de verdade */}
      <path
        d="M8.5 9.5 7 28M25.5 9.5 27 28"
        stroke="currentColor"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* a travessa baixa */}
      <path
        d="M8 15h18"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

/**
 * A casa enxaimel: parede branca, telhado terracota, vigas escuras,
 * porta verde.
 *
 * Colorida e não em traço, porque é o único dos três símbolos que as
 * pessoas reconhecem pela cor do telhado antes de reconhecer a forma.
 *
 * O desenho é o mínimo que ainda se lê a 34px: duas vigas em pé, uma
 * travessa e um V — a figura que os alemães chamam de "Mann". A cruz de
 * Santo André inteira, que a casa de verdade tem, vira rabisco nesse
 * tamanho; e a beirada do telhado fica curta, porque a beirada longa
 * transformava a silhueta num cogumelo.
 */
export function CasaEnxaimel({ tamanho = 34, className = "", style }: Props) {
  const a = (tamanho * 30) / 34;
  return (
    <svg
      width={tamanho}
      height={a}
      viewBox="0 0 34 30"
      fill="none"
      aria-hidden
      className={className}
      style={style}
    >
      {/* parede */}
      <path d="M6.5 13h21v15h-21z" fill="#FFFFFF" />
      {/* telhado, com beirada curta dos dois lados */}
      <path d="M17 2.5 30.5 13.5h-27z" fill="#B5533A" />
      {/* as vigas: dois montantes, a travessa e o V */}
      <g stroke="#3B2418" strokeWidth="1.8" strokeLinecap="round">
        <path d="M9 14v13.5M25 14v13.5" />
        <path d="M9 20h16" />
        <path d="m9 20 8 7.5 8-7.5" />
      </g>
      {/* o baldrame, que fecha a casa embaixo */}
      <path
        d="M6 28h22"
        stroke="#3B2418"
        strokeWidth="2.2"
        strokeLinecap="round"
      />
      {/* porta */}
      <path d="M15 22.5h4v5.5h-4z" fill="#3E9B5B" />
    </svg>
  );
}

/** A petúnia: cinco pétalas, garganta funda e miolo claro. */
export function Petunia({ tamanho = 16, className = "", style }: Props) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
      style={style}
    >
      <g fill="#B94A8C">
        {[0, 72, 144, 216, 288].map((g) => (
          <ellipse
            key={g}
            cx="12"
            cy="6.2"
            rx="4.6"
            ry="5.4"
            transform={`rotate(${g} 12 12)`}
          />
        ))}
      </g>
      <circle cx="12" cy="12" r="4.1" fill="#7E2A6B" />
      <circle cx="12" cy="12" r="1.9" fill="#F7E7A6" />
    </svg>
  );
}

/* ==================================================================== */
/* Ícones de interface — traço de 2px                                   */
/* ==================================================================== */

type IconeProps = {
  tamanho?: number;
  className?: string;
  style?: CSSProperties;
};

function Traco({
  children,
  tamanho = 22,
  className = "",
  style,
}: IconeProps & { children: React.ReactNode }) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
      style={style}
    >
      {children}
    </svg>
  );
}

export function IconeInicio(p: IconeProps) {
  return (
    <Traco {...p}>
      <path d="M3 10.5 12 3l9 7.5" />
      <path d="M5.5 9.5V20h13V9.5" />
      <path d="M10 20v-5h4v5" />
    </Traco>
  );
}

export function IconeExplorar(p: IconeProps) {
  return (
    <Traco {...p}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.6-3.6" />
    </Traco>
  );
}

/**
 * O roteiro: dois pontos de parada ligados por um caminho que serpenteia.
 *
 * A primeira versão usava um pontilhado de pontos redondos e, a 22px,
 * virava confete ao lado dos dois círculos — não se lia como caminho.
 * Traço cheio, com a curva fazendo o trabalho que o pontilhado tentava.
 */
export function IconeRoteiros(p: IconeProps) {
  return (
    <Traco {...p}>
      <circle cx="5.5" cy="5.5" r="2.5" />
      <circle cx="18.5" cy="18.5" r="2.5" />
      <path d="M8 5.5h5.5a4 4 0 0 1 0 8h-3a4 4 0 0 0 0 8H16" />
    </Traco>
  );
}

export function IconeGuia(p: IconeProps) {
  return (
    <Traco {...p}>
      <path d="M4 5.5h16v11H9l-5 4.5z" />
    </Traco>
  );
}

export function IconeVoltar(p: IconeProps) {
  return (
    <Traco {...p}>
      <path d="m14.5 5-7 7 7 7" />
    </Traco>
  );
}

export function IconeFiltros(p: IconeProps) {
  return (
    <Traco {...p}>
      <path d="M3 6h18M6 12h12M10 18h4" />
    </Traco>
  );
}

/** O coração dos favoritos. Cheio quando marcado, vazado quando não. */
export function IconeFavorito({
  marcado = false,
  ...p
}: IconeProps & { marcado?: boolean }) {
  return (
    <svg
      width={p.tamanho ?? 22}
      height={p.tamanho ?? 22}
      viewBox="0 0 24 24"
      fill={marcado ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      aria-hidden
      className={p.className}
      style={p.style}
    >
      <path d="M12 20.5s-7.5-4.7-7.5-9.8A4.2 4.2 0 0 1 12 8.2a4.2 4.2 0 0 1 7.5 2.5c0 5.1-7.5 9.8-7.5 9.8z" />
    </svg>
  );
}

export function IconeEnviar(p: IconeProps) {
  return (
    <Traco {...p}>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </Traco>
  );
}
