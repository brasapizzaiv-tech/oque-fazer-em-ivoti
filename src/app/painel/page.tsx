import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { StatusLocal } from "@/lib/tipos";

export const dynamic = "force-dynamic";

const SITUACAO: Record<
  StatusLocal,
  { texto: string; cor: string; dica: string }
> = {
  rascunho: {
    texto: "Rascunho",
    cor: "bg-tinta/10 text-tinta/70",
    dica: "Só você enxerga. Termine de preencher e mande para análise.",
  },
  em_analise: {
    texto: "Em análise",
    cor: "bg-sol-100 text-sol-800",
    dica: "Recebemos! Em breve publicamos no guia.",
  },
  publicado: {
    texto: "No ar",
    cor: "bg-mata-100 text-mata-800",
    dica: "Está aparecendo no guia para todo mundo.",
  },
  rejeitado: {
    texto: "Precisa de ajuste",
    cor: "bg-red-100 text-red-800",
    dica: "Veja o motivo, corrija e mande de novo.",
  },
};

export default async function Painel() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: locais } = await supabase
    .from("locais")
    .select("id, slug, nome, status, capa_url, motivo_rejeicao, categoria:categorias(nome, emoji)")
    .eq("dono_id", user?.id ?? "")
    .order("criado_em", { ascending: false });

  const lista = locais ?? [];

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-lg font-semibold">Meus locais</h1>
        <Link
          href="/painel/novo"
          className="rounded-full bg-mata-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-mata-700"
        >
          + Cadastrar um local
        </Link>
      </div>

      {lista.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-mata-200 bg-white p-10 text-center">
          <p className="text-3xl">🏪</p>
          <p className="mt-2 font-semibold">Você ainda não cadastrou nada</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-tinta/60">
            Cadastre seu estabelecimento, atrativo ou ponto turístico. Leva
            poucos minutos e é grátis.
          </p>
          <Link
            href="/painel/novo"
            className="mt-5 inline-block rounded-full bg-mata-600 px-6 py-3 font-semibold text-white"
          >
            Começar
          </Link>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {lista.map((l) => {
            const s = SITUACAO[l.status as StatusLocal];
            const categoria = l.categoria as unknown as {
              nome: string;
              emoji: string | null;
            } | null;

            return (
              <li
                key={l.id}
                className="flex items-center gap-4 rounded-2xl border border-mata-100 bg-white p-4"
              >
                <div className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-xl bg-mata-50 text-2xl">
                  {l.capa_url ? (
                    <Image
                      src={l.capa_url}
                      alt={l.nome}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  ) : (
                    (categoria?.emoji ?? "📍")
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="font-semibold">{l.nome}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${s.cor}`}
                    >
                      {s.texto}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-tinta/55">{s.dica}</p>
                  {l.status === "rejeitado" && l.motivo_rejeicao && (
                    <p className="mt-1 text-sm text-red-700">
                      Motivo: {l.motivo_rejeicao}
                    </p>
                  )}
                </div>

                <div className="flex shrink-0 flex-col gap-1.5 sm:flex-row">
                  {l.status === "publicado" && (
                    <Link
                      href={`/local/${l.slug}`}
                      className="rounded-lg border border-mata-200 px-3 py-2 text-center text-sm font-medium hover:bg-mata-50"
                    >
                      Ver no site
                    </Link>
                  )}
                  <Link
                    href={`/painel/${l.id}`}
                    className="rounded-lg bg-mata-600 px-4 py-2 text-center text-sm font-semibold text-white hover:bg-mata-700"
                  >
                    Editar
                  </Link>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
