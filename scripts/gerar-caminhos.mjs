// ============================================================
// Os caminhos rurais de Ivoti, de GPX/KMZ para codigo
// ============================================================
// Roda com "npm run caminhos" e le tudo o que estiver em dados/gpx/.
// Aceita .gpx, .kml e .kmz (que e um .kml zipado).
//
// Por que virar codigo e nao linha no banco:
//
// Um tracado tem centenas de pontos e nunca muda — a estrada da Picada 48 e
// a mesma de trinta anos atras. Guardar isso no banco seria pagar uma
// consulta a cada visita para receber sempre a mesma resposta, e ainda
// deixar voce sem jeito de corrigir um ponto errado sem SQL.
//
// Como codigo, o tracado entra na pagina junto com o HTML, aparece no
// historico do git quando alguem mexe, e para trocar um caminho basta trocar
// o arquivo na pasta e rodar o gerador de novo.
// ============================================================

import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { inflateRawSync } from "node:zlib";
import { join, extname, basename } from "node:path";

const ENTRADA = "dados/gpx";
const SAIDA = "src/dados/caminhos.ts";

/** Metros entre dois pontos. Formula de haversine. */
function metros([la1, lo1], [la2, lo2]) {
  const R = 6371000;
  const rad = (g) => (g * Math.PI) / 180;
  const dLa = rad(la2 - la1);
  const dLo = rad(lo2 - lo1);
  const a =
    Math.sin(dLa / 2) ** 2 +
    Math.cos(rad(la1)) * Math.cos(rad(la2)) * Math.sin(dLo / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

/**
 * Tira os pontos que nao mudam o desenho.
 *
 * Os arquivos vem com um ponto a cada poucos metros — bom para um GPS,
 * exagero para uma linha na tela: em 700 pontos, metade cai sobre o mesmo
 * pixel. Douglas-Peucker guarda os pontos que fazem a curva e descarta os
 * que estao praticamente em cima da reta entre os vizinhos.
 */
function simplificar(pts, toleranciaM = 4) {
  if (pts.length < 3) return pts;

  // distancia do ponto ate a reta AB, em metros, o suficiente nesta escala
  function daReta(p, a, b) {
    const k = Math.cos((a[0] * Math.PI) / 180);
    const px = (p[1] - a[1]) * k;
    const py = p[0] - a[0];
    const bx = (b[1] - a[1]) * k;
    const by = b[0] - a[0];
    const len2 = bx * bx + by * by;
    if (len2 === 0) return metros(p, a);
    const t = Math.max(0, Math.min(1, (px * bx + py * by) / len2));
    const perto = [a[0] + t * (b[0] - a[0]), a[1] + t * (b[1] - a[1])];
    return metros(p, perto);
  }

  function recursao(ini, fim) {
    let pior = 0;
    let iPior = 0;
    for (let i = ini + 1; i < fim; i++) {
      const d = daReta(pts[i], pts[ini], pts[fim]);
      if (d > pior) {
        pior = d;
        iPior = i;
      }
    }
    if (pior <= toleranciaM) return [pts[ini]];
    return [...recursao(ini, iPior), ...recursao(iPior, fim)];
  }

  return [...recursao(0, pts.length - 1), pts[pts.length - 1]];
}

/** Le um .gpx: rtept/trkpt com lat e lon em atributos. */
function lerGpx(xml) {
  const nome = (xml.match(/<name>([^<]*)<\/name>/) || [])[1] ?? "";
  const pontos = [
    ...xml.matchAll(/<(?:rtept|trkpt) lat="([-\d.]+)" lon="([-\d.]+)"/g),
  ].map((m) => [Number(m[1]), Number(m[2])]);
  const marcos = [
    ...xml.matchAll(
      /<wpt lat="([-\d.]+)" lon="([-\d.]+)">[\s\S]*?<name>([^<]*)<\/name>/g,
    ),
  ].map((m) => ({ lat: Number(m[1]), lng: Number(m[2]), nome: m[3] }));
  return { nome, pontos, marcos };
}

/** Le um .kml: coordinates com lon,lat,alt separados por espaco. */
function lerKml(xml) {
  const nome = (xml.match(/<name>([^<]*)<\/name>/) || [])[1] ?? "";

  let pontos = [];
  const marcos = [];

  for (const [, dentro] of xml.matchAll(
    /<Placemark>([\s\S]*?)<\/Placemark>/g,
  )) {
    const rotulo = (dentro.match(/<name>([^<]*)<\/name>/) || [])[1] ?? "";
    const bruto = (dentro.match(/<coordinates>([\s\S]*?)<\/coordinates>/) ||
      [])[1];
    if (!bruto) continue;

    const trios = bruto
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((t) => t.split(",").map(Number));

    if (/<LineString>/.test(dentro)) {
      // o KML escreve longitude primeiro; o resto do mundo, latitude
      pontos = trios.map(([lon, lat]) => [lat, lon]);
    } else if (/<Point>/.test(dentro)) {
      const [lon, lat] = trios[0];
      marcos.push({ lat, lng: lon, nome: rotulo });
    }
  }

  return { nome, pontos, marcos };
}

/**
 * Descompacta o .kmz e devolve o .kml de dentro.
 *
 * Um .kmz e um .zip com outro nome, e e por esse nome que o descompactador
 * do Windows se recusa a abrir ("apenas .zip"). Entao lemos o zip aqui: o
 * indice fica no fim do arquivo, cada entrada diz onde comeca e se esta
 * comprimida, e o zlib faz o resto. Sao trinta linhas e nao dependem de
 * nenhum programa instalado na maquina.
 */
function abrirKmz(caminho) {
  const buf = readFileSync(caminho);

  // o indice central termina com a assinatura PK\x05\x06, perto do fim
  let fim = -1;
  for (let i = buf.length - 22; i >= 0; i--) {
    if (buf.readUInt32LE(i) === 0x06054b50) {
      fim = i;
      break;
    }
  }
  if (fim < 0) throw new Error(caminho + ": nao parece um zip");

  const quantas = buf.readUInt16LE(fim + 10);
  let p = buf.readUInt32LE(fim + 16);

  for (let n = 0; n < quantas; n++) {
    const metodo = buf.readUInt16LE(p + 10);
    const comprimido = buf.readUInt32LE(p + 20);
    const tamNome = buf.readUInt16LE(p + 28);
    const tamExtra = buf.readUInt16LE(p + 30);
    const tamComentario = buf.readUInt16LE(p + 32);
    const inicio = buf.readUInt32LE(p + 42);
    const nome = buf.toString("utf8", p + 46, p + 46 + tamNome);

    if (nome.toLowerCase().endsWith(".kml")) {
      // o cabecalho local repete nome e extra, com tamanhos proprios
      const nomeLocal = buf.readUInt16LE(inicio + 26);
      const extraLocal = buf.readUInt16LE(inicio + 28);
      const dados = buf.subarray(
        inicio + 30 + nomeLocal + extraLocal,
        inicio + 30 + nomeLocal + extraLocal + comprimido,
      );
      // 0 = guardado como esta, 8 = deflate; e so o que o KMZ usa
      return (metodo === 0 ? dados : inflateRawSync(dados)).toString("utf8");
    }

    p += 46 + tamNome + tamExtra + tamComentario;
  }

  throw new Error("nenhum .kml dentro de " + caminho);
}

function semAcento(s) {
  return s.normalize("NFD").replace(/[̀-ͯ]/g, "");
}

function apelido(nome, arquivo) {
  const base = nome || basename(arquivo, extname(arquivo));
  return semAcento(base)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// ------------------------------------------------------------------

const arquivos = readdirSync(ENTRADA)
  .filter((f) => /\.(gpx|kml|kmz)$/i.test(f))
  .sort();

const caminhos = [];

for (const arquivo of arquivos) {
  const cheio = join(ENTRADA, arquivo);
  const ext = extname(arquivo).toLowerCase();
  const xml = ext === ".kmz" ? abrirKmz(cheio) : readFileSync(cheio, "utf8");
  const { nome, pontos, marcos } = ext === ".gpx" ? lerGpx(xml) : lerKml(xml);

  if (pontos.length < 2) {
    console.warn("  " + arquivo + ": sem tracado, pulei");
    continue;
  }

  let extensao = 0;
  for (let i = 1; i < pontos.length; i++)
    extensao += metros(pontos[i - 1], pontos[i]);

  const enxutos = simplificar(pontos);
  const fecha = metros(pontos[0], pontos[pontos.length - 1]);

  caminhos.push({
    slug: apelido(nome, arquivo),
    nome: nome || arquivo,
    arquivo,
    metros: Math.round(extensao),
    circuito: fecha < 60,
    // 5 casas decimais = pouco mais de um metro: o que o desenho precisa
    tracado: enxutos.map(([la, lo]) => [+la.toFixed(5), +lo.toFixed(5)]),
    partida: marcos[0]
      ? {
          lat: +marcos[0].lat.toFixed(6),
          lng: +marcos[0].lng.toFixed(6),
          nome: marcos[0].nome,
        }
      : {
          lat: +pontos[0][0].toFixed(6),
          lng: +pontos[0][1].toFixed(6),
          nome: "Início",
        },
  });

  console.log(
    "  " +
      arquivo.padEnd(24) +
      nome.padEnd(26) +
      (extensao / 1000).toFixed(2) +
      " km   " +
      pontos.length +
      " → " +
      enxutos.length +
      " pontos" +
      (fecha < 60 ? "   circuito" : ""),
  );
}

const ts =
  '// GERADO POR "npm run caminhos" — não edite à mão.\n' +
  "//\n" +
  "// A fonte são os arquivos em dados/gpx/. Para corrigir um traçado, troque\n" +
  "// o arquivo lá e rode o gerador de novo.\n" +
  "\n" +
  "export type Caminho = {\n" +
  "  slug: string;\n" +
  "  nome: string;\n" +
  "  /** O arquivo de onde veio, para quem for conferir. */\n" +
  "  arquivo: string;\n" +
  "  /** Extensão do traçado original, antes de simplificar. */\n" +
  "  metros: number;\n" +
  "  /** Termina onde começou. */\n" +
  "  circuito: boolean;\n" +
  "  /** [latitude, longitude], sem os pontos que não mudam o desenho. */\n" +
  "  tracado: [number, number][];\n" +
  "  partida: { lat: number; lng: number; nome: string };\n" +
  "};\n" +
  "\n" +
  "export const CAMINHOS: Caminho[] = " +
  JSON.stringify(caminhos, null, 2) +
  ";\n" +
  "\n" +
  "export function caminhoPorSlug(slug: string): Caminho | undefined {\n" +
  "  return CAMINHOS.find((c) => c.slug === slug);\n" +
  "}\n";

writeFileSync(SAIDA, ts);
console.log(
  "\n" +
    caminhos.length +
    " caminhos → " +
    SAIDA +
    " (" +
    (ts.length / 1024).toFixed(1) +
    " KB)",
);
