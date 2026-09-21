import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ContarAcesso from "@/components/ContarAcesso";
import ListaDeParadas from "@/components/vidro/ListaDeParadas";
import { CasaEnxaimel } from "@/components/vidro/icones";
import { Legenda } from "@/components/vidro/pecas";
import { FileiraDePetunias } from "@/components/vidro/blocos";
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
    <div className="mx-auto lg:max-w-[760px] lg:px-8 lg:pb-10">
      <ContarAcesso />

      <header className="relative isolate px-4 pt-4 pb-4">
        <Image
          src="/fotos/eu-amo-ivoti.jpg"
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-center"
        />
        <div aria-hidden className="veu-do-topo absolute inset-0 -z-10" />
        <div className="vidro-azul px-4 py-4">
          <Legenda cor="#FFFFFF">Roteiro pronto</Legenda>

          <div className="mt-1.5 flex items-start gap-2">
            <h1
              className="text-[26px] leading-tight font-bold"
              style={{
                color: "#FFFFFF",
                fontFamily: "var(--fonte-titulo-nova)",
              }}
            >
              {roteiro.titulo}
            </h1>
            <CasaEnxaimel tamanho={28} className="mt-1 shrink-0 text-white" />
          </div>

          <p className="mt-2 text-[13px] text-white/85">
            {resumoDoPasseio(roteiro.paradas)}
          </p>

          {roteiro.descricao && (
            <p className="mt-3 text-[14px] text-white">{roteiro.descricao}</p>
          )}
        </div>
      </header>

      {roteiro.paradas.length === 0 ? (
        <p
          className="px-4 py-10 text-center text-[14px]"
          style={{ color: "var(--color-v-texto-suave)" }}
        >
          As paradas deste roteiro saíram do ar. Peça outro ao Guia, com o que
          está aberto hoje.
        </p>
      ) : (
        <>
          <div className="px-4 pt-6">
            <ListaDeParadas paradas={roteiro.paradas} />
          </div>
          <FileiraDePetunias />

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
                  backgroundColor: "var(--color-v-torii)",
                  color: "#FFFFFF",
                }}
              >
                Abrir rota no Google Maps
              </a>
            )}
            <Link
              href="/chat"
              className="flex h-12 shrink-0 items-center justify-center rounded-[11px] px-4 text-[14px] font-bold"
              style={{
                border: "1.5px solid var(--color-v-azul)",
                color: "var(--color-v-azul)",
              }}
            >
              Editar paradas
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
