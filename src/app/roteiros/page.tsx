import Link from "next/link";
import { CabecalhoDeTela, FileiraDePetunias } from "@/components/vidro/blocos";
import Image from "next/image";
import type { Metadata } from "next";
import ContarAcesso from "@/components/ContarAcesso";
import { CasaEnxaimel } from "@/components/vidro/icones";
import { Legenda } from "@/components/vidro/pecas";
import { listarRoteirosCurados } from "@/lib/roteiros-curados";
import {
  CAMINHOS,
  extensaoPorExtenso,
  tempoAPe,
  tempoDeCarro,
} from "@/lib/caminhos";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Roteiros prontos",
  description:
    "Passeios montados em Ivoti: escolha um, abra a rota no mapa e saia.",
};

export default async function Roteiros() {
  const roteiros = await listarRoteirosCurados();

  return (
    <>
      <ContarAcesso />

      <CabecalhoDeTela
        titulo="Roteiros prontos"
        foto="/fotos/eu-amo-ivoti.jpg"
      />

      <div className="mx-auto lg:max-w-[1000px] lg:px-8 lg:pb-12">
        <div className="hidden pt-8 lg:block">
          <div className="flex items-center gap-2">
            <h1
              className="text-[30px] leading-none font-bold"
              style={{
                color: "var(--color-v-texto)",
                fontFamily: "var(--fonte-titulo-nova)",
              }}
            >
              Roteiros prontos
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
          Passeios já montados, com as paradas na ordem e a rota pronta para
          abrir no mapa. Dá para tirar uma parada que não combina antes de sair.
          Mais abaixo estão os caminhos do interior, que são estrada e não lista
          de endereços.
        </p>
        <FileiraDePetunias />

        {roteiros.length === 0 ? (
          <div className="px-4 py-10 text-center lg:px-0">
            <p
              className="text-[14px]"
              style={{ color: "var(--color-v-texto-suave)" }}
            >
              Ainda não montamos nenhum passeio por paradas. Logo abaixo estão
              os caminhos do interior, e o Guia monta um do seu jeito — é só
              dizer quanto tempo você tem.
            </p>
            <Link
              href="/chat"
              className="mt-5 inline-flex h-12 items-center rounded-[11px] px-6 text-[14px] font-bold"
              style={{
                backgroundColor: "var(--color-v-torii)",
                color: "#FFFFFF",
              }}
            >
              Falar com o Guia
            </Link>
          </div>
        ) : (
          <div className="space-y-4 px-4 pt-6 pb-10 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0 lg:px-0">
            {roteiros.map((r) => (
              <div key={r.id} className="vidro overflow-hidden">
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
                      <span
                        aria-hidden
                        className="absolute inset-0"
                        style={{
                          background:
                            "linear-gradient(135deg, #d8cfc2 0%, #bfb3a2 50%, #a99c8a 100%)",
                        }}
                      />
                    )}
                  </span>
                  <span className="block p-4">
                    <Legenda cor="var(--color-v-torii)">
                      {r.quantas} {r.quantas === 1 ? "parada" : "paradas"}
                    </Legenda>
                    <span
                      className="mt-1 block text-[18px] leading-tight font-bold"
                      style={{
                        color: "var(--color-v-texto)",
                        fontFamily: "var(--fonte-titulo-nova)",
                      }}
                    >
                      {r.titulo}
                    </span>
                    {r.descricao && (
                      <span
                        className="mt-1 line-clamp-2 block text-[14px]"
                        style={{ color: "var(--color-v-texto-suave)" }}
                      >
                        {r.descricao}
                      </span>
                    )}
                  </span>
                </Link>
              </div>
            ))}
          </div>
        )}

        {CAMINHOS.length > 0 && (
          <section className="px-4 pb-10 lg:px-0">
            <FileiraDePetunias />

            <h2
              className="text-[22px] font-bold"
              style={{
                color: "var(--color-v-texto)",
                fontFamily: "var(--fonte-titulo-nova)",
              }}
            >
              Caminhos do interior
            </h2>
            <p
              className="mt-1 text-[14px]"
              style={{ color: "var(--color-v-texto-suave)" }}
            >
              As estradas de chão entre as casas enxaimel. Todas saem e voltam
              no mesmo ponto, e dá para fazer a pé, de bicicleta ou de carro.
            </p>

            <div className="mt-4 space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
              {CAMINHOS.map((c) => (
                <div key={c.slug} className="vidro">
                  <Link href={`/caminhos/${c.slug}`} className="block p-4">
                    <Legenda cor="var(--color-v-verde)">
                      {c.circuito ? "Circuito" : "Percurso"}
                    </Legenda>
                    <span
                      className="mt-1 block text-[18px] leading-tight font-bold"
                      style={{
                        color: "var(--color-v-texto)",
                        fontFamily: "var(--fonte-titulo-nova)",
                      }}
                    >
                      {c.nome}
                    </span>
                    <span
                      className="mt-1 block text-[14px]"
                      style={{ color: "var(--color-v-texto-suave)" }}
                    >
                      {extensaoPorExtenso(c.metros)} · {tempoAPe(c.metros)} a pé
                      · {tempoDeCarro(c.metros)} de carro
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
}
