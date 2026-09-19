import Image from "next/image";
import Link from "next/link";
import Cabecalho, { BuscaCabecalho } from "@/components/enxaimel/Cabecalho";
import CardMadeira from "@/components/enxaimel/CardMadeira";
import {
  BlocoRoteiro,
  CardEvento,
  CardPromocao,
  FileiraDePetunias,
  Fileira,
  SobreIvoti,
  Vazio,
} from "@/components/enxaimel/blocos";
import { Petunia } from "@/components/enxaimel/icones";
import { Chip, FaixaEnxaimel, TituloSecao } from "@/components/enxaimel/pecas";
import { listarCategorias } from "@/lib/locais";
import { eventosVisiveis } from "@/lib/eventos";
import { promocoesDeHoje } from "@/lib/promocoes-de-hoje";
import { hojeEmIvoti } from "@/lib/planos";

export const revalidate = 60;

/** A data de daqui a N dias, em AAAA-MM-DD, no fuso de Ivoti. */
function daquiA(dias: number) {
  const d = new Date(`${hojeEmIvoti()}T12:00:00-03:00`);
  d.setDate(d.getDate() + dias);
  return d.toISOString().slice(0, 10);
}

export default async function Inicio() {
  const [categorias, daSemana, promocoes] = await Promise.all([
    listarCategorias(),
    eventosVisiveis({ ate: daquiA(7), limite: 8 }),
    promocoesDeHoje(4),
  ]);

  const principais = categorias.filter((c) => c.pai_id === null);

  // O celular mostra só o que é hoje; a tela grande tem espaço para a semana.
  const limiteDeHoje = `${hojeEmIvoti()}T23:59:59-03:00`;
  const deHoje = daSemana.filter((e) => e.inicio <= limiteDeHoje);

  return (
    <div style={{ backgroundColor: "var(--color-reboco)" }}>
      <Cabecalho foto="/fotos/eu-amo-ivoti.jpg" alt="">
        <BuscaCabecalho />
      </Cabecalho>

      {/* ---------------- capa, só no computador ---------------- */}
      <section className="mx-auto hidden max-w-[1440px] gap-10 px-16 pt-10 pb-6 lg:grid lg:grid-cols-12">
        <div className="lg:col-span-5">
          <p className="flex items-center gap-2">
            <Petunia tamanho={16} />
            <span
              className="text-[11px] font-bold tracking-[0.12em] uppercase"
              style={{ color: "var(--color-petunia)" }}
            >
              Ivoti · A Cidade das Flores
            </span>
          </p>

          <h1
            className="mt-3 text-[42px] leading-[1.06] font-bold"
            style={{
              color: "var(--color-texto)",
              fontFamily: "var(--fonte-titulo-nova)",
            }}
          >
            Flores, casas enxaimel, colônia japonesa e tudo o que a cidade tem
            para você.
          </h1>

          <p
            className="mt-4 max-w-[46ch] text-[15px]"
            style={{ color: "var(--color-texto-suave)" }}
          >
            Onde comer, beber, passear e se hospedar — com horário de hoje,
            endereço e rota no mapa. Feito por gente daqui.
          </p>

          <form action="/explorar" className="mt-6 flex gap-2">
            <input
              name="q"
              placeholder="O que você procura em Ivoti?"
              aria-label="Buscar no guia"
              className="h-12 flex-1 rounded-[11px] px-4 text-[14px] outline-none"
              style={{
                backgroundColor: "var(--color-superficie)",
                border: "2px solid var(--color-madeira)",
                color: "var(--color-texto)",
              }}
            />
            <button
              type="submit"
              className="h-12 shrink-0 rounded-[11px] px-6 text-[14px] font-bold"
              style={{
                backgroundColor: "var(--color-torii)",
                color: "#fff7ea",
              }}
            >
              Buscar
            </button>
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

        <div className="lg:col-span-7">
          <CardMadeira variante={2}>
            <div className="relative h-[420px]">
              <Image
                src="/fotos/portico-ivoti.jpg"
                alt="O Pórtico de Ivoti, na entrada da cidade"
                fill
                priority
                sizes="(max-width: 768px) 100vw, 55vw"
                className="object-cover"
              />
            </div>
          </CardMadeira>
        </div>
      </section>

      <FileiraDePetunias />

      {/* ---------------- categorias, só no celular ---------------- */}
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

      <div className="hidden lg:block">
        <FaixaEnxaimel />
      </div>

      {/* ---------------- eventos ---------------- */}
      <section className="pt-7 lg:mx-auto lg:max-w-[1440px] lg:px-16">
        <div className="px-4 lg:px-0">
          <TituloSecao selo="evento">
            <span className="lg:hidden">Acontece hoje</span>
            <span className="hidden lg:inline">Acontece esta semana</span>
          </TituloSecao>
        </div>

        {/* No celular a fileira rola de lado; na tela grande os quatro
            primeiros cabem em linha e rolar seria esconder de graça. */}
        <div className="mt-3 lg:hidden">
          {deHoje.length === 0 ? (
            <Vazio>
              Nada marcado para hoje.{" "}
              <Link href="/agenda" className="font-bold underline">
                Ver a agenda
              </Link>
            </Vazio>
          ) : (
            <Fileira>
              {deHoje.map((e, i) => (
                <CardEvento
                  key={e.id}
                  evento={e}
                  variante={i % 2 === 0 ? 1 : 2}
                />
              ))}
            </Fileira>
          )}
        </div>

        <div className="mt-4 hidden gap-4 lg:grid lg:grid-cols-4">
          {daSemana.length === 0 ? (
            <p
              className="text-[14px] lg:col-span-4"
              style={{ color: "var(--color-texto-suave)" }}
            >
              Nada marcado para os próximos dias.{" "}
              <Link href="/agenda" className="font-bold underline">
                Ver a agenda
              </Link>
            </p>
          ) : (
            daSemana.slice(0, 4).map((e, i) => (
              <div key={e.id} className="[&>div>div]:w-full [&_>div]:w-full">
                <CardEvento evento={e} variante={i % 2 === 0 ? 1 : 2} />
              </div>
            ))
          )}
        </div>
      </section>

      {/* ---------------- promoções e roteiro ---------------- */}
      <section className="pt-8 lg:mx-auto lg:max-w-[1440px] lg:px-16">
        <div className="lg:grid lg:grid-cols-12 lg:gap-8">
          <div className="px-4 lg:col-span-7 lg:px-0">
            <TituloSecao selo="promocao">Promoções de hoje</TituloSecao>
            <div className="mt-3 space-y-3 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
              {promocoes.length === 0 ? (
                <Vazio>Nenhuma promoção valendo hoje.</Vazio>
              ) : (
                promocoes.map((p, i) => (
                  <CardPromocao
                    key={p.id}
                    promocao={p}
                    variante={i % 2 === 0 ? 1 : 2}
                  />
                ))
              )}
            </div>
          </div>

          <div className="mt-8 lg:col-span-5 lg:mt-0">
            <div className="lg:h-full [&>section]:lg:flex [&>section]:lg:h-full [&>section]:lg:flex-col [&>section]:lg:justify-center [&>section]:lg:rounded-[4px]">
              <BlocoRoteiro />
            </div>
          </div>
        </div>
      </section>

      <div className="pt-8 lg:pt-10">
        <FaixaEnxaimel />
      </div>

      <SobreIvoti />
    </div>
  );
}
