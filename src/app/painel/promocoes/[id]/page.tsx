import Link from "next/link";
import { notFound } from "next/navigation";
import FormularioPromocao from "@/components/painel/FormularioPromocao";
import ApagarPromocao from "./ApagarPromocao";
import { createClient } from "@/lib/supabase/server";
import { locaisParaEvento } from "../../eventos/locais-do-dono";
import type { Promocao } from "@/lib/promocoes";

export const dynamic = "force-dynamic";

export default async function EditarPromocao({
  params,
}: PageProps<"/painel/promocoes/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  // As regras de acesso do banco cuidam da permissão: se não voltar nada, é
  // porque esta promoção não é de quem está olhando.
  const { data: promocao } = await supabase
    .from("promocoes")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (!promocao) notFound();

  const { locais } = await locaisParaEvento();

  return (
    <>
      <Link
        href="/painel/promocoes"
        className="text-sm text-tinta/55 hover:text-mata-700"
      >
        ← Minhas promoções
      </Link>
      <h1 className="mt-2 text-lg font-semibold">{promocao.titulo}</h1>

      <div className="mt-6">
        <FormularioPromocao promocao={promocao as Promocao} locais={locais} />
      </div>

      <div className="mt-10 border-t border-mata-100 pt-6">
        <ApagarPromocao id={promocao.id} titulo={promocao.titulo} />
      </div>
    </>
  );
}
