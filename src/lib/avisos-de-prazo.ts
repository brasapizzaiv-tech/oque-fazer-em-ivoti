import { createAdminClient } from "./supabase/admin";
import { mandarEmail, moldura, semHtml } from "./email";
import { SITE } from "./site";
import { WHATSAPP_DO_GUIA } from "./marca";
import {
  DIAS_DE_PRAZO,
  DIAS_GRATIS,
  PLANOS,
  PLANO_DOS_DIAS_GRATIS,
  dataPorExtenso,
  oQueOsDiasGratisLiberam,
  menorMensalidade,
  prazoDoLugar,
  type PrazoDoLugar,
} from "./planos";

// ============================================================
// Os avisos do prazo para escolher um plano
// ============================================================
// Dois recados, cada um mandado uma vez só:
//
//   "prazo"  o período grátis (ou o plano) terminou; o comerciante tem
//            uma semana para escolher um plano.
//   "fora"   a semana passou sem plano; o lugar saiu do ar.
//
// Quem TIRA o lugar do ar não é esta rotina: é a conta do banco
// (`locais.no_ar_ate`), que vale mesmo que nenhum e-mail saia. Aqui só se
// avisa. Por isso a rotina pode rodar uma vez por dia, atrasar ou rodar
// duas vezes sem estrago: ela olha a situação de hoje e manda o que ainda
// não foi mandado.
//
// Cada recado fica anotado em `avisos_de_prazo` ANTES de o e-mail sair. A
// tabela não aceita a mesma anotação duas vezes, então duas rodadas ao
// mesmo tempo não mandam o mesmo e-mail em dobro. Se o envio falhar, a
// anotação é desfeita e a rodada de amanhã tenta de novo.
// ============================================================

type Admin = ReturnType<typeof createAdminClient>;

type Lugar = {
  id: string;
  nome: string;
  dono_id: string | null;
  plano: string;
  plano_ate: string | null;
  gratis_ate: string | null;
};

type Vencido = Exclude<PrazoDoLugar, { situacao: "em_dia" }>;

export type ResumoDosAvisos = {
  olhados: number;
  prazo: number;
  fora: number;
  falhas: number;
};

const FALAR = `https://wa.me/${WHATSAPP_DO_GUIA}?text=${encodeURIComponent(
  "Olá! Quero escolher um plano para o meu estabelecimento no guia.",
)}`;

export async function avisarPrazos(): Promise<ResumoDosAvisos> {
  const admin = createAdminClient();
  const resumo: ResumoDosAvisos = { olhados: 0, prazo: 0, fora: 0, falhas: 0 };

  const { data, error } = await admin
    .from("locais")
    .select("id, nome, dono_id, plano, plano_ate, gratis_ate")
    .eq("status", "publicado")
    .not("dono_id", "is", null)
    .not("gratis_ate", "is", null);

  if (error) {
    console.error("Avisos de prazo: nao consegui ler os lugares:", error.message);
    resumo.falhas++;
    return resumo;
  }

  const administracao = await emailsDaAdministracao(admin);

  for (const lugar of (data ?? []) as Lugar[]) {
    resumo.olhados++;

    const prazo = prazoDoLugar(lugar);
    if (prazo.situacao === "em_dia") continue;
    const tipo = prazo.situacao === "no_prazo" ? "prazo" : "fora";

    // Anota primeiro. Se a anotação já existe, o recado já foi.
    const { data: anotado, error: recusa } = await admin
      .from("avisos_de_prazo")
      .insert({ local_id: lugar.id, tipo, referencia: prazo.terminou })
      .select("id")
      .maybeSingle();

    if (recusa || !anotado) {
      // 23505 é "já existe": o caso de todo dia, não um erro.
      if (recusa && recusa.code !== "23505") {
        console.error("Avisos de prazo: nao consegui anotar:", recusa.message);
        resumo.falhas++;
      }
      continue;
    }

    const para = await emailDe(admin, lugar.dono_id);
    const foi = para ? await mandarEmail({ para, ...recadoAoDono(lugar, prazo) }) : false;

    if (!foi) {
      // Desfaz a anotação para a rodada de amanhã tentar de novo.
      await admin.from("avisos_de_prazo").delete().eq("id", anotado.id);
      resumo.falhas++;
      continue;
    }

    resumo[tipo]++;

    // A administração também fica sabendo: é ela quem combina o pagamento.
    // Quando o lugar é da própria administração, o recado do dono já basta.
    for (const email of administracao) {
      if (email === para) continue;
      await mandarEmail({ para: email, ...recadoAAdministracao(lugar, prazo) });
    }
  }

  return resumo;
}

/** O que terminou, numa frase: os dias grátis ou o plano. */
function oQueTerminou(nome: string, prazo: Vencido): string {
  const quando = dataPorExtenso(prazo.terminou);
  return prazo.motivo === "plano"
    ? `O plano de <strong>${nome}</strong> no guia de Ivoti venceu em ${quando}.`
    : `Os ${DIAS_GRATIS} dias grátis de <strong>${nome}</strong> no guia de Ivoti terminaram em ${quando}.`;
}

