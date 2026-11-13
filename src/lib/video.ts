// ============================================================
// O vídeo do lugar
// ============================================================
// O comerciante (ou a administração, na implantação) cola o link de um
// vídeo já publicado no YouTube ou no Instagram, e a página do lugar o
// mostra tocando ali mesmo.
//
// Por que link, e não o arquivo enviado para o site: vídeo de celular
// sai com 100 MB por minuto e num formato que metade dos navegadores não
// toca. YouTube e Instagram convertem, comprimem e entregam na qualidade
// que a conexão da pessoa aguenta — e o vídeo da implantação vai para as
// redes do comerciante de qualquer jeito.
// ============================================================

export type VideoParaMostrar = {
  /** O endereço que vai dentro do quadro. */
  src: string;
  /** Reels e Shorts são em pé; vídeo comum do YouTube é deitado. */
  formato: "em-pe" | "deitado";
  de: "youtube" | "instagram";
};

/** Os códigos de vídeo das duas redes só usam estes caracteres. */
const CODIGO = /^[A-Za-z0-9_-]{5,20}$/;

/**
 * Transforma o link colado no endereço que toca dentro da página.
 *
 * Devolve nulo para qualquer coisa que não seja um vídeo do YouTube ou do
 * Instagram. O endereço de saída é sempre montado aqui, a partir só do
 * código do vídeo — o que a pessoa colou nunca vai direto para o quadro.
 * Assim um link estranho no cadastro não consegue abrir outro site dentro
 * da página do guia.
 */
export function videoParaMostrar(
  link: string | null | undefined,
): VideoParaMostrar | null {
  const limpo = link?.trim();
  if (!limpo) return null;

  let url: URL;
  try {
    url = new URL(limpo.startsWith("http") ? limpo : `https://${limpo}`);
  } catch {
    return null;
  }

  const host = url.hostname.replace(/^www\.|^m\./, "").toLowerCase();
  const partes = url.pathname.split("/").filter(Boolean);

  if (host === "youtu.be") {
    return youtube(partes[0], "deitado");
  }

  if (host === "youtube.com" || host === "youtube-nocookie.com") {
    if (partes[0] === "shorts") return youtube(partes[1], "em-pe");
    if (partes[0] === "embed") return youtube(partes[1], "deitado");
    if (partes[0] === "watch") {
      return youtube(url.searchParams.get("v"), "deitado");
    }
    return null;
  }

  if (host === "instagram.com") {
    // /reel/CODIGO, /reels/CODIGO, /p/CODIGO — e às vezes com o nome do
    // perfil na frente: /perfil/reel/CODIGO
    const i = partes.findIndex(
      (p) => p === "reel" || p === "reels" || p === "p",
    );
    const codigo = i >= 0 ? partes[i + 1] : undefined;
    if (!codigo || !CODIGO.test(codigo)) return null;
    return {
      src: `https://www.instagram.com/reel/${codigo}/embed`,
      formato: "em-pe",
      de: "instagram",
    };
  }

  return null;
}

function youtube(
  codigo: string | null | undefined,
  formato: VideoParaMostrar["formato"],
): VideoParaMostrar | null {
  if (!codigo || !CODIGO.test(codigo)) return null;
  return {
    // "nocookie": o YouTube só grava cookie se a pessoa der play.
    src: `https://www.youtube-nocookie.com/embed/${codigo}`,
    formato,
    de: "youtube",
  };
}
