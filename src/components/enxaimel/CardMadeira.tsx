/**
 * O card de madeira — a peça que dá personalidade ao site inteiro.
 *
 * Não é um retângulo com borda marrom. É uma moldura de quatro vigas, cada
 * uma com o veio na direção certa: deitado em cima e embaixo, em pé nos
 * lados. Usar a mesma textura nas quatro bordas denuncia na hora que é
 * enfeite, porque madeira de verdade tem direção.
 *
 * Três detalhes que fazem a diferença entre "borda marrom" e "madeira":
 *
 *   1. Os cantos são levemente tortos, e a torção alterna entre os cards
 *      (`variante`). Uma fileira de cards perfeitamente retos e idênticos
 *      volta a parecer software; madeira não aplainada não fica reta.
 *   2. A sombra é dura, de 4px, sem desfoque — é a sombra de uma peça
 *      espessa encostada na parede, não a névoa cinza dos cartões de
 *      interface.
 *   3. As mãos-francesas travam dois cantos opostos, como numa parede de
 *      verdade. Ficam dentro da moldura e param na margem interna: nunca
 *      passam por cima de texto nem de ícone.
 *
 * Sem viga em X no meio do card, de propósito — isso é parede, não painel de
 * conteúdo, e dentro do card quem manda é o que está escrito.
 */
export default function CardMadeira({
  children,
  variante = 1,
  maosFrancesas = true,
  className = "",
}: {
  children: React.ReactNode;
  /** 1 ou 2: alterna de que lado o card fica torto. */
  variante?: 1 | 2;
  /** Desliga as diagonais dos cantos em cards muito pequenos. */
  maosFrancesas?: boolean;
  className?: string;
}) {
  // Desvios de poucos pixels. Mais que isto vira card quebrado, não madeira.
  const recorte =
    variante === 1
      ? "polygon(2px 1px, calc(100% - 1px) 0px, 100% calc(100% - 2px), 1px 100%)"
      : "polygon(0px 2px, calc(100% - 2px) 1px, calc(100% - 1px) 100%, 2px calc(100% - 1px))";

  return (
    <div
      className={className}
      // A sombra dura vai como filtro, e não como box-shadow: com o recorte
      // dos cantos, o box-shadow sairia cortado junto e apareceria torto.
      style={{
        filter: "drop-shadow(4px 4px 0 var(--color-madeira-funda))",
      }}
    >
      <div
        className="madeira-deitada relative p-[10px]"
        style={{ clipPath: recorte }}
      >
        {/* As vigas em pé cobrem as laterais, para o veio virar 90 graus */}
        <span
          aria-hidden
          className="madeira-empe absolute top-0 bottom-0 left-0 w-[10px]"
        />
        <span
          aria-hidden
          className="madeira-empe absolute top-0 right-0 bottom-0 w-[10px]"
        />

        <div
          className="relative overflow-hidden"
          style={{
            backgroundColor: "var(--color-superficie)",
            boxShadow: "inset 0 1px 3px rgba(30, 16, 8, 0.16)",
          }}
        >
          {children}
        </div>

        {/* Depois do conteudo, de proposito: antes elas ficavam atras da
            superficie de creme e sumiam. Entram so alguns pixels na area
            interna — o suficiente para travar o canto —, e o conteudo do card
            sempre tem folga de canto para o texto nunca encostar. */}
        {maosFrancesas && (
          <>
            <MaoFrancesa canto="superior-esquerdo" />
            <MaoFrancesa canto="inferior-direito" />
          </>
        )}
      </div>
    </div>
  );
}

/**
 * A viga diagonal que trava o canto.
 *
 * Nos dois cantos ela sobe da esquerda para a direita — numa parede real a
 * mão-francesa liga o pilar à viga formando um triângulo, e o canto oposto é
 * o mesmo triângulo girado meia-volta, o que mantém a diagonal no mesmo
 * sentido.
 */
function MaoFrancesa({
  canto,
}: {
  canto: "superior-esquerdo" | "inferior-direito";
}) {
  const posicao =
    canto === "superior-esquerdo"
      ? { top: "14px", left: "-10px" }
      : { bottom: "14px", right: "-10px" };

  return (
    <span
      aria-hidden
      className="madeira-deitada absolute z-10 h-[8px] w-[52px]"
      style={{
        ...posicao,
        transform: "rotate(-45deg)",
        transformOrigin: "center",
        // Um fio escuro separa a diagonal da moldura: sem ele as duas pecas
        // viram uma mancha so, porque tem a mesma textura.
        boxShadow: "0 0 0 1px rgba(21, 10, 4, 0.55)",
      }}
    />
  );
}
