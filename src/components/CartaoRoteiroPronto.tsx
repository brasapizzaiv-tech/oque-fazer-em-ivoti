import Image from "next/image";
import Link from "next/link";
import type { ResumoRoteiro } from "@/lib/roteiros-curados";

/**
 * O cartao de um roteiro pronto na lista.
 *
 * Mostra quantas paradas tem logo no cartao: e a informacao que faz a pessoa
 * decidir se cabe na tarde dela ou se e programa de dia inteiro.
 */
export default function CartaoRoteiroPronto({
  roteiro,
}: {
  roteiro: ResumoRoteiro;
}) {
  return (
    <Link
      href={`/roteiros/${roteiro.slug}`}
      className="group flex overflow-hidden rounded-2xl border border-mata-100 bg-white transition hover:border-mata-300"
    >
      <div className="relative grid h-auto w-28 shrink-0 place-items-center overflow-hidden bg-mata-50 text-3xl">
        {roteiro.capa_url ? (
          <Image
            src={roteiro.capa_url}
            alt=""
            fill
            sizes="112px"
            className="object-cover"
          />
        ) : (
          "🗺️"
        )}
      </div>

      <div className="min-w-0 flex-1 p-4">
        <p className="font-semibold group-hover:text-mata-700">
          {roteiro.titulo}
        </p>
        {roteiro.descricao && (
          <p className="mt-1 line-clamp-2 text-sm text-tinta/65">
            {roteiro.descricao}
          </p>
        )}
        <p className="mt-2 text-xs font-medium text-tinta/45">
          {roteiro.quantas}{" "}
          {roteiro.quantas === 1 ? "parada" : "paradas"} · rota no mapa
        </p>
      </div>
    </Link>
  );
}
