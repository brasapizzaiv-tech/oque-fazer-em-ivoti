"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { MAXIMO_DE_PAGINAS_DO_CARDAPIO } from "@/lib/cardapio";
import {
  LADO_MAXIMO_DO_CARDAPIO,
  naoAbriu,
  prepararFoto,
} from "@/lib/preparar-foto";
import { Bloco } from "./Campos";
import type { PaginaDoCardapio } from "@/lib/tipos";

/** Teto do arquivo original. O que sobe é a versão reduzida, bem menor. */
const TAMANHO_MAXIMO = 25 * 1024 * 1024;

/**
 * O cardápio em foto: o comerciante sobe a imagem do cardápio que já tem
 * (a arte, o print, a foto do impresso), uma por página.
 *
 * Nasceu em 26/11/2026: digitar item por item era o que fazia o cadastro
 * parar na aba do cardápio. A foto resolve o "mostrar o cardápio"; os itens
 * digitados, logo abaixo na mesma aba, continuam sendo o que a busca e o
 * Guia leem.
 *
 * Diferente das fotos do lugar, aqui a ordem importa (página 1, página 2),
 * então dá para subir e descer cada uma.
 */
export default function EditorCardapioFotos({
  localId,
  paginas,
}: {
  localId: string;
  paginas: PaginaDoCardapio[];
}) {
  const [lista, setLista] = useState(paginas);
  const [enviando, setEnviando] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  /** A página que está pedindo "apagar mesmo?". */
  const [confirmando, setConfirmando] = useState<string | null>(null);
  const [ocupada, setOcupada] = useState<string | null>(null);
  const router = useRouter();

  const cheio = lista.length >= MAXIMO_DE_PAGINAS_DO_CARDAPIO;

  async function enviar(arquivos: FileList | null) {
    if (!arquivos || arquivos.length === 0) return;
    setErro(null);
    setEnviando(true);

    const supabase = createClient();
    const novas: PaginaDoCardapio[] = [];
    const recusadas: string[] = [];
    const vagas = MAXIMO_DE_PAGINAS_DO_CARDAPIO - lista.length;
    // A próxima posição vem depois da maior que existe, e não do tamanho da
    // lista: apagar uma página do meio deixa um buraco na numeração.
    const depoisDaUltima = Math.max(-1, ...lista.map((p) => p.ordem)) + 1;

    for (const arquivo of Array.from(arquivos)) {
      if (novas.length >= vagas) {
        recusadas.push(
          `O cardápio aceita até ${MAXIMO_DE_PAGINAS_DO_CARDAPIO} páginas: "${arquivo.name}" ficou de fora.`,
        );
        continue;
      }

      if (arquivo.size > TAMANHO_MAXIMO) {
        recusadas.push(`"${arquivo.name}" é grande demais (passa de 25 MB).`);
        continue;
      }

      const reduzida = await prepararFoto(arquivo, {
        ladoMaximo: LADO_MAXIMO_DO_CARDAPIO,
      });
      if (!reduzida) {
        recusadas.push(
          arquivo.type === "application/pdf"
            ? `"${arquivo.name}" é um PDF. Aqui entra imagem: tire um print de cada página e envie os prints.`
            : naoAbriu(arquivo.name),
        );
        continue;
      }

      const caminho = `${localId}/cardapio-${crypto.randomUUID()}.jpg`;

      const { error: erroUpload } = await supabase.storage
        .from("locais")
        .upload(caminho, reduzida.arquivo, {
          cacheControl: "3600",
          contentType: reduzida.tipo,
          upsert: false,
        });

      if (erroUpload) {
        console.error("Página do cardápio não subiu:", erroUpload);
        recusadas.push(`Não consegui enviar "${arquivo.name}". Tente de novo.`);
        continue;
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("locais").getPublicUrl(caminho);

      const { data, error } = await supabase
        .from("locais_cardapio_fotos")
        .insert({
          local_id: localId,
          url: publicUrl,
          largura: reduzida.largura,
          altura: reduzida.altura,
          ordem: depoisDaUltima + novas.length,
        })
        .select("id, url, largura, altura, ordem")
        .single();

      if (error || !data) {
        console.error("Página subiu mas não foi registrada:", error);
        // O arquivo ficaria órfão no depósito: sem a linha, ninguém o vê
        // nem consegue apagar pela tela.
        await supabase.storage.from("locais").remove([caminho]);
        recusadas.push(`Não consegui salvar "${arquivo.name}". Tente de novo.`);
        continue;
      }

      novas.push(data as PaginaDoCardapio);
    }

    if (recusadas.length > 0) setErro(recusadas.join(" "));
    setLista((atual) => [...atual, ...novas]);
    setEnviando(false);
    router.refresh();
  }

  /** Troca a página de lugar com a vizinha: -1 sobe, +1 desce. */
  async function mover(indice: number, passo: -1 | 1) {
    const outro = indice + passo;
    if (outro < 0 || outro >= lista.length) return;

    const a = lista[indice];
    const b = lista[outro];
    setErro(null);
    setOcupada(a.id);

    const supabase = createClient();
    const [ra, rb] = await Promise.all([
      supabase
        .from("locais_cardapio_fotos")
        .update({ ordem: b.ordem })
        .eq("id", a.id),
      supabase
        .from("locais_cardapio_fotos")
        .update({ ordem: a.ordem })
        .eq("id", b.id),
    ]);

    setOcupada(null);

    if (ra.error || rb.error) {
      console.error("Ordem do cardápio não mudou:", ra.error ?? rb.error);
      setErro("Não consegui mudar a ordem. Tente de novo.");
      router.refresh();
      return;
    }

    setLista((atual) => {
      const nova = [...atual];
      nova[indice] = { ...b, ordem: a.ordem };
      nova[outro] = { ...a, ordem: b.ordem };
      return nova;
    });
    router.refresh();
  }

  async function apagar(pagina: PaginaDoCardapio) {
    setErro(null);
    setOcupada(pagina.id);
    const supabase = createClient();

    const { error } = await supabase
      .from("locais_cardapio_fotos")
      .delete()
      .eq("id", pagina.id);

    if (error) {
      console.error("Página do cardápio não foi apagada:", error);
      setErro("Não consegui apagar. Tente de novo.");
      setOcupada(null);
      setConfirmando(null);
      return;
    }

    // Remove o arquivo do depósito também (o caminho é o que vem depois de
    // /locais/ no endereço público).
    const caminho = pagina.url.split("/locais/")[1];
    if (caminho) await supabase.storage.from("locais").remove([caminho]);

    setLista((atual) => atual.filter((p) => p.id !== pagina.id));
    setOcupada(null);
    setConfirmando(null);
    router.refresh();
  }

  return (
    <Bloco
      titulo="Cardápio em foto"
      descricao="Já tem o cardápio pronto? Envie a imagem dele, uma por página, em vez de digitar tudo. Vale a arte, o print ou a foto do cardápio impresso."
    >
      {cheio ? (
        <p className="text-sm texto-suave">
          São {MAXIMO_DE_PAGINAS_DO_CARDAPIO} páginas no máximo. Para trocar
          uma, apague a antiga antes.
        </p>
      ) : (
        <label className="block cursor-pointer border-2 border-dashed border-[color:var(--color-v-texto)]/40 bg-[color:var(--color-v-fundo)]/60 p-6 text-center transition hover:border-carvalho">
          <input
            id="cardapio-em-foto"
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
          <span className="text-2xl">📋</span>
          <p className="mt-1 text-sm font-medium">
            {enviando
              ? "Enviando..."
              : lista.length > 0
                ? "Enviar mais páginas"
                : "Enviar a imagem do cardápio"}
          </p>
          <p className="text-xs texto-suave">
            Foto reta, com boa luz e sem cortar as bordas: o visitante vai
            ampliar para ler.
          </p>
        </label>
      )}

      {erro && (
        <p
          role="alert"
          className="rounded-lg bg-red-50 px-3 py-2 text-sm text-[color:var(--color-v-fechado-claro)]"
        >
          {erro}
        </p>
      )}

      {lista.length > 0 && (
        <ol className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {lista.map((pagina, i) => {
            const perguntando = confirmando === pagina.id;
            const parada = ocupada !== null;

            return (
              <li
                key={pagina.id}
                className="overflow-hidden border-2 border-[color:var(--color-v-texto)]/30"
              >
                <div className="relative aspect-[3/4] bg-[color:var(--color-v-fundo)]">
                  <Image
                    src={pagina.url}
                    alt={`Página ${i + 1} do cardápio`}
                    fill
                    sizes="200px"
                    className="object-contain"
                  />
                  <span className="absolute top-2 left-2 botao-cheio px-2 py-0.5 text-[11px]">
                    Página {i + 1}
                  </span>
                </div>

                {/* Sempre à vista, embaixo da imagem, como nas fotos do
                    lugar: botão que só aparece com o mouse não existe no
                    celular. */}
                <div className="flex min-h-11 flex-wrap items-center gap-1 p-1.5">
                  {perguntando ? (
                    <>
                      <span className="px-1 text-[12px] font-semibold">
                        Apagar?
                      </span>
                      <button
                        type="button"
                        disabled={parada}
                        onClick={() => void apagar(pagina)}
                        className="ml-auto min-h-9 rounded-md px-2.5 text-[12px] font-semibold text-white disabled:opacity-50"
                        style={{
                          backgroundColor: "var(--color-v-fechado-claro)",
                        }}
                      >
                        {ocupada === pagina.id ? "Apagando..." : "Apagar"}
                      </button>
                      <button
                        type="button"
                        disabled={parada}
                        onClick={() => setConfirmando(null)}
                        className="min-h-9 rounded-md border border-[color:var(--color-v-texto)]/30 px-2.5 text-[12px] font-semibold"
                      >
                        Voltar
                      </button>
                    </>
                  ) : (
                    <>
                      {lista.length > 1 && (
                        <>
                          <button
                            type="button"
                            disabled={parada || i === 0}
                            onClick={() => void mover(i, -1)}
                            aria-label={`Página ${i + 1}: passar para antes`}
                            className="min-h-9 min-w-9 rounded-md border border-[color:var(--color-v-texto)]/30 px-2 text-[14px] font-semibold disabled:opacity-30"
                          >
                            ←
                          </button>
                          <button
                            type="button"
                            disabled={parada || i === lista.length - 1}
                            onClick={() => void mover(i, 1)}
                            aria-label={`Página ${i + 1}: passar para depois`}
                            className="min-h-9 min-w-9 rounded-md border border-[color:var(--color-v-texto)]/30 px-2 text-[14px] font-semibold disabled:opacity-30"
                          >
                            →
                          </button>
                        </>
                      )}
                      <button
                        type="button"
                        disabled={parada}
                        onClick={() => setConfirmando(pagina.id)}
                        className="ml-auto min-h-9 rounded-md px-2.5 text-[12px] font-semibold text-[color:var(--color-v-fechado-claro)]"
                      >
                        Apagar
                      </button>
                    </>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Bloco>
  );
}
