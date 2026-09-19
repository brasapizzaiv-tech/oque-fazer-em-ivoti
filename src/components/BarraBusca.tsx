"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function BarraBusca({
  inicial = "",
  grande = false,
}: {
  inicial?: string;
  grande?: boolean;
}) {
  const [texto, setTexto] = useState(inicial);
  const router = useRouter();

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const q = texto.trim();
        router.push(q ? `/explorar?q=${encodeURIComponent(q)}` : "/explorar");
      }}
      className="flex w-full items-center gap-2"
      role="search"
    >
      <div className="relative flex-1">
        <span className="absolute top-1/2 left-4 -translate-y-1/2 text-tinta/35">
          🔍
        </span>
        <input
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder="Pizza, trilha, café..."
          aria-label="Buscar no guia"
          className={[
            "w-full border-2 border-carvalho bg-creme pr-4 pl-11 outline-none focus:border-sol-600",
            grande ? "py-4 text-base" : "py-3 text-sm",
          ].join(" ")}
        />
      </div>
      <button
        type="submit"
        className={[
          "shrink-0 border-2 border-carvalho bg-carvalho font-semibold text-creme transition hover:bg-sol-700 hover:border-sol-700",
          grande ? "px-6 py-4" : "px-5 py-3 text-sm",
        ].join(" ")}
      >
        Buscar
      </button>
    </form>
  );
}
