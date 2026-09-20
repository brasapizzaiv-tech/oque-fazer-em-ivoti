import Link from "next/link";
import { notFound } from "next/navigation";
import Editor from "./Editor";
import { listarCategorias, listarTags, localPorId } from "@/lib/locais";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export default async function EditarLocal({
  params,
}: PageProps<"/painel/[id]">) {
  const { id } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const [local, categorias, tags] = await Promise.all([
    localPorId(id, supabase),
    listarCategorias(supabase),
    listarTags(supabase),
  ]);

  // A RLS já barra quem não é dono, mas uma checagem explícita deixa a
  // mensagem melhor do que uma página vazia.
  if (!local || (local.dono_id !== user?.id && user)) {
    const { data: perfil } = await supabase
      .from("perfis")
      .select("papel")
      .eq("id", user?.id ?? "")
      .maybeSingle();
    if (perfil?.papel !== "admin") notFound();
  }
  if (!local) notFound();

  return (
    <>
      <Link href="/painel" className="text-sm texto-suave">
        ← Meus locais
      </Link>
      <Editor local={local} categorias={categorias} tags={tags} />
    </>
  );
}
