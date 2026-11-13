import { videoParaMostrar } from "@/lib/video";

/**
 * O vídeo do lugar, tocando dentro da página.
 *
 * Não desenha nada quando o link não é de um vídeo do YouTube ou do
 * Instagram: um quadro vazio no meio da página seria pior que a ausência.
 *
 * `loading="lazy"` porque o vídeo fica abaixo das fotos e do "Sobre": quem
 * abre a página no celular para ver o horário não deve pagar, em dados e
 * em espera, por um vídeo que talvez nem role até ver.
 *
 * O quadro em pé tem largura travada. Reel e Short são 9 por 16, e
 * esticados na largura de uma tela grande virariam uma torre de um metro.
 */
export default function VideoDoLugar({
  link,
  nome,
}: {
  link: string | null;
  nome: string;
}) {
  const video = videoParaMostrar(link);
  if (!video) return null;

  const emPe = video.formato === "em-pe";

  return (
    <div
      className={`mt-3 overflow-hidden rounded-[14px] ${
        emPe ? "mx-auto w-full max-w-[340px]" : "w-full"
      }`}
      style={{
        aspectRatio: emPe ? "9 / 16" : "16 / 9",
        backgroundColor: "rgba(43, 35, 32, 0.08)",
      }}
    >
      <iframe
        src={video.src}
        title={`Vídeo de ${nome}`}
        loading="lazy"
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
        allowFullScreen
        referrerPolicy="strict-origin-when-cross-origin"
        className="h-full w-full border-0"
      />
    </div>
  );
}
