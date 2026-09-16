import { createAdminClient } from "./supabase/admin";
import { buscarLocais } from "./locais";
import { eventosVisiveis } from "./eventos";
import {
  agoraNaCidade,
  resumoSemana,
  situacao,
  quandoPorExtenso,
  DIAS,
} from "./horarios";
import { faixaPreco } from "./texto";
import { quandoVale } from "./promocoes";
import type { LocalCompleto } from "./tipos";

// O catalogo inteiro da cidade em texto, do jeito que o chat le.
// Uma cidade do tamanho de Ivoti cabe folgado no contexto, entao e mais
// simples (e mais esperto nas respostas) mandar tudo do que fazer busca.

type Catalogo = { texto: string; locais: LocalCompleto[]; em: number };

let cache: Catalogo | null = null;
const VALIDADE = 5 * 60 * 1000; // 5 minutos

function descrever(local: LocalCompleto, agora = agoraNaCidade()): string {
  const s = situacao(local.horarios, agora);
  const linhas: string[] = [];

  linhas.push(`### ${local.nome} [[${local.slug}]]`);
  if (local.categoria) linhas.push(`Categoria: ${local.categoria.nome}`);
  if (local.resumo) linhas.push(`Resumo: ${local.resumo}`);
  if (local.descricao) linhas.push(`Sobre: ${local.descricao.slice(0, 600)}`);

  const endereco = [local.endereco, local.numero, local.bairro]
    .filter(Boolean)
    .join(", ");
  if (endereco) linhas.push(`Endereco: ${endereco}`);

  linhas.push(`Agora: ${s.aberto ? "ABERTO" : "FECHADO"} (${s.texto})`);
  linhas.push(`Horarios: ${resumoSemana(local.horarios)}`);

  if (local.faixa_preco) linhas.push(`Preco: ${faixaPreco(local.faixa_preco)}`);
  if (local.tags.length)
    linhas.push(`Caracteristicas: ${local.tags.map((t) => t.nome).join(", ")}`);

  if (local.itens.length) {
    const amostra = local.itens
      .slice(0, 12)
      .map((i) => (i.preco ? `${i.nome} (R$ ${i.preco})` : i.nome))
      .join("; ");
    linhas.push(`O que tem la: ${amostra}`);
  }

  if (local.whatsapp || local.telefone)
    linhas.push(`Contato: ${local.whatsapp ?? local.telefone}`);

  return linhas.join("\n");
}

/**
 * A agenda em texto, pro chat responder "o que rola esse fim de semana".
 *
 * Pega de seis horas atras pra frente: um evento que comecou as 14h ainda
 * interessa a quem pergunta as 16h.
 */
async function agenda(): Promise<string> {
  // Mesma regra das telas: publicado, ja liberado, ainda nao passou.
  const eventos = await eventosVisiveis({ limite: 40 }, createAdminClient());

  if (eventos.length === 0) {
    return "\n\n## AGENDA\nNenhum evento marcado no guia por enquanto. Nao invente eventos.";
  }

  const linhas = eventos.map((e) => {
    const onde = e.local
      ? `${e.local.nome} [[${e.local.slug}]]`
      : (e.local_texto ?? "local a confirmar");
    const detalhe = e.descricao ? ` — ${e.descricao.slice(0, 200)}` : "";
    return `- ${e.titulo} · ${quandoPorExtenso(e.inicio)} · ${onde}${detalhe}`;
  });

  return `\n\n## AGENDA (eventos com data marcada)\n${linhas.join("\n")}`;
}

/**
 * As promocoes que valem hoje, para o Gui responder "tem promocao hoje?".
 *
 * Usa a mesma funcao do banco que o site usa, entao chat e tela nunca
 * discordam sobre o que esta valendo.
 */
async function promocoesDeHoje(nomePorId: Map<string, string>): Promise<string> {
  const { data } = await createAdminClient().rpc("promocoes_de_hoje", {
    p_local: null,
  });

  const promocoes = (data ?? []) as {
    local_id: string;
    titulo: string;
    descricao: string | null;
    dias_semana: number[];
    hora_inicio: string | null;
    hora_fim: string | null;
  }[];

  if (promocoes.length === 0) {
    return "\n\n## PROMOCOES DE HOJE\nNenhuma promocao valendo hoje. Nao invente promocao.";
  }

  const linhas = promocoes.map((p) => {
    const onde = nomePorId.get(p.local_id) ?? "local do guia";
    const detalhe = p.descricao ? ` — ${p.descricao.slice(0, 160)}` : "";
    return `- ${p.titulo} · ${onde} · ${quandoVale(p)}${detalhe}`;
  });

  return `\n\n## PROMOCOES DE HOJE\n${linhas.join("\n")}`;
}

/** Monta (ou reaproveita) o catalogo de locais publicados. */
export async function catalogo(): Promise<Catalogo> {
  if (cache && Date.now() - cache.em < VALIDADE) return cache;

  const admin = createAdminClient();
  const locais = await buscarLocais({ limite: 500 }, admin);
  const nomePorId = new Map(locais.map((l) => [l.id, l.nome]));
  const [proximos, promocoes] = await Promise.all([
    agenda(),
    promocoesDeHoje(nomePorId),
  ]);
  const agora = agoraNaCidade();

  const cabecalho = [
    `Hoje e ${DIAS[agora.diaSemana]}, sao ${agora.hhmm} em Ivoti (RS).`,
    `Locais cadastrados no guia: ${locais.length}.`,
    "",
  ].join("\n");

  const texto =
    cabecalho +
    locais.map((l) => descrever(l, agora)).join("\n\n") +
    proximos +
    promocoes;

  cache = { texto, locais, em: Date.now() };
  return cache;
}

/** Derruba o cache — usado quando um local e publicado ou editado. */
export function limparCatalogo() {
  cache = null;
}
