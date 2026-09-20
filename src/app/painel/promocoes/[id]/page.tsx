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
      <Link href="/painel/promocoes" className="text-sm texto-suave">
        ← Minhas promoções
      </Link>
      <div className="mt-2">
        <h1
          className="text-[22px] font-bold sm:text-[26px]"
          style={{
            color: "var(--color-texto)",
            fontFamily: "var(--fonte-titulo-nova)",
          }}
        >
          {promocao.titulo}
        </h1>
      </div>

      <div className="mt-6">
        <FormularioPromocao promocao={promocao as Promocao} locais={locais} />
      </div>

      <div className="mt-10 border-t-2 border-[color:var(--color-madeira)]/20 pt-6">
        <ApagarPromocao id={promocao.id} titulo={promocao.titulo} />
      </div>
    </>
  );
}
