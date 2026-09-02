import type { Metadata, Viewport } from "next";
import { Outfit, Inter } from "next/font/google";
import "./globals.css";
import Cabecalho from "@/components/Cabecalho";
import Rodape from "@/components/Rodape";
import BotaoChat from "@/components/BotaoChat";

const titulo = Outfit({
  variable: "--fonte-titulo",
  subsets: ["latin"],
  display: "swap",
});

const corpo = Inter({
  variable: "--fonte-corpo",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://oquefazeremivoti.com.br",
  ),
  title: {
    default: "O que fazer em Ivoti",
    template: "%s · O que fazer em Ivoti",
  },
  description:
    "O guia de Ivoti: onde comer, beber, passear, se hospedar e o que está acontecendo hoje na cidade.",
  openGraph: {
    type: "website",
    locale: "pt_BR",
    siteName: "O que fazer em Ivoti",
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
        <Cabecalho />
        <main className="flex-1">{children}</main>
        <Rodape />
        <BotaoChat />
      </body>
    </html>
  );
}
