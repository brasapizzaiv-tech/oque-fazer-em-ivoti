import { SUPABASE_CONFIGURADO } from "@/lib/supabase/config";

/**
 * Aviso honesto no topo enquanto o site roda sem banco: os lugares sao
 * ficticios. Some sozinho assim que o Supabase for configurado.
 */
export default function FaixaDemonstracao() {
  if (SUPABASE_CONFIGURADO) return null;

  const semChat = !process.env.ANTHROPIC_API_KEY;

  return (
    <div className="bg-sol-500 px-4 py-2 text-center text-xs font-medium text-white">
      Modo demonstração — os lugares aqui são inventados só para você ver como
      o site fica
      {semChat && ", e o guia responde com frases prontas (o de verdade usa IA)"}
      .
    </div>
  );
}
