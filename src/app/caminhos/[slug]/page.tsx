import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import ContarAcesso from "@/components/ContarAcesso";
import Mapa from "@/components/Mapa";
import CardMadeira from "@/components/enxaimel/CardMadeira";
import { CasaEnxaimel, Petunia } from "@/components/enxaimel/icones";
import { FaixaEnxaimel, Legenda } from "@/components/enxaimel/pecas";
import {
  CAMINHOS,
  caminhoPorSlug,
  extensaoPorExtenso,
  linkDoCaminhoNoMaps,
  lugaresNoCaminho,
  tempoAPe,
  tempoDeCarro,
} from "@/lib/caminhos";
import { buscarLocais } from "@/lib/locais";

export const revalidate = 300;

export function generateStaticParams() {
  return CAMINHOS.map((c) => ({ slug: c.slug }));
}

export async function generateMetadata({
  params,
}: PageProps<"/caminhos/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const caminho = caminhoPorSlug(slug);
  if (!caminho) return { title: "Caminho" };

  return {
    title: caminho.nome,
    description: `${extensaoPorExtenso(caminho.metros)} de estrada no interior de Ivoti, em circuito. O traçado no mapa e o que dá para ver pelo caminho.`,
  };
}

export default async function PaginaCaminho({
  params,
}: PageProps<"/caminhos/[slug]">) {
  const { slug } = await params;
  const caminho = caminhoPorSlug(slug);
  if (!caminho) notFound();

  const locais = await buscarLocais({ limite: 300 });
  const naBeira = lugaresNoCaminho(caminho, locais);
  const outros = CAMINHOS.filter((c) => c.slug !== caminho.slug);

  return (
    <div style={{ backgroundColor: "var(--color-reboco)" }}>
      <ContarAcesso />

      <div className="mx-auto lg:max-w-[900px] lg:px-8 lg:pb-12">
        <header
          className="px-4 pt-5 pb-6"
          style={{ backgroundColor: "var(--color-madeira)" }}
        >
          <Legenda cor="var(--color-petunia-clara)">
            Caminho do interior
          </Legenda>

          <div className="mt-1.5 flex items-start gap-2">
            <h1
              className="text-[26px] leading-tight font-bold lg:text-[34px]"
              style={{
                color: "var(--color-creme-claro)",
                fontFamily: "var(--fonte-titulo-nova)",
              }}
            >
              {caminho.nome}
            </h1>
            <CasaEnxaimel
              tamanho={28}
              className="mt-1 shrink-0"
              style={{ color: "var(--color-creme-claro)" }}
            />
          </div>

          <p
            className="mt-2 text-[13px]"
            style={{ color: "var(--color-creme-fundo)" }}
          >
            {extensaoPorExtenso(caminho.metros)}
            {caminho.circuito ? " · sai e volta no mesmo ponto" : ""}
            {" · estrada de chão"}
          </p>
        </header>

        {/* ---------------- os números ---------------- */}
        <div className="grid grid-cols-3 gap-2 px-4 pt-5">
          <Numero rotulo="de estrada">
            {extensaoPorExtenso(caminho.metros)}
          </Numero>
          <Numero rotulo="a pé">{tempoAPe(caminho.metros)}</Numero>
          <Numero rotulo="de carro">{tempoDeCarro(caminho.metros)}</Numero>
        </div>

        {/* ---------------- o traçado ---------------- */}
        <div className="px-4 pt-5">
          <CardMadeira variante={1}>
            <Mapa locais={locais} caminho={caminho} altura="h-[380px]" />
          </CardMadeira>

          <p
            className="mt-2 text-[12px]"
            style={{ color: "var(--color-texto-suave)" }}
          >
            A linha vermelha é o caminho. Os pinos verdes são os lugares que
            estão no guia.
          </p>
        </div>

        {/* ---------------- abrir no celular ---------------- */}
        <div className="px-4 pt-5">
          <a
            href={linkDoCaminhoNoMaps(caminho)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex h-12 items-center justify-center rounded-[11px] px-4 text-center text-[14px] font-bold"
            style={{ backgroundColor: "var(--color-torii)", color: "#fff7ea" }}
          >
            Abrir o caminho no Google Maps
          </a>
          <p
            className="mt-2 text-[12px]"
            style={{ color: "var(--color-texto-suave)" }}
          >
            O Google Maps aceita poucos pontos por rota, então ele recebe o
            caminho resumido em nove — passa pelas mesmas estradas.
          </p>
        </div>

        <div className="pt-7">
          <FaixaEnxaimel />
        </div>

        {/* ---------------- o que tem pelo caminho ---------------- */}
        <section className="px-4 pt-6">
          <h2
            className="text-[20px] font-bold"
            style={{
              color: "var(--color-texto)",
              fontFamily: "var(--fonte-titulo-nova)",
            }}
          >
            O que tem pelo caminho
          </h2>

          {naBeira.length === 0 ? (
            <p
              className="mt-2 text-[14px]"
              style={{ color: "var(--color-texto-suave)" }}
            >
              Nenhum lugar do guia fica na beira desta estrada ainda. As casas
              enxaimel e as propriedades do interior vão entrando no guia aos
              poucos — quando entrarem, aparecem aqui sozinhas, na ordem do
              percurso.
            </p>
          ) : (
            <ol className="mt-3 space-y-2">
              {naBeira.map(({ lugar, km, metros }) => (
                <li key={lugar.id}>
                  <Link
                    href={`/local/${lugar.slug}`}
                    className="flex items-center gap-3 rounded-[4px] px-3 py-3"
                    style={{
                      backgroundColor: "var(--color-superficie)",
                      border: "2px solid var(--color-madeira)",
                    }}
                  >
                    <span
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-full text-[12px] font-bold"
                      style={{
                        backgroundColor: "var(--color-torii)",
                        color: "#fff7ea",
                        fontFamily: "var(--fonte-titulo-nova)",
                      }}
                    >
                      km {km.toFixed(1).replace(".", ",")}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span
                        className="block text-[15px] font-bold"
                        style={{ color: "var(--color-texto)" }}
                      >
                        {lugar.nome}
                      </span>
                      <span
                        className="block text-[13px]"
                        style={{ color: "var(--color-texto-suave)" }}
                      >
                        {lugar.categoria?.nome ?? "Ponto de interesse"}
                        {metros > 30 ? ` · a ${metros} m da estrada` : ""}
                      </span>
                    </span>
                  </Link>
                </li>
              ))}
            </ol>
          )}
        </section>

        {/* ---------------- antes de sair ---------------- */}
        <section className="px-4 pt-7">
          <div
            className="rounded-[4px] p-4"
            style={{
              backgroundColor: "var(--color-superficie)",
              border: "2px solid var(--color-madeira)",
            }}
          >
            <p className="flex items-center gap-2">
              <Petunia tamanho={15} />
              <span
                className="text-[11px] font-bold tracking-[0.12em] uppercase"
                style={{ color: "var(--color-petunia)" }}
              >
                Antes de sair
              </span>
            </p>
            <ul
              className="mt-2 space-y-1.5 text-[14px]"
              style={{ color: "var(--color-texto-suave)" }}
            >
              <li>
                É estrada de chão: em dia de chuva forte, alguns trechos ficam
                ruins para carro baixo.
              </li>
              <li>
                Não há comércio ao longo do percurso. Leve água, e o que for
                comer.
              </li>
              <li>
                A maioria das casas é moradia de família. Dá para ver e
                fotografar da estrada; entrar, só se convidarem.
              </li>
              <li>O sinal de celular falha em parte do trajeto.</li>
            </ul>
          </div>
        </section>

        {/* ---------------- os outros caminhos ---------------- */}
        {outros.length > 0 && (
          <section className="px-4 pt-7 pb-10">
            <h2
              className="text-[20px] font-bold"
              style={{
                color: "var(--color-texto)",
                fontFamily: "var(--fonte-titulo-nova)",
              }}
            >
              Os outros caminhos
            </h2>
            <div className="mt-3 space-y-2 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
              {outros.map((c) => (
                <Link
                  key={c.slug}
                  href={`/caminhos/${c.slug}`}
                  className="block rounded-[4px] px-4 py-3"
                  style={{
                    backgroundColor: "var(--color-superficie)",
                    border: "2px solid var(--color-madeira)",
                  }}
                >
                  <span
                    className="block text-[15px] font-bold"
                    style={{ color: "var(--color-texto)" }}
                  >
                    {c.nome}
                  </span>
                  <span
                    className="block text-[13px]"
                    style={{ color: "var(--color-texto-suave)" }}
                  >
                    {extensaoPorExtenso(c.metros)} · {tempoAPe(c.metros)} a pé
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}

/** Um número grande com a legenda embaixo. */
function Numero({
  children,
  rotulo,
}: {
  children: React.ReactNode;
  rotulo: string;
}) {
  return (
    <div
      className="rounded-[4px] px-2 py-3 text-center"
      style={{
        backgroundColor: "var(--color-superficie)",
        border: "2px solid var(--color-madeira)",
      }}
    >
      <p
        className="text-[19px] leading-none font-bold"
        style={{
          color: "var(--color-texto)",
          fontFamily: "var(--fonte-titulo-nova)",
        }}
      >
        {children}
      </p>
      <p
        className="mt-1 text-[11px] font-medium tracking-[0.06em] uppercase"
        style={{ color: "var(--color-texto-suave)" }}
      >
        {rotulo}
      </p>
    </div>
  );
}
