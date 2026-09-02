// ============================================================
// Modo demonstracao
// ============================================================
// Enquanto o Supabase nao estiver configurado, o site funciona com estes
// lugares ficticios — da pra clicar, filtrar, ver no mapa e conversar com o
// guia sem ter banco nenhum.
//
// Assim que as chaves entrarem no .env.local, nada disso roda mais: as
// funcoes de src/lib/locais.ts passam a ler o banco de verdade.
// ============================================================

import type { Categoria, LocalCompleto, Tag } from "./tipos";
import { agoraNaCidade, situacao, DIAS } from "./horarios";

/* ---------------- categorias ---------------- */

const PAIS: [string, string, string][] = [
  ["gastronomia", "Comer e beber", "🍽️"],
  ["vida-noturna", "Bares e vida noturna", "🍺"],
  ["hospedagem", "Onde ficar", "🛏️"],
  ["natureza", "Natureza e trilhas", "🌳"],
  ["turismo-rural", "Fazendas e turismo rural", "🐴"],
  ["cultura", "Cultura e historia", "🏛️"],
  ["lazer", "Lazer e esporte", "⚽"],
];

const FILHAS: [string, string, string, string][] = [
  ["pizzaria", "Pizzaria", "🍕", "gastronomia"],
  ["hamburgueria", "Hamburgueria", "🍔", "gastronomia"],
  ["cafe", "Cafe e confeitaria", "☕", "gastronomia"],
  ["colonial", "Cafe colonial", "🥐", "gastronomia"],
  ["sorveteria", "Sorveteria", "🍦", "gastronomia"],
  ["pub", "Pub", "🍺", "vida-noturna"],
  ["cervejaria", "Cervejaria", "🍺", "vida-noturna"],
  ["pousada", "Pousada", "🏡", "hospedagem"],
  ["trilha", "Trilha", "🥾", "natureza"],
  ["praca", "Praca", "🌸", "natureza"],
  ["cascata", "Cascata", "💦", "natureza"],
  ["fazenda", "Fazenda", "🚜", "turismo-rural"],
  ["museu", "Museu", "🖼️", "cultura"],
  ["kids", "Diversao pra criancada", "🎠", "lazer"],
];

export const CATEGORIAS_DEMO: Categoria[] = [
  ...PAIS.map(([slug, nome, emoji], i) => ({
    id: i + 1,
    slug,
    nome,
    emoji,
    pai_id: null,
    ordem: (i + 1) * 10,
  })),
  ...FILHAS.map(([slug, nome, emoji, pai], i) => ({
    id: 100 + i,
    slug,
    nome,
    emoji,
    pai_id: PAIS.findIndex((p) => p[0] === pai) + 1,
    ordem: (i + 1) * 10,
  })),
];

const categoria = (slug: string) =>
  CATEGORIAS_DEMO.find((c) => c.slug === slug) ?? null;

/* ---------------- etiquetas ---------------- */

const ETIQUETAS: [string, string, string][] = [
  ["ao-ar-livre", "Ao ar livre", "☀️"],
  ["com-crianca", "Bom pra criancas", "🧒"],
  ["aceita-pet", "Aceita pet", "🐶"],
  ["estacionamento", "Estacionamento", "🅿️"],
  ["musica-ao-vivo", "Musica ao vivo", "🎤"],
  ["vegetariano", "Opcoes vegetarianas", "🥗"],
  ["romantico", "Romantico", "💛"],
  ["em-grupo", "Bom pra grupos", "👥"],
  ["vista-bonita", "Vista bonita", "📸"],
  ["delivery", "Faz entrega", "🛵"],
  ["gratuito", "Entrada gratuita", "🆓"],
  ["wifi", "Wi-Fi", "📶"],
];

export const TAGS_DEMO: Tag[] = ETIQUETAS.map(([slug, nome, emoji], i) => ({
  id: i + 1,
  slug,
  nome,
  emoji,
  ordem: (i + 1) * 10,
}));

const etiquetas = (...slugs: string[]): Tag[] =>
  TAGS_DEMO.filter((t) => slugs.includes(t.slug));

