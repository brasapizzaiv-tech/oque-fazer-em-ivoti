import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import {
  SUPABASE_URL,
  SUPABASE_ANON_KEY,
  SUPABASE_CONFIGURADO,
} from "./config";
import { SITE } from "../site";

// Renova a sessao a cada requisicao e protege as areas que exigem login.
// O guia em si e todo publico: so /painel e /admin pedem conta.
export async function atualizarSessao(request: NextRequest) {
  // Antes de qualquer coisa: o site so responde no endereco dele.
  const paraOEnderecoCerto = mandarParaOSite(request);
  if (paraOEnderecoCerto) return paraOEnderecoCerto;

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

/**
 * Manda para o endereco de verdade quem chegou pelo da Vercel.
 *
 * Todo projeto na Vercel ganha um endereco .vercel.app, e ele serve o
 * site inteiro — mesma pagina, mesmo texto, endereco diferente. Para o
 * Google sao duas copias, e em 23/10/2026 ele avisou que parou de
 * indexar paginas por causa disso.
 *
 * A marca de endereco oficial dentro da pagina ja resolve o que o
 * buscador faz. Este desvio resolve o resto: quem abrir o endereco
 * antigo, de um link guardado ou de um favorito, chega no site certo em
 * vez de ficar numa copia que ninguem mais atualiza de proposito.
 *
 * So o endereco fixo de producao. As publicacoes de teste da Vercel tem
 * nome com um codigo no meio — oque-fazer-em-ivoti-git-algo.vercel.app —
 * e precisam continuar abrindo onde estao, senao nao da para conferir
 * nada antes de publicar.
 */
function mandarParaOSite(request: NextRequest) {
  const host = request.headers.get("host")?.toLowerCase().split(":")[0];
  if (host !== "oque-fazer-em-ivoti.vercel.app") return null;

  const destino = new URL(
    request.nextUrl.pathname + request.nextUrl.search,
    SITE,
  );
  // 308 e nao 307: e o que faz o buscador passar para o endereco novo a
  // posicao que o antigo tinha, em vez de tratar o desvio como temporario.
  return NextResponse.redirect(destino, 308);
}
