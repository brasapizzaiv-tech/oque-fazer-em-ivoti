"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { erroEmPortugues } from "@/lib/erros-auth";

type Situacao = "conferindo" | "pode" | "semSessao";

/**
 * Cria a senha nova de quem chegou pelo link do e-mail.
 *
 * Quem abre esta pagina ja passou por /auth/callback e chegou com sessao — e
 * a sessao que autoriza a troca, nao um codigo no endereco. Sem ela a pessoa
 * caiu aqui por engano, ou o link venceu, e o certo e mandar pedir outro em
 * vez de mostrar um formulario que vai falhar no fim.
 */
export default function FormularioNovaSenha() {
  const [situacao, setSituacao] = useState<Situacao>("conferindo");
  const [senha, setSenha] = useState("");
  const [repetida, setRepetida] = useState("");
  const [indo, setIndo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    let vivo = true;
    (async () => {
      const { data } = await createClient().auth.getSession();
      if (!vivo) return;
      setSituacao(data.session ? "pode" : "semSessao");
    })();
    return () => {
      vivo = false;
    };
  }, []);

  async function salvar(evento: React.FormEvent) {
    evento.preventDefault();
    setErro(null);

    if (senha.length < 8) {
      setErro("A senha precisa ter pelo menos 8 caracteres.");
      return;
    }
    if (senha !== repetida) {
      setErro("As duas senhas não são iguais. Confira e tente de novo.");
      return;
    }

    setIndo(true);
    try {
      const { error } = await createClient().auth.updateUser({
        password: senha,
      });
      if (error) {
        setErro(erroEmPortugues(error.message));
        setIndo(false);
        return;
      }
      setPronto(true);
    } catch (falha) {
      console.error("Nao consegui trocar a senha:", falha);
      setErro(
        falha instanceof Error
          ? erroEmPortugues(falha.message)
          : "Não consegui concluir agora. Tente de novo em instantes.",
      );
    } finally {
      setIndo(false);
    }
  }

  if (situacao === "conferindo") {
    return <p className="mt-6 text-sm texto-suave">Conferindo o link...</p>;
  }

  if (situacao === "semSessao") {
    return (
      <div className="mt-6 vidro px-4 py-3 text-[14px] text-[color:var(--color-v-fechado-claro)]">
        <p className="font-semibold">Este link não vale mais</p>
        <p className="mt-1">
          Ele pode ter vencido, já ter sido usado, ou ter sido aberto em outro
          navegador. Peça um novo que mandamos na hora.
        </p>
        <Link
          href="/recuperar-senha"
          className="mt-3 inline-block font-semibold underline"
        >
          Pedir outro link
        </Link>
      </div>
    );
  }

  if (pronto) {
    return (
      <div className="mt-6 vidro p-4 text-[14px]">
        <p className="font-semibold">Senha trocada 🎉</p>
        <p className="mt-1 texto-suave">
          Você já está com a conta aberta. Pode ir direto para o painel.
        </p>
        <Link
          href="/painel"
          className="mt-4 inline-flex h-12 items-center rounded-[11px] bg-[color:var(--color-v-torii)] px-6 text-[14px] font-bold text-[#FFFFFF]"
        >
          Ir para o painel
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={salvar} className="mt-6 space-y-4">
      <label className="block">
        <span className="text-sm font-medium">Nova senha</span>
        <input
          type="password"
          required
          autoFocus
          autoComplete="new-password"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
          className="vidro mt-1 h-12 w-full px-4 text-[14px] outline-none focus:border-[color:var(--color-v-torii)]"
          style={{ borderRadius: 12, color: "var(--color-v-texto)" }}
        />
        <span className="mt-1 block text-xs texto-suave">
          Pelo menos 8 caracteres.
        </span>
      </label>

      <label className="block">
        <span className="text-sm font-medium">Repita a nova senha</span>
        <input
          type="password"
          required
          autoComplete="new-password"
          value={repetida}
          onChange={(e) => setRepetida(e.target.value)}
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
        {indo ? "Salvando..." : "Salvar a nova senha"}
      </button>
    </form>
  );
}
