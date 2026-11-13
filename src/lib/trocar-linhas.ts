import type { SupabaseClient } from "@supabase/supabase-js";
import { explicarErro, SESSAO_TERMINOU } from "./erro-do-banco";

/**
 * Troca todas as linhas de um lugar numa tabela pelas novas (horários,
 * itens do cardápio).
 *
 * A ordem é: guardar quais são as antigas, gravar as novas, e só então
 * apagar as antigas. O caminho curto — apagar tudo e inserir — perdia os
 * dados quando a segunda metade falhava: o comerciante ficava sem horário
 * nenhum no site, e a tela dizia "Salvo".
 *
 * Devolve a frase de erro para mostrar, ou `null` quando deu certo.
 */
export async function trocarLinhas(
  supabase: SupabaseClient,
  tabela: "locais_horarios" | "locais_itens",
  localId: string,
  novas: Record<string, unknown>[],
): Promise<string | null> {
  const padrao = "Não consegui salvar. Nada foi alterado; tente de novo.";

  // Sem sessão o banco não dá erro em nada disto: só devolve vazio e não
  // grava. Conferir aqui evita o "Salvo" de mentira.
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return SESSAO_TERMINOU;

  const { data: antigas, error: erroLer } = await supabase
    .from(tabela)
    .select("id")
    .eq("local_id", localId);
  if (erroLer) return explicarErro(erroLer, padrao);

  if (novas.length > 0) {
    const { error } = await supabase.from(tabela).insert(novas);
    if (error) return explicarErro(error, padrao);
  }

  const ids = (antigas ?? []).map((a) => a.id as string);
  if (ids.length > 0) {
    const { error } = await supabase.from(tabela).delete().in("id", ids);
    if (error) {
      return explicarErro(
        error,
        "Salvei o novo, mas não consegui tirar o antigo. Recarregue a página e confira.",
      );
    }
  }

  return null;
}
