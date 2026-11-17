import { createAdminClient } from "./supabase/admin";
import { buscarLocais } from "./locais";
import { eventosVisiveis } from "./eventos";
import {
  agoraNaCidade,
  resumoSemana,
  situacao,
  quandoPorExtenso,
  porDia,
  DIAS,
} from "./horarios";
import { faixaPreco } from "./texto";
import { distancia, formatarDistancia } from "./geo";
import { planoAtivo, podeUsar } from "./planos";
import { quandoVale } from "./promocoes";
import type { LocalCompleto } from "./tipos";

// O catalogo inteiro da cidade em texto, do jeito que o chat le.
// Uma cidade do tamanho de Ivoti cabe folgado no contexto, entao e mais
// simples (e mais esperto nas respostas) mandar tudo do que fazer busca.

type Catalogo = { texto: string; locais: LocalCompleto[]; em: number };

let cache: Catalogo | null = null;
const VALIDADE = 5 * 60 * 1000; // 5 minutos

/** Quantos vizinhos cada lugar leva na linha "Perto". */
const VIZINHOS = 6;

/**
 * Para cada lugar, os vizinhos mais proximos e quanto se leva ate eles.
 *
 * Sem isto o Guia nao tinha como saber o que fica perto de que, e chutava:
 * em 17/11/2026, para quem tinha uma hora, juntou o Portico, o Nucleo de
 * Casas Enxaimel e a Praca Concordia — so do primeiro ao segundo sao mais
 * de seis quilometros. Na mesma tarde disse que a Ponte do Imperador fica
 * "a apenas 1 km do centro", numero que nao estava em lugar nenhum.
 *
 * A distancia e em linha reta com 30% de folga, a mesma conta do resumo
 * dos roteiros. A pe ate 800 metros (80 m por minuto); dali em diante, de
 * carro a 30 km/h mais um minuto para sair e estacionar. E estimativa, e
 * por isso sai arredondada: serve para decidir o que cabe no passeio, nao
 * para prometer horario.
 */
function vizinhos(locais: LocalCompleto[]): Map<string, string> {
  const comPino = locais.filter((l) => l.lat != null && l.lng != null);
  const linhas = new Map<string, string>();

  for (const a of comPino) {
    const perto = comPino
      .filter((b) => b.id !== a.id)
      .map((b) => ({
        nome: b.nome,
        metros:
          distancia(
            { lat: a.lat as number, lng: a.lng as number },
            { lat: b.lat as number, lng: b.lng as number },
          ) * 1.3,
      }))
      .sort((x, y) => x.metros - y.metros)
      .slice(0, VIZINHOS)
      .map(({ nome, metros }) => {
        const tempo =
          metros <= 800
            ? `${Math.max(1, Math.round(metros / 80))} min a pe`
            : `${Math.round(metros / 500) + 1} min de carro`;
        return `${nome} (${formatarDistancia(metros)}, ${tempo})`;
      });

    if (perto.length) linhas.set(a.id, perto.join("; "));
  }

  return linhas;
}

