import { NOME_DO_SITE } from "@/lib/marca";
import { SITE } from "@/lib/site";
import type { Metadata, Viewport } from "next";
import {
  Bricolage_Grotesque,
  DM_Sans,
  Fraunces,
  IBM_Plex_Sans,
} from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import CompletarLogin from "@/components/CompletarLogin";
import Casca from "@/components/enxaimel/Casca";
import ContarAcesso from "@/components/ContarAcesso";
import FaixaDemonstracao from "@/components/FaixaDemonstracao";

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

// As fontes do redesenho. Entram no layout raiz porque as telas novas ja
// comecam a substituir as antigas — enquanto a migracao nao termina, as
// quatro convivem. As duas de cima saem junto com a ultima tela antiga.
const tituloNovo = Fraunces({
  variable: "--fonte-titulo-nova",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

const corpoNovo = DM_Sans({
  variable: "--fonte-corpo-nova",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: NOME_DO_SITE,
    template: `%s · ${NOME_DO_SITE}`,
  },
  description:
    "O guia de Ivoti: onde comer, beber, passear, se hospedar e o que está acontecendo hoje na cidade.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: NOME_DO_SITE,
  },
};

export const viewport: Viewport = {
  themeColor: "#147a59",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${titulo.variable} ${corpo.variable} ${tituloNovo.variable} ${corpoNovo.variable} h-full`}
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
        <Casca>{children}</Casca>
      </body>
    </html>
  );
}
