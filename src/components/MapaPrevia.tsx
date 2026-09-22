"use client";

import Link from "next/link";
import { useState } from "react";
import type { PontoNoMapa } from "./Mapa";

/**
 * Mapa de reserva, usado enquanto nao existe chave do Google Maps.
 *
 * Mostra um mapa aberto (OpenStreetMap, que nao pede chave nenhuma) com os
 * pinos do guia desenhados por cima. Serve pra ver o formato da tela; o mapa
 * de verdade — com rota, satelite e "onde eu estou" — e o do Google e entra
 * sozinho assim que a chave for configurada.
 */

// Recorte de Ivoti que o mapa mostra.
const OESTE = -51.205;
const LESTE = -51.125;
const SUL = -29.632;
const NORTE = -29.558;

const BBOX = `${OESTE},${SUL},${LESTE},${NORTE}`;

export default function MapaPrevia({
  locais,
  altura,
}: {
  locais: PontoNoMapa[];
  altura: string;
}) {
  const [aberto, setAberto] = useState<PontoNoMapa | null>(null);

  // Nesta escala (uns 8 km) a curvatura nao muda nada visivel, entao a
  // conversao de coordenada pra pixel pode ser uma regra de tres simples.
  const posicao = (l: PontoNoMapa) => ({
    left: `${((l.lng! - OESTE) / (LESTE - OESTE)) * 100}%`,
    top: `${((NORTE - l.lat!) / (NORTE - SUL)) * 100}%`,
  });

  return (
    <div>
      <div className={`relative ${altura} overflow-hidden rounded-2xl border border-mata-100`}>
        <iframe
          title="Mapa de Ivoti"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${BBOX}&layer=mapnik`}
          className="h-full w-full grayscale-[35%]"
          loading="lazy"
        />

        <div className="pointer-events-none absolute inset-0">
          {locais.map((l) => (
            <button
              key={l.id}
              type="button"
              onClick={() => setAberto(aberto?.id === l.id ? null : l)}
              style={posicao(l)}
              title={l.nome}
              className="pointer-events-auto absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full border-2 border-white bg-[color:var(--color-v-verde)] text-sm shadow-md transition hover:scale-110"
            >
              {l.categoria?.emoji ?? "📍"}
            </button>
          ))}
        </div>

        {aberto && (
          <div className="absolute right-3 bottom-3 left-3 rounded-xl bg-white p-3 shadow-xl sm:left-auto sm:w-64">
            <p className="text-sm font-semibold">{aberto.nome}</p>
            <p className="mt-0.5 text-xs texto-suave">
              {aberto.categoria?.nome}
              {aberto.bairro ? ` · ${aberto.bairro}` : ""}
            </p>
            {aberto.resumo && (
              <p className="mt-1 line-clamp-2 text-xs texto-suave">
                {aberto.resumo}
              </p>
            )}
            <div className="mt-2 flex gap-2">
              <Link
                href={`/local/${aberto.slug}`}
                className="flex-1 rounded-lg bg-[color:var(--color-v-verde)] px-2 py-1.5 text-center text-xs font-semibold text-white"
              >
                Ver
              </Link>
              <button
                type="button"
                onClick={() => setAberto(null)}
                className="rounded-lg border border-[color:var(--color-v-azul)] px-3 py-1.5 text-xs font-semibold texto-suave"
              >
                Fechar
              </button>
            </div>
          </div>
        )}
      </div>

      <p className="mt-2 text-xs texto-suave">
        Prévia com mapa aberto. O mapa definitivo é o Google Maps — com rota,
        satélite e “onde eu estou” — e entra sozinho quando a chave for
        configurada.
      </p>
    </div>
  );
}
