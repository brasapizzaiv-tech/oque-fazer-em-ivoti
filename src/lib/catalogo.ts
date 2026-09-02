import { createAdminClient } from "./supabase/admin";
import { buscarLocais } from "./locais";
import { agoraNaCidade, resumoSemana, situacao, DIAS } from "./horarios";
import { faixaPreco } from "./texto";
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

/** Monta (ou reaproveita) o catalogo de locais publicados. */
export async function catalogo(): Promise<Catalogo> {
  if (cache && Date.now() - cache.em < VALIDADE) return cache;

  const admin = createAdminClient();
  const locais = await buscarLocais({ limite: 500 }, admin);
  const agora = agoraNaCidade();

  const cabecalho = [
    `Hoje e ${DIAS[agora.diaSemana]}, sao ${agora.hhmm} em Ivoti (RS).`,
    `Locais cadastrados no guia: ${locais.length}.`,
    "",
  ].join("\n");

  const texto =
    cabecalho + locais.map((l) => descrever(l, agora)).join("\n\n");

  cache = { texto, locais, em: Date.now() };
  return cache;
}

/** Derruba o cache — usado quando um local e publicado ou editado. */
export function limparCatalogo() {
  cache = null;
}
