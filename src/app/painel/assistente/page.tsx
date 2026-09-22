import { createClient } from "@/lib/supabase/server";
import { planoAtivo, podeUsar } from "@/lib/planos";
import Bloqueado from "@/components/painel/Bloqueado";
import EscolherLocal from "@/components/painel/EscolherLocal";
import ChatDoPainel from "@/components/painel/ChatDoPainel";

export const dynamic = "force-dynamic";

export default async function Assistente({
  searchParams,
}: PageProps<"/painel/assistente">) {
  const params = await searchParams;
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
      <div className="caixa-painel border-dashed p-10 text-center">
        <p className="text-3xl">💬</p>
        <p className="mt-2 font-semibold">Cadastre seu estabelecimento antes</p>
        <p className="mx-auto mt-1 max-w-sm text-sm texto-suave">
          O assistente conversa sobre o seu negócio — o cadastro, os textos e os
          números dele. Sem um cadastro, não há sobre o que conversar.
        </p>
      </div>
    );
  }

  const local = locais.find((l) => l.id === escolhido) ?? locais[0];
  const plano = planoAtivo(local.plano, local.plano_ate);

  // Mesma regra das métricas: a administração enxerga tudo, e o comerciante
  // só com o premium.
  const liberado = admin || podeUsar("guia_painel", plano);
  const vendoComoAdmin = admin && !podeUsar("guia_painel", plano);

  return (
    <>
      <div>
        <h1
          className="text-[22px] font-bold sm:text-[26px]"
          style={{
            color: "var(--color-v-texto)",
            fontFamily: "var(--fonte-titulo-nova)",
          }}
        >
          Assistente
        </h1>
        <p className="text-sm texto-suave">
          Ele conhece o cadastro e os números de {local.nome}, e não vê dado de
          mais ninguém.
        </p>
      </div>

      <EscolherLocal
        locais={locais}
        escolhido={local.id}
        base="/painel/assistente"
      />

      {vendoComoAdmin && (
        <p className="mt-4 aviso-painel px-3 py-2 text-[14px]">
          Você está vendo como administração. {local.nome} está no plano
          gratuito — no painel do próprio estabelecimento, o assistente aparece
          bloqueado.
        </p>
      )}

      <div className="mt-5">
        {liberado ? (
          <ChatDoPainel local={local.id} nome={local.nome} />
        ) : (
          <Bloqueado modulo="guia_painel" nome={local.nome}>
            <ChatDoPainel local={local.id} nome={local.nome} />
          </Bloqueado>
        )}
      </div>
    </>
  );
}
