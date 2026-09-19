import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ContarAcesso from "@/components/ContarAcesso";
import type { PromocaoNaTela } from "@/components/CartaoPromocao";
import Favoritar from "@/components/enxaimel/Favoritar";
import {
  AcoesDoLocal,
  CardPromocao,
  ConviteAoGuia,
  LinhaEvento,
} from "@/components/enxaimel/blocos";
import { Trelica } from "@/components/enxaimel/icones";
import {
  FaixaEnxaimel,
  SeloStatus,
  TituloSecao,
} from "@/components/enxaimel/pecas";
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
  const { data } = await supabase.rpc("promocoes_de_hoje", { p_local: localId });
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

  // Só entra o que o estabelecimento preencheu: botão que não leva a lugar
  // nenhum ensina a pessoa a desconfiar dos outros.
  const whats = linkWhatsapp(local.whatsapp, "Oi! Vi vocês no guia da cidade.");
  const insta = usuarioInstagram(local.instagram);
  const acoes = [
    whats && { rotulo: "WhatsApp", href: whats, icone: "💬" },
    (local.lat != null || local.endereco) && {
      rotulo: "Como chegar",
      href: linkRota(local),
      icone: "🧭",
    },
    insta && {
      rotulo: "Instagram",
      href: `https://instagram.com/${insta}`,
      icone: "📷",
    },
    (local.itens ?? []).length > 0 && {
      rotulo: "Cardápio",
      href: "#cardapio",
      icone: "📋",
    },
  ].filter(Boolean) as { rotulo: string; href: string; icone: string }[];

  return (
    <div style={{ backgroundColor: "var(--color-reboco)" }}>
      <ContarAcesso local={local.id} />

      <div className="relative h-[250px]">
        {local.capa_url ? (
          <Image
            src={local.capa_url}
            alt={local.nome}
            fill
            priority
            sizes="100vw"
            className="object-cover"
          />
        ) : (
          <Trelica />
        )}

        <div className="absolute inset-x-0 top-0 flex items-start justify-between p-3">
          <Link
            href="/explorar"
            aria-label="Voltar"
            className="grid h-11 w-11 place-items-center rounded-full text-[19px]"
            style={{
              backgroundColor: "rgba(46, 26, 16, 0.72)",
              color: "var(--color-creme-claro)",
            }}
          >
            ‹
          </Link>
          <Favoritar slug={local.slug} />
        </div>
      </div>

      <div className="px-4 pt-4">
        <div className="flex flex-wrap items-center gap-2">
          <SeloStatus tipo={aberto ? "aberto" : "fechado"} />
          <span
            className="text-[13px]"
            style={{ color: "var(--color-texto-suave)" }}
          >
            {textoDoHorario}
          </span>
        </div>

        <h1
          className="mt-2 text-[26px] leading-tight font-bold"
          style={{
            color: "var(--color-texto)",
            fontFamily: "var(--fonte-titulo-nova)",
          }}
        >
          {local.nome}
        </h1>

        <p
          className="mt-1 text-[14px]"
          style={{ color: "var(--color-texto-suave)" }}
        >
          {local.categoria?.nome}
          {endereco ? ` · ${endereco}` : ""}
        </p>

        {local.resumo && (
          <p
            className="mt-3 text-[14px]"
            style={{ color: "var(--color-texto)" }}
          >
            {local.resumo}
          </p>
        )}

        <div className="mt-4">
          <AcoesDoLocal acoes={acoes} />
        </div>
      </div>

      {promocoes.length > 0 && (
        <section className="px-4 pt-6">
          <TituloSecao selo="promocao">Promoções de hoje</TituloSecao>
          <div className="mt-3 space-y-3">
            {promocoes.map((p, i) => (
              <CardPromocao
                key={p.id}
                promocao={p}
                variante={i % 2 === 0 ? 1 : 2}
              />
            ))}
          </div>
        </section>
      )}

      <div className="pt-6">
        <FaixaEnxaimel />
      </div>

      {local.descricao && (
        <section className="px-4 pt-5">
          <TituloSecao>Sobre</TituloSecao>
          <p
            className="mt-2 text-[14px] whitespace-pre-line"
            style={{ color: "var(--color-texto)" }}
          >
            {local.descricao}
          </p>
        </section>
      )}

      {semana.some((d) => !d.fechado) && (
        <section className="px-4 pt-6">
          <TituloSecao>Horários</TituloSecao>
          <dl className="mt-2">
            {semana.map((d) => (
              <div
                key={d.dia}
                className="flex justify-between border-b py-1.5 text-[14px] last:border-b-0"
                style={{ borderColor: "rgba(59, 36, 24, 0.14)" }}
              >
                <dt style={{ color: "var(--color-texto)" }}>{d.nome}</dt>
                <dd style={{ color: "var(--color-texto-suave)" }}>
                  {d.fechado ? "Fechado" : d.faixas.join(", ")}
                </dd>
              </div>
            ))}
          </dl>
        </section>
      )}

      {eventos.length > 0 && (
        <section className="px-4 pt-6">
          <TituloSecao selo="evento">Próximos eventos</TituloSecao>
          <div className="mt-3 space-y-3">
            {eventos.map((e) => (
              <LinhaEvento key={e.id} evento={e} />
            ))}
          </div>
        </section>
      )}

      {(local.itens ?? []).length > 0 && (
        <section id="cardapio" className="px-4 pt-6">
          <TituloSecao>Cardápio</TituloSecao>
          <ul className="mt-2">
            {local.itens.map((item) => (
              <li
                key={item.id}
                className="flex justify-between gap-3 border-b py-2 text-[14px] last:border-b-0"
                style={{ borderColor: "rgba(59, 36, 24, 0.14)" }}
              >
                <span>
                  <span
                    className="block font-medium"
                    style={{ color: "var(--color-texto)" }}
                  >
                    {item.nome}
                  </span>
                  {item.descricao && (
                    <span
                      className="block text-[13px]"
                      style={{ color: "var(--color-texto-suave)" }}
                    >
                      {item.descricao}
                    </span>
                  )}
                </span>
                {item.preco != null && (
                  <span
                    className="shrink-0 font-bold"
                    style={{ color: "var(--color-texto)" }}
                  >
                    R$ {Number(item.preco).toFixed(2).replace(".", ",")}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <div className="pt-7">
        <ConviteAoGuia nome={local.nome} />
      </div>
    </div>
  );
}
