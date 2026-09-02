import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { SUPABASE_URL, SUPABASE_ANON_KEY, SUPABASE_CONFIGURADO } from "./config";

// Renova a sessao a cada requisicao e protege as areas que exigem login.
// O guia em si e todo publico: so /painel e /admin pedem conta.
export async function atualizarSessao(request: NextRequest) {
  if (!SUPABASE_CONFIGURADO) return NextResponse.next({ request });

  let resposta = NextResponse.next({ request });

  const supabase = createServerClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(paraGravar) {
        paraGravar.forEach(({ name, value }) =>
          request.cookies.set(name, value),
        );
        resposta = NextResponse.next({ request });
        paraGravar.forEach(({ name, value, options }) =>
          resposta.cookies.set(name, value, options),
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const caminho = request.nextUrl.pathname;
  const privada = caminho.startsWith("/painel") || caminho.startsWith("/admin");

  if (privada && !user) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.searchParams.set("voltar", caminho);
    return NextResponse.redirect(url);
  }

  // Area do site: so quem for admin entra.
  if (caminho.startsWith("/admin") && user) {
    const { data: perfil } = await supabase
      .from("perfis")
      .select("papel")
      .eq("id", user.id)
      .maybeSingle();
    if (perfil?.papel !== "admin") {
      const url = request.nextUrl.clone();
      url.pathname = "/painel";
      return NextResponse.redirect(url);
    }
  }

  return resposta;
}
