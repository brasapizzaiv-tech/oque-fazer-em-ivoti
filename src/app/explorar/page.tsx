import Link from "next/link";
import type { Metadata } from "next";
import BarraBusca from "@/components/BarraBusca";
import CardLocal from "@/components/CardLocal";
import { buscarLocais, listarCategorias, listarTags } from "@/lib/locais";

export const revalidate = 60;

export const metadata: Metadata = {
  title: "Explorar",
  description: "Todos os lugares de Ivoti: filtre por tipo, etiqueta e horário.",
};

export default async function Explorar({
  searchParams,
}: PageProps<"/explorar">) {
  const params = await searchParams;

  const q = texto(params.q);
  const categoria = texto(params.categoria);
  const aberto = texto(params.aberto) === "1";
  const tags = lista(params.tag);

  const [categorias, todasTags, locais] = await Promise.all([
    listarCategorias(),
    listarTags(),
    buscarLocais({ q, categoria, tags, abertoAgora: aberto }),
  ]);

  const principais = categorias.filter((c) => c.pai_id === null);
  const atual = categorias.find((c) => c.slug === categoria);
  const filhas = atual
    ? categorias.filter((c) => c.pai_id === atual.id)
    : [];

  // Monta uma URL mantendo os filtros que já estão valendo.
  function url(mudanca: Record<string, string | string[] | undefined>) {
    const base: Record<string, string | string[] | undefined> = {
      q,
      categoria,
      aberto: aberto ? "1" : undefined,
      tag: tags,
      ...mudanca,
    };
    const busca = new URLSearchParams();
    for (const [chave, valor] of Object.entries(base)) {
      if (!valor) continue;
      if (Array.isArray(valor)) valor.forEach((v) => busca.append(chave, v));
      else busca.set(chave, valor);
    }
    const s = busca.toString();
    return s ? `/explorar?${s}` : "/explorar";
  }

  const temFiltro = Boolean(q || categoria || aberto || tags.length);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">
        {atual ? `${atual.emoji ?? ""} ${atual.nome}` : "Explorar Ivoti"}
      </h1>

      <div className="mt-4 max-w-xl">
        <BarraBusca inicial={q ?? ""} />
      </div>

      {/* ---- filtros ---- */}
      <div className="mt-5 space-y-3">
        <Tira>
          <Chip href={url({ categoria: undefined })} ativo={!categoria}>
            Tudo
          </Chip>
          {principais.map((c) => (
            <Chip
              key={c.id}
              href={url({ categoria: c.slug })}
              ativo={categoria === c.slug}
            >
              {c.emoji} {c.nome}
            </Chip>
          ))}
        </Tira>

        {filhas.length > 0 && (
          <Tira>
            {filhas.map((c) => (
              <Chip key={c.id} href={url({ categoria: c.slug })} pequeno>
                {c.emoji} {c.nome}
              </Chip>
            ))}
          </Tira>
        )}

        <Tira>
          <Chip
            href={url({ aberto: aberto ? undefined : "1" })}
            ativo={aberto}
            pequeno
          >
            🟢 Aberto agora
          </Chip>
          {todasTags.map((t) => {
            const marcada = tags.includes(t.slug);
            return (
              <Chip
                key={t.id}
                pequeno
                ativo={marcada}
                href={url({
                  tag: marcada
                    ? tags.filter((s) => s !== t.slug)
                    : [...tags, t.slug],
                })}
              >
                {t.emoji} {t.nome}
              </Chip>
            );
          })}
        </Tira>

        {temFiltro && (
          <Link
            href="/explorar"
            className="inline-block text-sm font-medium text-mata-600 hover:underline"
          >
            Limpar filtros
          </Link>
        )}
      </div>

      {/* ---- resultados ---- */}
      <p className="mt-6 text-sm text-tinta/55">
        {locais.length === 0
          ? "Nenhum lugar encontrado"
          : `${locais.length} ${locais.length === 1 ? "lugar" : "lugares"}`}
      </p>

      {locais.length === 0 ? (
        <div className="mt-4 rounded-2xl border border-dashed border-mata-200 bg-white p-10 text-center">
          <p className="text-3xl">🤔</p>
          <p className="mt-2 font-semibold">Não achei nada com esses filtros</p>
          <p className="mt-1 text-sm text-tinta/60">
            Tente afrouxar a busca — ou pergunte pro guia, ele sempre acha
            alguma coisa.
          </p>
          <Link
            href="/chat"
            className="mt-5 inline-block rounded-full bg-mata-600 px-5 py-2.5 text-sm font-semibold text-white"
          >
            Perguntar ao guia
          </Link>
        </div>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {locais.map((l) => (
            <CardLocal key={l.id} local={l} />
          ))}
        </div>
      )}
    </div>
  );
}

function Tira({ children }: { children: React.ReactNode }) {
  return (
    <div className="sem-barra flex gap-2 overflow-x-auto pb-1">{children}</div>
  );
}

function Chip({
  href,
  children,
  ativo,
  pequeno,
}: {
  href: string;
  children: React.ReactNode;
  ativo?: boolean;
  pequeno?: boolean;
}) {
  return (
    <Link
      href={href}
      className={[
        "shrink-0 rounded-full border whitespace-nowrap transition",
        pequeno ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm font-medium",
        ativo
          ? "border-mata-600 bg-mata-600 text-white"
          : "border-mata-200 bg-white text-tinta/75 hover:bg-mata-50",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}

function texto(valor: string | string[] | undefined): string | undefined {
  if (Array.isArray(valor)) return valor[0];
  return valor || undefined;
}

function lista(valor: string | string[] | undefined): string[] {
  if (!valor) return [];
  return Array.isArray(valor) ? valor : [valor];
}
