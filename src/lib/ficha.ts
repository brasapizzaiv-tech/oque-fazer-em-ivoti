import type { LocalCompleto } from "./tipos";
import type { EventoNaTela } from "./eventos";
import { SITE } from "./site";
import { usuarioInstagram } from "./texto";

// ============================================================
// A ficha do lugar para o buscador
// ============================================================
// Um bloco invisível na página que diz, em linguagem de máquina, o que
// aquele endereço é: "isto é um restaurante, fica nesta rua, abre nestes
// horários, o telefone é este".
//
// Até 26/10/2026 nenhuma página tinha isso, e o Search Console mostrava
// 12 páginas "detectadas, mas não indexadas" — o Google sabia que o
// endereço existia e nem abriu. Para uma página com um parágrafo de
// texto, a ficha é o que diferencia um estabelecimento de verdade de um
// texto qualquer.
//
// Ela NÃO inventa nada. Tudo o que sai aqui está cadastrado; o que não
// estiver preenchido simplesmente não aparece. Ficha que promete
// telefone inexistente é pior que ficha nenhuma.
// ============================================================

/**
 * De que tipo é cada categoria, no vocabulário que o Google entende.
 *
 * A chave é o slug da subcategoria. "negocio" separa quem é
 * estabelecimento (tem faixa de preço, atende cliente) de quem é lugar
 * público — uma praça não tem preço, e dizer que tem seria mentira
 * estruturada.
 */
const TIPOS: Record<string, { tipo: string; negocio: boolean }> = {
  // Comer e beber
  restaurante: { tipo: "Restaurant", negocio: true },
  pizzaria: { tipo: "Restaurant", negocio: true },
  churrascaria: { tipo: "Restaurant", negocio: true },
  colonial: { tipo: "Restaurant", negocio: true },
  delivery: { tipo: "Restaurant", negocio: true },
  hamburgueria: { tipo: "FastFoodRestaurant", negocio: true },
  lanches: { tipo: "FastFoodRestaurant", negocio: true },
  cafe: { tipo: "CafeOrCoffeeShop", negocio: true },
  padaria: { tipo: "Bakery", negocio: true },
  sorveteria: { tipo: "IceCreamShop", negocio: true },

  // Bares e vida noturna
  bar: { tipo: "BarOrPub", negocio: true },
  pub: { tipo: "BarOrPub", negocio: true },
  balada: { tipo: "NightClub", negocio: true },
  cervejaria: { tipo: "Brewery", negocio: true },
  vinicola: { tipo: "Winery", negocio: true },

  // Onde ficar
  hotel: { tipo: "Hotel", negocio: true },
  pousada: { tipo: "BedAndBreakfast", negocio: true },
  chale: { tipo: "LodgingBusiness", negocio: true },
  camping: { tipo: "Campground", negocio: true },

  // Natureza
  praca: { tipo: "Park", negocio: false },
  parque: { tipo: "Park", negocio: false },
  mirante: { tipo: "TouristAttraction", negocio: false },
  cascata: { tipo: "TouristAttraction", negocio: false },
  trilha: { tipo: "TouristAttraction", negocio: false },

  // Turismo rural
  fazenda: { tipo: "TouristAttraction", negocio: true },
  produtor: { tipo: "LocalBusiness", negocio: true },
  cavalgada: { tipo: "TouristAttraction", negocio: true },
  "pesque-pague": { tipo: "TouristAttraction", negocio: true },

  // Cultura e história
  museu: { tipo: "Museum", negocio: false },
  igreja: { tipo: "Church", negocio: false },
  "ponto-historico": { tipo: "TouristAttraction", negocio: false },
  teatro: { tipo: "PerformingArtsTheater", negocio: true },
  artesanato: { tipo: "Store", negocio: true },

  // Lazer e esporte
  academia: { tipo: "ExerciseGym", negocio: true },
  piscina: { tipo: "TouristAttraction", negocio: true },
  quadra: { tipo: "SportsActivityLocation", negocio: true },
  kids: { tipo: "TouristAttraction", negocio: true },
  passeio: { tipo: "TouristAttraction", negocio: true },

  // Compras
  loja: { tipo: "Store", negocio: true },
  mercado: { tipo: "GroceryStore", negocio: true },
  feira: { tipo: "Store", negocio: true },

  // Serviços
  beleza: { tipo: "HealthAndBeautyBusiness", negocio: true },
  saude: { tipo: "LocalBusiness", negocio: true },
  oficina: { tipo: "AutoRepair", negocio: true },
  "outros-servicos": { tipo: "LocalBusiness", negocio: true },
};

/** Como o buscador escreve os dias; a posição é a mesma do banco. */
const DIAS_EM_INGLES = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

/**
 * Põe o "https://" quando quem cadastrou não pôs.
 *
 * Devolve nulo se o que sobrar não parecer endereço: melhor a ficha sem
 * a linha do que com um link que não abre.
 */
function enderecoCompleto(valor: string | null): string | null {
  const limpo = valor?.trim();
  if (!limpo) return null;
  const comProtocolo = limpo.startsWith("http") ? limpo : "https://" + limpo;
  try {
    const url = new URL(comProtocolo);
    return url.hostname.includes(".") ? url.toString() : null;
  } catch {
    return null;
  }
}

/** "18:00:00" vira "18:00". Minuto basta; segundo é ruído. */
function hora(valor: string): string {
  return valor.slice(0, 5);
}

/**
 * A ficha de um lugar, pronta para virar JSON na página.
 *
 * Devolve nulo quando não há o mínimo — nome e endereço ou coordenada.
 * Ficha sem onde fica não ajuda ninguém a achar nada.
 */
