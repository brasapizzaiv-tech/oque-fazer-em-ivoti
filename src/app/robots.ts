import type { MetadataRoute } from "next";

const SITE =
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://oguiaivoti.com.br";

/**
 * O que os buscadores podem varrer.
 *
 * O guia inteiro e publico e queremos que seja encontrado. O que fica de
 * fora nao e segredo — quem nao esta logado ja nao ve nada nessas telas —
 * mas sao paginas que nao respondem a nenhuma busca: o robo gastaria o
 * tempo dele ali em vez de nos estabelecimentos, e uma tela de login
 * poderia acabar aparecendo no Google no lugar do lugar certo.
 *
 * Os roteiros salvos por visitantes (/roteiro/<token>) tambem ficam de
 * fora: o token e um endereco sorteado que faz o papel de senha, e um
 * passeio guardado por alguem nao e assunto de busca.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/painel", "/admin", "/api/", "/auth/", "/roteiro/", "/entrar"],
    },
    sitemap: `${SITE}/sitemap.xml`,
    host: SITE,
  };
}
