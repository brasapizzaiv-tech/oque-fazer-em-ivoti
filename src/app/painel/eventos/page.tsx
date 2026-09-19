import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { quandoPorExtenso } from "@/lib/horarios";

export const dynamic = "force-dynamic";

const SITUACAO: Record<string, { texto: string; cor: string }> = {
  em_analise: { texto: "Em análise", cor: "bg-sol-100 text-sol-800" },
  publicado: { texto: "Na agenda", cor: "bg-mata-100 text-mata-800" },
  rejeitado: { texto: "Precisa de ajuste", cor: "bg-red-100 text-red-800" },
};

type Linha = {
  id: string;
  titulo: string;
  inicio: string;
  status: string;
  local_texto: string | null;
  local: { nome: string } | null;
};

/**
 * Busca os eventos e ja separa o que ainda vai acontecer do que ficou pra
 * tras. A leitura do relogio mora aqui, e nao no meio da tela: buscar dados
 * e olhar a hora sao as duas coisas que mudam a cada visita.
 */
async function buscarEventos() {
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

  // Mesma regra dos locais: a administracao enxerga tudo, o dono so o dele.
  let consulta = supabase
    .from("eventos")
    .select("id, titulo, inicio, status, local_texto, local:locais(nome)")
    .order("inicio", { ascending: false });

  if (!admin) consulta = consulta.eq("criado_por", user?.id ?? "");

  const { data } = await consulta;
  const eventos = (data ?? []) as unknown as Linha[];

  const agora = Date.now();
  return {
    admin,
    total: eventos.length,
    futuros: eventos.filter((e) => new Date(e.inicio).getTime() >= agora),
    passados: eventos.filter((e) => new Date(e.inicio).getTime() < agora),
  };
}

export default async function MeusEventos() {
  const { admin, total, futuros, passados } = await buscarEventos();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">
            {admin ? "Todos os eventos" : "Meus eventos"}
          </h1>
          <p className="text-sm text-tinta/55">
            Feira, show, festa — tudo que tem hora marcada.
          </p>
        </div>
        <Link
          href="/painel/eventos/novo"
          className="border-2 border-carvalho bg-carvalho px-5 py-2.5 text-sm font-semibold text-white hover:border-sol-700 hover:bg-sol-700"
        >
          + Cadastrar evento
        </Link>
      </div>

      {total === 0 ? (
        <div className="mt-6 border-2 border-dashed border-carvalho/40 bg-creme p-10 text-center">
          <p className="text-3xl">📅</p>
          <p className="mt-2 font-semibold">Nenhum evento cadastrado</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-tinta/60">
            Cadastre e ele entra na agenda do guia. O assistente também passa a
            indicar quando alguém perguntar o que fazer no fim de semana.
          </p>
          <Link
            href="/painel/eventos/novo"
            className="mt-5 inline-block border-2 border-carvalho bg-carvalho px-6 py-3 font-semibold text-white"
          >
            Cadastrar o primeiro
          </Link>
        </div>
      ) : (
        <>
          <Lista titulo="Próximos" eventos={futuros} vazio="Nenhum evento marcado daqui para frente." />
          {passados.length > 0 && (
            <Lista titulo="Já aconteceram" eventos={passados} apagado />
          )}
        </>
      )}
    </>
  );
}

function Lista({
  titulo,
  eventos,
  vazio,
  apagado = false,
}: {
  titulo: string;
  eventos: Linha[];
  vazio?: string;
  apagado?: boolean;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-tinta/60">{titulo}</h2>

      {eventos.length === 0 ? (
        <p className="mt-2 text-sm text-tinta/50">{vazio}</p>
      ) : (
        <ul className={`mt-3 space-y-2 ${apagado ? "opacity-60" : ""}`}>
          {eventos.map((e) => {
            const s = SITUACAO[e.status] ?? SITUACAO.em_analise;
            return (
              <li
                key={e.id}
                className="flex flex-wrap items-center gap-3 border-2 border-carvalho bg-creme p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-semibold">{e.titulo}</p>
                  <p className="text-sm text-tinta/55">
                    {quandoPorExtenso(e.inicio)}
                    {e.local?.nome
                      ? ` · ${e.local.nome}`
                      : e.local_texto
                        ? ` · ${e.local_texto}`
                        : ""}
                  </p>
                </div>
                <span
                  className={`rounded-full px-2.5 py-1 text-xs font-semibold ${s.cor}`}
                >
                  {s.texto}
                </span>
                <Link
                  href={`/painel/eventos/${e.id}`}
                  className="border-2 border-carvalho px-3 py-1.5 text-sm font-medium hover:bg-cal-sombra"
                >
                  Editar
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
