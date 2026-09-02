-- ============================================================
-- O que fazer em Ivoti — estrutura inicial
-- ============================================================
-- Guia da cidade: estabelecimentos, atrativos, horarios, fotos,
-- mapa e o chat que recomenda o que fazer.
--
-- Quem cadastra e o proprio estabelecimento (autoatendimento):
-- ele cria a conta, preenche o perfil e manda para aprovacao.
-- ============================================================

create extension if not exists unaccent;

-- ------------------------------------------------------------
-- Perfis das pessoas que fazem login (donos de estabelecimento
-- e a administracao do site).
-- ------------------------------------------------------------
create table public.perfis (
  id uuid primary key references auth.users(id) on delete cascade,
  nome text,
  telefone text,
  papel text not null default 'dono' check (papel in ('admin', 'dono')),
  criado_em timestamptz not null default now()
);

-- Todo mundo que se cadastra ganha um perfil automaticamente.
create or replace function public.ao_criar_usuario()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.perfis (id, nome, telefone)
  values (
    new.id,
    nullif(new.raw_user_meta_data ->> 'nome', ''),
    nullif(new.raw_user_meta_data ->> 'telefone', '')
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger ao_criar_usuario
  after insert on auth.users
  for each row execute function public.ao_criar_usuario();

-- Atalho usado nas regras de acesso: "quem esta logado e admin?"
create or replace function public.eh_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.perfis
    where id = auth.uid() and papel = 'admin'
  );
$$;

-- ------------------------------------------------------------
-- Categorias (com subcategorias: Gastronomia > Pizzaria, etc.)
-- ------------------------------------------------------------
create table public.categorias (
  id serial primary key,
  slug text not null unique,
  nome text not null,
  emoji text,
  pai_id integer references public.categorias(id) on delete cascade,
  ordem integer not null default 0
);

create index on public.categorias (pai_id);

-- ------------------------------------------------------------
-- Etiquetas: "aceita pet", "ao ar livre", "com crianca"...
-- E o que deixa o chat responder perguntas do tipo
-- "um lugar ao ar livre pra levar as criancas".
-- ------------------------------------------------------------
create table public.tags (
  id serial primary key,
  slug text not null unique,
  nome text not null,
  emoji text,
  ordem integer not null default 0
);

-- ------------------------------------------------------------
-- Locais: o coracao do site.
-- ------------------------------------------------------------
create table public.locais (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  categoria_id integer references public.categorias(id) on delete set null,

  resumo text,                       -- uma linha, aparece no card
  descricao text,                    -- texto livre do estabelecimento

  -- Onde fica
  endereco text,
  numero text,
  bairro text,
  cidade text not null default 'Ivoti',
  uf text not null default 'RS',
  cep text,
  lat double precision,
  lng double precision,

  -- Como falar com eles
  telefone text,
  whatsapp text,
  email text,
  site text,
  instagram text,
  facebook text,

  faixa_preco smallint check (faixa_preco between 1 and 4),
  capa_url text,

  -- Fluxo de publicacao: o dono preenche, manda pra analise, o site aprova.
  status text not null default 'rascunho'
    check (status in ('rascunho', 'em_analise', 'publicado', 'rejeitado')),
  motivo_rejeicao text,
  destaque boolean not null default false,

  dono_id uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now(),
  publicado_em timestamptz,

  -- Busca por texto (nome, resumo, descricao, bairro) em portugues.
  busca tsvector generated always as (
    setweight(to_tsvector('portuguese', coalesce(nome, '')), 'A') ||
    setweight(to_tsvector('portuguese', coalesce(resumo, '')), 'B') ||
    setweight(to_tsvector('portuguese', coalesce(descricao, '')), 'C') ||
    setweight(to_tsvector('portuguese', coalesce(bairro, '')), 'D')
  ) stored
);

create index on public.locais using gin (busca);
create index on public.locais (status);
create index on public.locais (categoria_id);
create index on public.locais (dono_id);

create or replace function public.tocar_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger locais_atualizado_em
  before update on public.locais
  for each row execute function public.tocar_atualizado_em();

