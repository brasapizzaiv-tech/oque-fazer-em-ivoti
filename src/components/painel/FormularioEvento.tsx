"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { naoAbriu, prepararFoto } from "@/lib/preparar-foto";
import { AreaTexto, Bloco, BotaoSalvar, Texto } from "./Campos";
import { paraCampoDataHora, deCampoDataHora } from "@/lib/horarios";
import type { Evento } from "@/lib/tipos";
import { explicarErro } from "@/lib/erro-do-banco";
import { pedirAvisoDoEvento } from "@/lib/avisar";

// Teto do arquivo original; o que sobe é a versão reduzida.
const TAMANHO_MAXIMO = 25 * 1024 * 1024;

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
  const [localId, setLocalId] = useState(
    evento?.local_id ?? locais[0]?.id ?? "",
  );
  const [localTexto, setLocalTexto] = useState(evento?.local_texto ?? "");
  const [inicio, setInicio] = useState(
    paraCampoDataHora(evento?.inicio ?? null),
  );
  const [fim, setFim] = useState(paraCampoDataHora(evento?.fim ?? null));
  // Data certa, hora ainda não divulgada. Sem esta opção o formulário
  // exigia uma hora, e quem só sabia o dia acabava gravando meia-noite —
  // que o site então anunciava como horário de verdade.
  const [semHora, setSemHora] = useState(evento?.sem_hora ?? false);
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
      setErro("A imagem é grande demais (passa de 25 MB).");
      return;
    }

    setErro(null);
    setSalvando(true);

    const supabase = createClient();
    const pronta = await prepararFoto(arquivo);
    if (!pronta) {
      setErro(naoAbriu(arquivo.name));
      setSalvando(false);
      return;
    }
    const caminho = `eventos/${crypto.randomUUID()}.${pronta.extensao}`;

    const { error } = await supabase.storage
      .from("locais")
      .upload(caminho, pronta.arquivo, {
        cacheControl: "3600",
        contentType: pronta.tipo,
        upsert: false,
      });

    if (error) {
      setErro(explicarErro(error, "Não consegui salvar o evento. Tente de novo."));
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
    // Segundo toque enquanto o primeiro ainda está gravando: sem esta
    // linha o evento era criado duas vezes.
    if (salvando) return;
    setErro(null);

    if (!titulo.trim()) return setErro("Falta o nome do evento.");

    // Sem hora, o evento é gravado à meia-noite do dia e marcado como tal;
    // o fim, se houver, vale até o último minuto do último dia.
    const comeco = deCampoDataHora(
      semHora && inicio ? `${inicio.slice(0, 10)}T00:00` : inicio,
    );
    if (!comeco) {
      return setErro(
        semHora ? "Falta a data do evento." : "Falta a data e a hora de início.",
      );
    }

    const termino = deCampoDataHora(
      semHora && fim ? `${fim.slice(0, 10)}T23:59` : fim,
    );
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
      sem_hora: semHora,
      descricao: descricao.trim() || null,
      url: url.trim() || null,
      imagem_url: imagem || null,
      publicar_em: deCampoDataHora(publicarEm),
    };

    // O evento que a administração deve ficar sabendo que existe.
    let paraAvisar: string | null = null;

    if (evento) {
      paraAvisar = evento.id;
      const { error } = await supabase
        .from("eventos")
        .update(campos)
        .eq("id", evento.id);
      if (error) {
        setErro(explicarErro(error, "Não consegui salvar o evento. Tente de novo."));
        setSalvando(false);
        return;
      }
    } else {
      const { data: criado, error } = await supabase
        .from("eventos")
        .insert({
          ...campos,
          criado_por: user?.id ?? null,
          // O admin publica direto; os demais entram na fila de aprovacao.
          // (Quem garante isso e o banco; aqui e so para a tela ja saber.)
          status: ehAdmin ? "publicado" : "em_analise",
        })
        .select("id")
        .single();
      paraAvisar = criado?.id ?? null;
      if (error) {
        setErro(explicarErro(error, "Não consegui salvar o evento. Tente de novo."));
        setSalvando(false);
        return;
      }
    }

    // A rota decide se há o que avisar: só manda e-mail quando o evento
    // está de fato esperando análise.
    if (!ehAdmin && paraAvisar) void pedirAvisoDoEvento(paraAvisar);

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
            className="mt-1 w-full caixa-painel px-4 py-2.5 outline-none"
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
        descricao="Horário de Ivoti. O fim é opcional — preencha se o evento tem hora para acabar."
      >
        <label className="flex min-h-11 items-center gap-2.5 text-sm">
          <input
            type="checkbox"
            checked={semHora}
            onChange={(e) => setSemHora(e.target.checked)}
            className="h-5 w-5"
          />
          A hora ainda não foi divulgada (mostrar só o dia)
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <Texto
            rotulo={semHora ? "Dia" : "Começa"}
            tipo={semHora ? "date" : "datetime-local"}
            valor={semHora ? inicio.slice(0, 10) : inicio}
            onChange={(v) => setInicio(semHora && v ? `${v}T00:00` : v)}
          />
          <Texto
            rotulo={semHora ? "Último dia (opcional)" : "Termina (opcional)"}
            tipo={semHora ? "date" : "datetime-local"}
            valor={semHora ? fim.slice(0, 10) : fim}
            onChange={(v) => setFim(semHora && v ? `${v}T23:59` : v)}
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
          <p className="text-xs texto-suave">
            O cartaz do evento, se tiver.
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
              className="mt-2 block w-full text-sm file:mr-3 file:mr-3 file:rounded-[9px] file:border-0 file:bg-[color:var(--color-v-texto)] file:px-4 file:py-2 file:text-[13px] file:font-bold file:text-[#FFFFFF]"
            />
          )}
        </div>
      </Bloco>

      {erro && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[color:var(--color-v-fechado-claro)]">
          {erro}
        </p>
      )}

      {!evento && !ehAdmin && (
        <p className="aviso-painel px-3 py-2 text-[14px]">
          O evento passa por uma conferida rápida antes de aparecer na agenda.
        </p>
      )}

      <BotaoSalvar salvando={salvando} salvo={salvo}>
        {evento ? "Salvar alterações" : "Cadastrar evento"}
      </BotaoSalvar>
    </form>
  );
}
