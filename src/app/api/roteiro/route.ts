import { createAdminClient } from "@/lib/supabase/admin";
import { SITE } from "@/lib/site";

export const runtime = "nodejs";

/**
 * Salva o roteiro que o visitante montou e devolve o endereço para compartilhar.
 *
 * Usa a chave de serviço porque quem salva é um visitante sem conta. O que
 * protege o roteiro é o token: um endereço sorteado, longo o bastante para
 * ninguém adivinhar, que funciona como a própria senha do link.
 */
export async function POST(request: Request) {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return Response.json({ erro: "indisponível" }, { status: 503 });
  }

  try {
    const { titulo, slugs } = (await request.json()) as {
      titulo?: string;
      slugs?: string[];
    };

    const lista = (slugs ?? []).filter((s) => typeof s === "string").slice(0, 12);
    if (lista.length === 0) {
      return Response.json({ erro: "roteiro vazio" }, { status: 400 });
    }

    const admin = createAdminClient();

    // Guarda os identificadores, não os endereços curtos: se um
    // estabelecimento mudar de nome no site, o roteiro salvo continua
    // apontando para o lugar certo.
    const { data: locais } = await admin
      .from("locais")
      .select("id, slug")
      .in("slug", lista)
      .eq("status", "publicado");

    const porSlug = new Map((locais ?? []).map((l) => [l.slug, l.id]));
    // A ordem do roteiro é a ordem que a pessoa vê; a consulta não a preserva.
    const ids = lista.map((s) => porSlug.get(s)).filter(Boolean) as string[];

    if (ids.length === 0) {
      return Response.json({ erro: "nenhuma parada válida" }, { status: 400 });
    }

    const token = crypto.randomUUID().replace(/-/g, "").slice(0, 12);

    const { error } = await admin.from("roteiros").insert({
      token,
      titulo: (titulo ?? "Meu roteiro em Ivoti").slice(0, 80),
      locais: ids,
    });

    if (error) {
      console.error("Não consegui salvar o roteiro:", error.message);
      return Response.json({ erro: "não consegui salvar" }, { status: 500 });
    }

    return Response.json({ endereco: `${SITE}/roteiro/${token}` });
  } catch (erro) {
    console.error("Roteiro recusado:", erro);
    return Response.json({ erro: "pedido inválido" }, { status: 400 });
  }
}
