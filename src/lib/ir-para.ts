/**
 * Leva para outra tela recarregando o site inteiro.
 *
 * Só para os quatro momentos em que muda QUEM está logado: entrar,
 * cadastrar, confirmar o e-mail e sair.
 *
 * Nesses momentos a navegação leve do Next — a que troca só o miolo da
 * página, sem recarregar — não completa: a tela fica parada, sem erro
 * nenhum, e só anda quando a pessoa recarrega na mão. Era exatamente isso
 * que acontecia no Entrar.
 *
 * Recarregar tudo custa alguns décimos de segundo e acontece uma vez por
 * sessão. É um preço pequeno por uma tela que abre.
 */
export function irParaRecarregando(destino: string) {
  window.location.assign(destino);
}

/** Só existe para conferir a origem; nenhum pedido vai para este endereço. */
const ORIGEM_DE_CONFERENCIA = "https://interno.invalid";

/**
 * O endereço de volta que veio pela URL, se ele for mesmo deste site.
 *
 * `/entrar?voltar=…` e `/auth/callback?next=…` dizem para onde a pessoa vai
 * depois de entrar. Como qualquer um monta um link desses, o valor só vale
 * se apontar para dentro do guia; senão um link preparado mandaria quem
 * acabou de digitar a senha para uma página de golpe com a nossa cara.
 *
 * Conferir só o começo ("/" e não "//") não basta: o navegador trata a
 * barra invertida como barra, então "/\\outro-site.com" passa nesse teste
 * e sai do site. Por isso o valor é resolvido como o navegador resolveria,
 * e só serve se a origem não mudou.
 */
export function caminhoInterno(
  pedido: string | null | undefined,
  padrao = "/painel",
): string {
  if (!pedido || !pedido.startsWith("/")) return padrao;

  // Barra invertida e caracteres de controle não têm lugar num caminho
  // nosso, e são a matéria-prima de todos os truques conhecidos.
  for (const letra of pedido) {
    if (letra === "\\" || letra.charCodeAt(0) < 32) return padrao;
  }

  try {
    const url = new URL(pedido, ORIGEM_DE_CONFERENCIA);
    if (url.origin !== ORIGEM_DE_CONFERENCIA) return padrao;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return padrao;
  }
}
