import Mapa from "@/components/Mapa";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ContarAcesso from "@/components/ContarAcesso";
import type { PromocaoNaTela } from "@/components/CartaoPromocao";
import Favoritar from "@/components/enxaimel/Favoritar";
import Galeria from "@/components/vidro/Galeria";
import {
  AcoesDoLocal,
  CardPromocao,
  ContatosDoLocal,
  ConviteAoGuia,
  FileiraDePetunias,
  LinhaEvento,
  TituloSecao,
} from "@/components/vidro/blocos";
import { IconeVoltar } from "@/components/vidro/icones";
import { CardVidro, SeloStatus } from "@/components/vidro/pecas";
import type { TipoMetrica } from "@/lib/metricas";
import { faixaPreco } from "@/lib/texto";
import { quandoVale } from "@/lib/promocoes";
import { localPorSlug } from "@/lib/locais";
import { porDia, situacao } from "@/lib/horarios";
import { createClient } from "@/lib/supabase/server";
import { eventosVisiveis } from "@/lib/eventos";
import { SUPABASE_CONFIGURADO } from "@/lib/supabase/config";
import { linkRota } from "@/lib/geo";
import { linkWhatsapp, usuarioInstagram } from "@/lib/texto";

export const revalidate = 120;

export async function generateMetadata({
  params,
}: PageProps<"/local/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const local = await localPorSlug(slug);
  if (!local) return { title: "Lugar não encontrado" };

  return {
    title: local.nome,
    description: local.resumo ?? undefined,
    openGraph: {
      title: local.nome,
      description: local.resumo ?? undefined,
      images: local.capa_url ? [local.capa_url] : undefined,
    },
  };
}

async function promocoesDoLocal(localId: string) {
  if (!SUPABASE_CONFIGURADO) return [];
  const supabase = await createClient();
  const { data } = await supabase.rpc("promocoes_de_hoje", {
    p_local: localId,
  });
  return (data ?? []) as PromocaoNaTela[];
}

