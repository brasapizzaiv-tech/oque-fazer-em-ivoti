import Image from "next/image";
import Link from "next/link";
import { Legenda, SeloStatus } from "./pecas";

/* ==================================================================== */
/* O card com foto                                                      */
/* ==================================================================== */

type Dados = {
  href: string;
  foto: string | null;
  etiqueta?: string;
  corDaEtiqueta?: string;
  titulo: string;
  /** Categoria, bairro, local do evento — a linha fina embaixo do nome. */
  apoio?: string;
  status?: "aberto" | "fechado";
  /** A distância, ou a data — canto de baixo à direita. */
  canto?: string;
  className?: string;
};

/** O que entra no lugar da foto quando o cadastro ainda não tem uma. */
function SemFoto() {
  return (
    <span
      aria-hidden
      className="absolute inset-0"
      style={{
        background:
          "linear-gradient(135deg, #d8cfc2 0%, #bfb3a2 50%, #a99c8a 100%)",
      }}
    />
  );
}

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
 *
 * Com alto="quadrado" o card muda de desenho: ver CardQuadrado.
 */
export default function CardComFoto({
  alto = 150,
  ...dados
}: Dados & {
  /**
   * A altura em pixels (180 na fileira de eventos, 260 no computador), ou
   * "quadrado" para o card que vai em grade, na lista de lugares.
   */
  alto?: number | "quadrado";
}) {
  if (alto === "quadrado") return <CardQuadrado {...dados} />;

  const {
    href,
    foto,
    etiqueta,
    corDaEtiqueta,
    titulo,
    apoio,
    status,
    canto,
    className = "",
  } = dados;

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
        <SemFoto />
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

/**
 * O card da lista de lugares: a foto num quadrado e o texto embaixo dela.
 *
 * A lista era feita de faixas de um lado a outro da tela, quatro vezes mais
 * largas do que altas. Uma foto de celular, que é quatro por três, perdia
 * dois terços da altura ali dentro: da igreja sobrava o telhado, da ponte
 * sobrava um arco. Em grade de quadrados a foto aparece quase inteira.
 *
 * O texto sai de cima da foto porque o quadrado do celular tem metade da
 * tela: nome, bairro e categoria por cima cobriam mais da metade da imagem,
 * que era justamente o que se queria mostrar. Só o selo de aberto ou
 * fechado fica sobre a foto, no canto, onde ocupa pouco.
 */
function CardQuadrado({
  href,
  foto,
  etiqueta,
  corDaEtiqueta,
  titulo,
  apoio,
  status,
  canto,
  className = "",
}: Dados) {
  return (
    <Link
      href={href}
      className={`vidro flex h-full flex-col overflow-hidden ${className}`}
    >
      <span className="relative block aspect-square">
        {foto ? (
          <Image
            src={foto}
            alt=""
            fill
            // Duas colunas no celular e três no computador: pedir a largura
            // da tela inteira baixaria uma foto três vezes maior do que cabe.
            sizes="(max-width: 1024px) 50vw, 260px"
            className="object-cover"
          />
        ) : (
          <SemFoto />
        )}

        {status && (
          <span className="absolute top-2 left-2 flex">
            <SeloStatus tipo={status} sobreFoto />
          </span>
        )}
      </span>

      <span className="flex flex-1 flex-col gap-0.5 px-3 pt-2.5 pb-3">
        {etiqueta && (
          <span className="flex">
            <Legenda cor={corDaEtiqueta}>{etiqueta}</Legenda>
          </span>
        )}

        <span
          className="line-clamp-2 text-[15px] leading-tight font-bold lg:text-[16px]"
          style={{
            fontFamily: "var(--fonte-titulo-nova)",
            color: "var(--color-v-texto)",
          }}
        >
          {titulo}
        </span>

        {(apoio || canto) && (
          <span
            className="flex flex-wrap items-baseline gap-x-2 text-[13px]"
            style={{ color: "var(--color-v-texto-suave)" }}
          >
            {apoio && <span>{apoio}</span>}
            {canto && (
              <span className="ml-auto text-[12px] font-medium">{canto}</span>
            )}
          </span>
        )}
      </span>
    </Link>
  );
}
