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
import TracoNoMapa from "./TracoNoMapa";
import type { Caminho } from "@/dados/caminhos";
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
  caminho,
  caminhos,
}: {
  locais: PontoNoMapa[];
  altura?: string;
  focoSlug?: string;
  /** Um caminho rural desenhado por cima, com o mapa enquadrado nele. */
  caminho?: Caminho;
  /** Vários caminhos desenhados juntos, sem reenquadrar o mapa. */
  caminhos?: Caminho[];
}) {
  const [pronto, setPronto] = useState(false);

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
      <div
        className={`relative ${altura} overflow-hidden rounded-2xl`}
        style={{ backgroundColor: "var(--color-reboco)" }}
      >
        {/* Enquanto os ladrilhos do Google nao chegam, a area fica cinza e
            vazia — em conexao lenta isso passa de dez segundos e parece
            defeito. Este aviso cobre o vazio e some sozinho quando o mapa
            desenha. */}
        {!pronto && (
          <div
            className="absolute inset-0 z-10 grid place-items-center text-center"
            style={{ backgroundColor: "var(--color-reboco)" }}
          >
            <div>
              <p className="text-2xl">🗺️</p>
              <p
                className="mt-2 text-[14px] font-medium"
                style={{ color: "var(--color-texto-suave)" }}
              >
                Carregando o mapa...
              </p>
            </div>
          </div>
        )}
        <Map
          onTilesLoaded={() => setPronto(true)}
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
          {caminho && <TracoNoMapa caminho={caminho} />}
          {caminhos?.map((c) => (
            <TracoNoMapa key={c.slug} caminho={c} enquadrar={false} />
          ))}
          <Conteudo
            locais={comCoordenada}
            focoSlug={focoSlug}
            enquadrarNosPinos={!caminho}
          />
        </Map>
      </div>
    </APIProvider>
  );
}

// Circulo verde usado como fundo do pino classico (sem Map ID).
const PINO_SIMPLES = {
  path: 0 as google.maps.SymbolPath, // google.maps.SymbolPath.CIRCLE
  scale: 16,
  fillColor: "#2f6b4f",
  fillOpacity: 1,
  strokeColor: "#ffffff",
  strokeWeight: 2,
};

function Conteudo({
  locais,
  focoSlug,
  enquadrarNosPinos = true,
}: {
  locais: PontoNoMapa[];
  focoSlug?: string;
  /** Desligado quando há um caminho: o enquadramento dele é que vale. */
  enquadrarNosPinos?: boolean;
}) {
  const mapa = useMap();
  const [aberto, setAberto] = useState<PontoNoMapa | null>(null);
  const [euEstou, setEuEstou] = useState<{ lat: number; lng: number } | null>(
    null,
  );

  // Enquadra todos os pinos assim que o mapa carrega.
  useEffect(() => {
    if (!mapa || locais.length === 0 || !enquadrarNosPinos) return;

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
  }, [mapa, locais, focoSlug, enquadrarNosPinos]);

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
            <span
              className="grid h-9 w-9 place-items-center rounded-full border-2 text-base shadow-md"
              style={{
                borderColor: "#fff7ea",
                backgroundColor: "var(--color-veneziana)",
              }}
            >
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
            <span
              className="block h-4 w-4 rounded-full border-2 shadow"
              style={{
                borderColor: "#fff7ea",
                backgroundColor: "var(--color-petunia)",
              }}
            />
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
            <p
              className="mt-0.5 text-xs"
              style={{ color: "var(--color-texto-suave)" }}
            >
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
                className="flex-1 rounded-[9px] px-2 py-1.5 text-center text-xs font-bold"
                style={{
                  backgroundColor: "var(--color-torii)",
                  color: "#fff7ea",
                }}
              >
                Ver
              </Link>
              <a
                href={linkRota(aberto)}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 rounded-[9px] px-2 py-1.5 text-center text-xs font-bold"
                style={{
                  border: "2px solid var(--color-madeira)",
                  color: "var(--color-madeira)",
                }}
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
        className="absolute bottom-4 left-4 rounded-full px-3.5 py-2 text-xs font-bold shadow-lg"
        style={{
          backgroundColor: "var(--color-superficie)",
          border: "2px solid var(--color-madeira)",
          color: "var(--color-madeira)",
        }}
      >
        📍 Onde eu estou
      </button>
    </>
  );
}
