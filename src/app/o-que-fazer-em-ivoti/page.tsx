import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import CabecalhoSimples from "@/components/vidro/CabecalhoSimples";
import Ficha from "@/components/Ficha";
import { Botao, Legenda } from "@/components/vidro/pecas";
import { CAMINHOS } from "@/lib/caminhos";
import { buscarLocais, listarCategorias } from "@/lib/locais";
import { ROTAS_REGIONAIS } from "@/lib/rotas-regionais";
import { SITE, enderecoOficial } from "@/lib/site";
import { createClientPublico } from "@/lib/supabase/server";
import type { LocalCompleto } from "@/lib/tipos";

// Esta página não tem nada que mude de hora em hora (não mostra "aberto
// agora" nem "hoje"), então pode ficar guardada: abre na hora para o
// visitante e para o buscador. Lugar novo publicado aparece em até dez
// minutos.
export const revalidate = 600;

export const metadata: Metadata = {
  alternates: enderecoOficial("/o-que-fazer-em-ivoti"),
  title: {
    absolute: "O que fazer em Ivoti: lugares para visitar, comer e passear",
  },
  description:
    "O que fazer em Ivoti, RS: casas enxaimel, Ponte do Imperador, colônia japonesa, praças e onde comer. Lugar por lugar, com horário, endereço e rota.",
};

/**
 * O texto de cada parte da página.
 *
 * A chave é o endereço da categoria principal. Os fatos repetem o que o
 * próprio guia já afirma em "Sobre Ivoti" e o que as páginas oficiais do
 * Vale Germânico e da Rota Romântica dizem da cidade; nada aqui foi
 * escrito de cabeça.
 */
const PARTES: Record<string, { titulo: string; texto: string }> = {
  cultura: {
    titulo: "História e cultura",
    texto:
      "Os colonos alemães chegaram em 1826 e deixaram o Núcleo de Casas Enxaimel, apontado como o maior do Brasil. A partir de 1966 vieram as famílias japonesas, que trouxeram a floricultura e deram à cidade o apelido de Cidade das Flores. As duas histórias se visitam a poucos minutos uma da outra.",
  },
  natureza: {
    titulo: "Praças e ar livre",
    texto:
      "Para descansar entre uma visita e outra, ou deixar as crianças soltas. As praças ficam abertas o dia todo e não cobram entrada.",
  },
  gastronomia: {
    titulo: "Onde comer e beber",
    texto:
      "A mesa da região vem da colônia: cucas, roscas, queijos, embutidos, cachaças e cervejas artesanais. Estes são os lugares que já estão no guia, com cardápio e horário.",
  },
};

/** A ordem das partes; o que não estiver aqui vem depois, como estiver. */
const ORDEM_DAS_PARTES = ["cultura", "natureza", "gastronomia"];

/**
 * Quem abre cada parte. O resto segue em ordem alfabética.
 *
 * Só a ordem é escolhida à mão. A lista em si vem do banco: um lugar
 * publicado amanhã entra na página sem ninguém mexer aqui.
 */
const PRIMEIROS = [
  "nucleo-de-casas-enxaimel",
  "ponte-do-imperador",
  "casa-amarela",
  "casa-do-artesao",
  "memorial-da-colonia-japonesa",
  "igreja-sao-pedro-apostolo",
  "portico-de-ivoti",
];

function ordenar(locais: LocalCompleto[]): LocalCompleto[] {
  const peso = (l: LocalCompleto) => {
    const i = PRIMEIROS.indexOf(l.slug);
    return i === -1 ? PRIMEIROS.length : i;
  };
  return [...locais].sort(
    (a, b) => peso(a) - peso(b) || a.nome.localeCompare(b.nome, "pt-BR"),
  );
}

