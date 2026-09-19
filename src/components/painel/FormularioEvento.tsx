"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { AreaTexto, Bloco, BotaoSalvar, Texto } from "./Campos";
import { paraCampoDataHora, deCampoDataHora } from "@/lib/horarios";
import type { Evento } from "@/lib/tipos";

const TAMANHO_MAXIMO = 8 * 1024 * 1024; // 8 MB

export type LocalDoDono = { id: string; nome: string };

/**
 * Cadastro e edicao de evento, usado nas duas telas.
 *
 * "evento" vazio = criando um novo.
 */
export default function FormularioEvento({
  evento,
  locais,
  ehAdmin = false,
}: {
  evento?: Evento;
  locais: LocalDoDono[];
  ehAdmin?: boolean;
}) {
  const [titulo, setTitulo] = useState(evento?.titulo ?? "");
  const [localId, setLocalId] = useState(evento?.local_id ?? locais[0]?.id ?? "");
  const [localTexto, setLocalTexto] = useState(evento?.local_texto ?? "");
  const [inicio, setInicio] = useState(paraCampoDataHora(evento?.inicio ?? null));
  const [fim, setFim] = useState(paraCampoDataHora(evento?.fim ?? null));
  const [descricao, setDescricao] = useState(evento?.descricao ?? "");
  const [url, setUrl] = useState(evento?.url ?? "");
  const [imagem, setImagem] = useState(evento?.imagem_url ?? "");
  const [publicarEm, setPublicarEm] = useState(
    paraCampoDataHora(evento?.publicar_em ?? null),
  );

  const [salvando, setSalvando] = useState(false);
  const [salvo, setSalvo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const router = useRouter();

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
    const caminho = `eventos/${crypto.randomUUID()}.${extensao}`;

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

    if (!titulo.trim()) return setErro("Falta o nome do evento.");

    const comeco = deCampoDataHora(inicio);
    if (!comeco) return setErro("Falta a data e a hora de início.");

    const termino = deCampoDataHora(fim);
    if (termino && termino <= comeco) {
      return setErro("O fim não pode ser antes do início.");
    }

    setSalvando(true);
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    const campos = {
      titulo: titulo.trim(),
      // Evento da cidade inteira (feira na rua, desfile) nao tem local
      // cadastrado — ai vale o texto livre.
      local_id: localId || null,
      local_texto: localId ? null : localTexto.trim() || null,
      inicio: comeco,
      fim: termino,
      descricao: descricao.trim() || null,
      url: url.trim() || null,
      imagem_url: imagem || null,
      publicar_em: deCampoDataHora(publicarEm),
    };

    if (evento) {
      const { error } = await supabase
        .from("eventos")
        .update(campos)
        .eq("id", evento.id);
      if (error) {
        setErro(error.message);
        setSalvando(false);
        return;
      }
    } else {
      const { error } = await supabase.from("eventos").insert({
        ...campos,
        criado_por: user?.id ?? null,
        // O admin publica direto; os demais entram na fila de aprovacao.
        status: ehAdmin ? "publicado" : "em_analise",
      });
      if (error) {
        setErro(error.message);
        setSalvando(false);
        return;
      }
    }

    setSalvando(false);
    setSalvo(true);
    router.push("/painel/eventos");
    router.refresh();
  }

  return (
    <form onSubmit={salvar} className="space-y-5">
      <Bloco titulo="O evento">
        <Texto
          rotulo="Nome do evento"
          valor={titulo}
          onChange={setTitulo}
          placeholder="Feira Colonial, Show do Fulano, Kerb in Ivoti..."
        />

        <label className="block">
          <span className="text-sm font-medium">Onde vai ser</span>
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
            <option value="">Outro lugar (escrevo abaixo)</option>
          </select>
        </label>

        {!localId && (
          <Texto
            rotulo="Endereço ou nome do lugar"
            valor={localTexto}
            onChange={setLocalTexto}
            dica="Pra eventos que não acontecem num local cadastrado no guia."
            placeholder="Av. Presidente Lucena, em frente à prefeitura"
          />
        )}
      </Bloco>

      <Bloco
        titulo="Quando"
        descricao="Horário de Ivoti. O fim é opcional — preencha se o evento tem hora pra acabar."
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <Texto
            rotulo="Começa"
            tipo="datetime-local"
            valor={inicio}
            onChange={setInicio}
          />
          <Texto
            rotulo="Termina (opcional)"
            tipo="datetime-local"
            valor={fim}
            onChange={setFim}
          />
        </div>
      </Bloco>

      <Bloco
        titulo="Quando aparece no site"
        descricao="Deixe vazio para aparecer assim que for aprovado."
      >
        <Texto
          rotulo="Publicar em (opcional)"
          tipo="datetime-local"
          valor={publicarEm}
          onChange={setPublicarEm}
          dica="Monte a divulgação com antecedência e escolha o dia de soltar. Até lá o evento fica só aqui no painel."
        />
      </Bloco>

      <Bloco titulo="Detalhes">
        <AreaTexto
          rotulo="Descrição"
          valor={descricao}
          onChange={setDescricao}
          dica="O que vai ter, quanto custa, se precisa levar alguma coisa."
          linhas={5}
        />
        <Texto
          rotulo="Link (opcional)"
          valor={url}
          onChange={setUrl}
          dica="Página do evento, venda de ingresso ou post no Instagram."
          placeholder="https://..."
        />

        <div>
          <span className="text-sm font-medium">Imagem (opcional)</span>
          <p className="text-xs text-tinta/50">
            O cartaz do evento, se tiver. Até 8 MB.
          </p>
          {imagem && (
            <div className="relative mt-2 h-36 w-full max-w-sm overflow-hidden rounded-xl">
              <Image
                src={imagem}
                alt=""
                fill
                sizes="384px"
                className="object-cover"
              />
              <button
                type="button"
                onClick={() => setImagem("")}
                className="absolute top-2 right-2 rounded-full bg-white/90 px-2 py-1 text-xs font-semibold"
              >
                Trocar
              </button>
            </div>
          )}
          {!imagem && (
            <input
              type="file"
              accept="image/*"
              onChange={(e) => enviarImagem(e.target.files)}
              className="mt-2 block w-full text-sm file:mr-3 file:border-2 file:border-carvalho file:bg-carvalho file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white"
            />
          )}
        </div>
      </Bloco>

      {erro && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {erro}
        </p>
      )}

      {!evento && !ehAdmin && (
        <p className="rounded-lg bg-sol-50 px-3 py-2 text-sm text-sol-900">
          O evento passa por uma conferida rápida antes de aparecer na agenda.
        </p>
      )}

      <BotaoSalvar salvando={salvando} salvo={salvo}>
        {evento ? "Salvar alterações" : "Cadastrar evento"}
      </BotaoSalvar>
    </form>
  );
}
