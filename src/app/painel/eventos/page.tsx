import { createClient } from "@/lib/supabase/server";
import { quandoPorExtenso } from "@/lib/horarios";
import { Botao } from "@/components/enxaimel/pecas";
import {
  Caixa,
  Editar,
  Nenhum,
  SubTitulo,
  TituloPainel,
} from "@/components/painel/pecas";

export const dynamic = "force-dynamic";

const SITUACAO: Record<string, { texto: string; fundo: string }> = {
  em_analise: { texto: "Em análise", fundo: "var(--color-petunia)" },
  publicado: { texto: "Na agenda", fundo: "var(--color-veneziana)" },
  rejeitado: { texto: "Precisa de ajuste", fundo: "var(--color-telha)" },
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
      <TituloPainel
        apoio="Feira, show, festa — tudo o que tem hora marcada."
        acao={
          <Botao href="/painel/eventos/novo">
            <span aria-hidden>+</span> Cadastrar evento
          </Botao>
        }
      >
        {admin ? "Todos os eventos" : "Meus eventos"}
      </TituloPainel>

      {total === 0 ? (
        <div className="mt-6">
          <Nenhum
            titulo="Nenhum evento cadastrado"
            acao={
              <Botao href="/painel/eventos/novo">Cadastrar o primeiro</Botao>
            }
          >
            Cadastre e ele entra na agenda do guia. O assistente também passa a
            indicar quando alguém perguntar o que fazer no fim de semana.
          </Nenhum>
        </div>
      ) : (
        <>
          <Lista
            titulo="Próximos"
            eventos={futuros}
            vazio="Nenhum evento marcado daqui para frente."
          />
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
  /** O que já passou entra esmaecido: continua acessível, sem disputar a vez. */
  apagado?: boolean;
}) {
  return (
    <section className="mt-8">
      <SubTitulo>{titulo}</SubTitulo>

      {eventos.length === 0 ? (
        <p
          className="mt-2 text-[14px]"
          style={{ color: "var(--color-texto-suave)" }}
        >
          {vazio}
        </p>
      ) : (
        <ul className={`mt-3 space-y-2 ${apagado ? "opacity-60" : ""}`}>
          {eventos.map((e) => {
            const s = SITUACAO[e.status] ?? SITUACAO.em_analise;
            return (
              <li key={e.id}>
                <Caixa className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[15px] font-bold"
                      style={{ color: "var(--color-texto)" }}
                    >
                      {e.titulo}
                    </p>
                    <p
                      className="text-[13px]"
                      style={{ color: "var(--color-texto-suave)" }}
                    >
                      {quandoPorExtenso(e.inicio)}
                      {e.local?.nome
                        ? ` · ${e.local.nome}`
                        : e.local_texto
                          ? ` · ${e.local_texto}`
                          : ""}
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold tracking-[0.08em] uppercase"
                    style={{ backgroundColor: s.fundo, color: "#fff7ea" }}
                  >
                    {s.texto}
                  </span>
                  <Editar href={`/painel/eventos/${e.id}`} />
                </Caixa>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
