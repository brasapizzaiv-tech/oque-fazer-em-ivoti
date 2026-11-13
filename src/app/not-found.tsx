import type { Metadata } from "next";
import CabecalhoSimples from "@/components/vidro/CabecalhoSimples";
import { Botao, Legenda } from "@/components/vidro/pecas";

export const metadata: Metadata = {
  title: "Página não encontrada",
  robots: { index: false, follow: true },
};

/**
 * O endereço que não existe.
 *
 * Sem este arquivo o visitante caía na página padrão do Next: em inglês,
 * sem a marca e sem caminho de volta. Quem chega por um link antigo (um
 * lugar que saiu do ar, um evento que passou) precisa saber que está no
 * guia de Ivoti e ter para onde ir.
 */
export default function NaoEncontrada() {
  return (
    <>
      <CabecalhoSimples />

      <div className="mx-auto max-w-[640px] px-4 py-14 text-center lg:py-24">
        <Legenda cor="var(--color-v-petunia)">Endereço não encontrado</Legenda>
        <h1
          className="mt-2 text-[28px] leading-[1.15] font-bold lg:text-[36px]"
          style={{
            color: "var(--color-v-texto)",
            fontFamily: "var(--fonte-titulo-nova)",
          }}
        >
          Esta página não existe, ou saiu do ar.
        </h1>
        <p
          className="mt-3 text-[15px]"
          style={{ color: "var(--color-v-texto-suave)" }}
        >
          O lugar pode ter mudado de endereço no guia, ou o evento já passou.
          O resto de Ivoti continua aqui.
        </p>

        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Botao href="/explorar">Ver os lugares</Botao>
          <Botao tom="secundario" href="/agenda">
            Ver a agenda
          </Botao>
          <Botao tom="secundario" href="/">
            Ir para o início
          </Botao>
        </div>
      </div>
    </>
  );
}
