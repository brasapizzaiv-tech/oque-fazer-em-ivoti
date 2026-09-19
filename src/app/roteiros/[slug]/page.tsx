import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ContarAcesso from "@/components/ContarAcesso";
import ListaDeParadas from "@/components/enxaimel/ListaDeParadas";
import { CasaEnxaimel } from "@/components/enxaimel/icones";
import { FaixaEnxaimel, Legenda } from "@/components/enxaimel/pecas";
import { roteiroCurado } from "@/lib/roteiros-curados";
import { linkGoogleMaps, resumoDoPasseio } from "@/lib/roteiro";

export const revalidate = 300;

export async function generateMetadata({
  params,
}: PageProps<"/roteiros/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const roteiro = await roteiroCurado(slug);
  if (!roteiro) return { title: "Roteiro" };

  return {
    title: roteiro.titulo,
    description:
      roteiro.descricao ??
      `Um passeio pronto por Ivoti, com ${roteiro.paradas.length} paradas e a rota no mapa.`,
    openGraph: {
      title: roteiro.titulo,
      description: roteiro.descricao ?? undefined,
      images: roteiro.capa_url ? [roteiro.capa_url] : undefined,
    },
  };
}

export default async function RoteiroPronto({
  params,
}: PageProps<"/roteiros/[slug]">) {
  const { slug } = await params;
  const roteiro = await roteiroCurado(slug);

  if (!roteiro || !roteiro.publicado) notFound();

  const rota = linkGoogleMaps(roteiro.paradas);

  return (
    <div style={{ backgroundColor: "var(--color-reboco)" }}>
      <div className="mx-auto lg:max-w-[760px] lg:px-8 lg:pb-10">
        <ContarAcesso />

        <header
          className="px-4 pt-5 pb-6"
          style={{ backgroundColor: "var(--color-madeira)" }}
        >
          <Legenda cor="var(--color-petunia-clara)">Roteiro pronto</Legenda>

          <div className="mt-1.5 flex items-start gap-2">
            <h1
              className="text-[26px] leading-tight font-bold"
              style={{
                color: "var(--color-creme-claro)",
                fontFamily: "var(--fonte-titulo-nova)",
              }}
            >
              {roteiro.titulo}
            </h1>
            <CasaEnxaimel
              tamanho={28}
              className="mt-1 shrink-0"
              style={{ color: "var(--color-creme-claro)" }}
            />
          </div>

          <p
            className="mt-2 text-[13px]"
            style={{ color: "var(--color-creme-fundo)" }}
          >
            {resumoDoPasseio(roteiro.paradas)}
          </p>

          {roteiro.descricao && (
            <p
              className="mt-3 text-[14px]"
              style={{ color: "var(--color-creme-claro)" }}
            >
              {roteiro.descricao}
            </p>
          )}
        </header>

        {roteiro.paradas.length === 0 ? (
          <p
            className="px-4 py-10 text-center text-[14px]"
            style={{ color: "var(--color-texto-suave)" }}
          >
            As paradas deste roteiro saíram do ar. Peça outro ao Guia, com o que
            está aberto hoje.
          </p>
        ) : (
          <>
            <div className="px-4 pt-6">
              <ListaDeParadas paradas={roteiro.paradas} />
            </div>

            <div className="pt-7">
              <FaixaEnxaimel />
            </div>

            {/* O rodapé acompanha a rolagem porque é o que a pessoa vem fazer:
              ela lê as paradas e sai andando. Ter de voltar ao topo para
              achar a rota seria atrito no pior momento. */}
            <div
              className="sticky bottom-0 z-30 flex gap-2 px-4 py-3"
              style={{
                backgroundColor: "var(--color-reboco)",
                borderTop: "2px solid var(--color-madeira)",
              }}
            >
              {rota && (
                <a
                  href={rota}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-12 flex-1 items-center justify-center rounded-[11px] px-4 text-center text-[14px] font-bold"
                  style={{
                    backgroundColor: "var(--color-torii)",
                    color: "#fff7ea",
                  }}
                >
                  Abrir rota no Google Maps
                </a>
              )}
              <Link
                href="/chat"
                className="flex h-12 shrink-0 items-center justify-center rounded-[11px] px-4 text-[14px] font-bold"
                style={{
                  border: "2px solid var(--color-madeira)",
                  color: "var(--color-madeira)",
                }}
              >
                Editar paradas
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
