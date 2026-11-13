// As regras do link de campanha, sem nada de servidor: este arquivo é
// lido tanto pelo navegador (que guarda de qual campanha a visita veio)
// quanto pelo servidor (que confere se a campanha existe).

/** Como o slug precisa ser: minúsculas, números e hífen. O banco confere igual. */
export function slugValido(valor: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(valor) && valor.length <= 60;
}

/** "Juliana — Novembro!" vira "juliana-novembro". */
export function paraSlug(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

const CHAVE = "campanha";
/** Por quanto tempo uma visita continua contando para a campanha. */
const VALE_POR = 7 * 24 * 60 * 60 * 1000;

/**
 * Guarda de qual campanha esta visita veio.
 *
 * Sete dias, e não só enquanto a aba está aberta: quem vê o vídeo hoje
 * costuma abrir o guia de novo no fim de semana, quando vai de fato sair
 * de casa — e é nesse segundo acesso que clica no WhatsApp do restaurante.
 * Se a marca morresse com a aba, a campanha perderia justamente o clique
 * que ela existe para provar.
 *
 * Um link de campanha novo substitui o anterior: vale o último vídeo que
 * trouxe a pessoa.
 */
export function guardarCampanha(slug: string): void {
  if (!slugValido(slug)) return;
  try {
    localStorage.setItem(
      CHAVE,
      JSON.stringify({ slug, ate: Date.now() + VALE_POR }),
    );
  } catch {
    // navegação anônima pode recusar; a visita só deixa de ser atribuída
  }
}

/** A campanha desta visita, se houver e ainda estiver valendo. */
export function campanhaDaVisita(): string | null {
  try {
    const bruto = localStorage.getItem(CHAVE);
    if (!bruto) return null;
    const { slug, ate } = JSON.parse(bruto) as { slug?: string; ate?: number };
    if (!slug || !ate || ate < Date.now() || !slugValido(slug)) {
      localStorage.removeItem(CHAVE);
      return null;
    }
    return slug;
  } catch {
    return null;
  }
}
