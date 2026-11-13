import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { SUPABASE_CONFIGURADO } from "@/lib/supabase/config";
import { mandarEmail, moldura, semHtml } from "@/lib/email";
import { SITE } from "@/lib/site";
import { dentroDoLimite } from "@/lib/limite-chat";

export const runtime = "nodejs";

/**
 * Avisa por e-mail quem precisa saber que um cadastro mudou de situacao.
 *
 * Ate hoje ninguem era avisado de nada: o comerciante mandava o cadastro
 * para analise e a administracao nao ficava sabendo; a administracao
 * publicava e o comerciante nao ficava sabendo. Funcionava porque os
 * quatro cadastros eram do dono do site. No dia em que um comerciante de
 * verdade se cadastrasse, ele ficaria esperando sem resposta.
 *
 * QUEM MANDA NAO DIZ O QUE ACONTECEU. A pagina so avisa "o local tal
 * mudou"; esta rota le a situacao atual no banco e decide sozinha qual
 * e-mail cabe. Se fosse o navegador a dizer "foi aprovado", qualquer um
 * poderia mandar a si mesmo um aviso de aprovacao que nunca houve.
 *
 * Responde 204 sempre, ate quando nao manda nada: quem chamou nao tem o
 * que fazer com a resposta, e um aviso que falha nao pode derrubar a
 * acao que o provocou.
 */
export async function POST(request: Request) {
  if (!SUPABASE_CONFIGURADO) return new Response(null, { status: 204 });

  try {
    const { local: localId } = (await request.json()) as { local?: string };
    if (!localId) return new Response(null, { status: 204 });

    // Quem esta pedindo. Sem sessao, nao se avisa ninguem.
    const sb = await createClient();
    const {
      data: { user },
    } = await sb.auth.getUser();
    if (!user) return new Response(null, { status: 204 });

    // Quatro avisos por hora, por pessoa e por cadastro, bastam para qualquer uso
    // de verdade. Sem teto, repetir este pedido enchia a caixa da
    // administração e gastava a cota de e-mails — a mesma que entrega o
    // link de confirmar conta e o de trocar senha.
    if (!(await dentroDoLimite(`aviso:${user.id}:${localId}`, 4))) {
      return new Response(null, { status: 204 });
    }

    const admin = createAdminClient();

    const { data: lugar } = await admin
      .from("locais")
      .select("id, nome, slug, status, motivo_rejeicao, dono_id")
      .eq("id", localId)
      .maybeSingle();
    if (!lugar) return new Response(null, { status: 204 });

    const { data: perfil } = await admin
      .from("perfis")
      .select("papel")
      .eq("id", user.id)
      .maybeSingle();
    const ehAdmin = perfil?.papel === "admin";
    const ehDono = lugar.dono_id === user.id;

    if (lugar.status === "em_analise") {
      // So quem mandou o cadastro avisa que mandou.
      if (!ehDono && !ehAdmin) return new Response(null, { status: 204 });
      await avisarAdministracao(admin, lugar);
      return new Response(null, { status: 204 });
    }

    if (lugar.status === "publicado" || lugar.status === "rejeitado") {
      // So a administracao avisa que publicou ou devolveu.
      if (!ehAdmin) return new Response(null, { status: 204 });
      await avisarDono(admin, lugar);
      return new Response(null, { status: 204 });
    }
  } catch (erro) {
    console.error("Aviso nao enviado:", erro);
  }

  return new Response(null, { status: 204 });
}

type Lugar = {
  nome: string;
  slug: string | null;
  status: string;
  motivo_rejeicao: string | null;
  dono_id: string | null;
};

type Admin = ReturnType<typeof createAdminClient>;

/** O e-mail de quem tem uma conta, que so o servidor consegue ler. */
async function emailDe(
  admin: Admin,
  id: string | null,
): Promise<string | null> {
  if (!id) return null;
  const { data } = await admin.auth.admin.getUserById(id);
  return data.user?.email ?? null;
}

/** "Chegou um cadastro para analisar." */
async function avisarAdministracao(admin: Admin, lugar: Lugar) {
  const { data: admins } = await admin
    .from("perfis")
    .select("id")
    .eq("papel", "admin");

  for (const linha of admins ?? []) {
    const para = await emailDe(admin, linha.id);
    if (!para) continue;
    await mandarEmail({
      para,
      assunto: `${lugar.nome} está esperando análise`,
      html: moldura({
        titulo: "Chegou um cadastro",
        texto: `<strong>${semHtml(lugar.nome)}</strong> foi enviado para análise e está esperando sua decisão: publicar ou pedir ajuste.`,
        botao: { rotulo: "Abrir a administração", href: `${SITE}/admin` },
      }),
    });
  }
}

/** "Seu cadastro foi publicado" ou "precisa de um ajuste". */
async function avisarDono(admin: Admin, lugar: Lugar) {
  const para = await emailDe(admin, lugar.dono_id);
  if (!para) return;

  if (lugar.status === "publicado") {
    await mandarEmail({
      para,
      assunto: `${lugar.nome} está no ar`,
      html: moldura({
        titulo: "Está no ar",
        texto: `<strong>${semHtml(lugar.nome)}</strong> já aparece no guia de Ivoti. Quem procurar por um lugar como o seu vai encontrar.`,
        botao: lugar.slug
          ? { rotulo: "Ver no site", href: `${SITE}/local/${encodeURIComponent(lugar.slug)}` }
          : undefined,
        rodape:
          "Tudo o que você alterar no painel daqui pra frente aparece no site em poucos minutos.",
      }),
    });
    return;
  }

  await mandarEmail({
    para,
    assunto: `${lugar.nome} precisa de um ajuste`,
    html: moldura({
      titulo: "Falta um ajuste",
      texto: `Olhamos o cadastro de <strong>${semHtml(lugar.nome)}</strong> e ele precisa de uma correção antes de entrar no ar:<br><br><em>${semHtml(lugar.motivo_rejeicao ?? "—")}</em>`,
      botao: { rotulo: "Abrir meu cadastro", href: `${SITE}/painel` },
      rodape:
        "Depois de corrigir, é só mandar para análise de novo pelo botão no painel.",
    }),
  });
}
