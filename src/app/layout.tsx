import { NOME_DO_SITE } from "@/lib/marca";
import { SITE } from "@/lib/site";
import type { Metadata, Viewport } from "next";
import { DM_Sans, Fraunces } from "next/font/google";
import "./globals.css";
import { Suspense } from "react";
import CompletarLogin from "@/components/CompletarLogin";
import Casca from "@/components/vidro/Casca";
import { RoupaDaFeira } from "@/components/vidro/Feira";
import { temaAtivo } from "@/lib/temas";
import ContarAcesso from "@/components/ContarAcesso";
import FaixaDemonstracao from "@/components/FaixaDemonstracao";

// As duas fontes do site. Bricolage e IBM Plex sairam junto com a ultima
// tela de madeira: enquanto elas estavam carregadas, o navegador baixava
// quatro familias para usar duas.
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
  // A cor que o navegador do celular pinta na propria barra. Ficou no verde
  // da paleta antiga depois dos dois redesenhos: a barra do iPhone saia
  // verde por cima de um site que nao tem mais verde nenhum.
  themeColor: "#FAF7F1",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // A feira que estiver valendo hoje. Fora de feira volta nada, e o site
  // continua no desenho de sempre.
  const feira = await temaAtivo();

  return (
    <html
      lang="pt-BR"
      className={`${tituloNovo.variable} ${corpoNovo.variable} h-full`}
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
        <RoupaDaFeira tema={feira}>
          <Casca>{children}</Casca>
        </RoupaDaFeira>
      </body>
    </html>
  );
}
