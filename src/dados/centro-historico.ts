import type { Caminho } from "./caminhos";
import { distancia } from "@/lib/geo";

// ============================================================
// O passeio a pé pelo centro histórico
// ============================================================
// Escrito à mão, parada por parada, a partir do Inventário Arquitetônico
// do Patrimônio Cultural de Ivoti (2020-2021), que está na Biblioteca
// Pública Municipal. A página existe porque as edificações de valor
// histórico da área central são pouco divulgadas: o guia mostrava o Núcleo
// de Casas Enxaimel e os caminhos do interior, e quase nada da avenida.
//
// REGRAS DESTE ARQUIVO
//
// 1. Só entra o que a ficha do inventário afirma. Onde ela hesita ("por
//    volta de", "acredita-se", "segundo a família"), o texto hesita junto.
//    Onde as fontes dela se contradizem, o texto não escolhe um lado.
//
// 2. O inventário é de 2021. O que ele diz sobre o uso ATUAL de um prédio
//    (o que funciona lá, se está em obra) vai sempre datado: "em 2021".
//    Prédio muda de uso, e o guia não tem como saber sozinho.
//
// 3. As fichas trazem nome, telefone e e-mail dos proprietários. Nada
//    disso entra aqui, nem em comentário: o repositório é público.
//
// 4. Parada é prédio público, comercial ou tombado. Casa de família que
//    não é tombada fica de fora, mesmo sendo bonita: guia turístico não
//    manda gente para a porta de ninguém. A Casa Adamy, tombada pelo
//    município, também ficou de fora de propósito: fica recuada 25 metros,
//    o enxaimel não aparece da rua, e a ficha registra o incômodo de quem
//    mora lá com o tombamento.
//
// 5. As coordenadas são as das fichas (latitude e longitude de cada bem).
//
// O número entre parênteses em cada comentário é o da ficha no arquivo
// "Sede" do inventário, para quem for conferir.
// ============================================================

export type Selo = "tombado-estado" | "tombado-municipio" | "enxaimel";

export const SELOS: Record<Selo, { texto: string; fundo: string }> = {
  "tombado-estado": {
    texto: "Tombado pelo Estado",
    fundo: "var(--color-v-petunia)",
  },
  "tombado-municipio": {
    texto: "Tombado pelo município",
    fundo: "var(--color-v-azul)",
  },
  enxaimel: { texto: "Enxaimel", fundo: "var(--color-v-verde)" },
};

export type ParadaDoCentro = {
  /** O pedaço do endereço da página que leva a esta parada. */
  ancora: string;
  nome: string;
  endereco: string;
  lat: number;
  lng: number;
  selos: Selo[];
  /** A história, em parágrafos curtos. */
  texto: string[];
  /** O que dá para ver sem entrar. */
  olhe?: string;
  /** O endereço curto do lugar no guia, quando ele tem página própria. */
  noGuia?: string;
  /** Vai como ponto de passagem no link do Google Maps (cabem nove). */
  noMaps?: boolean;
};

/**
 * As paradas, na ordem da visita: do sul para o norte.
 *
 * A ordem não é a da numeração da avenida, que cresce para o norte, e sim a
 * do relevo. A Praça Neldo Holler fica perto dos 190 metros de altitude e
 * a igreja antiga, perto dos 120: saindo da praça, o passeio inteiro é em
 * descida.
 */
