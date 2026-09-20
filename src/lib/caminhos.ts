import type { Caminho } from "@/dados/caminhos";
import { distancia } from "./geo";

export { CAMINHOS, caminhoPorSlug } from "@/dados/caminhos";
export type { Caminho } from "@/dados/caminhos";

/** 6266 -> "6,3 km" */
export function extensaoPorExtenso(metros: number): string {
  return `${(metros / 1000).toFixed(1).replace(".", ",")} km`;
}

/**
 * Quanto tempo a pé, a passo de quem está passeando.
 *
 * 4 km/h e não os 5 km/h dos manuais: estes caminhos são de chão batido, com
 * subida, e quem vai neles para para olhar casa. Arredonda para cima, em
 * blocos de meia hora — dizer "2h14" num passeio rural é fingir uma precisão
 * que o terreno não tem.
 */
export function tempoAPe(metros: number): string {
  const horas = metros / 1000 / 4;
  const meias = Math.max(1, Math.ceil(horas * 2));
  const h = Math.floor(meias / 2);
  const meia = meias % 2 === 1;
  if (h === 0) return "30 min";
  return meia ? `${h}h30` : `${h}h`;
}

/** Quanto tempo de carro, em estrada de chão: 25 km/h de média. */
export function tempoDeCarro(metros: number): string {
  const min = Math.round((metros / 1000 / 25) * 60);
  if (min < 60) return `${Math.max(5, Math.round(min / 5) * 5)} min`;
  return `${Math.floor(min / 60)}h${String(min % 60).padStart(2, "0")}`;
}

export type LugarNoCaminho<T> = { lugar: T; metros: number; km: number };

/**
 * O ponto do trecho A-B mais próximo de P, e a fração do trecho até ele.
 *
 * Nesta escala a Terra pode ser tratada como plana; só a longitude precisa
 * encolher pelo cosseno da latitude, senão um grau de longitude valeria o
 * mesmo que um de latitude e o cálculo entortaria tudo para leste.
 */
function projetar(
  p: { lat: number; lng: number },
  a: [number, number],
  b: [number, number],
) {
  const k = Math.cos((a[0] * Math.PI) / 180);
  const px = (p.lng - a[1]) * k;
  const py = p.lat - a[0];
  const bx = (b[1] - a[1]) * k;
  const by = b[0] - a[0];
  const len2 = bx * bx + by * by;
  const t =
    len2 === 0 ? 0 : Math.max(0, Math.min(1, (px * bx + py * by) / len2));
  return {
    t,
    ponto: { lat: a[0] + t * (b[0] - a[0]), lng: a[1] + t * (b[1] - a[1]) },
  };
}

/**
 * Os lugares do guia que ficam em cima de um caminho.
 *
 * Mede contra os trechos da linha, não contra os pontos dela. A diferença
 * não é acadêmica: o traçado guardado é simplificado, e num quilômetro de
 * estrada reta ele tem dois pontos só. Medindo por ponto, uma casa no meio
 * dessa reta aparecia a 68 m da estrada quando está a 18 — a conta estava
 * medindo a distância até a esquina mais próxima, não até a estrada.
 *
 * O raio padrão é 150 m: pega a casa na beira mesmo com o traçado correndo
 * pelo meio da pista, e não arrasta o vizinho de duas quadras.
 *
 * Devolve também em que quilômetro do percurso o lugar aparece, que é o que
 * transforma uma lista de nomes numa ordem de visita.
 */
export function lugaresNoCaminho<
  T extends { lat: number | null; lng: number | null },
>(caminho: Caminho, lugares: T[], raioM = 150): LugarNoCaminho<T>[] {
  // a distância acumulada até cada ponto, calculada uma vez só
  const acumulado: number[] = [0];
  for (let i = 1; i < caminho.tracado.length; i++) {
    const [laA, loA] = caminho.tracado[i - 1];
    const [laB, loB] = caminho.tracado[i];
    acumulado[i] =
      acumulado[i - 1] +
      distancia({ lat: laA, lng: loA }, { lat: laB, lng: loB });
  }
  const total = acumulado[acumulado.length - 1];

  const achados: LugarNoCaminho<T>[] = [];

  for (const lugar of lugares) {
    if (lugar.lat == null || lugar.lng == null) continue;
    const p = { lat: lugar.lat, lng: lugar.lng };

    let perto = Infinity;
    let onde = 0;

    for (let i = 1; i < caminho.tracado.length; i++) {
      const a = caminho.tracado[i - 1];
      const b = caminho.tracado[i];
      const { t, ponto } = projetar(p, a, b);
      const d = distancia(p, ponto);
      if (d < perto) {
        perto = d;
        onde = acumulado[i - 1] + t * (acumulado[i] - acumulado[i - 1]);
      }
    }

    if (perto > raioM) continue;

    // Num circuito, o fim é o começo. Sem isto, o lugar que fica na largada
    // aparece no último quilômetro e a lista sai de trás para a frente.
    if (caminho.circuito && total - onde < 300) onde = 0;

    achados.push({
      lugar,
      metros: Math.round(perto),
      km: +(onde / 1000).toFixed(1),
    });
  }

  return achados.sort((a, b) => a.km - b.km);
}

/** O retângulo que contém o traçado, para enquadrar o mapa. */
export function moldura(caminho: Caminho) {
  const lats = caminho.tracado.map((p) => p[0]);
  const lngs = caminho.tracado.map((p) => p[1]);
  return {
    norte: Math.max(...lats),
    sul: Math.min(...lats),
    leste: Math.max(...lngs),
    oeste: Math.min(...lngs),
  };
}

/**
 * O link que abre o caminho no Google Maps.
 *
 * O Maps aceita no máximo 10 pontos por rota, então o traçado inteiro não
 * cabe. Pegamos pontos espaçados por igual ao longo do percurso: a rota que
 * o Maps traça entre eles acompanha as mesmas estradas, porque não há outro
 * jeito de ir de um ponto ao seguinte no meio do interior.
 */
export function linkDoCaminhoNoMaps(caminho: Caminho): string {
  const quantos = 9;
  const passo = (caminho.tracado.length - 1) / (quantos - 1);
  const escolhidos = Array.from(
    { length: quantos },
    (_, i) => caminho.tracado[Math.round(i * passo)],
  );

  const url = new URL("https://www.google.com/maps/dir/");
  url.searchParams.set("api", "1");
  url.searchParams.set("travelmode", "driving");
  url.searchParams.set("origin", escolhidos[0].join(","));
  url.searchParams.set(
    "destination",
    escolhidos[escolhidos.length - 1].join(","),
  );
  url.searchParams.set(
    "waypoints",
    escolhidos
      .slice(1, -1)
      .map((p) => p.join(","))
      .join("|"),
  );
  return url.toString();
}
