import Link from "next/link";
import { NOME_DO_SITE, WHATSAPP_DO_GUIA } from "@/lib/marca";
import {
  DIAS_GRATIS,
  MODULOS,
  PLANOS,
  PLANO_DOS_DIAS_GRATIS,
  podeUsar,
  type Modulo,
} from "@/lib/planos";

/**
 * O véu que cobre um módulo para quem está num plano abaixo do dele.
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
  antesDeIrAoAr = false,
  children,
}: {
  modulo: Modulo;
  /** Nome do estabelecimento, para a mensagem já sair pronta. */
  nome?: string;
  /**
   * O lugar ainda não entrou no ar, então os dias grátis nem começaram.
   * Se o módulo é dos que os dias grátis liberam, a tranca é só questão de
   * tempo, e o aviso diz isso em vez de oferecer um plano.
   */
  antesDeIrAoAr?: boolean;
  /** A prévia real, que aparece borrada atrás do aviso. */
  children?: React.ReactNode;
}) {
  const { nome: titulo, convite, exige } = MODULOS[modulo];
  const plano = PLANOS[exige].nome;
  const esperando = antesDeIrAoAr && podeUsar(modulo, PLANO_DOS_DIAS_GRATIS);

  const mensagem = encodeURIComponent(
    `Olá! Quero saber sobre o plano ${plano} do ${NOME_DO_SITE}${nome ? ` para o ${nome}` : ""}.`,
  );

  return (
    <div className="relative isolate overflow-hidden caixa-painel">
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
            : "bg-[color:var(--color-v-fundo)]/60",
        ].join(" ")}
      >
        <div className="max-w-sm">
          <span className="grid h-11 w-11 place-items-center rounded-full bg-[color:var(--color-v-fundo)] text-xl mx-auto">
            {esperando ? "⏳" : "🔒"}
          </span>
          {esperando ? (
            <>
              <p className="mt-3 font-semibold">
                {titulo} abre quando o seu lugar entrar no ar
              </p>
              <p className="mt-1.5 text-sm texto-suave">
                Nos {DIAS_GRATIS} dias grátis você usa tudo do plano{" "}
                {PLANOS[PLANO_DOS_DIAS_GRATIS].nome}, sem pagar. A contagem
                começa no dia em que o cadastro é publicado.
              </p>
              <Link
                href="/painel"
                className="mt-5 inline-block rounded-[9px] bg-[color:var(--color-v-torii)] px-6 py-3 text-[14px] font-bold text-[#FFFFFF] transition"
              >
                Ver meu cadastro
              </Link>
            </>
          ) : (
            <>
              <p className="mt-3 font-semibold">
                {titulo} é do plano {plano}
              </p>
              <p className="mt-1.5 text-sm texto-suave">{convite}</p>
              <a
                href={`https://wa.me/${WHATSAPP_DO_GUIA}?text=${mensagem}`}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-5 inline-block rounded-[9px] bg-[color:var(--color-v-torii)] px-6 py-3 text-[14px] font-bold text-[#FFFFFF] transition"
              >
                Quero saber mais
              </a>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