export function fichaDoLugar(local: LocalCompleto): object | null {
  const temOnde =
    Boolean(local.endereco) || (local.lat != null && local.lng != null);
  if (!local.nome || !temOnde) return null;

  const { tipo, negocio } = TIPOS[local.categoria?.slug ?? ""] ?? {
    tipo: "LocalBusiness",
    negocio: true,
  };

  // O bairro entra na rua porque o vocabulário do buscador não tem campo
  // para bairro: "addressLocality" é a cidade. Pôr Feitoria Nova ali
  // faria o Google entender que o lugar fica numa cidade chamada
  // Feitoria Nova.
  const endereco = [local.endereco, local.numero, local.bairro]
    .filter(Boolean)
    .join(", ");

  const fotos = [
    local.capa_url,
    ...(local.fotos ?? []).map((f) => f.url),
  ].filter(Boolean) as string[];

  // "sameAs" só aceita endereço completo. No banco esses campos vêm como
  // a pessoa digitou — "www.brasarestaurante.com.br", "@brasarestauranteiv" —
  // e assim o Google descarta a linha em vez de seguir o link.
  const redes = [
    enderecoCompleto(local.site),
    local.instagram
      ? "https://instagram.com/" + usuarioInstagram(local.instagram)
      : null,
    enderecoCompleto(local.facebook),
  ].filter(Boolean) as string[];

  // Um horário por dia e faixa. Dia sem linha no banco é dia fechado, e
  // dia fechado não vira linha aqui: a ausência já diz isso.
  const horarios = (local.horarios ?? [])
    .filter((h) => h.abre && h.fecha)
    .map((h) => ({
      "@type": "OpeningHoursSpecification",
      dayOfWeek: DIAS_EM_INGLES[h.dia_semana],
      opens: hora(h.abre),
      closes: hora(h.fecha),
    }));

  const ficha: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": tipo,
    "@id": `${SITE}/local/${local.slug}`,
    url: `${SITE}/local/${local.slug}`,
    name: local.nome,
  };

  if (local.resumo || local.descricao) {
    ficha.description = local.resumo || local.descricao;
  }
  if (fotos.length) ficha.image = fotos;
  if (local.telefone) ficha.telephone = local.telefone;
  if (redes.length) ficha.sameAs = redes;
  if (negocio && local.faixa_preco) ficha.priceRange = local.faixa_preco;
  if (horarios.length) ficha.openingHoursSpecification = horarios;

  if (endereco || local.cidade) {
    ficha.address = {
      "@type": "PostalAddress",
      ...(endereco ? { streetAddress: endereco } : {}),
      addressLocality: local.cidade ?? "Ivoti",
      addressRegion: local.uf ?? "RS",
      ...(local.cep ? { postalCode: local.cep } : {}),
      addressCountry: "BR",
    };
  }

  if (local.lat != null && local.lng != null) {
    ficha.geo = {
      "@type": "GeoCoordinates",
      latitude: local.lat,
      longitude: local.lng,
    };
  }

  return ficha;
}

/* ------------------------------------------------------------------ */
/* A ficha de um evento                                                */
/* ------------------------------------------------------------------ */

/**
 * A ficha de um evento, pronta para virar JSON na página.
 *
 * O buscador exige três coisas: nome, quando começa e onde acontece.
 * Sem qualquer uma delas a ficha é recusada inteira, então ela só sai
 * quando as três existem.
 *
 * O que não é exigido também não é inventado. O preço, por exemplo: o
 * cadastro de evento não tem campo de preço, e a Caminhada das Estações
 * tem duas tabelas — grátis para quem mora em Ivoti, R$ 20 para quem
 * vem de fora. Isso cabe na descrição, em português, e não numa linha
 * de preço que teria de escolher uma das duas e mentir na outra.
 */
export function fichaDoEvento(evento: EventoNaTela): object | null {
  const lugar = evento.local;
  const onde = lugar?.nome ?? evento.local_texto;
  if (!evento.titulo || !evento.inicio || !onde) return null;

  const local: Record<string, unknown> = {
    "@type": "Place",
    name: onde,
  };

  const rua = [lugar?.endereco, lugar?.numero, lugar?.bairro]
    .filter(Boolean)
    .join(", ");

  // Endereço sempre presente, mesmo magro: o buscador prefere recusar
  // um "Place" sem endereço nenhum, e a cidade a gente sempre sabe.
  local.address = {
    "@type": "PostalAddress",
    ...(rua ? { streetAddress: rua } : {}),
    addressLocality: lugar?.cidade ?? "Ivoti",
    addressRegion: lugar?.uf ?? "RS",
    addressCountry: "BR",
  };

  if (lugar?.lat != null && lugar?.lng != null) {
    local.geo = {
      "@type": "GeoCoordinates",
      latitude: lugar.lat,
      longitude: lugar.lng,
    };
  }

  // Para onde o buscador manda quem clicar. A página do lugar é melhor
  // que a agenda: ela fala deste evento e de mais nada em volta.
  const pagina = lugar?.slug ? `${SITE}/local/${lugar.slug}` : `${SITE}/agenda`;

  const ficha: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: evento.titulo,
    startDate: evento.inicio,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
    location: local,
    url: evento.url || pagina,
  };

  if (evento.fim) ficha.endDate = evento.fim;
  if (evento.descricao) ficha.description = evento.descricao;
  if (evento.imagem_url) ficha.image = [evento.imagem_url];

  return ficha;
}
