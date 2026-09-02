import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import BotaoSair from "@/components/BotaoSair";

export default async function LayoutPainel({ children }: LayoutProps<"/painel">) {
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
    <div className="mx-auto max-w-5xl px-4 py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-mata-100 pb-4">
        <div>
          <Link href="/painel" className="text-xl font-bold">
            Painel do estabelecimento
          </Link>
          <p className="text-sm text-tinta/55">
            {perfil?.nome ?? user?.email}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {perfil?.papel === "admin" && (
            <Link
              href="/admin"
              className="rounded-full border border-sol-300 bg-sol-50 px-4 py-2 text-sm font-semibold text-sol-800"
            >
              Administração
            </Link>
          )}
          <BotaoSair />
        </div>
      </div>

      <div className="pt-6">{children}</div>
    </div>
  );
}
