import { ImageResponse } from "next/og";

/**
 * A imagem que aparece quando alguem manda o link do guia no WhatsApp.
 *
 * Um guia de cidade e feito de imagem: link sem foto no grupo do bairro vira
 * um retangulo de texto que ninguem toca. Esta e a imagem padrao, do site
 * inteiro — a pagina de cada estabelecimento tem a propria, com a foto do
 * lugar, e passa na frente desta.
 *
 * Desenhada com forma e letra, sem emoji de proposito: emoji dependeria de
 * baixar uma fonte inteira de emoji na hora de gerar, e uma falha ali sairia
 * como imagem quebrada no exato momento em que alguem esta compartilhando.
 */
export const alt = "O Guia de Ivoti — onde comer, beber e passear na cidade";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Imagem() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#fbf8f3",
          padding: 72,
        }}
      >
        {/* A faixa verde no topo repete a cor do cabeçalho do site, para o
            cartão e a página parecerem a mesma coisa. */}
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: 18,
              background: "#147a59",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {/* A folha do cabeçalho, desenhada com cantos: no site ela é o
                emoji 🌿, que aqui exigiria baixar uma fonte de emoji inteira
                só para isto. Um quadrado com dois cantos redondos e dois
                vivos dá a mesma silhueta, sem depender de nada. */}
            <div
              style={{
                width: 30,
                height: 30,
                background: "#d5f2e4",
                borderRadius: "2px 60% 2px 60%",
              }}
            />
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: 30, fontWeight: 700, color: "#1c1a17" }}>
              O Guia de Ivoti
            </div>
            <div style={{ fontSize: 20, color: "#147a59", fontWeight: 600 }}>
              oguiaivoti.com.br
            </div>
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 18 }}>
          <div
            style={{
              fontSize: 78,
              fontWeight: 700,
              color: "#114e3b",
              lineHeight: 1.05,
              letterSpacing: -2,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* Duas linhas como dois blocos, e nao um <br />: o gerador da
                imagem exige display explicito em qualquer caixa com mais de
                um filho, e a quebra contava como filho. */}
            <div>Onde comer, beber</div>
            <div>e passear em Ivoti</div>
          </div>
          <div style={{ fontSize: 32, color: "#4a453e", lineHeight: 1.3 }}>
            Estabelecimentos, eventos, promoções e roteiros prontos — com
            horário de hoje e rota no mapa.
          </div>
        </div>

        <div style={{ display: "flex", gap: 12 }}>
          {["Gastronomia", "Passeios", "Agenda", "Roteiros"].map((t) => (
            <div
              key={t}
              style={{
                fontSize: 24,
                color: "#106249",
                background: "#d5f2e4",
                padding: "10px 22px",
                borderRadius: 999,
              }}
            >
              {t}
            </div>
          ))}
        </div>
      </div>
    ),
    size,
  );
}
