import { createClient } from "@/lib/supabase/server";
import { quandoVale, type Promocao } from "@/lib/promocoes";
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

type Linha = Promocao & {
  local: {
    nome: string;
    plano: string | null;
    plano_ate: string | null;
    gratis_ate: string | null;
  } | null;
};

/**
 * O plano do lugar ainda cobre promoções?
 *
 * Mesma pergunta que o banco faz em `promocoes_de_hoje`: plano vencido, ou
 * abaixo do que o módulo pede, tira a promoção do ar sem apagá-la.
 */
function planoCobre(p: Linha): boolean {
  return podeUsar(
    "promocoes",
    planoEmUso({
      plano: p.local?.plano,
      plano_ate: p.local?.plano_ate,
      gratis_ate: p.local?.gratis_ate,
    }),
  );
}

async function buscar() {
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

  // As regras de acesso do banco ja limitam ao que a pessoa pode editar; o
  // admin enxerga tudo por elas mesmas.
  const { data } = await supabase
    .from("promocoes")
    .select("*, local:locais(nome, plano, plano_ate, gratis_ate)")
    .order("ativa", { ascending: false })
    .order("titulo");

  const lista = (data ?? []) as unknown as Linha[];
  return {
    admin,
    ativas: lista.filter((p) => p.ativa && planoCobre(p)),
    semPlano: lista.filter((p) => p.ativa && !planoCobre(p)),
    guardadas: lista.filter((p) => !p.ativa),
    total: lista.length,
  };
}

export default async function Promocoes() {
  const { admin, ativas, semPlano, guardadas, total } = await buscar();

  return (
    <>
      <TituloPainel
        apoio="As que se repetem: quinta de caipirinha, happy hour, promoção do almoço."
        acao={
          <Botao href="/painel/promocoes/nova">
            <span aria-hidden>+</span> Cadastrar promoção
          </Botao>
        }
      >
        {admin ? "Todas as promoções" : "Minhas promoções"}
      </TituloPainel>

      {total === 0 ? (
        <div className="mt-6">
          <Nenhum
            titulo="Nenhuma promoção cadastrada"
            acao={
              <Botao href="/painel/promocoes/nova">Cadastrar a primeira</Botao>
            }
          >
            Cadastre e ela aparece na sua página e no Explorar, no dia certo.
            Quem abrir o guia numa quinta vê as promoções de quinta.
          </Nenhum>
        </div>
      ) : (
        <>
          <Lista
            titulo="No ar"
            promocoes={ativas}
            vazio="Nenhuma promoção no ar agora."
          />
          {semPlano.length > 0 && (
            <Lista
              titulo="Fora do ar"
              aviso={`Não aparecem no guia porque os dias grátis terminaram, o plano do lugar venceu ou não inclui promoções. Voltam sozinhas quando o ${planoDoModulo("promocoes")} estiver em dia.`}
              promocoes={semPlano}
              apagado
            />
          )}
          {guardadas.length > 0 && (
            <Lista titulo="Guardadas" promocoes={guardadas} apagado />
          )}
        </>
      )}
    </>
  );
}

function Lista({
  titulo,
  promocoes,
  vazio,
  aviso,
  apagado = false,
}: {
  titulo: string;
  promocoes: Linha[];
  vazio?: string;
  /** Uma frase sob o título, para explicar por que a lista existe. */
  aviso?: string;
  /** As guardadas entram esmaecidas: continuam acessíveis, sem disputar a vez. */
  apagado?: boolean;
}) {
  return (
    <section className="mt-8">
      <SubTitulo>{titulo}</SubTitulo>
      {aviso && (
        <p
          className="mt-2 text-[14px]"
          style={{ color: "var(--color-v-texto-suave)" }}
        >
          {aviso}
        </p>
      )}

      {promocoes.length === 0 ? (
        <p
          className="mt-2 text-[14px]"
          style={{ color: "var(--color-v-texto-suave)" }}
        >
          {vazio}
        </p>
      ) : (
        <ul className={`mt-3 space-y-2 ${apagado ? "opacity-60" : ""}`}>
          {promocoes.map((p) => (
            <li key={p.id}>
              <Caixa className="flex flex-wrap items-center gap-3">
                <div className="min-w-0 flex-1">
                  <p
                    className="text-[15px] font-bold"
                    style={{ color: "var(--color-v-texto)" }}
                  >
                    {p.titulo}
                  </p>
                  <p
                    className="text-[13px]"
                    style={{ color: "var(--color-v-texto-suave)" }}
                  >
                    {quandoVale(p)}
                    {p.local?.nome ? ` · ${p.local.nome}` : ""}
                    {p.vale_ate ? ` · até ${porExtenso(p.vale_ate)}` : ""}
                  </p>
                </div>
                <Editar href={`/painel/promocoes/${p.id}`} />
              </Caixa>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function porExtenso(data: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
    day: "2-digit",
    month: "2-digit",
  }).format(new Date(`${data}T12:00:00-03:00`));
}
