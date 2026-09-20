import Link from "next/link";
import { TituloBloco, TituloPainel } from "@/components/painel/pecas";
import { createClient } from "@/lib/supabase/server";
import AcoesAdmin from "./AcoesAdmin";
import AcoesEvento from "./AcoesEvento";
import TirarDoAr from "@/components/painel/TirarDoAr";
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
  desativado_em?: string | null;
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
    { data: desativados },
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
      .from("locais")
      .select(
        "id, slug, nome, status, resumo, bairro, criado_em, desativado_em",
      )
      .eq("status", "inativo")
      .order("desativado_em", { ascending: false }),
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
  const foraDoAr = (desativados ?? []) as unknown as LinhaAdmin[];
  const eventosNaFila = (eventos ?? []) as unknown as EventoNaFila[];

  return (
    <div>
      <TituloPainel apoio="Aprove os cadastros e acompanhe o que o pessoal está procurando.">
        Administração do guia
      </TituloPainel>

      {/* ---- fila de aprovação ---- */}
      <section className="mt-6">
        <TituloBloco>
          Esperando aprovação{" "}
          {naFila.length > 0 && (
            <span className="ml-1 rounded-full bg-[color:var(--color-torii)] px-2 py-0.5 text-[11px] font-bold text-[#fff7ea]">
              {naFila.length}
            </span>
          )}
        </TituloBloco>

        {naFila.length === 0 ? (
          <p className="mt-3 caixa-painel border-dashed p-6 text-center text-sm texto-suave">
            Nada na fila. 🎉
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {naFila.map((l) => (
              <li
                key={l.id}
                className="caixa-painel border-[color:var(--color-petunia)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">{l.nome}</p>
                    <p className="text-sm texto-suave">
                      {l.resumo ?? "Sem resumo"}
                      {l.bairro ? ` · ${l.bairro}` : ""}
                    </p>
                  </div>
                  <Link
                    href={`/painel/${l.id}`}
                    className="botao-vazado px-3.5 py-2 text-[14px]"
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
        <TituloBloco>
          Eventos esperando aprovação{" "}
          {eventosNaFila.length > 0 && (
            <span className="ml-1 rounded-full bg-[color:var(--color-torii)] px-2 py-0.5 text-[11px] font-bold text-[#fff7ea]">
              {eventosNaFila.length}
            </span>
          )}
        </TituloBloco>

        {eventosNaFila.length === 0 ? (
          <p className="mt-3 caixa-painel border-dashed p-6 text-center text-sm texto-suave">
            Nenhum evento na fila.
          </p>
        ) : (
          <ul className="mt-3 space-y-3">
            {eventosNaFila.map((e) => (
              <li
                key={e.id}
                className="caixa-painel border-[color:var(--color-petunia)] p-4"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold">{e.titulo}</p>
                    <p className="text-sm texto-suave">
                      {quandoPorExtenso(e.inicio)}
                      {e.local?.nome
                        ? ` · ${e.local.nome}`
                        : e.local_texto
                          ? ` · ${e.local_texto}`
                          : ""}
                    </p>
                    {e.descricao && (
                      <p className="mt-1 line-clamp-2 text-sm texto-suave">
                        {e.descricao}
                      </p>
                    )}
                  </div>
                  <Link
                    href={`/painel/eventos/${e.id}`}
                    className="shrink-0 botao-vazado px-3.5 py-2 text-[14px]"
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
        <TituloBloco>No ar ({noAr.length})</TituloBloco>
        {noAr.length === 0 ? (
          <p className="mt-3 text-sm texto-suave">
            Nenhum local publicado ainda.
          </p>
        ) : (
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {noAr.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between gap-2 border-2 border-[color:var(--color-madeira)]/30 bg-[color:var(--color-superficie)] px-3 py-2 text-[14px]"
              >
                <Link
                  href={`/local/${l.slug}`}
                  className="truncate font-medium"
                >
                  {l.nome}
                </Link>
                <span className="flex shrink-0 items-center gap-2">
                  <Link
                    href={`/painel/${l.id}`}
                    className="text-[12px] font-semibold text-[color:var(--color-torii)] underline"
                  >
                    editar
                  </Link>
                  <TirarDoAr id={l.id} nome={l.nome} ativo />
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ---- fora do ar ---- */}
      {foraDoAr.length > 0 && (
        <section className="mt-10">
          <TituloBloco>Fora do ar ({foraDoAr.length})</TituloBloco>
          <p className="text-sm texto-suave">
            Nao aparecem no guia. O cadastro, as fotos e as metricas continuam
            guardados.
          </p>
          <ul className="mt-3 grid gap-2 sm:grid-cols-2">
            {foraDoAr.map((l) => (
              <li
                key={l.id}
                className="flex items-center justify-between gap-2 caixa-painel border-dashed px-3 py-2 text-sm"
              >
                <span className="min-w-0">
                  <span className="block truncate font-medium texto-suave">
                    {l.nome}
                  </span>
                  {l.desativado_em && (
                    <span className="text-xs texto-suave">
                      desde{" "}
                      {new Date(l.desativado_em).toLocaleDateString("pt-BR")}
                    </span>
                  )}
                </span>
                <TirarDoAr id={l.id} nome={l.nome} ativo={false} />
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* ---- o que perguntam pro guia ---- */}
      <section className="mt-10">
        <TituloBloco>Últimas perguntas ao guia</TituloBloco>
        <p className="text-sm texto-suave">
          Bom termômetro do que falta cadastrar na cidade.
        </p>
        {(perguntas ?? []).length === 0 ? (
          <p className="mt-3 text-sm texto-suave">Ninguém perguntou ainda.</p>
        ) : (
          <ul className="mt-3 space-y-1 text-sm">
            {(perguntas ?? []).map((p) => (
              <li
                key={p.id}
                className="rounded-[9px] bg-[color:var(--color-superficie)] px-3 py-2 texto-suave"
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
