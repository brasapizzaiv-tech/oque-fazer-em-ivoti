"use client";

import { useEffect, useState } from "react";
import { situacao } from "@/lib/horarios";
import type { Horario } from "@/lib/tipos";

/**
 * "Aberto até às 23h" / "Abre às 18h".
 *
 * Roda no navegador de proposito: a pagina pode ficar guardada em cache por
 * alguns minutos, e o selo precisa dizer a verdade na hora em que a pessoa
 * esta olhando. Ate montar, nao mostra nada (evita piscar informacao errada).
 */
export default function SeloAberto({
  horarios,
  tamanho = "normal",
}: {
  horarios: Horario[];
  tamanho?: "normal" | "pequeno";
}) {
  const [estado, setEstado] = useState<ReturnType<typeof situacao> | null>(
    null,
  );

  useEffect(() => {
    const calcular = () => setEstado(situacao(horarios));
    calcular();
    const t = setInterval(calcular, 60_000);
    return () => clearInterval(t);
  }, [horarios]);

  if (!estado) return null;

  const pequeno = tamanho === "pequeno";

  return (
    <span
      className={[
        "inline-flex items-center gap-1.5 rounded-full font-semibold",
        pequeno ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs",
        estado.aberto
          ? "bg-mata-100 text-mata-800"
          : "bg-tinta/5 text-tinta/60",
      ].join(" ")}
    >
      <span
        className={[
          "h-1.5 w-1.5 rounded-full",
          estado.aberto ? "bg-mata-500" : "bg-tinta/30",
        ].join(" ")}
      />
      {estado.texto}
    </span>
  );
}
