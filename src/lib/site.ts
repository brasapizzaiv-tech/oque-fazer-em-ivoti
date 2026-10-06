/**
 * O endereco do guia, em um lugar so.
 *
 * Era uma variavel de ambiente na Vercel, digitada a mao. Em 16/09/2026 ela
 * ficou com o nome antigo do site (oquefazeremivoti.com.br), um dominio que
 * nem existe — e como e ela que monta os enderecos absolutos, o estrago saiu
 * silencioso: a imagem de compartilhamento apontava para o vazio, e os
 * roteiros que os visitantes salvavam e mandavam no WhatsApp viravam links
 * mortos. O site respondia normalmente o tempo todo.
 *
 * O dominio agora e registrado e definitivo, entao ele mora aqui: uma
 * constante que muda junto com o codigo, passa pela revisao e nao depende de
 * ninguem acertar a digitacao num painel.
 *
 * Endereco absoluto e sempre o de producao, mesmo rodando aqui no
 * computador. E o certo para o que ele serve: o que o buscador guarda como
 * endereco oficial da pagina e o link que a pessoa manda para alguem.
 */
export const SITE = "https://oguiaivoti.com.br";

/** O mesmo endereco sem o "https://", para mostrar na tela. */
export const SITE_LIMPO = SITE.replace(/^https?:\/\//, "");

/**
 * Os endereços em que uma visita conta como visita.
 *
 * O site de desenvolvimento gravava na MESMA tabela de métricas da
 * produção. Cada tela que eu abria para conferir largura ou contraste
 * virava um acesso no painel do comerciante — e as varreduras automáticas
 * abrem dezenas de uma vez. Em 06/10/2026 o painel mostrava 571 acessos
 * em três dias, quase todos de uma página só.
 *
 * Isto não é pedantismo de número: o comerciante paga para ver estes
 * dados, e um número inflado é uma promessa que o site não cumpre.
 *
 * Lista fechada em vez de "tudo menos localhost": publicação de teste da
 * Vercel tem endereço parecido com o de produção, e uma regra por
 * semelhança deixaria passar justamente o caso difícil.
 */
export const HOSTS_QUE_CONTAM = [
  "oguiaivoti.com.br",
  "www.oguiaivoti.com.br",
  "oquefazeremivoti.com.br",
  "www.oquefazeremivoti.com.br",
  "oque-fazer-em-ivoti.vercel.app",
];

/** Se a visita a este endereço entra na conta. */
export function contaAcesso(host: string | null): boolean {
  if (!host) return false;
  return HOSTS_QUE_CONTAM.includes(host.toLowerCase().split(":")[0]);
}
