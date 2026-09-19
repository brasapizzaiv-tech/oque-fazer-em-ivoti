import Link from "next/link";
import Cabecalho, { BuscaCabecalho } from "@/components/enxaimel/Cabecalho";
import {
  BlocoRoteiro,
  CardEvento,
  CardPromocao,
  Fileira,
  Vazio,
} from "@/components/enxaimel/blocos";
import {
  Chip,
  FaixaEnxaimel,
  TituloSecao,
} from "@/components/enxaimel/pecas";
import { listarCategorias } from "@/lib/locais";
import { eventosVisiveis } from "@/lib/eventos";
import { promocoesDeHoje } from "@/lib/promocoes-de-hoje";
import { hojeEmIvoti } from "@/lib/planos";

// A pagina muda conforme a hora — o que acontece hoje, o que esta valendo —
// entao nao adianta guardar por muito tempo.
export const revalidate = 60;

export default async function Inicio() {
  const [categorias, eventos, promocoes] = await Promise.all([
    listarCategorias(),
    eventosVisiveis({ ate: hojeEmIvoti(), limite: 8 }),
    promocoesDeHoje(4),
  ]);

  const principais = categorias.filter((c) => c.pai_id === null);

  return (
    <div style={{ backgroundColor: "var(--color-reboco)" }}>
      <Cabecalho foto="/fotos/eu-amo-ivoti.jpg" alt="">
        <BuscaCabecalho />
      </Cabecalho>

      {/* As categorias logo abaixo da busca: quem nao sabe o que procurar
          escolhe por aqui, e quem sabe ja digitou acima. */}
      <div className="pt-4">
        <Fileira>
          <Chip href="/explorar" ativo>
            Todos
          </Chip>
          {principais.map((c) => (
            <Chip
              key={c.id}
              href={`/explorar?categoria=${c.slug}`}
              flor={c.slug === "natureza"}
            >
              {c.nome}
            </Chip>
          ))}
        </Fileira>
      </div>

      <section className="pt-7">
        <div className="px-4">
          <TituloSecao selo="evento">Acontece hoje</TituloSecao>
        </div>
        <div className="mt-3">
          {eventos.length === 0 ? (
            <Vazio>
              Nada marcado para hoje.{" "}
              <Link href="/agenda" className="font-bold underline">
                Ver a agenda
              </Link>
            </Vazio>
          ) : (
            <Fileira>
              {eventos.map((e, i) => (
                <CardEvento
                  key={e.id}
                  evento={e}
                  variante={i % 2 === 0 ? 1 : 2}
                />
              ))}
            </Fileira>
          )}
        </div>
      </section>

      <section className="px-4 pt-8">
        <TituloSecao selo="promocao">Promoções de hoje</TituloSecao>
        <div className="mt-3 space-y-3">
          {promocoes.length === 0 ? (
            <Vazio>Nenhuma promoção valendo hoje.</Vazio>
          ) : (
            promocoes.map((p, i) => (
              <CardPromocao
                key={p.id}
                promocao={p}
                variante={i % 2 === 0 ? 1 : 2}
              />
            ))
          )}
        </div>
      </section>

      <div className="pt-8">
        <FaixaEnxaimel />
      </div>

      <BlocoRoteiro />
    </div>
  );
}
