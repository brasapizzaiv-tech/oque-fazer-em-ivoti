"use client";

import { MAXIMO_DE_CATEGORIAS_EXTRAS } from "@/lib/categorias";
import type { Categoria } from "@/lib/tipos";

/**
 * A categoria principal do lugar e as outras em que ele também aparece.
 *
 * Nasceu em 26/11/2026, quando um comerciante parou no cadastro: o lugar
 * dele é café colonial, padaria e confeitaria, e o formulário só aceitava
 * uma resposta. A principal continua sendo uma só, porque é ela que
 * aparece junto do nome e que dá o emoji do pino. As outras entram por
 * baixo, uma de cada vez, até o teto.
 *
 * É usado nos dois formulários do painel (o de criar e o de editar), para
 * a pergunta ser feita igual nos dois.
 */
export default function EscolherCategorias({
  categorias,
  principal,
  extras,
  aoMudarPrincipal,
  aoMudarExtras,
  obrigatoria = false,
  rotulo = "Categoria principal",
}: {
  categorias: Categoria[];
  /** O id da principal, como texto; vazio quando ainda não escolheu. */
  principal: string;
  extras: number[];
  aoMudarPrincipal: (id: string) => void;
  aoMudarExtras: (ids: number[]) => void;
  /** No cadastro novo não dá para seguir sem dizer o que o lugar é. */
  obrigatoria?: boolean;
  rotulo?: string;
}) {
  const porId = new Map(categorias.map((c) => [c.id, c]));
  const cheio = extras.length >= MAXIMO_DE_CATEGORIAS_EXTRAS;

  function mudarPrincipal(id: string) {
    aoMudarPrincipal(id);
    // A que virou principal não pode continuar entre as outras.
    if (id && extras.includes(Number(id))) {
      aoMudarExtras(extras.filter((e) => e !== Number(id)));
    }
  }

  return (
    <div className="space-y-4">
      <label className="block">
        <span className="text-sm font-medium">{rotulo}</span>
        <span className="block text-xs texto-suave">
          É a que aparece junto do nome e no pino do mapa.
        </span>
        <select
          required={obrigatoria}
          value={principal}
          onChange={(e) => mudarPrincipal(e.target.value)}
          className="mt-1 w-full caixa-painel px-4 py-2.5 outline-none"
        >
          <option value="">{obrigatoria ? "Escolha..." : "Sem categoria"}</option>
          <Opcoes categorias={categorias} fora={[]} />
        </select>
      </label>

      {/* Só faz sentido perguntar "o que mais" depois de saber o que é. */}
      {principal && (
        <div>
          <span className="block text-sm font-medium">
            Seu lugar também é outra coisa?
          </span>
          <span className="block text-xs texto-suave">
            Acrescente até {MAXIMO_DE_CATEGORIAS_EXTRAS} categorias. Ele
            aparece em todas quando alguém busca ou filtra. Ex.: um café
            colonial que também é padaria e confeitaria.
          </span>

          {extras.length > 0 && (
            <ul className="mt-2 flex flex-wrap gap-2">
              {extras.map((id) => {
                const c = porId.get(id);
                if (!c) return null;
                return (
                  <li key={id}>
                    <button
                      type="button"
                      onClick={() => aoMudarExtras(extras.filter((e) => e !== id))}
                      aria-label={`Tirar ${c.nome}`}
                      className="pilula-ativa inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-sm"
                    >
                      <span>
                        {c.emoji} {c.nome}
                      </span>
                      <span aria-hidden>✕</span>
                    </button>
                  </li>
                );
              })}
            </ul>
          )}

          {cheio ? (
            <p className="mt-2 text-xs texto-suave">
              São {MAXIMO_DE_CATEGORIAS_EXTRAS} no máximo. Para trocar, toque
              em uma das de cima para tirar.
            </p>
          ) : (
            <select
              // Sempre volta para o convite: o que foi escolhido vira uma
              // pílula em cima, e a caixa fica pronta para a próxima.
              value=""
              onChange={(e) => {
                const id = Number(e.target.value);
                if (id) aoMudarExtras([...extras, id]);
              }}
              aria-label="Acrescentar outra categoria"
              className="mt-2 w-full caixa-painel px-4 py-2.5 outline-none"
            >
              <option value="">+ Acrescentar outra categoria...</option>
              <Opcoes
                categorias={categorias}
                fora={[Number(principal), ...extras]}
              />
            </select>
          )}
        </div>
      )}
    </div>
  );
}

/** As categorias agrupadas pela categoria-mãe, sem as que já foram usadas. */
function Opcoes({
  categorias,
  fora,
}: {
  categorias: Categoria[];
  fora: number[];
}) {
  const principais = categorias.filter((c) => c.pai_id === null);

  return (
    <>
      {principais.map((pai) => {
        const filhas = categorias.filter(
          (c) => c.pai_id === pai.id && !fora.includes(c.id),
        );
        const mostraPai = !fora.includes(pai.id);
        if (!mostraPai && filhas.length === 0) return null;

        return (
          <optgroup key={pai.id} label={`${pai.emoji ?? ""} ${pai.nome}`}>
            {mostraPai && <option value={pai.id}>{pai.nome} (geral)</option>}
            {filhas.map((f) => (
              <option key={f.id} value={f.id}>
                {f.emoji} {f.nome}
              </option>
            ))}
          </optgroup>
        );
      })}
    </>
  );
}
