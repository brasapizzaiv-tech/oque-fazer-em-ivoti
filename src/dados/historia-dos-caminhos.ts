import type { Selo } from "./centro-historico";

// ============================================================
// A história ao longo dos caminhos do interior
// ============================================================
// Escrito à mão, a partir do Inventário Arquitetônico do Patrimônio
// Cultural de Ivoti (2020-2021), que está na Biblioteca Pública Municipal:
// os arquivos "48Alta", "48Baixa", "Picada_Feijao" e o relatório geral.
//
// REGRAS DESTE ARQUIVO (as mesmas do passeio do centro histórico)
//
// 1. Só entra o que a ficha do inventário afirma. Onde ela hesita ("por
//    volta de", "não há data certa"), o texto hesita junto. Onde as fontes
//    dela se contradizem, o texto não escolhe um lado.
//
// 2. O inventário é de 2021. O que ele diz sobre o uso ATUAL de um prédio
//    vai sempre datado: "em 2021".
//
// 3. As fichas trazem nome, telefone e e-mail dos proprietários, e muitas
//    citam moradores pelo nome. Nada disso entra aqui, nem em comentário:
//    o repositório é público. Nome de gente, só de quem já é história
//    (o imigrante, o professor que deu nome à escola).
//
// 4. PARADA É PRÉDIO DE USO DA COMUNIDADE: armazém, escola, capela, casa
//    tombada com comércio. O inventário registrou dezenas de casas na beira
//    destes caminhos, quase todas moradia de família, e as fichas as chamam
//    pelo nome do dono. Elas NÃO viram parada, não ganham pino e não são
//    citadas pelo nome: guia turístico não manda gente para a porta de
//    ninguém. O texto de abertura diz que elas existem e o que observar
//    nelas da estrada, e para aí.
//
// 5. As coordenadas são as das fichas.
//
// O número entre parênteses em cada comentário é o da ficha no arquivo
// indicado, para quem for conferir.
// ============================================================

export type ParadaDoCaminho = {
  /** O pedaço do endereço da página que leva a esta parada. */
  ancora: string;
  nome: string;
  lat: number;
  lng: number;
  selos: Selo[];
  /** A história, em parágrafos curtos. */
  texto: string[];
  /** O que dá para ver sem sair da estrada. */
  olhe?: string;
};

export type HistoriaDoCaminho = {
  /** A história da picada, em parágrafos curtos. */
  abertura: string[];
  paradas: ParadaDoCaminho[];
};

// ---------- as paradas que servem a mais de um caminho ----------

// (48Alta, 023)
const ARMAZEM_FRITZEN: ParadaDoCaminho = {
  ancora: "armazem-fritzen",
  nome: "Armazém Fritzen",
  lat: -29.57628,
  lng: -51.15316,
  selos: ["enxaimel"],
  texto: [
    "Casa centenária em enxaimel, no entroncamento da Picada 48 Alta com a estrada que leva à Picada Feijão. Foi moradia, armazém e salão de baile: em dia de festa, os músicos tocavam numa galeria dentro do próprio armazém.",
    "Em meados do século XX o armazém comprava dos colonos grãos, ovos, aves, alho e cebola, levava tudo de caminhão a Porto Alegre e voltava com tecido, sal, açúcar e farinha de trigo. Na colheita, saía carga fechada só de cebola. No balcão se vendiam enxadas, pás, tamancos de madeira e a gasosa.",
    "Em 2021, quando o inventário foi feito, seguia como armazém e ponto de encontro dos moradores. Vale conferir se está aberto.",
  ],
  olhe: "o terreiro na frente, mais alto que a estrada e recuado 7 metros, onde os fregueses se reúnem; e a porta principal, de duas folhas de tamanhos diferentes, com entalhes.",
};

// (48Alta, 026)
const ESCOLINHA_RUI_BARBOSA: ParadaDoCaminho = {
  ancora: "escolinha-rui-barbosa",
  nome: "Escolinha Rui Barbosa",
  lat: -29.57567,
  lng: -51.15411,
  selos: [],
  texto: [
    "Prédio de pedra grês do século XIX, de uma sala só: 26 m². Era a escola da Picada 48 e recebia também crianças de Dois Irmãos e da Picada Feijão. Em 1871 um viajante inglês registrou meninos de sacola indo a pé para o colégio de Achtundvierzig, o Quarenta e Oito em alemão, sinal de que a escola da picada já existia.",
    "Quem estudou ali lembra de até 50 crianças na sala, sentadas em bancos compridos, e de um professor que chegava a cavalo. A escolinha foi desativada por volta de 1960, quando a picada ganhou uma escola maior.",
    "Em 2021 estava em ruínas. O inventário propõe restaurá-la como centro de convívio da comunidade.",
  ],
  olhe: "a fachada simétrica, com a porta no meio e uma janela de cada lado, e o óculo em triângulo no alto das paredes laterais.",
};

// ============================================================

