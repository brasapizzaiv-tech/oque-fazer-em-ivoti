import { campanhaDaVisita } from "./campanha-link";

/**
 * Manda contar alguma coisa, do lado do navegador.
 *
 * Usa sendBeacon quando existe: ele entrega o aviso mesmo se a pessoa fechar
 * a aba ou sair para o site do comercio no mesmo instante — que e exatamente
 * quando os cliques de contato acontecem. Sem isso, metade das indicacoes se
 * perderia no caminho.
 */
export function contar(
  tipo: string,
  onde: { local?: string; alvo?: string; chave?: string; de?: string } = {},
): void {
  if (typeof window === "undefined") return;

  // Se a visita chegou por um link de campanha, tudo o que ela conta vai
  // marcado. Quem decide se a campanha existe e o servidor.
  const campanha = campanhaDaVisita();
  const corpo = JSON.stringify({
    tipo,
    ...onde,
    ...(campanha ? { campanha } : {}),
  });

  try {
    if (navigator.sendBeacon) {
      navigator.sendBeacon(
        "/api/metrica",
        new Blob([corpo], { type: "application/json" }),
      );
      return;
    }
  } catch {
    // sendBeacon bloqueado: cai no fetch abaixo
  }

  fetch("/api/metrica", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: corpo,
    keepalive: true,
  }).catch(() => {});
}
