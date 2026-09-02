// Configuracao PUBLICA do Supabase (URL + chave anon).
//
// Estes dois valores sao publicos por design: o Supabase os manda para o
// navegador de todo visitante, e a seguranca fica por conta das regras de
// acesso (RLS) no banco.
//
// A chave SECRETA (service_role) NAO fica aqui — vem de variavel de ambiente
// (SUPABASE_SERVICE_ROLE_KEY) e so e usada no servidor.
export const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
export const SUPABASE_ANON_KEY =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "";

export const SUPABASE_CONFIGURADO = Boolean(SUPABASE_URL && SUPABASE_ANON_KEY);
