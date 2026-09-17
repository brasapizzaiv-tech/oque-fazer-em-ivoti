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
