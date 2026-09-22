import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { planoAtivo, diasParaVencer } from "@/lib/planos";
import { Botao } from "@/components/vidro/pecas";
import {
  Caixa,
  Nenhum,
  SeloSituacao,
  SITUACOES,
  TituloPainel,
  type Situacao,
} from "@/components/painel/pecas";

export const dynamic = "force-dynamic";

/**
 * O selo do plano ao lado do nome.
 *
 * Só aparece no premium: um selo "Gratuito" em toda linha viraria ruído, e
 * quem está no gratuito já descobre o que existe pelos módulos bloqueados.
 * Avisa quando falta pouco para vencer, que é quando ainda dá para renovar.
 */
function SeloPlano({ plano, ate }: { plano: string; ate: string | null }) {
  if (planoAtivo(plano, ate) !== "premium") return null;

  const dias = diasParaVencer(ate);
  const acabando = dias !== null && dias <= 7;

  return (
    <span
      className="inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold tracking-[0.08em] uppercase"
      style={{
        backgroundColor: acabando
          ? "var(--color-v-fechado-claro)"
          : "var(--color-v-petunia)",
        color: "#FFFFFF",
      }}
      title={ate ? `Vale até ${ate}` : "Sem data de vencimento"}
    >
      Premium
      {acabando &&
        (dias === 0
          ? " · vence hoje"
          : dias === 1
            ? " · vence amanhã"
            : ` · ${dias} dias`)}
    </span>
  );
}

export default async function Painel() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // A administracao enxerga tudo no painel, inclusive o que nao tem dono: os
  // pontos turisticos da cidade sao do municipio, nao de um estabelecimento,
  // e sem isso ninguem conseguiria subir foto ou corrigir o texto deles.
  const { data: perfil } = await supabase
    .from("perfis")
    .select("papel")
    .eq("id", user?.id ?? "")
    .maybeSingle();
  const admin = perfil?.papel === "admin";

  let consulta = supabase
    .from("locais")
    .select(
      "id, slug, nome, status, capa_url, motivo_rejeicao, dono_id, plano, plano_ate, categoria:categorias(nome, emoji)",
    )
    .order("criado_em", { ascending: false });

  if (!admin) consulta = consulta.eq("dono_id", user?.id ?? "");

  const { data: locais } = await consulta;

  const lista = locais ?? [];

  return (
    <>
      <TituloPainel
        apoio={
          admin
            ? "Tudo o que está cadastrado no guia, inclusive o que não tem dono."
            : "O que você cadastrou no guia."
        }
        acao={
          <Botao href="/painel/novo">
            <span aria-hidden>+</span> Cadastrar um local
          </Botao>
        }
      >
        {admin ? "Todos os locais" : "Meus locais"}
      </TituloPainel>

      {lista.length === 0 ? (
        <div className="mt-6">
          <Nenhum
            titulo="Você ainda não cadastrou nada"
            acao={<Botao href="/painel/novo">Começar</Botao>}
          >
            Cadastre seu estabelecimento, atrativo ou ponto turístico. Leva
            poucos minutos e é de graça.
          </Nenhum>
        </div>
      ) : (
        <ul className="mt-6 space-y-3">
          {lista.map((l) => {
            const situacao = l.status as Situacao;
            const s = SITUACOES[situacao] ?? SITUACOES.rascunho;
            const categoria = l.categoria as unknown as {
              nome: string;
              emoji: string | null;
            } | null;

            return (
              <li key={l.id}>
                <Caixa className="flex flex-wrap items-center gap-4">
                  <div
                    className="relative grid h-16 w-16 shrink-0 place-items-center overflow-hidden rounded-[4px] text-2xl"
                    style={{
                      border: "2px solid var(--color-v-texto)",
                      backgroundColor: "var(--color-v-fundo)",
                    }}
                  >
                    {l.capa_url ? (
                      <Image
                        src={l.capa_url}
                        alt=""
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    ) : (
                      (categoria?.emoji ?? "📍")
                    )}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p
                        className="text-[16px] font-bold"
                        style={{ color: "var(--color-v-texto)" }}
                      >
                        {l.nome}
                      </p>
                      <SeloSituacao situacao={situacao} />
                      <SeloPlano
                        plano={l.plano as string}
                        ate={l.plano_ate as string | null}
                      />
                    </div>
                    <p
                      className="mt-0.5 text-[13px]"
                      style={{ color: "var(--color-v-texto-suave)" }}
                    >
                      {s.dica}
                    </p>
                    {l.status === "rejeitado" && l.motivo_rejeicao && (
                      <p
                        className="mt-1 text-[13px] font-medium"
                        style={{ color: "var(--color-v-fechado-claro)" }}
                      >
                        Motivo: {l.motivo_rejeicao}
                      </p>
                    )}
                  </div>

                  <div className="flex shrink-0 gap-2">
                    {l.status === "publicado" && (
                      <Link
                        href={`/local/${l.slug}`}
                        className="inline-flex h-11 items-center rounded-[9px] px-4 text-[14px] font-semibold"
                        style={{
                          border: "2px solid var(--color-v-texto)",
                          color: "var(--color-v-texto)",
                        }}
                      >
                        Ver no site
                      </Link>
                    )}
                    <Link
                      href={`/painel/${l.id}`}
                      className="inline-flex h-11 items-center rounded-[9px] px-5 text-[14px] font-bold"
                      style={{
                        backgroundColor: "var(--color-v-torii)",
                        color: "#FFFFFF",
                      }}
                    >
                      Editar
                    </Link>
                  </div>
                </Caixa>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}
