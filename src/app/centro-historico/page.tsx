import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";
import Mapa from "@/components/Mapa";
import { FileiraDePetunias } from "@/components/vidro/blocos";
import { CasaEnxaimel, Petunia } from "@/components/vidro/icones";
import { Legenda } from "@/components/vidro/pecas";
import {
  FONTES_DO_PASSEIO,
  NUMEROS_DO_INVENTARIO,
  PARADAS_DO_CENTRO,
  SELOS,
  caminhoDoCentro,
  linkDoPasseioNoMaps,
} from "@/dados/centro-historico";
import { extensaoPorExtenso, lugaresNoCaminho } from "@/lib/caminhos";
import { imagemDoSite } from "@/lib/imagens";
import { buscarLocais } from "@/lib/locais";
import { enderecoOficial } from "@/lib/site";

export const revalidate = 300;

export const metadata: Metadata = {
  alternates: enderecoOficial("/centro-historico"),
  title: "Centro histórico de Ivoti a pé",
  description: `Um passeio a pé pela Avenida Presidente Lucena, em ${PARADAS_DO_CENTRO.length} paradas: a igreja matriz antiga, o Salão Holler, casas enxaimel tombadas e a praça de Burle Marx. Com mapa e a história de cada prédio.`,
};

/** Quanto tempo andando, sem contar as paradas: 4 km/h, de 5 em 5 minutos. */
function minutosAndando(metros: number): number {
  return Math.max(5, Math.ceil(((metros / 1000 / 4) * 60) / 5) * 5);
}