export default async function OQueFazer() {
  // Cliente sem cookie: é o que deixa a página ser guardada.
  const sb = createClientPublico();
  const [locais, categorias] = await Promise.all([
    buscarLocais({ limite: 500 }, sb),
    listarCategorias(sb),
  ]);

  // Cada lugar vai para a parte da sua categoria principal.
  const principalDe = new Map(
    categorias.map((c) => [c.id, c.pai_id ?? c.id] as const),
  );
  const porId = new Map(categorias.map((c) => [c.id, c] as const));

  const grupos = new Map<string, { nome: string; locais: LocalCompleto[] }>();
  for (const local of locais) {
    const principal =
      local.categoria_id != null
        ? porId.get(principalDe.get(local.categoria_id) ?? -1)
        : undefined;
    const chave = principal?.slug ?? "outros";
    const grupo = grupos.get(chave) ?? {
      nome: principal?.nome ?? "Outros lugares",
      locais: [],
    };
    grupo.locais.push(local);
    grupos.set(chave, grupo);
  }

  const partes = [...grupos.entries()]
    .sort(([a], [b]) => {
      const ia = ORDEM_DAS_PARTES.indexOf(a);
      const ib = ORDEM_DAS_PARTES.indexOf(b);
      return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
    })
    .map(([chave, grupo]) => ({
      chave,
      titulo: PARTES[chave]?.titulo ?? grupo.nome,
      texto: PARTES[chave]?.texto,
      locais: ordenar(grupo.locais),
    }));

  const todos = partes.flatMap((p) => p.locais);

  return (
    <>
      <CabecalhoSimples />

      {/* A lista, no formato que o buscador lê: uma relação de lugares,
          cada um com o endereço da própria página. */}
      <Ficha
        dados={{
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: "O que fazer em Ivoti",
          itemListElement: todos.map((l, i) => ({
            "@type": "ListItem",
            position: i + 1,
            name: l.nome,
            url: `${SITE}/local/${l.slug}`,
          })),
        }}
      />

      <article className="mx-auto max-w-[880px] px-4 py-8 lg:px-8 lg:py-14">
        <Legenda cor="var(--color-v-petunia)">O guia da cidade</Legenda>
        <h1
          className="mt-2 text-[32px] leading-[1.08] font-bold lg:text-[46px]"
          style={{
            color: "var(--color-v-texto)",
            fontFamily: "var(--fonte-titulo-nova)",
          }}
        >
          O que fazer em Ivoti
        </h1>
        <p
          className="mt-4 max-w-[62ch] text-[16px] leading-relaxed lg:text-[17px]"
          style={{ color: "var(--color-v-texto)" }}
        >
          Ivoti fica ao pé da Serra gaúcha, entre Novo Hamburgo e Gramado. Em
          um dia dá para conhecer o principal: as casas enxaimel dos colonos
          alemães, a ponte de pedra do tempo do Império, o memorial da colônia
          japonesa, as praças e a comida da região. Aqui estão, um por um, os{" "}
          {todos.length} lugares do guia, cada um com horário, endereço e rota.
        </p>

        {/* O índice: quem chega do buscador quer pular para a parte dele. */}
        <nav
          aria-label="Partes desta página"
          className="mt-6 flex flex-wrap gap-2"
        >
          {partes.map((p) => (
            <a
              key={p.chave}
              href={`#${p.chave}`}
              className="vidro-leve inline-flex h-11 items-center rounded-full px-4 text-[13px] font-medium"
              style={{ color: "var(--color-v-texto)" }}
            >
              {p.titulo}
            </a>
          ))}
          <a
            href="#regiao"
            className="vidro-leve inline-flex h-11 items-center rounded-full px-4 text-[13px] font-medium"
            style={{ color: "var(--color-v-texto)" }}
          >
            Ivoti na região
          </a>
        </nav>

        {partes.map((parte) => (
          <section
            key={parte.chave}
            id={parte.chave}
            className="mt-12 scroll-mt-24"
          >
            <h2
              className="text-[24px] leading-tight font-bold lg:text-[30px]"
              style={{
                color: "var(--color-v-texto)",
                fontFamily: "var(--fonte-titulo-nova)",
              }}
            >
              {parte.titulo}
            </h2>
            {parte.texto && (
              <p
                className="mt-2 max-w-[62ch] text-[15px] leading-relaxed"
                style={{ color: "var(--color-v-texto-suave)" }}
              >
                {parte.texto}
              </p>
            )}

            <ul className="mt-5 space-y-3">
              {parte.locais.map((local) => (
                <li key={local.id}>
                  <Lugar local={local} />
                </li>
              ))}
            </ul>
          </section>
        ))}

        {/* ================= o que mais ================= */}
        <section className="mt-12">
          <h2
            className="text-[24px] leading-tight font-bold lg:text-[30px]"
            style={{
              color: "var(--color-v-texto)",
              fontFamily: "var(--fonte-titulo-nova)",
            }}
          >
            Eventos, roteiros e caminhos
          </h2>

          <div className="mt-4 space-y-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
            <Atalho href="/agenda" titulo="Agenda" rotulo="Ver as datas">
              As festas e feiras do ano, como a Feira das Flores, o Kerb, a
              Feira do Mel, Rosca e Nata e o Natal, com o dia de cada uma.
            </Atalho>
            <Atalho href="/chat" titulo="Roteiro sob medida" rotulo="Falar com o Guia">
              Diga quanto tempo tem e com quem vem. O Guia monta o passeio com
              as paradas na ordem e a rota pronta para abrir no mapa.
            </Atalho>
            {CAMINHOS.length > 0 && (
              <Atalho
                href="/mapa"
                titulo="Caminhos do interior"
                rotulo="Ver no mapa"
              >
                {CAMINHOS.map((c) => c.nome.replace(/^Caminho\s+/, "")).join(
                  ", ",
                )}
                : os caminhos pelas picadas do município, com o traçado
                desenhado no mapa.
              </Atalho>
            )}
          </div>
        </section>

        {/* ================= a região ================= */}
        <section id="regiao" className="mt-12 scroll-mt-24">
          <h2
            className="text-[24px] leading-tight font-bold lg:text-[30px]"
            style={{
              color: "var(--color-v-texto)",
              fontFamily: "var(--fonte-titulo-nova)",
            }}
          >
            Ivoti na região
          </h2>
          <p
            className="mt-2 max-w-[62ch] text-[15px] leading-relaxed"
            style={{ color: "var(--color-v-texto-suave)" }}
          >
            A cidade faz parte de duas rotas turísticas. Quem está percorrendo
            a região encontra as cidades vizinhas nos sites oficiais delas.
          </p>

          <div className="mt-4 space-y-3 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
            {ROTAS_REGIONAIS.map((rota) => (
              <a
                key={rota.nome}
                href={rota.link}
                target="_blank"
                rel="noopener noreferrer"
                className="vidro block p-5"
              >
                <h3
                  className="text-[19px] leading-tight font-bold"
                  style={{
                    color: "var(--color-v-texto)",
                    fontFamily: "var(--fonte-titulo-nova)",
                  }}
                >
                  {rota.nome}
                </h3>
                <p
                  className="mt-1.5 text-[14px]"
                  style={{ color: "var(--color-v-texto-suave)" }}
                >
                  {rota.texto}
                </p>
                <span
                  className="mt-3 inline-flex min-h-11 items-center text-[14px] font-bold underline"
                  style={{ color: "var(--color-v-azul)" }}
                >
                  {rota.rotulo}
                  <span aria-hidden className="ml-1">
                    ↗
                  </span>
                  <span className="sr-only"> (abre em outra aba)</span>
                </span>
              </a>
            ))}
          </div>
        </section>

        <div className="mt-12 flex flex-wrap gap-3">
          <Botao href="/explorar">Buscar um lugar</Botao>
          <Botao tom="secundario" href="/mapa">
            Ver tudo no mapa
          </Botao>
        </div>
      </article>
    </>
  );
}