export const PARADAS_DO_CENTRO: ParadaDoCentro[] = [
  // (049)
  {
    ancora: "praca-neldo-holler",
    nome: "Praça Neldo Holler",
    endereco: "Av. Presidente Lucena, esquina com a Rua Pastor Ernesto Schlieper",
    lat: -29.60816,
    lng: -51.16307,
    selos: [],
    texto: [
      "A praça foi inaugurada em 19 de outubro de 1979, aniversário da emancipação, e leva o nome do primeiro prefeito de Ivoti. No início dos anos 1990 foi remodelada por Roberto Burle Marx, com o arquiteto Haruyoshi Ono: três planos ligados por escadarias, canteiros em retas e curvas e calçada de pedras portuguesas brancas e pretas. Segundo o inventário, é a única praça de Burle Marx no Rio Grande do Sul.",
      "Muita gente da cidade a chama de Praça da Harmonia, por causa da sociedade que fica do outro lado da avenida. Desde 1982 é aqui que acontece a Feira do Livro.",
    ],
    olhe: "o desenho do piso, os pórticos de concreto feitos para trepadeiras e a escultura de metal no plano junto à avenida, que só foi executada nas obras de 2014.",
    noGuia: "praca-neldo-holler",
  },
  // (048 e 047)
  {
    ancora: "igreja-evangelica",
    nome: "Igreja Evangélica e cemitério",
    endereco: "Rua Pastor Ernesto Schlieper, 51",
    lat: -29.60838,
    lng: -51.16206,
    selos: [],
    texto: [
      "O templo de tijolo aparente e concreto é modernista, de linhas simples e volumes puros. A pedra angular é de 1963, e o inventário registra a inauguração em 16 de novembro de 1969. A torre fica separada do corpo da igreja, ligada a ele por uma marquise, e leva um relógio e uma cruz de concreto.",
      "O cemitério ao lado é mais antigo que qualquer templo da comunidade: em 1842 já havia sepultura ali, e a lápide mais antiga encontrada, a de Abraham Cassel, é desse ano. As lápides mais antigas são de pedra grês, muitas com inscrição em alemão, e os túmulos ficam voltados para o leste, como era o costume.",
    ],
    olhe: "na lateral do templo, os dez módulos de tijolo com vitrais no alto, entre pilares brancos.",
  },
  // (050)
  {
    ancora: "sociedade-harmonia",
    nome: "Sociedade Harmonia",
    endereco: "Av. Presidente Lucena, 1833",
    lat: -29.60787,
    lng: -51.16346,
    selos: [],
    texto: [
      "Prédio eclético de frontão recortado, de grande porte, inaugurado em 8 de maio de 1932. A sociedade nasceu em 1920 como coral misto e, em 1930, adotou o nome alemão Niegedacht, algo como “nunca pensado”. Na Segunda Guerra o letreiro em alemão foi trocado por “Sociedade Harmonia”, os bailes foram suspensos e as atas passaram a ser escritas em português.",
      "A obra foi comandada pelo pedreiro João Dilly, com pedras da pedreira de José Führ e tijolos da olaria de Carlos Schneck. Para aceitar um sócio havia votação: moeda inteira era voto a favor; moeda furada, voto contra. Em 2021 a sociedade seguia ativa, com bailes de Kerb e Oktoberfest.",
    ],
    olhe: "as duas datas na fachada, 1922 e 1932, e a lira entre palmas no alto do módulo central. A de 1932 é a da inauguração; a de 1922, o inventário não conseguiu explicar.",
    noMaps: true,
  },
  // (046)
  {
    ancora: "antiga-igreja-evangelica",
    nome: "Antiga Igreja Evangélica",
    endereco: "Av. Presidente Lucena, 1870",
    lat: -29.60735,
    lng: -51.16286,
    selos: [],
    texto: [
      "Foi o templo da comunidade evangélica por mais de cem anos. A primeira igreja, de madeira, foi inaugurada em 1846, no meio do cemitério. O inventário conclui que a nave atual, de alvenaria e com paredes de 70 centímetros, é de 1851, embora as fontes divirjam sobre as datas.",
      "No Império, igreja protestante não podia ter torre, porque a religião oficial era a católica. A daqui só veio depois: a primeira, de zinco, é atribuída a 1899, e a segunda, de alvenaria, com sinos e relógio, é de 1922. Foi demolida na década de 1980. Com o templo novo, o prédio passou a ser o Pavilhão Sião, salão de eventos da comunidade.",
      "Segundo uma das fontes do inventário, foi a primeira igreja do Rio Grande do Sul a ter um órgão, instalado em 1858.",
    ],
    olhe: "as janelas em arco com vitrais de losangos coloridos, que são o que resta do templo original. E um aviso: o “1870” da fachada não é o ano da construção, é o número do prédio na avenida.",
  },
  // (041)
  {
    ancora: "sociedade-concordia",
    nome: "Sociedade Concórdia",
    endereco: "Av. Presidente Lucena, 2268, no cruzamento com a Rua São Leopoldo",
    lat: -29.60394,
    lng: -51.16246,
    selos: [],
    texto: [
      "A sede da sociedade de canto foi construída em 1924, com fachada de frontão recortado, cheia de curvas e volutas. A sociedade se chamava Eintracht, palavra alemã para “concórdia”; o nome em português veio em 26 de dezembro de 1938, no Estado Novo. Aqui havia coro masculino, bailes, Kerb e bolão.",
      "Em 2019 os sócios decidiram dissolver a sociedade, por falta de quem assumisse a direção. Em 2021 a prefeitura declarou a intenção de fazer no prédio um complexo cultural.",
    ],
    olhe: "a lira no frontão semicircular, símbolo do canto, e a data “1924” dentro de um losango, de cada lado da inscrição.",
    noMaps: true,
  },
  // (038)
  {
    ancora: "casa-heinrich-muller",
    nome: "Casa Heinrich Müller",
    endereco: "Rua São Leopoldo, 471",
    lat: -29.60006,
    lng: -51.16382,
    selos: ["tombado-municipio"],
    texto: [
      "Segundo a família, a casa foi construída em 1898 por Heinrich Müller, agricultor e ferreiro; a ferraria ficava ao lado. Pelo formato parece enxaimel, mas as paredes são de pedra grês, com enfeites ecléticos.",
      "A rua era conhecida como Müllersgasse, o “beco dos Müller”. Restaurada em 1996 e tombada pelo município em 2004, a casa é citada pelo inventário como exemplo de restauração bem feita e de bom uso de uma casa antiga. É moradia: aprecie da calçada.",
    ],
    olhe: "as pilastras com caneluras em cada canto e o telhado baixo, de telhas capa e canal.",
    noMaps: true,
  },
  // (025)
  {
    ancora: "bar-do-pitt",
    nome: "Bar do Pitt",
    endereco: "Av. Presidente Lucena, 3174",
    lat: -29.59586,
    lng: -51.16099,
    selos: [],
    texto: [
      "Um bar funciona aqui desde 1954; antes, o ponto era uma padaria. A fachada é dos anos 1950, com traços de Art Déco: linhas simples, platibanda e marquise sobre a porta. Era um dos pontos de encontro da cidade. Em 2021 seguia com a mesma família, vendendo também jornais, loterias e lanches.",
    ],
    olhe: "os seis quadrados girados, como losangos, que enfeitam o alto da fachada.",
  },
  // (024)
  {
    ancora: "salao-holler",
    nome: "Salão Holler",
    endereco: "Av. Presidente Lucena, 3230",
    lat: -29.59535,
    lng: -51.16089,
    selos: ["tombado-estado", "enxaimel"],
    texto: [
      "O inventário o trata como o maior representante do enxaimel em Ivoti e um dos exemplares mais significativos da arquitetura da imigração alemã no Rio Grande do Sul. São quase 800 m², com porão de grandes blocos de pedra grês, térreo em enxaimel e sótão. Não há data documentada da construção; acredita-se que seja da segunda metade do século XIX.",
      "Foi salão de bailes, restaurante e pouso de caixeiros-viajantes. A pista de dança era lixada e encerada com ferro de passar roupa, para ficar bem lisa; no balcão, cerveja para os homens e spritzbier para as mulheres e as crianças. No porão, Guilherme Holler começou fazendo selas e, por volta de 1916, calçados sob medida: a origem dos Calçados Holler.",
      "Em 2013 o prédio estava sendo demolido quando a obra foi embargada. O tombamento pelo Estado saiu em janeiro de 2014, e a restauração começou em outubro de 2021. Vale conferir no local em que pé ela está.",
    ],
    olhe: "a fachada simétrica, de oito janelas. Ela não tem porta porque as duas que existiam, com escadarias de pedra, foram trocadas por janelas quando a avenida foi rebaixada, entre 1969 e 1971.",
    noMaps: true,
  },
  // (016)
  {
    ancora: "antigo-correio",
    nome: "Antigo Correio",
    endereco: "Av. Presidente Lucena, 3390",
    lat: -29.59387,
    lng: -51.16062,
    selos: [],
    texto: [
      "Casa eclética de frontão recortado, construída em 1926 para ser moradia e comércio ao mesmo tempo. Abrigou a agência dos Correios até a década de 1990 e depois virou loja, quando o térreo foi aberto em vitrines.",
    ],
    olhe: "o alto da fachada, que é a parte original: a cartela com a inscrição “1926” sobre a janela do sótão, os jarrões nas pontas e as pinhas no centro.",
  },
  // (014, com a 013 ao lado)
  {
    ancora: "antiga-prefeitura",
    nome: "Antiga Prefeitura",
    endereco: "Av. Presidente Lucena, 3426",
    lat: -29.59357,
    lng: -51.16056,
    selos: ["tombado-municipio"],
    texto: [
      "Construída em 1928 e inaugurada em 1929 para ser a subprefeitura de Bom Jardim, que então era distrito de São Leopoldo. Com a emancipação, em 1964, virou a prefeitura do novo município, e ficou assim até o início da década de 1990. Depois foi biblioteca, museu e centro de informática: o Museu Municipal foi inaugurado aqui em 1995, antes de ir para o Núcleo de Casas Enxaimel.",
      "No primeiro dia do município, conta o inventário, os eleitos abriram a porta e encontraram as salas vazias, sem mesa nem cadeira. As primeiras cadeiras vieram da casa em frente.",
      "O prédio ao lado, no número 3448, é a antiga Escola Professor Mathias Schütz, onde em 1962 começou a funcionar a primeira escola de grau secundário de Ivoti.",
    ],
    olhe: "a inscrição “1928” no pequeno frontão semicircular, os jarrões no alto das pilastras e os quadros com motivos vegetais sob as janelas.",
    noMaps: true,
  },
  // (010)
  {
    ancora: "camara-municipal",
    nome: "Câmara Municipal",
    endereco: "Av. Presidente Lucena, 3565",
    lat: -29.59229,
    lng: -51.16054,
    selos: [],
    texto: [
      "Antes de ser a casa dos vereadores, foi a sede da Sociedade de Atiradores de Bom Jardim, fundada em 18 de abril de 1893. O prédio é do fim do século XIX ou do começo do XX. Havia tiro ao alvo, bolão, bailes e festas de casamento. O melhor atirador era aclamado Rei do Tiro: ganhava uma medalha e pagava a cerveja da noite.",
      "Foi também onde a cidade discutia política. Do grupo de bolão da sociedade nasceu a Sociedade Amigos de Ivoti, que lutou pela emancipação. A sociedade de atiradores se desfez na década de 1960, e desde 1989 o prédio é a sede do Legislativo.",
    ],
    olhe: "a porta e as janelas em arco, com bandeira de vidro, e o friso na linha do forro, que é o que sobrou de uma fachada antiga com frontão.",
    noMaps: true,
  },
  // (008)
  {
    ancora: "nova-igreja-matriz",
    nome: "Nova Igreja Matriz São Pedro Apóstolo",
    endereco: "Av. Presidente Lucena, 3637",
    lat: -29.59168,
    lng: -51.16063,
    selos: [],
    texto: [
      "Construída entre 1967 e 1969 para substituir a igreja velha, que fica logo atrás. A primeira missa foi em 3 de março de 1968, com o telhado pronto e a obra ainda por acabar; a inauguração oficial veio em 11 de novembro de 1973. É modernista, de volumes puros e linhas retas, em contraste com a vizinha.",
    ],
    olhe: "o mosaico de São Pedro na fachada e a torre sineira, um prisma vertical ao lado da nave.",
  },
  // (009)
  {
    ancora: "casa-staudt",
    nome: "Casa Staudt",
    endereco: "Av. Presidente Lucena, 3667, esquina com a Rua Tuiuti",
    lat: -29.59142,
    lng: -51.16043,
    selos: ["tombado-municipio"],
    texto: [
      "Casa de pedra grês, com paredes de meio metro, que traz a inscrição “1863” sobre a porta. Já foi quase tudo: pousada de caixeiros-viajantes, salão de baile, cancha de bolão, padaria, ateliê de alfaiate, açougue (no porão), bar e armazém. O último baile foi em 1954.",
      "Era uma das esquinas mais importantes da cidade. Tombada pelo município em 2004, continua sendo moradia: aprecie da calçada.",
    ],
    olhe: "a data na chave de pedra da porta e os lambrequins da varanda, recortados em semicírculos.",
    noMaps: true,
  },
  // (006, com a 005 atrás)
  {
    ancora: "antiga-igreja-matriz",
    nome: "Antiga Igreja Matriz São Pedro",
    endereco: "Rua Tuiuti, sem número",
    lat: -29.59137,
    lng: -51.16111,
    selos: ["tombado-estado"],
    texto: [
      "A comunidade católica foi fundada em 1834 e rezava numa capela de madeira. A igreja de pedra grês, com paredes de 80 centímetros, teve a primeira parte inaugurada em 29 de junho de 1857. A torre recebeu a última pedra na Páscoa de 1890.",
      "Sobreviveu a dois incêndios. O primeiro, em 19 de novembro de 1924, queimou a igreja, que foi reinaugurada em 15 de novembro de 1925. Quando a matriz nova ficou pronta, a velha virou escola, salão de festas e até discoteca, e esteve ameaçada de demolição. Foi tombada pelo Estado em setembro de 1986; cinco dias depois pegou fogo de novo, e o incêndio foi apagado por uma chuva forte.",
      "Uma primeira etapa de restauração foi inaugurada em 2004, com cobertura nova. Em 2021, quando o inventário foi feito, a igreja estava desocupada. Atrás dela fica o cemitério católico, onde está a sepultura do professor Mathias Schütz.",
    ],
    olhe: "a torre, que é a primeira coisa que vê quem chega à cidade pela Ponte do Imperador; a rosácea de cinco pétalas sobre a porta; e as bases redondas dos relógios nas faces da torre. A frente da igreja dá para o leste, ao contrário do costume.",
    noGuia: "igreja-sao-pedro-apostolo",
  },
];

