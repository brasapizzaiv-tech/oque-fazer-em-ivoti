import Link from "next/link";
import CardMadeira from "./CardMadeira";
import { linksWaze, type Parada } from "@/lib/roteiro";

/**
 * As paradas do roteiro, numeradas e costuradas por uma linha pontilhada.
 *
 * A linha não é enfeite: ela é o que diz que as paradas formam uma sequência,
 * e não uma lista de lugares soltos. Por isso ela liga os números e some
 * depois do último — passeio tem fim.
 *
 * Cada parada leva ao Waze sozinha porque o Waze não aceita várias paradas
 * num link só. Em vez de esconder essa limitação, a pessoa abre a próxima
 * conforme avança.
 */
export default function ListaDeParadas({ paradas }: { paradas: Parada[] }) {
  const waze = linksWaze(paradas);

  return (
    <ol className="space-y-3">
      {paradas.map((p, i) => (
        <li key={p.slug} className="relative flex gap-3">
          <span className="relative flex w-8 shrink-0 flex-col items-center">
            <span
              className="z-10 grid h-8 w-8 place-items-center rounded-full text-[14px] font-bold"
              style={{
                backgroundColor: "var(--color-torii)",
                color: "#fff7ea",
                fontFamily: "var(--fonte-titulo-nova)",
              }}
            >
              {i + 1}
            </span>
            {i < paradas.length - 1 && (
              <span
                aria-hidden
                className="absolute top-8 bottom-[-12px] w-0"
                style={{
                  borderLeft: "2px dashed var(--color-madeira)",
                  opacity: 0.45,
                }}
              />
            )}
          </span>

          <span className="min-w-0 flex-1">
            <CardMadeira variante={i % 2 === 0 ? 1 : 2} maosFrancesas={false}>
              <span className="block p-3">
                {p.hora && (
                  <span
                    className="block text-[11px] font-bold tracking-[0.12em] uppercase"
                    style={{ color: "var(--color-torii)" }}
                  >
                    Por volta das {p.hora}
                  </span>
                )}

                <Link
                  href={`/local/${p.slug}`}
                  className="mt-0.5 block text-[16px] leading-tight font-bold"
                  style={{
                    color: "var(--color-texto)",
                    fontFamily: "var(--fonte-titulo-nova)",
                  }}
                >
                  {p.nome}
                </Link>

                {(p.bairro || p.endereco) && (
                  <span
                    className="mt-0.5 block text-[13px]"
                    style={{ color: "var(--color-texto-suave)" }}
                  >
                    {p.endereco ?? p.bairro}
                  </span>
                )}

                <a
                  href={waze[i]?.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-2.5 inline-flex h-10 items-center rounded-[10px] px-4 text-[13px] font-bold"
                  style={{
                    backgroundColor: "var(--color-superficie)",
                    border: "2px solid var(--color-madeira)",
                    color: "var(--color-texto)",
                  }}
                >
                  Abrir no Waze
                </a>
              </span>
            </CardMadeira>
          </span>
        </li>
      ))}
    </ol>
  );
}
