import { createClient } from "@/lib/supabase/server";
import type { LocalDoDono } from "@/components/painel/FormularioEvento";
import { planoAtivo, podeUsar, type Modulo } from "@/lib/planos";

/**
 * Os locais que aparecem no seletor "onde vai ser" do evento.
 *
 * O dono escolhe entre os estabelecimentos dele; a administracao escolhe entre
 * todos os publicados, porque e ela quem cadastra os eventos da cidade que
 * acontecem em praca, no Nucleo de Casas Enxaimel e afins.
 *
 * Eventos e promocoes pertencem a um plano. Do dono, so entram os lugares
 * cujo plano libera o modulo pedido; "bloqueado" avisa a tela quando ele
 * tem estabelecimento mas nenhum com o plano, para ela mostrar o convite
 * em vez de um formulario que o banco recusaria.
 *
 * "paraEditar" devolve todos os lugares do dono, com ou sem plano: quem
 * ja tem um evento no ar precisa conseguir corrigi-lo mesmo depois de o
 * plano vencer. O que o plano fecha e criar, nao consertar.
 */
export async function locaisParaEvento(
  modulo: Modulo = "eventos",
  paraEditar = false,
): Promise<{
  locais: LocalDoDono[];
  admin: boolean;
  bloqueado: boolean;
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

  let consulta = supabase
    .from("locais")
    .select("id, nome, plano, plano_ate")
    .order("nome");
  if (admin) consulta = consulta.eq("status", "publicado");
  else consulta = consulta.eq("dono_id", user?.id ?? "");

  const { data } = await consulta;
  const todos = data ?? [];

  const liberados =
    admin || paraEditar
      ? todos
      : todos.filter((l) => podeUsar(modulo, planoAtivo(l.plano, l.plano_ate)));

  return {
    locais: liberados.map((l) => ({ id: l.id, nome: l.nome })),
    admin,
    bloqueado: !admin && liberados.length === 0,
  };
}
