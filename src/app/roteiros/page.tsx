import Link from "next/link";
import type { Metadata } from "next";
import CartaoRoteiroPronto from "@/components/CartaoRoteiroPronto";
import ContarAcesso from "@/components/ContarAcesso";
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
    <div className="mx-auto max-w-2xl px-4 py-8">
      <ContarAcesso />

      <h1 className="text-3xl font-bold">Roteiros prontos</h1>
      <p className="mt-2 text-tinta/70">
        Passeios já montados, com as paradas na ordem e a rota pronta para abrir
        no mapa. Dá para tirar uma parada que não combina antes de sair.
      </p>

      {roteiros.length === 0 ? (
        <div className="mt-6 border-2 border-dashed border-carvalho/40 bg-creme p-10 text-center">
          <p className="text-3xl">🗺️</p>
          <p className="mt-2 font-semibold">Ainda não publicamos nenhum</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-tinta/60">
            Enquanto isso, o Guia monta um passeio do seu jeito: é só dizer
            quanto tempo você tem.
          </p>
          <Link
            href="/chat"
            className="mt-5 inline-block border-2 border-carvalho bg-carvalho px-6 py-3 font-semibold text-white"
          >
            Conversar com o Guia
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {roteiros.map((r) => (
            <CartaoRoteiroPronto key={r.id} roteiro={r} />
          ))}
        </div>
      )}
    </div>
  );
}
