"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { erroEmPortugues } from "@/lib/erros-auth";
import { caminhoInterno, irParaRecarregando } from "@/lib/ir-para";
import ReenviarConfirmacao from "@/components/ReenviarConfirmacao";

export default function FormularioEntrar() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [indo, setIndo] = useState(false);
  // O login respondeu "e-mail não confirmado": além do recado, a tela
  // oferece mandar outro e-mail (ver ReenviarConfirmacao).
  const [faltaConfirmar, setFaltaConfirmar] = useState(false);

  const params = useSearchParams();
  const voltar = params.get("voltar") ?? "/painel";

  // Quem chega de um link de confirmacao que nao valeu (ja usado, vencido, ou
  // aberto em outro navegador) cai aqui com um aviso em portugues, em vez da
  // tela de erro crua do Supabase.
  const erroDoLink = params.get("erro");
  const avisoConfirmacao =
    erroDoLink === "confirmacao"
      ? // Na maior parte das vezes em que alguém cai aqui o e-mail JÁ foi
        // confirmado; o que não deu foi abrir a conta sozinho pelo link. O
        // aviso antigo dizia que o link "não vale mais", e a pessoa
        // achava que o cadastro tinha falhado. Quando o link venceu de
        // fato, o login avisa e oferece mandar outro e-mail.
        "Não deu para abrir sua conta direto pelo link. Tente entrar com seu e-mail e senha aqui embaixo: se o e-mail ainda não estiver confirmado, a gente manda outro link."
      : erroDoLink === "senha"
        ? "Esse link de troca de senha não vale mais. Toque em “Esqueci minha senha” para receber outro."
        : null;

  async function entrar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);
    setFaltaConfirmar(false);
    setIndo(true);

    try {
      const supabase = createClient();
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: senha,
      });

      if (error) {
        setFaltaConfirmar(/email not confirmed/i.test(error.message));
        setErro(erroEmPortugues(error.message));
        setIndo(false);
        return;
      }

      // O endereco de volta chega pela URL, entao so aceitamos caminhos deste
      // site: sem isso, um link preparado poderia mandar quem acabou de
      // entrar para fora, achando que ainda esta no guia.
      const destino = caminhoInterno(voltar);

      // Recarrega em vez de navegar por dentro: ver ir-para.ts. O botao
      // fica em "Entrando..." ate a tela nova chegar, de proposito.
      irParaRecarregando(destino);
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

      {faltaConfirmar && <ReenviarConfirmacao email={email} />}

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
