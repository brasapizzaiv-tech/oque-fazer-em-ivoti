/**
 * O nome do site, em um lugar so.
 *
 * Esta em transicao: o guia nasceu como "O que fazer em Ivoti", virou "O Guia
 * de Ivoti" em 15/09/2026 — quando o dominio oguiaivoti.com.br foi registrado
 * — e o documento do redesenho pede o nome antigo de volta.
 *
 * Fica aqui, e nao espalhado, exatamente por isso: enquanto a decisao nao
 * assenta, trocar o nome do site inteiro precisa ser mudar uma linha. Quando
 * assentar, ainda vale manter — nome de marca e coisa que muda de novo.
 *
 * Quem mostra o nome na tela le daqui. O endereco do site NAO muda junto:
 * mora em lib/site.ts e depende do dominio registrado, nao do nome escrito.
 */
export const NOME_DO_SITE = "O que fazer em Ivoti";

/** A linha que acompanha o nome no logo. */
export const ASSINATURA = "A cidade das flores";

/**
 * O WhatsApp para onde vai quem quer saber dos planos.
 *
 * Aparece no bloqueio dos módulos do painel e na página de planos. Mora
 * aqui para as duas telas nunca mandarem o comerciante para números
 * diferentes.
 */
export const WHATSAPP_DO_GUIA = "5551998323298";

/** Como o assistente se chama. */
export const NOME_DO_ASSISTENTE = "O Guia";
