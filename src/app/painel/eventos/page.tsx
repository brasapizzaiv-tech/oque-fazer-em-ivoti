import { createClient } from "@/lib/supabase/server";
import { quandoPorExtenso } from "@/lib/horarios";
import { planoDoModulo, planoEmUso, podeUsar } from "@/lib/planos";
import { Botao } from "@/components/vidro/pecas";
import {
  Caixa,
  Editar,
  Nenhum,
  SubTitulo,
  TituloPainel,
} from "@/components/painel/pecas";

export const dynamic = "force-dynamic";

const SITUACAO: Record<string, { texto: string; fundo: string }> = {
  em_analise: { texto: "Em análise", fundo: "var(--color-v-petunia)" },
  publicado: { texto: "Na agenda", fundo: "var(--color-v-verde)" },
  rejeitado: {
    texto: "Precisa de ajuste",
    fundo: "var(--color-v-fechado-claro)",
  },
};

/** Publicado, mas escondido: o plano de quem cadastrou não cobre eventos. */
const SEM_PLANO = { texto: "Fora do ar", fundo: "var(--color-v-fechado-claro)" };

type Linha = {
  id: string;
  titulo: string;
  inicio: string;
  sem_hora: boolean;
  status: string;
  criado_por: string | null;
  local_texto: string | null;
  local: { nome: string } | null;
};

/**
 * Quem, entre os autores, é comerciante sem plano que cubra eventos.
 *
 * Mesma pergunta que o banco faz em `eventos_visiveis`: evento sem autor ou
 * da administração aparece sempre; o de comerciante, só enquanto ele tiver
 * um estabelecimento com o plano do módulo. Aqui serve para a etiqueta não
 * dizer "Na agenda" de um evento que o visitante não vê.
 */
async function autoresSemPlano(
  supabase: Awaited<ReturnType<typeof createClient>>,
  autores: string[],
): Promise<Set<string>> {
  if (autores.length === 0) return new Set();

  const [{ data: perfis }, { data: locais }] = await Promise.all([
    supabase.from("perfis").select("id, papel").in("id", autores),
    supabase
      .from("locais")
      .select("dono_id, plano, plano_ate, gratis_ate")
      .in("dono_id", autores),
  ]);

  const comPlano = new Set(
    (locais ?? [])
      .filter((l) => podeUsar("eventos", planoEmUso(l)))
      .map((l) => l.dono_id as string),
  );
  const admins = new Set(
    (perfis ?? []).filter((p) => p.papel === "admin").map((p) => p.id),
  );

  return new Set(autores.filter((a) => !admins.has(a) && !comPlano.has(a)));
}

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
    .select(
      "id, titulo, inicio, sem_hora, status, criado_por, local_texto, local:locais(nome)",
    )
    .order("inicio", { ascending: false });

  if (!admin) consulta = consulta.eq("criado_por", user?.id ?? "");

  const { data } = await consulta;
  const eventos = (data ?? []) as unknown as Linha[];

  const semPlano = await autoresSemPlano(supabase, [
    ...new Set(eventos.map((e) => e.criado_por).filter((a) => a != null)),
  ]);

  const agora = Date.now();
  return {
    admin,
    semPlano,
    total: eventos.length,
    futuros: eventos.filter((e) => new Date(e.inicio).getTime() >= agora),
    passados: eventos.filter((e) => new Date(e.inicio).getTime() < agora),
  };
}

export default async function MeusEventos() {
  const { admin, semPlano, total, futuros, passados } = await buscarEventos();
  // Para o comerciante, o aviso vale para a lista toda: os eventos são dele.
  const avisarPlano = !admin && semPlano.size > 0 && futuros.length > 0;

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
          {avisarPlano && (
            <p
              className="mt-6 text-[14px]"
              style={{ color: "var(--color-v-texto-suave)" }}
            >
              Seus eventos não aparecem na agenda porque os dias grátis
              terminaram, o plano venceu ou não inclui eventos. Eles continuam guardados e voltam sozinhos quando
              o {planoDoModulo("eventos")} estiver em dia.
            </p>
          )}
          <Lista
            titulo="Próximos"
            eventos={futuros}
            semPlano={semPlano}
            vazio="Nenhum evento marcado daqui para frente."
          />
          {passados.length > 0 && (
            <Lista
              titulo="Já aconteceram"
              eventos={passados}
              semPlano={semPlano}
              apagado
            />
          )}
        </>
      )}
    </>
  );
}

function Lista({
  titulo,
  eventos,
  semPlano,
  vazio,
  apagado = false,
}: {
  titulo: string;
  eventos: Linha[];
  /** Autores cujo plano não cobre eventos: o publicado deles está escondido. */
  semPlano: Set<string>;
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
          style={{ color: "var(--color-v-texto-suave)" }}
        >
          {vazio}
        </p>
      ) : (
        <ul className={`mt-3 space-y-2 ${apagado ? "opacity-60" : ""}`}>
          {eventos.map((e) => {
            const escondido =
              e.status === "publicado" &&
              !apagado &&
              e.criado_por != null &&
              semPlano.has(e.criado_por);
            const s = escondido
              ? SEM_PLANO
              : (SITUACAO[e.status] ?? SITUACAO.em_analise);
            return (
              <li key={e.id}>
                <Caixa className="flex flex-wrap items-center gap-3">
                  <div className="min-w-0 flex-1">
                    <p
                      className="text-[15px] font-bold"
                      style={{ color: "var(--color-v-texto)" }}
                    >
                      {e.titulo}
                    </p>
                    <p
                      className="text-[13px]"
                      style={{ color: "var(--color-v-texto-suave)" }}
                    >
                      {quandoPorExtenso(e.inicio, e.sem_hora)}
                      {e.local?.nome
                        ? ` · ${e.local.nome}`
                        : e.local_texto
                          ? ` · ${e.local_texto}`
                          : ""}
                    </p>
                  </div>
                  <span
                    className="inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold tracking-[0.08em] uppercase"
                    style={{ backgroundColor: s.fundo, color: "#FFFFFF" }}
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
