import { SITE } from "@/lib/site";
import type { Metadata, Viewport } from "next";
import { Bricolage_Grotesque, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import Cabecalho from "@/components/Cabecalho";
import CompletarLogin from "@/components/CompletarLogin";
import ContarAcesso from "@/components/ContarAcesso";
import FaixaDemonstracao from "@/components/FaixaDemonstracao";
import Rodape from "@/components/Rodape";
import BotaoChat from "@/components/BotaoChat";

// Bricolage Grotesque tem letras construidas, quase de placa pintada de
// comercio — e larguras variaveis, que combinam com os montantes do enxaimel.
// Saiu no lugar da Outfit, que e correta e nao diz nada.
const titulo = Bricolage_Grotesque({
  variable: "--fonte-titulo",
  subsets: ["latin"],
  display: "swap",
});

// IBM Plex Sans no lugar da Inter: tem um ar de coisa desenhada para durar,
// e segura bem o tamanho pequeno lido no sol, de pe na calcada.
const corpo = IBM_Plex_Sans({
  variable: "--fonte-corpo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "O Guia de Ivoti",
    template: "%s · O Guia de Ivoti",
  },
  description:
    "O guia de Ivoti: onde comer, beber, passear, se hospedar e o que está acontecendo hoje na cidade.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "O Guia de Ivoti",
  },
};

export const viewport: Viewport = {
  themeColor: "#147a59",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${titulo.variable} ${corpo.variable} h-full`}
    >
      <body className="flex min-h-full flex-col font-sans">
        {/* Rede de seguranca do link de confirmacao de e-mail: se ele cair
            numa pagina qualquer em vez de /auth/callback, o login e concluido
            do mesmo jeito. Nao desenha nada. */}
        <Suspense>
          <CompletarLogin />
        </Suspense>
        {/* Conta o acesso de toda pagina, para o painel geral do admin. A
            pagina de um estabelecimento monta outro destes com o local, que
            e o numero que o comerciante ve. */}
        <Suspense>
          <ContarAcesso />
        </Suspense>
        <FaixaDemonstracao />
        <Cabecalho />
        <main className="flex-1">{children}</main>
        <Rodape />
        <BotaoChat />
      </body>
    </html>
  );
}
