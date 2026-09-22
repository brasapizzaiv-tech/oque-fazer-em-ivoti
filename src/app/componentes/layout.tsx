/**
 * A vitrine de componentes fica por cima da casca do site.
 *
 * O cabecalho e o rodape moram no layout raiz, e no App Router nao ha como um
 * layout filho remover um ancestral. Como esta e uma pagina de trabalho — que
 * sai quando o redesenho terminar —, cobrir a tela resolve sem mexer no
 * layout de que o site inteiro depende. Dois logos e duas paletas na mesma
 * tela atrapalhavam a aprovacao.
 */
export default function LayoutComponentes({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      className="fixed inset-0 z-[60] overflow-y-auto"
      style={{ backgroundColor: "var(--color-v-fundo)" }}
    >
      {children}
    </div>
  );
}
