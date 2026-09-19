import Link from "next/link";
import { listarCategorias } from "@/lib/locais";
import FormularioNovo from "./FormularioNovo";

export const dynamic = "force-dynamic";

export default async function Novo() {
  const categorias = await listarCategorias();

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/painel" className="text-sm text-tinta/55 hover:text-sol-700">
        ← Voltar
      </Link>
      <h1 className="mt-2 text-xl font-semibold">Cadastrar um local</h1>
      <p className="mt-1 text-sm text-tinta/60">
        Comece pelo básico. Depois você completa fotos, horários e o resto com
        calma.
      </p>

      <FormularioNovo categorias={categorias} />
    </div>
  );
}
