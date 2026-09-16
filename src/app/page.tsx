import Image from "next/image";
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
      {/* ---------------- topo ---------------- */}
      <section className="relative overflow-hidden border-b border-mata-100">
        {/* O Portico e o cartao-postal de quem chega em Ivoti — e a primeira
            coisa que a pessoa ve no site tambem. O veu por cima garante que o
            titulo continue legivel em qualquer tela. */}
        <Image
          src="/fotos/portico-ivoti.jpg"
          alt="Pórtico de Ivoti"
          fill
          priority
          sizes="100vw"
          className="object-cover object-center"
        />
        {/* No celular a foto entra num recorte estreito e o texto cai em cima
            do telhado claro, entao o veu vai mais forte ali. */}
        <div
          aria-hidden
          className="absolute inset-0 bg-linear-to-b from-mata-950/80 via-mata-950/65 to-mata-950/80 sm:from-mata-950/70 sm:via-mata-950/45 sm:to-mata-950/75"
        />

        <div className="relative mx-auto max-w-4xl px-4 py-16 text-center sm:py-24">
          <p className="text-sm font-semibold text-sol-300">
            {saudacao} É {DIAS[agora.diaSemana].toLowerCase()},{" "}
            {agora.hhmm} em Ivoti
            {clima && (
              <>
                {" · "}
                <span title={clima.descricao}>
                  {clima.graus}°C {clima.emoji}
                </span>
              </>
            )}
          </p>
          <h1 className="mt-3 text-4xl leading-tight font-bold text-white drop-shadow-sm sm:text-5xl">
            O Guia de <span className="text-sol-300">Ivoti</span>
          </h1>
          <p className="mx-auto mt-3 max-w-xl text-white/80">
            Onde comer, beber, passear e se hospedar. Tudo num lugar só — com
            mapa, horários e um guia que responde suas perguntas.
          </p>

          <div className="mx-auto mt-7 max-w-xl">
            <BarraBusca grande />
          </div>

          <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
            <Link
              href="/explorar?aberto=1"
              className="rounded-full border border-mata-200 bg-white px-3 py-1.5 hover:bg-mata-50"
            >
              🟢 Aberto agora
            </Link>
            <Link
              href="/mapa"
              className="rounded-full border border-mata-200 bg-white px-3 py-1.5 hover:bg-mata-50"
            >
              🗺️ Ver no mapa
            </Link>
            <Link
              href="/chat"
              className="rounded-full bg-mata-600 px-3 py-1.5 font-semibold text-white hover:bg-mata-700"
            >
              💬 Pergunte ao Gui
            </Link>
          </div>
        </div>
      </section>

      {/* ---------------- categorias ---------------- */}
      {principais.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-10">
          <h2 className="text-xl font-semibold">Por onde começar</h2>
          <div className="sem-barra mt-4 flex gap-3 overflow-x-auto pb-2">
            {principais.map((c) => (
              <Link
                key={c.id}
                href={`/explorar?categoria=${c.slug}`}
                className="flex w-32 shrink-0 flex-col items-center gap-2 rounded-2xl border border-mata-100 bg-white p-4 text-center transition hover:-translate-y-0.5 hover:border-mata-300 hover:shadow"
              >
                <span className="text-3xl">{c.emoji}</span>
                <span className="text-sm leading-tight font-medium">
                  {c.nome}
                </span>
              </Link>
            ))}
          </div>
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
            Conte para o Gui o que você está com vontade de fazer — comer
            alguma coisa, sair com as crianças, um programa ao ar livre — que
            ele indica onde ir, com horário e tudo.
          </p>
          <Link
            href="/chat"
            className="mt-6 inline-block rounded-full bg-white px-6 py-3 font-semibold text-mata-800 transition hover:bg-mata-50"
          >
            Conversar com o Gui
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
            className="shrink-0 text-sm font-semibold text-mata-600 hover:text-mata-800"
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
