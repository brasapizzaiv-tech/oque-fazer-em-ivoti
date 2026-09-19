import Link from "next/link";
import MenuMobile from "./MenuMobile";

const LINKS = [
  { href: "/explorar", texto: "Explorar" },
  { href: "/mapa", texto: "Mapa" },
  { href: "/agenda", texto: "Agenda" },
  { href: "/chat", texto: "Pergunte ao Guia" },
];

export default function Cabecalho() {
  return (
    <header className="sticky top-0 z-40 border-b-2 border-carvalho bg-creme/95 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <span className="grid h-9 w-9 place-items-center bg-carvalho text-lg">
            🌿
          </span>
          <span className="font-[family-name:var(--font-titulo)] text-lg leading-5 font-semibold">
            O Guia
            <span className="block text-xs font-medium text-sol-700">
              de Ivoti
            </span>
          </span>
        </Link>

        <nav className="ml-auto hidden items-center gap-1 md:flex">
          {LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="px-3 py-2 text-sm font-medium text-tinta/70 transition hover:text-tinta"
            >
              {l.texto}
            </Link>
          ))}
          <Link
            href="/painel"
            className="ml-2 border-2 border-carvalho px-3 py-2 text-sm font-semibold text-tinta transition hover:bg-carvalho hover:text-creme"
          >
            Sou um estabelecimento
          </Link>
        </nav>

        <MenuMobile links={LINKS} />
      </div>
    </header>
  );
}
