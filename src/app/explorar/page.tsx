import type { Metadata } from "next";
import { Suspense } from "react";
import Cabecalho, { BuscaCabecalho } from "@/components/enxaimel/Cabecalho";
import PertoDeMim from "@/components/enxaimel/PertoDeMim";
import { CardLugar, Fileira, Vazio } from "@/components/enxaimel/blocos";
import { Chip, FaixaEnxaimel } from "@/components/enxaimel/pecas";
import { CasaEnxaimel } from "@/components/enxaimel/icones";
import { buscarLocais, listarCategorias, listarTags } from "@/lib/locais";
import { distancia } from "@/lib/geo";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Explorar",
  description:
    "Todos os lugares de Ivoti: filtre por tipo, etiqueta e horário.",
};

function texto(v: string | string[] | undefined) {
  return typeof v === "string" && v.trim() ? v.trim() : undefined;
}

function lista(v: string | string[] | undefined) {
  if (!v) return [];
  return Array.isArray(v) ? v : [v];
}

/** "−29.5901,-51.1631" vira coordenada, ou nada se vier torto. */
function lerPosicao(v: string | undefined) {
  if (!v) return null;
  const [lat, lng] = v.split(",").map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
  return { lat, lng };
}

export default async function Explorar({
  searchParams,
}: PageProps<"/explorar">) {
  const params = await searchParams;

  const q = texto(params.q);
  const categoria = texto(params.categoria);
  const aberto = texto(params.aberto) === "1";
  const tags = lista(params.tag);
  const posicao = lerPosicao(texto(params.perto));

  const [categorias, todasTags, locais] = await Promise.all([
    listarCategorias(),
    listarTags(),
    buscarLocais({ q, categoria, tags, abertoAgora: aberto }),
  ]);

  const principais = categorias.filter((c) => c.pai_id === null);

  /** Monta o endereço mantendo o que já estava filtrado. */
  function url(mudanca: Record<string, string | string[] | undefined>) {
    const base: Record<string, string | string[] | undefined> = {
      q,
      categoria,
      aberto: aberto ? "1" : undefined,
      tag: tags,
      perto: texto(params.perto),
      ...mudanca,
    };
    const busca = new URLSearchParams();
    for (const [chave, valor] of Object.entries(base)) {
      if (!valor) continue;
      if (Array.isArray(valor)) valor.forEach((v) => busca.append(chave, v));
      else busca.set(chave, valor);
    }
    const s = busca.toString();
    return s ? `/explorar?${s}` : "/explorar";
  }

  // Com a posição em mãos, a lista sai ordenada do mais perto ao mais longe.
  // Lugar sem coordenada vai para o fim: não dá para dizer que está perto,
  // e some do topo seria pior do que aparecer depois.
  const comDistancia = posicao
    ? locais
        .map((l) => ({
          local: l,
          metros:
            l.lat != null && l.lng != null
              ? distancia(posicao, { lat: l.lat, lng: l.lng })
              : null,
        }))
        .sort((a, b) => (a.metros ?? Infinity) - (b.metros ?? Infinity))
    : locais.map((l) => ({ local: l, metros: null }));

  return (
    <div style={{ backgroundColor: "var(--color-reboco)" }}>
      <Cabecalho foto="/fotos/portico-ivoti.jpg" alt="">
        <div className="flex items-center gap-2">
          <h1
            className="text-[22px] leading-none font-bold"
            style={{
              color: "var(--color-creme-claro)",
              fontFamily: "var(--fonte-titulo-nova)",
            }}
          >
            Explorar
          </h1>
          <CasaEnxaimel
            tamanho={26}
            style={{ color: "var(--color-creme-claro)" }}
          />
        </div>
        <div className="mt-3">
          <BuscaCabecalho placeholder="Pizza, trilha, café..." />
        </div>
      </Cabecalho>

      <div className="pt-4">
        <Fileira>
          <Chip href={url({ categoria: undefined })} ativo={!categoria}>
            Todos
          </Chip>
          {principais.map((c) => (
            <Chip
              key={c.id}
              href={url({ categoria: c.slug })}
              ativo={categoria === c.slug}
              flor={c.slug === "natureza"}
            >
              {c.nome}
            </Chip>
          ))}
        </Fileira>
      </div>

      <div className="pt-2">
        <Fileira>
          <Chip
            href={url({ aberto: aberto ? undefined : "1" })}
            ativo={aberto}
            destaque
          >
            Aberto agora
          </Chip>
          {todasTags.map((t) => {
            const marcada = tags.includes(t.slug);
            return (
              <Chip
                key={t.id}
                href={url({
                  tag: marcada
                    ? tags.filter((x) => x !== t.slug)
                    : [...tags, t.slug],
                })}
                ativo={marcada}
              >
                {t.emoji} {t.nome}
              </Chip>
            );
          })}
        </Fileira>
      </div>

      <div className="pt-5">
        <FaixaEnxaimel />
      </div>

      <div className="flex items-start justify-between gap-3 px-4 pt-4">
        <p className="text-[14px]" style={{ color: "var(--color-texto-suave)" }}>
          <strong style={{ color: "var(--color-texto)" }}>
            {locais.length}
          </strong>{" "}
          {locais.length === 1 ? "lugar" : "lugares"} em Ivoti
        </p>
        <Suspense>
          <PertoDeMim ativo={posicao !== null} />
        </Suspense>
      </div>

      <div className="space-y-3 px-4 pt-3 pb-8">
        {comDistancia.length === 0 ? (
          <Vazio>
            Nada encontrado com esses filtros. Tente afrouxar a busca.
          </Vazio>
        ) : (
          comDistancia.map(({ local, metros }, i) => (
            <CardLugar
              key={local.id}
              local={local}
              distancia={metros ?? undefined}
              variante={i % 2 === 0 ? 1 : 2}
            />
          ))
        )}
      </div>
    </div>
  );
}
