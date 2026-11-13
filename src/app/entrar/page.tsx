import type { Metadata } from "next";
import CabecalhoSimples from "@/components/vidro/CabecalhoSimples";
import { Suspense } from "react";
import FormularioEntrar from "./FormularioEntrar";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse o painel do seu estabelecimento.",
  // Tela de senha não é resultado de busca: fica fora, como as outras
  // telas de conta.
  robots: { index: false, follow: false },
};

export default function Entrar() {
  return (
    <>
      <CabecalhoSimples />
      <div className="mx-auto max-w-md px-4 py-10">
        <h1
          className="text-[28px] font-bold"
          style={{
            color: "var(--color-v-texto)",
            fontFamily: "var(--fonte-titulo-nova)",
          }}
        >
          Entrar
        </h1>
        <p
          className="mt-1 text-[14px]"
          style={{ color: "var(--color-v-texto-suave)" }}
        >
          Área dos estabelecimentos cadastrados no guia.
        </p>
        <Suspense>
          <FormularioEntrar />
        </Suspense>
      </div>
    </>
  );
}
