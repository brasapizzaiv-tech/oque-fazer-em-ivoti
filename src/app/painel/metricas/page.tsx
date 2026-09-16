import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { resumoDoLocal } from "@/lib/metricas-resumo";
import { NOME_DO_TIPO } from "@/lib/metricas";
import { planoAtivo, podeUsar } from "@/lib/planos";
import { BarrasRanqueadas, GraficoDias, Numero } from "@/components/painel/Graficos";
import Bloqueado from "@/components/painel/Bloqueado";
import EscolherLocal from "@/components/painel/EscolherLocal";

export const dynamic = "force-dynamic";

const PERIODOS = [
  { dias: 7, rotulo: "7 dias" },
  { dias: 30, rotulo: "30 dias" },
  { dias: 90, rotulo: "90 dias" },
];

export default async function Metricas({
  searchParams,
}: PageProps<"/painel/metricas">) {
  const params = await searchParams;
  const dias = Number(params.dias) === 7 ? 7 : Number(params.dias) === 90 ? 90 : 30;
  const escolhido = String(params.local ?? "");

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = await supabase
    .from("perfis")
    .select("papel")
    .eq("id", user?.id ?? "")
    .maybeSingle();
  const admin = perfil?.papel === "admin";

  let consulta = supabase
    .from("locais")
    .select("id, nome, plano, plano_ate")
    .order("nome");
  if (!admin) consulta = consulta.eq("dono_id", user?.id ?? "");

  const { data: meus } = await consulta;
  const locais = meus ?? [];

  if (locais.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-mata-200 bg-white p-10 text-center">
        <p className="text-3xl">📈</p>
        <p className="mt-2 font-semibold">Nada para medir ainda</p>
        <p className="mx-auto mt-1 max-w-sm text-sm text-tinta/60">
          Cadastre seu estabelecimento e o guia começa a contar quem visitou e
          quem clicou no seu contato.
        </p>
      </div>
    );
  }

  const local = locais.find((l) => l.id === escolhido) ?? locais[0];
  const plano = planoAtivo(local.plano, local.plano_ate);
  // A administracao enxerga as metricas de qualquer local, premium ou nao:
  // e voce quem precisa saber como o guia inteiro esta indo para decidir o
  // que melhorar e o que oferecer a quem. O bloqueio continua valendo para o
  // comerciante: no login dele, so o premium abre os numeros.
  const liberado = admin || podeUsar("metricas", plano);
  const vendoComoAdmin = admin && !podeUsar("metricas", plano);
  const resumo = await resumoDoLocal(local.id, dias, supabase);

  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">Métricas</h1>
          <p className="text-sm text-tinta/55">
            Quem procurou {local.nome} e o que fez na página.
          </p>
        </div>

        <div className="flex gap-1.5">
          {PERIODOS.map((p) => (
            <Link
              key={p.dias}
              href={`/painel/metricas?local=${local.id}&dias=${p.dias}`}
              className={`rounded-full px-3 py-1.5 text-sm transition ${
                dias === p.dias
                  ? "bg-mata-600 font-semibold text-white"
                  : "border border-mata-200 bg-white hover:bg-mata-50"
              }`}
            >
              {p.rotulo}
            </Link>
          ))}
        </div>
      </div>

      <EscolherLocal locais={locais} escolhido={local.id} dias={dias} />

      {vendoComoAdmin && (
        <p className="mt-4 rounded-xl border border-sol-200 bg-sol-50 px-3 py-2 text-sm text-sol-900">
          Voce esta vendo como administracao. {local.nome} esta no plano
          gratuito — no painel do proprio estabelecimento, estes numeros
          aparecem bloqueados.
        </p>
      )}

      {/* O total de acessos é gratuito de propósito: é o número que faz o
          comerciante querer saber o resto. */}
      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <Numero
          valor={resumo.acessos}
          rotulo="Acessos à sua página"
          dica={`nos últimos ${dias} dias`}
          destaque
        />
        {liberado ? (
          <>
            <Numero
              valor={resumo.indicacoes}
              rotulo="Indicações do Guia"
              dica="pessoas que saíram daqui para você"
            />
            <Numero
              valor={resumo.cliques.reduce((s, c) => s + c.contagem, 0)}
              rotulo="Cliques nos seus contatos"
              dica="telefone, WhatsApp, site, rota"
            />
          </>
        ) : (
          <div className="sm:col-span-2">
            <Bloqueado modulo="metricas" nome={local.nome}>
              <div className="grid gap-3 p-1 sm:grid-cols-2">
                <Numero valor={resumo.indicacoes} rotulo="Indicações do Guia" />
                <Numero
                  valor={resumo.cliques.reduce((s, c) => s + c.contagem, 0)}
                  rotulo="Cliques nos seus contatos"
                />
              </div>
            </Bloqueado>
          </div>
        )}
      </div>

      {liberado ? (
        <>
          <Detalhes resumo={resumo} dias={dias} />

          {/* Quem paga costuma querer os numeros fora daqui: juntar com o
              faturamento, mandar para o contador, guardar o historico antes
              de o periodo sair da tela. */}
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-mata-100 bg-white px-5 py-4">
            <div>
              <p className="font-semibold">Levar para uma planilha</p>
              <p className="text-sm text-tinta/55">
                Dia a dia dos ultimos {dias} dias, pronto para abrir no Excel.
              </p>
            </div>
            <a
              href={`/api/metricas/exportar?local=${local.id}&dias=${dias}`}
              className="rounded-full border border-mata-300 px-5 py-2.5 text-sm font-semibold text-mata-700 transition hover:bg-mata-50"
            >
              Baixar planilha
            </a>
          </div>
        </>
      ) : (
        <div className="mt-6">
          <Bloqueado modulo="metricas" nome={local.nome}>
            <Detalhes resumo={resumo} dias={dias} />
          </Bloqueado>
        </div>
      )}
    </>
  );
}

