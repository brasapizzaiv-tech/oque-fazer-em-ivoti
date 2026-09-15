"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { erroEmPortugues } from "@/lib/erros-auth";

export default function FormularioCadastro() {
  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState(false);
  const [indo, setIndo] = useState(false);
  const router = useRouter();

  async function cadastrar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (senha.length < 8) {
      setErro("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }

    setIndo(true);
    const supabase = createClient();
    const { data, error } = await supabase.auth.signUp({
      email: email.trim(),
      password: senha,
      options: {
        data: { nome: nome.trim(), telefone: telefone.trim() },
        // Para onde o link do e-mail de confirmacao volta. Sem isto o Supabase
        // usa o endereco configurado no painel dele, que nasce apontando para
        // localhost — e o link chega quebrado na caixa de entrada de quem se
        // cadastrou. Usa a origem da propria janela, entao funciona igual no
        // site publicado e aqui no computador.
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/painel/novo`,
      },
    });

    if (error) {
      setErro(erroEmPortugues(error.message));
      setIndo(false);
      return;
    }

    // Sem sessão = o Supabase está exigindo confirmação por e-mail.
    if (!data.session) {
      setConfirmar(true);
      setIndo(false);
      return;
    }

    router.push("/painel/novo");
    router.refresh();
  }

  if (confirmar) {
    return (
      <div className="mt-4 rounded-xl bg-mata-50 p-4 text-sm">
        <p className="font-semibold">Confira seu e-mail 📬</p>
        <p className="mt-1 text-tinta/70">
          Mandamos um link de confirmação para <strong>{email}</strong>. Clique
          nele e depois volte aqui pra entrar.
        </p>
        <Link
          href="/entrar"
          className="mt-3 inline-block font-semibold text-mata-700 underline"
        >
          Ir para o login
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={cadastrar} className="mt-4 space-y-4">
      <Campo rotulo="Seu nome" valor={nome} onChange={setNome} />
      <Campo
        rotulo="Telefone / WhatsApp"
        tipo="tel"
        valor={telefone}
        onChange={setTelefone}
        obrigatorio={false}
      />
      <Campo
        rotulo="E-mail"
        tipo="email"
        valor={email}
        onChange={setEmail}
        autoComplete="email"
      />
      <Campo
        rotulo="Senha (mínimo 8 caracteres)"
        tipo="password"
        valor={senha}
        onChange={setSenha}
        autoComplete="new-password"
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
        {indo ? "Criando..." : "Criar conta e cadastrar meu local"}
      </button>

      <p className="text-center text-sm text-tinta/60">
        Já tem conta?{" "}
        <Link href="/entrar" className="font-semibold text-mata-700 underline">
          Entrar
        </Link>
      </p>
    </form>
  );
}

function Campo({
  rotulo,
  tipo = "text",
  valor,
  onChange,
  autoComplete,
  obrigatorio = true,
}: {
  rotulo: string;
  tipo?: string;
  valor: string;
  onChange: (v: string) => void;
  autoComplete?: string;
  obrigatorio?: boolean;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{rotulo}</span>
      <input
        type={tipo}
        required={obrigatorio}
        value={valor}
        autoComplete={autoComplete}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full rounded-xl border border-mata-200 bg-white px-4 py-3 outline-none focus:border-mata-500 focus:ring-2 focus:ring-mata-100"
      />
    </label>
  );
}
