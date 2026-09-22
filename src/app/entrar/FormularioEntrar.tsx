"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { erroEmPortugues } from "@/lib/erros-auth";

export default function FormularioEntrar() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [indo, setIndo] = useState(false);
  const relogio = useRef<ReturnType<typeof setTimeout> | null>(null);

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

  useEffect(
    () => () => {
      if (relogio.current) clearTimeout(relogio.current);
    },
    [],
  );

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setIndo(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error) {
        setErro(erroEmPortugues(error.message));
        setIndo(false);
        return;
      }

      // O endereco de volta chega pela URL, entao so aceitamos caminhos deste
      // site: sem isso, um link preparado poderia mandar quem acabou de
      // entrar para fora, achando que ainda esta no guia.
      const destino =
        voltar.startsWith("/") && !voltar.startsWith("//") ? voltar : "/painel";

      router.push(destino);
      router.refresh();

      // O painel e montado no servidor. Se ele demorar demais para responder,
      // esta tela ficaria em "Entrando..." sem fim e sem explicacao — entao
      // depois de alguns segundos devolvemos o botao e contamos o que houve.
      relogio.current = setTimeout(() => {
        setErro(
          "O painel está demorando para abrir. Sua entrada deu certo: tente de novo ou recarregue a página.",
        );
        setIndo(false);
      }, 10000);
    } catch (falha) {
      // Sem isto a tela travava de vez: a excecao subia sem ninguem pegar, o
      // botao continuava em "Entrando..." e nenhum recado aparecia.
      console.error("Nao consegui entrar:", falha);
      setErro(
        falha instanceof Error
          ? erroEmPortugues(falha.message)
          : "Nao consegui concluir agora. Tente de novo em instantes.",
      );
      setIndo(false);
    }
  }

  return (
    <form onSubmit={entrar} className="mt-6 space-y-4">
      {avisoConfirmacao && (
        <p className="vidro px-3 py-2 text-[13px] text-[color:var(--color-v-fechado-claro)]">
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
        <p className="vidro px-3 py-2 text-[13px] text-[color:var(--color-v-fechado-claro)]">
          {erro}
        </p>
      )}

      <button
        type="submit"
        disabled={indo}
        className="h-12 w-full rounded-[11px] bg-[color:var(--color-v-torii)] text-[14px] font-bold text-[#FFFFFF] transition disabled:opacity-50"
      >
        {indo ? "Entrando..." : "Entrar"}
      </button>

      <p className="text-center text-sm">
        <Link
          href="/recuperar-senha"
          className="font-medium texto-suave underline hover:text-[color:var(--color-v-torii)]"
        >
          Esqueci minha senha
        </Link>
      </p>

      <p className="text-center text-sm texto-suave">
        Ainda não tem conta?{" "}
        <Link
          href="/cadastrar"
          className="font-semibold text-[color:var(--color-v-torii)] underline"
        >
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
        className="vidro mt-1 h-12 w-full px-4 text-[14px] outline-none focus:border-[color:var(--color-v-torii)]"
        style={{ borderRadius: 12, color: "var(--color-v-texto)" }}
      />
    </label>
  );
}
