import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import EditorRoteiro from "../EditorRoteiro";

export const dynamic = "force-dynamic";

export default async function MontarRoteiro({
  params,
}: PageProps<"/admin/roteiros/[id]">) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: roteiro }, { data: locais }] = await Promise.all([
    supabase
      .from("roteiros")
      .select("id, titulo, descricao, slug, locais, publicado, ordem, curado")
      .eq("id", id)
      .maybeSingle(),
    supabase
      .from("locais")
      .select("id, nome, bairro")
      .eq("status", "publicado")
      .order("nome"),
  ]);

  // As regras de acesso ja barram quem nao e administracao; aqui so sobra o
  // caso do endereco digitado errado, ou de um roteiro de visitante aberto
  // por engano nesta tela.
  if (!roteiro || !roteiro.curado) notFound();

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="text-sm text-tinta/55">
        <Link href="/admin/roteiros" className="hover:text-mata-700">
          Roteiros prontos
        </Link>
      </nav>
      <h1 className="mt-1 mb-6 text-xl font-bold">{roteiro.titulo}</h1>

      <EditorRoteiro
        roteiro={{
          id: roteiro.id,
          titulo: roteiro.titulo,
          descricao: roteiro.descricao,
          slug: roteiro.slug,
          locais: (roteiro.locais ?? []) as string[],
          publicado: roteiro.publicado,
          ordem: roteiro.ordem,
        }}
        disponiveis={locais ?? []}
      />
    </div>
  );
}
