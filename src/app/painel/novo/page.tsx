import Link from "next/link";
import { listarCategorias } from "@/lib/locais";
import FormularioNovo from "./FormularioNovo";
import { AvisoDeCobranca } from "@/components/AvisoDoPeriodoGratis";

export const dynamic = "force-dynamic";

export default async function Novo() {
  const categorias = await listarCategorias();

  return (
    <div className="mx-auto max-w-lg">
      <Link href="/painel" className="text-sm texto-suave">
        ← Voltar
      </Link>
      <div className="mt-2">
        <h1
          className="text-[22px] font-bold sm:text-[26px]"
          style={{
            color: "var(--color-v-texto)",
            fontFamily: "var(--fonte-titulo-nova)",
          }}
        >
          Cadastrar um local
        </h1>
      </div>
      <p className="mt-1 text-sm texto-suave">
        Comece pelo básico. Depois você completa fotos, horários e o resto com
        calma.
      </p>

      <AvisoDeCobranca className="aviso-painel mt-4 px-4 py-3" />

      <FormularioNovo categorias={categorias} />
    </div>
  );
}
