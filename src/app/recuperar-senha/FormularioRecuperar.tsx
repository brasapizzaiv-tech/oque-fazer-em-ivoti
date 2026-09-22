"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { erroEmPortugues } from "@/lib/erros-auth";

/**
 * Pede o e-mail e manda o link para criar uma senha nova.
 *
 * O link do e-mail cai em /auth/callback, que ja sabe transformar os tres
 * formatos de retorno do Supabase em sessao, e de la a pessoa segue para
 * /nova-senha.
 *
 * A resposta e sempre a mesma, tenha a conta ou nao. Dizer "esse e-mail nao
 * existe" entregaria a quem tentasse adivinhar quais e-mails tem cadastro no
 * guia — e nao ajudaria quem so errou uma letra, porque a pessoa vai conferir
 * a caixa de entrada de qualquer jeito.
 */
export default function FormularioRecuperar() {
  const [email, setEmail] = useState("");
  const [indo, setIndo] = useState(false);
  const [enviado, setEnviado] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  async function enviar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setIndo(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.resetPasswordForEmail(
        email.trim(),
        {
          redirectTo: `${window.location.origin}/auth/callback?next=/nova-senha`,
        },
      );

      // Erro de limite de envio precisa aparecer: sem isso a pessoa fica
      // esperando um e-mail que nunca vai chegar.
      if (error) {
        setErro(erroEmPortugues(error.message));
        setIndo(false);
        return;
      }

      setEnviado(true);
    } catch (falha) {
      console.error("Nao consegui pedir a troca de senha:", falha);
      setErro(
        falha instanceof Error
          ? erroEmPortugues(falha.message)
          : "Não consegui concluir agora. Tente de novo em instantes.",
      );
    } finally {
      setIndo(false);
    }
  }

  if (enviado) {
    return (
      <div className="mt-6 vidro p-4 text-[14px]">
        <p className="font-semibold">Confira seu e-mail 📬</p>
        <p className="mt-1 texto-suave">
          Se houver uma conta com <strong>{email.trim()}</strong>, o link para
          criar uma senha nova chega em instantes. Ele vale por uma hora.
        </p>
        <p className="mt-2 texto-suave">
          Não chegou? Veja o lixo eletrônico antes de pedir de novo.
        </p>
        <Link
          href="/entrar"
          className="mt-4 inline-block font-semibold text-[color:var(--color-v-torii)] underline"
        >
          Voltar para a entrada
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={enviar} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-medium">E-mail da conta</span>
        <input
          type="email"
          required
          autoFocus
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="vidro mt-1 h-12 w-full px-4 text-[14px] outline-none focus:border-[color:var(--color-v-torii)]"
          style={{ borderRadius: 12, color: "var(--color-v-texto)" }}
        />
      </label>

      {erro && (
        <p className="vidro px-3 py-2 text-[13px] text-[color:var(--color-v-fechado-claro)]">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={indo}
        className="h-12 w-full rounded-[11px] bg-[color:var(--color-v-torii)] text-[14px] font-bold text-[#FFFFFF] transition disabled:opacity-50"
      >
        {indo ? "Enviando..." : "Enviar o link"}
      </button>

      <p className="text-center text-sm texto-suave">
        Lembrou a senha?{" "}
        <Link
          href="/entrar"
          className="font-semibold text-[color:var(--color-v-torii)] underline"
        >
          Entrar
        </Link>
      </p>
    </form>
  );
}
