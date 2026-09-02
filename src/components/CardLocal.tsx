import Image from "next/image";
import Link from "next/link";
import SeloAberto from "./SeloAberto";
import { faixaPreco } from "@/lib/texto";
import { formatarDistancia } from "@/lib/geo";
import type { LocalCompleto } from "@/lib/tipos";

export default function CardLocal({
  local,
  distancia,
}: {
  local: LocalCompleto;
  distancia?: number;
}) {
  return (
    <Link
      href={`/local/${local.slug}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-mata-100 bg-white transition hover:-translate-y-0.5 hover:border-mata-200 hover:shadow-lg"
    >
      <div className="relative aspect-[4/3] bg-mata-50">
        {local.capa_url ? (
          <Image
            src={local.capa_url}
            alt={local.nome}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
            className="object-cover transition duration-300 group-hover:scale-[1.03]"
          />
        ) : (
          <div className="grid h-full place-items-center text-4xl">
            {local.categoria?.emoji ?? "📍"}
          </div>
        )}

        {local.destaque && (
          <span className="absolute top-2 left-2 rounded-full bg-sol-500 px-2 py-0.5 text-[11px] font-bold text-white">
            Destaque
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1.5 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="font-[family-name:var(--font-titulo)] leading-tight font-semibold">
            {local.nome}
          </h3>
          {local.faixa_preco && (
            <span className="mt-0.5 shrink-0 text-xs font-semibold text-mata-600">
              {faixaPreco(local.faixa_preco)}
            </span>
          )}
        </div>

        <p className="text-xs text-tinta/50">
          {local.categoria?.nome}
          {local.bairro ? ` · ${local.bairro}` : ""}
          {distancia != null ? ` · ${formatarDistancia(distancia)}` : ""}
        </p>

        {local.resumo && (
          <p className="line-clamp-2 text-sm text-tinta/70">{local.resumo}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
          <SeloAberto horarios={local.horarios} tamanho="pequeno" />
          {local.tags.slice(0, 2).map((t) => (
            <span
              key={t.id}
              className="rounded-full bg-mata-50 px-2 py-0.5 text-[11px] text-mata-700"
            >
              {t.emoji} {t.nome}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
