/**
 * A mão-francesa: a diagonal que trava o quadro numa parede enxaimel.
 *
 * É o único gesto ousado do site, e por isso aparece UMA vez por página —
 * na costura entre o topo e o conteúdo. Repetida em cada seção viraria
 * papel de parede, e aí não marcaria mais nada.
 *
 * Desenhada, e não uma imagem: acompanha a largura da tela sem esticar, e
 * some para quem usa leitor de tela, porque não diz nada que o texto já não
 * diga.
 */
export default function MaoFrancesa() {
  return (
    <div aria-hidden className="border-b-2 border-carvalho bg-creme">
      <svg
        viewBox="0 0 1200 28"
        preserveAspectRatio="none"
        className="block h-7 w-full"
      >
        {/* Os montantes: o ritmo vertical da parede. */}
        {[0, 200, 400, 600, 800, 1000, 1200].map((x) => (
          <line
            key={x}
            x1={x}
            y1="0"
            x2={x}
            y2="28"
            stroke="var(--color-carvalho)"
            strokeWidth="2"
          />
        ))}
        {/* A diagonal, uma só, no vão do meio. */}
        <line
          x1="600"
          y1="28"
          x2="800"
          y2="0"
          stroke="var(--color-carvalho)"
          strokeWidth="2"
        />
      </svg>
    </div>
  );
}
