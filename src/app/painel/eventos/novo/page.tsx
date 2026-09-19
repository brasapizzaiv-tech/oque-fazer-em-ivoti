import Link from "next/link";
import FormularioEvento from "@/components/painel/FormularioEvento";
import { locaisParaEvento } from "../locais-do-dono";

export const dynamic = "force-dynamic";

export default async function NovoEvento() {
  const { locais, admin } = await locaisParaEvento();

  return (
    <>
      <Link href="/painel/eventos" className="text-sm text-tinta/55 hover:text-sol-700">
        ← Meus eventos
      </Link>
      <h1 className="mt-2 mb-6 text-lg font-semibold">Cadastrar evento</h1>

      <FormularioEvento locais={locais} ehAdmin={admin} />
    </>
  );
}