/** Um lugar da lista: foto, nome, o que é, e a porta para a página dele. */
function Lugar({ local }: { local: LocalCompleto }) {
  const apoio = [local.categoria?.nome, local.bairro].filter(Boolean).join(" · ");

  return (
    <Link
      href={`/local/${local.slug}`}
      className="vidro flex gap-4 overflow-hidden p-3"
    >
      {local.capa_url && (
        <span className="relative block h-[96px] w-[112px] shrink-0 overflow-hidden rounded-[12px] sm:h-[120px] sm:w-[168px]">
          <Image
            src={local.capa_url}
            alt=""
            fill
            sizes="(min-width: 640px) 168px, 112px"
            className="object-cover"
          />
        </span>
      )}

      <div className="min-w-0 flex-1 py-0.5">
        <h3
          className="text-[18px] leading-tight font-bold"
          style={{
            color: "var(--color-v-texto)",
            fontFamily: "var(--fonte-titulo-nova)",
          }}
        >
          {local.nome}
        </h3>
        {apoio && (
          <span
            className="mt-0.5 block text-[12px]"
            style={{ color: "var(--color-v-texto-suave)" }}
          >
            {apoio}
          </span>
        )}
        {local.resumo && (
          <span
            className="mt-1.5 block text-[14px] leading-snug"
            style={{ color: "var(--color-v-texto)" }}
          >
            {local.resumo}
          </span>
        )}
        <span
          className="mt-2 block text-[13px] font-bold underline"
          style={{ color: "var(--color-v-azul)" }}
        >
          Horário, endereço e como chegar
        </span>
      </div>
    </Link>
  );
}

/** Um cartão que leva a outra parte do guia. */
function Atalho({
  href,
  titulo,
  rotulo,
  children,
}: {
  href: string;
  titulo: string;
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <Link href={href} className="vidro block p-5">
      <h3
        className="text-[19px] leading-tight font-bold"
        style={{
          color: "var(--color-v-texto)",
          fontFamily: "var(--fonte-titulo-nova)",
        }}
      >
        {titulo}
      </h3>
      <p
        className="mt-1.5 text-[14px]"
        style={{ color: "var(--color-v-texto-suave)" }}
      >
        {children}
      </p>
      <span
        className="mt-3 inline-flex min-h-11 items-center text-[14px] font-bold underline"
        style={{ color: "var(--color-v-azul)" }}
      >
        {rotulo}
      </span>
    </Link>
  );
}
