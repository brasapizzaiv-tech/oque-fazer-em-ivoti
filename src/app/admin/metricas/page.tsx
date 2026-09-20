import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { resumoDoSite } from "@/lib/metricas-resumo";
import {
  BarrasRanqueadas,
  GraficoDias,
  Numero,
} from "@/components/painel/Graficos";

export const dynamic = "force-dynamic";

const PERIODOS = [
  { dias: 7, rotulo: "7 dias" },
  { dias: 30, rotulo: "30 dias" },
  { dias: 90, rotulo: "90 dias" },
];

export default async function MetricasDoSite({
  searchParams,
}: PageProps<"/admin/metricas">) {
  const params = await searchParams;
  const dias =
    Number(params.dias) === 7 ? 7 : Number(params.dias) === 90 ? 90 : 30;

  const supabase = await createClient();
  const resumo = await resumoDoSite(dias, supabase);

  // Traduz os identificadores dos locais mais vistos em nomes.
  const { data: locais } = await supabase
    .from("locais")
    .select("id, slug, nome")
    .in(
      "id",
      resumo.locais.slice(0, 10).map((l) => l.local_id),
    );

  const nomePorId = new Map((locais ?? []).map((l) => [l.id, l]));

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/admin" className="text-sm text-tinta/55 hover:text-sol-700">
        ← Administração
      </Link>

      <div className="mt-2 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Movimento do guia</h1>
          <p className="text-sm text-tinta/55">
            O que aconteceu no site inteiro nos últimos {dias} dias.
          </p>
        </div>

        <div className="flex gap-1.5">
          {PERIODOS.map((p) => (
            <Link
              key={p.dias}
              href={`/admin/metricas?dias=${p.dias}`}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                dias === p.dias
                  ? "bg-carvalho font-semibold text-creme"
                  : "border border-carvalho/25 bg-creme hover:bg-cal-sombra"
              }`}
            >
              {p.rotulo}
            </Link>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <Numero
          valor={resumo.acessos}
          rotulo="Páginas abertas"
          dica={`nos últimos ${dias} dias`}
          destaque
        />
        <Numero
          valor={resumo.indicacoes}
          rotulo="Indicações do Guia"
          dica="visitantes que o guia mandou para algum comércio"
        />
      </div>

      <section className="mt-6 border-2 border-carvalho bg-creme p-5">
        <h2 className="font-semibold">Acessos por dia</h2>
        <p className="text-sm text-tinta/55">
          Passe o dedo ou o mouse numa barra para ver o dia.
        </p>
        <div className="mt-4">
          <GraficoDias dados={resumo.porDia} rotulo="páginas abertas" />
        </div>
      </section>

      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        <section className="border-2 border-carvalho bg-creme p-5">
          <h2 className="font-semibold">Estabelecimentos mais procurados</h2>
          <p className="mb-4 text-sm text-tinta/55">
            Bom argumento na hora de oferecer o plano.
          </p>
          <BarrasRanqueadas
            itens={resumo.locais.slice(0, 10).map((l) => ({
              rotulo: nomePorId.get(l.local_id)?.nome ?? "—",
              contagem: l.contagem,
            }))}
            vazio="Ninguém abriu página de estabelecimento ainda."
          />
        </section>

        <section className="border-2 border-carvalho bg-creme p-5">
          <h2 className="font-semibold">Páginas mais vistas</h2>
          <p className="mb-4 text-sm text-tinta/55">Do site inteiro.</p>
          <BarrasRanqueadas
            itens={resumo.paginas.slice(0, 10).map((p) => ({
              rotulo: p.chave === "/" ? "Início" : p.chave,
              contagem: p.contagem,
            }))}
          />
        </section>
      </div>

      <section className="mt-6 border-2 border-carvalho bg-creme p-5">
        <h2 className="font-semibold">De onde vieram</h2>
        <p className="mb-4 text-sm text-tinta/55">
          &quot;Direto&quot; é quem digitou o endereço ou salvou o site — e
          também quem veio de aplicativo de mensagem, que não informa a origem.
        </p>
        <BarrasRanqueadas
          itens={resumo.origens.slice(0, 10).map((o) => ({
            rotulo: o.chave === "direto" ? "Direto" : o.chave,
            contagem: o.contagem,
          }))}
        />
      </section>
    </div>
  );
}
