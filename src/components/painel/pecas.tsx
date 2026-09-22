import type React from "react";

/* ------------------------------------------------------------------ */
/* As peças do painel                                                   */
/* ------------------------------------------------------------------ */

/**
 * O painel usa a mesma linguagem do site público — madeira, reboco, telha —
 * mas em tom mais seco: aqui a pessoa vem trabalhar, não passear. Menos
 * textura, menos sombra dura, mais espaço em branco e campos grandes.
 *
 * Estas peças ficam separadas das de `vidro/` de propósito: as de lá
 * atendem a quem visita a cidade, e mudar uma delas para caber num formulário
 * do painel estragaria a tela pública correspondente.
 */

/** A moldura de um bloco do painel: fundo claro, borda de madeira. */
export function Caixa({
  children,
  className = "",
  padding = true,
}: {
  children: React.ReactNode;
  className?: string;
  /** Desliga o respiro interno para quem precisa colar conteúdo na borda. */
  padding?: boolean;
}) {
  return (
    <div
      className={`rounded-[4px] ${padding ? "p-4 sm:p-5" : ""} ${className}`}
      style={{
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        border: "2px solid var(--color-v-texto)",
      }}
    >
      {children}
    </div>
  );
}

/** O título de uma tela do painel, com a linha de apoio embaixo. */
export function TituloPainel({
  children,
  apoio,
  acao,
}: {
  children: React.ReactNode;
  apoio?: React.ReactNode;
  /** O botão da direita: cadastrar, criar, voltar. */
  acao?: React.ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1
          className="text-[22px] leading-tight font-bold sm:text-[26px]"
          style={{
            color: "var(--color-v-texto)",
            fontFamily: "var(--fonte-titulo-nova)",
          }}
        >
          {children}
        </h1>
        {apoio && (
          <p
            className="mt-1 text-[14px]"
            style={{ color: "var(--color-v-texto-suave)" }}
          >
            {apoio}
          </p>
        )}
      </div>
      {acao && <div className="shrink-0">{acao}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Situação do local                                                    */
/* ------------------------------------------------------------------ */

/**
 * As cinco situações de um local, cada uma com a sua cor e a sua explicação.
 *
 * A explicação anda junto com o selo porque "Em análise" não diz a ninguém o
 * que fazer a seguir — e é exatamente isso que o dono quer saber.
 */
export const SITUACOES = {
  rascunho: {
    texto: "Rascunho",
    fundo: "rgba(43, 35, 32, 0.12)",
    tinta: "var(--color-v-texto)",
    dica: "Só você enxerga. Termine de preencher e mande para análise.",
  },
  em_analise: {
    texto: "Em análise",
    fundo: "var(--color-v-petunia)",
    tinta: "#FFFFFF",
    dica: "Recebemos. Em breve publicamos no guia.",
  },
  publicado: {
    texto: "No ar",
    fundo: "var(--color-v-verde)",
    tinta: "#FFFFFF",
    dica: "Está aparecendo no guia para todo mundo.",
  },
  rejeitado: {
    texto: "Precisa de ajuste",
    fundo: "var(--color-v-fechado-claro)",
    tinta: "#FFFFFF",
    dica: "Veja o motivo, corrija e mande de novo.",
  },
  inativo: {
    texto: "Fora do ar",
    fundo: "rgba(43, 35, 32, 0.12)",
    tinta: "var(--color-v-texto)",
    dica: "Não aparece no guia. Nada foi perdido: dá para voltar quando quiser.",
  },
} as const;

export type Situacao = keyof typeof SITUACOES;

/** O selo da situação: caixa alta, pequeno e firme. */
export function SeloSituacao({ situacao }: { situacao: Situacao }) {
  const s = SITUACOES[situacao] ?? SITUACOES.rascunho;
  return (
    <span
      className="inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold tracking-[0.08em] uppercase"
      style={{ backgroundColor: s.fundo, color: s.tinta }}
    >
      {s.texto}
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Estado vazio                                                         */
/* ------------------------------------------------------------------ */

/**
 * O que aparece quando ainda não há nada.
 *
 * Nunca é só "nenhum resultado": traz o próximo passo, porque quem chega numa
 * lista vazia do painel chegou para criar o primeiro item.
 */
export function Nenhum({
  titulo,
  children,
  acao,
}: {
  titulo: string;
  children?: React.ReactNode;
  acao?: React.ReactNode;
}) {
  return (
    <div
      className="rounded-[4px] px-6 py-10 text-center"
      style={{
        border: "2px dashed var(--color-v-texto)",
        backgroundColor: "rgba(255, 255, 255, 0.7)",
      }}
    >
      <p
        className="text-[17px] font-bold"
        style={{
          color: "var(--color-v-texto)",
          fontFamily: "var(--fonte-titulo-nova)",
        }}
      >
        {titulo}
      </p>
      {children && (
        <p
          className="mx-auto mt-1.5 max-w-[46ch] text-[14px]"
          style={{ color: "var(--color-v-texto-suave)" }}
        >
          {children}
        </p>
      )}
      {acao && <div className="mt-5 flex justify-center">{acao}</div>}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Formulários                                                          */
/* ------------------------------------------------------------------ */

/**
 * As classes de um campo, iguais em todo o painel.
 *
 * Constante e não componente porque metade dos formulários precisa de
 * `input`, a outra de `textarea` ou `select`, e cada um tem atributos
 * próprios — embrulhar os três num componente só multiplicaria as exceções.
 */
export const CAMPO =
  "mt-1 w-full rounded-[9px] px-3 py-2.5 text-[15px] outline-none focus:border-[color:var(--color-v-torii)]";

export const ESTILO_CAMPO: React.CSSProperties = {
  backgroundColor: "rgba(255, 255, 255, 0.7)",
  border: "2px solid var(--color-v-texto)",
  color: "var(--color-v-texto)",
};

/** O rótulo acima de um campo. */
export function Rotulo({
  children,
  dica,
}: {
  children: React.ReactNode;
  dica?: React.ReactNode;
}) {
  return (
    <>
      <span
        className="text-[14px] font-semibold"
        style={{ color: "var(--color-v-texto)" }}
      >
        {children}
      </span>
      {dica && (
        <span
          className="mt-0.5 block text-[12px]"
          style={{ color: "var(--color-v-texto-suave)" }}
        >
          {dica}
        </span>
      )}
    </>
  );
}

/** O aviso de erro de um formulário. */
export function Aviso({
  children,
  tom = "erro",
}: {
  children: React.ReactNode;
  tom?: "erro" | "certo";
}) {
  const erro = tom === "erro";
  return (
    <p
      className="rounded-[9px] px-3 py-2 text-[13px] font-medium"
      style={{
        border: `2px solid ${erro ? "var(--color-v-fechado-claro)" : "var(--color-v-verde)"}`,
        backgroundColor: "rgba(255, 255, 255, 0.7)",
        color: erro ? "var(--color-v-fechado-claro)" : "var(--color-v-verde)",
      }}
    >
      {children}
    </p>
  );
}

/* ------------------------------------------------------------------ */
/* Subtítulo                                                            */
/* ------------------------------------------------------------------ */

/** O título de um grupo dentro da tela: "Próximos", "Já aconteceram". */
export function SubTitulo({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-[11px] font-bold tracking-[0.12em] uppercase"
      style={{ color: "var(--color-v-texto-suave)" }}
    >
      {children}
    </h2>
  );
}

/** O botão discreto de editar, no fim de uma linha de lista. */
export function Editar({ href }: { href: string }) {
  return (
    <a
      href={href}
      className="inline-flex h-10 shrink-0 items-center rounded-[9px] px-4 text-[14px] font-semibold"
      style={{
        border: "2px solid var(--color-v-texto)",
        color: "var(--color-v-texto)",
      }}
    >
      Editar
    </a>
  );
}

/**
 * O título de um bloco de formulário ou de um gráfico.
 *
 * Entra na Fraunces como os títulos do site público. Sem isto ele cairia na
 * regra de `h1..h4` do globals.css, que pinta tudo na fonte antiga — e o
 * painel ficaria com duas tipografias na mesma tela.
 */
export function TituloBloco({ children }: { children: React.ReactNode }) {
  return (
    <h2
      className="text-[17px] font-bold"
      style={{
        color: "var(--color-v-texto)",
        fontFamily: "var(--fonte-titulo-nova)",
      }}
    >
      {children}
    </h2>
  );
}