/**
 * Pontos a mais no desenho da linha, entre uma parada e a seguinte.
 *
 * Só há um trecho em que a linha reta entre duas paradas enganaria: da
 * Sociedade Concórdia à Casa Heinrich Müller o passeio sai da avenida e
 * segue pela Rua São Leopoldo, que faz uma curva para oeste e volta. Os
 * pontos são os de outras casas da mesma rua no inventário.
 */
const DESVIOS: Record<string, [number, number][]> = {
  // depois desta parada, antes da seguinte
  "sociedade-concordia": [
    [-29.60273, -51.16475],
    [-29.60108, -51.16431],
  ],
  "casa-heinrich-muller": [
    [-29.5994, -51.16338],
    [-29.59902, -51.16254],
  ],
};

/**
 * O passeio no formato dos caminhos, para o mapa desenhar a linha e para
 * a página achar os lugares do guia que ficam na beira dele.
 */
export function caminhoDoCentro(): Caminho {
  const tracado: [number, number][] = [];
  for (const p of PARADAS_DO_CENTRO) {
    tracado.push([p.lat, p.lng]);
    for (const ponto of DESVIOS[p.ancora] ?? []) tracado.push(ponto);
  }

  let metros = 0;
  for (let i = 1; i < tracado.length; i++) {
    metros += distancia(
      { lat: tracado[i - 1][0], lng: tracado[i - 1][1] },
      { lat: tracado[i][0], lng: tracado[i][1] },
    );
  }

  const partida = PARADAS_DO_CENTRO[0];
  return {
    slug: "centro-historico",
    nome: "Centro histórico de Ivoti",
    arquivo: "",
    // A linha corta as esquinas e atravessa a avenida em diagonal; quem
    // anda pela calçada faz um pouco mais. Dez por cento de folga.
    metros: Math.round((metros * 1.1) / 10) * 10,
    circuito: false,
    tracado,
    partida: { lat: partida.lat, lng: partida.lng, nome: partida.nome },
  };
}

