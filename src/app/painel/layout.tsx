import Link from "next/link";
import BotaoSair from "@/components/BotaoSair";
import FundoDaCidade from "@/components/vidro/FundoDaCidade";
import { Logo } from "@/components/vidro/pecas";
import AbasPainel from "@/components/painel/AbasPainel";
import { createClient } from "@/lib/supabase/server";

/**
 * A casca do painel.
 *
 * A barra de cima é escura como a do site público, mas sem o menu de passeio:
 * quem está aqui veio trabalhar no próprio cadastro, e links para "Explorar"
 * ou "Roteiros" só tirariam a pessoa do meio de um formulário. O logo leva
 * para a capa quando ela quiser sair mesmo.
 */
export default async function LayoutPainel({
  children,
}: LayoutProps<"/painel">) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: perfil } = user
    ? await supabase
        .from("perfis")
        .select("nome, papel")
        .eq("id", user.id)
        .maybeSingle()
    : { data: null };

  return (
    <div className="min-h-screen">
      <FundoDaCidade />

      <header>
        <div
          style={{
            backgroundColor: "rgba(43, 35, 32, 0.9)",
            backdropFilter: "blur(14px)",
          }}
        >
          <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-4 gap-y-3 px-4 py-3">
            <Link href="/" className="shrink-0">
              <Logo sobreFoto />
            </Link>

            <span className="ml-auto flex items-center gap-2">
              {perfil?.papel === "admin" && (
                <Link
                  href="/admin"
                  className="rounded-[9px] px-3.5 py-2 text-[13px] font-semibold"
                  style={{
                    backgroundColor: "var(--color-v-petunia)",
                    color: "#FFFFFF",
                  }}
                >
                  Administração
                </Link>
              )}
              <BotaoSair claro />
            </span>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-4 pt-5 pb-10">
        <div className="flex flex-wrap items-baseline gap-x-3">
          <Link
            href="/painel"
            className="text-[20px] font-bold"
            style={{
              color: "var(--color-v-texto)",
              fontFamily: "var(--fonte-titulo-nova)",
            }}
          >
            Painel do estabelecimento
          </Link>
          <p
            className="text-[13px]"
            style={{ color: "var(--color-v-texto-suave)" }}
          >
            {perfil?.nome ?? user?.email}
          </p>
        </div>

        <div className="mt-4">
          <AbasPainel />
        </div>

        <div className="pt-6">{children}</div>
      </div>
    </div>
  );
}
