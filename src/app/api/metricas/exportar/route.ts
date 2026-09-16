import { createClient } from "@/lib/supabase/server";
import { NOME_DO_TIPO, type TipoMetrica } from "@/lib/metricas";
import { diasAtras } from "@/lib/metricas-resumo";
import { planoAtivo, podeUsar } from "@/lib/planos";
import { enderecoCurto } from "@/lib/roteiro";

export const runtime = "nodejs";

/**
 * As metricas de um estabelecimento em planilha.
 *
 * Quem tem premium costuma querer os numeros fora daqui: juntar com o
 * faturamento do mes, mandar para o contador, guardar o historico antes de o
 * periodo sair da tela.
 *
 * As regras de acesso do banco ja limitam quem le o que — o dono le os
 * locais dele, a administracao le todos. Por isso vale a sessao da pessoa, e
 * nao a chave de servico: nao ha como pedir os numeros do vizinho trocando o
 * identificador no endereco.
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const localId = searchParams.get("local") ?? "";
  const dias = [7, 30, 90].includes(Number(searchParams.get("dias")))
    ? Number(searchParams.get("dias"))
    : 30;

  if (!localId) {
    return Response.json({ erro: "Falta o estabelecimento." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ erro: "Entre para exportar." }, { status: 401 });
  }

  const { data: perfil } = await supabase
    .from("perfis")
    .select("papel")
    .eq("id", user.id)
    .maybeSingle();
  const admin = perfil?.papel === "admin";

  // Se as regras de acesso nao deixarem esta pessoa ver este local, a
  // consulta volta vazia — e a resposta e a mesma de um local que nao
  // existe, de proposito.
  const { data: local } = await supabase
    .from("locais")
    .select("id, nome, plano, plano_ate")
    .eq("id", localId)
    .maybeSingle();

  if (!local) {
    return Response.json({ erro: "Não encontrei." }, { status: 404 });
  }

  const plano = planoAtivo(local.plano, local.plano_ate);
  if (!admin && !podeUsar("metricas", plano)) {
    return Response.json(
      { erro: "A exportação faz parte do plano premium." },
      { status: 403 },
    );
  }

  const desde = diasAtras(dias - 1);
  const { data: linhas, error } = await supabase
    .from("metricas_dia")
    .select("dia, tipo, contagem")
    .eq("local_id", localId)
    .gte("dia", desde)
    .order("dia");

  if (error) {
    console.error("Nao consegui exportar as metricas:", error.message);
    return Response.json({ erro: "Não consegui gerar agora." }, { status: 500 });
  }

  const csv = montarCsv(
    (linhas ?? []) as { dia: string; tipo: string; contagem: number }[],
  );

  const arquivo = `metricas-${enderecoCurto(local.nome, 40)}-${dias}dias.csv`;

  return new Response(csv, {
    headers: {
      // O ponto e virgula e o separador que o Excel em portugues espera, e a
      // marca de ordem no inicio e o que faz ele abrir os acentos certos.
      // Sem os dois, a planilha chega numa coluna so e cheia de simbolo.
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${arquivo}"`,
      "Cache-Control": "no-store",
    },
  });
}

function montarCsv(
  linhas: { dia: string; tipo: string; contagem: number }[],
): string {
  const cabecalho = ["Dia", "O que foi medido", "Quantidade"];

  const corpo = linhas.map((l) => [
    // Data no formato brasileiro: a planilha e lida por gente, nao por
    // programa.
    l.dia.split("-").reverse().join("/"),
    NOME_DO_TIPO[l.tipo as TipoMetrica] ?? l.tipo,
    String(l.contagem),
  ]);

  const tudo = [cabecalho, ...corpo]
    .map((colunas) => colunas.map(escapar).join(";"))
    .join("\r\n");

  return "﻿" + tudo + "\r\n";
}

/** Campo com ponto e virgula, aspas ou quebra de linha precisa vir entre aspas. */
function escapar(valor: string): string {
  if (/[;"\r\n]/.test(valor)) return `"${valor.replace(/"/g, '""')}"`;
  return valor;
}
