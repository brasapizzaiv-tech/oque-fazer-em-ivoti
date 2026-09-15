"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function FormularioEntrar() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [indo, setIndo] = useState(false);

  const router = useRouter();
  const params = useSearchParams();
  const voltar = params.get("voltar") ?? "/painel";

  // Quem chega de um link de confirmacao que nao valeu (ja usado, vencido, ou
  // aberto em outro navegador) cai aqui com um aviso em portugues, em vez da
  // tela de erro crua do Supabase.
  const avisoConfirmacao =
    params.get("erro") === "confirmacao"
      ? "Esse link de confirmação não vale mais — pode ter vencido, já ter sido usado, ou ter sido aberto em outro navegador. Entre com seu e-mail e senha aqui embaixo."
      : null;

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setIndo(true);

    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });

    if (error) {
      setErro(
        error.message.includes("Invalid login")
          ? "E-mail ou senha não conferem."
          : error.message.includes("Email not confirmed")
            ? "Confirme seu e-mail antes de entrar — veja a caixa de entrada."
            : error.message,
      );
      setIndo(false);
      return;
    }

    router.push(voltar);
    router.refresh();
  }

  return (
    <form onSubmit={entrar} className="mt-6 space-y-4">
      {avisoConfirmacao && (
        <p className="rounded-lg bg-sol-50 px-3 py-2 text-sm text-sol-900">
          {avisoConfirmacao}
        </p>
      )}

      <Campo
        rotulo="E-mail"
        tipo="email"
        valor={email}
        onChange={setEmail}
        autoComplete="email"
      />
      <Campo
        rotulo="Senha"
        tipo="password"
        valor={senha}
        onChange={setSenha}
        autoComplete="current-password"
      />

      {erro && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={indo}
        className="w-full rounded-full bg-mata-600 py-3 font-semibold text-white transition hover:bg-mata-700 disabled:opacity-50"
      >
        {indo ? "Entrando..." : "Entrar"}
      </button>

      <p className="text-center text-sm text-tinta/60">
        Ainda não tem conta?{" "}
        <Link href="/cadastrar" className="font-semibold text-mata-700 underline">
          Cadastre seu estabelecimento
        </Link>
      </p>
    </form>
  );
}

function Campo({
  rotulo,
  tipo,
  valor,
  onChange,
  autoComplete,
}: {
  rotulo: string;
  tipo: string;
  valor: string;
  onChange: (v: string) => void;
  autoComplete?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{rotulo}</span>
      <input
        type={tipo}
        required
        value={valor}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-mata-200 bg-white px-4 py-3 outline-none focus:border-mata-500 focus:ring-2 focus:ring-mata-100"
      />
    </label>
  );
}
