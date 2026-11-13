import Link from "next/link";
import { SubTitulo, TituloPainel } from "@/components/painel/pecas";
import ControlePlano from "./ControlePlano";
import { createClient } from "@/lib/supabase/server";
import {
  ORDEM_DOS_PLANOS,
  PLANOS,
  planoAtivo,
  precoPorExtenso,
} from "@/lib/planos";

export const dynamic = "force-dynamic";

type Linha = {
  id: string;
  slug: string;
  nome: string;
  bairro: string | null;
  plano: string;
  plano_ate: string | null;
  plano_desde: string | null;
  dono_id: string | null;
  categoria: { nome: string } | null;
};

export default async function Planos() {
  const supabase = await createClient();

  const { data } = await supabase
    .from("locais")
    .select(
      "id, slug, nome, bairro, plano, plano_ate, plano_desde, dono_id, categoria:categorias(nome)",
    )
    .eq("status", "publicado")
    .order("nome");

  const locais = (data ?? []) as unknown as Linha[];
  const ativoDe = (l: Linha) => planoAtivo(l.plano, l.plano_ate);

  const semPlano = locais.filter((l) => ativoDe(l) === "gratuito");
  // Lugar sem dono é ponto da cidade: praça, ponte, memorial. Não é
  // cliente em potencial, então não entra na conta de quem falta cobrar.
  const comerciosSemPlano = semPlano.filter((l) => l.dono_id !== null);
  const pontosDaCidade = semPlano.filter((l) => l.dono_id === null);

  const mensal = locais.reduce((soma, l) => {
    const p = ativoDe(l);
    return p === "gratuito" ? soma : soma + PLANOS[p].centavos;
  }, 0);

  return (
    <div>
      <TituloPainel>Planos</TituloPainel>
      <p className="mt-1 text-[14px] texto-suave">
        Você combina o pagamento fora do site e marca aqui qual plano vale e até
        quando. Quando a data passa, os recursos do plano se fecham sozinhos —
        nada é apagado.
      </p>

      <div className="mt-6 flex flex-wrap gap-3 text-sm">
        <span className="aviso-painel px-4 py-2.5">
          <strong className="text-lg">{precoPorExtenso(mensal)}</strong> por mês
          em planos ativos
        </span>
        {ORDEM_DOS_PLANOS.map((p) => (
          <span key={p} className="caixa-painel px-4 py-2.5">
            <strong className="text-lg">
              {locais.filter((l) => ativoDe(l) === p).length}
            </strong>{" "}
            {PLANOS[p].nome}
          </span>
        ))}
        <span className="caixa-painel px-4 py-2.5">
          <strong className="text-lg">{comerciosSemPlano.length}</strong> sem
          plano
        </span>
      </div>

      {[...ORDEM_DOS_PLANOS].reverse().map((p) => {
        const doPlano = locais.filter((l) => ativoDe(l) === p);
        return doPlano.length > 0 ? (
          <Grupo
            key={p}
            titulo={`${PLANOS[p].nome} · ${precoPorExtenso(PLANOS[p].centavos)}`}
            locais={doPlano}
          />
        ) : null;
      })}

      <Grupo
        titulo="Comércios sem plano"
        locais={comerciosSemPlano}
        vazio="Nenhum comércio publicado sem plano."
      />

      {pontosDaCidade.length > 0 && (
        <section className="mt-8">
          <SubTitulo>Pontos da cidade</SubTitulo>
          <p className="mt-1 text-sm texto-suave">
            Praças, monumentos e atrativos públicos. Ficam no guia de graça: são
            o motivo de o visitante abrir o site.
          </p>
          <p className="mt-2 text-sm">
            {pontosDaCidade.map((l) => l.nome).join(" · ")}
          </p>
        </section>
      )}
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
      <SubTitulo>{titulo}</SubTitulo>

      {locais.length === 0 ? (
        <p className="mt-2 text-sm texto-suave">{vazio}</p>
      ) : (
        <ul className="mt-3 space-y-3">
          {locais.map((l) => (
            <li key={l.id} className="caixa-painel p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <Link href={`/local/${l.slug}`} className="font-semibold">
                  {l.nome}
                </Link>
                <span className="text-sm texto-suave">
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
