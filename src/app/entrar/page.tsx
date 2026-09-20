import type { Metadata } from "next";
import CabecalhoSimples from "@/components/enxaimel/CabecalhoSimples";
import { Suspense } from "react";
import FormularioEntrar from "./FormularioEntrar";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse o painel do seu estabelecimento.",
};

export default function Entrar() {
  return (
    <div style={{ backgroundColor: "var(--color-reboco)" }}>
      <CabecalhoSimples />
      <div className="mx-auto max-w-md px-4 py-10">
        <h1
          className="text-[28px] font-bold"
          style={{
            color: "var(--color-texto)",
            fontFamily: "var(--fonte-titulo-nova)",
          }}
        >
          Entrar
        </h1>
        <p
          className="mt-1 text-[14px]"
          style={{ color: "var(--color-texto-suave)" }}
        >
          Área dos estabelecimentos cadastrados no guia.
        </p>
        <Suspense>
          <FormularioEntrar />
        </Suspense>
      </div>
    </div>
  );
}
