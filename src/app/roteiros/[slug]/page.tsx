import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CartaoRoteiro from "@/components/CartaoRoteiro";
import ContarAcesso from "@/components/ContarAcesso";
import { roteiroCurado } from "@/lib/roteiros-curados";
import { linkWhatsappDoRoteiro } from "@/lib/roteiro";
import { SITE } from "@/lib/site";

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

  // Rascunho nao publicado so existe para quem esta montando: para o
  // visitante, a pagina ainda nao nasceu.
  if (!roteiro || !roteiro.publicado) notFound();

  const endereco = `${SITE}/roteiros/${roteiro.slug}`;

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <ContarAcesso />

      <nav className="text-sm text-tinta/55">
        <Link href="/roteiros" className="hover:text-mata-700">
          Roteiros
        </Link>
      </nav>

      <h1 className="mt-1 text-3xl font-bold">{roteiro.titulo}</h1>
      {roteiro.descricao && (
        <p className="mt-2 text-tinta/70">{roteiro.descricao}</p>
      )}

      {roteiro.paradas.length === 0 ? (
        <p className="mt-6 border-2 border-dashed border-carvalho/40 bg-creme px-4 py-8 text-center text-sm text-tinta/55">
          As paradas deste roteiro saíram do ar. Pergunte ao Guia que ele monta
          um passeio com o que está aberto hoje.
        </p>
      ) : (
        <div className="mt-6">
          {/* Sem o botão de salvar: esta página já tem endereço próprio, e
              guardar uma cópia dela com outro link só confundiria. */}
          <CartaoRoteiro
            titulo={roteiro.titulo}
            paradas={roteiro.paradas}
            compartilhavel={false}
          />
        </div>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        <a
          href={linkWhatsappDoRoteiro(roteiro.titulo, endereco)}
          target="_blank"
          rel="noopener noreferrer"
          className="border-2 border-carvalho bg-creme px-4 py-2 text-sm font-semibold text-mata-700 transition hover:bg-cal-sombra"
        >
          Mandar no WhatsApp
        </a>
      </div>

      <div className="mt-8 border-2 border-dashed border-carvalho/40 bg-creme p-6 text-center">
        <p className="font-semibold">Quer um passeio do seu jeito?</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-tinta/60">
          Diga ao Guia quanto tempo você tem e o que gosta de fazer, e ele monta
          um roteiro com horário e rota.
        </p>
        <Link
          href="/chat"
          className="mt-4 inline-block border-2 border-carvalho bg-carvalho px-6 py-3 font-semibold text-white"
        >
          Conversar com o Guia
        </Link>
      </div>
    </div>
  );
}
