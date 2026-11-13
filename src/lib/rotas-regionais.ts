// ============================================================
// As rotas e regiões de que Ivoti faz parte
// ============================================================
// Um lugar só para o texto e os endereços: a capa mostra os cartões e o
// Guia responde com as mesmas frases. Se uma rota mudar de site ou de
// número de cidades, muda aqui e os dois acompanham.
//
// Os fatos vieram das páginas oficiais, lidas em 13/11/2026:
//   - valegermanicors.com.br ("uma das 28 regiões do Rio Grande do Sul",
//     14 cidades, "Berço da Colonização Alemã no Brasil")
//   - rotaromantica.com.br (14 municípios, inspirada na Romantische
//     Strasse, da Alemanha)
// ============================================================

export type RotaRegional = {
  nome: string;
  /** Uma ou duas frases, para quem nunca ouviu falar. */
  texto: string;
  /** A página de Ivoti no site oficial da rota. */
  link: string;
  /** O que o link diz. */
  rotulo: string;
  /** O endereço curto, para o Guia citar por escrito. */
  site: string;
};

export const ROTAS_REGIONAIS: RotaRegional[] = [
  {
    nome: "Vale Germânico",
    texto:
      "Catorze cidades ao pé da Serra gaúcha, de São Leopoldo e Novo Hamburgo a Santa Maria do Herval, com a mesma origem: é o berço da colonização alemã no Brasil.",
    link: "https://valegermanicors.com.br/cidade-ivoti/",
    rotulo: "Ivoti no Vale Germânico",
    site: "valegermanicors.com.br",
  },
  {
    nome: "Rota Romântica",
    texto:
      "Roteiro por catorze municípios de colonização alemã, de São Leopoldo a São Francisco de Paula, passando por Nova Petrópolis, Gramado e Canela. Foi inspirado na Romantische Strasse, da Alemanha.",
    link: "https://rotaromantica.com.br/pt_BR/municipio/ivoti",
    rotulo: "Ivoti na Rota Romântica",
    site: "rotaromantica.com.br",
  },
];

/** O mesmo conteúdo, escrito para o Guia ler. */
export const ROTAS_PARA_O_GUIA = `IVOTI NA REGIAO
Ivoti faz parte de duas rotas turisticas. Quando perguntarem por elas, ou pelo que ha nas cidades vizinhas, explique em uma ou duas frases e informe o site, por escrito. Voce so conhece os lugares de Ivoti: nao indique estabelecimentos de outras cidades.
${ROTAS_REGIONAIS.map((r) => `- ${r.nome}: ${r.texto} Site: ${r.site}`).join("\n")}`;
