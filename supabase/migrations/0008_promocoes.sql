-- ============================================================
-- Promoções fixas
-- ============================================================
-- "Caipirinha em dobro toda quinta", "chope em dobro no happy hour".
-- Diferente de evento: não tem data marcada, se repete nos dias da semana.
--
-- Não passa por fila de aprovação, de propósito. Promoção muda toda semana,
-- e uma fila viraria gargalo — o Rafael aprovando "chope em dobro" às onze da
-- noite de quinta. Quem publica é o dono; o admin derruba o que não deve
-- estar no ar.
-- ============================================================

create table public.promocoes (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locais(id) on delete cascade,

  titulo text not null,
  descricao text,

  -- Em que dias vale. 0 = domingo ... 6 = sábado.
  -- Vazio quer dizer todos os dias — é o que o comerciante espera ao não
  -- marcar nada, e evita a promoção sumir por esquecimento.
  dias_semana smallint[] not null default '{}',

  -- Faixa de horário, quando a promoção só vale numa parte do dia
  -- (happy hour). Nulo = o dia inteiro.
  hora_inicio time,
  hora_fim time,

  -- Até quando a promoção existe. Nulo = sem prazo.
  vale_ate date,

  imagem_url text,

  -- O dono desliga sem apagar, para religar no mês seguinte.
  ativa boolean not null default true,

  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

create index promocoes_local on public.promocoes (local_id);
create index promocoes_ativas on public.promocoes (ativa, vale_ate);

create trigger promocoes_atualizado_em
  before update on public.promocoes
  for each row execute function public.tocar_atualizado_em();

alter table public.promocoes enable row level security;

-- Qualquer visitante vê promoção ativa de local publicado. O dono e o admin
-- veem também as desligadas, que são as que ele guarda para religar.
create policy promocoes_ler on public.promocoes
  for select using (
    (ativa and public.pode_ver_local(local_id))
    or public.pode_editar_local(local_id)
  );

create policy promocoes_mexer on public.promocoes
  for all using (public.pode_editar_local(local_id))
  with check (public.pode_editar_local(local_id));

-- ------------------------------------------------------------
-- As que valem agora
-- ------------------------------------------------------------
-- A regra de "vale hoje" mora aqui para o site, o chat e o Explorar
-- responderem sempre a mesma coisa.
create or replace function public.promocoes_de_hoje(p_local uuid default null)
returns setof public.promocoes
language sql
stable
security definer
set search_path = public
as $$
  select p.*
  from public.promocoes p
  join public.locais l on l.id = p.local_id
  where l.status = 'publicado'
    and p.ativa
    and (p_local is null or p.local_id = p_local)
    and (p.vale_ate is null or p.vale_ate >= (now() at time zone 'America/Sao_Paulo')::date)
    -- lista vazia = todos os dias
    and (
      cardinality(p.dias_semana) = 0
      or extract(dow from (now() at time zone 'America/Sao_Paulo'))::smallint = any(p.dias_semana)
    )
  order by p.hora_inicio nulls first, p.titulo;
$$;
