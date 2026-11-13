"use client";

import Link from "next/link";
import { useEffect } from "react";

/**
 * A página que aparece quando alguma tela quebra.
 *
 * Sem este arquivo, um erro em qualquer parte da página (um cadastro com
 * um dado torto, o banco fora do ar por um instante) derrubava a tela
 * inteira numa mensagem técnica em inglês. Aqui o visitante fica sabendo
 * que o problema é nosso, pode tentar de novo e tem para onde ir.
 *
 * Nesta versão do Next a função de tentar de novo se chama `retry`.
 */
export default function Erro({
  error,
  retry,
}: {
  error: Error & { digest?: string };
  retry: () => void;
}) {
  useEffect(() => {
    console.error("A página quebrou:", error);
  }, [error]);

  return (
    <div className="mx-auto max-w-[640px] px-4 py-16 text-center lg:py-28">
      <h1
        className="text-[28px] leading-[1.15] font-bold lg:text-[36px]"
        style={{
          color: "var(--color-v-texto)",
          fontFamily: "var(--fonte-titulo-nova)",
        }}
      >
        Esta página não abriu.
      </h1>
      <p
        className="mt-3 text-[15px]"
        style={{ color: "var(--color-v-texto-suave)" }}
      >
        O problema é do nosso lado, não do seu aparelho. Tente de novo; se
        continuar, o resto do guia segue funcionando.
      </p>

      <div className="mt-7 flex flex-wrap justify-center gap-3">
        <button
          type="button"
          onClick={() => retry()}
          className="inline-flex h-12 items-center rounded-[11px] px-6 text-[14px] font-bold"
          style={{ backgroundColor: "var(--color-v-torii)", color: "#FFFFFF" }}
        >
          Tentar de novo
        </button>
        <Link
          href="/"
          className="inline-flex h-12 items-center rounded-[11px] px-6 text-[14px] font-bold"
          style={{
            border: "1.5px solid var(--color-v-texto)",
            color: "var(--color-v-texto)",
          }}
        >
          Ir para o início
        </Link>
      </div>
    </div>
  );
}
