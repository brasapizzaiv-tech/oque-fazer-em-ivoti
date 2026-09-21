import Image from "next/image";
import Link from "next/link";
import { Legenda, SeloStatus } from "./pecas";

/* ==================================================================== */
/* O card com foto                                                      */
/* ==================================================================== */

/**
 * A foto ocupa o card inteiro e o texto vem por cima, na base.
 *
 * Sem moldura e sem faixa: o que separa o card do fundo é a própria foto.
 * O degradê só começa a escurecer aos 30% da altura, para não sujar o céu
 * nem o telhado — a parte de baixo de uma foto de rua quase sempre é chão
 * ou parede, onde o escuro não custa nada.
 *
 * O texto é branco com sombra suave porque nenhuma foto é previsível: a
 * mesma praça é clara ao meio-dia e escura às seis.
 */
export default function CardComFoto({
  href,
  foto,
  alto = 150,
  etiqueta,
  corDaEtiqueta,
  titulo,
  apoio,
  status,
  canto,
  className = "",
}: {
  href: string;
  foto: string | null;
  /** 150px na lista do celular, 180 no computador, 260 nos eventos. */
  alto?: number;
  etiqueta?: string;
  corDaEtiqueta?: string;
  titulo: string;
  /** Categoria, bairro, local do evento — a linha fina embaixo do nome. */
  apoio?: string;
  status?: "aberto" | "fechado";
  /** A distância, ou a data — canto de baixo à direita. */
  canto?: string;
  className?: string;
}) {
  return (
    <Link
      href={href}
      className={`relative block overflow-hidden rounded-[16px] ${className}`}
      style={{ height: alto }}
    >
      {foto ? (
        <Image
          src={foto}
          alt=""
          fill
          sizes="(max-width: 1024px) 100vw, 420px"
          className="object-cover"
        />
      ) : (
        <span
          aria-hidden
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, #d8cfc2 0%, #bfb3a2 50%, #a99c8a 100%)",
          }}
        />
      )}

      <span aria-hidden className="veu-da-foto absolute inset-0" />

      <span className="absolute inset-x-0 bottom-0 flex flex-col gap-1 p-3.5">
        {etiqueta && (
          <span className="flex">
            <Legenda cor={corDaEtiqueta ?? "var(--color-v-rosa-clara)"}>
              {etiqueta}
            </Legenda>
          </span>
        )}

        <span
          className="sobre-foto block text-[17px] leading-tight font-bold text-white"
          style={{ fontFamily: "var(--fonte-titulo-nova)" }}
        >
          {titulo}
        </span>

        <span className="flex flex-wrap items-center gap-2">
          {apoio && (
            <span className="sobre-foto text-[13px] text-white/85">
              {apoio}
            </span>
          )}
          {status && <SeloStatus tipo={status} sobreFoto />}
          {canto && (
            <span className="sobre-foto ml-auto text-[12px] font-medium text-white/85">
              {canto}
            </span>
          )}
        </span>
      </span>
    </Link>
  );
}
