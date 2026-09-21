import type { Metadata } from "next";
import { Suspense } from "react";
import Busca from "@/components/vidro/Busca";
import CardComFoto from "@/components/vidro/CardComFoto";
import PertoDeMim from "@/components/enxaimel/PertoDeMim";
import { CabecalhoDeTela, Fileira, Vazio } from "@/components/vidro/blocos";
import { CardAzul, Chip, Legenda } from "@/components/vidro/pecas";
import { CasaEnxaimel } from "@/components/vidro/icones";
import { buscarLocais, listarCategorias, listarTags } from "@/lib/locais";
import { distancia, formatarDistancia } from "@/lib/geo";
import Mapa from "@/components/Mapa";
import { eventosVisiveis } from "@/lib/eventos";
import { promocoesDeHoje } from "@/lib/promocoes-de-hoje";
import { hojeEmIvoti } from "@/lib/planos";
import { quandoPorExtenso, situacao } from "@/lib/horarios";
import { AvisoDaFeira } from "@/components/vidro/Feira";
import { temaAtivo } from "@/lib/temas";

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
  const soDaFeira = texto(params.feira) === "1";
  const soComPromocao = texto(params.promocao) === "1";
  const soComEvento = texto(params.evento) === "1";

  const [categorias, todasTags, todos, eventosDeHoje, promocoes, feira] =
    await Promise.all([
      listarCategorias(),
      listarTags(),
      buscarLocais({ q, categoria, tags, abertoAgora: aberto }),
      eventosVisiveis({ ate: hojeEmIvoti(), limite: 200 }),
      promocoesDeHoje(200),
      temaAtivo(),
    ]);

  // "Na feira" e um filtro que so existe durante a feira: a lista de quem
  // esta expondo vem do tema, e fora do periodo ela nao quer dizer nada.
  const naFeira = new Set(feira?.locais ?? []);

  // Quem tem promoção valendo hoje e quem tem evento hoje. O menu do
  // computador já apontava para "/explorar?promocao=1", e o Explorar não
  // sabia desse filtro: a aba Promoções abria a lista inteira, igual ao
  // Explorar. Agora os dois filtros existem de verdade, e viram pílula.
  const comPromocao = new Set(promocoes.map((pr) => pr.local_id));
  const comEvento = new Set(
    eventosDeHoje.map((ev) => ev.local_id).filter(Boolean) as string[],
  );

  const locais = todos.filter((l) => {
    if (soDaFeira && naFeira.size > 0 && !naFeira.has(l.id)) return false;
    if (soComPromocao && !comPromocao.has(l.id)) return false;
    if (soComEvento && !comEvento.has(l.id)) return false;
    return true;
  });

  const principais = categorias.filter((c) => c.pai_id === null);

  /** Monta o endereço mantendo o que já estava filtrado. */
  function url(mudanca: Record<string, string | string[] | undefined>) {
    const base: Record<string, string | string[] | undefined> = {
      q,
      categoria,
      aberto: aberto ? "1" : undefined,
      feira: soDaFeira ? "1" : undefined,
      promocao: soComPromocao ? "1" : undefined,
      evento: soComEvento ? "1" : undefined,
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
    <>
      <CabecalhoDeTela titulo="Explorar" foto="/fotos/portico-ivoti.jpg">
        <Busca placeholder="Pizza, trilha, café..." valor={q} />
      </CabecalhoDeTela>

      {/* No computador não há cabeçalho de tela: o título e a busca vêm aqui. */}
      <div className="mx-auto hidden max-w-[1440px] px-16 pt-8 lg:block">
        <div className="flex items-center gap-2">
          <h1
            className="text-[30px] leading-none font-bold"
            style={{
              color: "var(--color-v-texto)",
              fontFamily: "var(--fonte-titulo-nova)",
            }}
          >
            Explorar
          </h1>
          <CasaEnxaimel tamanho={30} />
        </div>
        <div className="mt-4 max-w-lg">
          <Busca placeholder="Pizza, trilha, café..." valor={q} />
        </div>
      </div>

      <div className="pt-4 lg:mx-auto lg:max-w-[1440px] lg:px-16">
        <Fileira semRolagemNoComputador>
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

      <div className="pt-2 lg:mx-auto lg:max-w-[1440px] lg:px-16">
        <Fileira semRolagemNoComputador>
          <Chip href={url({ aberto: aberto ? undefined : "1" })} ativo={aberto}>
            Aberto agora
          </Chip>
          <Chip
            href={url({ promocao: soComPromocao ? undefined : "1" })}
            ativo={soComPromocao}
          >
            Com promoção
          </Chip>
          <Chip
            href={url({ evento: soComEvento ? undefined : "1" })}
            ativo={soComEvento}
          >
            Com evento
          </Chip>
          {feira && feira.locais.length > 0 && (
            <Chip
              href={url({ feira: soDaFeira ? undefined : "1" })}
              ativo={soDaFeira}
            >
              Na feira
            </Chip>
          )}
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

      {feira && (
        <div className="px-4 pt-4 lg:mx-auto lg:max-w-[1440px] lg:px-16">
          <AvisoDaFeira tema={feira} />
        </div>
      )}

      <div className="lg:mx-auto lg:max-w-[1440px] lg:px-16">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <div className="flex items-center justify-between gap-3 px-4 pt-5 lg:px-0">
              <p
                className="text-[14px]"
                style={{ color: "var(--color-v-texto-suave)" }}
              >
                <strong style={{ color: "var(--color-v-texto)" }}>
                  {locais.length}
                </strong>{" "}
                {locais.length === 1 ? "lugar" : "lugares"} em Ivoti
              </p>
              <Suspense>
                <PertoDeMim ativo={posicao !== null} />
              </Suspense>
            </div>

            <div className="space-y-3 px-4 pt-3 pb-8 lg:px-0">
              {comDistancia.length === 0 ? (
                <Vazio>
                  {soComPromocao
                    ? "Nenhum lugar com promoção valendo hoje. As promoções mudam por dia da semana — amanhã a lista pode ser outra."
                    : soComEvento
                      ? "Nenhum lugar com evento hoje. Veja a agenda da cidade para o que vem pela frente."
                      : soDaFeira
                        ? "Nenhum expositor da feira cadastrado no guia ainda."
                        : "Nada encontrado com esses filtros. Tente afrouxar a busca."}
                </Vazio>
              ) : (
                comDistancia.map(({ local, metros }) => (
                  <CardComFoto
                    key={local.id}
                    href={`/local/${local.slug}`}
                    foto={local.capa_url}
                    etiqueta={local.bairro ?? undefined}
                    titulo={local.nome}
                    apoio={local.categoria?.nome ?? undefined}
                    status={
                      situacao(local.horarios ?? []).aberto
                        ? "aberto"
                        : "fechado"
                    }
                    canto={
                      metros != null ? formatarDistancia(metros) : undefined
                    }
                    alto={150}
                    className="lg:h-[180px]"
                  />
                ))
              )}
            </div>
          </div>

          {/* A coluna da direita acompanha a rolagem: quem varre uma lista
              longa quer o mapa sempre à vista, não ter de voltar ao topo. */}
          <aside className="hidden lg:col-span-5 lg:block">
            <div className="sticky top-[100px] space-y-4 pt-5">
              <div className="vidro overflow-hidden p-2">
                <Mapa locais={locais} altura="h-[380px]" />
              </div>

              <CardAzul className="p-4">
                <Legenda cor="#FFFFFF">Acontece hoje</Legenda>

                {eventosDeHoje.length === 0 && promocoes.length === 0 ? (
                  <p className="mt-2 text-[13px] text-white/85">
                    Nada marcado para hoje.
                  </p>
                ) : (
                  <ul className="mt-3 space-y-3">
                    {eventosDeHoje.slice(0, 4).map((ev) => (
                      <li key={ev.id}>
                        <p
                          className="text-[14px] leading-tight font-bold"
                          style={{ fontFamily: "var(--fonte-titulo-nova)" }}
                        >
                          {ev.titulo}
                        </p>
                        <p className="text-[12px] text-white/85">
                          {quandoPorExtenso(ev.inicio)}
                        </p>
                      </li>
                    ))}
                    {promocoes.slice(0, 3).map((pr) => (
                      <li key={pr.id}>
                        <p
                          className="text-[14px] leading-tight font-bold"
                          style={{ fontFamily: "var(--fonte-titulo-nova)" }}
                        >
                          {pr.titulo}
                        </p>
                        <p className="text-[12px] text-white/85">
                          {pr.local?.nome ?? "Promoção de hoje"}
                        </p>
                      </li>
                    ))}
                  </ul>
                )}
              </CardAzul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
