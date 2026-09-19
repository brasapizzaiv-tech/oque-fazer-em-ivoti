import Image from "next/image";
import Link from "next/link";
import SeloAberto from "./SeloAberto";
import { faixaPreco } from "@/lib/texto";
import { formatarDistancia } from "@/lib/geo";
import { situacao } from "@/lib/horarios";
import type { LocalCompleto } from "@/lib/tipos";

/**
 * Um lugar, num painel.
 *
 * Painel, e nao cartao: sem sombra, sem canto redondo, sem flutuar. A moldura
 * de madeira e a mesma parede enxaimel do resto do site, e e ela que separa
 * um lugar do outro.
 *
 * O brilho do painel carrega informacao, e essa e a ideia toda: quem esta
 * aberto agora aparece na cal clara, quem esta fechado fica no painel
 * recuado. Da para varrer uma lista inteira e saber onde da para ir sem ler
 * uma palavra — que e exatamente a pergunta de quem abre o guia na calcada.
 */
export default function CardLocal({
  local,
  distancia,
}: {
  local: LocalCompleto;
  distancia?: number;
}) {
  const { aberto } = situacao(local.horarios ?? []);

  return (
    <Link
      href={`/local/${local.slug}`}
      className={[
        "group flex flex-col overflow-hidden border-2 border-carvalho transition",
        aberto ? "bg-creme" : "bg-cal-sombra",
        "hover:border-sol-600",
      ].join(" ")}
    >
      <div className="relative aspect-[4/3] border-b-2 border-carvalho bg-cal-sombra">
        {local.capa_url ? (
          <Image
            src={local.capa_url}
            alt={local.nome}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
            className={[
              "object-cover",
              // Fechado tambem desbota a foto: o painel inteiro recua junto.
              aberto ? "" : "opacity-75 saturate-50",
            ].join(" ")}
          />
        ) : (
          <div className="grid h-full place-items-center text-4xl">
            {local.categoria?.emoji ?? "📍"}
          </div>
        )}

        {local.destaque && (
          <span className="absolute top-0 left-0 bg-sol-600 px-2.5 py-1 text-xs font-bold text-white">
            Destaque
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3">
        {/* Categoria e bairro em pontas opostas, separados pelo espaco em vez
            de por um ponto medio costurando tudo numa frase so. */}
        <div className="flex items-baseline justify-between gap-2 text-xs text-tinta/55">
          <span className="truncate">{local.categoria?.nome}</span>
          <span className="shrink-0">
            {distancia != null ? formatarDistancia(distancia) : local.bairro}
          </span>
        </div>

        <div className="flex items-start justify-between gap-2">
          <h3 className="font-[family-name:var(--font-titulo)] leading-tight font-bold tracking-tight">
            {local.nome}
          </h3>
          {local.faixa_preco && (
            <span className="mt-0.5 shrink-0 text-xs font-semibold text-tinta/55">
              {faixaPreco(local.faixa_preco)}
            </span>
          )}
        </div>

        {local.resumo && (
          <p className="line-clamp-2 text-sm text-tinta/70">{local.resumo}</p>
        )}

        <div className="mt-auto flex flex-wrap items-center gap-1.5 pt-2">
          <SeloAberto horarios={local.horarios} tamanho="pequeno" />
          {local.tags.slice(0, 2).map((t) => (
            <span
              key={t.id}
              className="border border-carvalho/25 px-2 py-0.5 text-xs text-tinta/65"
            >
              {t.emoji} {t.nome}
            </span>
          ))}
        </div>
      </div>
    </Link>
  );
}
