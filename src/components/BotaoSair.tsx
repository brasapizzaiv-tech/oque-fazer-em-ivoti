"use client";

import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Sai da conta e volta para a capa.
 *
 * Vazado, nunca cheio: sair é o botão que ninguém quer apertar por engano, e
 * um retângulo colorido ao lado do nome atrai o dedo sozinho.
 */
export default function BotaoSair({
  /** Sobre a barra escura do painel, a borda e o texto viram creme. */
  claro = false,
}: {
  claro?: boolean;
}) {
  const router = useRouter();

  return (
    <button
      type="button"
      onClick={async () => {
        await createClient().auth.signOut();
        router.push("/");
        router.refresh();
      }}
      className="rounded-[9px] px-3.5 py-2 text-[13px] font-semibold transition"
      style={
        claro
          ? {
              border: "2px solid rgba(255,255,255,0.85)",
              color: "#FFFFFF",
            }
          : {
              border: "1px solid rgba(255, 255, 255, 0.8)",
              color: "var(--color-v-texto)",
            }
      }
    >
      Sair
    </button>
  );
}
