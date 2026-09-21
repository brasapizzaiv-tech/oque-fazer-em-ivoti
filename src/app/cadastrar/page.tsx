import type { Metadata } from "next";
import CabecalhoSimples from "@/components/vidro/CabecalhoSimples";
import {
  CasaEnxaimel,
  IconeExplorar,
  IconeGuia,
  IconeRoteiros,
  Petunia,
} from "@/components/enxaimel/icones";
import { FaixaEnxaimel } from "@/components/enxaimel/pecas";
import FormularioCadastro from "./FormularioCadastro";

export const metadata: Metadata = {
  title: "Cadastrar meu estabelecimento",
  description:
    "Coloque seu negócio no guia de Ivoti: é grátis, leva cinco minutos.",
};

const VANTAGENS = [
  {
    Icone: IconeExplorar,
    titulo: "Aparece na busca",
    texto: "Quem procura pizza, café ou trilha em Ivoti encontra você.",
  },
  {
    Icone: IconeRoteiros,
    titulo: "Pino no mapa",
    texto: "Com a rota pronta no Google Maps em um toque.",
  },
  {
    Icone: CasaEnxaimel,
    titulo: "Horários sempre certos",
    texto: "O site mostra sozinho se você está aberto agora.",
  },
  {
    Icone: IconeGuia,
    titulo: "O Guia indica você",
    texto:
      "O assistente do site recomenda o seu lugar para quem pede algo do seu tipo.",
  },
];

export default function Cadastrar() {
  return (
    <>
      <CabecalhoSimples />

      <div className="mx-auto max-w-[1100px] gap-12 px-4 py-10 lg:grid lg:grid-cols-12 lg:px-8 lg:py-14">
        {/* ---------------- o convite ---------------- */}
        <div className="lg:col-span-6">
          <p className="flex items-center gap-2">
            <Petunia tamanho={16} />
            <span
              className="text-[11px] font-bold tracking-[0.12em] uppercase"
              style={{ color: "var(--color-v-petunia)" }}
            >
              Para quem tem um negócio em Ivoti
            </span>
          </p>

          <h1
            className="mt-3 text-[30px] leading-[1.1] font-bold lg:text-[38px]"
            style={{
              color: "var(--color-v-texto)",
              fontFamily: "var(--fonte-titulo-nova)",
            }}
          >
            Coloque o seu negócio no guia de Ivoti
          </h1>

          <p
            className="mt-3 max-w-[46ch] text-[15px]"
            style={{ color: "var(--color-v-texto-suave)" }}
          >
            É de graça. Você cria a conta, preenche o perfil do jeito que
            quiser, e a gente publica.
          </p>

          <ul className="mt-8 space-y-5">
            {VANTAGENS.map(({ Icone, titulo, texto }) => (
              <li key={titulo} className="flex gap-3">
                <span
                  className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-[9px]"
                  style={{
                    backgroundColor: "var(--color-superficie)",
                    border: "2px solid var(--color-v-texto)",
                    color: "var(--color-v-texto)",
                  }}
                >
                  <Icone tamanho={18} />
                </span>
                <div>
                  <p
                    className="text-[15px] font-bold"
                    style={{ color: "var(--color-v-texto)" }}
                  >
                    {titulo}
                  </p>
                  <p
                    className="text-[14px]"
                    style={{ color: "var(--color-v-texto-suave)" }}
                  >
                    {texto}
                  </p>
                </div>
              </li>
            ))}
          </ul>

          <div className="mt-8 lg:hidden">
            <FaixaEnxaimel />
          </div>
        </div>

        {/* ---------------- o formulário ---------------- */}
        <div className="mt-8 lg:col-span-6 lg:mt-0">
          <div
            className="rounded-[4px] p-5 lg:p-7"
            style={{
              backgroundColor: "var(--color-superficie)",
              border: "3px solid var(--color-v-texto)",
              boxShadow: "4px 4px 0 var(--color-v-texto)",
            }}
          >
            <h2
              className="text-[20px] font-bold"
              style={{
                color: "var(--color-v-texto)",
                fontFamily: "var(--fonte-titulo-nova)",
              }}
            >
              Criar a conta
            </h2>
            <FormularioCadastro />
          </div>
        </div>
      </div>
    </>
  );
}
