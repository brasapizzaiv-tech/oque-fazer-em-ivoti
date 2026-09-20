import Link from "next/link";
import { TituloBloco, TituloPainel } from "@/components/painel/pecas";
import { listarRoteirosCurados } from "@/lib/roteiros-curados";
import NovoRoteiro from "./NovoRoteiro";

export const dynamic = "force-dynamic";

export default async function RoteirosDoAdmin() {
  // Com os rascunhos: esta e a tela de montagem, e roteiro meio pronto
  // precisa aparecer para poder ser terminado.
  const roteiros = await listarRoteirosCurados({ incluirRascunhos: true });

  const publicados = roteiros.filter((r) => r.publicado);
  const rascunhos = roteiros.filter((r) => !r.publicado);

  return (
    <div>
      <TituloPainel
        apoio="Os passeios que aparecem no Explorar. As paradas viram rota no mapa."
        acao={<NovoRoteiro />}
      >
        Roteiros prontos
      </TituloPainel>

      {roteiros.length === 0 ? (
        <div className="mt-6 caixa-painel border-dashed p-10 text-center">
          <p className="text-3xl">🗺️</p>
          <p className="mt-2 font-semibold">Nenhum roteiro ainda</p>
          <p className="mx-auto mt-1 max-w-sm text-sm texto-suave">
            Um bom primeiro: &ldquo;Ivoti em um dia&rdquo;, com o Memorial, um
            almoço e a Igreja São Pedro.
          </p>
        </div>
      ) : (
        <>
          <Secao titulo="No guia" roteiros={publicados} />
          <Secao titulo="Rascunhos" roteiros={rascunhos} />
        </>
      )}
    </div>
  );
}

function Secao({
  titulo,
  roteiros,
}: {
  titulo: string;
  roteiros: Awaited<ReturnType<typeof listarRoteirosCurados>>;
}) {
  if (roteiros.length === 0) return null;

  return (
    <section className="mt-8">
      <TituloBloco>
        {titulo} ({roteiros.length})
      </TituloBloco>
      <ul className="mt-3 space-y-2">
        {roteiros.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between gap-3 border-2 border-[color:var(--color-madeira)]/30 bg-[color:var(--color-superficie)] px-4 py-3"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">{r.titulo}</span>
              <span className="text-sm texto-suave">
                {r.quantas} {r.quantas === 1 ? "parada" : "paradas"}
                {r.slug ? ` · /roteiros/${r.slug}` : " · sem endereço"}
              </span>
            </span>

            <span className="flex shrink-0 items-center gap-2">
              {r.publicado && r.slug && (
                <Link
                  href={`/roteiros/${r.slug}`}
                  className="text-xs texto-suave underline"
                >
                  ver
                </Link>
              )}
              <Link
                href={`/admin/roteiros/${r.id}`}
                className="botao-cheio px-4 py-2 text-[14px]"
              >
                Montar
              </Link>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
