/**
 * O preço que a pessoa digitou, em número.
 *
 * Aceita do jeito que brasileiro escreve: "45,90", "R$ 45,90", "1.234,50",
 * "45" e também "45.90". Antes a tela só trocava a vírgula por ponto, e
 * "R$ 45,90" ou "1.234,50" viravam "sem preço" sem avisar ninguém.
 *
 * Devolve `null` para campo vazio (preço é opcional) e `undefined` quando
 * há texto mas não dá para entender — para a tela poder avisar em vez de
 * gravar vazio calada.
 */
export function precoDigitado(texto: string): number | null | undefined {
  const limpo = texto.replace(/r\$/i, "").replace(/\s/g, "");
  if (!limpo) return null;

  // Com vírgula, ela é o decimal e os pontos são de milhar ("1.234,50").
  // Sem vírgula, um ponto seguido de três dígitos é milhar ("1.234"); nos
  // outros casos é decimal ("45.90").
  const normal = limpo.includes(",")
    ? limpo.replaceAll(".", "").replace(",", ".")
    : /^\d{1,3}(\.\d{3})+$/.test(limpo)
      ? limpo.replaceAll(".", "")
      : limpo;

  if (!/^\d+(\.\d{1,2})?$/.test(normal)) return undefined;
  return Number(normal);
}
