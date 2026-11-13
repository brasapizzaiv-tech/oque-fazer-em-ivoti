"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bloco } from "./Campos";
import type { Foto } from "@/lib/tipos";

/** Teto do arquivo original. O que sobe é a versão reduzida, bem menor. */
const TAMANHO_MAXIMO = 25 * 1024 * 1024;

/** Lado maior da foto que vai para o site. */
const LADO_MAXIMO = 1920;

/**
 * Reduz a foto e a converte para JPG, no próprio aparelho, antes de subir.
 *
 * Dois motivos. Foto de celular sai com 4 a 8 MB, e é esse arquivo que o
 * visitante baixaria na rua, no 4G. E o iPhone grava em HEIC, formato que
 * o Chrome e o Android não abrem: a foto subia, o comerciante a via no
 * iPhone dele, e para a maior parte dos visitantes era um quadro vazio.
 *
 * Devolve nulo quando o navegador não consegue abrir o arquivo (é o caso
 * do HEIC fora do Safari): melhor recusar com um recado claro do que
 * publicar uma foto que não aparece.
 */
async function prepararFoto(arquivo: File): Promise<Blob | null> {
  try {
    const imagem = await createImageBitmap(arquivo, {
      imageOrientation: "from-image",
    });

    const escala = Math.min(
      1,
      LADO_MAXIMO / Math.max(imagem.width, imagem.height),
    );
    const tela = document.createElement("canvas");
    tela.width = Math.round(imagem.width * escala);
    tela.height = Math.round(imagem.height * escala);

    const pincel = tela.getContext("2d");
    if (!pincel) return null;
    // Fundo branco: PNG com transparência viraria preto no JPG.
    pincel.fillStyle = "#FFFFFF";
    pincel.fillRect(0, 0, tela.width, tela.height);
    pincel.drawImage(imagem, 0, 0, tela.width, tela.height);
    imagem.close();

    return await new Promise((pronto) =>
      tela.toBlob(pronto, "image/jpeg", 0.85),
    );
  } catch {
    return null;
  }
}

