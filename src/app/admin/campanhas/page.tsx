import type { Metadata } from "next";
import { SubTitulo, TituloPainel } from "@/components/painel/pecas";
import { createClient } from "@/lib/supabase/server";
import { listarCampanhas, relatoriosDasCampanhas } from "@/lib/campanhas";
import { CLIQUES_DE_CONTATO, NOME_DO_TIPO } from "@/lib/metricas";
import { SITE } from "@/lib/site";
import CopiarLink from "./CopiarLink";
import CotasDaCampanha from "./CotasDaCampanha";
import NovaCampanha from "./NovaCampanha";

export const dynamic = "force-dynamic";

export const metadata: Metadata = { title: "Campanhas" };

/**
 * As campanhas com influenciador e o que cada uma trouxe.
 *
 * É a tela que fecha a venda da próxima cota: o link para entregar ao
 * influenciador e, depois do vídeo, o número de pessoas que chegaram por
 * ele e o que fizeram em cada estabelecimento.
 */
export default async function Campanhas() {
  const supabase = await createClient();

  const [campanhas, { data: locaisBrutos }] = await Promise.all([
    listarCampanhas(supabase),
    supabase
      .from("locais")
      .select("id, nome, dono_id")
      .eq("status", "publicado")
      .order("nome"),
  ]);

  const locais = locaisBrutos ?? [];
  const nomeDe = new Map(locais.map((l) => [l.id, l.nome]));
  // Cota é coisa de comércio: os pontos da cidade não entram na escolha.
  const comercios = locais
    .filter((l) => l.dono_id !== null)
    .map((l) => ({ id: l.id, nome: l.nome }));

  const relatorios = await relatoriosDasCampanhas(
    supabase,
    campanhas.map((c) => c.id),
  );

  return (
    <div>
      <TituloPainel>Campanhas</TituloPainel>
      <p className="mt-1 max-w-[70ch] text-[14px] texto-suave">
        Cada campanha tem um link próprio. Entregue o link ao influenciador para
        pôr na bio e nos stories: tudo o que o visitante fizer depois de chegar
        por ele, nos sete dias seguintes, entra no relatório.
      </p>

      <div className="mt-5">
        <NovaCampanha locais={comercios} />
      </div>

      {campanhas.length === 0 ? (
        <p className="mt-8 text-sm texto-suave">
          Nenhuma campanha criada ainda.
        </p>
      ) : (
        <ul className="mt-8 space-y-5">
          {campanhas.map((c) => {
            const r = relatorios[c.id];
            // As cotas primeiro; depois, quem recebeu visita sem ter cota —
            // o visitante passeia pelo guia inteiro, e isso também é
            // argumento para vender a cota da próxima campanha.
            const idsComAcao = Object.keys(r.porLocal);
            const linhas = [
              ...c.locais,
              ...idsComAcao.filter((id) => !c.locais.includes(id)),
            ];

            return (
              <li key={c.id} className="caixa-painel p-5">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <SubTitulo>{c.nome}</SubTitulo>
                  <span className="text-sm texto-suave">
                    {c.influenciador ?? ""}
                    {c.inicio ? ` · ${porExtenso(c.inicio)}` : ""}
                  </span>
                </div>

                <CopiarLink link={`${SITE}/?de=${c.slug}`} />

                <CotasDaCampanha
                  campanha={c.id}
                  atuais={c.locais}
                  comercios={comercios}
                />

                <div className="mt-4 flex flex-wrap gap-3 text-sm">
                  <span className="aviso-painel px-4 py-2.5">
                    <strong className="text-lg tabular-nums">
                      {r.visitantes}
                    </strong>{" "}
                    {r.visitantes === 1 ? "visita" : "visitas"} pelo link
                  </span>
                  <span className="caixa-painel px-4 py-2.5">
                    <strong className="text-lg tabular-nums">
                      {r.paginas}
                    </strong>{" "}
                    páginas abertas
                  </span>
                </div>

                {linhas.length > 0 && (
                  <div className="mt-4 overflow-x-auto">
                    <table className="w-full min-w-[520px] text-left text-[14px]">
                      <thead>
                        <tr className="texto-suave">
                          <th className="py-2 pr-3 font-medium">
                            Estabelecimento
                          </th>
                          <th className="py-2 pr-3 text-right font-medium">
                            Abriram a página
                          </th>
                          {CLIQUES_DE_CONTATO.map((t) => (
                            <th
                              key={t}
                              className="py-2 pr-3 text-right font-medium"
                            >
                              {NOME_DO_TIPO[t]}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {linhas.map((id) => {
                          const n = r.porLocal[id] ?? {};
                          const temCota = c.locais.includes(id);
                          return (
                            <tr
                              key={id}
                              className="border-t border-[color:var(--color-v-texto)]/15"
                            >
                              <td className="py-2 pr-3">
                                {nomeDe.get(id) ?? "Lugar removido"}
                                {temCota && (
                                  <span className="pilula ml-2 px-2 py-0.5 text-[11px]">
                                    cota
                                  </span>
                                )}
                              </td>
                              <td className="py-2 pr-3 text-right tabular-nums">
                                {n.pagina ?? 0}
                              </td>
                              {CLIQUES_DE_CONTATO.map((t) => (
                                <td
                                  key={t}
                                  className="py-2 pr-3 text-right tabular-nums"
                                >
                                  {n[t] ?? 0}
                                </td>
                              ))}
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function porExtenso(data: string): string {
  return new Intl.DateTimeFormat("pt-BR", {
    timeZone: "America/Sao_Paulo",
  }).format(new Date(`${data}T12:00:00-03:00`));
}
