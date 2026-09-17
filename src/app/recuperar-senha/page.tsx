import type { Metadata } from "next";
import FormularioRecuperar from "./FormularioRecuperar";

export const metadata: Metadata = {
  title: "Recuperar senha",
  description: "Peça um link para criar uma senha nova.",
  robots: { index: false, follow: false },
};

export default function RecuperarSenha() {
  return (
    <div className="mx-auto max-w-md px-4 py-12">
      <h1 className="text-2xl font-bold">Esqueceu a senha?</h1>
      <p className="mt-1 text-sm text-tinta/60">
        Diga o e-mail da conta que mandamos um link para você criar outra.
      </p>
      <FormularioRecuperar />
    </div>
  );
}
