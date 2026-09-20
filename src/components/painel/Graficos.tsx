// Gráficos do painel. Barras em CSS, sem biblioteca: são séries pequenas —
// trinta dias, meia dúzia de tipos de clique — e uma biblioteca de gráfico
// pesaria mais que a página inteira.
//
// Série única em toda parte, então não há paleta de cores para distinguir:
// o tamanho da barra carrega o número, e a cor é só a do guia.

const FUSO = "America/Sao_Paulo";

/**
 * Acessos por dia.
 *
 * Dias sem acesso aparecem como um traço fino em vez de sumir: um gráfico que
 * pula os dias vazios faz uma semana fraca parecer cheia.
 */
export function GraficoDias({
  dados,
  rotulo = "acessos",
}: {
  dados: { dia: string; contagem: number }[];
  rotulo?: string;
}) {
  const maior = Math.max(1, ...dados.map((d) => d.contagem));
  const total = dados.reduce((s, d) => s + d.contagem, 0);

  return (
    <figure className="m-0">
      <div
        className="flex h-32 items-end gap-[2px]"
        role="img"
        aria-label={`${total} ${rotulo} nos últimos ${dados.length} dias`}
      >
        {dados.map((d) => {
          const altura = d.contagem === 0 ? 2 : (d.contagem / maior) * 100;
          return (
            <div
              key={d.dia}
              className="group relative flex-1"
              style={{ height: "100%" }}
            >
              <div
                className={`absolute right-0 bottom-0 left-0 rounded-t-[4px] transition-colors ${
                  d.contagem === 0
                    ? "bg-[color:var(--color-fechado)]"
                    : "bg-[color:var(--color-torii)]"
                }`}
                style={{ height: `${altura}%` }}
              />
              <span
                className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-1 hidden -translate-x-1/2 rounded-lg bg-tinta px-2 py-1 text-xs whitespace-nowrap text-white group-hover:block"
                role="tooltip"
              >
                {porExtenso(d.dia)}: {d.contagem}
              </span>
            </div>
          );
        })}
      </div>

      {/* A escala escrita, e não só desenhada: sem isto a barra mais alta
          poderia ser 5 ou 500, e no celular não existe passar o mouse para
          descobrir. */}
      <figcaption className="mt-2 flex flex-wrap justify-between gap-x-3 text-xs texto-suave">
        <span>{porExtenso(dados[0]?.dia)}</span>
        <span className="texto-suave">
          maior dia:{" "}
          <strong className="font-semibold tabular-nums">{maior}</strong>
        </span>
        <span>{porExtenso(dados[dados.length - 1]?.dia)}</span>
      </figcaption>
    </figure>
  );
}

/**
 * Ranking simples: rótulo, barra e número.
 *
 * Com poucos itens o número fica escrito ao lado de cada barra — ninguém
 * precisa passar o dedo por cima para saber quanto é, o que importa no
 * celular, onde não existe "passar o mouse".
 */
export function BarrasRanqueadas({
  itens,
  vazio = "Nada por aqui ainda.",
}: {
  itens: { rotulo: string; contagem: number }[];
  vazio?: string;
}) {
  if (itens.length === 0) {
    return <p className="text-sm texto-suave">{vazio}</p>;
  }

  const maior = Math.max(...itens.map((i) => i.contagem));

  return (
    <ul className="space-y-2">
      {itens.map((i) => (
        <li
          key={i.rotulo}
          className="grid grid-cols-[1fr_auto] items-center gap-3"
        >
          <div className="min-w-0">
            <p className="truncate text-sm">{i.rotulo}</p>
            <div className="mt-1 h-1.5 bg-[color:var(--color-fechado)]">
              <div
                className="h-1.5 bg-[color:var(--color-torii)]"
                style={{ width: `${Math.max(3, (i.contagem / maior) * 100)}%` }}
              />
            </div>
          </div>
          <span className="text-sm font-semibold tabular-nums">
            {i.contagem}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** Um número grande com o nome embaixo. */
export function Numero({
  valor,
  rotulo,
  dica,
  destaque = false,
}: {
  valor: number | string;
  rotulo: string;
  dica?: string;
  destaque?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl p-4 ${
        destaque
          ? "bg-[color:var(--color-madeira)] text-[color:var(--color-creme-claro)]"
          : "caixa-painel"
      }`}
    >
      <p
        className={`font-[family-name:var(--fonte-titulo)] text-3xl font-bold tabular-nums ${
          destaque ? "" : "text-tinta"
        }`}
      >
        {valor}
      </p>
      <p className={`text-sm ${destaque ? "text-creme/85" : "texto-suave"}`}>
        {rotulo}
      </p>
      {dica && (
        <p
          className={`mt-0.5 text-xs ${destaque ? "text-creme/65" : "texto-suave"}`}
        >
          {dica}
        </p>
      )}
    </div>
  );
}

function porExtenso(dia: string | undefined): string {
  if (!dia) return "";
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${dia}T12:00:00-03:00`));
}
