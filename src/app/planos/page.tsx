import type { Metadata } from "next";
import CabecalhoSimples from "@/components/vidro/CabecalhoSimples";
import { Botao, CardAzul, CardVidro, Legenda } from "@/components/vidro/pecas";
import { NOME_DO_SITE, WHATSAPP_DO_GUIA } from "@/lib/marca";
import {
  ORDEM_DOS_PLANOS,
  PLANOS,
  precoPorExtenso,
  type PlanoPago,
} from "@/lib/planos";
import { enderecoOficial } from "@/lib/site";

export const metadata: Metadata = {
  alternates: enderecoOficial("/planos"),
  title: "Planos para o seu negócio",
  description:
    "Três planos para o seu estabelecimento aparecer no guia de Ivoti, divulgar eventos e promoções e receber o visitante que as campanhas trazem.",
  // Fica fora da busca até o modelo ser lançado de vez: a página existe
  // para ser mostrada a comerciante, não para ser achada por acaso.
  robots: { index: false, follow: false },
};

/**
 * O que cada plano acrescenta ao de baixo.
 *
 * Escrito aqui, em frases de vitrine, e não tirado da tabela MODULOS: lá
 * estão os nomes que o painel usa ("Métricas", "Assistente no painel"), e
 * quem está decidindo se assina precisa ler o que ganha, não o nome da
 * tela. Se um módulo mudar de degrau em lib/planos.ts, esta lista muda
 * junto — é a mesma decisão dita para dois públicos.
 */
const INCLUI: Record<PlanoPago, string[]> = {
  presenca: [
    "Página completa: fotos, horários, cardápio e contatos",
    "Pino no mapa, com rota em um toque",
    "Aparece na busca e nas categorias",
    "O Guia indica o seu lugar quando alguém pede algo do seu tipo",
  ],
  movimento: [
    "Seus eventos na agenda da cidade",
    "Suas promoções na capa do guia",
    "Métricas: quantos clicaram no WhatsApp, na rota e no cardápio",
    "Exportação dos números em planilha",
  ],
  campanha: [
    "Prioridade nas indicações do Guia",
    "Presença nos roteiros que o Guia monta",
    "Assistente de IA no painel, para textos e promoções",
    "Preferência nas campanhas com influenciadores",
  ],
};

const ANTERIOR: Partial<Record<PlanoPago, PlanoPago>> = {
  movimento: "presenca",
  campanha: "movimento",
};

const IMPLANTACAO = [
  {
    nome: "Orientação",
    texto:
      "A gente senta com você e monta o cadastro junto, com as fotos que você já tem.",
  },
  {
    nome: "Com fotos",
    texto:
      "Orientação e uma visita ao seu estabelecimento para fotografar o lugar.",
  },
  {
    nome: "Completa",
    texto:
      "Orientação, fotos e um vídeo curto do lugar, que também serve para as suas redes.",
  },
];

function linkDoWhats(mensagem: string): string {
  return `https://wa.me/${WHATSAPP_DO_GUIA}?text=${encodeURIComponent(mensagem)}`;
}

