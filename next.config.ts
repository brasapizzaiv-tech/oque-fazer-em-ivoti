import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Não anuncia "feito com Next.js" em toda resposta: não ajuda o visitante
  // e poupa a quem procura versão vulnerável o trabalho de descobrir.
  poweredByHeader: false,

  images: {
    // Fotos dos estabelecimentos ficam no Storage do Supabase.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
    // Foto trocada ganha caminho novo, então a versão otimizada pode ficar
    // guardada 30 dias (o padrão rebuscava no Storage a cada hora).
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },

  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // O navegador obedece ao tipo que o servidor declarou, em vez de
          // adivinhar pelo conteúdo: um arquivo enviado com cara de imagem
          // não é executado como página.
          { key: "X-Content-Type-Options", value: "nosniff" },
          // O guia não pode ser aberto dentro de outro site, onde um botão
          // invisível por cima faria a pessoa clicar no que não vê.
          { key: "X-Frame-Options", value: "SAMEORIGIN" },
          // Ao sair do guia por um link, o outro site fica sabendo de onde
          // a pessoa veio, mas não em qual página ela estava.
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // O guia usa a localização ("perto de mim") e mais nada do
          // aparelho; vídeo embutido não ganha câmera nem microfone.
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=(self)",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
