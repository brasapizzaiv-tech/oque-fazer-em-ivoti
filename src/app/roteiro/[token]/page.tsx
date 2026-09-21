import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ContarAcesso from "@/components/ContarAcesso";
import ListaDeParadas from "@/components/vidro/ListaDeParadas";
import { Petunia } from "@/components/vidro/icones";
import { Legenda } from "@/components/vidro/pecas";
import { FileiraDePetunias } from "@/components/vidro/blocos";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_CONFIGURADO } from "@/lib/supabase/config";
import { linkGoogleMaps, resumoDoPasseio, type Parada } from "@/lib/roteiro";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Roteiro",
  // Um roteiro é de quem recebeu o link, não do Google.
  robots: { index: false, follow: false },
};

async function buscar(token: string) {
  if (!SUPABASE_CONFIGURADO) return null;
  const supabase = await createClient();

  const { data: roteiro } = await supabase
    .from("roteiros")
    .select("titulo, locais, descricao")
    .eq("token", token)
    .maybeSingle();

  if (!roteiro) return null;

  const ids = (roteiro.locais ?? []) as string[];
  const { data: locais } = await supabase
    .from("locais")
    .select(
      "id, slug, nome, lat, lng, endereco, bairro, categoria:categorias(nome)",
    )
    .in("id", ids)
    .eq("status", "publicado");

  // A consulta devolve em qualquer ordem; a do roteiro é a que importa.
  const porId = new Map((locais ?? []).map((l) => [l.id, l]));
  const paradas: Parada[] = ids
    .map((id) => porId.get(id))
    .filter(Boolean)
    .map((l) => ({
      id: l!.id,
      slug: l!.slug,
      nome: l!.nome,
      lat: l!.lat,
      lng: l!.lng,
      endereco: l!.endereco,
      bairro: l!.bairro,
    }));

  return { titulo: roteiro.titulo as string, paradas };
}

export default async function RoteiroSalvo({
  params,
}: PageProps<"/roteiro/[token]">) {
  const { token } = await params;
  const roteiro = await buscar(token);

  if (!roteiro) notFound();

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
          <Legenda cor="#FFFFFF">Roteiro compartilhado</Legenda>

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
            <Petunia tamanho={22} className="mt-1.5 shrink-0" />
          </div>

          <p className="mt-2 text-[13px] text-white/85">
            {resumoDoPasseio(roteiro.paradas)}
          </p>
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
        <div className="px-4 pt-6">
          <ListaDeParadas paradas={roteiro.paradas} />
        </div>
      )}
      <FileiraDePetunias />

      {/* O convite fecha a página: quem recebeu o link de um amigo é
            justamente quem ainda não sabe que dá para montar o próprio. */}
      <section className="px-4 py-8 text-center">
        <p
          className="text-[18px] font-bold"
          style={{
            color: "var(--color-texto)",
            fontFamily: "var(--fonte-titulo-nova)",
          }}
        >
          Quer montar o seu?
        </p>
        <p
          className="mx-auto mt-1.5 max-w-[42ch] text-[14px]"
          style={{ color: "var(--color-v-texto-suave)" }}
        >
          Diga ao Guia o que você tem vontade de fazer e ele monta um passeio
          com horário e rota.
        </p>
        <Link
          href="/chat"
          className="mt-5 inline-flex h-12 items-center rounded-[11px] px-6 text-[14px] font-bold"
          style={{ backgroundColor: "var(--color-v-torii)", color: "#fff7ea" }}
        >
          Conversar com o Guia
        </Link>
      </section>

      {/* O rodapé acompanha a rolagem: a pessoa lê as paradas e sai andando,
            e voltar ao topo para achar a rota seria atrito no pior momento. */}
      {rota && (
        <div
          className="sticky bottom-0 z-30 px-4 py-3"
          style={{
            backgroundColor: "rgba(250, 247, 241, 0.86)",
            backdropFilter: "blur(14px)",
            borderTop: "1px solid rgba(255, 255, 255, 0.8)",
          }}
        >
          <a
            href={rota}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center rounded-[11px] px-4 text-center text-[14px] font-bold"
            style={{
              backgroundColor: "var(--color-v-torii)",
              color: "#FFFFFF",
            }}
          >
            Abrir rota no Google Maps
          </a>
        </div>
      )}
    </div>
  );
}
