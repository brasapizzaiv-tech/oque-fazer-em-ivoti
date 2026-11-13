// ============================================================
// O erro do banco, dito para gente
// ============================================================
// O banco responde em inglês técnico ("duplicate key value violates
// unique constraint..."). Quem lê é o dono de um comércio com o celular
// na mão: a frase não o ajuda a resolver, só o convence de que quebrou.
//
// Toda tela do painel e da administração passa o erro por aqui antes de
// mostrar. O texto original vai para o console, onde serve a quem conserta.
// ============================================================

type ErroDoBanco = { code?: string; message?: string } | null | undefined;

/**
 * A frase que vai para a tela.
 *
 * `padrao` é o que dizer quando o erro não é de nenhum tipo conhecido — e
 * deve dizer o que não deu certo naquela tela ("Não consegui salvar os
 * horários.").
 */
export function explicarErro(erro: ErroDoBanco, padrao: string): string {
  console.error(padrao, erro);

  const codigo = erro?.code ?? "";
  const texto = erro?.message ?? "";

  // Sessão vencida: o token expirou no meio da edição.
  if (codigo === "PGRST301" || /jwt|token.*expired/i.test(texto)) {
    return "Sua sessão terminou. Entre de novo e repita o que estava fazendo.";
  }

  // Recusa das regras de acesso: a conta não pode fazer aquilo.
  if (codigo === "42501" || /row-level security|permission denied/i.test(texto)) {
    return "Sua conta não tem permissão para isso. Se achar que deveria ter, fale com a gente.";
  }

  // Valor repetido onde só cabe um.
  if (codigo === "23505") {
    return "Já existe um cadastro igual a esse.";
  }

  if (/network|failed to fetch|fetch failed|load failed/i.test(texto)) {
    return "Não consegui falar com o servidor. Confira a internet e tente de novo.";
  }

  return padrao;
}

/** O recado para quando o banco aceitou o pedido mas não mudou linha nenhuma. */
export const SESSAO_TERMINOU =
  "Não consegui salvar: sua sessão terminou. Entre de novo e repita.";
