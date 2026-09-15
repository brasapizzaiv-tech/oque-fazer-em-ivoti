import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Para onde o link de confirmacao do e-mail volta.
 *
 * Quando alguem se cadastra e o Supabase exige confirmacao, o e-mail traz um
 * link que passa pelo Supabase e termina aqui, com um codigo na URL. Esta rota
 * troca esse codigo por uma sessao — e a pessoa cai logada no painel, sem
 * precisar digitar a senha de novo.
 *
 * Sem esta rota o link simplesmente dava erro: o visitante fazia o cadastro,
 * recebia o e-mail, clicava e batia numa porta que nao existia.
 *
 * Trata as duas formas que o Supabase pode usar:
 *   - "code"       — o fluxo novo (PKCE), usado pelo @supabase/ssr
 *   - "token_hash" — o formato dos modelos de e-mail padrao
 */
export async function GET(request: Request) {
  const url = new URL(request.url);
  const codigo = url.searchParams.get("code");
  const tokenHash = url.searchParams.get("token_hash");
  const tipo = url.searchParams.get("type");

  // Para onde mandar a pessoa depois. So aceita caminho interno: um endereco
  // completo aqui deixaria qualquer um usar o site pra jogar visitante em
  // pagina de golpe com o nosso link.
  const depoisCru = url.searchParams.get("next") ?? "/painel";
  const depois = depoisCru.startsWith("/") && !depoisCru.startsWith("//")
    ? depoisCru
    : "/painel";

  const supabase = await createClient();

  if (codigo) {
    const { error } = await supabase.auth.exchangeCodeForSession(codigo);
    if (!error) return NextResponse.redirect(new URL(depois, url.origin));
    console.error("Confirmacao de e-mail falhou:", error.message);
  } else if (tokenHash && tipo) {
    const { error } = await supabase.auth.verifyOtp({
      type: tipo as "signup" | "email" | "recovery" | "email_change",
      token_hash: tokenHash,
    });
    if (!error) return NextResponse.redirect(new URL(depois, url.origin));
    console.error("Confirmacao de e-mail falhou:", error.message);
  }

  // Link velho, ja usado ou aberto em outro navegador: manda pro login com um
  // aviso em portugues, em vez da tela de erro crua do Supabase.
  return NextResponse.redirect(
    new URL("/entrar?erro=confirmacao", url.origin),
  );
}
