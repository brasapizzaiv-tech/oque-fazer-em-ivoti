/**
 * A ficha do lugar, no formato que o buscador lê.
 *
 * Não desenha nada: é um bloco de dados dentro da página, invisível para
 * quem visita. Vai no corpo e não no cabeçalho de propósito — o Google
 * aceita nos dois, e aqui ele fica junto do conteúdo que descreve.
 *
 * `JSON.stringify` com um tratamento no "<": sem isso, um nome de lugar
 * que contivesse "</script>" fecharia a etiqueta no meio e o resto da
 * ficha viraria HTML solto na página. Nenhum lugar de Ivoti se chama
 * assim, mas quem cadastra é gente e o campo é livre.
 */
export default function Ficha({ dados }: { dados: object | null }) {
  if (!dados) return null;

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(dados).replace(/</g, "\u003c"),
      }}
    />
  );
}