/* ---------------- ajudantes ---------------- */

/** Mesma faixa de horario em varios dias de uma vez. */
function faixa(dias: number[], abre: string, fecha: string) {
  return dias.map((dia_semana) => ({ dia_semana, abre, fecha }));
}

const SEMANA = [1, 2, 3, 4, 5];
const FIM = [0, 6];

type Rascunho = {
  slug: string;
  nome: string;
  cat: string;
  resumo: string;
  descricao: string;
  endereco: string;
  bairro: string;
  lat: number;
  lng: number;
  preco?: number;
  destaque?: boolean;
  whatsapp?: string;
  instagram?: string;
  tags: string[];
  horarios: { dia_semana: number; abre: string; fecha: string }[];
  itens?: [string, string, string, number | null][]; // secao, nome, descricao, preco
};

/* ---------------- os lugares ---------------- */

const RASCUNHOS: Rascunho[] = [
  {
    slug: "pizzaria-do-morro",
    nome: "Pizzaria do Morro",
    cat: "pizzaria",
    resumo: "Pizza na lenha com vista pro vale e patio pra criancada correr.",
    descricao:
      "A gente abriu em 2011 num galpao antigo de colono, subindo o morro. O forno e a lenha, a massa descansa dois dias e o molho e de tomate da horta aqui do lado.\n\nO patio tem gangorra, balanco e espaco de sobra. Nos fins de semana tem musica ao vivo a partir das 20h.",
    endereco: "Estrada do Morro, 1450",
    bairro: "Morro Alto",
    lat: -29.5842,
    lng: -51.1523,
    preco: 2,
    destaque: true,
    whatsapp: "(51) 99123-4567",
    instagram: "@pizzariadomorro",
    tags: ["ao-ar-livre", "com-crianca", "estacionamento", "musica-ao-vivo", "vista-bonita"],
    horarios: [...faixa([3, 4], "18:30", "23:00"), ...faixa([5, 6], "18:30", "00:30"), ...faixa([0], "18:00", "22:30")],
    itens: [
      ["Pizzas salgadas", "Calabresa da casa", "Calabresa artesanal, cebola roxa e oregano", 62],
      ["Pizzas salgadas", "Quatro queijos do vale", "Queijos de produtores de Ivoti e Presidente Lucena", 74],
      ["Pizzas salgadas", "Vegetariana da horta", "O que estiver bom na horta naquela semana", 68],
      ["Pizzas doces", "Banana com canela", "Banana caramelizada, canela e sorvete de creme", 58],
      ["Bebidas", "Chope artesanal", "Pilsen da cervejaria daqui de Ivoti", 16],
    ],
  },
  {
    slug: "hamburgueria-pedra-grande",
    nome: "Hamburgueria Pedra Grande",
    cat: "hamburgueria",
    resumo: "Blend de costela, pao brioche e batata rustica. Ate meia-noite.",
    descricao:
      "Hamburgueria pequena, oito mesas, tudo feito na hora. O blend e de costela com acem, moido todo dia de manha. Tem opcao vegetariana de grao-de-bico que sai tanto quanto a de carne.",
    endereco: "Rua Presidente Lucena, 780",
    bairro: "Centro",
    lat: -29.5921,
    lng: -51.1638,
    preco: 2,
    whatsapp: "(51) 99876-5432",
    instagram: "@pedragrandeburger",
    tags: ["vegetariano", "delivery", "em-grupo", "wifi"],
    horarios: [...faixa([2, 3, 4], "18:00", "23:30"), ...faixa([5, 6], "18:00", "00:30")],
    itens: [
      ["Hamburgueres", "Pedra Grande", "180g de costela, cheddar, bacon e maionese da casa", 38],
      ["Hamburgueres", "Colono", "180g, queijo colonial, cebola caramelizada e rucula", 42],
      ["Hamburgueres", "Verde", "Grao-de-bico, queijo, tomate assado e pesto", 36],
      ["Acompanhamentos", "Batata rustica", "Com alecrim e pimenta do reino", 22],
    ],
  },
  {
    slug: "cafe-da-praca",
    nome: "Cafe da Praca",
    cat: "cafe",
    resumo: "Cafe coado na hora, cuca alema e uma mesa na calcada de frente pra praca.",
    descricao:
      "Cafeteria de esquina, aberta desde cedo. O cafe e torrado na serra e o bolo muda todo dia. E o lugar de tomar um cafe da manha sem pressa antes de sair pra caminhar.",
    endereco: "Praca Padre Theobaldo, 12",
    bairro: "Centro",
    lat: -29.5905,
    lng: -51.1602,
    preco: 1,
    destaque: true,
    instagram: "@cafedapracaivoti",
    tags: ["ao-ar-livre", "aceita-pet", "wifi", "vegetariano"],
    horarios: [...faixa(SEMANA, "07:30", "19:00"), ...faixa([6], "08:00", "18:00")],
    itens: [
      ["Cafes", "Coado da casa", "Grao da serra, torra media", 9],
      ["Cafes", "Cappuccino", "Com canela por cima, do jeito antigo", 14],
      ["Da cozinha", "Cuca de banana", "Fatia generosa, receita da vo", 12],
      ["Da cozinha", "Sanduiche colonial", "Pao caseiro, queijo e salame de Ivoti", 24],
    ],
  },
  {
    slug: "cafe-colonial-casa-mueller",
    nome: "Cafe Colonial Casa Mueller",
    cat: "colonial",
    resumo: "Mesa farta de cafe colonial alemao numa casa enxaimel de 1918.",
    descricao:
      "Sao mais de trinta itens na mesa: cucas, paes caseiros, salames, queijos, geleias, tortas e o famoso Apfelstrudel. A casa e enxaimel original, tombada, com o forno a lenha ainda funcionando.\n\nPreco unico por pessoa, criancas ate 6 anos nao pagam.",
    endereco: "Rua Bento Goncalves, 2200",
    bairro: "Feitoria Nova",
    lat: -29.6015,
    lng: -51.1701,
    preco: 3,
    destaque: true,
    whatsapp: "(51) 99555-1122",
    tags: ["com-crianca", "em-grupo", "estacionamento", "vista-bonita"],
    horarios: [...faixa([5], "15:00", "21:00"), ...faixa(FIM, "14:00", "21:00")],
    itens: [
      ["Cafe colonial", "Mesa completa por pessoa", "Mais de 30 itens, a vontade", 89],
      ["Cafe colonial", "Criancas de 7 a 12 anos", "Meia entrada", 45],
    ],
  },
  {
    slug: "sorveteria-bica",
    nome: "Sorveteria Bica",
    cat: "sorveteria",
    resumo: "Sorvete de massa feito ali, com sabores da estacao.",
    descricao:
      "Sorveteria de bairro, sem frescura. Trinta sabores fixos e mais quatro que mudam conforme a fruta da epoca — bergamota no inverno, amora no verao.",
    endereco: "Rua 15 de Novembro, 340",
    bairro: "Centro",
    lat: -29.5893,
    lng: -51.1589,
    preco: 1,
    tags: ["com-crianca", "aceita-pet"],
    horarios: [...faixa([1, 2, 3, 4, 5], "13:00", "22:00"), ...faixa(FIM, "13:00", "22:30")],
  },
  {
    slug: "pub-do-vale",
    nome: "Pub do Vale",
    cat: "pub",
    resumo: "Doze torneiras de chope artesanal e show ao vivo na sexta e no sabado.",
    descricao:
      "Pub num galpao de tijolo aparente, com palco pequeno e patio nos fundos. Doze torneiras rotativas, quase todas de cervejarias gauchas. Sexta e sabado tem banda a partir das 22h30.",
    endereco: "Rua Carlos Arnt, 55",
    bairro: "Centro",
    lat: -29.5934,
    lng: -51.1615,
    preco: 2,
    instagram: "@pubdovaleivoti",
    tags: ["musica-ao-vivo", "em-grupo", "ao-ar-livre"],
    horarios: [...faixa([3, 4], "18:00", "01:00"), ...faixa([5, 6], "18:00", "02:30")],
    itens: [
      ["Chopes", "Pilsen", "Leve, pra comecar a noite", 15],
      ["Chopes", "IPA do vale", "Amarga na medida, produzida em Ivoti", 19],
      ["Pra petiscar", "Tabua de frios coloniais", "Salames, queijos e pao caseiro", 68],
    ],
  },
  {
    slug: "cervejaria-feitoria",
    nome: "Cervejaria Feitoria",
    cat: "cervejaria",
    resumo: "Fabrica com visita guiada, degustacao e taproom aos sabados.",
    descricao:
      "Cervejaria artesanal que nasceu num porao em 2016. A visita dura 40 minutos, passa pela sala de brassagem e termina com degustacao de quatro rotulos. Precisa agendar pelo WhatsApp.",
    endereco: "Rodovia RS-239, km 18",
    bairro: "Picada 48",
    lat: -29.6108,
    lng: -51.1442,
    preco: 2,
    whatsapp: "(51) 99444-7788",
    tags: ["estacionamento", "em-grupo", "ao-ar-livre"],
    horarios: [...faixa([4, 5], "16:00", "22:00"), ...faixa([6], "11:00", "22:00")],
    itens: [["Visitas", "Visita guiada com degustacao", "40 min, 4 rotulos. Agende antes", 45]],
  },
  {
    slug: "pousada-recanto-das-hortensias",
    nome: "Pousada Recanto das Hortensias",
    cat: "pousada",
    resumo: "Seis chales de madeira no meio do mato, com cafe da manha colonial.",
    descricao:
      "Pousada familiar a dez minutos do centro. Seis chales espalhados num terreno de dois hectares, cada um com varanda e rede. Cafe da manha servido na casa principal, com pao e cuca feitos ali.\n\nAceita cachorro, tem trilha propria e uma cascata pequena no fundo do terreno.",
    endereco: "Estrada das Hortensias, 3200",
    bairro: "Vila Nova",
    lat: -29.6142,
    lng: -51.1812,
    preco: 3,
    whatsapp: "(51) 99333-2211",
    tags: ["aceita-pet", "ao-ar-livre", "romantico", "vista-bonita", "estacionamento"],
    horarios: [...faixa([0, 1, 2, 3, 4, 5, 6], "08:00", "20:00")],
    itens: [
      ["Diarias", "Chale casal", "Cama queen, varanda e lareira. Cafe incluso", 380],
      ["Diarias", "Chale familia", "Ate 4 pessoas, dois quartos", 520],
    ],
  },
  {
    slug: "trilha-da-pedra-do-segredo",
    nome: "Trilha da Pedra do Segredo",
    cat: "trilha",
    resumo: "4 km de subida leve ate um mirante com vista dos vales. De graca.",
    descricao:
      "Trilha bem marcada, dificuldade media, uns 4 km ida e volta. A subida leva mais ou menos uma hora com calma. No alto tem a pedra que da nome ao lugar e vista aberta pra tres vales.\n\nLeve agua. Nao tem banheiro nem lanchonete no caminho. Melhor ir de manha cedo.",
    endereco: "Acesso pela Estrada do Morro, apos o km 4",
    bairro: "Morro Alto",
    lat: -29.5758,
    lng: -51.1489,
    destaque: true,
    tags: ["ao-ar-livre", "gratuito", "vista-bonita", "aceita-pet"],
    horarios: [...faixa([0, 1, 2, 3, 4, 5, 6], "06:00", "18:00")],
  },
  {
    slug: "cascata-do-boa-vista",
    nome: "Cascata do Boa Vista",
    cat: "cascata",
    resumo: "Queda de 12 metros com poco pra banho, boa pra levar as criancas.",
    descricao:
      "Cascata em area particular aberta a visitacao. Tem area de churrasqueira, banheiro e um quiosque que vende lanche nos fins de semana. O poco e raso na beirada, da pra criancada brincar.",
    endereco: "Estrada Boa Vista, s/n",
    bairro: "Boa Vista",
    lat: -29.5677,
    lng: -51.1923,
    preco: 1,
    tags: ["ao-ar-livre", "com-crianca", "estacionamento", "vista-bonita"],
    horarios: [...faixa([2, 3, 4, 5], "09:00", "17:00"), ...faixa(FIM, "08:30", "18:00")],
    itens: [["Entrada", "Ingresso por pessoa", "Criancas ate 6 anos nao pagam", 15]],
  },
  {
    slug: "praca-do-imigrante",
    nome: "Praca do Imigrante",
    cat: "praca",
    resumo: "A praca central, com playground, sombra e feira de artesanato no domingo.",
    descricao:
      "Praca principal de Ivoti, com coreto, playground novo, academia ao ar livre e muita sombra. No domingo de manha tem feira de artesanato e de produtores da colonia.",
    endereco: "Praca Padre Theobaldo, centro",
    bairro: "Centro",
    lat: -29.5908,
    lng: -51.1607,
    tags: ["ao-ar-livre", "com-crianca", "gratuito", "aceita-pet"],
    horarios: [...faixa([0, 1, 2, 3, 4, 5, 6], "05:00", "23:00")],
  },
  {
    slug: "fazenda-pomar-schmitt",
    nome: "Fazenda Pomar Schmitt",
    cat: "fazenda",
    resumo: "Colha sua propria bergamota, tome suco na hora e conheca os bichos.",
    descricao:
      "Propriedade familiar de terceira geracao. Na epoca da bergamota (maio a agosto) da pra colher direto do pe e pagar por quilo. Tem visita ao curral, alimentacao dos animais e trator com carreta pra passear no pomar.",
    endereco: "Picada Schmitt, 900",
    bairro: "Picada 48",
    lat: -29.6221,
    lng: -51.1355,
    preco: 1,
    whatsapp: "(51) 99222-3344",
    tags: ["ao-ar-livre", "com-crianca", "estacionamento", "em-grupo"],
    horarios: [...faixa([3, 4, 5], "09:00", "17:00"), ...faixa(FIM, "09:00", "18:00")],
    itens: [
      ["Passeios", "Visita guiada", "1h30, com passeio de trator", 30],
      ["Passeios", "Colheita de bergamota", "Preco por quilo, na epoca", 8],
    ],
  },
  {
    slug: "museu-casa-do-imigrante",
    nome: "Museu Casa do Imigrante",
    cat: "museu",
    resumo: "Casa enxaimel restaurada contando a chegada dos alemaes ao vale.",
    descricao:
      "Museu instalado numa casa enxaimel de 1856, com moveis, ferramentas e documentos da imigracao alema. A visita guiada dura 40 minutos e conta bem a historia de como Ivoti se formou.",
    endereco: "Rua Bento Goncalves, 1020",
    bairro: "Centro",
    lat: -29.5951,
    lng: -51.1644,
    tags: ["com-crianca", "gratuito"],
    horarios: [...faixa([2, 3, 4, 5], "09:00", "17:00"), ...faixa([6], "09:00", "13:00")],
  },
  {
    slug: "parque-aquatico-sol-nascente",
    nome: "Parque Aquatico Sol Nascente",
    cat: "kids",
    resumo: "Piscinas aquecidas, tobogas e area de churrasco. Domingo lota.",
    descricao:
      "Parque com quatro piscinas (duas aquecidas), dois tobogas, piscina infantil e area de churrasqueiras que da pra alugar. Tem lanchonete e vestiario.",
    endereco: "Estrada Sol Nascente, 500",
    bairro: "Vila Nova",
    lat: -29.6055,
    lng: -51.1758,
    preco: 2,
    tags: ["com-crianca", "ao-ar-livre", "em-grupo", "estacionamento"],
    horarios: [...faixa([3, 4, 5], "10:00", "18:00"), ...faixa(FIM, "09:00", "19:00")],
    itens: [
      ["Entrada", "Adulto", "Dia inteiro", 45],
      ["Entrada", "Crianca de 4 a 11 anos", "Dia inteiro", 25],
    ],
  },
];

