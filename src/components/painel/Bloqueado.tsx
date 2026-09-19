import { MODULOS, type Modulo } from "@/lib/planos";

const WHATSAPP_DO_GUIA = "5551998323298";

/**
 * O véu que cobre um módulo premium para quem está no plano gratuito.
 *
 * Mostra o conteúdo real por baixo, desfocado. Ver o que se está perdendo
 * vende muito melhor que uma tela vazia dizendo "indisponível" — o comerciante
 * enxerga os próprios números borrados e quer saber o que são.
 *
 * O conteúdo desfocado não é acessível nem clicável: `inert` tira do caminho
 * do teclado e do leitor de tela, e `aria-hidden` evita que ele seja lido em
 * voz alta por trás do aviso.
 */
export default function Bloqueado({
  modulo,
  nome,
  children,
}: {
  modulo: Modulo;
  /** Nome do estabelecimento, para a mensagem já sair pronta. */
  nome?: string;
  /** A prévia real, que aparece borrada atrás do aviso. */
  children?: React.ReactNode;
}) {
  const { nome: titulo, convite } = MODULOS[modulo];

  const mensagem = encodeURIComponent(
    `Olá! Quero saber sobre o plano Premium do Guia de Ivoti${nome ? ` para o ${nome}` : ""}.`,
  );

  return (
    <div className="relative isolate overflow-hidden border-2 border-carvalho bg-creme">
      {children && (
        <div
          aria-hidden
          inert
          className="pointer-events-none select-none blur-[6px] saturate-50"
        >
          {children}
        </div>
      )}

      <div
        className={[
          "grid place-items-center px-6 py-10 text-center",
          children
            ? "absolute inset-0 bg-white/70 backdrop-blur-[2px]"
            : "bg-cal-sombra/60",
        ].join(" ")}
      >
        <div className="max-w-sm">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-sol-100 text-xl mx-auto">
            🔒
          </span>
          <p className="mt-3 font-semibold">{titulo} é do plano Premium</p>
          <p className="mt-1.5 text-sm text-tinta/65">{convite}</p>
          <a
            href={`https://wa.me/${WHATSAPP_DO_GUIA}?text=${mensagem}`}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-5 inline-block rounded-full bg-sol-500 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-sol-600"
          >
            Quero saber mais
          </a>
        </div>
      </div>
    </div>
  );
}
