import type { Metadata } from "next";
import FormularioCadastro from "./FormularioCadastro";

export const metadata: Metadata = {
  title: "Cadastrar meu estabelecimento",
  description:
    "Coloque seu negócio no guia de Ivoti: é grátis, leva cinco minutos.",
};

const VANTAGENS = [
  ["🔎", "Aparece na busca", "Quem procura pizza, café ou trilha em Ivoti te encontra."],
  ["🗺️", "Pino no mapa", "Com rota pronta no Google Maps num toque."],
  ["🕐", "Horários sempre certos", "O site mostra sozinho se você está aberto agora."],
  ["💬", "O guia te indica", "O chat do site recomenda seu lugar pra quem pede algo do seu tipo."],
];

export default function Cadastrar() {
  return (
    <div className="mx-auto grid max-w-5xl gap-10 px-4 py-12 lg:grid-cols-2">
      <div>
        <h1 className="text-3xl font-bold">
          Coloque seu negócio no guia de Ivoti
        </h1>
        <p className="mt-2 text-tinta/65">
          É grátis. Você cria a conta, preenche o perfil do jeito que quiser e
          a gente publica.
        </p>

        <ul className="mt-8 space-y-4">
          {VANTAGENS.map(([emoji, titulo, texto]) => (
            <li key={titulo} className="flex gap-3">
              <span className="text-xl">{emoji}</span>
              <div>
                <p className="font-semibold">{titulo}</p>
                <p className="text-sm text-tinta/60">{texto}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>

      <div className="rounded-2xl border border-mata-100 bg-white p-6">
        <h2 className="text-lg font-semibold">Criar conta</h2>
        <FormularioCadastro />
      </div>
    </div>
  );
}
