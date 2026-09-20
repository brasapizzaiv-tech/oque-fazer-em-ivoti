"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import CabecalhoAntigo from "@/components/Cabecalho";
import CabecalhoDesktop from "./CabecalhoDesktop";
import RodapeAntigo from "@/components/Rodape";
import BotaoChat from "@/components/BotaoChat";
import { IconeExplorar, IconeGuia, IconeInicio, IconeRoteiros } from "./icones";

/**
 * A casca do site durante a migração.
 *
 * O redesenho troca as telas uma a uma, e as duas linguagens precisam
 * conviver até a última virar. O problema é que a casca antiga mora no layout
 * raiz: sem isto, uma tela nova aparecia com dois cabeçalhos, o dela e o
 * velho por cima.
 *
 * Então a regra é uma lista: rota migrada recebe a navegação de baixo do
 * desenho novo; rota ainda antiga continua com o cabeçalho, o rodapé e o
 * botão flutuante de sempre. A lista encolhe a cada tela migrada e o arquivo
 * inteiro some quando ela esvaziar.
 */
// Comeca com barra e nao termina: "/local" cobre /local/qualquer-coisa.
const MIGRADAS = [
  "/",
  "/explorar",
  "/chat",
  "/agenda",
  "/mapa",
  "/entrar",
  "/cadastrar",
  "/recuperar-senha",
  "/nova-senha",
];
const PREFIXOS_MIGRADOS = ["/local/", "/roteiros"];

/**
 * As areas que trazem a propria casca inteira.
 *
 * O painel e a administracao tem cabecalho, abas e largura proprios. Recebiam
 * o cabecalho do site por cima disso, e a barra de baixo com "Explorar" e
 * "Roteiros" por baixo — navegacao de quem passeia, empilhada na tela de quem
 * esta editando o proprio cadastro.
 */
const CASCA_PROPRIA = ["/painel", "/admin"];

export default function Casca({ children }: { children: React.ReactNode }) {
  const caminho = usePathname();

  if (CASCA_PROPRIA.some((p) => caminho === p || caminho.startsWith(p + "/")))
    return <main className="flex-1">{children}</main>;

  const nova =
    MIGRADAS.includes(caminho) ||
    PREFIXOS_MIGRADOS.some((p) => caminho.startsWith(p));

  if (!nova) {
    return (
      <>
        <CabecalhoAntigo />
        <main className="flex-1">{children}</main>
        <RodapeAntigo />
        <BotaoChat />
      </>
    );
  }

  return (
    <>
      {/* O espaço embaixo é do tamanho da barra: sem ele o último bloco da
          página fica escondido atrás dela. */}
      {/* O fundo vai aqui e nao so na pagina: o body ainda pinta o creme
          da paleta antiga, e ele aparecia abaixo do conteudo quando a pagina
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
