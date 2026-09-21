import type { Metadata } from "next";
import CardComFoto from "@/components/vidro/CardComFoto";
import FundoDaCidade from "@/components/vidro/FundoDaCidade";
import NavegacaoInferior from "@/components/vidro/NavegacaoInferior";
import {
  CasaEnxaimel,
  IconeEnviar,
  IconeExplorar,
  IconeFavorito,
  IconeFiltros,
  IconeGuia,
  IconeInicio,
  IconeRoteiros,
  IconeVoltar,
  Petunia,
  Torii,
} from "@/components/vidro/icones";
import {
  Botao,
  CardAzul,
  CardVidro,
  Chip,
  Legenda,
  Logo,
  SeloHanko,
  SeloStatus,
} from "@/components/vidro/pecas";

export const metadata: Metadata = {
  title: "Componentes",
  robots: { index: false, follow: false },
};

/**
 * A vitrine dos componentes do desenho de vidro, para aprovação antes de
 * montar as telas.
 *
 * Fica fora do menu e fora da busca: é página de trabalho, não de guia.
 * Cada peça aparece no contexto em que vai viver — o cartão de vidro sobre
 * a foto, o card com foto no tamanho real da lista, a pílula ao lado das
 * irmãs — porque componente isolado em fundo branco não mostra o que dá
 * errado quando eles se encostam.
 */
