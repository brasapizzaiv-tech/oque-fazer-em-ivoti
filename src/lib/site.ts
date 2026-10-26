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
];
// O oque-fazer-em-ivoti.vercel.app saiu desta lista em 26/10/2026: ele
// agora desvia para o dominio antes de a pagina carregar, entao nenhuma
// visita chega a ser contada por la.

/** Se a visita a este endereço entra na conta. */
export function contaAcesso(host: string | null): boolean {
  if (!host) return false;
  return HOSTS_QUE_CONTAM.includes(host.toLowerCase().split(":")[0]);
}

/**
 * As páginas que NÃO são visita ao guia.
 *
 * O painel e a administração são trabalho, não passeio: quem abre essas
 * telas é o dono do site e os comerciantes mexendo no próprio cadastro.
 * Em 06/10/2026, de 40 acessos registrados num dia, 11 eram uma pessoa só
 * trabalhando — e o número existe justamente para dizer quanta gente de
 * fora chegou.
 *
 * As telas de entrar e de trocar senha entram na lista pelo mesmo motivo:
 * são o corredor até o painel, não um destino.
 *
 * O /cadastrar FICA de fora da lista, ou seja, continua contando: é uma
 * página pública, está no mapa do site, e um comerciante que a encontra
 * sozinho é exatamente a notícia que o número deveria dar.
 */
export const PAGINAS_QUE_NAO_CONTAM = [
  "/painel",
  "/admin",
  "/entrar",
  "/recuperar-senha",
  "/nova-senha",
  "/auth",
  "/componentes",
];

/** Se a visita a esta página entra na conta. */
export function contaPagina(caminho: string | null | undefined): boolean {
  if (!caminho) return false;
  return !PAGINAS_QUE_NAO_CONTAM.some(
    (p) => caminho === p || caminho.startsWith(p + "/"),
  );
}

/**
 * O endereço oficial de uma página, para o buscador.
 *
 * O site responde em mais de um endereço: o domínio próprio, o
 * oque-fazer-em-ivoti.vercel.app que a Vercel dá a todo projeto, e as
 * variações do Explorar com filtro na barra (?categoria=, ?promocao=).
 * Para o Google, cada um desses é uma página diferente com o mesmo
 * conteúdo — e em 23/10/2026 ele avisou por e-mail que deixou de indexar
 * páginas por isso: "cópia sem página canônica selecionada pelo usuário".
 *
 * Esta marca é a resposta: ela diz, dentro da própria página, qual é o
 * endereço de verdade. O caminho vai relativo de propósito; quem monta o
 * endereço completo é o `metadataBase` do layout, que sai de SITE. Assim
 * não existe a chance de alguém escrever o domínio errado à mão.
 */
export function enderecoOficial(caminho: string): { canonical: string } {
  return { canonical: caminho };
}
