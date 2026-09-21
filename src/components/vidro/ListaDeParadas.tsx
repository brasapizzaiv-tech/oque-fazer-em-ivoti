import Link from "next/link";
import { linksWaze, type Parada } from "@/lib/roteiro";
import { CardVidro } from "./pecas";

/**
 * As paradas do roteiro, numeradas e costuradas por uma linha pontilhada.
 *
 * A linha não é enfeite: é ela que diz que as paradas formam uma sequência,
 * e não uma lista de lugares soltos. Por isso liga os números e some depois
 * do último — passeio tem fim. Azul, porque roteiro é azul.
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
          <span className="relative flex w-9 shrink-0 flex-col items-center">
            <span
              className="z-10 grid h-9 w-9 place-items-center rounded-full text-[14px] font-bold"
              style={{
                backgroundColor: "var(--color-v-torii)",
                border: "2px solid #FFFFFF",
                color: "#FFFFFF",
                fontFamily: "var(--fonte-titulo-nova)",
              }}
            >
              {i + 1}
            </span>

            {/* a costura até a próxima parada */}
            {i < paradas.length - 1 && (
              <span
                aria-hidden
                className="absolute top-9 bottom-[-12px] w-0.5"
                style={{
                  backgroundImage:
                    "repeating-linear-gradient(to bottom, var(--color-v-azul) 0 5px, transparent 5px 10px)",
                }}
              />
            )}
          </span>

          <CardVidro className="min-w-0 flex-1 p-4">
            <div className="flex items-start justify-between gap-2">
              <Link href={`/local/${p.slug}`} className="min-w-0">
                <span
                  className="block text-[16px] leading-tight font-bold"
                  style={{
                    color: "var(--color-v-texto)",
                    fontFamily: "var(--fonte-titulo-nova)",
                  }}
                >
                  {p.nome}
                </span>
              </Link>
              {p.hora && (
                <span
                  className="shrink-0 text-[13px] font-bold tabular-nums"
                  style={{ color: "var(--color-v-azul)" }}
                >
                  {p.hora}
                </span>
              )}
            </div>

            {(p.categoria || p.bairro) && (
              <p
                className="mt-0.5 text-[13px]"
                style={{ color: "var(--color-v-texto-suave)" }}
              >
                {[p.categoria, p.bairro].filter(Boolean).join(" · ")}
              </p>
            )}

            {waze[i]?.url && (
              <a
                href={waze[i].url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 inline-flex h-11 items-center rounded-full px-4 text-[13px] font-bold"
                style={{
                  border: "1.5px solid var(--color-v-azul)",
                  color: "var(--color-v-azul)",
                }}
              >
                Abrir no Waze
              </a>
            )}
          </CardVidro>
        </li>
      ))}
    </ol>
  );
}
