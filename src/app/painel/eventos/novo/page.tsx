import Link from "next/link";
import FormularioEvento from "@/components/painel/FormularioEvento";
import Bloqueado from "@/components/painel/Bloqueado";
import { locaisParaEvento } from "../locais-do-dono";

export const dynamic = "force-dynamic";

export default async function NovoEvento() {
  const { locais, admin, bloqueado } = await locaisParaEvento("eventos");

  return (
    <>
      <Link href="/painel/eventos" className="text-sm texto-suave">
        ← Meus eventos
      </Link>
      <div className="mt-2 mb-6">
        <h1
          className="text-[22px] font-bold sm:text-[26px]"
          style={{
            color: "var(--color-v-texto)",
            fontFamily: "var(--fonte-titulo-nova)",
          }}
        >
          Cadastrar evento
        </h1>
      </div>

      {bloqueado ? (
        <Bloqueado modulo="eventos" />
      ) : (
        <FormularioEvento locais={locais} ehAdmin={admin} />
      )}
    </>
  );
}