export default function Componentes() {
  return (
    <>
      <FundoDaCidade />

      <div className="mx-auto max-w-[1100px] px-4 pt-8 pb-28 lg:px-8">
        <header>
          <Legenda cor="var(--color-v-azul)">Para aprovação</Legenda>
          <h1
            className="mt-1 text-[32px] leading-none font-bold lg:text-[44px]"
            style={{
              color: "var(--color-v-texto)",
              fontFamily: "var(--fonte-titulo-nova)",
            }}
          >
            Componentes
          </h1>
          <p
            className="mt-2 max-w-[60ch] text-[15px]"
            style={{ color: "var(--color-v-texto-suave)" }}
          >
            As peças do desenho novo, cada uma no fundo em que vai viver. A foto
            da cidade está por trás desta página inteira, fixa — é ela que faz o
            vidro ser vidro.
          </p>
        </header>

        {/* ---------------- 1. o logo ---------------- */}
        <Secao numero="1" titulo="O logo">
          <div className="flex flex-wrap items-center gap-8">
            <CardVidro className="px-5 py-4">
              <Logo />
              <p
                className="mt-2 text-[11px]"
                style={{ color: "var(--color-v-texto-suave)" }}
              >
                sobre vidro
              </p>
            </CardVidro>

            <div
              className="relative overflow-hidden rounded-[18px] px-5 py-4"
              style={{ backgroundColor: "#2B2320" }}
            >
              <Logo sobreFoto />
              <p className="mt-2 text-[11px] text-white/60">sobre foto</p>
            </div>
          </div>
        </Secao>

        {/* ---------------- 2. as cores ---------------- */}
        <Secao numero="2" titulo="As cores, uma por assunto">
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <Cor nome="Ação" hex="#E03A2F" token="--color-v-torii" />
            <Cor nome="Links, roteiro" hex="#1F4E9C" token="--color-v-azul" />
            <Cor
              nome="Favoritos"
              hex="#F2B705"
              token="--color-v-ouro"
              escura={false}
            />
            <Cor nome="Eventos" hex="#C9408F" token="--color-v-petunia" />
            <Cor nome="Promoções" hex="#F28C28" token="--color-v-laranja" />
            <Cor nome="Aberto" hex="#3E9B5B" token="--color-v-verde" />
            <Cor nome="Fechado" hex="#B5533A" token="--color-v-fechado-claro" />
            <Cor nome="Texto" hex="#2B2320" token="--color-v-texto" />
          </div>
        </Secao>

        {/* ---------------- 3. os três símbolos ---------------- */}
        <Secao numero="3" titulo="Os três símbolos">
          <CardVidro className="flex flex-wrap items-end gap-10 px-6 py-5">
            <Simbolo rotulo="Torii">
              <Torii tamanho={44} />
            </Simbolo>
            <Simbolo rotulo="Casa enxaimel">
              <CasaEnxaimel tamanho={44} />
            </Simbolo>
            <Simbolo rotulo="Petúnia">
              <Petunia tamanho={40} />
            </Simbolo>
          </CardVidro>

          <p
            className="mt-3 text-[13px]"
            style={{ color: "var(--color-v-texto-suave)" }}
          >
            O torii e a casa têm a mesma altura e a mesma linha de base: são as
            duas heranças da cidade e uma não pode parecer maior que a outra.
          </p>
        </Secao>

        {/* ---------------- 4. ícones de interface ---------------- */}
        <Secao numero="4" titulo="Ícones de interface">
          <CardVidro
            className="flex flex-wrap gap-7 px-6 py-5"
            style={{ color: "var(--color-v-texto)" }}
          >
            <Simbolo rotulo="Início">
              <IconeInicio tamanho={26} />
            </Simbolo>
            <Simbolo rotulo="Explorar">
              <IconeExplorar tamanho={26} />
            </Simbolo>
            <Simbolo rotulo="Roteiros">
              <IconeRoteiros tamanho={26} />
            </Simbolo>
            <Simbolo rotulo="Guia">
              <IconeGuia tamanho={26} />
            </Simbolo>
            <Simbolo rotulo="Voltar">
              <IconeVoltar tamanho={26} />
            </Simbolo>
            <Simbolo rotulo="Filtros">
              <IconeFiltros tamanho={26} />
            </Simbolo>
            <Simbolo rotulo="Favorito">
              <span style={{ color: "var(--color-v-ouro)" }}>
                <IconeFavorito tamanho={26} marcado />
              </span>
            </Simbolo>
            <Simbolo rotulo="Enviar">
              <IconeEnviar tamanho={26} />
            </Simbolo>
          </CardVidro>
        </Secao>

        {/* ---------------- 5. os dois vidros ---------------- */}
        <Secao numero="5" titulo="Os dois vidros">
          <div className="grid gap-4 lg:grid-cols-2">
            <CardVidro className="p-5">
              <div className="flex items-center gap-2">
                <SeloHanko tipo="promocao" />
                <h3
                  className="text-[19px] font-bold"
                  style={{
                    color: "var(--color-v-texto)",
                    fontFamily: "var(--fonte-titulo-nova)",
                  }}
                >
                  Vidro branco
                </h3>
              </div>
              <p
                className="mt-1.5 text-[14px]"
                style={{ color: "var(--color-v-texto-suave)" }}
              >
                O padrão de tudo o que não tem foto: promoções, horários,
                paradas do roteiro, balões do Guia.
              </p>
            </CardVidro>

            <CardAzul className="p-5">
              <Legenda cor="#FFFFFF">Monte seu roteiro</Legenda>
              <h3
                className="mt-1 text-[19px] font-bold"
                style={{ fontFamily: "var(--fonte-titulo-nova)" }}
              >
                Vidro azul
              </h3>
              <p className="mt-1.5 text-[14px] text-white/85">
                Os blocos de destaque: roteiro, &ldquo;Acontece hoje&rdquo;, o
                convite ao Guia e os balões de quem está perguntando.
              </p>
              <div className="mt-4">
                <Botao href="/chat" pilula>
                  Rota pronta no Google Maps
                </Botao>
              </div>
            </CardAzul>
          </div>
        </Secao>

        {/* ---------------- 6. card com foto ---------------- */}
        <Secao numero="6" titulo="O card com foto">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            <CardComFoto
              href="/componentes"
              foto="/fotos/portico-ivoti.jpg"
              etiqueta="Sábado, 14h"
              titulo="Feira das Flores"
              apoio="Praça Concórdia"
              alto={150}
            />
            <CardComFoto
              href="/componentes"
              foto="/fotos/eu-amo-ivoti.jpg"
              titulo="Núcleo de Casas Enxaimel"
              apoio="Ponto histórico"
              status="aberto"
              canto="1,2 km"
              alto={150}
            />
            <CardComFoto
              href="/componentes"
              foto={null}
              titulo="Sem foto ainda"
              apoio="Restaurante"
              status="fechado"
              canto="450 m"
              alto={150}
            />
          </div>
          <p
            className="mt-3 text-[13px]"
            style={{ color: "var(--color-v-texto-suave)" }}
          >
            Sem moldura e sem faixa: o que separa o card do fundo é a própria
            foto. Quem ainda não subiu foto recebe o fundo neutro do terceiro.
          </p>
        </Secao>

        {/* ---------------- 7. pílulas ---------------- */}
        <Secao numero="7" titulo="Pílulas de categoria">
          <div className="flex flex-wrap gap-2">
            <Chip ativo>Todos</Chip>
            <Chip>Comer</Chip>
            <Chip>Beber</Chip>
            <Chip>Bares</Chip>
            <Chip>Cafés</Chip>
            <Chip>Dormir</Chip>
            <Chip>Passear</Chip>
            <Chip>Compras</Chip>
            <Chip flor>Flores</Chip>
            <Chip>Serviços</Chip>
            <Chip>Com evento</Chip>
            <Chip>Com promoção</Chip>
          </div>
        </Secao>

        {/* ---------------- 8. selos ---------------- */}
        <Secao numero="8" titulo="Selos e etiquetas">
          <CardVidro className="space-y-4 px-5 py-4">
            <div className="flex items-center gap-2">
              <SeloHanko tipo="evento" />
              <span
                className="text-[22px] font-bold"
                style={{
                  color: "var(--color-v-texto)",
                  fontFamily: "var(--fonte-titulo-nova)",
                }}
              >
                Acontece hoje
              </span>
            </div>
            <div className="flex items-center gap-2">
              <SeloHanko tipo="promocao" />
              <span
                className="text-[22px] font-bold"
                style={{
                  color: "var(--color-v-texto)",
                  fontFamily: "var(--fonte-titulo-nova)",
                }}
              >
                Promoções de hoje
              </span>
            </div>
            <div className="flex flex-wrap gap-2 pt-1">
              <SeloStatus tipo="aberto" />
              <SeloStatus tipo="fechado" />
              <SeloStatus tipo="evento" />
              <SeloStatus tipo="promocao" />
            </div>
          </CardVidro>
        </Secao>

        {/* ---------------- 9. botões ---------------- */}
        <Secao numero="9" titulo="Botões">
          <CardVidro className="flex flex-wrap items-center gap-3 px-5 py-5">
            <Botao>Falar com o Guia</Botao>
            <Botao tom="secundario">Como chegar</Botao>
            <Botao tom="ouro">Sou comerciante</Botao>
            <Botao pilula>Ver rota</Botao>
          </CardVidro>
          <p
            className="mt-3 text-[13px]"
            style={{ color: "var(--color-v-texto-suave)" }}
          >
            Todos com 48px de altura — acima do mínimo de toque de 44px, com
            folga para o dedo que erra um pouco.
          </p>
        </Secao>

        {/* ---------------- 10. tipografia ---------------- */}
        <Secao numero="10" titulo="Tipografia">
          <CardVidro className="px-5 py-5">
            <p
              className="text-[30px] leading-tight font-bold"
              style={{
                color: "var(--color-v-texto)",
                fontFamily: "var(--fonte-titulo-nova)",
              }}
            >
              Flores, casas enxaimel e colônia japonesa
            </p>
            <p
              className="mt-1 text-[11px]"
              style={{ color: "var(--color-v-texto-suave)" }}
            >
              Fraunces 700 — títulos
            </p>

            <p
              className="mt-5 max-w-[62ch] text-[15px]"
              style={{ color: "var(--color-v-texto)" }}
            >
              Onde comer, beber, passear e se hospedar em Ivoti, com horário de
              hoje, endereço e rota no mapa. Feito por gente daqui.
            </p>
            <p
              className="mt-1 text-[11px]"
              style={{ color: "var(--color-v-texto-suave)" }}
            >
              DM Sans 400 — texto
            </p>

            <p className="mt-5">
              <Legenda>Legenda em caixa alta</Legenda>
            </p>
            <p
              className="mt-1 text-[11px]"
              style={{ color: "var(--color-v-texto-suave)" }}
            >
              DM Sans 700, 11px, espaçamento de letras
            </p>
          </CardVidro>
        </Secao>

        {/* ---------------- 11. legibilidade ---------------- */}
        <Secao numero="11" titulo="O texto sobre o vidro">
          <CardVidro className="px-5 py-5">
            <p
              className="text-[15px]"
              style={{ color: "var(--color-v-texto)" }}
            >
              Texto principal sobre vidro branco: #2B2320 sobre a foto velada.
            </p>
            <p
              className="mt-2 text-[15px]"
              style={{ color: "var(--color-v-texto-suave)" }}
            >
              Texto secundário: #6E6660. É o menor contraste do site, e é onde
              vale conferir se a foto de fundo não está clara demais.
            </p>
            <p
              className="mt-2 text-[15px]"
              style={{ color: "var(--color-v-azul)" }}
            >
              Um link, em azul da bandeira.
            </p>
          </CardVidro>
        </Secao>
      </div>

      <NavegacaoInferior />
    </>
  );
}

