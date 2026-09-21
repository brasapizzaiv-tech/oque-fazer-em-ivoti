import Image from "next/image";
import Link from "next/link";
import CardComFoto from "@/components/vidro/CardComFoto";
import {
  BlocoRoteiro,
  CardPromocao,
  Fileira,
  FileiraDePetunias,
  TituloSecao,
  Vazio,
} from "@/components/vidro/blocos";
import {
  CasaEnxaimel,
  IconeGuia,
  Petunia,
  Torii,
} from "@/components/vidro/icones";
import {
  Botao,
  CardVidro,
  Chip,
  Legenda,
  Logo,
} from "@/components/vidro/pecas";
import { BlocoDaFeira, SeloDaFeira } from "@/components/vidro/Feira";
import { temaAtivo } from "@/lib/temas";
import { listarCategorias } from "@/lib/locais";
import { eventosVisiveis } from "@/lib/eventos";
import { promocoesDeHoje } from "@/lib/promocoes-de-hoje";
import { quandoVale } from "@/lib/promocoes";
import { hojeEmIvoti } from "@/lib/planos";
import { quandoPorExtenso } from "@/lib/horarios";

export const revalidate = 60;

/** A data de daqui a N dias, em AAAA-MM-DD, no fuso de Ivoti. */
function daquiA(dias: number) {
  const d = new Date(`${hojeEmIvoti()}T12:00:00-03:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

export default async function Inicio() {
  const [categorias, daSemana, promocoes, feira] = await Promise.all([
    listarCategorias(),
    eventosVisiveis({ ate: daquiA(7), limite: 8 }),
    promocoesDeHoje(4),
    temaAtivo(),
  ]);

  const principais = categorias.filter((c) => c.pai_id === null);

  // O celular mostra só o que é hoje; a tela grande tem espaço para a semana.
  const limiteDeHoje = `${hojeEmIvoti()}T23:59:59-03:00`;
  const deHoje = daSemana.filter((e) => e.inicio <= limiteDeHoje);

  return (
    <>
      {/* ================= a capa ================= */}
      {/* 420px de capa, mas nunca mais que a tela: com o iPhone deitado a
          altura vira 375px, e a capa fixa empurrava o titulo e a busca para
          fora do campo de visao — quem virava o telefone via foto e mais
          nada. */}
      <section className="relative isolate h-[min(420px,86dvh)] lg:h-[760px]">
        <Image
          src={feira?.capa_url ?? "/fotos/portico-ivoti.jpg"}
          alt=""
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* Em feira o veu vai na cor do tema, escuro. O titulo e o nome do
            site continuam brancos: a cor da festa entra nos detalhes, nao
            por cima do que a pessoa precisa ler. */}
        <div
          aria-hidden
          className="absolute inset-0"
          style={
            feira
              ? {
                  backgroundImage:
                    "linear-gradient(to bottom, rgb(var(--vidro-azul-rgb) / 0.82) 0%, rgb(var(--vidro-azul-rgb) / 0.35) 45%, rgb(var(--vidro-azul-rgb) / 0.1) 70%)",
                }
              : undefined
          }
        >
          {!feira && <span className="veu-do-topo absolute inset-0" />}
        </div>

        {/* ---- celular ---- */}
        <div className="relative flex h-full flex-col px-4 pt-4 lg:hidden">
          <div className="flex items-start justify-between gap-3">
            <Logo sobreFoto />
            <Link
              href="/chat"
              aria-label="Falar com o Guia"
              className="grid h-11 w-11 shrink-0 place-items-center rounded-full"
              style={{
                backgroundColor: "var(--color-v-torii)",
                color: "#FFFFFF",
              }}
            >
              <IconeGuia tamanho={22} />
            </Link>
          </div>

          {feira && (
            <div className="mt-3">
              <SeloDaFeira tema={feira} />
            </div>
          )}

          <div className="mt-auto pb-5">
            <h1
              className="sobre-foto text-[30px] leading-[1.08] font-bold text-white"
              style={{ fontFamily: "var(--fonte-titulo-nova)" }}
            >
              Flores, casas enxaimel e colônia japonesa
            </h1>

            <form action="/explorar" className="mt-4">
              <input
                name="q"
                placeholder="O que você procura em Ivoti?"
                aria-label="Buscar no guia"
                className="vidro h-12 w-full px-4 text-[14px] outline-none"
                style={{ color: "var(--color-v-texto)", borderRadius: 12 }}
              />
            </form>
          </div>
        </div>

        {/* ---- computador ---- */}
        <div className="relative mx-auto hidden h-full max-w-[1440px] flex-col justify-center px-16 lg:flex">
          {feira ? (
            <SeloDaFeira tema={feira} />
          ) : (
            <p className="flex items-center gap-2">
              <Petunia tamanho={18} />
              <span className="sobre-foto text-[12px] font-bold tracking-[0.12em] text-white uppercase">
                Ivoti · A Cidade das Flores
              </span>
            </p>
          )}

          <h1
            className="sobre-foto mt-4 max-w-[19ch] text-[72px] leading-[1.02] font-bold text-white"
            style={{ fontFamily: "var(--fonte-titulo-nova)" }}
          >
            Flores, casas enxaimel, colônia japonesa e tudo o que a cidade tem
            para você.
          </h1>

          <form action="/explorar" className="mt-8 flex max-w-[620px] gap-2">
            <input
              name="q"
              placeholder="O que você procura em Ivoti?"
              aria-label="Buscar no guia"
              className="vidro h-12 flex-1 px-4 text-[15px] outline-none"
              style={{ color: "var(--color-v-texto)", borderRadius: 12 }}
            />
            <Botao type="submit">Buscar</Botao>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            {principais.slice(0, 5).map((c) => (
              <Chip
                key={c.id}
                href={`/explorar?categoria=${c.slug}`}
                flor={c.slug === "natureza"}
              >
                {c.nome}
              </Chip>
            ))}
          </div>
        </div>
      </section>

      {/* ================= a feira ================= */}
      {feira && (
        <section className="px-4 pt-5 lg:mx-auto lg:max-w-[1440px] lg:px-16">
          <BlocoDaFeira tema={feira} />
        </section>
      )}

      {/* ================= categorias, só no celular ================= */}
      <div className="pt-4 lg:hidden">
        <Fileira>
          <Chip href="/explorar" ativo>
            Todos
          </Chip>
          {principais.map((c) => (
            <Chip
              key={c.id}
              href={`/explorar?categoria=${c.slug}`}
              flor={c.slug === "natureza"}
            >
              {c.nome}
            </Chip>
          ))}
        </Fileira>
      </div>

      {/* ================= eventos ================= */}
      <section className="pt-7 lg:mx-auto lg:max-w-[1440px] lg:px-16">
        <div className="px-4 lg:px-0">
          <TituloSecao
            selo="evento"
            aoLado={
              <Link
                href="/agenda"
                className="text-[13px] font-semibold"
                style={{ color: "var(--color-v-azul)" }}
              >
                Ver todos
              </Link>
            }
          >
            <span className="lg:hidden">Acontece hoje</span>
            <span className="hidden lg:inline">Acontece esta semana</span>
          </TituloSecao>
        </div>

        {/* No celular a fileira rola; na tela grande os quatro primeiros
            cabem em linha e rolar seria esconder de graça. */}
        <div className="mt-3 lg:hidden">
          {deHoje.length === 0 ? (
            <div className="px-4">
              <Vazio>
                Nada marcado para hoje.{" "}
                <Link
                  href="/agenda"
                  className="font-bold underline"
                  style={{ color: "var(--color-v-azul)" }}
                >
                  Ver a agenda
                </Link>
              </Vazio>
            </div>
          ) : (
            <Fileira>
              {deHoje.map((e) => (
                <CardComFoto
                  key={e.id}
                  href={`/agenda#${e.id}`}
                  foto={e.imagem_url}
                  etiqueta={quandoPorExtenso(e.inicio)}
                  titulo={e.titulo}
                  apoio={e.local?.nome ?? e.local_texto ?? undefined}
                  alto={180}
                  className="w-[260px] shrink-0"
                />
              ))}
            </Fileira>
          )}
        </div>

        <div className="mt-4 hidden gap-4 lg:grid lg:grid-cols-4">
          {daSemana.length === 0 ? (
            <div className="lg:col-span-4">
              <Vazio>
                Nada marcado para os próximos dias.{" "}
                <Link
                  href="/agenda"
                  className="font-bold underline"
                  style={{ color: "var(--color-v-azul)" }}
                >
                  Ver a agenda
                </Link>
              </Vazio>
            </div>
          ) : (
            daSemana
              .slice(0, 4)
              .map((e) => (
                <CardComFoto
                  key={e.id}
                  href={`/agenda#${e.id}`}
                  foto={e.imagem_url}
                  etiqueta={quandoPorExtenso(e.inicio)}
                  titulo={e.titulo}
                  apoio={e.local?.nome ?? e.local_texto ?? undefined}
                  alto={260}
                />
              ))
          )}
        </div>
      </section>

      {/* ================= promoções e roteiro ================= */}
      <section className="px-4 pt-8 lg:mx-auto lg:max-w-[1440px] lg:px-16">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="lg:col-span-7">
            <TituloSecao selo="promocao">Promoções de hoje</TituloSecao>
            <div className="mt-3 space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
              {promocoes.length === 0 ? (
                <Vazio>Nenhuma promoção valendo hoje.</Vazio>
              ) : (
                promocoes.map((p) => (
                  <CardPromocao
                    key={p.id}
                    href={`/local/${p.local?.slug ?? ""}`}
                    titulo={p.titulo}
                    quando={quandoVale(p)}
                    local={p.local?.nome ?? undefined}
                  />
                ))
              )}
            </div>
          </div>

          <div className="mt-6 lg:col-span-5 lg:mt-0">
            <BlocoRoteiro className="lg:h-full" />
          </div>
        </div>
      </section>

      <FileiraDePetunias />

      {/* ================= sobre Ivoti ================= */}
      <section className="px-4 pb-10 lg:mx-auto lg:max-w-[1440px] lg:px-16 lg:pb-16">
        <TituloSecao>Sobre Ivoti</TituloSecao>
        <div className="mt-4 space-y-3 lg:grid lg:grid-cols-3 lg:gap-4 lg:space-y-0">
          <SobreIvoti
            icone={<CasaEnxaimel tamanho={34} />}
            titulo="Herança alemã"
          >
            As casas enxaimel do Núcleo e da Picada 48, de madeira aparente e
            reboco branco, construídas pelos colonos que chegaram em 1826.
          </SobreIvoti>
          <SobreIvoti icone={<Torii tamanho={34} />} titulo="Colônia japonesa">
            A partir de 1966, famílias japonesas se estabeleceram aqui e
            trouxeram a floricultura que deu o apelido à cidade.
          </SobreIvoti>
          <SobreIvoti
            icone={<Petunia tamanho={30} />}
            titulo="Cidade das Flores"
          >
            Ivoti é o maior produtor de flores do Rio Grande do Sul, e a petúnia
            é a flor símbolo do município.
          </SobreIvoti>
        </div>
      </section>
    </>
  );
}

/** Um dos três cartões de "Sobre Ivoti". */
function SobreIvoti({
  icone,
  titulo,
  children,
}: {
  icone: React.ReactNode;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <CardVidro className="p-5">
      <span className="flex h-9 items-end">{icone}</span>
      <Legenda className="mt-3 block" cor="var(--color-v-petunia)">
        {titulo}
      </Legenda>
      <p
        className="mt-1.5 text-[14px]"
        style={{ color: "var(--color-v-texto-suave)" }}
      >
        {children}
      </p>
    </CardVidro>
  );
}
