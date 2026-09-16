// Tipos das tabelas do banco, na forma como o site usa.

export type StatusLocal =
  | "rascunho"
  | "em_analise"
  | "publicado"
  | "rejeitado"
  | "inativo";

export type Categoria = {
  id: number;
  slug: string;
  nome: string;
  emoji: string | null;
  pai_id: number | null;
  ordem: number;
};

export type Tag = {
  id: number;
  slug: string;
  nome: string;
  emoji: string | null;
  ordem: number;
};

export type Horario = {
  id?: string;
  local_id?: string;
  dia_semana: number; // 0 = domingo ... 6 = sabado
  abre: string; // "11:30"
  fecha: string; // "14:00"
  observacao?: string | null;
};

export type Foto = {
  id: string;
  local_id?: string;
  url: string;
  legenda: string | null;
  ordem: number;
};

export type Item = {
  id?: string;
  local_id?: string;
  secao: string | null;
  nome: string;
  descricao: string | null;
  preco: number | null;
  ordem: number;
};

export type Local = {
  id: string;
  slug: string;
  nome: string;
  categoria_id: number | null;
  resumo: string | null;
  descricao: string | null;
  endereco: string | null;
  numero: string | null;
  bairro: string | null;
  cidade: string;
  uf: string;
  cep: string | null;
  lat: number | null;
  lng: number | null;
  telefone: string | null;
  whatsapp: string | null;
  email: string | null;
  site: string | null;
  instagram: string | null;
  facebook: string | null;
  faixa_preco: number | null;
  capa_url: string | null;
  plano: string;
  plano_ate: string | null;
  status: StatusLocal;
  motivo_rejeicao: string | null;
  destaque: boolean;
  /** Quando saiu do ar. So vem preenchido nos locais inativos. */
  desativado_em?: string | null;
  dono_id: string | null;
  criado_em: string;
  atualizado_em: string;
  publicado_em: string | null;
};

// Local ja com tudo que a pagina e o chat precisam.
export type LocalCompleto = Local & {
  categoria: Categoria | null;
  horarios: Horario[];
  fotos: Foto[];
  tags: Tag[];
  itens: Item[];
};

export type Evento = {
  id: string;
  local_id: string | null;
  titulo: string;
  descricao: string | null;
  inicio: string;
  fim: string | null;
  local_texto: string | null;
  imagem_url: string | null;
  url: string | null;
  status: "em_analise" | "publicado" | "rejeitado";
  /** A partir de quando aparece no site. Nulo = assim que aprovado. */
  publicar_em: string | null;
};
