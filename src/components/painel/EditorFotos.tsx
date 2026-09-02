"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Bloco } from "./Campos";
import type { Foto } from "@/lib/tipos";

const TAMANHO_MAXIMO = 8 * 1024 * 1024; // 8 MB

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
  const router = useRouter();

  async function enviar(arquivos: FileList | null) {
    if (!arquivos || arquivos.length === 0) return;
    setErro(null);
    setEnviando(true);

    const supabase = createClient();
    const novas: Foto[] = [];

    for (const arquivo of Array.from(arquivos)) {
      if (arquivo.size > TAMANHO_MAXIMO) {
        setErro(`"${arquivo.name}" passa de 8 MB. Diminua a foto e tente de novo.`);
        continue;
      }

      const extensao = arquivo.name.split(".").pop()?.toLowerCase() ?? "jpg";
      const caminho = `${localId}/${crypto.randomUUID()}.${extensao}`;

      const { error: erroUpload } = await supabase.storage
        .from("locais")
        .upload(caminho, arquivo, { cacheControl: "3600", upsert: false });

      if (erroUpload) {
        setErro(erroUpload.message);
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

      if (error) setErro(error.message);
      else if (data) novas.push(data as Foto);
    }

    // Primeira foto do local vira a capa automaticamente.
    if (!capaAtual && novas.length > 0) {
      await definirCapa(novas[0].url);
    }

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
    if (error) setErro(error.message);
    else setCapaAtual(url);
  }

  async function apagar(foto: Foto) {
    const supabase = createClient();
    await supabase.from("locais_fotos").delete().eq("id", foto.id);

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
    router.refresh();
  }

  return (
    <Bloco
      titulo="Fotos"
      descricao="Foto boa é o que faz a pessoa escolher. Capriche na primeira — ela vira a capa."
    >
      <label className="block cursor-pointer rounded-xl border-2 border-dashed border-mata-200 bg-mata-50/50 p-6 text-center transition hover:border-mata-400">
        <input
          type="file"
          accept="image/*"
          multiple
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
        <p className="text-xs text-tinta/50">JPG ou PNG, até 8 MB cada</p>
      </label>

      {erro && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {erro}
        </p>
      )}

      {lista.length > 0 && (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {lista.map((foto) => (
            <div
              key={foto.id}
              className="group relative aspect-[4/3] overflow-hidden rounded-xl border border-mata-100"
            >
              <Image
                src={foto.url}
                alt={foto.legenda ?? ""}
                fill
                sizes="200px"
                className="object-cover"
              />

              {capaAtual === foto.url && (
                <span className="absolute top-2 left-2 rounded-full bg-mata-600 px-2 py-0.5 text-[11px] font-semibold text-white">
                  Capa
                </span>
              )}

              <div className="absolute inset-x-0 bottom-0 flex gap-1 bg-linear-to-t from-tinta/70 to-transparent p-2 opacity-0 transition group-hover:opacity-100">
                {capaAtual !== foto.url && (
                  <button
                    type="button"
                    onClick={() => void definirCapa(foto.url)}
                    className="rounded-md bg-white/90 px-2 py-1 text-[11px] font-semibold"
                  >
                    Usar de capa
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => void apagar(foto)}
                  className="ml-auto rounded-md bg-white/90 px-2 py-1 text-[11px] font-semibold text-red-700"
                >
                  Apagar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </Bloco>
  );
}
