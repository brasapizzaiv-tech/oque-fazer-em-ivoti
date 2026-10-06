"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Aviso, Caixa, Rotulo } from "@/components/painel/pecas";
import type { ImagemCadastrada } from "@/lib/imagens";

const TAMANHO_MAXIMO = 6 * 1024 * 1024;

/**
 * Troca uma das imagens do site.
 *
 * A prévia mostra a foto no formato em que ela vai aparecer — a de fundo
 * cobrindo tudo, as capas em faixa larga. Ver a imagem num quadrado e
 * descobrir depois que ela ficou cortada no site seria descobrir tarde.
 *
 * "Voltar à original" apaga só o endereço, não o arquivo: a tela volta a
 * usar a foto que está no código, e o que foi enviado continua guardado.
 */
export default function TrocarImagem({ imagem }: { imagem: ImagemCadastrada }) {
  const router = useRouter();
  const supabase = createClient();

  const [url, setUrl] = useState(imagem.url);
  const [indo, setIndo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);

  const ehFundo = imagem.chave === "fundo";

  async function escolher(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0];
    e.target.value = "";
    if (!arquivo) return;

    setErro(null);

    if (arquivo.size > TAMANHO_MAXIMO) {
      setErro(
        "A imagem passa de 6 MB. Foto grande demais deixa o site lento no celular — diminua antes de enviar.",
      );
      return;
    }

    setIndo(true);
    const extensao = arquivo.name.split(".").pop()?.toLowerCase() ?? "jpg";
    const caminho = `site/${imagem.chave}-${crypto.randomUUID()}.${extensao}`;

    const { error: erroEnvio } = await supabase.storage
      .from("locais")
      .upload(caminho, arquivo, { cacheControl: "3600", upsert: false });

    if (erroEnvio) {
      setIndo(false);
      setErro(erroEnvio.message);
      return;
    }

    const novaUrl = supabase.storage.from("locais").getPublicUrl(caminho)
      .data.publicUrl;

    const { error: erroBanco } = await supabase
      .from("imagens_do_site")
      .update({ url: novaUrl, atualizada_em: new Date().toISOString() })
      .eq("chave", imagem.chave);

    setIndo(false);
    if (erroBanco) {
      setErro(erroBanco.message);
      return;
    }
    setUrl(novaUrl);
    router.refresh();
  }

  async function voltarAoPadrao() {
    setErro(null);
    setIndo(true);
    const { error } = await supabase
      .from("imagens_do_site")
      .update({ url: null, atualizada_em: new Date().toISOString() })
      .eq("chave", imagem.chave);
    setIndo(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setUrl(null);
    router.refresh();
  }

  return (
    <Caixa>
      <Rotulo dica={imagem.descricao}>{nomeBonito(imagem.chave)}</Rotulo>

      <div
        className={`relative mt-3 w-full overflow-hidden rounded-[12px] ${
          ehFundo ? "h-48" : "h-28"
        }`}
        style={{ backgroundColor: "rgba(43, 35, 32, 0.08)" }}
      >
        {url ? (
          <Image
            src={url}
            alt=""
            fill
            sizes="(max-width: 1024px) 100vw, 600px"
            className="object-cover"
          />
        ) : (
          <span className="grid h-full place-items-center text-[13px] texto-suave">
            usando a foto original do site
          </span>
        )}
      </div>

      {erro && (
        <div className="mt-3">
          <Aviso>{erro}</Aviso>
        </div>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-3">
        <label
          className={`botao-vazado cursor-pointer px-4 py-2.5 text-[14px] ${
            indo ? "opacity-50" : ""
          }`}
        >
          {indo ? "Enviando..." : url ? "Trocar a foto" : "Escolher uma foto"}
          <input
            type="file"
            accept="image/*"
            onChange={escolher}
            disabled={indo}
            className="hidden"
          />
        </label>

        {url && (
          <button
            type="button"
            onClick={voltarAoPadrao}
            disabled={indo}
            className="text-[13px] font-semibold underline disabled:opacity-50"
            style={{ color: "var(--color-v-fechado-claro)" }}
          >
            Voltar à original
          </button>
        )}
      </div>
    </Caixa>
  );
}

/** "capa-inicio" vira "Capa da Início". */
function nomeBonito(chave: string): string {
  const nomes: Record<string, string> = {
    fundo: "Fundo do site",
    "capa-inicio": "Capa da Início",
    "capa-explorar": "Capa do Explorar",
    "capa-agenda": "Capa da Agenda",
    "capa-mapa": "Capa do Mapa",
    "capa-roteiros": "Capa dos Roteiros",
    "capa-caminhos": "Capa dos Caminhos",
    "capa-conta": "Tira das telas de conta",
  };
  return nomes[chave] ?? chave;
}
