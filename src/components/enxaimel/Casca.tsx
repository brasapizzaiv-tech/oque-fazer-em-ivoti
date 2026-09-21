"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import CabecalhoDesktopMadeira from "./CabecalhoDesktop";
import CabecalhoDesktopVidro from "../vidro/CabecalhoDesktop";
import FundoDaCidade from "../vidro/FundoDaCidade";
import NavegacaoVidro from "../vidro/NavegacaoInferior";
import { IconeExplorar, IconeGuia, IconeInicio, IconeRoteiros } from "./icones";

/**
 * A casca do site, durante a segunda migração.
 *
 * O desenho de madeira virou desenho de vidro, e outra vez as duas
 * linguagens precisam conviver enquanto as telas viram uma a uma. A
 * diferença agora é maior que trocar cor de card: o vidro depende de uma
 * foto fixa atrás da página inteira, e essa foto mora aqui. Se ela
 * aparecesse debaixo de uma tela de madeira, o reboco ficaria em cima da
 * foto e os dois se anulariam.
 *
 * Então são três caminhos:
 *
 *   VIDRO   — a foto de fundo, a barra de baixo de vidro e o cabeçalho
 *             transparente do computador;
 *   MADEIRA — o que ainda não virou: cabeçalho e barra do desenho antigo;
 *   PRÓPRIA — painel, administração e a vitrine, que trazem tudo.
 *
 * A lista do vidro cresce a cada tela migrada, a de madeira encolhe, e
 * este arquivo some quando a última virar.
 */
const VIDRO = ["/", "/explorar", "/chat"];
const VIDRO_PREFIXOS = ["/local/", "/roteiros/"];

// Trazem cabeçalho, largura e navegação próprios.
const CASCA_PROPRIA = ["/painel", "/admin", "/componentes"];

export default function Casca({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();

  if (CASCA_PROPRIA.some((p) => caminho === p || caminho.startsWith(p + "/")))
    return <main className="flex-1">{children}</main>;

  const vidro =
    VIDRO.includes(caminho) ||
    VIDRO_PREFIXOS.some((p) => caminho.startsWith(p));

  if (vidro)
    return (
      <>
        <FundoDaCidade />
        <CabecalhoDesktopVidro temCapa={caminho === "/"} />
        {/* O espaço embaixo é do tamanho da barra: sem ele o último bloco
            da página fica escondido atrás dela. */}
        <main className="flex-1 pb-[76px] lg:pt-[84px] lg:pb-0">
          {children}
        </main>
        <NavegacaoVidro />
      </>
    );

  return (
    <>
      {/* O fundo vai aqui e não só na página: o body ainda pinta o creme
          da paleta antiga, e ele aparecia abaixo do conteúdo quando a
          página era mais curta que a tela. */}
      <CabecalhoDesktopMadeira />
      <main
        className="flex-1 pb-[72px] lg:pb-0"
        style={{ backgroundColor: "var(--color-reboco)" }}
      >
        {children}
      </main>
      <NavegacaoMadeira caminho={caminho} />
    </>
  );
}

const ITENS = [
  { href: "/", rotulo: "Início", Icone: IconeInicio },
  { href: "/explorar", rotulo: "Explorar", Icone: IconeExplorar },
  { href: "/roteiros", rotulo: "Roteiros", Icone: IconeRoteiros },
  { href: "/chat", rotulo: "Guia", Icone: IconeGuia },
];

/** A barra de baixo do desenho antigo, só nas telas que ainda não viraram. */
function NavegacaoMadeira({ caminho }: { caminho: string }) {
  return (
    <nav
      className="fixed inset-x-0 bottom-0 z-40 flex lg:hidden"
      style={{
        backgroundColor: "var(--color-superficie)",
        borderTop: "2px solid var(--color-madeira)",
      }}
    >
      {ITENS.map(({ href, rotulo, Icone }) => {
        const ativo = href === "/" ? caminho === "/" : caminho.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={ativo ? "page" : undefined}
            className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
            style={{
              color: ativo ? "var(--color-torii)" : "var(--color-texto-suave)",
            }}
          >
            <Icone />
            {rotulo}
          </Link>
        );
      })}
    </nav>
  );
}
