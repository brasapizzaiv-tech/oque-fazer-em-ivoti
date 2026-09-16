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
  onde: { local?: string; alvo?: string; chave?: string } = {},
): void {
  if (typeof window === "undefined") return;

  const corpo = JSON.stringify({ tipo, ...onde });

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
