import { createServerClient } from "@supabase/ssr";
import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "./config";

// Cliente do Supabase para uso no servidor (Server Components, Route Handlers,
// Server Actions). Le e escreve a sessao nos cookies.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Chamado de um Server Component — pode ignorar, o proxy.ts ja
          // atualiza a sessao a cada requisicao.
        }
      },
    },
  });
}

/**
 * Cliente sem cookie, para dado público.
 *
 * O cliente de cima lê a sessão nos cookies, e ler cookie obriga o Next a
 * gerar a página a cada visita. Para o que é igual para todo mundo — o
 * tema da feira que está valendo hoje — isso custaria uma consulta por
 * acesso e tiraria o site inteiro do cache.
 *
 * As regras de acesso continuam valendo: esta chave é a pública, e só
 * enxerga o que a política do banco libera para quem não entrou.
 */
export function createClientPublico() {
  return createSupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
