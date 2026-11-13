"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { paraSlug, slugValido } from "@/lib/campanha-link";
import { SITE_LIMPO } from "@/lib/site";

/** Quantos estabelecimentos um vídeo visita: é o número de cotas à venda. */
const COTAS = 4;

/**
 * Cria uma campanha e o link dela.
 *
 * O link nasce do nome, mas pode ser ajustado: é ele que o influenciador
 * vai pôr na bio e no story, então vale ser curto e fácil de ditar.
 */
export default function NovaCampanha({
  locais,
}: {
  locais: { id: string; nome: string }[];
}) {
  const [abrindo, setAbrindo] = useState(false);
  const [nome, setNome] = useState("");
  const [influenciador, setInfluenciador] = useState("");
  const [slug, setSlug] = useState("");
  const [mexeuNoSlug, setMexeuNoSlug] = useState(false);
  const [inicio, setInicio] = useState("");
  const [escolhidos, setEscolhidos] = useState<string[]>([]);
  const [indo, setIndo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  const slugFinal = mexeuNoSlug ? slug : paraSlug(nome);

  function alternar(id: string) {
    setEscolhidos((atual) =>
      atual.includes(id)
        ? atual.filter((x) => x !== id)
        : atual.length < COTAS
          ? [...atual, id]
          : atual,
    );
  }

  async function criar() {
    if (!nome.trim()) return setErro("Dê um nome à campanha.");
    if (!slugValido(slugFinal)) {
      return setErro(
        "O link só pode ter letras minúsculas, números e hífen, sem espaço.",
      );
    }
    setErro(null);
    setIndo(true);

    const { error } = await createClient()
      .from("campanhas")
      .insert({
        nome: nome.trim().slice(0, 80),
        influenciador: influenciador.trim() || null,
        slug: slugFinal,
        inicio: inicio || null,
        locais: escolhidos,
      });

    setIndo(false);

    if (error) {
      setErro(
        error.code === "23505"
          ? "Já existe uma campanha com esse link. Troque o final do link."
          : "Não consegui criar agora. Tente de novo.",
      );
      return;
    }

    setAbrindo(false);
    setNome("");
    setInfluenciador("");
    setSlug("");
    setMexeuNoSlug(false);
    setInicio("");
    setEscolhidos([]);
    router.refresh();
  }

  if (!abrindo) {
    return (
      <button
        type="button"
        onClick={() => setAbrindo(true)}
        className="botao-cheio px-5 py-2.5 text-[14px] transition"
      >
        + Nova campanha
      </button>
    );
  }

  return (
    <div className="w-full caixa-painel p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block">
          <span className="text-sm font-medium">Nome da campanha</span>
          <input
            autoFocus
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Gaúcho Viajante — dezembro"
            className="campo-painel mt-1 w-full px-3.5 py-2.5 text-[15px]"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Influenciador</span>
          <input
            value={influenciador}
            onChange={(e) => setInfluenciador(e.target.value)}
            placeholder="@gauchoviajante"
            className="campo-painel mt-1 w-full px-3.5 py-2.5 text-[15px]"
          />
        </label>
        <label className="block">
          <span className="text-sm font-medium">Final do link</span>
          <input
            value={slugFinal}
            onChange={(e) => {
              setMexeuNoSlug(true);
              setSlug(e.target.value.toLowerCase());
            }}
            placeholder="gaucho-viajante-dezembro"
            className="campo-painel mt-1 w-full px-3.5 py-2.5 text-[15px]"
          />
          <span className="mt-1 block text-xs texto-suave break-all">
            {SITE_LIMPO}/?de={slugFinal || "..."}
          </span>
        </label>
        <label className="block">
          <span className="text-sm font-medium">Data do vídeo (opcional)</span>
          <input
            type="date"
            value={inicio}
            onChange={(e) => setInicio(e.target.value)}
            className="campo-painel mt-1 w-full px-3.5 py-2.5 text-[15px]"
          />
        </label>
      </div>

      <fieldset className="mt-4">
        <legend className="text-sm font-medium">
          Quem comprou cota ({escolhidos.length} de {COTAS})
        </legend>
        <div className="mt-2 flex flex-wrap gap-2">
          {locais.map((l) => {
            const marcado = escolhidos.includes(l.id);
            return (
              <button
                key={l.id}
                type="button"
                onClick={() => alternar(l.id)}
                aria-pressed={marcado}
                disabled={!marcado && escolhidos.length >= COTAS}
                className={`px-3 py-1.5 text-[13px] disabled:opacity-40 ${
                  marcado ? "pilula-ativa" : "pilula"
                }`}
              >
                {l.nome}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs texto-suave">
          Pode deixar em branco e marcar depois que as cotas forem vendidas.
        </p>
      </fieldset>

      {erro && (
        <p className="mt-3 text-sm text-[color:var(--color-v-fechado-claro)]">
          {erro}
        </p>
      )}

      <div className="mt-4 flex gap-2">
        <button
          type="button"
          onClick={criar}
          disabled={indo || !nome.trim()}
          className="botao-cheio px-5 py-2.5 text-[14px] disabled:opacity-40"
        >
          {indo ? "Criando..." : "Criar campanha"}
        </button>
        <button
          type="button"
          onClick={() => setAbrindo(false)}
          className="botao-vazado px-4 py-2.5 text-[14px]"
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}
