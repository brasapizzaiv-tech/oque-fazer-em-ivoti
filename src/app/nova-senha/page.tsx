import type { Metadata } from "next";
import FormularioNovaSenha from "./FormularioNovaSenha";

export const metadata: Metadata = {
  title: "Nova senha",
  robots: { index: false, follow: false },
};

export default function NovaSenha() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold">Criar uma senha nova</h1>
      <p className="mt-1 text-sm text-tinta/60">
        Escolha a senha que você vai usar para entrar no painel.
      </p>
      <FormularioNovaSenha />
    </div>
  );
}