/* ---------------- montagem ---------------- */

const AGORA = "2026-01-01T12:00:00.000Z";

export const LOCAIS_DEMO: LocalCompleto[] = RASCUNHOS.map((r, i) => {
  const cat = categoria(r.cat);
  return {
    id: `demo-${String(i + 1).padStart(2, "0")}`,
    slug: r.slug,
    nome: r.nome,
    categoria_id: cat?.id ?? null,
    resumo: r.resumo,
    descricao: r.descricao,
    endereco: r.endereco,
    numero: null,
    bairro: r.bairro,
    cidade: "Ivoti",
    uf: "RS",
    cep: null,
    lat: r.lat,
    lng: r.lng,
    telefone: null,
    whatsapp: r.whatsapp ?? null,
    email: null,
    site: null,
    instagram: r.instagram ?? null,
    facebook: null,
    faixa_preco: r.preco ?? null,
    capa_url: null,
    status: "publicado",
    motivo_rejeicao: null,
    destaque: r.destaque ?? false,
    dono_id: null,
    criado_em: AGORA,
    atualizado_em: AGORA,
    publicado_em: AGORA,
    categoria: cat,
    horarios: r.horarios,
    fotos: [],
    tags: etiquetas(...r.tags),
    itens: (r.itens ?? []).map(([secao, nome, descricao, preco], ordem) => ({
      id: `demo-${i}-${ordem}`,
      secao,
      nome,
      descricao,
      preco,
      ordem,
    })),
  };
});

