import { NOME_DO_SITE } from "@/lib/marca";

// ============================================================
// Roteiros: paradas, rota e compartilhamento
// ============================================================

export type Parada = {
  slug: string;
  nome: string;
  /** Horário previsto de chegada, quando o Guia sugeriu um. */
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
export function linksWaze(
  paradas: Parada[],
): { parada: Parada; url: string }[] {
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
export function linkWhatsappDoRoteiro(
  titulo: string,
  endereco: string,
): string {
  const texto = `${titulo} — roteiro no ${NOME_DO_SITE}:\n${endereco}`;
  return `https://wa.me/?text=${encodeURIComponent(texto)}`;
}

/**
 * Lê o roteiro que o Guia escreveu no fim da resposta.
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
          slug: enderecoCurto(comHora[2]),
        };
      }
      return { slug: enderecoCurto(limpo) };
    })
    .filter((p) => p.slug.length > 0);

  return { limpo: texto.replace(marcador, "").trim(), paradas };
}

/**
 * Texto livre vira endereço curto: "Ivoti em um dia" -> "ivoti-em-um-dia".
 *
 * Serve a dois donos: o Guia às vezes devolve o endereço de um lugar com
 * acento, e o título de um roteiro pronto precisa virar o endereço da
 * página dele. É a mesma transformação, então mora num lugar só.
 *
 * Fica aqui, e não junto das consultas de roteiro, porque este arquivo não
 * depende do servidor — a tela de montagem roda no navegador e precisa dele.
 */
export function enderecoCurto(bruto: string, limite = 0): string {
  let saida = "";
  for (const c of bruto.normalize("NFD")) {
    const cp = c.codePointAt(0) ?? 0;
    if (cp >= 0x300 && cp <= 0x36f) continue;
    saida += c;
  }
  const curto = saida
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

  return limite > 0 ? curto.slice(0, limite) : curto;
}

/**
 * O resumo de uma linha que abre o roteiro: "5 paradas · cerca de 6 horas ·
 * 9,4 km".
 *
 * A distância é a soma dos trechos entre paradas consecutivas, em linha reta.
 * A rua real é sempre mais longa, então o número sai com uma folga de 30% —
 * é o fator que costuma aproximar distância reta de distância rodada em
 * cidade pequena, e prometer menos do que se roda seria pior do que
 * arredondar para cima.
 *
 * O tempo é estimativa declarada: 45 minutos em cada parada mais o
 * deslocamento a 30 km/h, que é o que se anda numa cidade com semáforo e
 * lombada. Por isso a palavra "cerca de" fica no texto e não some — ninguém
 * deve planejar o dia como se fosse horário de trem.
 */
export function resumoDoPasseio(paradas: Parada[]): string {
  const partes = [
    `${paradas.length} ${paradas.length === 1 ? "parada" : "paradas"}`,
  ];

  const metros = distanciaTotal(paradas);
  const minutosParado = paradas.length * 45;
  const minutosAndando = metros > 0 ? (metros / 1000 / 30) * 60 : 0;
  const horas = Math.round((minutosParado + minutosAndando) / 60);

  if (horas > 0) {
    partes.push(`cerca de ${horas} ${horas === 1 ? "hora" : "horas"}`);
  }
  if (metros > 0) {
    partes.push(`${(metros / 1000).toFixed(1).replace(".", ",")} km`);
  }

  return partes.join(" · ");
}

/** A soma dos trechos, com a folga de rua. Zero quando faltam coordenadas. */
function distanciaTotal(paradas: Parada[]): number {
  let total = 0;
  for (let i = 1; i < paradas.length; i++) {
    const a = paradas[i - 1];
    const b = paradas[i];
    if (a.lat == null || a.lng == null || b.lat == null || b.lng == null) {
      continue;
    }
    total += emLinhaReta(
      { lat: a.lat, lng: a.lng },
      { lat: b.lat, lng: b.lng },
    );
  }
  return total * 1.3;
}

/** Haversine: a distância em linha reta entre dois pontos, em metros. */
function emLinhaReta(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6371000;
  const rad = (g: number) => (g * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(s));
}
