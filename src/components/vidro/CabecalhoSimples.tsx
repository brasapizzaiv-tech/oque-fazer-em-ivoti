import Image from "next/image";
import Link from "next/link";
import { Logo } from "./pecas";

/**
 * A barra de cima das telas de conta, no celular.
 *
 * Entrar, cadastrar e trocar senha não têm foto nem busca: são
 * formulários, e uma foto grande ali só empurraria o campo para baixo.
 * Mas sem nada a tela ficava sem marca e sem volta — quem abre um
 * formulário de senha por um link de e-mail precisa saber em que site
 * está.
 *
 * A tira de foto é fina e existe por uma razão técnica além da estética:
 * o logo vai sobre ela em branco, e o vidro do formulário logo abaixo
 * precisa de imagem por baixo para o desfoque valer.
 *
 * No computador some: lá a barra da casca já faz esse papel.
 */
export default function CabecalhoSimples() {
  return (
    <header className="relative isolate px-4 py-3 lg:hidden">
      <Image
        src="/fotos/eu-amo-ivoti.jpg"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-10 object-cover object-center"
      />
      <div aria-hidden className="veu-do-topo absolute inset-0 -z-10" />
      <Link href="/">
        <Logo sobreFoto />
      </Link>
    </header>
  );
}
