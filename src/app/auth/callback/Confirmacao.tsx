"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Conclui a confirmacao de e-mail e joga a pessoa logada no painel.
 *
 * Isto roda no NAVEGADOR de proposito. O Supabase devolve a confirmacao de
 * tres jeitos diferentes, dependendo do modelo de e-mail e das configuracoes
 * do projeto, e um deles o servidor nao consegue ler de jeito nenhum:
 *
 *   1. "?code=..."        — troca por sessao; a chave da troca fica guardada
 *                           neste navegador, entao so ele consegue completar
 *   2. "?token_hash=..."  — confirma direto pelo codigo do e-mail
 *   3. "#access_token=..." — vem depois do "#", e essa parte da URL o
 *                           navegador NUNCA envia ao servidor
 *
 * A primeira versao disto era uma rota de servidor e tratava so os dois
 * primeiros. O terceiro caiu no erro — era esse o link quebrado.
 */
export default function Confirmacao() {
  const router = useRouter();
  const params = useSearchParams();
  const [demorou, setDemorou] = useState(false);

  useEffect(() => {
    // So aceita caminho interno: um endereco completo aqui deixaria alguem
    // usar o nosso link pra jogar visitante em pagina de golpe.
    const pedido = params.get("next") ?? "/painel";
    const destino =
      pedido.startsWith("/") && !pedido.startsWith("//") ? pedido : "/painel";

    const avisar = setTimeout(() => setDemorou(true), 6000);

    (async () => {
      const supabase = createClient();

      try {
        const codigo = params.get("code");
        const tokenHash = params.get("token_hash");
        const tipo = params.get("type");

        if (codigo) {
          const { error } = await supabase.auth.exchangeCodeForSession(codigo);
          if (error) throw error;
        } else if (tokenHash) {
          const { error } = await supabase.auth.verifyOtp({
            type: (tipo ?? "email") as "signup" | "email" | "recovery",
            token_hash: tokenHash,
          });
          if (error) throw error;
        }

        // Nos tres casos a sessao ja deve existir a esta altura: quando os
        // dados vem depois do "#", o proprio Supabase os recolhe sozinho ao
        // criar o cliente nesta pagina.
        const { data } = await supabase.auth.getSession();
        if (!data.session) throw new Error("sem sessao");

        router.replace(destino);
        router.refresh();
      } catch (erro) {
        console.error("Confirmacao de e-mail falhou:", erro);
        router.replace("/entrar?erro=confirmacao");
      } finally {
        clearTimeout(avisar);
      }
    })();

    return () => clearTimeout(avisar);
  }, [params, router]);

  return (
    <div className="mx-auto max-w-md px-4 py-20 text-center">
      <p className="text-3xl">🌿</p>
      <h1 className="mt-3 text-xl font-semibold">Confirmando seu e-mail...</h1>
      <p className="mt-2 text-sm text-tinta/60">
        Só um instante, já te levamos pro painel.
      </p>
      {demorou && (
        <p className="mt-6 text-sm text-tinta/60">
          Está demorando mais que o normal.{" "}
          <a href="/entrar" className="font-semibold text-mata-700 underline">
            Entrar com e-mail e senha
          </a>
        </p>
      )}
    </div>
  );
}
