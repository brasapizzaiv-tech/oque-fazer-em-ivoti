"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import CabecalhoDesktop from "./CabecalhoDesktop";
import { IconeExplorar, IconeGuia, IconeInicio, IconeRoteiros } from "./icones";

/**
 * A casca do site.
 *
 * Durante a migração esta era a ponte entre dois desenhos: tela migrada
 * recebia a casca nova, tela velha continuava com o cabeçalho e o rodapé de
 * antes. A lista de telas migradas esvaziou, e com ela a casca antiga saiu —
 * junto com os doze componentes que só ela usava.
 *
 * Sobrou uma regra: o painel e a administração trazem a própria casca
 * inteira. Recebiam o cabeçalho do site por cima da própria barra, e a barra
 * de baixo do celular — "Explorar", "Roteiros" — sob a tela de quem está
 * editando o próprio cadastro.
 */
// "/componentes" entra aqui enquanto o desenho novo nao vira o site: a
// vitrine traz as pecas de vidro e a propria barra de baixo, e o cabecalho
// de madeira por cima delas so atrapalhava a leitura do que esta em prova.
const CASCA_PROPRIA = ["/painel", "/admin", "/componentes"];

export default function Casca({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();

  if (CASCA_PROPRIA.some((p) => caminho === p || caminho.startsWith(p + "/")))
    return <main className="flex-1">{children}</main>;

  return (
    <>
      {/* O espaço embaixo é do tamanho da barra: sem ele o último bloco da
          página fica escondido atrás dela. */}
      {/* O fundo vai aqui e não só na página: o body ainda pinta o creme
          da paleta antiga, e ele aparecia abaixo do conteúdo quando a página
          era mais curta que a tela. */}
      <CabecalhoDesktop />
      <main
        className="flex-1 pb-[72px] lg:pb-0"
        style={{ backgroundColor: "var(--color-reboco)" }}
      >
        {children}
      </main>
      <NavegacaoInferior caminho={caminho} />
    </>
  );
}

const ITENS = [
  { href: "/", rotulo: "Início", Icone: IconeInicio },
  { href: "/explorar", rotulo: "Explorar", Icone: IconeExplorar },
  { href: "/roteiros", rotulo: "Roteiros", Icone: IconeRoteiros },
  { href: "/chat", rotulo: "Guia", Icone: IconeGuia },
];

/**
 * A barra de baixo, só no celular.
 *
 * Quatro destinos, que é o que cabe sem virar menu. No computador ela some:
 * lá o menu do cabeçalho dá conta, e uma barra fixa no rodapé de tela grande
 * só rouba altura.
 */
function NavegacaoInferior({ caminho }: { caminho: string }) {
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
