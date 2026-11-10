/**
 * Pede ao servidor que avise quem precisa saber.
 *
 * Nao diz O QUE aconteceu, so de qual lugar se trata: quem le a situacao
 * no banco e decide o aviso e a rota, porque navegador nao tem como
 * provar que um cadastro foi aprovado.
 *
 * Nunca lanca e ninguem espera a resposta com ansiedade: o aviso e um
 * bonus. Se ele falhar, o cadastro mudou de situacao do mesmo jeito, e
 * e isso que importa para quem apertou o botao.
 */
export async function pedirAviso(local: string): Promise<void> {
  try {
    await fetch("/api/avisar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ local }),
      keepalive: true,
    });
  } catch {
    // avisar e bonus; o que importa ja foi gravado
  }
}
