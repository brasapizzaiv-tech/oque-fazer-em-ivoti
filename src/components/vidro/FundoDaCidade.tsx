import Image from "next/image";

/**
 * A foto da cidade atrás de tudo, fixa enquanto a página rola.
 *
 * É o que faz o vidro ser vidro: sem foto por trás, o desfoque não tem o
 * que desfocar e cada cartão vira um retângulo branco. Por isso ela mora
 * na casca do site e não numa tela só.
 *
 * O véu de 70% não é para escurecer, é para clarear: sem ele o texto
 * cinza dos cartões cairia sobre o contraste da foto e o site inteiro
 * ficaria cansativo de ler. A foto continua reconhecível por baixo.
 *
 * `fixed` e não `background-attachment: fixed` porque o Safari do iPhone
 * ignora o segundo e a foto sai pulando ao rolar.
 */
export default function FundoDaCidade({
  foto = "/fotos/eu-amo-ivoti.jpg",
}: {
  /** Trocável pelo painel mais adiante; por ora vem do código. */
  foto?: string;
}) {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10">
      <Image
        src={foto}
        alt=""
        fill
        priority
        sizes="100vw"
        className="object-cover object-center"
      />
      <div
        className="absolute inset-0"
        style={{ backgroundColor: "rgba(250, 247, 241, 0.7)" }}
      />
    </div>
  );
}
