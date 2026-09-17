/**
 * Gera a imagem de compartilhamento do guia.
 *
 *   npm run og
 *
 * Por que um script, e nao a rota opengraph-image.tsx que o Next oferece:
 * aquela rota so sabe devolver PNG, e PNG de fotografia nao fica pequeno de
 * jeito nenhum — a versao com a foto do Portico dava 1,3 MB, e desfocar a
 * foto inteira mal tirava 20%. Imagem de compartilhamento grande demais faz
 * o WhatsApp desistir do cartao grande e mostrar a unha do lado do texto,
 * que foi o problema que comecou tudo isto.
 *
 * Entao a imagem e gerada uma vez, convertida para JPEG e versionada como
 * arquivo. O Next serve o arquivo direto, sem gerar nada a cada pedido, e o
 * desenho continua aqui no codigo: mudou a arte ou o texto, roda o comando de
 * novo e commita a imagem nova.
 *
 * Escrito com React.createElement em vez de JSX porque roda no node puro,
 * fora da compilacao do Next.
 */
import { createElement as h } from "react";
import { ImageResponse } from "next/og.js";
import sharp from "sharp";
import fs from "node:fs/promises";
import path from "node:path";

const SAIDA = path.join(process.cwd(), "src", "app", "opengraph-image.jpg");

const FOTO =
  "https://xzrneafjsapkffgkaqzl.supabase.co/storage/v1/object/public/locais/pontos/portico-de-ivoti-1.jpg";

// Acima disto o WhatsApp costuma desistir do cartao grande.
const LIMITE_KB = 300;

const VERDE = "#147a59";
const VERDE_CLARO = "#d5f2e4";

async function foto() {
  const resposta = await fetch(FOTO);
  if (!resposta.ok) throw new Error(`a foto respondeu ${resposta.status}`);
  const bytes = Buffer.from(await resposta.arrayBuffer());
  return `data:image/jpeg;base64,${bytes.toString("base64")}`;
}

/**
 * O desenho.
 *
 * Tudo o que identifica o guia fica no CENTRO. O WhatsApp nem sempre mostra o
 * cartao inteiro: muitas vezes recorta um quadrado do meio, do tamanho de uma
 * unha, e so sobrevive o que estiver ali. A primeira versao tinha a frase
 * atravessada na largura e virou um pedaco ilegivel.
 *
 * A foto e o Portico de Ivoti, que tem o nome da cidade escrito nele bem no
 * meio do quadro — some no recorte, mas o portico continua reconhecivel.
 */
function desenho(imagem) {
  const camada = {
    position: "absolute",
    top: 0,
    left: 0,
    width: 1200,
    height: 630,
  };

  return h(
    "div",
    {
      style: {
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        background: "#114e3b",
      },
    },
    h("img", { src: imagem, style: { ...camada, objectFit: "cover" } }),

    // Veu escuro. Sem ele o branco se perde no ceu claro e nas flores — e e
    // justamente no meio, onde o texto fica, que a foto e mais clara.
    h("div", {
      style: {
        ...camada,
        background:
          "linear-gradient(180deg, rgba(6,37,28,0.55) 0%, rgba(6,37,28,0.78) 55%, rgba(6,37,28,0.92) 100%)",
      },
    }),

    h(
      "div",
      {
        style: {
          position: "relative",
          width: 1200,
          height: 630,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 22,
          padding: 60,
        },
      },

      // A folha do cabecalho: quadrado com dois cantos redondos e dois vivos.
      // Emoji exigiria embutir uma fonte inteira de emoji.
      h(
        "div",
        {
          style: {
            width: 76,
            height: 76,
            borderRadius: 22,
            background: VERDE,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          },
        },
        h("div", {
          style: {
            width: 36,
            height: 36,
            background: VERDE_CLARO,
            borderRadius: "2px 60% 2px 60%",
          },
        }),
      ),

      h(
        "div",
        {
          style: {
            fontSize: 86,
            fontWeight: 700,
            color: "#ffffff",
            letterSpacing: -2,
            lineHeight: 1,
          },
        },
        "O Guia de Ivoti",
      ),

      h(
        "div",
        {
          style: {
            fontSize: 34,
            color: VERDE_CLARO,
            textAlign: "center",
            lineHeight: 1.25,
          },
        },
        "Onde comer, beber e passear na cidade",
      ),

      h(
        "div",
        {
          style: {
            marginTop: 10,
            fontSize: 26,
            color: "#ffffff",
            background: "rgba(255,255,255,0.16)",
            padding: "12px 28px",
            borderRadius: 999,
          },
        },
        "oguiaivoti.com.br",
      ),
    ),
  );
}

const imagem = await foto();

const resposta = new ImageResponse(desenho(imagem), {
  width: 1200,
  height: 630,
});
const png = Buffer.from(await resposta.arrayBuffer());

// A qualidade cai ate a imagem caber no limite. Fotografia com texto grande
// por cima aguenta bem a compressao: o que sofre sao as folhas ao fundo, que
// ninguem olha de perto num cartao de WhatsApp.
let jpeg = null;
let usada = 0;

for (const qualidade of [86, 80, 74, 68, 60]) {
  const tentativa = await sharp(png)
    .jpeg({ quality: qualidade, mozjpeg: true })
    .toBuffer();
  usada = qualidade;
  jpeg = tentativa;
  if (tentativa.length <= LIMITE_KB * 1024) break;
}

await fs.writeFile(SAIDA, jpeg);

const kb = (jpeg.length / 1024).toFixed(0);
console.log(`imagem gravada em ${path.relative(process.cwd(), SAIDA)}`);
console.log(`${kb} KB, qualidade ${usada} (limite ${LIMITE_KB} KB)`);
if (jpeg.length > LIMITE_KB * 1024) {
  console.log("AVISO: ainda acima do limite — o cartao pode sair pequeno.");
}
