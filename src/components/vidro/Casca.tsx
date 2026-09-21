"use client";

import { usePathname } from "next/navigation";
import CabecalhoDesktop from "./CabecalhoDesktop";
import FundoDaCidade from "./FundoDaCidade";
import NavegacaoInferior from "./NavegacaoInferior";

/**
 * A casca do site.
 *
 * A foto fixa da cidade mora aqui, e não numa tela: é ela que faz o vidro
 * ser vidro. Num fundo chapado o desfoque não teria o que desfocar e cada
 * cartão viraria um retângulo branco.
 *
 * Sobrou uma exceção: o painel e a administração trazem a própria casca
 * inteira — cabeçalho, abas e largura. Recebiam o cabeçalho do site por
 * cima da própria barra, e a barra de baixo com "Explorar" e "Roteiros"
 * sob a tela de quem está editando o próprio cadastro. A vitrine dos
 * componentes entra na mesma regra, porque monta o próprio fundo.
 */
const CASCA_PROPRIA = ["/painel", "/admin", "/componentes"];

export default function Casca({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();

  if (CASCA_PROPRIA.some((p) => caminho === p || caminho.startsWith(p + "/")))
    return <main className="flex-1">{children}</main>;

  return (
    <>
      <FundoDaCidade />
      <CabecalhoDesktop temCapa={caminho === "/"} />
      {/* O espaço embaixo é do tamanho da barra: sem ele o último bloco da
          página fica escondido atrás dela. No computador a barra some e o
          espaço de cima passa a ser o do cabeçalho fixo. */}
      <main className="flex-1 pb-[76px] lg:pt-[84px] lg:pb-0">{children}</main>
      <NavegacaoInferior />
    </>
  );
}
