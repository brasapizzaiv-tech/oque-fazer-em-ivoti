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
  await pedir({ local });
}

/**
 * O mesmo, para um evento: avisa a administracao que chegou um para
 * conferir, e avisa quem cadastrou quando ele e publicado ou devolvido.
 *
 * Antes so os lugares avisavam. A tela do evento prometia "uma conferida
 * rapida", mas ninguem ficava sabendo que havia o que conferir.
 */
export async function pedirAvisoDoEvento(evento: string): Promise<void> {
  await pedir({ evento });
}

async function pedir(corpo: { local?: string; evento?: string }) {
  try {
    await fetch("/api/avisar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(corpo),
      keepalive: true,
    });
  } catch {
    // avisar e bonus; o que importa ja foi gravado
  }
}
