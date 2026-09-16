-- ============================================================
-- Planos: gratuito e premium
-- ============================================================
-- O banco nasceu com tres planos (gratis, destaque, premium). O "destaque"
-- nunca foi usado por ninguem e se confundia com a coluna "destaque", que e
-- outra coisa: o selo editorial que o admin poe num lugar bonito. Ficam dois.
--
-- O vencimento nao tem rotina noturna: o site calcula na hora se o premium
-- ainda vale. Rotina que roda de madrugada falha em silencio, e o comerciante
-- so descobre quando liga reclamando.
-- ============================================================

-- ------------------------------------------------------------
-- 1. De tres planos para dois
-- ------------------------------------------------------------
alter table public.locais drop constraint locais_plano_check;

-- A trava que impede o dono de se promover sozinho precisa sair de cena aqui.
-- Ela reverte qualquer mudanca de plano feita por quem nao e admin — e a
-- migracao roda sem usuario nenhum, entao ela desfazia a conversao e o banco
-- recusava a regra nova. A trava fez exatamente o que devia; e este trecho
-- que precisava avisar.
alter table public.locais disable trigger locais_travar_plano;

-- Os 14 locais de hoje estao todos em "gratis".
update public.locais set plano = 'gratuito' where plano in ('gratis', 'destaque');

alter table public.locais enable trigger locais_travar_plano;

alter table public.locais alter column plano set default 'gratuito';

alter table public.locais
  add constraint locais_plano_check check (plano in ('gratuito', 'premium'));

comment on column public.locais.plano is
  'gratuito ou premium. Premium so vale de verdade se plano_ate ainda nao passou.';

-- Desde quando e premium. Serve para o historico e para o admin saber ha
-- quanto tempo aquele comercio paga.
alter table public.locais add column plano_desde date;

-- ------------------------------------------------------------
-- 2. Historico de planos
-- ------------------------------------------------------------
-- Quem ja foi premium e quando. Sem isso, um comercio que pagou seis meses e
-- parou vira um gratuito qualquer, e ninguem lembra que ele ja foi cliente.
create table public.planos_historico (
  id bigint generated always as identity primary key,
  local_id uuid not null references public.locais(id) on delete cascade,
  plano text not null check (plano in ('gratuito', 'premium')),
  inicio date not null,
  fim date,
  quem uuid references auth.users(id) on delete set null,
  observacao text,
  criado_em timestamptz not null default now()
);

create index planos_historico_local on public.planos_historico (local_id, inicio desc);

alter table public.planos_historico enable row level security;

-- O dono ve o proprio historico; so o admin escreve.
create policy planos_historico_ler on public.planos_historico
  for select using (public.pode_editar_local(local_id) or public.eh_admin());
create policy planos_historico_admin on public.planos_historico
  for all using (public.eh_admin()) with check (public.eh_admin());

-- ------------------------------------------------------------
-- 3. A trava do plano passa a cobrir a data de inicio
-- ------------------------------------------------------------
-- Sem isto, o dono poderia antecipar o proprio plano_desde. Nao muda nada de
-- dinheiro, mas sujaria o historico.
create or replace function public.travar_plano()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.plano is distinct from old.plano
      or new.plano_ate is distinct from old.plano_ate
      or new.plano_desde is distinct from old.plano_desde
      or new.destaque is distinct from old.destaque)
     and not public.eh_admin() then
    new.plano := old.plano;
    new.plano_ate := old.plano_ate;
    new.plano_desde := old.plano_desde;
    new.destaque := old.destaque;
  end if;
  return new;
end;
$$;

-- ------------------------------------------------------------
-- 4. Quem e premium AGORA
-- ------------------------------------------------------------
-- Uma regra so, no banco, para o site e para as consultas concordarem sempre.
-- Premium vencido responde falso sem ninguem precisar rebaixar nada.
create or replace function public.eh_premium(p_local uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.locais
    where id = p_local
      and plano = 'premium'
      and (plano_ate is null or plano_ate >= (now() at time zone 'America/Sao_Paulo')::date)
  );
$$;
