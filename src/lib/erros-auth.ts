/**
 * Traduz os erros de login e cadastro para portugues de gente.
 *
 * O Supabase responde em ingles tecnico ("email rate limit exceeded"). Quem
 * esta do outro lado e o dono de uma pizzaria tentando cadastrar o negocio:
 * ele nao vai pesquisar o que a frase quer dizer, vai fechar a aba.
 *
 * Cada mensagem aqui diz o que aconteceu E o que fazer a seguir.
 */
const TRADUCOES: [RegExp, string][] = [
  [
    /already registered|already been registered|user already exists/i,
    "Esse e-mail já tem conta. Tente entrar em vez de cadastrar.",
  ],
  [
    /invalid login|invalid credentials/i,
    "E-mail ou senha não conferem. Confira e tente de novo.",
  ],
  [
    /email not confirmed/i,
    "Falta confirmar seu e-mail. Veja a caixa de entrada (e o lixo eletrônico).",
  ],
  [
    /email rate limit exceeded|over_email_send_rate_limit/i,
    "O envio de e-mails atingiu o limite por agora. Espere alguns minutos e tente de novo.",
  ],
  [
    /rate limit|too many requests/i,
    "Muitas tentativas seguidas. Espere um minuto e tente de novo.",
  ],
  [
    /password should be at least|password is too short/i,
    "A senha precisa ter pelo menos 8 caracteres.",
  ],
  [
    /weak password|password is too weak/i,
    "Essa senha é fácil demais. Misture letras e números.",
  ],
  [
    /invalid email|unable to validate email/i,
    "Esse e-mail não parece válido. Confira se não faltou alguma letra.",
  ],
  [
    /signups not allowed|signup is disabled/i,
    "O cadastro está fechado no momento. Fale com a gente pelo rodapé do site.",
  ],
  [
    /network|fetch failed|failed to fetch/i,
    "Não consegui falar com o servidor. Confira sua internet e tente de novo.",
  ],
];

export function erroEmPortugues(mensagem: string): string {
  for (const [padrao, texto] of TRADUCOES) {
    if (padrao.test(mensagem)) return texto;
  }
  // Sem traducao conhecida: melhor uma frase honesta do que ingles tecnico.
  console.error("Erro de autenticacao sem traducao:", mensagem);
  return "Não consegui concluir agora. Tente de novo em instantes.";
}