export const HISTORIA_DOS_CAMINHOS: Record<string, HistoriaDoCaminho> = {
  "caminho-picada-48-alta": {
    abertura: [
      "A Picada 48, Achtundvierzig em alemão, é uma das linhas de colonização de Ivoti. A parte alta acompanha a estrada que leva a Dois Irmãos.",
      "O inventário do patrimônio do município, de 2021, registrou ali 28 bens, na maioria casas em enxaimel, e quase nenhuma foi demolida. Muitas não estão onde foram erguidas: foram desmontadas e remontadas, algumas até três vezes, saindo da beira do arroio para terras melhores de plantar, mais no alto.",
      "Do quilômetro 3 em diante a estrada passa por mais de uma dúzia dessas casas. São moradia de família e por isso não estão marcadas no mapa. Da estrada, repare na madeira aparente das paredes, nas janelas com tampões de madeira e nos telhados de inclinação forte.",
    ],
    paradas: [ARMAZEM_FRITZEN, ESCOLINHA_RUI_BARBOSA],
  },

  "caminho-picada-48-baixa": {
    abertura: [
      "A parte baixa da Picada 48 segue a estrada para Lindolfo Collor e a Rua do Grotão. O inventário do patrimônio do município, de 2021, registrou ali 20 bens.",
      "Em muitas das casas em enxaimel dessa parte, o espaço entre as madeiras é fechado com pau a pique, barro amassado sobre uma trama de varas, e não com tijolo ou pedra. Para o inventário, é sinal de que a ocupação ali está entre as mais antigas.",
      "As casas são moradia de família e por isso não estão marcadas no mapa. O caminho volta pela Picada 48 Alta, onde ficam as duas paradas abaixo.",
    ],
    paradas: [ESCOLINHA_RUI_BARBOSA, ARMAZEM_FRITZEN],
  },

  "caminho-picada-feijao": {
    abertura: [
      "A localidade se chamava Bohnental, por causa dos Bohnenberger, família que chegou ao Brasil em 1829 e esteve entre as primeiras a se instalar ali. Entre 1937 e 1945, na campanha de nacionalização do governo Vargas, os nomes alemães de lugar tiveram de ser trocados. Bohnen, em alemão, quer dizer feijões, e Bohnental virou Picada Feijão.",
      "A ocupação começou sem lote demarcado: colonos que avançaram para o norte da Picada 48 atrás de terra para plantar, nos anos da Revolução Farroupilha. O inventário do patrimônio do município, de 2021, registrou 21 bens na picada, espalhados ao longo da estrada.",
      "As casas de família não estão marcadas no mapa. As paradas abaixo são os prédios que a comunidade usou em conjunto: a venda, a capela, o armazém, a escola.",
    ],
    paradas: [
      // (Picada_Feijao, 015)
      {
        ancora: "casa-bervian",
        nome: "Casa Bervian",
        lat: -29.54086,
        lng: -51.15121,
        selos: ["tombado-municipio", "enxaimel"],
        texto: [
          "Duas casas em enxaimel emendadas, tombadas pelo município em 2004. Não há data certa para a mais antiga; pela memória da família, dificilmente é anterior a 1845. Nela funcionaram uma alfaiataria e uma sapataria.",
          "Por volta de 1880 ganhou a segunda casa, que virou o salão do Kerb, a festa do padroeiro São João Batista, perto do dia 24 de junho. Nos anos 1940, até 1952, foi venda de secos e molhados, com jogo de cartas, bolão e barbearia: o movimento da comunidade se concentrava ali.",
          "Na década de 1990 passou a abrigar uma produção de vinhos, que seguia em 2021. Vale conferir antes se recebe visita.",
        ],
        olhe: "o galpão junto à rua, a sudoeste da casa: foi montado com a madeira da primeira capela da Picada Feijão, de cerca de 1850.",
      },
      // (Picada_Feijao, 011 e 012)
      {
        ancora: "capela-sao-joao-batista",
        nome: "Capela São João Batista (a antiga) e cemitério",
        lat: -29.54376,
        lng: -51.15169,
        selos: [],
        texto: [
          "A capela antiga é de cerca de 1900 e tomou o lugar de uma de madeira, do começo do povoamento, entre 1848 e 1850. A torre veio em 1936.",
          "Entre 1974 e 1983 a comunidade construiu a capela nova bem na frente dela. A antiga ficou um tempo abandonada e foi restaurada em 2002, com dinheiro dos moradores. Em 2021 servia de capela mortuária e guardava, no coro, uma pequena exposição de objetos antigos. O cemitério católico fica ao lado.",
        ],
        olhe: "a data 1936 sobre a porta, a rosácea com desenhos em forma de coração e a torre de cantos chanfrados. A capela antiga fica 60 metros para dentro e 8 metros acima da estrada, meio encoberta pela nova.",
      },
      // (Picada_Feijao, 008)
      {
        ancora: "antigo-armazem-enzweiler",
        nome: "Antigo Armazém Enzweiler",
        lat: -29.54747,
        lng: -51.15275,
        selos: [],
        texto: [
          "Prédio grande de tijolos, no ponto mais baixo da picada, junto ao Arroio Serraria. A partir de 1952 funcionaram ali venda, queijaria, bodega com jogo de cartas, dentista, barbearia aos sábados e salão de baile, ao lado de um moinho. O comércio durou até meados da década de 1990.",
          "Em 2021 estava desocupado. É propriedade particular: é para ver da estrada.",
        ],
        olhe: "o telhado de oito águas, incomum na região, e o gramado largo que separa o prédio da estrada.",
      },
      ESCOLINHA_RUI_BARBOSA,
      ARMAZEM_FRITZEN,
    ],
  },
};

/** De onde vem o que está escrito aqui. */
export const FONTE_DOS_CAMINHOS = {
  texto:
    "Inventário Arquitetônico do Patrimônio Cultural de Ivoti (2020-2021), no catálogo da Biblioteca Pública Municipal",
  href: "https://ivoti.pergamum.com.br/acervo/52148/",
};
