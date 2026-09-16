import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CartaoRoteiro from "@/components/CartaoRoteiro";
import ContarAcesso from "@/components/ContarAcesso";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_CONFIGURADO } from "@/lib/supabase/config";
import type { Parada } from "@/lib/roteiro";

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
    .select("id, slug, nome, lat, lng, endereco, bairro, categoria:categorias(nome)")
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

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      <ContarAcesso />

      <p className="text-sm text-tinta/55">Roteiro compartilhado</p>
      <h1 className="mt-1 text-2xl font-bold">{roteiro.titulo}</h1>

      <div className="mt-5">
        <CartaoRoteiro
          titulo={roteiro.titulo}
          paradas={roteiro.paradas}
          compartilhavel={false}
        />
      </div>

      <div className="mt-8 rounded-2xl border border-dashed border-mata-200 bg-white p-6 text-center">
        <p className="font-semibold">Quer montar o seu?</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-tinta/60">
          Diga ao Gui o que você tem vontade de fazer e ele monta um passeio
          com horário e rota.
        </p>
        <Link
          href="/chat"
          className="mt-4 inline-block rounded-full bg-mata-600 px-6 py-3 font-semibold text-white"
        >
          Conversar com o Gui
        </Link>
      </div>
    </div>
  );
}
