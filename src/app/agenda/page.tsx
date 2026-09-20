import Link from "next/link";
import type { Metadata } from "next";
import Cabecalho from "@/components/enxaimel/Cabecalho";
import { LinhaEvento } from "@/components/enxaimel/blocos";
import { CasaEnxaimel } from "@/components/enxaimel/icones";
import { FaixaEnxaimel, Legenda } from "@/components/enxaimel/pecas";
import { eventosVisiveis } from "@/lib/eventos";
import { FUSO } from "@/lib/horarios";

export const revalidate = 120;

export const metadata: Metadata = {
  title: "Agenda",
  description:
    "O que vai acontecer em Ivoti: shows, feiras, festas e encontros.",
};

/**
 * Os eventos agrupados por dia.
 *
 * Agenda sem agrupamento vira uma lista longa em que a pessoa precisa
 * comparar datas de cabeça para saber o que é de hoje e o que é de daqui a
 * duas semanas. O título de cada dia faz esse trabalho por ela.
 */
function porDia(eventos: Awaited<ReturnType<typeof eventosVisiveis>>) {
  const grupos = new Map<string, typeof eventos>();
  for (const e of eventos) {
    const dia = new Date(e.inicio).toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "2-digit",
      month: "long",
      timeZone: FUSO,
    });
    const atual = grupos.get(dia) ?? [];
    atual.push(e);
    grupos.set(dia, atual);
  }
  return [...grupos.entries()];
}

export default async function Agenda() {
  const eventos = await eventosVisiveis({ limite: 40 });
  const dias = porDia(eventos);

  return (
    <div style={{ backgroundColor: "var(--color-reboco)" }}>
      <Cabecalho foto="/fotos/portico-ivoti.jpg" alt="">
        <div className="flex items-center gap-2">
          <h1
            className="text-[22px] leading-none font-bold"
            style={{
              color: "var(--color-creme-claro)",
              fontFamily: "var(--fonte-titulo-nova)",
            }}
          >
            Agenda
          </h1>
          <CasaEnxaimel
            tamanho={26}
            style={{ color: "var(--color-creme-claro)" }}
          />
        </div>
      </Cabecalho>

      <div className="mx-auto lg:max-w-[880px] lg:px-8 lg:pb-12">
        <div className="hidden px-4 pt-8 lg:block lg:px-0">
          <div className="flex items-center gap-2">
            <h1
              className="text-[30px] leading-none font-bold"
              style={{
                color: "var(--color-texto)",
                fontFamily: "var(--fonte-titulo-nova)",
              }}
            >
              Agenda
            </h1>
            <CasaEnxaimel
              tamanho={30}
              style={{ color: "var(--color-madeira)" }}
            />
          </div>
        </div>

        <div className="px-4 pt-5 lg:px-0">
          <p
            className="text-[14px]"
            style={{ color: "var(--color-texto-suave)" }}
          >
            {eventos.length === 0
              ? "Nenhum evento marcado por enquanto."
              : `${eventos.length} ${eventos.length === 1 ? "evento" : "eventos"} pela frente.`}
          </p>
        </div>

        <div className="pt-4">
          <FaixaEnxaimel />
        </div>

        {eventos.length === 0 ? (
          <div className="px-4 py-10 text-center lg:px-0">
            <p
              className="text-[14px]"
              style={{ color: "var(--color-texto-suave)" }}
            >
              Ainda não há nada marcado. Se você tem um estabelecimento, pode
              cadastrar seu evento — é grátis.
            </p>
            <Link
              href="/painel"
              className="mt-5 inline-flex h-12 items-center rounded-[11px] px-6 text-[14px] font-bold"
              style={{
                backgroundColor: "var(--color-torii)",
                color: "#fff7ea",
              }}
            >
              Cadastrar um evento
            </Link>
          </div>
        ) : (
          <div className="space-y-7 px-4 pt-6 pb-10 lg:px-0">
            {dias.map(([dia, doDia]) => (
              <section key={dia}>
                <Legenda>{dia}</Legenda>
                <div className="mt-2.5 space-y-3">
                  {doDia.map((e) => (
                    <LinhaEvento key={e.id} evento={e} />
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
