import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Fotos dos estabelecimentos ficam no Storage do Supabase.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
    // Foto trocada ganha caminho novo, então a versão otimizada pode ficar
    // guardada 30 dias (o padrão rebuscava no Storage a cada hora).
    minimumCacheTTL: 60 * 60 * 24 * 30,
  },
};

export default nextConfig;
