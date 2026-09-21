/**
 * O campo de busca em vidro.
 *
 * Vai dentro do cabeçalho azul, onde há foto por baixo: é ali que o
 * desfoque tem o que desfocar. O texto digitado fica escuro e não branco
 * porque o vidro por baixo dele é branco, e não o azul do cabeçalho.
 */
export default function Busca({
  placeholder = "O que você procura em Ivoti?",
  valor,
}: {
  placeholder?: string;
  /** O que já estava buscado, para não sumir ao voltar. */
  valor?: string;
}) {
  return (
    <form action="/explorar">
      <input
        name="q"
        defaultValue={valor}
        placeholder={placeholder}
        aria-label="Buscar no guia"
        className="vidro h-12 w-full px-4 text-[14px] outline-none"
        style={{ color: "var(--color-v-texto)", borderRadius: 12 }}
      />
    </form>
  );
}
