"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * Qual estabelecimento a tela esta mostrando.
 *
 * Muda de forma conforme a quantidade, porque as duas situacoes sao bem
 * diferentes: o comerciante tem um ou dois locais e quer trocar num toque,
 * enquanto a administracao tem a cidade inteira e precisa procurar pelo nome.
 *
 * A versao antiga era uma fileira que rolava para o lado com a barra
 * escondida: no celular funcionava, mas no computador nao havia como rolar —
 * os nomes do fim ficavam cortados na borda, sem nenhuma pista de que
 * existiam.
 */
const LIMITE_DE_ETIQUETAS = 5;

export default function EscolherLocal({
  locais,
  escolhido,
  dias,
  base = "/painel/metricas",
}: {
  locais: { id: string; nome: string }[];
  escolhido: string;
  /** Sem isto, a tela nao tem periodo e o endereco sai so com o local. */
  dias?: number;
  /** A tela que recebe a escolha. Metricas e assistente usam o mesmo seletor. */
  base?: string;
}) {
  const router = useRouter();

  if (locais.length <= 1) return null;

  const enderecoDe = (id: string) =>
    dias ? `${base}?local=${id}&dias=${dias}` : `${base}?local=${id}`;

  if (locais.length <= LIMITE_DE_ETIQUETAS) {
    return (
      <div className="mt-4 flex flex-wrap gap-2">
        {locais.map((l) => (
          <Link
            key={l.id}
            href={enderecoDe(l.id)}
            className={`rounded-full px-3 py-1.5 text-sm transition ${
              l.id === escolhido
                ? "bg-mata-800 font-semibold text-white"
                : "border border-mata-200 bg-white hover:bg-mata-50"
            }`}
          >
            {l.nome}
          </Link>
        ))}
      </div>
    );
  }

  return (
    <label className="mt-4 block sm:max-w-sm">
      <span className="text-sm font-medium">Estabelecimento</span>
      <select
        value={escolhido}
        onChange={(e) => router.push(enderecoDe(e.target.value))}
        className="mt-1 w-full rounded-xl border border-mata-200 bg-white px-4 py-2.5 outline-none focus:border-mata-500 focus:ring-2 focus:ring-mata-100"
      >
        {locais.map((l) => (
          <option key={l.id} value={l.id}>
            {l.nome}
          </option>
        ))}
      </select>
      <span className="mt-1 block text-xs text-tinta/45">
        {locais.length} locais no guia
      </span>
    </label>
  );
}