export default async function PaginaLocal({
  params,
}: PageProps<"/local/[slug]">) {
  const { slug } = await params;
  const local = await localPorSlug(slug);

  if (!local || local.status !== "publicado") notFound();

  const [eventos, promocoes] = await Promise.all([
    eventosVisiveis({ local: local.id, limite: 5 }),
    promocoesDoLocal(local.id),
  ]);

  const { aberto, texto: textoDoHorario } = situacao(local.horarios ?? []);
  const semana = porDia(local.horarios ?? []);
  const endereco = [local.endereco, local.numero, local.bairro]
    .filter(Boolean)
    .join(", ");

  // O cardápio vem numa lista só; as seções voltam a existir aqui. Sem
  // isto, "Entradas" e "Sobremesas" viravam uma lista corrida de trinta
  // linhas, que é justamente o que a seção evita.
  const secoes = new Map<string, typeof local.itens>();
  for (const item of local.itens ?? []) {
    const chave = item.secao ?? "";
    secoes.set(chave, [...(secoes.get(chave) ?? []), item]);
  }

  // Só entra o que o estabelecimento preencheu: botão que não leva a lugar
  // nenhum ensina a pessoa a desconfiar dos outros.
  const whats = linkWhatsapp(local.whatsapp, "Oi! Vi vocês no guia da cidade.");
  const insta = usuarioInstagram(local.instagram);
  const acoes = [
    whats && {
      rotulo: "WhatsApp",
      href: whats,
      icone: "💬",
      tipo: "clique_whatsapp" as const,
    },
    (local.lat != null || local.endereco) && {
      rotulo: "Como chegar",
      href: linkRota(local),
      icone: "🧭",
      tipo: "clique_rota" as const,
    },
    insta && {
      rotulo: "Instagram",
      href: `https://instagram.com/${insta}`,
      icone: "📷",
      tipo: "clique_instagram" as const,
    },
    (local.itens ?? []).length > 0 && {
      rotulo: "Cardápio",
      href: "#cardapio",
      icone: "📋",
    },
  ].filter(Boolean) as {
    rotulo: string;
    href: string;
    icone: string;
    tipo?: TipoMetrica;
  }[];

  return (
    <div className="mx-auto lg:max-w-[1440px] lg:px-16 lg:pt-6 lg:pb-12">
      <div className="lg:grid lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-8">
          <ContarAcesso local={local.id} />

          <Galeria
            capa={local.capa_url}
            fotos={local.fotos ?? []}
            nome={local.nome}
            aoLado={
              <>
                <Link
                  href="/explorar"
                  aria-label="Voltar"
                  className="grid h-11 w-11 place-items-center rounded-full"
                  style={{
                    backgroundColor: "rgba(20, 14, 10, 0.55)",
                    backdropFilter: "blur(10px)",
                    color: "#FFFFFF",
                  }}
                >
                  <IconeVoltar tamanho={22} />
                </Link>
                <Favoritar slug={local.slug} />
              </>
            }
          />

          <div className="px-4 pt-4">
            <div className="flex flex-wrap items-center gap-2">
              <SeloStatus tipo={aberto ? "aberto" : "fechado"} />
              <span
                className="text-[13px]"
                style={{ color: "var(--color-v-texto-suave)" }}
              >
                {textoDoHorario}
              </span>
            </div>

            <h1
              className="mt-2 text-[26px] leading-tight font-bold"
              style={{
                color: "var(--color-v-texto)",
                fontFamily: "var(--fonte-titulo-nova)",
              }}
            >
              {local.nome}
            </h1>

            <p
              className="mt-1 text-[14px]"
              style={{ color: "var(--color-v-texto-suave)" }}
            >
              {local.categoria?.nome}
              {local.faixa_preco ? ` · ${faixaPreco(local.faixa_preco)}` : ""}
              {endereco ? ` · ${endereco}` : ""}
            </p>

            {local.resumo && (
              <p
                className="mt-3 text-[14px]"
                style={{ color: "var(--color-v-texto)" }}
              >
                {local.resumo}
              </p>
            )}

            <div className="mt-4">
              <AcoesDoLocal acoes={acoes} local={local.id} />
              <ContatosDoLocal
                telefone={local.telefone}
                site={local.site}
                local={local.id}
              />
            </div>
          </div>

          {promocoes.length > 0 && (
            <section className="px-4 pt-6">
              <TituloSecao selo="promocao">Promoções de hoje</TituloSecao>
              <div className="mt-3 space-y-3">
                {promocoes.map((p) => (
                  <CardPromocao
                    key={p.id}
                    href="#"
                    titulo={p.titulo}
                    quando={quandoVale(p)}
                  />
                ))}
              </div>
            </section>
          )}

          <FileiraDePetunias />

          {local.descricao && (
            <section className="px-4 pt-5">
              <TituloSecao>Sobre</TituloSecao>
              <p
                className="mt-2 text-[14px] whitespace-pre-line"
                style={{ color: "var(--color-v-texto)" }}
              >
                {local.descricao}
              </p>
            </section>
          )}

          {/* As etiquetas dizem o que nao cabe na categoria: leva cartao,
              bom para crianca, tem opcao sem gluten. Sao elas que o filtro
              do Explorar usa, e sumir com elas aqui deixava o visitante sem
              saber por que o lugar apareceu na busca dele. */}
          {(local.tags ?? []).length > 0 && (
            <section className="px-4 pt-6">
              <TituloSecao>O que tem por lá</TituloSecao>
              <div className="mt-3 flex flex-wrap gap-2">
                {local.tags.map((t) => (
                  <span
                    key={t.id}
                    className="vidro-leve inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[13px] font-medium"
                    style={{ color: "var(--color-v-texto)" }}
                  >
                    {t.emoji} {t.nome}
                  </span>
                ))}
              </div>
            </section>
          )}

          {semana.some((d) => !d.fechado) && (
            <section className="px-4 pt-6">
              <TituloSecao>Horários</TituloSecao>
              <CardVidro className="mt-2 px-4 py-2">
                <dl>
                  {semana.map((d) => (
                    <div
                      key={d.dia}
                      className="flex justify-between border-b py-1.5 text-[14px] last:border-b-0"
                      style={{ borderColor: "rgba(43, 35, 32, 0.14)" }}
                    >
                      <dt style={{ color: "var(--color-v-texto)" }}>
                        {d.nome}
                      </dt>
                      <dd style={{ color: "var(--color-v-texto-suave)" }}>
                        {d.fechado ? "Fechado" : d.faixas.join(", ")}
                      </dd>
                    </div>
                  ))}
                </dl>
              </CardVidro>
            </section>
          )}

          {eventos.length > 0 && (
            <section className="px-4 pt-6">
              <TituloSecao selo="evento">Próximos eventos</TituloSecao>
              <div className="mt-3 space-y-3">
                {eventos.map((e) => {
                  const d = new Date(e.inicio);
                  return (
                    <LinhaEvento
                      key={e.id}
                      titulo={e.titulo}
                      dia={new Intl.DateTimeFormat("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                        day: "2-digit",
                      }).format(d)}
                      mes={new Intl.DateTimeFormat("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                        month: "short",
                      })
                        .format(d)
                        .replace(".", "")}
                      hora={new Intl.DateTimeFormat("pt-BR", {
                        timeZone: "America/Sao_Paulo",
                        hour: "2-digit",
                        minute: "2-digit",
                      }).format(d)}
                      onde={e.local_texto ?? undefined}
                      descricao={e.descricao}
                      foto={e.imagem_url}
                    />
                  );
                })}
              </div>
            </section>
          )}

          {(local.itens ?? []).length > 0 && (
            <section id="cardapio" className="px-4 pt-6">
              <TituloSecao>Cardápio</TituloSecao>
              {[...secoes.entries()].map(([secao, itens]) => (
                <div key={secao} className="mt-3">
                  {secao && (
                    <p
                      className="mb-1.5 text-[11px] font-bold tracking-[0.1em] uppercase"
                      style={{ color: "var(--color-v-texto-suave)" }}
                    >
                      {secao}
                    </p>
                  )}
                  <CardVidro className="px-4 py-2">
                    <ul>
                      {itens.map((item) => (
                        <li
                          key={item.id}
                          className="flex justify-between gap-3 border-b py-2 text-[14px] last:border-b-0"
                          style={{ borderColor: "rgba(43, 35, 32, 0.14)" }}
                        >
                          <span>
                            <span
                              className="block font-medium"
                              style={{ color: "var(--color-v-texto)" }}
                            >
                              {item.nome}
                            </span>
                            {item.descricao && (
                              <span
                                className="block text-[13px]"
                                style={{ color: "var(--color-v-texto-suave)" }}
                              >
                                {item.descricao}
                              </span>
                            )}
                          </span>
                          {item.preco != null && (
                            <span
                              className="shrink-0 font-bold"
                              style={{ color: "var(--color-v-texto)" }}
                            >
                              R${" "}
                              {Number(item.preco).toFixed(2).replace(".", ",")}
                            </span>
                          )}
                        </li>
                      ))}
                    </ul>
                  </CardVidro>
                </div>
              ))}
            </section>
          )}

          <div className="px-4 pt-7 pb-8 lg:px-0">
            <ConviteAoGuia nome={local.nome} />
          </div>
        </div>

        {/* No computador o mapa fica do lado, acompanhando a rolagem: quem
            le a pagina de um lugar esta decidindo se vai ate la, e a
            pergunta seguinte e sempre onde fica. */}
        {local.lat != null && local.lng != null && (
          <aside className="hidden lg:col-span-4 lg:block">
            <div className="sticky top-[104px] space-y-3">
              <div className="vidro overflow-hidden p-2">
                <Mapa
                  locais={[local]}
                  focoSlug={local.slug}
                  altura="h-[340px]"
                />
              </div>
              <a
                href={linkRota(local)}
                target="_blank"
                rel="noopener noreferrer"
                className="vidro-leve flex h-12 items-center justify-center rounded-[11px] text-[14px] font-bold"
                style={{ color: "var(--color-v-azul)" }}
              >
                Como chegar
              </a>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
}
