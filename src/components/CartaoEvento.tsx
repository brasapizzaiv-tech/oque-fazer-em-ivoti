"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { contar } from "@/lib/contar";
import { quandoPorExtenso } from "@/lib/horarios";
import type { EventoNaTela } from "@/lib/eventos";

/**
 * As visualizações já contadas nesta visita.
 *
 * Fora do componente de propósito: em desenvolvimento o React monta cada
 * componente duas vezes para achar erro, e um controle interno contaria em
 * dobro. Número inflado é o que menos se pode ter num painel que serve para
 * vender.
 */
const jaContados = new Set<string>();

export default function CartaoEvento({ evento }: { evento: EventoNaTela }) {
  useEffect(() => {
    if (jaContados.has(evento.id)) return;
    jaContados.add(evento.id);
    contar("evento_visto", {
      local: evento.local_id ?? undefined,
      alvo: evento.id,
    });
  }, [evento.id, evento.local_id]);

  const onde = evento.local?.nome ?? evento.local_texto;

  return (
    <article className="flex gap-3 border-2 border-carvalho bg-creme p-3">
      <Carimbo quando={evento.inicio} />

      <div className="min-w-0 flex-1">
        <h3 className="leading-tight font-semibold">{evento.titulo}</h3>
        <p className="mt-0.5 text-sm text-tinta/55">
          {quandoPorExtenso(evento.inicio)}
        </p>
        {onde &&
          (evento.local ? (
            <Link
              href={`/local/${evento.local.slug}`}
              className="text-sm font-medium text-mata-700 hover:underline"
            >
              {onde}
            </Link>
          ) : (
            <p className="text-sm text-tinta/55">{onde}</p>
          ))}
      </div>

      {evento.imagem_url && (
        <div className="relative hidden h-16 w-20 shrink-0 overflow-hidden rounded-xl sm:block">
          <Image
            src={evento.imagem_url}
            alt=""
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
      )}
    </article>
  );
}

/** O dia e o mês num bloco, como numa folhinha de parede. */
function Carimbo({ quando }: { quando: string }) {
  const data = new Date(quando);
  const formatar = (opcoes: Intl.DateTimeFormatOptions) =>
    new Intl.DateTimeFormat("pt-BR", {
      timeZone: "America/Sao_Paulo",
      ...opcoes,
    }).format(data);

  return (
    <div className="grid h-14 w-14 shrink-0 place-items-center border border-carvalho/20 bg-cal-sombra leading-none">
      <div className="text-center">
        <p className="text-lg font-bold text-mata-800">
          {formatar({ day: "2-digit" })}
        </p>
        <p className="text-[11px] text-mata-600 uppercase">
          {formatar({ month: "short" }).replace(".", "")}
        </p>
      </div>
    </div>
  );
}
