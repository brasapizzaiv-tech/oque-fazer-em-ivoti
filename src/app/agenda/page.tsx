import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { SUPABASE_CONFIGURADO } from "@/lib/supabase/config";
import { FUSO } from "@/lib/horarios";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Agenda",
  description: "O que vai rolar em Ivoti: shows, feiras, festas e encontros.",
};

type EventoNaLista = {
  id: string;
  titulo: string;
  descricao: string | null;
  inicio: string;
  fim: string | null;
  local_texto: string | null;
  imagem_url: string | null;
  url: string | null;
  local: { slug: string; nome: string } | null;
};

export default async function Agenda() {
  const eventos = await proximosEventos();

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="text-2xl font-bold">Agenda de Ivoti</h1>
      <p className="mt-1 text-sm text-tinta/60">
        Shows, feiras, festas e tudo que tem hora marcada.
      </p>

      {eventos.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-mata-200 bg-white p-10 text-center">
          <p className="text-3xl">📅</p>
          <p className="mt-2 font-semibold">Nada marcado por enquanto</p>
          <p className="mt-1 text-sm text-tinta/60">
            Vai rolar alguma coisa? Quem tem perfil no guia pode cadastrar o
            evento pelo painel.
          </p>
          <Link
            href="/painel"
            className="mt-5 inline-block rounded-full bg-mata-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Cadastrar um evento
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {eventos.map((e) => (
            <li
              key={e.id}
              className="flex gap-4 rounded-2xl border border-mata-100 bg-white p-4"
            >
              <DataCarimbo quando={e.inicio} />

              <div className="min-w-0 flex-1">
                <h2 className="leading-tight font-semibold">{e.titulo}</h2>
                <p className="mt-0.5 text-sm text-tinta/55">
                  {hora(e.inicio)}
                  {e.local ? (
                    <>
                      {" · "}
                      <Link
                        href={`/local/${e.local.slug}`}
                        className="hover:text-mata-700"
                      >
                        {e.local.nome}
                      </Link>
                    </>
                  ) : e.local_texto ? (
                    ` · ${e.local_texto}`
                  ) : null}
                </p>
                {e.descricao && (
                  <p className="mt-1.5 line-clamp-2 text-sm text-tinta/70">
                    {e.descricao}
                  </p>
                )}
              </div>

              {e.imagem_url && (
                <div className="relative hidden h-20 w-28 shrink-0 overflow-hidden rounded-xl sm:block">
                  <Image
                    src={e.imagem_url}
                    alt={e.titulo}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

async function proximosEventos(): Promise<EventoNaLista[]> {
  if (!SUPABASE_CONFIGURADO) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("eventos")
    .select(
      "id, titulo, descricao, inicio, fim, local_texto, imagem_url, url, local:locais(slug, nome)",
    )
    .eq("status", "publicado")
    .gte("inicio", new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString())
    .order("inicio", { ascending: true })
    .limit(60);
  return (data ?? []) as unknown as EventoNaLista[];
}

function DataCarimbo({ quando }: { quando: string }) {
  const data = new Date(quando);
  const dia = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    day: "2-digit",
  }).format(data);
  const mes = new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    month: "short",
  }).format(data);

  return (
    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-mata-50 leading-none">
      <div className="text-center">
        <p className="text-lg font-bold text-mata-800">{dia}</p>
        <p className="text-[11px] text-mata-600 uppercase">
          {mes.replace(".", "")}
        </p>
      </div>
    </div>
  );
}

function hora(quando: string) {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: FUSO,
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(quando));
}
