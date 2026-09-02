import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL } from "./config";

// Cliente administrativo (service_role) — SOMENTE no servidor.
// Ignora as regras de acesso (RLS). Usado pelo chat (que precisa ler todos os
// locais publicados sem sessao) e por rotinas de manutencao.
export function createAdminClient() {
  return createClient(SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