export default function EditorFotos({
  localId,
  fotos,
  capa,
}: {
  localId: string;
  fotos: Foto[];
  capa: string | null;
}) {
  const [lista, setLista] = useState(fotos);
  const [capaAtual, setCapaAtual] = useState(capa);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  /** A foto que está pedindo "apagar mesmo?". */
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [apagando, setApagando] = useState<string | null>(null);
  const router = useRouter();

  async function enviar(arquivos: FileList | null) {
    if (!arquivos || arquivos.length === 0) return;
    setErro(null);
    setEnviando(true);

    const supabase = createClient();
    const novas: Foto[] = [];
    const recusadas: string[] = [];

    for (const arquivo of Array.from(arquivos)) {
      if (arquivo.size > TAMANHO_MAXIMO) {
        recusadas.push(`"${arquivo.name}" é grande demais (passa de 25 MB).`);
        continue;
      }

      const reduzida = await prepararFoto(arquivo);
      if (!reduzida) {
        recusadas.push(
          `Não consegui abrir "${arquivo.name}". Se for foto de iPhone no formato HEIC, envie pelo próprio iPhone ou salve como JPG antes.`,
        );
        continue;
      }

      const caminho = `${localId}/${crypto.randomUUID()}.jpg`;

      const { error: erroUpload } = await supabase.storage
        .from("locais")
        .upload(caminho, reduzida, {
          cacheControl: "3600",
          contentType: "image/jpeg",
          upsert: false,
        });

      if (erroUpload) {
        console.error("Foto não subiu:", erroUpload);
        recusadas.push(`Não consegui enviar "${arquivo.name}". Tente de novo.`);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("locais").getPublicUrl(caminho);

      const { data, error } = await supabase
        .from("locais_fotos")
        .insert({
          local_id: localId,
          url: publicUrl,
          ordem: lista.length + novas.length,
        })
        .select("id, url, legenda, ordem")
        .single();

      if (error || !data) {
        console.error("Foto subiu mas não foi registrada:", error);
        // O arquivo ficaria órfão no depósito: sem a linha, ninguém o vê
        // nem consegue apagar pela tela.
        await supabase.storage.from("locais").remove([caminho]);
        recusadas.push(`Não consegui salvar "${arquivo.name}". Tente de novo.`);
        continue;
      }

      novas.push(data as Foto);
    }

    // Primeira foto do local vira a capa automaticamente.
    if (!capaAtual && novas.length > 0) {
      await definirCapa(novas[0].url);
    }

    if (recusadas.length > 0) setErro(recusadas.join(" "));
    setLista((atual) => [...atual, ...novas]);
    setEnviando(false);
    router.refresh();
  }

  async function definirCapa(url: string) {
    const supabase = createClient();
    const { error } = await supabase
      .from("locais")
      .update({ capa_url: url })
      .eq("id", localId);
    if (error) {
      console.error("Capa não trocou:", error);
      setErro("Não consegui trocar a capa. Tente de novo.");
    } else {
      setCapaAtual(url);
      router.refresh();
    }
  }

  async function apagar(foto: Foto) {
    setErro(null);
    setApagando(foto.id);
    const supabase = createClient();

    const { error } = await supabase
      .from("locais_fotos")
      .delete()
      .eq("id", foto.id);

    if (error) {
      console.error("Foto não foi apagada:", error);
      setErro("Não consegui apagar a foto. Tente de novo.");
      setApagando(null);
      setConfirmando(null);
      return;
    }

    // Remove o arquivo do Storage também (o caminho é o que vem depois de
    // /locais/ na URL pública).
    const caminho = foto.url.split("/locais/")[1];
    if (caminho) await supabase.storage.from("locais").remove([caminho]);

    if (capaAtual === foto.url) {
      const sobra = lista.find((f) => f.id !== foto.id);
      await supabase
        .from("locais")
        .update({ capa_url: sobra?.url ?? null })
        .eq("id", localId);
      setCapaAtual(sobra?.url ?? null);
    }

    setLista((atual) => atual.filter((f) => f.id !== foto.id));
    setApagando(null);
    setConfirmando(null);
    router.refresh();
  }

  return (
    <Bloco
      titulo="Fotos"
      descricao="Foto boa é o que faz a pessoa escolher. Capriche na primeira — ela vira a capa."
    >
      <label className="block cursor-pointer border-2 border-dashed border-[color:var(--color-v-texto)]/40 bg-[color:var(--color-v-fundo)]/60 p-6 text-center transition hover:border-carvalho">
        <input
          type="file"
          accept="image/*"
          multiple
          disabled={enviando}
          className="hidden"
          onChange={(e) => {
            void enviar(e.target.files);
            e.target.value = "";
          }}
        />
        <span className="text-2xl">📷</span>
        <p className="mt-1 text-sm font-medium">
          {enviando ? "Enviando..." : "Escolher fotos"}
        </p>
        <p className="text-xs texto-suave">
          Pode mandar a foto do celular como está: ela é reduzida sozinha.
        </p>
      </label>

      {erro && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[color:var(--color-v-fechado-claro)]"
        >
          {erro}
        </p>
      )}

      {lista.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {lista.map((foto) => {
            const ehCapa = capaAtual === foto.url;
            const perguntando = confirmando === foto.id;

            return (
              <div
                key={foto.id}
                className="overflow-hidden border-2 border-[color:var(--color-v-texto)]/30"
              >
                <div className="relative aspect-[4/3]">
                  <Image
                    src={foto.url}
                    alt={foto.legenda ?? ""}
                    fill
                    sizes="200px"
                    className="object-cover"
                  />

                  {ehCapa && (
                    <span className="absolute top-2 left-2 botao-cheio px-2 py-0.5 text-[11px]">
                      Capa
                    </span>
                  )}
                </div>

                {/* Os botões ficam sempre à vista, embaixo da foto. Antes
                    só apareciam com o mouse por cima: no celular não há
                    mouse, e eles ficavam invisíveis mas tocáveis — um
                    toque no canto da foto a apagava, sem pergunta. */}
                <div className="flex min-h-11 flex-wrap items-center gap-1 p-1.5">
                  {perguntando ? (
                    <>
                      <span className="px-1 text-[12px] font-semibold">
                        Apagar?
                      </span>
                      <button
                        type="button"
                        disabled={apagando === foto.id}
                        onClick={() => void apagar(foto)}
                        className="ml-auto min-h-9 rounded-md px-2.5 text-[12px] font-semibold text-white disabled:opacity-50"
                        style={{
                          backgroundColor: "var(--color-v-fechado-claro)",
                        }}
                      >
                        {apagando === foto.id ? "Apagando..." : "Apagar"}
                      </button>
                      <button
                        type="button"
                        disabled={apagando === foto.id}
                        onClick={() => setConfirmando(null)}
                        className="min-h-9 rounded-md border border-[color:var(--color-v-texto)]/30 px-2.5 text-[12px] font-semibold"
                      >
                        Voltar
                      </button>
                    </>
                  ) : (
                    <>
                      {!ehCapa && (
                        <button
                          type="button"
                          onClick={() => void definirCapa(foto.url)}
                          className="min-h-9 rounded-md border border-[color:var(--color-v-texto)]/30 px-2.5 text-[12px] font-semibold"
                        >
                          Usar de capa
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setConfirmando(foto.id)}
                        className="ml-auto min-h-9 rounded-md px-2.5 text-[12px] font-semibold text-[color:var(--color-v-fechado-claro)]"
                      >
                        Apagar
                      </button>
                    </>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </Bloco>
  );
}
