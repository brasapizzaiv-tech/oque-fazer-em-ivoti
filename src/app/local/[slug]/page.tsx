import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import CardLocal from "@/components/CardLocal";
import Mapa from "@/components/Mapa";
import SeloAberto from "@/components/SeloAberto";
import Galeria from "@/components/Galeria";
import { localPorSlug, locaisParecidos } from "@/lib/locais";
import { porDia } from "@/lib/horarios";
import { linkRota } from "@/lib/geo";
import {
  faixaPreco,
  linkWhatsapp,
  reais,
  telefoneBonito,
  usuarioInstagram,
} from "@/lib/texto";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: PageProps<"/local/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const local = await localPorSlug(slug);
  if (!local) return { title: "Lugar não encontrado" };

  return {
    title: local.nome,
    description:
      local.resumo ??
      local.descricao?.slice(0, 160) ??
      `${local.nome} em Ivoti, RS.`,
    openGraph: {
      title: local.nome,
      description: local.resumo ?? undefined,
      images: local.capa_url ? [local.capa_url] : undefined,
    },
  };
}

export default async function PaginaLocal({
  params,
}: PageProps<"/local/[slug]">) {
  const { slug } = await params;
  const local = await localPorSlug(slug);

  if (!local || local.status !== "publicado") notFound();

  const parecidos = await locaisParecidos(local);
  const semana = porDia(local.horarios);
  const whats = linkWhatsapp(
    local.whatsapp,
    `Oi! Vi vocês no site "O que fazer em Ivoti".`,
  );
  const insta = usuarioInstagram(local.instagram);
  const endereco = [local.endereco, local.numero, local.bairro]
    .filter(Boolean)
    .join(", ");

  // Cardápio / serviços agrupados por seção.
  const secoes = new Map<string, typeof local.itens>();
  for (const item of local.itens) {
    const chave = item.secao ?? "";
    if (!secoes.has(chave)) secoes.set(chave, []);
    secoes.get(chave)!.push(item);
  }

  return (
    <article className="mx-auto max-w-5xl px-4 py-6">
      <nav className="text-sm text-tinta/50">
        <Link href="/explorar" className="hover:text-mata-700">
          Explorar
        </Link>
        {local.categoria && (
          <>
            {" · "}
            <Link
              href={`/explorar?categoria=${local.categoria.slug}`}
              className="hover:text-mata-700"
            >
              {local.categoria.nome}
            </Link>
          </>
        )}
      </nav>

      <Galeria
        capa={local.capa_url}
        fotos={local.fotos}
        nome={local.nome}
        emoji={local.categoria?.emoji ?? "📍"}
      />

      <header className="mt-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h1 className="text-3xl font-bold">{local.nome}</h1>
            <p className="mt-1 text-sm text-tinta/55">
              {local.categoria?.nome}
              {local.bairro ? ` · ${local.bairro}` : ""}
              {local.faixa_preco ? ` · ${faixaPreco(local.faixa_preco)}` : ""}
            </p>
          </div>
          <SeloAberto horarios={local.horarios} />
        </div>

        {local.resumo && (
          <p className="mt-3 text-lg text-tinta/75">{local.resumo}</p>
        )}
      </header>

      {/* ---- botões de ação ---- */}
      <div className="mt-5 flex flex-wrap gap-2">
        <a
          href={linkRota(local)}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-full bg-mata-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-mata-700"
        >
          🧭 Como chegar
        </a>
        {whats && (
          <a
            href={whats}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-mata-200 bg-white px-5 py-2.5 text-sm font-semibold text-mata-700 transition hover:bg-mata-50"
          >
            💬 WhatsApp
          </a>
        )}
        {local.telefone && (
          <a
            href={`tel:${local.telefone.replace(/\D/g, "")}`}
            className="rounded-full border border-mata-200 bg-white px-5 py-2.5 text-sm font-semibold text-mata-700 transition hover:bg-mata-50"
          >
            📞 {telefoneBonito(local.telefone)}
          </a>
        )}
        {insta && (
          <a
            href={`https://instagram.com/${insta}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-mata-200 bg-white px-5 py-2.5 text-sm font-semibold text-mata-700 transition hover:bg-mata-50"
          >
            📷 @{insta}
          </a>
        )}
        {local.site && (
          <a
            href={local.site.startsWith("http") ? local.site : `https://${local.site}`}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full border border-mata-200 bg-white px-5 py-2.5 text-sm font-semibold text-mata-700 transition hover:bg-mata-50"
          >
            🌐 Site
          </a>
        )}
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_320px]">
        <div className="space-y-8">
          {local.descricao && (
            <section>
              <h2 className="text-lg font-semibold">Sobre</h2>
              <p className="mt-2 whitespace-pre-wrap text-tinta/75">
                {local.descricao}
              </p>
            </section>
          )}

          {local.tags.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold">O que tem por lá</h2>
              <div className="mt-3 flex flex-wrap gap-2">
                {local.tags.map((t) => (
                  <span
                    key={t.id}
                    className="rounded-full bg-mata-50 px-3 py-1.5 text-sm text-mata-800"
                  >
                    {t.emoji} {t.nome}
                  </span>
                ))}
              </div>
            </section>
          )}

          {local.itens.length > 0 && (
            <section>
              <h2 className="text-lg font-semibold">
                {local.categoria?.slug === "hospedagem"
                  ? "Acomodações"
                  : "Cardápio e serviços"}
              </h2>
              <div className="mt-3 space-y-5">
                {[...secoes.entries()].map(([secao, itens]) => (
                  <div key={secao}>
                    {secao && (
                      <h3 className="text-sm font-semibold text-mata-700 uppercase">
                        {secao}
                      </h3>
                    )}
                    <ul className="mt-2 divide-y divide-mata-50 rounded-xl border border-mata-100 bg-white">
                      {itens.map((i) => (
                        <li
                          key={i.id}
                          className="flex items-start justify-between gap-4 p-3"
                        >
                          <div>
                            <p className="font-medium">{i.nome}</p>
                            {i.descricao && (
                              <p className="text-sm text-tinta/60">
                                {i.descricao}
                              </p>
                            )}
                          </div>
                          {i.preco != null && (
                            <span className="shrink-0 font-semibold text-mata-700">
                              {reais(Number(i.preco))}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ---- coluna lateral ---- */}
        <aside className="space-y-6">
          <section className="rounded-2xl border border-mata-100 bg-white p-4">
            <h2 className="font-semibold">Horários</h2>
            {local.horarios.length === 0 ? (
              <p className="mt-2 text-sm text-tinta/55">
                Ainda não informaram.
              </p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {semana.map((d) => (
                  <li key={d.dia} className="flex justify-between gap-3">
                    <span className="text-tinta/60">{d.nome}</span>
                    <span
                      className={
                        d.fechado ? "text-tinta/35" : "font-medium text-tinta"
                      }
                    >
                      {d.fechado ? "Fechado" : d.faixas.join(" · ")}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          {endereco && (
            <section className="rounded-2xl border border-mata-100 bg-white p-4">
              <h2 className="font-semibold">Endereço</h2>
              <p className="mt-1 text-sm text-tinta/70">
                {endereco}
                <br />
                {local.cidade} · {local.uf}
              </p>
              {local.lat != null && local.lng != null && (
                <div className="mt-3">
                  <Mapa
                    locais={[local]}
                    altura="h-48"
                    focoSlug={local.slug}
                  />
                </div>
              )}
              <a
                href={linkRota(local)}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-3 block rounded-lg bg-mata-50 py-2 text-center text-sm font-semibold text-mata-700"
              >
                Abrir rota no Google Maps
              </a>
            </section>
          )}
        </aside>
      </div>

      {parecidos.length > 0 && (
        <section className="mt-12">
          <h2 className="text-lg font-semibold">Parecidos com esse</h2>
          <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {parecidos.map((l) => (
              <CardLocal key={l.id} local={l} />
            ))}
          </div>
        </section>
      )}

      <p className="mt-10 text-center text-xs text-tinta/40">
        É o dono desse lugar?{" "}
        <Link href="/painel" className="underline hover:text-mata-700">
          Assuma o perfil e mantenha as informações em dia
        </Link>
        .
      </p>
    </article>
  );
}