function Detalhes({
  resumo,
  dias,
}: {
  resumo: Awaited<ReturnType<typeof resumoDoLocal>>;
  dias: number;
}) {
  return (
    <div className="mt-6 space-y-6">
      <section className="rounded-2xl border border-mata-100 bg-white p-5">
        <h2 className="font-semibold">Acessos por dia</h2>
        <p className="text-sm text-tinta/55">
          Últimos {dias} dias. Passe o dedo ou o mouse numa barra para ver o dia.
        </p>
        <div className="mt-4">
          <GraficoDias dados={resumo.porDia} />
        </div>
      </section>

      <div className="grid gap-6 sm:grid-cols-2">
        <section className="rounded-2xl border border-mata-100 bg-white p-5">
          <h2 className="font-semibold">Onde as pessoas clicaram</h2>
          <p className="mb-4 text-sm text-tinta/55">
            Cada clique é alguém tentando falar com você.
          </p>
          <BarrasRanqueadas
            itens={resumo.cliques.map((c) => ({
              rotulo: NOME_DO_TIPO[c.tipo],
              contagem: c.contagem,
            }))}
            vazio="Ninguém clicou nos seus contatos ainda."
          />
        </section>

        <section className="rounded-2xl border border-mata-100 bg-white p-5">
          <h2 className="font-semibold">Eventos e promoções</h2>
          <p className="mb-4 text-sm text-tinta/55">
            Quantas vezes apareceram para alguém.
          </p>
          <BarrasRanqueadas
            itens={[
              { rotulo: "Eventos vistos", contagem: resumo.eventosVistos },
              { rotulo: "Promoções vistas", contagem: resumo.promocoesVistas },
            ].filter((i) => i.contagem > 0)}
            vazio="Cadastre um evento ou uma promoção para ver este número."
          />
        </section>
      </div>
    </div>
  );
}
