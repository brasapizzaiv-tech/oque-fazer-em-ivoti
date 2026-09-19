import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import CardMadeira from "@/components/enxaimel/CardMadeira";
import Cabecalho, { BuscaCabecalho } from "@/components/enxaimel/Cabecalho";
import {
  CasaEnxaimel,
  IconeExplorar,
  IconeGuia,
  IconeInicio,
  IconeRoteiros,
  Petunia,
  Torii,
  Trelica,
} from "@/components/enxaimel/icones";
import {
  Botao,
  Chip,
  FaixaEnxaimel,
  FaixaTelhas,
  Legenda,
  Logo,
  SeloHanko,
  SeloStatus,
  TituloSecao,
} from "@/components/enxaimel/pecas";

/**
 * A vitrine dos componentes do redesenho, para aprovação antes de montar as
 * telas.
 *
 * Fica fora da busca: é página de trabalho, não conteúdo do guia.
 *
 * As fontes entram aqui e não no layout do site porque, enquanto o
 * redesenho não substituir as telas, carregar Fraunces e DM Sans em toda
 * página do ar seria peso sem uso.
 */
const titulo = Fraunces({
  variable: "--fonte-titulo-nova",
  subsets: ["latin"],
  weight: ["700"],
  display: "swap",
});

const corpo = DM_Sans({
  variable: "--fonte-corpo-nova",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Componentes",
  robots: { index: false, follow: false },
};

const CATEGORIAS = [
  "Todos", "Comer", "Beber", "Bares", "Cafés", "Dormir",
  "Passear", "Compras", "Flores", "Serviços", "Com evento", "Com promoção",
];

export default function Componentes() {
  return (
    <div
      className={`${titulo.variable} ${corpo.variable} font-[family-name:var(--fonte-corpo-nova)]`}
      style={{ backgroundColor: "var(--color-reboco)", color: "var(--color-texto)" }}
    >
      <div className="mx-auto max-w-[430px] px-4 py-8 sm:max-w-3xl">
        <Bloco n="1" nome="Paleta">
          <div className="grid grid-cols-4 gap-2">
            {[
              ["Reboco", "#f4ede0"], ["Superfície", "#fffdf7"],
              ["Madeira", "#3b2418"], ["Madeira funda", "#1e1008"],
              ["Texto", "#2b1b12"], ["Texto suave", "#6b5647"],
              ["Torii", "#c8362b"], ["Telha", "#b5533a"],
              ["Telha funda", "#8e3e2b"], ["Veneziana", "#2f6b4f"],
              ["Petúnia", "#b94a8c"], ["Garganta", "#7e2a6b"],
              ["Miolo", "#f7e7a6"], ["Petúnia clara", "#e7b3d0"],
              ["Creme fundo", "#c9bba2"], ["Treliça", "#e9e0cf"],
            ].map(([nome, hex]) => (
              <div key={hex}>
                <div
                  className="h-12 w-full rounded-[4px]"
                  style={{ backgroundColor: hex, border: "1px solid rgba(43,27,18,.2)" }}
                />
                <p className="mt-1 text-[10px] leading-tight">{nome}</p>
                <p className="font-mono text-[9px] opacity-55">{hex}</p>
              </div>
            ))}
          </div>
        </Bloco>

        <Bloco n="2" nome="Símbolos">
          <div className="flex items-end gap-6">
            <Marcado rotulo="Torii 34×30">
              <Torii tamanho={34} style={{ color: "var(--color-torii)" }} />
            </Marcado>
            <Marcado rotulo="Casa 34×30">
              <CasaEnxaimel tamanho={34} style={{ color: "var(--color-madeira)" }} />
            </Marcado>
            <Marcado rotulo="Petúnia">
              <Petunia tamanho={30} />
            </Marcado>
          </div>
        </Bloco>

        <Bloco n="3" nome="Logo">
          <div className="space-y-4">
            <Logo />
            <div className="p-4" style={{ backgroundColor: "#2e1a10" }}>
              <Logo claro />
            </div>
            <p className="text-[12px]" style={{ color: "var(--color-texto-suave)" }}>
              O nome entra por parâmetro. Acima está o do documento; o site no
              ar hoje se chama <strong>O Guia de Ivoti</strong>.
            </p>
            <div className="p-4" style={{ backgroundColor: "#2e1a10" }}>
              <Logo nome="O Guia de Ivoti" claro />
            </div>
          </div>
        </Bloco>

        <Bloco n="4" nome="Cabeçalho">
          <div className="overflow-hidden" style={{ border: "1px solid rgba(43,27,18,.2)" }}>
            <Cabecalho>
              <BuscaCabecalho />
            </Cabecalho>
          </div>
        </Bloco>

        <Bloco n="5" nome="Card de madeira">
          <div className="space-y-5">
            <CardMadeira variante={1}>
              <div className="p-4">
                <p className="font-[family-name:var(--fonte-titulo-nova)] text-[16px] font-bold">
                  Variante 1, com mãos-francesas
                </p>
                <p className="mt-1 text-[13px]" style={{ color: "var(--color-texto-suave)" }}>
                  Veio deitado em cima e embaixo, em pé nos lados. Sombra dura
                  de 4px. As diagonais travam os cantos opostos e param na
                  margem interna.
                </p>
              </div>
            </CardMadeira>

            <CardMadeira variante={2}>
              <div className="flex gap-3 p-3">
                <div className="h-[86px] w-[86px] shrink-0 overflow-hidden">
                  <Trelica />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <SeloStatus tipo="aberto" />
                    <SeloStatus tipo="promocao" />
                  </div>
                  <p className="mt-1.5 font-[family-name:var(--fonte-titulo-nova)] text-[16px] font-bold">
                    Variante 2, com treliça
                  </p>
                  <p className="text-[13px]" style={{ color: "var(--color-texto-suave)" }}>
                    Café · Centro · 800 m
                  </p>
                </div>
              </div>
            </CardMadeira>

            <CardMadeira variante={1} maosFrancesas={false}>
              <div className="p-3 text-[13px]">
                Sem as diagonais, para card pequeno demais.
              </div>
            </CardMadeira>
          </div>
        </Bloco>

        <Bloco n="6" nome="Faixa de enxaimel e telhas">
          <div className="space-y-4">
            <FaixaEnxaimel />
            <FaixaTelhas />
          </div>
        </Bloco>

        <Bloco n="7" nome="Selos de seção e títulos">
          <div className="space-y-3">
            <TituloSecao selo="evento">Acontece hoje</TituloSecao>
            <TituloSecao selo="evento">Próximos eventos</TituloSecao>
            <TituloSecao selo="promocao">Promoções de hoje</TituloSecao>
            <div className="flex gap-2 pt-1">
              <SeloHanko tipo="evento" />
              <SeloHanko tipo="promocao" />
            </div>
          </div>
        </Bloco>

        <Bloco n="8" nome="Pílulas de categoria">
          <div className="flex flex-wrap gap-2">
            {CATEGORIAS.map((c, i) => (
              <Chip key={c} ativo={i === 0} flor={c === "Flores"}>
                {c}
              </Chip>
            ))}
          </div>
          <div className="mt-3 flex gap-2">
            <Chip ativo destaque>Ativa em vermelho</Chip>
            <Chip ativo>Ativa em madeira</Chip>
          </div>
        </Bloco>

        <Bloco n="9" nome="Selos de status">
          <div className="flex flex-wrap gap-2">
            <SeloStatus tipo="aberto" />
            <SeloStatus tipo="fechado" />
            <SeloStatus tipo="evento" />
            <SeloStatus tipo="promocao" />
          </div>
          <div className="mt-3">
            <Legenda>Legenda em caixa alta</Legenda>
          </div>
        </Bloco>

        <Bloco n="10" nome="Botões">
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2">
              <Botao>Falar com o Guia</Botao>
              <Botao tom="secundario">Sou comerciante</Botao>
            </div>
            <Botao larguraTotal>Abrir rota completa no Google Maps</Botao>
          </div>
        </Bloco>

        <Bloco n="11" nome="Navegação inferior">
          <div
            className="flex"
            style={{
              backgroundColor: "var(--color-superficie)",
              borderTop: "2px solid var(--color-madeira)",
            }}
          >
            {[
              { rotulo: "Início", Icone: IconeInicio, ativo: true },
              { rotulo: "Explorar", Icone: IconeExplorar, ativo: false },
              { rotulo: "Roteiros", Icone: IconeRoteiros, ativo: false },
              { rotulo: "Guia", Icone: IconeGuia, ativo: false },
            ].map(({ rotulo, Icone, ativo }) => (
              <span
                key={rotulo}
                className="flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium"
                style={{
                  color: ativo
                    ? "var(--color-torii)"
                    : "var(--color-texto-suave)",
                }}
              >
                <Icone />
                {rotulo}
              </span>
            ))}
          </div>
        </Bloco>
      </div>
    </div>
  );
}

function Bloco({
  n,
  nome,
  children,
}: {
  n: string;
  nome: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mb-10">
      <p className="mb-3 flex items-baseline gap-2">
        <span
          className="font-mono text-[11px]"
          style={{ color: "var(--color-texto-suave)" }}
        >
          {n}
        </span>
        <span
          className="font-[family-name:var(--fonte-titulo-nova)] text-[22px] font-bold"
          style={{ color: "var(--color-texto)" }}
        >
          {nome}
        </span>
      </p>
      {children}
    </section>
  );
}

function Marcado({
  rotulo,
  children,
}: {
  rotulo: string;
  children: React.ReactNode;
}) {
  return (
    <span className="flex flex-col items-center gap-1.5">
      {children}
      <span className="text-[10px]" style={{ color: "var(--color-texto-suave)" }}>
        {rotulo}
      </span>
    </span>
  );
}
