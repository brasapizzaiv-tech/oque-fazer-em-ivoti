import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Fotos dos estabelecimentos ficam no Storage do Supabase.
    remotePatterns: [{ protocol: "https", hostname: "*.supabase.co" }],
  },
};

export default nextConfig;
