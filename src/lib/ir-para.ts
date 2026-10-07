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
