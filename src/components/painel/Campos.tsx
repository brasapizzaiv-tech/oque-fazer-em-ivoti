"use client";

// Peças de formulário usadas em todo o painel — juntas num lugar só pra os
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
      {dica && <span className="block text-xs text-tinta/50">{dica}</span>}
      <input
        type={tipo}
        value={valor}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border-2 border-carvalho bg-creme px-4 py-2.5 outline-none focus:border-sol-600 focus:ring-2 focus:ring-sol-200"
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
      {dica && <span className="block text-xs text-tinta/50">{dica}</span>}
      <textarea
        rows={linhas}
        value={valor}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        className="mt-1 w-full border-2 border-carvalho bg-creme px-4 py-2.5 outline-none focus:border-sol-600 focus:ring-2 focus:ring-sol-200"
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
    <section className="border-2 border-carvalho bg-creme p-5">
      <h2 className="font-semibold">{titulo}</h2>
      {descricao && (
        <p className="mt-0.5 text-sm text-tinta/55">{descricao}</p>
      )}
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
        className="border-2 border-carvalho bg-carvalho px-6 py-2.5 text-sm font-semibold text-white transition hover:border-sol-700 hover:bg-sol-700 disabled:opacity-50"
      >
        {salvando ? "Salvando..." : children}
      </button>
      {salvo && !salvando && (
        <span className="text-sm font-medium text-mata-700">Salvo ✓</span>
      )}
    </div>
  );
}