export default async function CentroHistorico() {
  const [locais, capa] = await Promise.all([
    buscarLocais({ limite: 300 }),
    imagemDoSite("capa-caminhos"),
  ]);

  const caminho = caminhoDoCentro();
  // Os lugares do guia que ficam na beira do percurso: onde parar para um
  // café, um lanche ou um banco de praça no meio do passeio.
  const noGuia = new Set(
    PARADAS_DO_CENTRO.map((p) => p.noGuia).filter((s) => s != null),
  );
  const pertoDoPasseio = lugaresNoCaminho(caminho, locais, 120).filter(
    ({ lugar }) => !noGuia.has(lugar.slug),
  );
  const porSlug = new Map(locais.map((l) => [l.slug, l]));

  return (
    <div className="mx-auto lg:max-w-[900px] lg:px-8 lg:pb-12">
      <header className="relative isolate px-4 pt-4 pb-4">
        <Image
          src={capa}
          alt=""
          fill
          priority
          sizes="100vw"
          className="-z-10 object-cover object-center"
        />
        <div aria-hidden className="veu-do-topo absolute inset-0 -z-10" />
        <div className="vidro-azul px-4 py-4">
          <Legenda cor="#FFFFFF">Passeio a pé</Legenda>

          <div className="mt-1.5 flex items-start gap-2">
            <h1
              className="text-[26px] leading-tight font-bold lg:text-[34px]"
              style={{
                color: "#FFFFFF",
                fontFamily: "var(--fonte-titulo-nova)",
              }}
            >
              Centro histórico de Ivoti
            </h1>
            <CasaEnxaimel
              tamanho={28}
              className="mt-1 shrink-0"
              style={{ color: "#FFFFFF" }}
            />
          </div>

          <p
            className="mt-2 text-[13px]"
            style={{ color: "rgba(255,255,255,0.85)" }}
          >
            {PARADAS_DO_CENTRO.length} paradas pela Avenida Presidente Lucena,
            da praça de Burle Marx à igreja matriz antiga
          </p>
        </div>
      </header>

      {/* ---------------- os números ---------------- */}
      <div className="grid grid-cols-3 gap-2 px-4 pt-5">
        <Numero rotulo="de calçada">
          {extensaoPorExtenso(caminho.metros)}
        </Numero>
        <Numero rotulo="andando">{minutosAndando(caminho.metros)} min</Numero>
        <Numero rotulo="paradas">{PARADAS_DO_CENTRO.length}</Numero>
      </div>

      {/* ---------------- a apresentação ---------------- */}
      <section className="px-4 pt-5">
        <p className="text-[15px]" style={{ color: "var(--color-v-texto)" }}>
          Ivoti nasceu ao longo de uma estrada. A Avenida Presidente Lucena era
          a linha que dividia os lotes da antiga Picada Bom Jardim, e as casas
          foram sendo erguidas na beira dela, uma depois da outra. Por isso o
          centro histórico não é uma praça: é uma avenida, que se percorre a
          pé de ponta a ponta.
        </p>
        <p
          className="mt-3 text-[15px]"
          style={{ color: "var(--color-v-texto)" }}
        >
          O inventário do patrimônio feito para o município em 2020 e 2021
          registrou {NUMEROS_DO_INVENTARIO.bens} bens de valor histórico em
          Ivoti, {NUMEROS_DO_INVENTARIO.naSede} deles na sede. Contou também{" "}
          {NUMEROS_DO_INVENTARIO.enxaimel} casas ou conjuntos em enxaimel no
          município inteiro, e afirma que, salvo novos estudos, nenhuma outra
          cidade gaúcha tem tantos. Este passeio passa pelos prédios públicos,
          pelos tombados e por alguns dos mais antigos.
        </p>
      </section>

      {/* ---------------- o mapa ---------------- */}
      <div className="px-4 pt-5">
        <div className="vidro overflow-hidden p-2">
          {/* Só os lugares do guia que ficam na beira do passeio. Com a
              cidade inteira, os pinos verdes cobriam os números das paradas. */}
          <Mapa
            locais={pertoDoPasseio.map(({ lugar }) => lugar)}
            caminho={caminho}
            paradas={PARADAS_DO_CENTRO.map((p, i) => ({
              numero: i + 1,
              nome: p.nome,
              lat: p.lat,
              lng: p.lng,
              href: `#${p.ancora}`,
            }))}
            altura="h-[520px]"
            // O passeio é uma linha de quase 2 km de norte a sul. Com a folga
            // padrão ele não cabia no degrau de aproximação bom, e o mapa
            // abria mostrando a cidade inteira.
            margemDoCaminho={24}
          />
        </div>

        <p
          className="mt-2 text-[12px]"
          style={{ color: "var(--color-v-texto-suave)" }}
        >
          Os números vermelhos são as paradas, na ordem da visita; toque num
          deles para ler sobre o prédio. A linha liga uma parada à seguinte,
          sem desenhar cada esquina. Os pinos com foto são lugares do guia que
          ficam pelo caminho. Aproxime o mapa para separar as paradas do
          trecho final, que ficam a poucos passos umas das outras.
        </p>
      </div>

      {/* ---------------- abrir no celular ---------------- */}
      <div className="px-4 pt-5">
        <a
          href={linkDoPasseioNoMaps()}
          target="_blank"
          rel="noopener noreferrer"
          className="flex h-12 items-center justify-center rounded-[11px] px-4 text-center text-[14px] font-bold"
          style={{
            backgroundColor: "var(--color-v-torii)",
            color: "#FFFFFF",
          }}
        >
          Abrir o passeio no Google Maps
        </a>
        <p
          className="mt-2 text-[12px]"
          style={{ color: "var(--color-v-texto-suave)" }}
        >
          O Google Maps aceita poucos pontos por rota, então ele recebe o
          começo, o fim e as paradas principais. As outras ficam no caminho
          entre elas.
        </p>
      </div>
      <FileiraDePetunias />

      {/* ---------------- as paradas ---------------- */}
      <section className="px-4 pt-6">
        <h2
          className="text-[20px] font-bold"
          style={{
            color: "var(--color-v-texto)",
            fontFamily: "var(--fonte-titulo-nova)",
          }}
        >
          As paradas, do sul para o norte
        </h2>

        <ol className="mt-3 space-y-3">
          {PARADAS_DO_CENTRO.map((p, i) => {
            const lugar = p.noGuia ? porSlug.get(p.noGuia) : undefined;
            return (
              <li
                key={p.ancora}
                id={p.ancora}
                className="vidro scroll-mt-20 px-4 py-4"
              >
                <div className="flex items-start gap-3">
                  <span
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-full text-[15px] font-bold"
                    style={{
                      backgroundColor: "var(--color-v-torii)",
                      color: "#FFFFFF",
                      fontFamily: "var(--fonte-titulo-nova)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3
                      className="text-[17px] leading-tight font-bold"
                      style={{
                        color: "var(--color-v-texto)",
                        fontFamily: "var(--fonte-titulo-nova)",
                      }}
                    >
                      {p.nome}
                    </h3>
                    <p
                      className="mt-0.5 text-[13px]"
                      style={{ color: "var(--color-v-texto-suave)" }}
                    >
                      {p.endereco}
                    </p>
                    {p.selos.length > 0 && (
                      <p className="mt-2 flex flex-wrap gap-1.5">
                        {p.selos.map((s) => (
                          <span
                            key={s}
                            className="inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold tracking-[0.08em] uppercase"
                            style={{
                              backgroundColor: SELOS[s].fundo,
                              color: "#FFFFFF",
                            }}
                          >
                            {SELOS[s].texto}
                          </span>
                        ))}
                      </p>
                    )}
                  </div>
                </div>

                {p.texto.map((paragrafo) => (
                  <p
                    key={paragrafo.slice(0, 24)}
                    className="mt-3 text-[14px]"
                    style={{ color: "var(--color-v-texto)" }}
                  >
                    {paragrafo}
                  </p>
                ))}

                {p.olhe && (
                  <p
                    className="mt-3 text-[14px]"
                    style={{ color: "var(--color-v-texto-suave)" }}
                  >
                    <strong style={{ color: "var(--color-v-texto)" }}>
                      Da calçada:
                    </strong>{" "}
                    {p.olhe}
                  </p>
                )}

                {lugar && (
                  <Link
                    href={`/local/${lugar.slug}`}
                    className="mt-3 inline-block text-[14px] font-bold underline"
                    style={{ color: "var(--color-v-azul)" }}
                  >
                    Ver {lugar.nome} no guia
                  </Link>
                )}
              </li>
            );
          })}
        </ol>
      </section>

      {/* ---------------- antes de sair ---------------- */}
      <section className="px-4 pt-7">
        <div className="vidro p-4">
          <p className="flex items-center gap-2">
            <Petunia tamanho={15} />
            <span
              className="text-[11px] font-bold tracking-[0.12em] uppercase"
              style={{ color: "var(--color-v-petunia)" }}
            >
              Antes de sair
            </span>
          </p>
          <ul
            className="mt-2 space-y-1.5 text-[14px]"
            style={{ color: "var(--color-v-texto-suave)" }}
          >
            <li>
              Quase todas as casas são moradia ou comércio de alguém. O passeio
              é para ver e fotografar da calçada; entrar, só onde é aberto ao
              público.
            </li>
            <li>
              A avenida tem movimento de carros o dia inteiro. Atravesse nas
              faixas e fique de olho nas crianças.
            </li>
            <li>
              O passeio vai do sul para o norte porque assim ele desce: a
              Praça Neldo Holler fica cerca de 70 metros acima da igreja
              antiga. Ele termina longe de onde começou; a volta é pela mesma
              avenida, subindo, ou de carona.
            </li>
            <li>
              Com pouco tempo, faça só o trecho final, do Salão Holler à igreja
              antiga: são sete paradas em cerca de 500 metros.
            </li>
            <li>
              Os horários de igrejas e prédios públicos não estão no guia. Para
              entrar, vale confirmar antes.
            </li>
          </ul>
        </div>
      </section>

      {/* ---------------- no guia, perto do passeio ---------------- */}
      {pertoDoPasseio.length > 0 && (
        <section className="px-4 pt-7">
          <h2
            className="text-[20px] font-bold"
            style={{
              color: "var(--color-v-texto)",
              fontFamily: "var(--fonte-titulo-nova)",
            }}
          >
            No guia, pelo caminho
          </h2>
          <ol className="mt-3 space-y-2">
            {pertoDoPasseio.map(({ lugar, metros }) => (
              <li key={lugar.id}>
                <Link
                  href={`/local/${lugar.slug}`}
                  className="vidro block px-4 py-3"
                >
                  <span
                    className="block text-[15px] font-bold"
                    style={{ color: "var(--color-v-texto)" }}
                  >
                    {lugar.nome}
                  </span>
                  <span
                    className="block text-[13px]"
                    style={{ color: "var(--color-v-texto-suave)" }}
                  >
                    {lugar.categoria?.nome ?? "Ponto de interesse"}
                    {metros > 30 ? ` · a ${metros} m do percurso` : ""}
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      {/* ---------------- de onde vem ---------------- */}
      <section className="px-4 pt-7 pb-10">
        <h2
          className="text-[20px] font-bold"
          style={{
            color: "var(--color-v-texto)",
            fontFamily: "var(--fonte-titulo-nova)",
          }}
        >
          De onde vêm estas informações
        </h2>
        <ul
          className="mt-3 space-y-2 text-[14px]"
          style={{ color: "var(--color-v-texto-suave)" }}
        >
          {FONTES_DO_PASSEIO.map((f) => (
            <li key={f.href}>
              {f.texto}{" "}
              <a
                href={f.href}
                target="_blank"
                rel="noopener noreferrer"
                className="font-bold underline"
                style={{ color: "var(--color-v-azul)" }}
              >
                {f.rotulo}
              </a>
            </li>
          ))}
        </ul>
        <p
          className="mt-3 text-[13px]"
          style={{ color: "var(--color-v-texto-suave)" }}
        >
          Os textos foram escritos pelo guia a partir dessas fontes. Achou algo
          errado? Avise a gente, que corrigimos.
        </p>
      </section>
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
    <div className="vidro px-2 py-3 text-center">
      <p
        className="text-[19px] leading-none font-bold"
        style={{
          color: "var(--color-v-texto)",
          fontFamily: "var(--fonte-titulo-nova)",
        }}
      >
        {children}
      </p>
      <p
        className="mt-1 text-[11px] font-medium tracking-[0.06em] uppercase"
        style={{ color: "var(--color-v-texto-suave)" }}
      >
        {rotulo}
      </p>
    </div>
  );
}
