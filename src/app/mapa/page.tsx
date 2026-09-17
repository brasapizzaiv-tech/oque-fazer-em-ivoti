import type { Metadata } from "next";
import TiraRolante from "@/components/TiraRolante";
import Link from "next/link";
import Mapa from "@/components/Mapa";
import { buscarLocais, listarCategorias } from "@/lib/locais";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Mapa de Ivoti",
  description: "Todos os lugares do guia no mapa, com rota e o que está perto.",
};

export default async function PaginaMapa({ searchParams }: PageProps<"/mapa">) {
  const params = await searchParams;
  const categoria = Array.isArray(params.categoria)
    ? params.categoria[0]
    : params.categoria;

  const [categorias, locais] = await Promise.all([
    listarCategorias(),
    buscarLocais({ categoria, limite: 500 }),
  ]);

  const principais = categorias.filter((c) => c.pai_id === null);
  const noMapa = locais.filter((l) => l.lat != null && l.lng != null);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <h1 className="text-2xl font-bold">Mapa de Ivoti</h1>
      <p className="mt-1 text-sm text-tinta/60">
        {noMapa.length} {noMapa.length === 1 ? "lugar" : "lugares"} no mapa.
        Toque num pino pra ver os detalhes e traçar a rota.
      </p>

      <TiraRolante className="mt-4" nome="categorias">
        <Filtro href="/mapa" ativo={!categoria}>
          Tudo
        </Filtro>
        {principais.map((c) => (
          <Filtro
            key={c.id}
            href={`/mapa?categoria=${c.slug}`}
            ativo={categoria === c.slug}
          >
            {c.emoji} {c.nome}
          </Filtro>
        ))}
      </TiraRolante>

      <div className="mt-4">
        <Mapa locais={noMapa} altura="h-[65vh]" />
      </div>

      {locais.length > noMapa.length && (
        <p className="mt-3 text-xs text-tinta/50">
          {locais.length - noMapa.length}{" "}
          {locais.length - noMapa.length === 1
            ? "lugar ainda não marcou"
            : "lugares ainda não marcaram"}{" "}
          a posição no mapa.
        </p>
      )}
    </div>
  );
}

function Filtro({
  href,
  ativo,
  children,
}: {
  href: string;
  ativo?: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={[
        "shrink-0 rounded-full border px-4 py-2 text-sm font-medium whitespace-nowrap transition",
        ativo
          ? "border-mata-600 bg-mata-600 text-white"
          : "border-mata-200 bg-white text-tinta/75 hover:bg-mata-50",
      ].join(" ")}
    >
      {children}
    </Link>
  );
}
