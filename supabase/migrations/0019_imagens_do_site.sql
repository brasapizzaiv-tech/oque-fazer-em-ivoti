-- ============================================================
-- As imagens do site, trocaveis pelo painel
-- ============================================================
-- A foto de fundo e as capas de cada tela estavam escritas no codigo.
-- Trocar qualquer uma exigia publicar o site de novo — o que, na pratica,
-- significa que nunca mudariam: as duas unicas fotos do projeto estavam
-- vestindo dez telas.
--
-- Chave e valor, e nao uma coluna por tela, porque tela nova aparece e
-- coluna nova pede migracao. Assim, acrescentar a capa da Agenda e
-- escrever uma linha.
--
-- O que nao tiver linha aqui continua usando a foto que esta no codigo.
-- Nenhuma tela fica sem imagem por falta de cadastro.
-- ============================================================

create table if not exists public.imagens_do_site (
  chave text primary key,
  url text,
  -- para quem for trocar saber o que esta trocando
  descricao text not null,
  ordem integer not null default 0,
  atualizada_em timestamptz not null default now()
);

comment on table public.imagens_do_site is
  'A foto de fundo e as capas das telas. Vazio = usa a do codigo.';

alter table public.imagens_do_site enable row level security;

-- Todo mundo le: sao as imagens que o site mostra.
drop policy if exists imagens_leitura on public.imagens_do_site;
create policy imagens_leitura on public.imagens_do_site for select using (true);

drop policy if exists imagens_escrita on public.imagens_do_site;
create policy imagens_escrita on public.imagens_do_site
  for all using (public.eh_admin()) with check (public.eh_admin());

-- Os lugares que hoje tem foto fixa. Entram sem url: cada um segue com a
-- do codigo ate alguem subir outra.
insert into public.imagens_do_site (chave, descricao, ordem) values
  ('fundo',          'O fundo de todo o site, atrás do conteúdo', 1),
  ('capa-inicio',    'A capa da primeira tela, a maior do site',  2),
  ('capa-explorar',  'A faixa atrás do título do Explorar',       3),
  ('capa-agenda',    'A faixa atrás do título da Agenda',         4),
  ('capa-mapa',      'A faixa atrás do título do Mapa',           5),
  ('capa-roteiros',  'A faixa atrás do título dos Roteiros',      6),
  ('capa-caminhos',  'A faixa atrás do título de um caminho',     7),
  ('capa-conta',     'A tira no alto das telas de entrar e cadastrar', 8)
on conflict (chave) do nothing;
