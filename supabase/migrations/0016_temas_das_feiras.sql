-- ============================================================
-- Temas das feiras
-- ============================================================
-- Durante a Feira das Flores, a Feira do Mel e o Kerb, o site veste a
-- roupa da festa: a cor dos titulos e dos links muda, a capa ganha o veu
-- na cor do tema, aparece o selo com o nome e as datas, e a Inicio ganha
-- um bloco com programacao, expositores e rota.
--
-- Comeca e termina sozinho. E uma data de inicio e uma de fim, e nada
-- mais: ninguem precisa lembrar de "desligar a feira" na segunda-feira de
-- manha, que e justamente quando ninguem lembra.
--
-- As datas nascem NULAS de proposito. Os tres temas entram com nome,
-- cores e logo, mas sem periodo — inventar data de feira seria pior do
-- que nao ter data nenhuma, porque o site anunciaria uma festa no dia
-- errado. Tema sem periodo nunca fica ativo.
-- ============================================================

create table if not exists public.temas (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  nome text not null,
  -- "19ª edicao", "31º" — o que acompanha o nome no selo
  subtitulo text,

  inicio date,
  fim date,

  -- a cor principal do tema: titulos, links, icones, veu da capa
  cor text not null,
  -- a cor clara de apoio, para detalhe sobre o escuro
  cor_destaque text,
  -- o segundo escuro, quando a identidade tem um (o preto do Kerb)
  cor_escura text,

  logo_url text,
  capa_url text,

  -- um item por linha; a tela quebra e monta a lista
  programacao text,
  expositores text,

  -- para o botao "Como chegar"
  onde text,
  lat double precision,
  lng double precision,
  link_programacao text,

  -- os estabelecimentos que estao na feira, para o filtro "Na feira"
  locais uuid[] not null default '{}',

  publicado boolean not null default false,
  criado_em timestamptz not null default now(),

  -- uma feira que termina antes de comecar e erro de digitacao, e o banco
  -- e o unico lugar que pega isso antes de o site anunciar
  constraint periodo_coerente check (inicio is null or fim is null or fim >= inicio)
);

comment on table public.temas is
  'A roupagem temporaria do site durante as feiras da cidade.';

create index if not exists temas_periodo on public.temas (inicio, fim)
  where publicado;

alter table public.temas enable row level security;

-- Quem visita ve so o que esta publicado; a administracao ve e mexe em tudo.
drop policy if exists temas_leitura on public.temas;
create policy temas_leitura on public.temas
  for select using (publicado or public.eh_admin());

drop policy if exists temas_escrita on public.temas;
create policy temas_escrita on public.temas
  for all using (public.eh_admin()) with check (public.eh_admin());

-- ------------------------------------------------------------
-- Os tres temas, sem periodo
-- ------------------------------------------------------------
-- As cores vem do documento de desenho. O logo e a capa entram pelo
-- painel, que e onde voce tem os arquivos.
insert into public.temas (slug, nome, subtitulo, cor, cor_destaque, cor_escura)
values
  (
    'feira-das-flores',
    'Feira das Flores',
    null,
    '#3E7A3C', '#C9E5B8', null
  ),
  (
    'feira-do-mel',
    'Feira do Mel, Rosca e Nata',
    '19ª edição',
    '#B5541A', '#FFD79A', null
  ),
  (
    'kerb-in-ivoti',
    'Kerb in Ivoti',
    '31º',
    '#C8102E', '#FFCE00', '#1A1A1A'
  )
on conflict (slug) do nothing;