/* ============================================================ */
/* Chat de demonstracao                                         */
/* ============================================================ */
/* Sem a chave da Anthropic o guia de verdade nao roda. Isto aqui e um
   arremedo: casa palavras da pergunta com as etiquetas e categorias, e
   monta uma resposta no mesmo formato (inclusive os marcadores [[slug]]
   que viram cartao). Serve pra ver como fica — o guia de verdade entende
   qualquer frase e escreve bem melhor. */

type Regra = { palavras: string[]; slugs: string[]; abertura: string };

const REGRAS: Regra[] = [
  {
    palavras: ["pizza", "pizzaria"],
    slugs: ["pizzaria-do-morro"],
    abertura: "Pizza em Ivoti tem um endereco certo 🍕",
  },
  {
    palavras: ["hamburguer", "hamburger", "burger", "lanche"],
    slugs: ["hamburgueria-pedra-grande"],
    abertura: "Hamburguer de verdade, feito na hora:",
  },
  {
    palavras: ["cafe", "cafezinho", "bolo", "cuca", "colonial", "manha"],
    slugs: ["cafe-da-praca", "cafe-colonial-casa-mueller"],
    abertura: "Cafe eu te indico dois, depende do tamanho da fome ☕",
  },
  {
    palavras: ["cerveja", "chope", "bar", "pub", "noite", "noturna", "beber", "balada"],
    slugs: ["pub-do-vale", "cervejaria-feitoria"],
    abertura: "Pra noite tem duas pedidas boas 🍺",
  },
  {
    palavras: ["crianca", "criancas", "filho", "filhos", "familia", "kids"],
    slugs: ["parque-aquatico-sol-nascente", "praca-do-imigrante", "fazenda-pomar-schmitt"],
    abertura: "Com a criancada junto, essas tres nunca falham 🧒",
  },
  {
    palavras: ["trilha", "caminhada", "caminhar", "natureza", "mato", "ar livre", "cachoeira", "cascata"],
    slugs: ["trilha-da-pedra-do-segredo", "cascata-do-boa-vista"],
    abertura: "Pra botar o pe na natureza 🌳",
  },
  {
    palavras: ["dormir", "hotel", "pousada", "hospedagem", "ficar", "chale"],
    slugs: ["pousada-recanto-das-hortensias"],
    abertura: "Pra passar a noite em Ivoti:",
  },
  {
    palavras: ["historia", "museu", "cultura", "imigrante", "enxaimel"],
    slugs: ["museu-casa-do-imigrante", "cafe-colonial-casa-mueller"],
    abertura: "Pra conhecer a historia do vale 🏛️",
  },
  {
    palavras: ["fazenda", "rural", "bicho", "animais", "colher", "bergamota"],
    slugs: ["fazenda-pomar-schmitt"],
    abertura: "Turismo rural aqui e isso aqui 🚜",
  },
  {
    palavras: ["sorvete", "gelado", "calor"],
    slugs: ["sorveteria-bica"],
    abertura: "Dia quente pede isso 🍦",
  },
  {
    palavras: ["romantico", "namorada", "namorado", "casal", "aniversario"],
    slugs: ["pousada-recanto-das-hortensias", "pizzaria-do-morro"],
    abertura: "Pra dois, sem errar 💛",
  },
  {
    palavras: ["pet", "cachorro", "cao"],
    slugs: ["cafe-da-praca", "trilha-da-pedra-do-segredo", "praca-do-imigrante"],
    abertura: "Com o cachorro junto pode ir nesses 🐶",
  },
  {
    palavras: ["vegetariano", "vegano", "sem carne"],
    slugs: ["hamburgueria-pedra-grande", "cafe-da-praca"],
    abertura: "Opcao sem carne tem sim 🥗",
  },
];

