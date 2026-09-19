import Image from "next/image";
import TiraRolante from "@/components/TiraRolante";
import MaoFrancesa from "@/components/MaoFrancesa";
import Link from "next/link";
import BarraBusca from "@/components/BarraBusca";
import CardLocal from "@/components/CardLocal";
import { buscarLocais, listarCategorias } from "@/lib/locais";
import { agoraNaCidade, DIAS } from "@/lib/horarios";
import { climaDeIvoti } from "@/lib/clima";

// A home muda conforme a hora (o que esta aberto agora), entao nao adianta
// deixar guardada por muito tempo.
export const revalidate = 60;

export default async function Home() {
  const [categorias, todos, abertos, clima] = await Promise.all([
    listarCategorias(),
    buscarLocais({ limite: 300 }),
    buscarLocais({ abertoAgora: true, limite: 300 }),
    climaDeIvoti(),
  ]);

  const principais = categorias.filter((c) => c.pai_id === null);
  const destaques = todos.filter((l) => l.destaque).slice(0, 8);
  const agora = agoraNaCidade();
  const saudacao =
    agora.minutos < 12 * 60
      ? "Bom dia!"
      : agora.minutos < 18 * 60
        ? "Boa tarde!"
        : "Boa noite!";

  return (
    <>
      {/* ---------------- topo ----------------
          Nao e um cartaz: e a parede enxaimel, com conteudo vivo em cada
          painel. A foto entra num vao, e nao atras de tudo; a hora, o clima
          e a contagem ficam em celulas separadas por madeira, no lugar de
          uma linha unica costurada por pontos medios.
      */}
      <section className="bg-creme">
        <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
          <div className="border-2 border-carvalho bg-creme">
            <div className="grid sm:grid-cols-[2fr_3fr]">
              <div className="relative min-h-52 border-b-2 border-carvalho sm:min-h-0 sm:border-r-2 sm:border-b-0">
                <Image
                  src="/fotos/portico-ivoti.jpg"
                  alt="O Pórtico de Ivoti, na entrada da cidade"
                  fill
                  priority
                  sizes="(max-width: 640px) 100vw, 40vw"
                  className="object-cover"
                />
              </div>

              <div className="divide-y-2 divide-carvalho">
                <div className="grid grid-cols-[1fr_auto] divide-x-2 divide-carvalho">
                  <p className="px-4 py-2.5 text-sm font-medium">
                    {saudacao} {DIAS[agora.diaSemana]}, {agora.hhmm}
                  </p>
                  {clima && (
                    <p
                      className="px-4 py-2.5 text-sm font-medium whitespace-nowrap"
                      title={clima.descricao}
                    >
                      {clima.graus}°C {clima.emoji}
                    </p>
                  )}
                </div>

                <div className="px-4 py-6 sm:px-6 sm:py-8">
                  <h1 className="font-[family-name:var(--font-titulo)] text-[2.75rem] leading-[0.95] font-bold tracking-tight text-tinta sm:text-6xl">
                    O Guia
                    <br />
                    de Ivoti
                  </h1>
                  <p className="mt-4 max-w-md text-tinta/70">
                    Onde comer, beber, passear e se hospedar — com horário de
                    hoje, endereço e rota no mapa.
                  </p>
                </div>

                <div className="px-4 py-4 sm:px-6">
                  <BarraBusca grande />
                </div>
              </div>
            </div>

            {/* A parede baixa: os numeros que respondem "o que da para fazer
                agora", cada um no seu vao. */}
            <div className="grid grid-cols-2 divide-x-2 divide-y-2 divide-carvalho border-t-2 border-carvalho sm:grid-cols-4 sm:divide-y-0">
              <Vao
                href="/explorar?aberto=1"
                numero={abertos.length}
                rotulo={abertos.length === 1 ? "aberto agora" : "abertos agora"}
                aceso
              />
              <Vao
                href="/explorar"
                numero={todos.length}
                rotulo={todos.length === 1 ? "lugar no guia" : "lugares no guia"}
              />
              <Vao href="/mapa" rotulo="Ver no mapa" />
              <Vao href="/chat" rotulo="Perguntar ao Guia" />
            </div>
          </div>
        </div>
      </section>

      <MaoFrancesa />

      {/* ---------------- categorias ---------------- */}
      {principais.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-xl font-semibold">Por onde começar</h2>
          <TiraRolante className="mt-4" nome="categorias">
            {principais.map((c) => (
              <Link
                key={c.id}
                href={`/explorar?categoria=${c.slug}`}
                className="flex w-32 shrink-0 flex-col items-center gap-2 border-2 border-carvalho bg-creme p-4 text-center transition hover:bg-cal-sombra"
              >
                <span className="text-3xl">{c.emoji}</span>
                <span className="text-sm leading-tight font-medium">
                  {c.nome}
                </span>
              </Link>
            ))}
          </TiraRolante>
        </section>
      )}

      {/* ---------------- aberto agora ---------------- */}
      <Secao
        titulo="Aberto agora"
        subtitulo="Dá pra ir agora mesmo"
        verMais="/explorar?aberto=1"
        locais={abertos.slice(0, 8)}
        vazio="Nada aberto neste horário por enquanto."
      />

      {/* ---------------- destaques ---------------- */}
      {destaques.length > 0 && (
        <Secao
          titulo="Destaques da cidade"
          subtitulo="Escolhidos a dedo"
          verMais="/explorar"
          locais={destaques}
        />
      )}

      {/* ---------------- convite pro chat ---------------- */}
      <section className="mx-auto max-w-6xl px-4 py-12">
        <div className="relative isolate overflow-hidden rounded-3xl px-6 py-14 text-center text-white sm:px-12">
          {/* O letreiro da entrada da cidade quebra o meio da home, que daqui
              pra baixo era tudo claro. O veu escuro segura a leitura do texto
              por cima das flores e do ceu. */}
          <Image
            src="/fotos/eu-amo-ivoti.jpg"
            alt=""
            aria-hidden
            fill
            sizes="(max-width: 1152px) 100vw, 1152px"
            className="-z-10 object-cover object-center"
          />
          <div
            aria-hidden
            className="absolute inset-0 -z-10 bg-mata-900/75 sm:bg-mata-900/70"
          />

          <p className="text-4xl">🌿</p>
          <h2 className="mt-3 text-2xl font-bold drop-shadow-sm sm:text-3xl">
            Não sabe o que fazer hoje?
          </h2>
          <p className="mx-auto mt-2 max-w-lg text-mata-50">
            Conte para o Guia o que você está com vontade de fazer — comer
            alguma coisa, sair com as crianças, um programa ao ar livre — que
            ele indica onde ir, com horário e tudo.
          </p>
          <Link
            href="/chat"
            className="mt-6 inline-block rounded-full bg-white px-6 py-3 font-semibold text-mata-800 transition hover:bg-mata-50"
          >
            Conversar com o Guia
          </Link>
        </div>
      </section>

      {/* ---------------- convite pros estabelecimentos ---------------- */}
      {todos.length < 10 && (
        <section className="mx-auto max-w-6xl px-4 pb-12">
          <div className="rounded-2xl border border-dashed border-mata-300 bg-white p-8 text-center">
            <h2 className="text-xl font-semibold">
              Tem um negócio em Ivoti?
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-tinta/65">
              Cadastre gratuitamente: fotos, horários, o que vocês fazem e o
              endereço no mapa. Quem procura na cidade encontra vocês aqui.
            </p>
            <Link
              href="/cadastrar"
              className="mt-5 inline-block rounded-full bg-sol-500 px-6 py-3 font-semibold text-white transition hover:bg-sol-600"
            >
              Cadastrar meu estabelecimento
            </Link>
          </div>
        </section>
      )}
    </>
  );
}

