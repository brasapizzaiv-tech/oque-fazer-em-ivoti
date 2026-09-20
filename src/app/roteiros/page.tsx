import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import Cabecalho from "@/components/enxaimel/Cabecalho";
import CardMadeira from "@/components/enxaimel/CardMadeira";
import ContarAcesso from "@/components/ContarAcesso";
import { Trelica } from "@/components/enxaimel/icones";
import { CasaEnxaimel } from "@/components/enxaimel/icones";
import { FaixaEnxaimel, Legenda } from "@/components/enxaimel/pecas";
import { listarRoteirosCurados } from "@/lib/roteiros-curados";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Roteiros prontos",
  description:
    "Passeios montados em Ivoti: escolha um, abra a rota no mapa e saia.",
};

export default async function Roteiros() {
  const roteiros = await listarRoteirosCurados();

  return (
    <div style={{ backgroundColor: "var(--color-reboco)" }}>
      <ContarAcesso />

      <Cabecalho foto="/fotos/eu-amo-ivoti.jpg" alt="">
        <div className="flex items-center gap-2">
          <h1
            className="text-[22px] leading-none font-bold"
            style={{
              color: "var(--color-creme-claro)",
              fontFamily: "var(--fonte-titulo-nova)",
            }}
          >
            Roteiros prontos
          </h1>
          <CasaEnxaimel
            tamanho={26}
            style={{ color: "var(--color-creme-claro)" }}
          />
        </div>
      </Cabecalho>

      <div className="mx-auto lg:max-w-[1000px] lg:px-8 lg:pb-12">
        <div className="hidden pt-8 lg:block">
          <div className="flex items-center gap-2">
            <h1
              className="text-[30px] leading-none font-bold"
              style={{
                color: "var(--color-texto)",
                fontFamily: "var(--fonte-titulo-nova)",
              }}
            >
              Roteiros prontos
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
          Passeios já montados, com as paradas na ordem e a rota pronta para
          abrir no mapa. Dá para tirar uma parada que não combina antes de sair.
        </p>

        <div className="pt-5">
          <FaixaEnxaimel />
        </div>

        {roteiros.length === 0 ? (
          <div className="px-4 py-10 text-center lg:px-0">
            <p
              className="text-[14px]"
              style={{ color: "var(--color-texto-suave)" }}
            >
              Ainda não publicamos nenhum. Enquanto isso, o Guia monta um
              passeio do seu jeito — é só dizer quanto tempo você tem.
            </p>
            <Link
              href="/chat"
              className="mt-5 inline-flex h-12 items-center rounded-[11px] px-6 text-[14px] font-bold"
              style={{
                backgroundColor: "var(--color-torii)",
                color: "#fff7ea",
              }}
            >
              Falar com o Guia
            </Link>
          </div>
        ) : (
          <div className="space-y-4 px-4 pt-6 pb-10 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 lg:px-0">
            {roteiros.map((r, i) => (
              <CardMadeira key={r.id} variante={i % 2 === 0 ? 1 : 2}>
                <Link href={`/roteiros/${r.slug}`} className="block">
                  <span className="relative block h-[150px]">
                    {r.capa_url ? (
                      <Image
                        src={r.capa_url}
                        alt=""
                        fill
                        sizes="(max-width: 1024px) 100vw, 480px"
                        className="object-cover"
                      />
                    ) : (
                      <Trelica />
                    )}
                  </span>
                  <span className="block p-4">
                    <Legenda cor="var(--color-torii)">
                      {r.quantas} {r.quantas === 1 ? "parada" : "paradas"}
                    </Legenda>
                    <span
                      className="mt-1 block text-[18px] leading-tight font-bold"
                      style={{
                        color: "var(--color-texto)",
                        fontFamily: "var(--fonte-titulo-nova)",
                      }}
                    >
                      {r.titulo}
                    </span>
                    {r.descricao && (
                      <span
                        className="mt-1 line-clamp-2 block text-[14px]"
                        style={{ color: "var(--color-texto-suave)" }}
                      >
                        {r.descricao}
                      </span>
                    )}
                  </span>
                </Link>
              </CardMadeira>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
