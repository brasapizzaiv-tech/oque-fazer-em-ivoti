/**
 * Reconhece quem não é gente.
 *
 * A contagem de acessos acontece no navegador, depois de dois segundos e
 * meio — o que já descarta o rastreador simples, que nem executa o
 * programa da página. Mas há robô que executa: o do Google, o que tira
 * foto de prévia para o WhatsApp, os que medem desempenho e os que
 * copiam conteúdo.
 *
 * Esta lista não é perfeita e nunca vai ser: quem quer se esconder muda
 * a identificação. Ela pega o robô honesto, que se anuncia — e esse é a
 * maior parte.
 */
const MARCAS = [
  // os que se anunciam
  "bot",
  "crawl",
  "spider",
  "slurp",
  "scrape",
  // ferramentas e bibliotecas
  "curl",
  "wget",
  "python",
  "java/",
  "go-http",
  "axios",
  "node-fetch",
  "got/",
  "okhttp",
  "postman",
  "insomnia",
  // navegador sem tela: medição, teste, captura
  "headless",
  "phantom",
  "puppeteer",
  "playwright",
  "selenium",
  "lighthouse",
  "pagespeed",
  "chrome-lighthouse",
  // monitoramento
  "monitor",
  "uptime",
  "pingdom",
  "statuscake",
  "datadog",
  // prévia de link
  "facebookexternalhit",
  "whatsapp",
  "telegrambot",
  "twitterbot",
  "linkedinbot",
  "discordbot",
  "embedly",
  "preview",
];

/**
 * Se o visitante é robô.
 *
 * Sem identificação nenhuma também conta como robô: todo navegador manda
 * a sua, e quem não manda está escondendo alguma coisa ou é um programa
 * escrito às pressas. Nos dois casos não é a visita que o comerciante
 * quer ver no painel.
 */
export function ehRobo(identificacao: string | null): boolean {
  if (!identificacao || identificacao.trim().length < 10) return true;
  const u = identificacao.toLowerCase();
  return MARCAS.some((m) => u.includes(m));
}