-- ------------------------------------------------------------
-- Horarios de funcionamento.
-- Uma linha por faixa: da pra ter almoco e jantar no mesmo dia,
-- e "fechado" e simplesmente nao ter linha naquele dia.
-- dia_semana: 0 = domingo ... 6 = sabado
-- ------------------------------------------------------------
create table public.locais_horarios (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locais(id) on delete cascade,
  dia_semana smallint not null check (dia_semana between 0 and 6),
  abre time not null,
  fecha time not null,
  observacao text
);

create index on public.locais_horarios (local_id);

-- ------------------------------------------------------------
-- Fotos (arquivos no Storage, bucket "locais").
-- ------------------------------------------------------------
create table public.locais_fotos (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locais(id) on delete cascade,
  url text not null,
  legenda text,
  ordem integer not null default 0,
  criado_em timestamptz not null default now()
);

create index on public.locais_fotos (local_id);

-- ------------------------------------------------------------
-- Etiquetas de cada local.
-- ------------------------------------------------------------
create table public.locais_tags (
  local_id uuid not null references public.locais(id) on delete cascade,
  tag_id integer not null references public.tags(id) on delete cascade,
  primary key (local_id, tag_id)
);

-- ------------------------------------------------------------
-- "O que fazem": cardapio, servicos, quartos, passeios...
-- Lista livre que o estabelecimento preenche.
-- ------------------------------------------------------------
create table public.locais_itens (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locais(id) on delete cascade,
  secao text,                        -- "Pizzas", "Diarias", "Trilhas"
  nome text not null,
  descricao text,
  preco numeric(10, 2),
  ordem integer not null default 0
);

create index on public.locais_itens (local_id);

-- ------------------------------------------------------------
-- Agenda: eventos com data marcada (show, feira, festa).
-- ------------------------------------------------------------
create table public.eventos (
  id uuid primary key default gen_random_uuid(),
  local_id uuid references public.locais(id) on delete cascade,
  titulo text not null,
  descricao text,
  inicio timestamptz not null,
  fim timestamptz,
  local_texto text,                  -- quando nao e um local cadastrado
  imagem_url text,
  url text,
  status text not null default 'em_analise'
    check (status in ('em_analise', 'publicado', 'rejeitado')),
  criado_por uuid references auth.users(id) on delete set null,
  criado_em timestamptz not null default now()
);

create index on public.eventos (inicio);
create index on public.eventos (status);

-- ------------------------------------------------------------
-- Roteiros montados pelo visitante ("meu dia em Ivoti").
-- Salvo com um token pra poder compartilhar o link.
-- ------------------------------------------------------------
create table public.roteiros (
  id uuid primary key default gen_random_uuid(),
  token text not null unique,
  titulo text not null default 'Meu roteiro em Ivoti',
  locais uuid[] not null default '{}',
  criado_em timestamptz not null default now()
);

-- ------------------------------------------------------------
-- Conversas do chat — pra voce enxergar o que o pessoal procura
-- (e descobrir o que falta cadastrar na cidade).
-- ------------------------------------------------------------
create table public.chat_conversas (
  id uuid primary key default gen_random_uuid(),
  sessao text,
  pergunta text not null,
  resposta text,
  locais_citados uuid[] default '{}',
  criado_em timestamptz not null default now()
);

create index on public.chat_conversas (criado_em desc);

-- ============================================================
-- Regras de acesso (RLS)
-- ============================================================
alter table public.perfis            enable row level security;
alter table public.categorias        enable row level security;
alter table public.tags              enable row level security;
alter table public.locais            enable row level security;
alter table public.locais_horarios   enable row level security;
alter table public.locais_fotos      enable row level security;
alter table public.locais_tags       enable row level security;
alter table public.locais_itens      enable row level security;
alter table public.eventos           enable row level security;
alter table public.roteiros          enable row level security;
alter table public.chat_conversas    enable row level security;

-- Perfis: cada um ve e edita o seu; admin ve todos.
create policy perfis_ler on public.perfis
  for select using (id = auth.uid() or public.eh_admin());
