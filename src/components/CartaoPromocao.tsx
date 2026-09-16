"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { contar } from "@/lib/contar";
import { quandoVale, valendoAgora, type Promocao } from "@/lib/promocoes";

export type PromocaoNaTela = Promocao & {
  local?: { slug: string; nome: string } | null;
};

/**
 * As promoções já contadas nesta visita.
 *
 * Vive fora do componente de propósito: em desenvolvimento o React monta cada
 * componente duas vezes para achar erro, e um controle interno contaria em
 * dobro. Como esses números vão ser mostrados ao comerciante — e usados para
 * vender —, é melhor contar de menos que inflar.
 *
 * Zera sozinho quando a pessoa recarrega a página.
 */
const jaContadas = new Set<string>();

/**
 * Uma promoção como o visitante vê.
 *
 * Conta a visualização ao aparecer — é o número que o comerciante vai olhar
 * para decidir se a promoção está funcionando.
 */
export default function CartaoPromocao({
  promocao,
  mostrarLocal = false,
}: {
  promocao: PromocaoNaTela;
  mostrarLocal?: boolean;
}) {
  const agora = valendoAgora(promocao);

  useEffect(() => {
    if (jaContadas.has(promocao.id)) return;
    jaContadas.add(promocao.id);

    contar("promocao_vista", {
      local: promocao.local_id,
      alvo: promocao.id,
    });
  }, [promocao.id, promocao.local_id]);

  return (
    <article className="flex gap-3 rounded-2xl border border-sol-200 bg-sol-50 p-4">
      {promocao.imagem_url && (
        <div className="relative hidden h-20 w-20 shrink-0 overflow-hidden rounded-xl sm:block">
          <Image
            src={promocao.imagem_url}
            alt=""
            fill
            sizes="80px"
            className="object-cover"
          />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="font-semibold">{promocao.titulo}</h3>
          {agora && (
            <span className="rounded-full bg-mata-600 px-2 py-0.5 text-[11px] font-semibold text-white">
              agora
            </span>
          )}
        </div>

        <p className="mt-0.5 text-sm font-medium text-sol-900">
          {quandoVale(promocao)}
        </p>

        {promocao.descricao && (
          <p className="mt-1 text-sm text-tinta/70">{promocao.descricao}</p>
        )}

        {mostrarLocal && promocao.local && (
          <Link
            href={`/local/${promocao.local.slug}`}
            className="mt-1.5 inline-block text-sm font-semibold text-mata-700 hover:underline"
          >
            {promocao.local.nome} →
          </Link>
        )}
      </div>
    </article>
  );
}
