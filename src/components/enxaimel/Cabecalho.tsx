import Image from "next/image";
import { FaixaTelhas, Logo } from "./pecas";

/**
 * O cabeçalho: foto da cidade sob um véu marrom, com as telhas na base.
 *
 * O véu não é enfeite — sem ele o texto branco morre no céu claro de
 * qualquer foto de Ivoti, que são todas ensolaradas. Fica em 78% de
 * opacidade, dentro da faixa que a especificação pede, porque abaixo disso o
 * nome começa a brigar com o telhado do Pórtico.
 *
 * A faixa de telhas na base repete o desenho do telhado das casas enxaimel e
 * faz o papel de rodapé da peça: separa o cabeçalho do conteúdo sem precisar
 * de linha nem sombra.
 */
export default function Cabecalho({
  foto = "/fotos/eu-amo-ivoti.jpg",
  alt = "",
  nome,
  children,
  altura = "auto",
}: {
  foto?: string;
  alt?: string;
  nome?: string;
  /** A busca, o título da tela, o que a página precisar sob o logo. */
  children?: React.ReactNode;
  altura?: string;
}) {
  return (
    <header
      // No computador quem manda e a barra unica da casca: cabecalho que
      // muda de pagina para pagina faz a pessoa reprocurar o mesmo botao.
      className="relative isolate overflow-hidden lg:hidden"
      style={{ minHeight: altura }}
    >
      <Image
        src={foto}
        alt={alt}
        fill
        priority
        sizes="100vw"
        className="object-cover"
      />
      <div
        aria-hidden
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(46, 26, 16, 0.78)" }}
      />

      <div className="relative px-4 pt-4 pb-5">
        <Logo nome={nome} claro />
        {children && <div className="mt-4">{children}</div>}
      </div>

      <div className="relative">
        <FaixaTelhas />
      </div>
    </header>
  );
}

/**
 * O campo de busca do cabeçalho.
 *
 * Fundo claro sobre o véu escuro: é o único elemento que precisa saltar,
 * porque é o que a pessoa veio fazer.
 */
export function BuscaCabecalho({
  placeholder = "O que você procura em Ivoti?",
}: {
  placeholder?: string;
}) {
  return (
    <form action="/explorar" className="flex gap-2">
      <input
        name="q"
        placeholder={placeholder}
        aria-label="Buscar no guia"
        className="h-12 w-full rounded-[11px] px-4 text-[14px] outline-none"
        style={{
          backgroundColor: "var(--color-superficie)",
          color: "var(--color-texto)",
          border: "2px solid var(--color-madeira)",
        }}
      />
    </form>
  );
}
