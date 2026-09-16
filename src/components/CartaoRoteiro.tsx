"use client";

import Link from "next/link";
import { useState } from "react";
import { contar } from "@/lib/contar";
import {
  LIMITE_DE_PARADAS,
  linkGoogleMaps,
  linksWaze,
  linkWhatsappDoRoteiro,
  type Parada,
} from "@/lib/roteiro";

/**
 * O roteiro montado, com os botões que levam a pessoa para a rua.
 *
 * Ela pode tirar uma parada antes de sair — quase todo roteiro sugerido tem
 * uma parada que não serve, e obrigar a pedir outro ao Guia seria atrito à toa.
 */
export default function CartaoRoteiro({
  titulo = "Seu roteiro",
  paradas: iniciais,
  compartilhavel = true,
}: {
  titulo?: string;
  paradas: Parada[];
  compartilhavel?: boolean;
}) {
  const [paradas, setParadas] = useState(iniciais);
  const [waze, setWaze] = useState(false);
  const [link, setLink] = useState<string | null>(null);
  const [salvando, setSalvando] = useState(false);

  const rota = linkGoogleMaps(paradas);
  const demais = paradas.length > LIMITE_DE_PARADAS;

  function tirar(slug: string) {
    setParadas((atual) => atual.filter((p) => p.slug !== slug));
  }

  /** Conta a indicação quando a pessoa realmente sai daqui para a rua. */
  function aoAbrirRota() {
    for (const p of paradas) {
      if (!p.id) continue;
      contar("clique_rota", { local: p.id });
      contar("indicacao", { local: p.id });
    }
  }

  async function salvar() {
    setSalvando(true);
    try {
      const resposta = await fetch("/api/roteiro", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          titulo,
          slugs: paradas.map((p) => p.slug),
        }),
      });
      const dados = (await resposta.json()) as { endereco?: string };
      if (dados.endereco) setLink(dados.endereco);
    } catch {
      // Sem link salvo a pessoa ainda tem a rota; não vale travar a tela.
    }
    setSalvando(false);
  }

  if (paradas.length === 0) {
    return (
      <p className="rounded-2xl border border-dashed border-mata-200 bg-white px-4 py-6 text-center text-sm text-tinta/55">
        Você tirou todas as paradas. Peça outro roteiro ao Guia.
      </p>
    );
  }

  return (
    <section className="overflow-hidden rounded-2xl border border-mata-200 bg-white">
      <header className="border-b border-mata-100 bg-mata-50 px-4 py-3">
        <h3 className="font-semibold">{titulo}</h3>
        <p className="text-sm text-tinta/60">
          {paradas.length} {paradas.length === 1 ? "parada" : "paradas"} · na ordem
        </p>
      </header>

      <ol className="divide-y divide-mata-50">
        {paradas.map((p, i) => (
          <li key={p.slug} className="flex items-center gap-3 px-4 py-3">
            <span className="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-mata-600 text-sm font-semibold text-white">
              {i + 1}
            </span>

            <div className="min-w-0 flex-1">
              <Link
                href={`/local/${p.slug}`}
                className="font-medium hover:text-mata-700"
              >
                {p.nome}
              </Link>
              <p className="text-sm text-tinta/55">
                {p.hora ? `Por volta das ${p.hora}` : ""}
                {p.hora && p.bairro ? " · " : ""}
                {p.bairro ?? ""}
              </p>
            </div>

            <button
              type="button"
              onClick={() => tirar(p.slug)}
              aria-label={`Tirar ${p.nome} do roteiro`}
              className="shrink-0 rounded-lg px-2 py-1 text-sm text-tinta/40 transition hover:bg-red-50 hover:text-red-700"
            >
              ✕
            </button>
          </li>
        ))}
      </ol>

      {demais && (
        <p className="border-t border-mata-50 bg-sol-50 px-4 py-2 text-sm text-sol-900">
          O mapa abre com as {LIMITE_DE_PARADAS} primeiras paradas — é o limite
          do Google Maps num link só.
        </p>
      )}

      <div className="flex flex-wrap gap-2 border-t border-mata-100 p-4">
        {rota && (
          <a
            href={rota}
            target="_blank"
            rel="noopener noreferrer"
            onClick={aoAbrirRota}
            className="rounded-full bg-mata-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-mata-700"
          >
            🗺️ Abrir rota no Google Maps
          </a>
        )}

        <button
          type="button"
          onClick={() => setWaze((v) => !v)}
          aria-expanded={waze}
          className="rounded-full border border-mata-200 px-4 py-2.5 text-sm font-semibold text-mata-700 transition hover:bg-mata-50"
        >
          Abrir no Waze
        </button>

        {compartilhavel && !link && (
          <button
            type="button"
            onClick={salvar}
            disabled={salvando}
            className="rounded-full border border-mata-200 px-4 py-2.5 text-sm font-semibold text-mata-700 transition hover:bg-mata-50 disabled:opacity-50"
          >
            {salvando ? "Salvando..." : "Salvar e compartilhar"}
          </button>
        )}
      </div>

      {waze && (
        <div className="border-t border-mata-100 bg-mata-50/60 px-4 py-3">
          <p className="text-sm text-tinta/65">
            O Waze abre uma parada por vez. Vá tocando na próxima conforme
            avançar no passeio.
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {linksWaze(paradas).map(({ parada, url }, i) => (
              <a
                key={parada.slug}
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => {
                  if (!parada.id) return;
                  contar("clique_rota", { local: parada.id });
                  contar("indicacao", { local: parada.id });
                }}
                className="rounded-full border border-mata-200 bg-white px-3 py-1.5 text-sm font-medium"
              >
                {i + 1}. {parada.nome}
              </a>
            ))}
          </div>
        </div>
      )}

      {link && (
        <div className="border-t border-mata-100 bg-mata-50/60 px-4 py-3">
          <p className="text-sm font-medium">Roteiro salvo 🎉</p>
          <p className="mt-1 text-sm break-all text-tinta/65">{link}</p>
          <div className="mt-2 flex flex-wrap gap-2">
            <a
              href={linkWhatsappDoRoteiro(titulo, link)}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-full bg-mata-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Mandar no WhatsApp
            </a>
            <button
              type="button"
              onClick={() => navigator.clipboard?.writeText(link)}
              className="rounded-full border border-mata-200 bg-white px-4 py-2 text-sm font-medium"
            >
              Copiar o link
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
