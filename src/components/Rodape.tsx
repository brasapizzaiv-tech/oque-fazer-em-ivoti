import Link from "next/link";

export default function Rodape() {
  return (
    <footer className="mt-16 border-t border-mata-100 bg-white">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-3">
        <div>
          <p className="font-[family-name:var(--font-titulo)] text-lg font-semibold">
            O Guia de Ivoti
          </p>
          <p className="mt-2 text-sm text-tinta/60">
            O guia da cidade: onde comer, beber, passear e se hospedar. Feito
            por gente daqui.
          </p>
        </div>

        <div className="text-sm">
          <p className="font-semibold">Descobrir</p>
          <ul className="mt-1 text-tinta/70">
            <li>
              <Link href="/explorar" className="-mx-2 inline-block px-2 py-2 hover:text-mata-700">
                Explorar tudo
              </Link>
            </li>
            <li>
              <Link href="/mapa" className="-mx-2 inline-block px-2 py-2 hover:text-mata-700">
                Mapa da cidade
              </Link>
            </li>
            <li>
              <Link href="/agenda" className="-mx-2 inline-block px-2 py-2 hover:text-mata-700">
                Agenda de eventos
              </Link>
            </li>
            <li>
              <Link href="/chat" className="-mx-2 inline-block px-2 py-2 hover:text-mata-700">
                Pergunte ao Guia
              </Link>
            </li>
          </ul>
        </div>

        <div className="text-sm">
          <p className="font-semibold">Para estabelecimentos</p>
          <ul className="mt-1 text-tinta/70">
            <li>
              <Link href="/cadastrar" className="-mx-2 inline-block px-2 py-2 hover:text-mata-700">
                Cadastrar meu negócio (grátis)
              </Link>
            </li>
            <li>
              <Link href="/painel" className="-mx-2 inline-block px-2 py-2 hover:text-mata-700">
                Entrar no painel
              </Link>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-mata-50 py-4 text-center text-xs text-tinta/50">
        Ivoti · Rio Grande do Sul
      </div>
    </footer>
  );
}
