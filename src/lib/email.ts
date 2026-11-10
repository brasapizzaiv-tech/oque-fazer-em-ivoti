import { SITE_LIMPO } from "./site";

// ============================================================
// Mandar e-mail
// ============================================================
// Pelo Resend, configurado em 10/11/2026. O mesmo remetente que a
// Supabase usa para confirmar cadastro e trocar senha — quem recebe ve
// sempre o mesmo nome, venha o aviso de onde vier.
// ============================================================

const CHAVE = process.env.RESEND_API_KEY;
const DE = "O que fazer em Ivoti <nao-responda@oquefazeremivoti.com.br>";

/** Sem chave configurada, o site segue funcionando — só não avisa. */
export const EMAIL_CONFIGURADO = Boolean(CHAVE);

/**
 * Manda um e-mail. Devolve se conseguiu.
 *
 * Nunca lança: um aviso que falha não pode derrubar a ação que o
 * provocou. O comerciante que mandou o cadastro para análise tem de ver
 * "enviado" mesmo que o e-mail para a administração tenha se perdido no
 * caminho — o cadastro está lá, e é isso que importa para ele.
 */
export async function mandarEmail({
  para,
  assunto,
  html,
}: {
  para: string;
  assunto: string;
  html: string;
}): Promise<boolean> {
  if (!CHAVE) {
    console.warn("E-mail nao enviado: RESEND_API_KEY nao configurada.");
    return false;
  }

  try {
    const resposta = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${CHAVE}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ from: DE, to: [para], subject: assunto, html }),
    });

    if (!resposta.ok) {
      console.error(
        "Resend recusou o e-mail:",
        resposta.status,
        await resposta.text(),
      );
      return false;
    }
    return true;
  } catch (erro) {
    console.error("Nao consegui mandar o e-mail:", erro);
    return false;
  }
}

/**
 * O corpo dos avisos, no mesmo desenho dos e-mails de senha e cadastro.
 *
 * Tabela e estilo em linha porque e o que cliente de e-mail entende:
 * folha de estilo e fonte de fora o Gmail descarta sem avisar.
 */
export function moldura({
  titulo,
  texto,
  botao,
  rodape,
}: {
  titulo: string;
  texto: string;
  botao?: { rotulo: string; href: string };
  rodape?: string;
}): string {
  const acao = botao
    ? `<tr><td style="padding-bottom:24px"><a href="${botao.href}" style="display:inline-block;background-color:#e03a2f;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 28px;border-radius:11px">${botao.rotulo}</a></td></tr>`
    : "";

  const pe = rodape
    ? `<tr><td style="font-size:14px;line-height:1.6;color:#6e6660;border-top:1px solid #eee7dd;padding-top:20px">${rodape}</td></tr>`
    : "";

  return `<table width="100%" cellpadding="0" cellspacing="0" style="background-color:#faf7f1;padding:32px 16px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#ffffff;border-radius:16px;padding:32px">
      <tr><td style="font-size:13px;font-weight:bold;letter-spacing:0.08em;text-transform:uppercase;color:#e03a2f;padding-bottom:8px">O que fazer em Ivoti</td></tr>
      <tr><td style="font-size:24px;font-weight:bold;color:#2b2320;padding-bottom:16px;font-family:Georgia,'Times New Roman',serif">${titulo}</td></tr>
      <tr><td style="font-size:16px;line-height:1.6;color:#2b2320;padding-bottom:24px">${texto}</td></tr>
      ${acao}
      ${pe}
    </table>
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;padding-top:16px">
      <tr><td align="center" style="font-size:12px;color:#6e6660">${SITE_LIMPO} · o guia de Ivoti, a cidade das flores</td></tr>
    </table>
  </td></tr>
</table>`;
}

/** Protege contra nome de lugar que contenha < ou &. */
export function semHtml(texto: string): string {
  return texto
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