create policy perfis_editar on public.perfis
  for update using (id = auth.uid() or public.eh_admin());

-- Categorias e tags: qualquer visitante le; so admin mexe.
create policy categorias_ler on public.categorias for select using (true);
create policy categorias_admin on public.categorias for all
  using (public.eh_admin()) with check (public.eh_admin());
create policy tags_ler on public.tags for select using (true);
create policy tags_admin on public.tags for all
  using (public.eh_admin()) with check (public.eh_admin());

-- Locais: o visitante so enxerga o que esta publicado.
-- O dono enxerga e edita o dele em qualquer situacao.
create policy locais_ler_publicados on public.locais
  for select using (
    status = 'publicado' or dono_id = auth.uid() or public.eh_admin()
  );
create policy locais_criar on public.locais
  for insert to authenticated with check (dono_id = auth.uid());
create policy locais_editar on public.locais
  for update using (dono_id = auth.uid() or public.eh_admin())
  with check (dono_id = auth.uid() or public.eh_admin());
create policy locais_apagar on public.locais
  for delete using (dono_id = auth.uid() or public.eh_admin());

-- Tabelas filhas seguem a permissao do local pai.
create or replace function public.pode_ver_local(p_local uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.locais l
    where l.id = p_local
      and (l.status = 'publicado' or l.dono_id = auth.uid() or public.eh_admin())
  );
$$;

create or replace function public.pode_editar_local(p_local uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.locais l
    where l.id = p_local
      and (l.dono_id = auth.uid() or public.eh_admin())
  );
$$;

create policy horarios_ler on public.locais_horarios
  for select using (public.pode_ver_local(local_id));
create policy horarios_mexer on public.locais_horarios
  for all using (public.pode_editar_local(local_id))
  with check (public.pode_editar_local(local_id));

create policy fotos_ler on public.locais_fotos
  for select using (public.pode_ver_local(local_id));
create policy fotos_mexer on public.locais_fotos
  for all using (public.pode_editar_local(local_id))
  with check (public.pode_editar_local(local_id));

create policy locais_tags_ler on public.locais_tags
  for select using (public.pode_ver_local(local_id));
create policy locais_tags_mexer on public.locais_tags
  for all using (public.pode_editar_local(local_id))
  with check (public.pode_editar_local(local_id));

create policy itens_ler on public.locais_itens
  for select using (public.pode_ver_local(local_id));
create policy itens_mexer on public.locais_itens
  for all using (public.pode_editar_local(local_id))
  with check (public.pode_editar_local(local_id));

-- Eventos: visitante ve os publicados; quem criou (ou o admin) edita.
create policy eventos_ler on public.eventos
  for select using (
    status = 'publicado' or criado_por = auth.uid() or public.eh_admin()
  );
create policy eventos_criar on public.eventos
  for insert to authenticated with check (criado_por = auth.uid());
create policy eventos_editar on public.eventos
  for update using (criado_por = auth.uid() or public.eh_admin())
  with check (criado_por = auth.uid() or public.eh_admin());
create policy eventos_apagar on public.eventos
  for delete using (criado_por = auth.uid() or public.eh_admin());

-- Roteiros: quem tem o link ve. Criar e livre (visitante sem conta).
create policy roteiros_ler on public.roteiros for select using (true);
create policy roteiros_criar on public.roteiros for insert with check (true);
create policy roteiros_editar on public.roteiros for update using (true);

-- Conversas do chat: so a administracao le. A gravacao e feita pelo
-- servidor (chave de servico), que ignora RLS.
create policy chat_admin on public.chat_conversas
  for select using (public.eh_admin());

-- ============================================================
-- Storage: bucket publico das fotos
-- ============================================================
insert into storage.buckets (id, name, public)
values ('locais', 'locais', true)
on conflict (id) do nothing;

create policy "fotos publicas leitura" on storage.objects
  for select using (bucket_id = 'locais');
create policy "fotos envio autenticado" on storage.objects
  for insert to authenticated with check (bucket_id = 'locais');
create policy "fotos exclusao dono" on storage.objects
  for delete to authenticated using (bucket_id = 'locais' and owner = auth.uid());
