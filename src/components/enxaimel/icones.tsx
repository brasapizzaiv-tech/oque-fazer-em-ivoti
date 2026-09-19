/**
 * Os três símbolos de Ivoti, desenhados.
 *
 * Torii (colônia japonesa), casa enxaimel (herança alemã) e petúnia (cidade
 * das flores). Desenhados e não emoji: emoji muda de forma em cada aparelho,
 * e estes três são a identidade do site — precisam sair iguais no Android, no
 * iPhone e no computador.
 *
 * Todos herdam a cor de quem os contém (`currentColor`), menos a petúnia, que
 * tem três cores próprias — pétala, garganta e miolo.
 */

/** O torii da Colônia Japonesa. 34x30 no logo, por especificação. */
export function Torii({
  className = "",
  tamanho = 34,
  style,
}: {
  className?: string;
  tamanho?: number;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={tamanho}
      height={(tamanho * 30) / 34}
      viewBox="0 0 34 30"
      fill="none"
      aria-hidden
      className={className}
      style={style}
    >
      {/* A viga de cima, com as pontas viradas para cima, como no portal real */}
      <path
        d="M2 6.5c4-1.6 9.5-2.5 15-2.5s11 .9 15 2.5v3.2c-4-1.4-9.5-2.2-15-2.2S6 8.3 2 9.7V6.5Z"
        fill="currentColor"
      />
      {/* A travessa */}
      <rect x="5.5" y="12" width="23" height="3" rx="1" fill="currentColor" />
      {/* As duas colunas, levemente inclinadas para dentro */}
      <path d="M8.5 9.2h3.6L11 29H7.2L8.5 9.2Z" fill="currentColor" />
      <path d="M25.5 9.2h-3.6L23 29h3.8L25.5 9.2Z" fill="currentColor" />
    </svg>
  );
}

/** A casa enxaimel: reboco claro, vigas escuras, telhado. */
export function CasaEnxaimel({
  className = "",
  tamanho = 34,
  style,
}: {
  className?: string;
  tamanho?: number;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={tamanho}
      height={(tamanho * 30) / 34}
      viewBox="0 0 34 30"
      fill="none"
      aria-hidden
      className={className}
      style={style}
    >
      {/* Telhado, em madeira cheia */}
      <path d="M17 1.5 32.5 12H1.5L17 1.5Z" fill="currentColor" />
      {/* O corpo e reboco CLARO com as vigas por cima — e isso que faz a casa
          ser enxaimel. Cheia de madeira ela virava um vulto escuro. */}
      <rect
        x="5"
        y="12"
        width="24"
        height="16.5"
        fill="var(--color-superficie)"
        stroke="currentColor"
        strokeWidth="2"
      />
      <g stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
        {/* Montantes */}
        <path d="M12 13v15.5M22 13v15.5" />
        {/* Travessa */}
        <path d="M5.5 21h23" />
        {/* As duas maos-francesas do vao do meio */}
        <path d="M12.6 21 17 13.6 21.4 21" />
      </g>
    </svg>
  );
}

/**
 * A petúnia, flor-símbolo da cidade.
 *
 * Cinco pétalas, garganta escura e miolo claro — as três cores que a
 * especificação pede. O tamanho pequeno e o mais usado: ela aparece ao lado
 * de textos e dentro de pílulas.
 */
export function Petunia({
  className = "",
  tamanho = 16,
  style,
}: {
  className?: string;
  tamanho?: number;
  style?: React.CSSProperties;
}) {
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
      {/* As cinco petalas, giradas de 72 em 72 graus */}
      {[0, 72, 144, 216, 288].map((grau) => (
        <ellipse
          key={grau}
          cx="12"
          cy="6.6"
          rx="5.1"
          ry="5.6"
          fill="var(--color-petunia)"
          transform={`rotate(${grau} 12 12)`}
        />
      ))}
      <circle cx="12" cy="12" r="4.4" fill="var(--color-petunia-garganta)" />
      <circle cx="12" cy="12" r="1.9" fill="var(--color-petunia-miolo)" />
    </svg>
  );
}

/**
 * Textura de treliça, para o lugar da foto que ainda nao existe.
 *
 * Grade de 26px, linhas claras sobre fundo de reboco. Nao e um cinza morto:
 * lugar sem foto e coisa que o comerciante ainda vai preencher, e a treliça
 * diz "falta algo aqui" sem parecer defeito.
 */
export function Trelica({ className = "" }: { className?: string }) {
  return (
    <div
      aria-hidden
      className={`h-full w-full ${className}`}
      style={{
        backgroundColor: "var(--color-trelica)",
        backgroundImage:
          "repeating-linear-gradient(45deg, var(--color-creme-fundo) 0 1.5px, transparent 1.5px 26px), repeating-linear-gradient(-45deg, var(--color-creme-fundo) 0 1.5px, transparent 1.5px 26px)",
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Ícones de traço da navegação inferior                                */
/* ------------------------------------------------------------------ */

/**
 * Traço e não preenchimento, de propósito: a barra de baixo fica sempre na
 * tela, e ícone cheio ali embaixo compete com o conteúdo o tempo todo. O
 * item ativo se distingue pela cor, não pelo peso.
 */
function Traco({
  children,
  tamanho = 22,
  className = "",
}: {
  children: React.ReactNode;
  tamanho?: number;
  className?: string;
}) {
  return (
    <svg
      width={tamanho}
      height={tamanho}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      className={className}
    >
      {children}
    </svg>
  );
}

/** Início: a casa, que aqui é a da cidade. */
export function IconeInicio(p: { tamanho?: number; className?: string }) {
  return (
    <Traco {...p}>
      <path d="M3.5 10.5 12 3.5l8.5 7" />
      <path d="M5.5 9.8V20h13V9.8" />
      <path d="M9.5 20v-5.5h5V20" />
    </Traco>
  );
}

/** Explorar: a lupa. */
export function IconeExplorar(p: { tamanho?: number; className?: string }) {
  return (
    <Traco {...p}>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m15.5 15.5 4.5 4.5" />
    </Traco>
  );
}

/** Roteiros: o caminho com duas paradas. */
export function IconeRoteiros(p: { tamanho?: number; className?: string }) {
  return (
    <Traco {...p}>
      <circle cx="6" cy="6.5" r="2.5" />
      <circle cx="18" cy="17.5" r="2.5" />
      {/* Tracejado curto: com o ponto muito espacado o caminho sumia e
          sobravam pingos soltos, que nao leem como rota. */}
      <path d="M6 9v3.5c0 2.2 1.6 3.2 3.6 3.2H15.5" strokeDasharray="2 2.6" />
    </Traco>
  );
}

/** Guia: o balão de conversa. */
export function IconeGuia(p: { tamanho?: number; className?: string }) {
  return (
    <Traco {...p}>
      <path d="M4 6.5A2.5 2.5 0 0 1 6.5 4h11A2.5 2.5 0 0 1 20 6.5v7a2.5 2.5 0 0 1-2.5 2.5H10l-4.5 3.5V16H6.5A2.5 2.5 0 0 1 4 13.5v-7Z" />
    </Traco>
  );
}
