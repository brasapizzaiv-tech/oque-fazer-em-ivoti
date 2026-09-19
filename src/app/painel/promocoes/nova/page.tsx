import Link from "next/link";
import FormularioPromocao from "@/components/painel/FormularioPromocao";
import { locaisParaEvento } from "../../eventos/locais-do-dono";

export const dynamic = "force-dynamic";

export default async function NovaPromocao() {
  const { locais } = await locaisParaEvento();

  return (
    <>
      <Link
        href="/painel/promocoes"
        className="text-sm text-tinta/55 hover:text-sol-700"
      >
        ← Minhas promoções
      </Link>
      <h1 className="mt-2 mb-6 text-lg font-semibold">Cadastrar promoção</h1>

      {locais.length === 0 ? (
        <p className="border-2 border-dashed border-carvalho/40 bg-creme p-8 text-center text-sm text-tinta/60">
          Cadastre primeiro o seu estabelecimento — a promoção fica ligada a
          ele.
        </p>
      ) : (
        <FormularioPromocao locais={locais} />
      )}
    </>
  );
}
