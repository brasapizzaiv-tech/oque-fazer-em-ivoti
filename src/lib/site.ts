/**
 * O endereco do guia, em um lugar so.
 *
 * Era uma variavel de ambiente na Vercel, digitada a mao. Em 16/09/2026 ela
 * ficou apontando para um dominio que nem existia — e como e ela que monta
 * os enderecos absolutos, o estrago saiu silencioso: a imagem de
 * compartilhamento apontava para o vazio, e os roteiros que os visitantes
 * salvavam e mandavam no WhatsApp viravam links mortos. O site respondia
 * normalmente o tempo todo.
 *
 * Por isso mora aqui: uma constante que muda junto com o codigo, passa pela
 * revisao e nao depende de ninguem acertar a digitacao num painel.
 *
 * Em 06/10/2026 passou a ser oquefazeremivoti.com.br, que e o nome do site
 * letra por letra e a frase que as pessoas digitam na busca. O
 * oguiaivoti.com.br continua registrado e redireciona para ca com 308 —
 * e o 308, e nao o 307, que faz o buscador transferir para o endereco novo
 * a posicao que o antigo tinha. Tudo o que ja foi compartilhado continua
 * chegando.
 *
 * Endereco absoluto e sempre o de producao, mesmo rodando aqui no
 * computador. E o certo para o que ele serve: o que o buscador guarda como
 * endereco oficial da pagina e o link que a pessoa manda para alguem.
 */
export const SITE = "https://oquefazeremivoti.com.br";

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
