import Link from "next/link";
import ControlePlano from "./ControlePlano";
import { createClient } from "@/lib/supabase/server";
import { planoAtivo } from "@/lib/planos";

export const dynamic = "force-dynamic";

type Linha = {
  id: string;
  slug: string;
  nome: string;
  bairro: string | null;
  plano: string;
  plano_ate: string | null;
  plano_desde: string | null;
  categoria: { nome: string } | null;
};

export default async function Planos() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("locais")
    .select(
      "id, slug, nome, bairro, plano, plano_ate, plano_desde, categoria:categorias(nome)",
    )
    .eq("status", "publicado")
    .order("nome");

  const locais = (data ?? []) as unknown as Linha[];

  const premium = locais.filter(
    (l) => planoAtivo(l.plano, l.plano_ate) === "premium",
  );
  const gratuitos = locais.filter(
    (l) => planoAtivo(l.plano, l.plano_ate) === "gratuito",
  );

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <Link href="/admin" className="text-sm text-tinta/55 hover:text-mata-700">
        ← Administração
      </Link>

      <h1 className="mt-2 text-xl font-bold">Planos</h1>
      <p className="text-sm text-tinta/55">
        Você combina o pagamento fora do site e marca aqui até quando vale.
        Quando a data passa, o plano volta para gratuito sozinho — nada é
        apagado, só fica bloqueado.
      </p>

      <div className="mt-6 flex gap-3 text-sm">
        <span className="rounded-xl bg-sol-50 px-4 py-2.5">
          <strong className="text-lg">{premium.length}</strong> premium
        </span>
        <span className="rounded-xl bg-mata-50 px-4 py-2.5">
          <strong className="text-lg">{gratuitos.length}</strong> gratuitos
        </span>
      </div>

      {premium.length > 0 && (
        <Grupo titulo="Premium" locais={premium} />
      )}
      <Grupo
        titulo="Gratuitos"
        locais={gratuitos}
        vazio="Nenhum estabelecimento no plano gratuito."
      />
    </div>
  );
}

function Grupo({
  titulo,
  locais,
  vazio,
}: {
  titulo: string;
  locais: Linha[];
  vazio?: string;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold text-tinta/60">{titulo}</h2>

      {locais.length === 0 ? (
        <p className="mt-2 text-sm text-tinta/50">{vazio}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {locais.map((l) => (
            <li
              key={l.id}
              className="rounded-2xl border border-mata-100 bg-white p-4"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link href={`/local/${l.slug}`} className="font-semibold">
                  {l.nome}
                </Link>
                <span className="text-sm text-tinta/50">
                  {l.categoria?.nome}
                  {l.bairro ? ` · ${l.bairro}` : ""}
                </span>
              </div>

              <ControlePlano
                local={l.id}
                nome={l.nome}
                plano={l.plano}
                planoAte={l.plano_ate}
                planoDesde={l.plano_desde}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