function descrever(
  local: LocalCompleto,
  agora = agoraNaCidade(),
  perto?: string,
): string {
  const s = situacao(local.horarios, agora);
  const linhas: string[] = [];

  const parceiro = podeUsar(
    "prioridade_guia",
    planoAtivo(local.plano, local.plano_ate),
  );

  linhas.push(`### ${local.nome} [[${local.slug}]]`);
  // A marca que o Guia usa para desempatar entre dois lugares que servem
  // igualmente bem. Nunca para esconder os demais: o catalogo vai inteiro.
  if (parceiro) linhas.push("PARCEIRO");
  if (local.categoria) linhas.push(`Categoria: ${local.categoria.nome}`);
  if (local.resumo) linhas.push(`Resumo: ${local.resumo}`);
  if (local.descricao) linhas.push(`Sobre: ${local.descricao.slice(0, 600)}`);

  const endereco = [local.endereco, local.numero, local.bairro]
    .filter(Boolean)
    .join(", ");
  if (endereco) linhas.push(`Endereco: ${endereco}`);
  linhas.push(
    perto
      ? `Perto: ${perto}`
      : "Perto: sem ponto no mapa. Nao afirme distancia nem diga que fica perto de outro lugar.",
  );

  linhas.push(
    s.semHorario
      ? "Agora: horario nao informado. Nao afirme que esta aberto nem que esta fechado."
      : `Agora: ${s.aberto ? "ABERTO" : "FECHADO"} (${s.texto})`,
  );
  // As faixas de hoje, ja separadas. Com a semana inteira numa linha so, o
  // Guia pegava a hora do dia errado: num sabado disse "abrem as 11h" e,
  // duas mensagens depois, "abrem ao meio-dia".
  if (!s.semHorario) {
    const hoje = porDia(local.horarios)[agora.diaSemana];
    linhas.push(
      `Hoje (${DIAS[agora.diaSemana]}): ${
        hoje.fechado ? "nao abre hoje" : hoje.faixas.join(", ")
      }`,
    );
  }
  linhas.push(`Horarios da semana: ${resumoSemana(local.horarios)}`);

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
  // O teto existe para o texto não crescer sem fim, mas tem de caber um
  // ano de calendário: com 40, o Guia não sabia do Natal.
  const eventos = await eventosVisiveis({ limite: 120 }, createAdminClient());

  if (eventos.length === 0) {
    return "\n\n## AGENDA\nNenhum evento marcado no guia por enquanto. Nao invente eventos.";
  }

  const linhas = eventos.map((e) => {
    const onde = e.local
      ? `${e.local.nome} [[${e.local.slug}]]`
      : (e.local_texto ?? "local a confirmar");
    const detalhe = e.descricao ? ` — ${e.descricao.slice(0, 200)}` : "";
    return `- ${e.titulo} · ${quandoPorExtenso(e.inicio, e.sem_hora)} · ${onde}${detalhe}`;
  });

  return `\n\n## AGENDA (eventos com data marcada)\n${linhas.join("\n")}`;
}

/**
 * As promocoes que valem hoje, para o Guia responder "tem promocao hoje?".
 *
 * Usa a mesma funcao do banco que o site usa, entao chat e tela nunca
 * discordam sobre o que esta valendo.
 */
async function promocoesDeHoje(
  nomePorId: Map<string, string>,
): Promise<string> {
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
  const todos = await buscarLocais({ limite: 500 }, admin);

  // Parceiro primeiro na lista. A ordem tambem pesa na escolha do modelo, e
  // aqui ela reforca o desempate que as instrucoes ja pedem — sem tirar
  // ninguem do catalogo.
  const locais = [...todos].sort((a, b) => {
    const pa = podeUsar("prioridade_guia", planoAtivo(a.plano, a.plano_ate))
      ? 0
      : 1;
    const pb = podeUsar("prioridade_guia", planoAtivo(b.plano, b.plano_ate))
      ? 0
      : 1;
    return pa - pb;
  });
  const nomePorId = new Map(locais.map((l) => [l.id, l.nome]));
  const [proximos, promocoes] = await Promise.all([
    agenda(),
    promocoesDeHoje(nomePorId),
  ]);
  const agora = agoraNaCidade();
  const perto = vizinhos(locais);

  // Quem está aberto agora, numa linha só, no topo. A situação de cada
  // lugar já vai no bloco dele ("Agora: FECHADO"), mas não bastava: em
  // 17/11/2026, às 20h25, o Guia montou um passeio com a Casa do Artesão,
  // fechada desde as 17h. Uma lista pronta é mais difícil de ignorar do
  // que dezesseis linhas espalhadas.
  const abertos = locais
    .filter((l) => {
      const s = situacao(l.horarios, agora);
      return !s.semHorario && s.aberto;
    })
    .map((l) => l.nome);

  const cabecalho = [
    `Hoje e ${DIAS[agora.diaSemana]}, sao ${agora.hhmm} em Ivoti (RS).`,
    `Locais cadastrados no guia: ${locais.length}.`,
    `ABERTOS AGORA (${agora.hhmm}): ${abertos.length ? abertos.join(", ") : "nenhum"}. Os outros lugares com horario informado estao FECHADOS agora.`,
    "",
  ].join("\n");

  const texto =
    cabecalho +
    locais.map((l) => descrever(l, agora, perto.get(l.id))).join("\n\n") +
    proximos +
    promocoes;

  const montado = { texto, locais, em: Date.now() };
  // Lista vazia aqui é falha do banco (a busca devolve vazio no erro), não
  // uma cidade sem lugares. Guardar isso faria o Guia dizer por cinco
  // minutos que não conhece lugar nenhum; sem guardar, a próxima pergunta
  // tenta de novo.
  if (locais.length > 0) cache = montado;
  return montado;
}

/** Derruba o cache — usado quando um local e publicado ou editado. */
export function limparCatalogo() {
  cache = null;
}
