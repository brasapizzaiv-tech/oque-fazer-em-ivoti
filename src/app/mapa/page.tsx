import type { Metadata } from "next";
import Link from "next/link";
import {
  CabecalhoDeTela,
  Fileira,
  FileiraDePetunias,
} from "@/components/vidro/blocos";
import { CasaEnxaimel } from "@/components/vidro/icones";
import { Chip } from "@/components/vidro/pecas";
import Mapa from "@/components/Mapa";
import { buscarLocais, listarCategorias } from "@/lib/locais";
import { CAMINHOS, extensaoPorExtenso } from "@/lib/caminhos";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Mapa",
  description: "Todos os lugares de Ivoti no mapa, com rota e detalhes.",
};

export default async function PaginaMapa({ searchParams }: PageProps<"/mapa">) {
  const params = await searchParams;
  const categoria = Array.isArray(params.categoria)
    ? params.categoria[0]
    : params.categoria;

  const [categorias, locais] = await Promise.all([
    listarCategorias(),
    buscarLocais({ categoria, limite: 300 }),
  ]);

  const principais = categorias.filter((c) => c.pai_id === null);
  const noMapa = locais.filter((l) => l.lat != null && l.lng != null);
  const semPosicao = locais.length - noMapa.length;

  return (
    <>
      <CabecalhoDeTela titulo="Mapa de Ivoti" foto="/fotos/portico-ivoti.jpg" />

      <div className="mx-auto lg:max-w-[1440px] lg:px-16 lg:pb-12">
        <div className="hidden pt-8 lg:block">
          <div className="flex items-center gap-2">
            <h1
              className="text-[30px] leading-none font-bold"
              style={{
                color: "var(--color-v-texto)",
                fontFamily: "var(--fonte-titulo-nova)",
              }}
            >
              Mapa de Ivoti
            </h1>
            <CasaEnxaimel
              tamanho={30}
              style={{ color: "var(--color-v-texto)" }}
            />
          </div>
        </div>

        <p
          className="px-4 pt-4 text-[14px] lg:px-0"
          style={{ color: "var(--color-v-texto-suave)" }}
        >
          <strong style={{ color: "var(--color-v-texto)" }}>
            {noMapa.length}
          </strong>{" "}
          {noMapa.length === 1 ? "lugar" : "lugares"} no mapa. Toque num pino
          para ver os detalhes e traçar a rota. As linhas vermelhas são os
          caminhos do interior.
        </p>

        <div className="pt-3 lg:px-0">
          <Fileira semRolagemNoComputador>
            <Chip href="/mapa" ativo={!categoria}>
              Todos
            </Chip>
            {principais.map((c) => (
              <Chip
                key={c.id}
                href={`/mapa?categoria=${c.slug}`}
                ativo={categoria === c.slug}
                flor={c.slug === "natureza"}
              >
                {c.nome}
              </Chip>
            ))}
          </Fileira>
        </div>
        <FileiraDePetunias />

        <div className="px-4 pt-4 lg:px-0">
          <div className="vidro overflow-hidden p-2">
            <Mapa
              locais={noMapa}
              caminhos={CAMINHOS}
              altura="h-[62vh] lg:h-[620px]"
            />
          </div>
        </div>

        <section className="px-4 pt-5 lg:px-0">
          <h2
            className="text-[11px] font-bold tracking-[0.12em] uppercase"
            style={{ color: "var(--color-v-texto-suave)" }}
          >
            Os caminhos desenhados no mapa
          </h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {CAMINHOS.map((c) => (
              <Link
                key={c.slug}
                href={`/caminhos/${c.slug}`}
                className="rounded-full px-3.5 py-2 text-[13px] font-semibold"
                style={{
                  border: "2px solid var(--color-v-torii)",
                  color: "var(--color-v-torii)",
                }}
              >
                {c.nome.replace(/^Caminho /, "")} ·{" "}
                {extensaoPorExtenso(c.metros)}
              </Link>
            ))}
          </div>
        </section>

        {semPosicao > 0 && (
          <p
            className="px-4 pt-3 pb-8 text-[13px] lg:px-0"
            style={{ color: "var(--color-v-texto-suave)" }}
          >
            {semPosicao}{" "}
            {semPosicao === 1
              ? "lugar ainda não marcou a posição"
              : "lugares ainda não marcaram a posição"}{" "}
            no mapa.{" "}
            <Link href="/explorar" className="font-bold underline">
              Ver na lista
            </Link>
          </p>
        )}
      </div>
    </>
  );
}
