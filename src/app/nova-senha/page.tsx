import type { Metadata } from "next";
import CabecalhoSimples from "@/components/vidro/CabecalhoSimples";
import FormularioNovaSenha from "./FormularioNovaSenha";

export const metadata: Metadata = {
  title: "Nova senha",
  robots: { index: false, follow: false },
};

export default function NovaSenha() {
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
          Criar uma senha nova
        </h1>
        <p
          className="mt-1 text-[14px]"
          style={{ color: "var(--color-v-texto-suave)" }}
        >
          Escolha a senha que você vai usar para entrar no painel.
        </p>
        <FormularioNovaSenha />
      </div>
    </>
  );
}
