-- ============================================================
-- Planos, contagem de visitas e limite de uso do chat
-- ============================================================
-- Tres coisas que preparam o site pra virar negocio:
--
-- 1. plano do estabelecimento — hoje todo mundo entra como "gratis";
--    os niveis pagos ja ficam prontos pra quando a cobranca comecar.
-- 2. visitas por dia — e o numero que se mostra pro comerciante
--    ("seu perfil foi visto 340 vezes esse mes").
-- 3. limite de uso do chat — impede que alguem fique chamando a IA
--    num laco e torre o credito da conta.
-- ============================================================

-- ------------------------------------------------------------
-- 1. Planos
-- ------------------------------------------------------------
alter table public.locais
  add column plano text not null default 'gratis'
    check (plano in ('gratis', 'destaque', 'premium')),
  add column plano_ate date;

comment on column public.locais.plano is
  'gratis = cadastro comum; destaque = aparece antes na busca; premium = destaque + prioridade no chat';
comment on column public.locais.plano_ate is
  'ate quando o plano pago vale. Nulo = plano gratis, sem vencimento.';

create index on public.locais (plano);

-- So a administracao muda o plano de alguem. Sem isto, o proprio dono
-- poderia se promover a premium editando o perfil dele.
create or replace function public.travar_plano()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.plano is distinct from old.plano
      or new.plano_ate is distinct from old.plano_ate
      or new.destaque is distinct from old.destaque)
     and not public.eh_admin() then
    new.plano := old.plano;
    new.plano_ate := old.plano_ate;
    new.destaque := old.destaque;
  end if;
  return new;
end;
$$;

create trigger locais_travar_plano
  before update on public.locais
  for each row execute function public.travar_plano();

-- ------------------------------------------------------------
-- 2. Visitas por dia
-- ------------------------------------------------------------
create table public.visitas (
  local_id uuid not null references public.locais(id) on delete cascade,
  dia date not null,
  contagem integer not null default 0,
  primary key (local_id, dia)
);

alter table public.visitas enable row level security;

-- O dono ve os numeros do lugar dele; o admin ve todos.
create policy visitas_ler on public.visitas
  for select using (public.pode_editar_local(local_id));

-- Somada pelo servidor (chave de servico), que ignora RLS.
create or replace function public.registrar_visita(p_local uuid)
returns void language sql security definer set search_path = public as $$
  insert into public.visitas (local_id, dia, contagem)
  values (p_local, (now() at time zone 'America/Sao_Paulo')::date, 1)
  on conflict (local_id, dia)
  do update set contagem = public.visitas.contagem + 1;
$$;

-- ------------------------------------------------------------
-- 3. Limite de uso do chat
-- ------------------------------------------------------------
-- Uma linha por (quem, faixa de tempo). "quem" e um resumo embaralhado do
-- endereco de rede do visitante — nao da pra voltar ao endereco original —
-- ou a palavra 'site', que conta o total do dia inteiro.
create table public.chat_uso (
  chave text not null,
  janela timestamptz not null,
  contagem integer not null default 0,
  primary key (chave, janela)
);

create index on public.chat_uso (janela);

alter table public.chat_uso enable row level security;

create policy chat_uso_admin on public.chat_uso
  for select using (public.eh_admin());

/**
 * Soma 1 no contador e devolve quanto ficou.
 * O servidor compara esse numero com o limite e decide se responde.
 */
create or replace function public.somar_uso_chat(p_chave text, p_janela timestamptz)
returns integer language plpgsql security definer set search_path = public as $$
declare
  v_total integer;
begin
  insert into public.chat_uso (chave, janela, contagem)
  values (p_chave, p_janela, 1)
  on conflict (chave, janela)
  do update set contagem = public.chat_uso.contagem + 1
  returning contagem into v_total;

  -- Faxina barata: de vez em quando joga fora o que ja passou de 3 dias.
  if random() < 0.02 then
    delete from public.chat_uso where janela < now() - interval '3 days';
  end if;

  return v_total;
end;
$$;
