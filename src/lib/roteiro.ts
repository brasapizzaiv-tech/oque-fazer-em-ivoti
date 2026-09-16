// ============================================================
// Roteiros: paradas, rota e compartilhamento
// ============================================================

export type Parada = {
  slug: string;
  nome: string;
  /** Horário previsto de chegada, quando o Gui sugeriu um. */
  hora?: string;
  lat: number | null;
  lng: number | null;
  endereco: string | null;
  bairro: string | null;
  categoria?: string | null;
  id?: string;
};

/**
 * O link do Google Maps aceita até 9 paradas entre a origem e o destino.
 * Um roteiro de dia inteiro tem quatro ou cinco, então sobra folga — mas o
 * limite existe e ignorá-lo produziria um link que simplesmente não abre.
 */
export const LIMITE_DE_PARADAS = 11;

/** Como o lugar entra no link do mapa: coordenada quando existe, endereço quando não. */
function comoChegar(p: Parada): string {
  if (p.lat != null && p.lng != null) return `${p.lat},${p.lng}`;
  const partes = [p.nome, p.endereco, p.bairro, "Ivoti", "RS"].filter(Boolean);
  return partes.join(", ");
}

/**
 * Um link só, com todas as paradas na ordem.
 *
 * A origem fica de fora de propósito: sem ela, o Google Maps usa onde a
 * pessoa está no momento em que abre — que é o que se quer, já que ela pode
 * montar o roteiro em casa e sair horas depois.
 */
export function linkGoogleMaps(paradas: Parada[]): string | null {
  const uteis = paradas.slice(0, LIMITE_DE_PARADAS);
  if (uteis.length === 0) return null;

  const destino = uteis[uteis.length - 1];
  const meio = uteis.slice(0, -1);

  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("destination", comoChegar(destino));
  if (meio.length > 0) {
    url.searchParams.set("waypoints", meio.map(comoChegar).join("|"));
  }
  url.searchParams.set("travelmode", "driving");
  return url.toString();
}

/**
 * O Waze não aceita várias paradas num link só.
 *
 * Em vez de esconder isso, devolve um link por parada, na ordem — a tela
 * mostra os botões numerados e a pessoa vai abrindo conforme avança.
 */
export function linksWaze(paradas: Parada[]): { parada: Parada; url: string }[] {
  return paradas.map((p) => {
    const url = new URL("https://www.waze.com/ul");
    if (p.lat != null && p.lng != null) {
      url.searchParams.set("ll", `${p.lat},${p.lng}`);
    } else {
      url.searchParams.set("q", comoChegar(p));
    }
    url.searchParams.set("navigate", "yes");
    return { parada: p, url: url.toString() };
  });
}

/** A mensagem pronta para mandar o roteiro no WhatsApp. */
export function linkWhatsappDoRoteiro(titulo: string, endereco: string): string {
  const texto = `${titulo} — roteiro no Guia de Ivoti:\n${endereco}`;
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

/**
 * Lê o roteiro que o Gui escreveu no fim da resposta.
 *
 * Formato: [[roteiro: 09:00 cafe-da-praca | 12:00 brasa | praca-concordia]]
 * A hora é opcional em cada parada.
 *
 * Fica no mesmo formato de colchetes duplos que os cartões de lugar já usam,
 * porque é o que o modelo já aprendeu a escrever sem errar.
 */
export function lerRoteiro(texto: string): {
  limpo: string;
  paradas: { slug: string; hora?: string }[];
} {
  const marcador = /\[\[roteiro:([^\]]+)\]\]/i;
  const achado = texto.match(marcador);
  if (!achado) return { limpo: texto, paradas: [] };

  const paradas = achado[1]
    .split("|")
    .map((pedaco) => {
      const limpo = pedaco.trim();
      // "09:00 cafe-da-praca" ou só "cafe-da-praca"
      const comHora = limpo.match(/^(\d{1,2}[:h]\d{2})\s+(.+)$/);
      if (comHora) {
        // "9h30" e "9:30" viram "09:30": hora com dois dígitos alinha na
        // coluna e evita a lista parecer torta.
        const [h, m] = comHora[1].replace("h", ":").split(":");
        return {
          hora: `${h.padStart(2, "0")}:${m}`,
          slug: normalizarSlug(comHora[2]),
        };
      }
      return { slug: normalizarSlug(limpo) };
    })
    .filter((p) => p.slug.length > 0);

  return { limpo: texto.replace(marcador, "").trim(), paradas };
}

/** O Gui às vezes devolve o endereço com acento; aqui ele volta ao formato do site. */
function normalizarSlug(bruto: string): string {
  let saida = "";
  for (const c of bruto.normalize("NFD")) {
    const cp = c.codePointAt(0) ?? 0;
    if (cp >= 0x300 && cp <= 0x36f) continue;
    saida += c;
  }
  return saida
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}