/* ------------------------------------------------------------------ */

function Secao({
  numero,
  titulo,
  children,
}: {
  numero: string;
  titulo: string;
  children: React.ReactNode;
}) {
  return (
    <section className="pt-10">
      <div className="flex items-baseline gap-2">
        <span
          className="text-[13px] font-bold tabular-nums"
          style={{ color: "var(--color-v-torii)" }}
        >
          {numero}
        </span>
        <h2
          className="text-[22px] font-bold"
          style={{
            color: "var(--color-v-texto)",
            fontFamily: "var(--fonte-titulo-nova)",
          }}
        >
          {titulo}
        </h2>
      </div>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function Cor({
  nome,
  hex,
  token,
  escura = true,
}: {
  nome: string;
  hex: string;
  token: string;
  escura?: boolean;
}) {
  return (
    <div className="overflow-hidden rounded-[14px]">
      <div
        className="grid h-16 place-items-center"
        style={{ backgroundColor: hex }}
      >
        <span
          className="text-[12px] font-bold tabular-nums"
          style={{ color: escura ? "#FFFFFF" : "#2B2320" }}
        >
          {hex}
        </span>
      </div>
      <div className="vidro-leve px-2.5 py-1.5" style={{ borderRadius: 0 }}>
        <p
          className="text-[12px] font-semibold"
          style={{ color: "var(--color-v-texto)" }}
        >
          {nome}
        </p>
        <p
          className="text-[10px]"
          style={{ color: "var(--color-v-texto-suave)" }}
        >
          {token}
        </p>
      </div>
    </div>
  );
}

function Simbolo({
  children,
  rotulo,
}: {
  children: React.ReactNode;
  rotulo: string;
}) {
  return (
    <span className="flex flex-col items-center gap-2">
      {children}
      <span
        className="text-[11px]"
        style={{ color: "var(--color-v-texto-suave)" }}
      >
        {rotulo}
      </span>
    </span>
  );
}
