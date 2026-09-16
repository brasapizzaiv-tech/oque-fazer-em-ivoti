import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import AcoesAdmin from "./AcoesAdmin";
import AcoesEvento from "./AcoesEvento";
import BotaoSair from "@/components/BotaoSair";
import { quandoPorExtenso } from "@/lib/horarios";

export const dynamic = "force-dynamic";

type LinhaAdmin = {
  id: string;
  slug: string;
  nome: string;
  status: string;
  resumo: string | null;
  bairro: string | null;
  criado_em: string;
  perfis: { nome: string | null } | null;
};

type EventoNaFila = {
  id: string;
  titulo: string;
  inicio: string;
  descricao: string | null;
  local_texto: string | null;
  local: { nome: string } | null;
};

export default async function Admin() {
  const supabase = await createClient();

  const [
    { data: analise },
    { data: publicados },
    { data: perguntas },
    { data: eventos },
  ] = await Promise.all([
      supabase
        .from("locais")
        .select("id, slug, nome, status, resumo, bairro, criado_em")
        .eq("status", "em_analise")
        .order("criado_em", { ascending: true }),
      supabase
        .from("locais")
        .select("id, slug, nome, status, resumo, bairro, criado_em")
        .eq("status", "publicado")
        .order("nome"),
      supabase
        .from("chat_conversas")
        .select("id, pergunta, criado_em")
        .order("criado_em", { ascending: false })
        .limit(30),
      supabase
        .from("eventos")
        .select("id, titulo, inicio, descricao, local_texto, local:locais(nome)")
        .eq("status", "em_analise")
        .order("inicio", { ascending: true }),
    ]);

  const naFila = (analise ?? []) as unknown as LinhaAdmin[];
  const noAr = (publicados ?? []) as unknown as LinhaAdmin[];
  const eventosNaFila = (eventos ?? []) as unknown as EventoNaFila[];

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mata-100 pb-4">
        <div>
          <h1 className="text-xl font-bold">Administração do guia</h1>
          <p className="text-sm text-tinta/55">
            Aprove os cadastros e acompanhe o que o pessoal está procurando.
          </p>
        </div>
        <div className="flex gap-2">
          <Link
            href="/admin/metricas"
            className="rounded-full border border-mata-200 px-4 py-2 text-sm font-medium hover:bg-mata-50"
          >
            Movimento
          </Link>
          <Link
            href="/admin/planos"
            className="rounded-full border border-sol-300 bg-sol-50 px-4 py-2 text-sm font-semibold text-sol-900 hover:bg-sol-100"
          >
            Planos
          </Link>
          <Link
            href="/painel"
            className="rounded-full border border-mata-200 px-4 py-2 text-sm font-medium hover:bg-mata-50"
          >
            Meu painel
          </Link>
          <BotaoSair />
        </div>
      </div>

      {/* ---- fila de aprovação ---- */}
      <section className="mt-6">
        <h2 className="font-semibold">
          Esperando aprovação{" "}
          {naFila.length > 0 && (
            <span className="ml-1 rounded-full bg-sol-500 px-2 py-0.5 text-xs text-white">
              {naFila.length}
            </span>
          )}
        </h2>

        {naFila.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-mata-200 bg-white p-6 text-center text-sm text-tinta/55">
            Nada na fila. 🎉
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {naFila.map((l) => (
              <li
                key={l.id}
                className="rounded-2xl border border-sol-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{l.nome}</p>
                    <p className="text-sm text-tinta/55">
                      {l.resumo ?? "Sem resumo"}
                      {l.bairro ? ` · ${l.bairro}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/painel/${l.id}`}
                    className="rounded-lg border border-mata-200 px-3 py-1.5 text-sm font-medium hover:bg-mata-50"
                  >
                    Ver cadastro
                  </Link>
                </div>
                <AcoesAdmin id={l.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- eventos esperando ---- */}
      <section className="mt-10">
        <h2 className="font-semibold">
          Eventos esperando aprovação{" "}
          {eventosNaFila.length > 0 && (
            <span className="ml-1 rounded-full bg-sol-500 px-2 py-0.5 text-xs text-white">
              {eventosNaFila.length}
            </span>
          )}
        </h2>

        {eventosNaFila.length === 0 ? (
          <p className="mt-3 rounded-xl border border-dashed border-mata-200 bg-white p-6 text-center text-sm text-tinta/55">
            Nenhum evento na fila.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {eventosNaFila.map((e) => (
              <li
                key={e.id}
                className="rounded-2xl border border-sol-200 bg-white p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{e.titulo}</p>
                    <p className="text-sm text-tinta/55">
                      {quandoPorExtenso(e.inicio)}
                      {e.local?.nome
                        ? ` · ${e.local.nome}`
                        : e.local_texto
                          ? ` · ${e.local_texto}`
                          : ""}
                    </p>
                    {e.descricao && (
                      <p className="mt-1 line-clamp-2 text-sm text-tinta/70">
                        {e.descricao}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/painel/eventos/${e.id}`}
                    className="shrink-0 rounded-lg border border-mata-200 px-3 py-1.5 text-sm font-medium hover:bg-mata-50"
                  >
                    Ver / editar
                  </Link>
                </div>
                <AcoesEvento id={e.id} />
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- no ar ---- */}
      <section className="mt-10">
        <h2 className="font-semibold">No ar ({noAr.length})</h2>
        {noAr.length === 0 ? (
          <p className="mt-3 text-sm text-tinta/55">
            Nenhum local publicado ainda.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {noAr.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between gap-2 rounded-xl border border-mata-100 bg-white px-3 py-2 text-sm"
              >
                <Link href={`/local/${l.slug}`} className="truncate font-medium">
                  {l.nome}
                </Link>
                <Link
                  href={`/painel/${l.id}`}
                  className="shrink-0 text-xs text-mata-700 underline"
                >
                  editar
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- o que perguntam pro guia ---- */}
      <section className="mt-10">
        <h2 className="font-semibold">Últimas perguntas ao guia</h2>
        <p className="text-sm text-tinta/55">
          Bom termômetro do que falta cadastrar na cidade.
        </p>
        {(perguntas ?? []).length === 0 ? (
          <p className="mt-3 text-sm text-tinta/55">Ninguém perguntou ainda.</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm">
            {(perguntas ?? []).map((p) => (
              <li
                key={p.id}
                className="rounded-lg bg-white px-3 py-2 text-tinta/75"
              >
                “{p.pergunta}”
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
