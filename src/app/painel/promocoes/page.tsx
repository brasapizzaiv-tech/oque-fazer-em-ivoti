import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { quandoVale, type Promocao } from "@/lib/promocoes";

export const dynamic = "force-dynamic";

type Linha = Promocao & { local: { nome: string } | null };

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
    .select("*, local:locais(nome)")
    .order("ativa", { ascending: false })
    .order("titulo");

  const lista = (data ?? []) as unknown as Linha[];
  return {
    admin,
    ativas: lista.filter((p) => p.ativa),
    guardadas: lista.filter((p) => !p.ativa),
    total: lista.length,
  };
}

export default async function Promocoes() {
  const { admin, ativas, guardadas, total } = await buscar();

  return (
    <>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-lg font-semibold">
            {admin ? "Todas as promoções" : "Minhas promoções"}
          </h1>
          <p className="text-sm text-tinta/55">
            As que se repetem: quinta de caipirinha, happy hour, promoção do
            almoço.
          </p>
        </div>
        <Link
          href="/painel/promocoes/nova"
          className="border-2 border-carvalho bg-carvalho px-5 py-2.5 text-sm font-semibold text-white hover:border-sol-700 hover:bg-sol-700"
        >
          + Cadastrar promoção
        </Link>
      </div>

      {total === 0 ? (
        <div className="mt-6 border-2 border-dashed border-carvalho/40 bg-creme p-10 text-center">
          <p className="text-3xl">🏷️</p>
          <p className="mt-2 font-semibold">Nenhuma promoção cadastrada</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-tinta/60">
            Cadastre e ela aparece na sua página e no Explorar, no dia certo.
            Quem abrir o guia numa quinta vê as promoções de quinta.
          </p>
          <Link
            href="/painel/promocoes/nova"
            className="mt-5 inline-block border-2 border-carvalho bg-carvalho px-6 py-3 font-semibold text-white"
          >
            Cadastrar a primeira
          </Link>
        </div>
      ) : (
        <>
          <Lista
            titulo="No ar"
            promocoes={ativas}
            vazio="Nenhuma promoção no ar agora."
          />
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
  apagado = false,
}: {
  titulo: string;
  promocoes: Linha[];
  vazio?: string;
  apagado?: boolean;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-tinta/60">{titulo}</h2>

      {promocoes.length === 0 ? (
        <p className="mt-2 text-sm text-tinta/50">{vazio}</p>
      ) : (
        <ul className={`mt-3 space-y-2 ${apagado ? "opacity-60" : ""}`}>
          {promocoes.map((p) => (
            <li
              key={p.id}
              className="flex flex-wrap items-center gap-3 border-2 border-carvalho bg-creme p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="font-semibold">{p.titulo}</p>
                <p className="text-sm text-tinta/55">
                  {quandoVale(p)}
                  {p.local?.nome ? ` · ${p.local.nome}` : ""}
                  {p.vale_ate ? ` · até ${porExtenso(p.vale_ate)}` : ""}
                </p>
              </div>
              <Link
                href={`/painel/promocoes/${p.id}`}
                className="border-2 border-carvalho px-3 py-1.5 text-sm font-medium hover:bg-cal-sombra"
              >
                Editar
              </Link>
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
