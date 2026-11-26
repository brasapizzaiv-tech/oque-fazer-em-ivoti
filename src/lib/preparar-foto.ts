// ============================================================
// A foto, antes de subir
// ============================================================
// Toda imagem que alguém envia pelo painel ou pela administração passa por
// aqui, no próprio aparelho, antes de ir para o depósito.
//
// Dois motivos. Foto de celular sai com 4 a 8 MB, e é esse arquivo que o
// visitante baixaria na rua, no 4G. E o iPhone grava em HEIC, formato que
// o Chrome e o Android não abrem: a foto subia, o comerciante a via no
// iPhone dele, e para a maior parte dos visitantes era um quadro vazio
// (aconteceu com oito fotos de um estabelecimento em 13/11/2026).
// ============================================================

/** Lado maior da imagem que vai para o site. */
const LADO_MAXIMO = 1920;

/**
 * Lado maior da foto de um cardápio. Maior que o das fotos comuns porque
 * ali o que importa é ler letra pequena, e o visitante amplia a imagem.
 */
export const LADO_MAXIMO_DO_CARDAPIO = 2400;

export type FotoPronta = {
  arquivo: Blob;
  /** "jpg" ou "png", para o nome do arquivo. */
  extensao: "jpg" | "png";
  tipo: "image/jpeg" | "image/png";
  /** O tamanho da imagem já reduzida, em pontos. */
  largura: number;
  altura: number;
};

/**
 * Reduz a imagem e a converte para JPG.
 *
 * Com `manterPng`, um PNG continua PNG: é o caso do logo de uma feira, que
 * tem fundo transparente e viraria um retângulo branco em JPG.
 *
 * Devolve nulo quando o navegador não consegue abrir o arquivo (é o caso
 * do HEIC fora do Safari).
 *
 * `ladoMaximo` troca o teto de tamanho: o cardápio sobe maior que a foto. Melhor recusar com um recado claro do que
 * publicar uma imagem que não aparece.
 */
export async function prepararFoto(
  arquivo: File,
  {
    manterPng = false,
    ladoMaximo = LADO_MAXIMO,
  }: { manterPng?: boolean; ladoMaximo?: number } = {},
): Promise<FotoPronta | null> {
  try {
    const imagem = await createImageBitmap(arquivo, {
      imageOrientation: "from-image",
    });

    const escala = Math.min(
      1,
      ladoMaximo / Math.max(imagem.width, imagem.height),
    );
    const tela = document.createElement("canvas");
    tela.width = Math.round(imagem.width * escala);
    tela.height = Math.round(imagem.height * escala);

    const pincel = tela.getContext("2d");
    if (!pincel) return null;

    const emPng = manterPng && arquivo.type === "image/png";
    if (!emPng) {
      // Fundo branco: transparência viraria preto no JPG.
      pincel.fillStyle = "#FFFFFF";
      pincel.fillRect(0, 0, tela.width, tela.height);
    }
    pincel.drawImage(imagem, 0, 0, tela.width, tela.height);
    imagem.close();

    const tipo = emPng ? "image/png" : "image/jpeg";
    const pronto = await new Promise<Blob | null>((ok) =>
      tela.toBlob(ok, tipo, 0.85),
    );
    if (!pronto) return null;

    return {
      arquivo: pronto,
      extensao: emPng ? "png" : "jpg",
      tipo,
      largura: tela.width,
      altura: tela.height,
    };
  } catch {
    return null;
  }
}

/** O recado para quando a imagem não abre. */
export function naoAbriu(nome: string): string {
  return `Não consegui abrir "${nome}". Se for foto de iPhone no formato HEIC, envie pelo próprio iPhone ou salve como JPG antes.`;
}
