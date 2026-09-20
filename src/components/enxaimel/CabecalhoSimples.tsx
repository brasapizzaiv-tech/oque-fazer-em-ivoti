import Link from "next/link";
import { FaixaTelhas, Logo } from "./pecas";

/**
 * A barra de cima das telas de conta, no celular.
 *
 * Entrar, cadastrar e trocar senha nao tem foto nem busca: sao formularios, e
 * uma foto grande ali so empurraria o campo para baixo. Mas sem nada a tela
 * ficava sem marca e sem volta — quem abre um formulario de senha por um link
 * de e-mail precisa saber em que site esta.
 *
 * No computador some: la a barra da casca ja faz esse papel.
 */
export default function CabecalhoSimples() {
  return (
    <header className="lg:hidden">
      <div
        className="px-4 py-3"
        style={{ backgroundColor: "var(--color-madeira)" }}
      >
        <Link href="/">
          <Logo claro />
        </Link>
      </div>
      <FaixaTelhas />
    </header>
  );
}
