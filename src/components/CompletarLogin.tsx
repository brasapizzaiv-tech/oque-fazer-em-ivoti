"use client";

import { useEffect } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

/**
 * Rede de seguranca para o link de confirmacao de e-mail.
 *
 * O certo e o link cair em /auth/callback, que sabe o que fazer. Mas o
 * Supabase nem sempre obedece o endereco de volta que o site pede: se ele nao
 * estiver na lista de enderecos permitidos do projeto, ele joga a pessoa na
 * pagina inicial com o codigo pendurado na URL — e ela ficaria deslogada,
 * olhando para a home, achando que o cadastro nao funcionou.
 *
 * Este componente fica montado em todas as paginas e, se encontrar um codigo
 * de confirmacao em qualquer uma delas, completa o login ali mesmo e leva a
 * pessoa para o painel. Nao faz nada nas outras 99,9% das visitas.
 */
export default function CompletarLogin() {
  const router = useRouter();
  const params = useSearchParams();
  const caminho = usePathname();

  useEffect(() => {
    // Em /auth/callback quem cuida disso e a propria pagina.
    if (caminho.startsWith("/auth/")) return;

    const codigo = params.get("code");
    if (!codigo) return;

    (async () => {
      const supabase = createClient();
      const { error } = await supabase.auth.exchangeCodeForSession(codigo);

      if (error) {
        console.error("Nao consegui completar a confirmacao:", error.message);
        // Tira o codigo da URL pra nao ficar um endereco estranho na barra.
        router.replace(caminho);
        return;
      }

      router.replace("/painel/novo");
      router.refresh();
    })();
  }, [params, caminho, router]);

  return null;
}
