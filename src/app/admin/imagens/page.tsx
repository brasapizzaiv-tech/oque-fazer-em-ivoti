import type { Metadata } from "next";
import { TituloPainel } from "@/components/painel/pecas";
import { listarImagens } from "@/lib/imagens";
import TrocarImagem from "./TrocarImagem";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Imagens do site",
  robots: { index: false, follow: false },
};

export default async function Imagens() {
  const imagens = await listarImagens();

  return (
    <div>
      <TituloPainel apoio="A foto de fundo e a capa de cada tela. O que não for trocado aqui continua usando a foto original.">
        Imagens do site
      </TituloPainel>

      {imagens.length === 0 ? (
        <p className="mt-6 text-[14px] texto-suave">
          Nenhuma imagem cadastrada. Rode a migração do banco.
        </p>
      ) : (
        <div className="mt-6 space-y-4">
          {imagens.map((i) => (
            <TrocarImagem key={i.chave} imagem={i} />
          ))}
        </div>
      )}

      <p className="mt-8 text-[13px] texto-suave">
        A troca aparece no site em até cinco minutos — as páginas ficam
        guardadas em cache por um tempo para carregar rápido.
      </p>
    </div>
  );
}
