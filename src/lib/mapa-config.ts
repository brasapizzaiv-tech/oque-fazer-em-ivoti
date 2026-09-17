/**
 * O identificador de estilo do mapa, criado por voce no console do Google.
 *
 * Sem ele o Google recusa os pinos personalizados (AdvancedMarker) e mostra
 * a caixa de erro "esta pagina nao carregou o Google Maps corretamente". Com
 * ele, os pinos viram os circulos verdes do guia com o emoji da categoria, e
 * o "voce esta aqui" vira a bolinha laranja.
 *
 * Fica no codigo, e nao numa variavel de ambiente, pelo mesmo motivo que o
 * endereco do site: e um valor fixo e publico (aparece no navegador de quem
 * visita), muda junto com o codigo, e digitado a mao num painel ele falha
 * calado — foi assim que o endereco antigo derrubou a imagem de
 * compartilhamento e os links de roteiro em 16/09/2026.
 *
 * Se um dia voce trocar de projeto no Google, troque aqui e na chave da API,
 * que precisam ser do mesmo projeto.
 *
 * O primeiro Map ID (14c49df2a3f5ef6c8e155db2) funcionava, mas foi criado
 * antes do console novo e nao dava para ligar um estilo nele. Este, chamado
 * "guia" e do tipo JavaScript, e o que carrega o estilo do guia.
 */
export const MAP_ID = "1ce77266e51221037820af24";

/** Com Map ID valido da para desenhar o pino do jeito do guia. */
export const PINO_MODERNO = MAP_ID.length > 0;
