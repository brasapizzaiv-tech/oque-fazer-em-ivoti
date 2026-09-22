"use client";

import { TituloBloco } from "@/components/painel/pecas";

// Peças de formulário usadas em todo o painel — juntas num lugar só para os
// campos ficarem iguais em toda tela.

export function Texto({
  rotulo,
  valor,
  onChange,
  dica,
  tipo = "text",
  placeholder,
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  dica?: string;
  tipo?: string;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{rotulo}</span>
      {dica && <span className="block text-xs texto-suave">{dica}</span>}
      <input
        type={tipo}
        value={valor}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full caixa-painel px-4 py-2.5 outline-none"
      />
    </label>
  );
}

export function AreaTexto({
  rotulo,
  valor,
  onChange,
  dica,
  linhas = 5,
  placeholder,
}: {
  rotulo: string;
  valor: string;
  onChange: (v: string) => void;
  dica?: string;
  linhas?: number;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <span className="text-sm font-medium">{rotulo}</span>
      {dica && <span className="block text-xs texto-suave">{dica}</span>}
      <textarea
        rows={linhas}
        value={valor}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full caixa-painel px-4 py-2.5 outline-none"
      />
    </label>
  );
}

export function Bloco({
  titulo,
  descricao,
  children,
}: {
  titulo: string;
  descricao?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="caixa-painel p-5">
      <TituloBloco>{titulo}</TituloBloco>
      {descricao && <p className="mt-0.5 text-sm texto-suave">{descricao}</p>}
      <div className="mt-4 space-y-4">{children}</div>
    </section>
  );
}

export function BotaoSalvar({
  salvando,
  salvo,
  children = "Salvar",
}: {
  salvando: boolean;
  salvo: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3">
      <button
        type="submit"
        disabled={salvando}
        className="botao-cheio px-6 py-3 text-[14px] transition disabled:opacity-50"
      >
        {salvando ? "Salvando..." : children}
      </button>
      {salvo && !salvando && (
        <span className="text-sm font-medium text-[color:var(--color-v-verde)]">
          Salvo ✓
        </span>
      )}
    </div>
  );
}
