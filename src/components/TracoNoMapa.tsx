"use client";

import { useEffect } from "react";
import { useMap } from "@vis.gl/react-google-maps";
import type { Caminho } from "@/dados/caminhos";

/**
 * Desenha um caminho sobre o mapa.
 *
 * Não existe componente de linha no pacote do Google Maps que usamos — ele
 * cobre mapa, marcador e janelinha, e para o resto entrega o mapa cru. Então
 * a linha é criada à mão e retirada na limpeza: sem isso, trocar de caminho
 * empilharia um traçado sobre o outro.
 *
 * São duas linhas, uma sobre a outra: a de baixo, grossa e creme, separa o
 * caminho do verde do satélite e do cinza das estradas; a de cima é o
 * vermelho torii da marca. Um traço vermelho sozinho some sobre telhado.
 */
export default function TracoNoMapa({
  caminho,
  enquadrar = true,
}: {
  caminho: Caminho;
  /** Ajusta o mapa para o caminho caber inteiro. */
  enquadrar?: boolean;
}) {
  const mapa = useMap();

  useEffect(() => {
    if (!mapa) return;

    const pontos = caminho.tracado.map(([lat, lng]) => ({ lat, lng }));

    const contorno = new google.maps.Polyline({
      path: pontos,
      strokeColor: "#FFFFFF",
      strokeOpacity: 0.95,
      strokeWeight: 9,
      zIndex: 1,
      map: mapa,
    });

    const linha = new google.maps.Polyline({
      path: pontos,
      strokeColor: "#c8362b",
      strokeOpacity: 1,
      strokeWeight: 4.5,
      zIndex: 2,
      map: mapa,
    });

    if (enquadrar) {
      const limites = new google.maps.LatLngBounds();
      for (const p of pontos) limites.extend(p);
      mapa.fitBounds(limites, 40);
    }

    return () => {
      contorno.setMap(null);
      linha.setMap(null);
    };
  }, [mapa, caminho, enquadrar]);

  return null;
}
