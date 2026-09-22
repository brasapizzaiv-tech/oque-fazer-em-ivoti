"use client";

import {
  AdvancedMarker,
  APIProvider,
  Map,
  Marker,
} from "@vis.gl/react-google-maps";
import { IVOTI } from "@/lib/geo";
import { MAP_ID, PINO_MODERNO } from "@/lib/mapa-config";

const CHAVE = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";
// Sem Map ID o Google recusa o pino personalizado; ai usamos o classico.

/**
 * Mapa em que o dono clica pra marcar onde fica o estabelecimento.
 * O pino pode ser arrastado pra ajustar fino.
 */
export default function EscolherPosicao({
  lat,
  lng,
  onMudar,
}: {
  lat: number | null;
  lng: number | null;
  onMudar: (lat: number, lng: number) => void;
}) {
  if (!CHAVE) {
    return (
      <p className="aviso-painel p-4 text-[14px]">
        O mapa aparece aqui assim que a chave do Google Maps for configurada no
        site. Por enquanto, preencha o endereço em texto.
      </p>
    );
  }

  const posicao = lat != null && lng != null ? { lat, lng } : null;

  return (
    <div>
      <p className="mb-2 text-sm texto-suave">
        {posicao
          ? "Arraste o pino para ajustar a posição exata."
          : "Toque no mapa para marcar onde fica."}
      </p>
      <APIProvider apiKey={CHAVE} language="pt-BR" region="BR">
        <div className="h-64 overflow-hidden rounded-xl">
          <Map
            mapId={MAP_ID || undefined}
            defaultCenter={posicao ?? IVOTI}
            defaultZoom={posicao ? 17 : 14}
            gestureHandling="greedy"
            mapTypeControl={false}
            streetViewControl={false}
            fullscreenControl={false}
            className="h-full w-full"
            onClick={(evento) => {
              const p = evento.detail.latLng;
              if (p) onMudar(p.lat, p.lng);
            }}
          >
            {posicao &&
              (PINO_MODERNO ? (
                <AdvancedMarker
                  position={posicao}
                  draggable
                  onDragEnd={(evento) => {
                    const p = evento.latLng;
                    if (p) onMudar(p.lat(), p.lng());
                  }}
                >
                  <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-[color:var(--color-v-verde)] text-base shadow-md">
                    📍
                  </span>
                </AdvancedMarker>
              ) : (
                <Marker
                  position={posicao}
                  draggable
                  onDragEnd={(evento) => {
                    const p = evento.latLng;
                    if (p) onMudar(p.lat(), p.lng());
                  }}
                />
              ))}
          </Map>
        </div>
      </APIProvider>

      {posicao && (
        <p className="mt-2 text-xs texto-suave">
          Posição marcada: {posicao.lat.toFixed(6)}, {posicao.lng.toFixed(6)}
        </p>
      )}
    </div>
  );
}
