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

  // A Inicio abre com a foto ocupando a tela toda, e o cabecalho flutua
  // por cima dela. As outras telas comecam com conteudo, e ai o cabecalho
  // precisa do proprio espaco.
  const temCapa = caminho === "/";

  return (
    <>
      <FundoDaCidade />
      <CabecalhoDesktop temCapa={temCapa} />
      {/* O espaço embaixo é do tamanho da barra de baixo: sem ele o último
          bloco da página fica escondido atrás dela.

          O espaço de cima é o do cabeçalho fixo — MENOS na tela que tem
          capa. Com ele, a foto comecava 84px abaixo e o cabecalho
          transparente ficava sobre o fundo claro do site: o logo branco e o
          "Sou comerciante" quase sumiam. A capa tem de passar por baixo da
          barra, que e o que faz o texto branco ter foto atras. */}
      <main
        className={`flex-1 pb-[76px] lg:pb-0 ${temCapa ? "" : "lg:pt-[84px]"}`}
      >
        {children}
      </main>
      <NavegacaoInferior />
    </>
  );
}
