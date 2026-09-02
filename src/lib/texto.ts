// Tira os acentos: decompoe (NFD) e joga fora as marcas combinantes
// (U+0300 a U+036F). Feito por codigo de caractere pra o arquivo ficar
// 100% ASCII e nao depender da codificacao do editor.
function semAcento(texto: string): string {
  let saida = "";
  for (const c of texto.normalize("NFD")) {
    const cp = c.codePointAt(0) ?? 0;
    if (cp >= 0x300 && cp <= 0x36f) continue;
    saida += c;
  }
  return saida;
}

/** "Pizzaria do Ze & Cia" -> "pizzaria-do-ze-cia" */
export function paraSlug(texto: string): string {
  return semAcento(texto)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

/** Tira acento e deixa minusculo — pra comparar texto de busca. */
export function normalizar(texto: string): string {
  return semAcento(texto).toLowerCase().trim();
}

/** 45.9 -> "R$ 45,90" */
export function reais(valor: number): string {
  return valor.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

/** 1 -> "$" | 3 -> "$$$" */
export function faixaPreco(nivel: number | null): string {
  if (!nivel) return "";
  return "$".repeat(Math.min(4, Math.max(1, nivel)));
}

/** So os digitos, com 55 na frente — pro link do WhatsApp. */
export function linkWhatsapp(
  numero: string | null,
  texto?: string,
): string | null {
  if (!numero) return null;
  const digitos = numero.replace(/\D/g, "");
  if (digitos.length < 10) return null;
  const completo = digitos.startsWith("55") ? digitos : `55${digitos}`;
  const msg = texto ? `?text=${encodeURIComponent(texto)}` : "";
  return `https://wa.me/${completo}${msg}`;
}

/** Formata (51) 99999-9999 pra exibir. */
export function telefoneBonito(numero: string | null): string {
  if (!numero) return "";
  const d = numero.replace(/\D/g, "").replace(/^55/, "");
  if (d.length === 11)
    return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10)
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return numero;
}

/** @fulano ou link completo -> "fulano" */
export function usuarioInstagram(valor: string | null): string | null {
  if (!valor) return null;
  const limpo = valor
    .trim()
    .replace(/^https?:\/\/(www\.)?instagram\.com\//i, "")
    .replace(/^@/, "")
    .replace(/\/.*$/, "");
  return limpo || null;
}
