"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AreaTexto, Bloco, BotaoSalvar, Texto } from "./Campos";
import { DIAS_CURTOS } from "@/lib/horarios";
import { quandoVale, type Promocao } from "@/lib/promocoes";
import type { LocalDoDono } from "./FormularioEvento";

const TAMANHO_MAXIMO = 8 * 1024 * 1024; // 8 MB

/** Cadastro e edição de promoção fixa. Sem "promocao" = criando uma nova. */
export default function FormularioPromocao({
  promocao,
  locais,
}: {
  promocao?: Promocao;
  locais: LocalDoDono[];
}) {
  const [localId, setLocalId] = useState(
    promocao?.local_id ?? locais[0]?.id ?? "",
  );
  const [titulo, setTitulo] = useState(promocao?.titulo ?? "");
  const [descricao, setDescricao] = useState(promocao?.descricao ?? "");
  const [dias, setDias] = useState<number[]>(promocao?.dias_semana ?? []);
  const [inicio, setInicio] = useState(corta(promocao?.hora_inicio));
  const [fim, setFim] = useState(corta(promocao?.hora_fim));
  const [valeAte, setValeAte] = useState(promocao?.vale_ate ?? "");
  const [imagem, setImagem] = useState(promocao?.imagem_url ?? "");
  const [ativa, setAtiva] = useState(promocao?.ativa ?? true);

  const [salvando, setSalvando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

  function alternarDia(d: number) {
    setDias((atual) =>
      atual.includes(d) ? atual.filter((x) => x !== d) : [...atual, d].sort(),
    );
  }

  async function enviarImagem(arquivos: FileList | null) {
    const arquivo = arquivos?.[0];
    if (!arquivo) return;
    if (arquivo.size > TAMANHO_MAXIMO) {
      setErro("A imagem passa de 8 MB. Diminua e tente de novo.");
      return;
    }

    setErro(null);
    setSalvando(true);

    const supabase = createClient();
    const extensao = arquivo.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const caminho = `promocoes/${crypto.randomUUID()}.${extensao}`;

    const { error } = await supabase.storage
      .from("locais")
      .upload(caminho, arquivo, { cacheControl: "3600", upsert: false });

    if (error) {
      setErro(error.message);
      setSalvando(false);
      return;
    }

    const {
      data: { publicUrl },
    } = supabase.storage.from("locais").getPublicUrl(caminho);
    setImagem(publicUrl);
    setSalvando(false);
  }

  async function salvar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);

    if (!titulo.trim()) return setErro("Falta o nome da promoção.");
    if (!localId) return setErro("Escolha o estabelecimento.");
    if (inicio && fim && inicio === fim) {
      return setErro("O horário de início e o de fim estão iguais.");
    }

    setSalvando(true);
    const supabase = createClient();

    const campos = {
      local_id: localId,
      titulo: titulo.trim(),
      descricao: descricao.trim() || null,
      dias_semana: dias,
      hora_inicio: inicio || null,
      hora_fim: fim || null,
      vale_ate: valeAte || null,
      imagem_url: imagem || null,
      ativa,
    };

    const { error } = promocao
      ? await supabase.from("promocoes").update(campos).eq("id", promocao.id)
      : await supabase.from("promocoes").insert(campos);

    if (error) {
      setErro(error.message);
      setSalvando(false);
      return;
    }

    setSalvando(false);
    router.push("/painel/promocoes");
    router.refresh();
  }

  return (
    <form onSubmit={salvar} className="space-y-5">
      <Bloco titulo="A promoção">
        {locais.length > 1 && (
          <label className="block">
            <span className="text-sm font-medium">Estabelecimento</span>
            <select
              value={localId}
              onChange={(e) => setLocalId(e.target.value)}
              className="mt-1 w-full border-2 border-carvalho bg-creme px-4 py-2.5 outline-none focus:border-sol-600 focus:ring-2 focus:ring-sol-200"
            >
              {locais.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.nome}
                </option>
              ))}
            </select>
          </label>
        )}

        <Texto
          rotulo="O que é a promoção"
          valor={titulo}
          onChange={setTitulo}
          placeholder="Caipirinha em dobro, chope em dobro no happy hour..."
        />
        <AreaTexto
          rotulo="Detalhes (opcional)"
          valor={descricao}
          onChange={setDescricao}
          dica="Condições, sabores que entram, se precisa consumir no local."
          linhas={3}
        />
      </Bloco>

      <Bloco
        titulo="Quando vale"
        descricao="Não marcar dia nenhum quer dizer todos os dias."
      >
        <div className="flex flex-wrap gap-2">
          {DIAS_CURTOS.map((nome, d) => {
            const marcado = dias.includes(d);
            return (
              <button
                key={d}
                type="button"
                onClick={() => alternarDia(d)}
                aria-pressed={marcado}
                className={`h-11 w-12 rounded-xl text-sm font-semibold transition ${
                  marcado
                    ? "bg-carvalho text-creme"
                    : "border border-carvalho/25 bg-creme text-tinta/60 hover:bg-cal-sombra"
                }`}
              >
                {nome}
              </button>
            );
          })}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <Texto
            rotulo="A partir das (opcional)"
            tipo="time"
            valor={inicio}
            onChange={setInicio}
          />
          <Texto
            rotulo="Até as (opcional)"
            tipo="time"
            valor={fim}
            onChange={setFim}
          />
        </div>

        <Texto
          rotulo="A promoção acaba em (opcional)"
          tipo="date"
          valor={valeAte}
          onChange={setValeAte}
          dica="Deixe vazio se não tem prazo para acabar."
        />

        <p className="border border-carvalho/20 bg-cal-sombra px-3 py-2 text-sm">
          Vai aparecer assim:{" "}
          <strong>
            {quandoVale({
              dias_semana: dias,
              hora_inicio: inicio || null,
              hora_fim: fim || null,
            })}
          </strong>
        </p>
      </Bloco>

      <Bloco titulo="Imagem (opcional)">
        {imagem ? (
          <div className="relative h-40 w-full max-w-sm overflow-hidden rounded-xl">
            <Image src={imagem} alt="" fill sizes="384px" className="object-cover" />
            <button
              type="button"
              onClick={() => setImagem("")}
              className="absolute top-2 right-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold"
            >
              Trocar
            </button>
          </div>
        ) : (
          <input
            type="file"
            accept="image/*"
            onChange={(e) => enviarImagem(e.target.files)}
            className="block w-full text-sm file:mr-3 file:border-2 file:border-carvalho file:bg-carvalho file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
          />
        )}
      </Bloco>

      <label className="flex items-center gap-3 border-2 border-carvalho bg-creme p-4">
        <input
          type="checkbox"
          checked={ativa}
          onChange={(e) => setAtiva(e.target.checked)}
          className="h-5 w-5 accent-[#147a59]"
        />
        <span className="text-sm">
          <strong>Promoção no ar</strong>
          <span className="block text-tinta/55">
            Desmarque para guardar sem aparecer no site — sem precisar apagar.
          </span>
        </span>
      </label>

      {erro && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{erro}</p>
      )}

      <BotaoSalvar salvando={salvando} salvo={false}>
        {promocao ? "Salvar alterações" : "Cadastrar promoção"}
      </BotaoSalvar>
    </form>
  );
}

/** "18:00:00" do banco vira "18:00", que é o que o campo de hora espera. */
function corta(hora: string | null | undefined): string {
  return hora ? hora.slice(0, 5) : "";
}
