import Link from "next/link";
import { notFound } from "next/navigation";
import FormularioEvento from "@/components/painel/FormularioEvento";
import ApagarEvento from "./ApagarEvento";
import { createClient } from "@/lib/supabase/server";
import { locaisParaEvento } from "../locais-do-dono";
import type { Evento } from "@/lib/tipos";

export const dynamic = "force-dynamic";

export default async function EditarEvento({
  params,
}: PageProps<"/painel/eventos/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  // As regras de acesso do banco ja garantem que so o dono (ou o admin)
  // enxerga: se nao voltar nada, e porque a pessoa nao pode ver este evento.
  const { data: evento } = await supabase
    .from("eventos")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!evento) notFound();

  const { locais, admin } = await locaisParaEvento();

  return (
    <>
      <Link
        href="/painel/eventos"
        className="text-sm text-tinta/55 hover:text-sol-700"
      >
        ← Meus eventos
      </Link>
      <h1 className="mt-2 text-lg font-semibold">{evento.titulo}</h1>

      {evento.status === "rejeitado" && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          Este evento precisa de ajuste antes de entrar na agenda.
        </p>
      )}

      <div className="mt-6">
        <FormularioEvento
          evento={evento as Evento}
          locais={locais}
          ehAdmin={admin}
        />
      </div>

      <div className="mt-10 border-t-2 border-carvalho/20 pt-6">
        <ApagarEvento id={evento.id} titulo={evento.titulo} />
      </div>
    </>
  );
}
