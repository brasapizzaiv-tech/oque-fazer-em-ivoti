import { createClient } from "@/lib/supabase/server";
import type { LocalDoDono } from "@/components/painel/FormularioEvento";

/**
 * Os locais que aparecem no seletor "onde vai ser" do evento.
 *
 * O dono escolhe entre os estabelecimentos dele; a administracao escolhe entre
 * todos os publicados, porque e ela quem cadastra os eventos da cidade que
 * acontecem em praca, no Nucleo de Casas Enxaimel e afins.
 */
export async function locaisParaEvento(): Promise<{
  locais: LocalDoDono[];
  admin: boolean;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("perfis")
    .select("papel")
    .eq("id", user?.id ?? "")
    .maybeSingle();
  const admin = perfil?.papel === "admin";

  let consulta = supabase.from("locais").select("id, nome").order("nome");
  if (admin) consulta = consulta.eq("status", "publicado");
  else consulta = consulta.eq("dono_id", user?.id ?? "");

  const { data } = await consulta;
  return { locais: (data ?? []) as LocalDoDono[], admin };
}
