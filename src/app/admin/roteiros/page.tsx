import Link from "next/link";
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
    <div className="mx-auto max-w-3xl px-4 py-8">
      <nav className="text-sm text-tinta/55">
        <Link href="/admin" className="hover:text-mata-700">
          Administração
        </Link>
      </nav>

      <div className="mt-1 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-xl font-bold">Roteiros prontos</h1>
          <p className="text-sm text-tinta/55">
            Os passeios que aparecem no Explorar. As paradas viram rota no mapa.
          </p>
        </div>
        <NovoRoteiro />
      </div>

      {roteiros.length === 0 ? (
        <div className="mt-6 rounded-2xl border border-dashed border-mata-200 bg-white p-10 text-center">
          <p className="text-3xl">🗺️</p>
          <p className="mt-2 font-semibold">Nenhum roteiro ainda</p>
          <p className="mx-auto mt-1 max-w-sm text-sm text-tinta/60">
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
      <h2 className="font-semibold">
        {titulo} ({roteiros.length})
      </h2>
      <ul className="mt-3 space-y-2">
        {roteiros.map((r) => (
          <li
            key={r.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-mata-100 bg-white px-4 py-3"
          >
            <span className="min-w-0">
              <span className="block truncate font-medium">{r.titulo}</span>
              <span className="text-sm text-tinta/50">
                {r.quantas} {r.quantas === 1 ? "parada" : "paradas"}
                {r.slug ? ` · /roteiros/${r.slug}` : " · sem endereço"}
              </span>
            </span>

            <span className="flex shrink-0 items-center gap-2">
              {r.publicado && r.slug && (
                <Link
                  href={`/roteiros/${r.slug}`}
                  className="text-xs text-tinta/50 underline"
                >
                  ver
                </Link>
              )}
              <Link
                href={`/admin/roteiros/${r.id}`}
                className="rounded-lg bg-mata-600 px-4 py-1.5 text-sm font-semibold text-white"
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
