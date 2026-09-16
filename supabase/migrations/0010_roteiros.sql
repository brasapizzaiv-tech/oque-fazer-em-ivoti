-- ============================================================
-- Roteiros
-- ============================================================
-- A tabela nasceu junto com o banco e nunca foi usada: guardava um token de
-- compartilhamento e a lista ordenada de paradas. Agora ela serve a dois
-- donos diferentes:
--
--   1. o roteiro que o visitante monta com o Gui e salva para compartilhar
--   2. os roteiros prontos que a administração publica no Explorar
--      ("Ivoti em um dia", "Rota gastronômica")
--
-- O que separa os dois é a coluna "curado".
-- ============================================================

alter table public.roteiros
  add column curado boolean not null default false,
  add column slug text unique,
  add column descricao text,
  add column capa_url text,
  add column ordem integer not null default 0,
  add column publicado boolean not null default false,
  add column criado_por uuid references auth.users(id) on delete set null;

comment on column public.roteiros.curado is
  'true = roteiro pronto, montado pela administracao e listado no Explorar';
comment on column public.roteiros.token is
  'endereco curto de compartilhamento do roteiro que o visitante montou';

create index roteiros_curados on public.roteiros (curado, publicado, ordem);

-- ------------------------------------------------------------
-- Quem vê o quê
-- ------------------------------------------------------------
-- As regras antigas liberavam tudo para todo mundo, o que valia quando só
-- existia o roteiro por token. Com os roteiros da administração no meio,
-- precisam ser mais precisas.
drop policy if exists roteiros_ler on public.roteiros;
drop policy if exists roteiros_criar on public.roteiros;
drop policy if exists roteiros_editar on public.roteiros;

-- Quem tem o link vê o roteiro do visitante; os curados só quando publicados.
-- O token é um endereço sorteado e impossível de adivinhar: é ele que faz o
-- papel de senha aqui.
create policy roteiros_ler on public.roteiros
  for select using (
    (not curado)
    or publicado
    or public.eh_admin()
  );

-- Visitante sem conta pode salvar o roteiro que montou — mas não pode criar
-- um roteiro "pronto" da administração.
create policy roteiros_criar on public.roteiros
  for insert with check (not curado or public.eh_admin());

create policy roteiros_admin on public.roteiros
  for update using (public.eh_admin()) with check (public.eh_admin());

create policy roteiros_apagar on public.roteiros
  for delete using (public.eh_admin());
