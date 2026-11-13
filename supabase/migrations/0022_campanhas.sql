-- ============================================================
-- Campanhas com influenciador
-- ============================================================
-- O modelo de negocio vende cotas: um influenciador visita a cidade usando
-- o guia, passa por quatro estabelecimentos, e cada um paga uma cota. O
-- que fecha a venda e o relatorio do fim: "desta campanha vieram 340
-- pessoas, e 51 clicaram no seu WhatsApp".
--
-- Para isso cada campanha tem um link proprio —
-- oquefazeremivoti.com.br/?de=juliana-nov — e o site marca tudo o que
-- aquela visita faz como vindo dela.
--
-- A origem comum do acesso nao serve aqui. Ela so enxerga quando a pessoa
-- clica num link de outro site; story do Instagram, bio e WhatsApp chegam
-- quase sempre sem rastro, como "direto".
-- ============================================================

create table if not exists public.campanhas (
  id uuid primary key default gen_random_uuid(),

  -- O pedaco que vai no link: ?de=juliana-nov
  slug text not null unique
    check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),

  nome text not null,
  influenciador text,

  inicio date,
  fim date,

  -- Os estabelecimentos que compraram cota nesta campanha.
  locais uuid[] not null default '{}',

  observacao text,
  criada_em timestamptz not null default now()
);

comment on table public.campanhas is
  'Campanhas com influenciador. O slug e o que vai no link (?de=).';

alter table public.campanhas enable row level security;

-- So a administracao le e mexe. O site confere se um link e de campanha
-- de verdade pelo servidor, com a chave de servico, entao o visitante nao
-- precisa enxergar esta tabela.
drop policy if exists campanhas_admin on public.campanhas;
create policy campanhas_admin on public.campanhas
  for all using (public.eh_admin()) with check (public.eh_admin());

-- ------------------------------------------------------------
-- Onde os numeros da campanha ficam
-- ------------------------------------------------------------
-- Na mesma tabela de metricas, como um tipo novo: "campanha".
--
--   alvo     = a campanha
--   chave    = o que a pessoa fez (site_origem, pagina, clique_whatsapp...)
--   local_id = em qual estabelecimento, quando a acao e de um
--
-- Nao pede coluna nova. E a linha com local_id segue a mesma regra de
-- leitura das outras: o dono do lugar, com o plano certo, enxerga o que a
-- campanha trouxe para ele; o resto e so da administracao.
