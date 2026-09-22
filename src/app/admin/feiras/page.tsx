import Link from "next/link";
import type { Metadata } from "next";
import { SubTitulo, TituloPainel } from "@/components/painel/pecas";
import { listarTemas, periodoPorExtenso, type Tema } from "@/lib/temas";
import { hojeEmIvoti } from "@/lib/planos";
import EditorFeira from "./EditorFeira";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Feiras",
  robots: { index: false, follow: false },
};

/** Onde a feira está em relação a hoje. */
function quando(tema: Tema): "agora" | "vem" | "passou" | "sem data" {
  if (!tema.inicio || !tema.fim) return "sem data";
  const hoje = hojeEmIvoti();
  if (hoje < tema.inicio) return "vem";
  if (hoje > tema.fim) return "passou";
  return "agora";
}

export default async function Feiras({
  searchParams,
}: PageProps<"/admin/feiras">) {
  const params = await searchParams;
  const escolhida = typeof params.feira === "string" ? params.feira : null;

  const temas = await listarTemas();
  const tema = escolhida ? temas.find((t) => t.slug === escolhida) : null;

  if (tema) {
    return (
      <div>
        <nav className="text-[13px] texto-suave">
          <Link href="/admin/feiras">← Feiras</Link>
        </nav>
        <div className="mt-1 mb-6">
          <TituloPainel
            apoio={
              periodoPorExtenso(tema) ??
              "Sem período marcado — não aparece no site."
            }
          >
            {tema.subtitulo ? `${tema.subtitulo} ${tema.nome}` : tema.nome}
          </TituloPainel>
        </div>

        <EditorFeira tema={tema} />
      </div>
    );
  }

  const agora = temas.filter((t) => quando(t) === "agora");
  const proximas = temas.filter((t) => quando(t) === "vem");
  const resto = temas.filter((t) => ["passou", "sem data"].includes(quando(t)));

  return (
    <div>
      <TituloPainel apoio="Durante o período, o site veste a roupa da festa sozinho — e volta ao normal no fim, sem ninguém precisar desligar.">
        Feiras
      </TituloPainel>

      {temas.length === 0 ? (
        <p className="mt-6 text-[14px] texto-suave">
          Nenhuma feira cadastrada. Rode a migração do banco para as três
          entrarem.
        </p>
      ) : (
        <>
          <Grupo titulo="Acontecendo agora" temas={agora} />
          <Grupo titulo="Vêm por aí" temas={proximas} />
          <Grupo titulo="Sem data ou já passaram" temas={resto} />
        </>
      )}
    </div>
  );
}

function Grupo({ titulo, temas }: { titulo: string; temas: Tema[] }) {
  if (temas.length === 0) return null;

  return (
    <section className="mt-8">
      <SubTitulo>{titulo}</SubTitulo>
      <ul className="mt-3 space-y-2">
        {temas.map((t) => (
          <li key={t.id}>
            <Link
              href={`/admin/feiras?feira=${t.slug}`}
              className="caixa-painel flex flex-wrap items-center gap-3 p-4"
            >
              <span
                aria-hidden
                className="h-10 w-10 shrink-0 rounded-full"
                style={{ backgroundColor: t.cor }}
              />
              <span className="min-w-0 flex-1">
                <span
                  className="block text-[16px] font-bold"
                  style={{ color: "var(--color-v-texto)" }}
                >
                  {t.subtitulo ? `${t.subtitulo} ${t.nome}` : t.nome}
                </span>
                <span className="block text-[13px] texto-suave">
                  {periodoPorExtenso(t) ?? "Sem período marcado"}
                </span>
              </span>
              {t.publicado ? (
                <span
                  className="inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold tracking-[0.08em] uppercase"
                  style={{
                    backgroundColor: "var(--color-v-verde)",
                    color: "#FFFFFF",
                  }}
                >
                  No ar
                </span>
              ) : (
                <span
                  className="inline-flex items-center rounded-[4px] px-1.5 py-0.5 text-[10px] font-bold tracking-[0.08em] uppercase"
                  style={{
                    backgroundColor: "rgba(43, 35, 32, 0.12)",
                    color: "var(--color-v-texto)",
                  }}
                >
                  Rascunho
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
