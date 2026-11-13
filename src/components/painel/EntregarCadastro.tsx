"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { SITE_LIMPO } from "@/lib/site";

/**
 * Passa o cadastro para a conta do comerciante.
 *
 * Só a administração vê. É o último passo da implantação: você montou o
 * lugar, e agora ele precisa morar na conta de quem vai cuidar dele — sem
 * isso o dono nunca conseguiria trocar uma foto ou publicar uma promoção.
 *
 * Pede o e-mail em vez de mostrar uma lista de contas: a lista exporia o
 * e-mail de todo mundo que se cadastrou só para escolher um.
 */
export default function EntregarCadastro({
  local,
  nome,
}: {
  local: string;
  nome: string;
}) {
  const [email, setEmail] = useState("");
  const [indo, setIndo] = useState(false);
  const [recado, setRecado] = useState<{ ok: boolean; texto: string } | null>(
    null,
  );
  const router = useRouter();

  async function entregar() {
    const destino = email.trim();
    if (!destino) return;
    setIndo(true);
    setRecado(null);

    const { data, error } = await createClient().rpc("entregar_local", {
      p_local: local,
      p_email: destino,
    });

    setIndo(false);

    if (error) {
      setRecado({
        ok: false,
        texto: "Não consegui entregar agora. Tente de novo.",
      });
      return;
    }

    if (data === "sem_conta") {
      setRecado({
        ok: false,
        texto: `Ninguém criou conta com esse e-mail ainda. Peça para a pessoa se cadastrar em ${SITE_LIMPO}/cadastrar e tente de novo.`,
      });
      return;
    }

    if (data !== "ok") {
      setRecado({ ok: false, texto: "Não encontrei este cadastro." });
      return;
    }

    setRecado({
      ok: true,
      texto: `${nome} agora está na conta de ${destino}. Ele aparece no painel dessa pessoa.`,
    });
    setEmail("");
    router.refresh();
  }

  return (
    <section className="mt-8 aviso-painel p-4">
      <p className="text-[15px] font-bold">Entregar este cadastro</p>
      <p className="mt-1 text-[14px] texto-suave">
        Passa {nome} para a conta do comerciante. Ele precisa ter criado a conta
        no site antes; você continua podendo editar como administração.
      </p>

      <div className="mt-3 flex flex-wrap gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") entregar();
          }}
          placeholder="e-mail da conta do comerciante"
          className="campo-painel min-w-56 flex-1 px-3.5 py-2.5 text-[15px]"
        />
        <button
          type="button"
          onClick={entregar}
          disabled={indo || !email.trim()}
          className="botao-cheio px-5 py-2.5 text-[14px] disabled:opacity-40"
        >
          {indo ? "Entregando..." : "Entregar"}
        </button>
      </div>

      {recado && (
        <p
          className="mt-3 text-[14px]"
          style={{
            color: recado.ok
              ? "var(--color-v-texto)"
              : "var(--color-v-fechado-claro)",
          }}
        >
          {recado.texto}
        </p>
      )}
    </section>
  );
}
