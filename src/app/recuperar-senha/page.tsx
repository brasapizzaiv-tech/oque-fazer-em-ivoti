import type { Metadata } from "next";
import CabecalhoSimples from "@/components/enxaimel/CabecalhoSimples";
import FormularioRecuperar from "./FormularioRecuperar";

export const metadata: Metadata = {
  title: "Recuperar senha",
  description: "Peça um link para criar uma senha nova.",
  robots: { index: false, follow: false },
};

export default function RecuperarSenha() {
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
          Esqueceu a senha?
        </h1>
        <p
          className="mt-1 text-[14px]"
          style={{ color: "var(--color-texto-suave)" }}
        >
          Diga o e-mail da conta que mandamos um link para você criar outra.
        </p>
        <FormularioRecuperar />
      </div>
    </div>
  );
}
