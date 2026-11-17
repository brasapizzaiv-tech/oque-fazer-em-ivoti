"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { erroEmPortugues } from "@/lib/erros-auth";

/**
 * Pede outro e-mail de confirmação de cadastro.
 *
 * O link do e-mail tem prazo. Quem se cadastrava à noite e abria a caixa
 * de entrada no dia seguinte caía no login lendo "a conta já está
 * valendo", tentava entrar e lia "falta confirmar seu e-mail" — e o único
 * e-mail que tinha era o vencido. Não havia como pedir outro: a conta
 * ficava presa, e cadastrar de novo respondia "esse e-mail já tem conta".
 */
export default function ReenviarConfirmacao({ email }: { email: string }) {
  const [estado, setEstado] = useState<"parado" | "indo" | "foi">("parado");
  const [erro, setErro] = useState<string | null>(null);

  async function reenviar() {
    setErro(null);
    setEstado("indo");
    try {
      const { error } = await createClient().auth.resend({
        type: "signup",
        email: email.trim(),
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback?next=/painel/novo`,
        },
      });
      if (error) {
        setErro(erroEmPortugues(error.message));
        setEstado("parado");
        return;
      }
      setEstado("foi");
    } catch (falha) {
      console.error("Nao consegui reenviar a confirmacao:", falha);
      setErro(
        falha instanceof Error
          ? erroEmPortugues(falha.message)
          : "Não consegui concluir agora. Tente de novo em instantes.",
      );
      setEstado("parado");
    }
  }

  if (estado === "foi") {
    return (
      <p className="text-[13px] font-semibold" role="status">
        Mandamos outro e-mail para {email.trim()}. Abra o mais recente: o
        link antigo deixou de valer.
      </p>
    );
  }

  return (
    <div>
      <button
        type="button"
        onClick={reenviar}
        disabled={estado === "indo" || !email.trim()}
        className="flex min-h-11 items-center text-left text-[14px] font-semibold text-[color:var(--color-v-torii)] underline disabled:opacity-50"
      >
        {estado === "indo"
          ? "Mandando..."
          : "Mandar o e-mail de confirmação de novo"}
      </button>
      {erro && (
        <p className="mt-1 text-[13px] text-[color:var(--color-v-fechado-claro)]">
          {erro}
        </p>
      )}
    </div>
  );
}