export default function Planos() {
  return (
    <>
      <CabecalhoSimples />

      <div className="mx-auto max-w-[1100px] px-4 py-10 lg:px-8 lg:py-14">
        <Legenda cor="var(--color-v-petunia)">
          Para quem tem um negócio em Ivoti
        </Legenda>
        <h1
          className="mt-2 max-w-[20ch] text-[30px] leading-[1.1] font-bold lg:text-[40px]"
          style={{
            color: "var(--color-v-texto)",
            fontFamily: "var(--fonte-titulo-nova)",
          }}
        >
          O visitante chega pelo guia. O seu lugar precisa estar nele.
        </h1>
        <p
          className="mt-3 max-w-[58ch] text-[15px]"
          style={{ color: "var(--color-v-texto-suave)" }}
        >
          Três planos mensais, sem fidelidade. Você escolhe o degrau, e pode
          subir ou descer quando quiser.
        </p>

        {/* ---------------- os três degraus ---------------- */}
        <div className="mt-8 grid gap-4 lg:grid-cols-3">
          {ORDEM_DOS_PLANOS.map((plano) => {
            const { nome, centavos, resumo } = PLANOS[plano];
            const anterior = ANTERIOR[plano];
            const Cartao = plano === "campanha" ? CardAzul : CardVidro;
            const claro = plano === "campanha";

            return (
              <Cartao key={plano} className="flex flex-col p-6">
                <p
                  className="text-[22px] font-bold"
                  style={{
                    color: claro ? "#FFFFFF" : "var(--color-v-texto)",
                    fontFamily: "var(--fonte-titulo-nova)",
                  }}
                >
                  {nome}
                </p>
                <p
                  className="mt-1 text-[14px]"
                  style={{
                    color: claro
                      ? "rgba(255,255,255,0.88)"
                      : "var(--color-v-texto-suave)",
                  }}
                >
                  {resumo}
                </p>

                <p
                  className="mt-5 flex items-baseline gap-1.5"
                  style={{ color: claro ? "#FFFFFF" : "var(--color-v-texto)" }}
                >
                  <span
                    className="text-[32px] leading-none font-bold tabular-nums"
                    style={{ fontFamily: "var(--fonte-titulo-nova)" }}
                  >
                    {precoPorExtenso(centavos)}
                  </span>
                  <span className="text-[14px] opacity-85">por mês</span>
                </p>

                <ul
                  className="mt-5 flex-1 space-y-2.5 text-[14px]"
                  style={{ color: claro ? "#FFFFFF" : "var(--color-v-texto)" }}
                >
                  {anterior && (
                    <li className="font-bold">
                      Tudo do {PLANOS[anterior].nome}, e mais:
                    </li>
                  )}
                  {INCLUI[plano].map((item) => (
                    <li key={item} className="flex gap-2">
                      <span aria-hidden className="shrink-0 font-bold">
                        ✓
                      </span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </Cartao>
            );
          })}
        </div>

        <div className="mt-6">
          <Botao href="/cadastrar">Cadastrar meu estabelecimento</Botao>
        </div>

        {/* ---------------- campanhas ---------------- */}
        <section className="mt-14 grid gap-4 lg:grid-cols-2">
          <CardVidro className="p-6">
            <Legenda cor="var(--color-v-azul)">Campanhas</Legenda>
            <h2
              className="mt-1 text-[22px] font-bold"
              style={{
                color: "var(--color-v-texto)",
                fontFamily: "var(--fonte-titulo-nova)",
              }}
            >
              Um influenciador visita a cidade usando o guia
            </h2>
            <p
              className="mt-3 text-[15px]"
              style={{ color: "var(--color-v-texto)" }}
            >
              A cada campanha, um criador de conteúdo percorre Ivoti seguindo o
              roteiro do guia e visita quatro estabelecimentos. O vídeo traz o
              visitante para o site, e do site para a cidade.
            </p>
            <ul
              className="mt-4 space-y-2 text-[14px]"
              style={{ color: "var(--color-v-texto)" }}
            >
              <li>
                <strong>Quatro cotas por campanha</strong>, uma para cada lugar
                visitado.
              </li>
              <li>
                <strong>Quem está no plano Campanha escolhe primeiro.</strong>
              </li>
              <li>
                <strong>Relatório no fim</strong>: quantas pessoas abriram a sua
                página e quantas clicaram no seu WhatsApp.
              </li>
            </ul>
            <p
              className="mt-4 text-[13px]"
              style={{ color: "var(--color-v-texto-suave)" }}
            >
              A cota é paga por campanha, à parte da mensalidade.
            </p>
          </CardVidro>

          {/* ---------------- implantação ---------------- */}
          <CardVidro className="p-6">
            <Legenda cor="var(--color-v-azul)">Implantação</Legenda>
            <h2
              className="mt-1 text-[22px] font-bold"
              style={{
                color: "var(--color-v-texto)",
                fontFamily: "var(--fonte-titulo-nova)",
              }}
            >
              Não quer preencher nada? A gente monta para você
            </h2>
            <ul className="mt-4 space-y-3">
              {IMPLANTACAO.map(({ nome, texto }) => (
                <li key={nome}>
                  <p
                    className="text-[15px] font-bold"
                    style={{ color: "var(--color-v-texto)" }}
                  >
                    {nome}
                  </p>
                  <p
                    className="text-[14px]"
                    style={{ color: "var(--color-v-texto-suave)" }}
                  >
                    {texto}
                  </p>
                </li>
              ))}
            </ul>
            <p
              className="mt-4 text-[13px]"
              style={{ color: "var(--color-v-texto-suave)" }}
            >
              Valor único, pago uma vez, à parte da mensalidade.
            </p>
          </CardVidro>
        </section>

        <div className="mt-8 flex flex-wrap gap-3">
          <Botao
            href={linkDoWhats(
              `Olá! Quero saber mais sobre os planos do ${NOME_DO_SITE}.`,
            )}
          >
            Falar com a gente
          </Botao>
          <Botao tom="secundario" href="/cadastrar">
            Cadastrar meu estabelecimento
          </Botao>
        </div>
      </div>
    </>
  );
}
