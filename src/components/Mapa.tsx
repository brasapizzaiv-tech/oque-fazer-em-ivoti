"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  APIProvider,
  AdvancedMarker,
  InfoWindow,
  Map,
  Marker,
  useMap,
} from "@vis.gl/react-google-maps";
import MapaPrevia from "./MapaPrevia";
import { IVOTI, distancia, formatarDistancia, linkRota } from "@/lib/geo";
import type { LocalCompleto } from "@/lib/tipos";
import { MAP_ID, PINO_MODERNO } from "@/lib/mapa-config";

const CHAVE = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";


export type PontoNoMapa = Pick<
  LocalCompleto,
  "id" | "slug" | "nome" | "lat" | "lng" | "capa_url" | "bairro" | "resumo"
> & {
  categoria?: { nome: string; emoji: string | null } | null;
};

export default function Mapa({
  locais,
  altura = "h-[60vh]",
  focoSlug,
}: {
  locais: PontoNoMapa[];
  altura?: string;
  focoSlug?: string;
}) {
  const comCoordenada = useMemo(
    () => locais.filter((l) => l.lat != null && l.lng != null),
    [locais],
  );

  // Sem chave do Google, cai no mapa aberto — melhor do que uma caixa vazia.
  if (!CHAVE) {
    return <MapaPrevia locais={comCoordenada} altura={altura} />;
  }

  return (
    <APIProvider apiKey={CHAVE} language="pt-BR" region="BR">
      <div className={`relative ${altura} overflow-hidden rounded-2xl`}>
        <Map
          mapId={MAP_ID || undefined}
          defaultCenter={IVOTI}
          defaultZoom={14}
          gestureHandling="greedy"
          disableDefaultUI={false}
          mapTypeControl={false}
          streetViewControl={false}
          fullscreenControl={false}
          className="h-full w-full"
        >
          <Conteudo locais={comCoordenada} focoSlug={focoSlug} />
        </Map>
      </div>
    </APIProvider>
  );
}

// Circulo verde usado como fundo do pino classico (sem Map ID).
const PINO_SIMPLES = {
  path: 0 as google.maps.SymbolPath, // google.maps.SymbolPath.CIRCLE
  scale: 16,
  fillColor: "#147a59",
  fillOpacity: 1,
  strokeColor: "#ffffff",
  strokeWeight: 2,
};

function Conteudo({
  locais,
  focoSlug,
}: {
  locais: PontoNoMapa[];
  focoSlug?: string;
}) {
  const mapa = useMap();
  const [aberto, setAberto] = useState<PontoNoMapa | null>(null);
  const [euEstou, setEuEstou] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  // Enquadra todos os pinos assim que o mapa carrega.
  useEffect(() => {
    if (!mapa || locais.length === 0) return;

    if (focoSlug) {
      const alvo = locais.find((l) => l.slug === focoSlug);
      if (alvo) {
        mapa.setCenter({ lat: alvo.lat!, lng: alvo.lng! });
        mapa.setZoom(16);
        return;
      }
    }

    if (locais.length === 1) {
      mapa.setCenter({ lat: locais[0].lat!, lng: locais[0].lng! });
      mapa.setZoom(16);
      return;
    }

    const limites = new google.maps.LatLngBounds();
    for (const l of locais) limites.extend({ lat: l.lat!, lng: l.lng! });
    mapa.fitBounds(limites, 48);
  }, [mapa, locais, focoSlug]);

  function ondeEstou() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const meu = {
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        };
        setEuEstou(meu);
        mapa?.setCenter(meu);
        mapa?.setZoom(15);
      },
      () => {},
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <>
      {locais.map((l) =>
        PINO_MODERNO ? (
          <AdvancedMarker
            key={l.id}
            position={{ lat: l.lat!, lng: l.lng! }}
            title={l.nome}
            // Precisa ser dito em voz alta: so passar onClick nao torna o
            // pino clicavel, e ele fica bonito e inerte.
            clickable
            onClick={() => setAberto(l)}
          >
            <span className="grid h-9 w-9 place-items-center rounded-full border-2 border-white bg-mata-600 text-base shadow-md">
              {l.categoria?.emoji ?? "📍"}
            </span>
          </AdvancedMarker>
        ) : (
          <Marker
            key={l.id}
            position={{ lat: l.lat!, lng: l.lng! }}
            title={l.nome}
            label={{ text: l.categoria?.emoji ?? "📍", fontSize: "18px" }}
            icon={PINO_SIMPLES}
            onClick={() => setAberto(l)}
          />
        ),
      )}

      {euEstou &&
        (PINO_MODERNO ? (
          <AdvancedMarker position={euEstou} title="Voce esta aqui">
            <span className="block h-4 w-4 rounded-full border-2 border-white bg-sol-500 shadow" />
          </AdvancedMarker>
        ) : (
          <Marker position={euEstou} title="Voce esta aqui" />
        ))}

      {aberto && (
        <InfoWindow
          position={{ lat: aberto.lat!, lng: aberto.lng! }}
          onCloseClick={() => setAberto(null)}
          headerDisabled
        >
          <div className="w-56 p-1">
            {aberto.capa_url && (
              <div className="relative mb-2 h-24 w-full overflow-hidden rounded-lg">
                <Image
                  src={aberto.capa_url}
                  alt={aberto.nome}
                  fill
                  sizes="224px"
                  className="object-cover"
                />
              </div>
            )}
            <p className="text-sm leading-tight font-semibold">{aberto.nome}</p>
            <p className="mt-0.5 text-xs text-tinta/55">
              {aberto.categoria?.nome}
              {aberto.bairro ? ` · ${aberto.bairro}` : ""}
              {euEstou
                ? ` · ${formatarDistancia(
                    distancia(euEstou, { lat: aberto.lat!, lng: aberto.lng! }),
                  )}`
                : ""}
            </p>
            <div className="mt-2 flex gap-2">
              <Link
                href={`/local/${aberto.slug}`}
                className="flex-1 rounded-lg bg-mata-600 px-2 py-1.5 text-center text-xs font-semibold text-white"
              >
                Ver
              </Link>
              <a
                href={linkRota(aberto)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-lg border border-mata-200 px-2 py-1.5 text-center text-xs font-semibold text-mata-700"
              >
                Rota
              </a>
            </div>
          </div>
        </InfoWindow>
      )}

      <button
        type="button"
        onClick={ondeEstou}
        className="absolute bottom-4 left-4 rounded-full bg-white px-3 py-2 text-xs font-semibold shadow-lg"
      >
        📍 Onde eu estou
      </button>
    </>
  );
}