function Secao({
  titulo,
  subtitulo,
  verMais,
  locais,
  vazio,
}: {
  titulo: string;
  subtitulo?: string;
  verMais?: string;
  locais: Awaited<ReturnType<typeof buscarLocais>>;
  vazio?: string;
}) {
  if (locais.length === 0 && !vazio) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold">{titulo}</h2>
          {subtitulo && (
            <p className="text-sm text-tinta/55">{subtitulo}</p>
          )}
        </div>
        {verMais && locais.length > 0 && (
          <Link
            href={verMais}
            className="-my-2 shrink-0 py-2 text-sm font-semibold text-mata-600 hover:text-mata-800"
          >
            Ver todos →
          </Link>
        )}
      </div>

      {locais.length === 0 ? (
        <p className="mt-4 rounded-2xl border border-dashed border-mata-200 bg-white p-6 text-center text-sm text-tinta/55">
          {vazio}
        </p>
      ) : (
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {locais.map((l) => (
            <CardLocal key={l.id} local={l} />
          ))}
        </div>
      )}
    </section>
  );
}

/**
 * Um vão da parede baixa do topo.
 *
 * Com número quando há número a dizer; só com o rótulo quando é um caminho.
 * O ponto verde aparece em um único lugar no site inteiro — "aberto agora" —
 * para a cor não se gastar dizendo outras coisas.
 */
function Vao({
  href,
  numero,
  rotulo,
  aceso = false,
}: {
  href: string;
  numero?: number;
  rotulo: string;
  aceso?: boolean;
}) {
  return (
    <Link
      href={href}
      className="group flex min-h-20 flex-col justify-center px-4 py-3 transition hover:bg-cal-sombra"
    >
      {numero !== undefined && (
        <span className="font-[family-name:var(--font-titulo)] text-3xl leading-none font-bold text-tinta">
          {numero}
        </span>
      )}
      <span className="mt-1 flex items-center gap-1.5 text-sm text-tinta/70 group-hover:text-tinta">
        {aceso && (
          <span className="h-2 w-2 shrink-0 rounded-full bg-mata-600" />
        )}
        {rotulo}
      </span>
    </Link>
  );
}