/**
 * O link que abre o passeio no Google Maps, a pé.
 *
 * O Maps aceita no máximo nove pontos de passagem. Vão o começo, o fim e
 * as paradas marcadas com `noMaps`; as outras ficam no caminho entre elas.
 */
export function linkDoPasseioNoMaps(): string {
  const ponto = (p: ParadaDoCentro) => `${p.lat},${p.lng}`;
  const primeira = PARADAS_DO_CENTRO[0];
  const ultima = PARADAS_DO_CENTRO[PARADAS_DO_CENTRO.length - 1];

  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("travelmode", "walking");
  url.searchParams.set("origin", ponto(primeira));
  url.searchParams.set("destination", ponto(ultima));
  url.searchParams.set(
    "waypoints",
    PARADAS_DO_CENTRO.filter((p) => p.noMaps)
      .slice(0, 9)
      .map(ponto)
      .join("|"),
  );
  return url.toString();
}

/** Os números do inventário que a página cita. */
export const NUMEROS_DO_INVENTARIO = {
  /** Bens inventariados no município. */
  bens: 177,
  /** Bens inventariados na sede. */
  naSede: 71,
  /** Casas ou conjuntos em enxaimel no município. */
  enxaimel: 104,
};

export const FONTES_DO_PASSEIO = [
  {
    texto:
      "Inventário Arquitetônico do Patrimônio Cultural de Ivoti, 2020-2021, feito para o município por VRP Arquitetura Estratégica, com o arquiteto Vlademir Roman e os historiadores Gladis M. Pippi e Cristiano de Brum. Está na Biblioteca Pública Municipal:",
    rotulo: "ver no catálogo",
    href: "https://ivoti.pergamum.com.br/acervo/52148/",
  },
  {
    texto:
      "Sobre as casas enxaimel da cidade há também o documentário “Um olhar afetivo sobre o enxaimel de Ivoti”, da SIEHU Ivoti:",
    rotulo: "assistir no YouTube",
    href: "https://www.youtube.com/watch?v=ASVkTubwTHs",
  },
];