const PROGRAMA = [
  "cafe-da-praca",
  "trilha-da-pedra-do-segredo",
  "pizzaria-do-morro",
];

function achar(slug: string) {
  return LOCAIS_DEMO.find((l) => l.slug === slug);
}

function comoEsta(slug: string): string {
  const local = achar(slug);
  if (!local) return "";
  const s = situacao(local.horarios);
  return s.aberto
    ? `Agora ta ${s.texto.toLowerCase()}.`
    : `Agora ta fechado — ${s.texto.toLowerCase()}.`;
}

/** Resposta do guia no modo demonstracao. */
export function respostaDemo(pergunta: string): string {
  const texto = pergunta
    .normalize("NFD")
    .replace(/[^\x00-\x7f]/g, "")
    .toLowerCase();

  const agora = agoraNaCidade();
  const dia = DIAS[agora.diaSemana].toLowerCase();

  // "monta um roteiro" / "o que fazer hoje" -> programa do dia inteiro
  const querRoteiro =
    /roteiro|programa|o que fazer|dia inteiro|passar o dia/.test(texto);

  if (querRoteiro) {
    const partes = PROGRAMA.map((s) => achar(s)!).filter(Boolean);
    return [
      `Boa! Hoje e ${dia} — montei um dia inteirinho pra ti 🌿`,
      "",
      `**De manha:** cafe sem pressa no ${partes[0].nome} [[${partes[0].slug}]] — abre 7h30 e o bolo muda todo dia.`,
      `**Meio da manha:** sobe a ${partes[1].nome} [[${partes[1].slug}]]. Sao uns 4 km, uma hora de subida com calma, e a vista la de cima paga.`,
      `**A noite:** ${partes[2].nome} [[${partes[2].slug}]] pra fechar — pizza na lenha e, se for sexta ou sabado, musica ao vivo.`,
      "",
      "Quer que eu troque alguma parada?",
    ].join("\n");
  }

  const regra = REGRAS.find((r) => r.palavras.some((p) => texto.includes(p)));

  if (!regra) {
    const abertos = LOCAIS_DEMO.filter((l) => situacao(l.horarios).aberto).slice(0, 3);
    if (abertos.length === 0) {
      return `Nessa hora de ${dia} ta tudo fechado por aqui 😅 Me diz o que tu curte — comer, caminhar, tomar alguma coisa — que eu te indico pra mais tarde ou pra amanha.`;
    }
    return [
      `Me conta um pouco mais do que tu quer! Enquanto isso, o que ta aberto agora nesse ${dia}:`,
      "",
      ...abertos.map((l) => `- ${l.nome} [[${l.slug}]] — ${l.resumo}`),
    ].join("\n");
  }

  const locais = regra.slugs.map(achar).filter(Boolean) as LocalCompleto[];
  const linhas = locais.map(
    (l) => `- **${l.nome}** [[${l.slug}]] — ${l.resumo} ${comoEsta(l.slug)}`,
  );

  const fechados = locais.filter((l) => !situacao(l.horarios).aberto);
  const remate =
    fechados.length === locais.length
      ? "\nTa tudo fechado nessa hora, mas ja deixa anotado 😉"
      : "\nQuer que eu veja a rota de algum?";

  return [regra.abertura, "", ...linhas, remate].join("\n");
}
