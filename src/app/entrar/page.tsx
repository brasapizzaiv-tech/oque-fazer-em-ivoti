import type { Metadata } from "next";
import { Suspense } from "react";
import FormularioEntrar from "./FormularioEntrar";

export const metadata: Metadata = {
  title: "Entrar",
  description: "Acesse o painel do seu estabelecimento.",
};

export default function Entrar() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold">Entrar</h1>
      <p className="mt-1 text-sm text-tinta/60">
        Área dos estabelecimentos cadastrados no guia.
      </p>
      <Suspense>
        <FormularioEntrar />
      </Suspense>
    </div>
  );
}
