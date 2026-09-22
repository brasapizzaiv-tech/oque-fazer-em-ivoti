"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

/**
 * Ordena a lista pela distância até quem está olhando.
 *
 * A posição vai para o endereço e a ordenação acontece no servidor, junto com
 * o resto da busca. É mais simples do que reordenar a lista no navegador, e
 * tem uma vantagem: o resultado cabe num link — a pessoa pode mandar para
 * alguém, ou voltar depois, e vê a mesma coisa.
 *
 * Arredondado a quatro casas de propósito, o que dá uns onze metros. Serve de
 * sobra para ordenar uma lista de cidade pequena e evita gravar no histórico
 * do navegador a localização exata de alguém.
 */
export default function PertoDeMim({ ativo }: { ativo: boolean }) {
  const router = useRouter();
  const params = useSearchParams();
  const [indo, setIndo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  function pedir() {
    if (ativo) {
      const busca = new URLSearchParams(params.toString());
      busca.delete("perto");
      router.push(`/explorar?${busca.toString()}`);
      return;
    }

    if (!navigator.geolocation) {
      setErro("Este aparelho não sabe informar a sua posição.");
      return;
    }

    setIndo(true);
    setErro(null);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        const busca = new URLSearchParams(params.toString());
        busca.set(
          "perto",
          `${coords.latitude.toFixed(4)},${coords.longitude.toFixed(4)}`,
        );
        router.push(`/explorar?${busca.toString()}`);
        setIndo(false);
      },
      () => {
        setIndo(false);
        setErro(
          "Não consegui a sua posição. Autorize o acesso à localização e tente de novo.",
        );
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }

  return (
    <span className="flex flex-col items-end gap-1">
      <button
        type="button"
        onClick={pedir}
        disabled={indo}
        className="inline-flex h-11 items-center gap-1.5 rounded-full px-4 text-[13px] font-semibold disabled:opacity-60"
        style={
          ativo
            ? {
                backgroundColor: "var(--color-v-torii)",
                color: "#FFFFFF",
              }
            : {
                backgroundColor: "rgba(255,255,255,0.6)",
                border: "1px solid rgba(255,255,255,0.85)",
                color: "var(--color-v-texto)",
              }
        }
      >
        {indo ? "Procurando..." : ativo ? "Perto de mim ✕" : "Perto de mim"}
      </button>
      {erro && (
        <span
          className="max-w-[220px] text-right text-[11px]"
          style={{ color: "var(--color-v-fechado-claro)" }}
        >
          {erro}
        </span>
      )}
    </span>
  );
}