/**
 * Nos dias grátis o comerciante usou o plano Movimento. Quando eles
 * terminam, o que é desse plano sai do ar no mesmo dia, antes mesmo de o
 * prazo de uma semana acabar: o recado precisa dizer isso, senão a
 * promoção some e ele não sabe por quê.
 */
function oQueFechou(): string {
  const plano = PLANOS[PLANO_DOS_DIAS_GRATIS].nome;
  return `<br><br>Nos dias grátis você usou o plano ${plano}. Com o fim deles, o que é desse plano (${oQueOsDiasGratisLiberam()}) fica guardado e fora do ar, e volta sozinho quando você escolher o ${plano} ou um plano acima.`;
}

function recadoAoDono(
  lugar: Lugar,
  prazo: Vencido,
): { assunto: string; html: string } {
  const nome = semHtml(lugar.nome);

  if (prazo.situacao === "no_prazo") {
    const ate = dataPorExtenso(prazo.ate);
    return {
      assunto:
        prazo.motivo === "plano"
          ? `O plano de ${lugar.nome} venceu: você tem até ${ate} para renovar`
          : `Os dias grátis de ${lugar.nome} terminaram: escolha um plano até ${ate}`,
      html: moldura({
        titulo:
          prazo.motivo === "plano"
            ? "Seu plano venceu"
            : "Seu período grátis terminou",
        texto: `${oQueTerminou(nome, prazo)} Para continuar aparecendo, escolha um plano até <strong>${ate}</strong>. A mensalidade é a partir de ${menorMensalidade()}, sem fidelidade.${
          prazo.motivo === "gratis" ? oQueFechou() : ""
        }<br><br>Se nenhum plano for escolhido até essa data, ${nome} sai do ar no dia seguinte. Nada é apagado: ao escolher um plano, ele volta.`,
        botao: { rotulo: "Ver os planos", href: `${SITE}/planos` },
        rodape: `Para combinar o plano, fale com a gente pelo WhatsApp: <a href="${FALAR}" style="color:#e03a2f">abrir a conversa</a>. Se preferir, é só responder a este e-mail.`,
      }),
    };
  }

  return {
    assunto: `${lugar.nome} saiu do ar no guia de Ivoti`,
    html: moldura({
      titulo: "Seu lugar saiu do ar",
      texto: `${oQueTerminou(nome, prazo)} Nenhum plano foi escolhido nos ${DIAS_DE_PRAZO} dias de prazo, e desde ${dataPorExtenso(prazo.desde)} ${nome} não aparece mais para quem visita o guia.<br><br>O cadastro, as fotos e os textos continuam guardados. É só escolher um plano que ele volta ao ar, do jeito que estava.`,
      botao: { rotulo: "Ver os planos", href: `${SITE}/planos` },
      rodape: `Para escolher o plano, fale com a gente pelo WhatsApp: <a href="${FALAR}" style="color:#e03a2f">abrir a conversa</a>. Se preferir, é só responder a este e-mail.`,
    }),
  };
}

function recadoAAdministracao(
  lugar: Lugar,
  prazo: Vencido,
): { assunto: string; html: string } {
  const nome = semHtml(lugar.nome);
  const noPrazo = prazo.situacao === "no_prazo";

  return {
    assunto: noPrazo
      ? `${lugar.nome}: hora de combinar o plano (até ${dataPorExtenso(prazo.ate)})`
      : `${lugar.nome} saiu do ar por falta de plano`,
    html: moldura({
      titulo: noPrazo ? "Hora de combinar o plano" : "Saiu do ar",
      texto: noPrazo
        ? `${oQueTerminou(nome, prazo)} O comerciante foi avisado por e-mail e tem até <strong>${dataPorExtenso(prazo.ate)}</strong> para escolher um plano. Sem plano marcado até lá, o lugar sai do ar no dia seguinte.`
        : `${oQueTerminou(nome, prazo)} O prazo de ${DIAS_DE_PRAZO} dias passou sem plano marcado, e o lugar está fora do ar desde ${dataPorExtenso(prazo.desde)}. O comerciante foi avisado por e-mail. Ele volta sozinho quando você ativar um plano.`,
      botao: { rotulo: "Abrir os planos", href: `${SITE}/admin/planos` },
    }),
  };
}

/** O e-mail de quem tem uma conta, que só o servidor consegue ler. */
async function emailDe(admin: Admin, id: string | null): Promise<string | null> {
  if (!id) return null;
  const { data } = await admin.auth.admin.getUserById(id);
  return data.user?.email ?? null;
}

async function emailsDaAdministracao(admin: Admin): Promise<string[]> {
  const { data } = await admin.from("perfis").select("id").eq("papel", "admin");
  const emails: string[] = [];
  for (const linha of data ?? []) {
    const email = await emailDe(admin, linha.id);
    if (email) emails.push(email);
  }
  return emails;
}
