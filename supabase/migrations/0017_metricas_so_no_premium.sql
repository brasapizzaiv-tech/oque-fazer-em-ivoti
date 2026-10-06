-- ============================================================
-- As metricas passam a ser premium no banco, nao so na tela
-- ============================================================
-- O bloqueio do plano gratuito era visual: a tela mostrava numeros de
-- mentira desfocados, e os de verdade nunca saiam do servidor. Mas a
-- REGRA DO BANCO deixava o dono ler a tabela inteira, e o site publica a
-- chave de acesso no navegador — qualquer comerciante que abrisse o
-- console via os proprios numeros sem pagar.
--
-- Nao era um vazamento de dado de terceiro: cada um so enxergava o
-- proprio. Era um recurso pago que, na pratica, nao estava trancado.
--
-- O conserto vai na politica. Dai o desfoque deixa de ser a tranca e
-- passa a ser so o aviso de que existe uma.
--
-- O total de acessos continua de graca — e de proposito, e o numero que
-- faz o comerciante querer saber o resto. Como a tabela fechou, ele vem
-- por uma funcao que devolve SO esse total e mais nada.
-- ============================================================

-- ------------------------------------------------------------
-- O plano, do lado do banco
-- ------------------------------------------------------------
-- A mesma regra que o site usa em lib/planos.ts: premium so vale
-- enquanto a data nao passou, e a data e a de Ivoti, nao a do servidor.
-- Um servidor em UTC vira o dia tres horas antes e cortaria o premium de
-- alguem no fim da noite do ultimo dia.
create or replace function public.plano_ativo(p_local uuid)
returns text language sql stable security definer set search_path = public as $$
  select case
    when l.plano = 'premium'
     and (l.plano_ate is null
          or l.plano_ate >= (now() at time zone 'America/Sao_Paulo')::date)
    then 'premium'
    else 'gratuito'
  end
  from public.locais l
  where l.id = p_local;
$$;

comment on function public.plano_ativo(uuid) is
  'O plano que vale hoje para o local, ja considerando o vencimento.';

-- ------------------------------------------------------------
-- Quem pode ver os numeros
-- ------------------------------------------------------------
create or replace function public.pode_ver_metricas(p_local uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.eh_admin()
      or (public.pode_editar_local(p_local)
          and public.plano_ativo(p_local) = 'premium');
$$;

comment on function public.pode_ver_metricas(uuid) is
  'Dono com premium ativo, ou a administracao.';

-- ------------------------------------------------------------
-- A politica
-- ------------------------------------------------------------
-- As linhas com local_id nulo sao as do site inteiro e seguem so para a
-- administracao, como antes.
drop policy if exists metricas_ler on public.metricas_dia;
create policy metricas_ler on public.metricas_dia
  for select using (
    (local_id is not null and public.pode_ver_metricas(local_id))
    or public.eh_admin()
  );

-- ------------------------------------------------------------
-- O numero que continua de graca
-- ------------------------------------------------------------
-- Devolve so a soma dos acessos do periodo. Quem nao e dono nem
-- administracao recebe erro, e nao zero: zero seria uma resposta
-- plausivel e errada, e esconderia que alguem perguntou o que nao devia.
create or replace function public.acessos_do_local(
  p_local uuid,
  p_dias integer default 30
)
returns integer language plpgsql stable security definer set search_path = public as $$
declare
  v_total integer;
begin
  if not public.pode_editar_local(p_local) then
    raise exception 'sem permissao para ver os acessos deste local';
  end if;

  select coalesce(sum(m.contagem), 0) into v_total
  from public.metricas_dia m
  where m.local_id = p_local
    and m.tipo = 'pagina'
    and m.dia >= (now() at time zone 'America/Sao_Paulo')::date
                 - (greatest(p_dias, 1) - 1);

  return v_total;
end;
$$;

comment on function public.acessos_do_local(uuid, integer) is
  'O total de acessos do periodo. O unico numero que o plano gratuito ve.';
