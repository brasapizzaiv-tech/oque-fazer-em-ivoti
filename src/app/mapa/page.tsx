import type { Metadata } from "next";
import Link from "next/link";
import Cabecalho from "@/components/enxaimel/Cabecalho";
import CardMadeira from "@/components/enxaimel/CardMadeira";
import { Fileira } from "@/components/enxaimel/blocos";
import { CasaEnxaimel } from "@/components/enxaimel/icones";
import { Chip, FaixaEnxaimel } from "@/components/enxaimel/pecas";
import Mapa from "@/components/Mapa";
import { buscarLocais, listarCategorias } from "@/lib/locais";

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
            Mapa de Ivoti
          </h1>
          <CasaEnxaimel
            tamanho={26}
            style={{ color: "var(--color-creme-claro)" }}
          />
        </div>
      </Cabecalho>

      <div className="mx-auto lg:max-w-[1440px] lg:px-16 lg:pb-12">
        <div className="hidden pt-8 lg:block">
          <div className="flex items-center gap-2">
            <h1
              className="text-[30px] leading-none font-bold"
              style={{
                color: "var(--color-texto)",
                fontFamily: "var(--fonte-titulo-nova)",
              }}
            >
              Mapa de Ivoti
            </h1>
            <CasaEnxaimel
              tamanho={30}
              style={{ color: "var(--color-madeira)" }}
            />
          </div>
        </div>

        <p
          className="px-4 pt-4 text-[14px] lg:px-0"
          style={{ color: "var(--color-texto-suave)" }}
        >
          <strong style={{ color: "var(--color-texto)" }}>
            {noMapa.length}
          </strong>{" "}
          {noMapa.length === 1 ? "lugar" : "lugares"} no mapa. Toque num pino
          para ver os detalhes e traçar a rota.
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

        <div className="pt-4 lg:hidden">
          <FaixaEnxaimel />
        </div>

        <div className="px-4 pt-4 lg:px-0">
          <CardMadeira variante={1} maosFrancesas={false}>
            <Mapa locais={noMapa} altura="h-[62vh] lg:h-[620px]" />
          </CardMadeira>
        </div>

        {semPosicao > 0 && (
          <p
            className="px-4 pt-3 pb-8 text-[13px] lg:px-0"
            style={{ color: "var(--color-texto-suave)" }}
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
    </div>
  );
}
