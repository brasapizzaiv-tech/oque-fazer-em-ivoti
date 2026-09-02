// Centro de Ivoti (RS) — usado pra centralizar o mapa e como ponto de
// referencia quando o visitante nao libera a localizacao.
export const IVOTI = { lat: -29.5917, lng: -51.1611 };

/** Distancia em metros entre dois pontos (formula de Haversine). */
export function distancia(
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

/** 850 -> "850 m" | 2300 -> "2,3 km" */
export function formatarDistancia(metros: number): string {
  if (metros < 1000) return `${Math.round(metros)} m`;
  return `${(metros / 1000).toFixed(1).replace(".", ",")} km`;
}

/** Link do Google Maps que abre a rota ate o local. */
export function linkRota(destino: {
  lat: number | null;
  lng: number | null;
  nome?: string;
  endereco?: string | null;
}): string {
  if (destino.lat != null && destino.lng != null) {
    return `https://www.google.com/maps/dir/?api=1&destination=${destino.lat},${destino.lng}`;
  }
  const busca = encodeURIComponent(
    `${destino.nome ?? ""} ${destino.endereco ?? ""} Ivoti RS`.trim(),
  );
  return `https://www.google.com/maps/dir/?api=1&destination=${busca}`;
}
