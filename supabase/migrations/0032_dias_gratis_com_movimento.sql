-- ============================================================
-- Os dias gratis valem como plano Movimento
-- ============================================================
-- Decisao do Rafael em 26/11/2026: nos 60 dias gratis o comerciante usa o
-- que o plano Movimento libera (eventos, promocoes e metricas), para
-- testar tudo e saber se e o que ele quer antes de escolher um plano.
--
-- Ate aqui o periodo gratis so mantinha o lugar no ar. O comerciante
-- abria o painel no primeiro dia e encontrava os tres modulos trancados,
-- pedindo um plano que ele ainda nao tinha como avaliar.
--
-- Como o resto dos planos, isto e uma CONTA, nao uma faxina: ninguem
-- marca nem desmarca nada. Enquanto `gratis_ate` nao passou, o lugar
-- responde como Movimento; no dia seguinte volta a valer so o plano pago.
--
--   plano_ativo   continua sendo o plano PAGO (e o que a administracao
--                 marca e o que entra na conta do que se recebe por mes);
--   plano_em_uso  e o que o lugar pode usar hoje: o pago, ou o Movimento
--                 dos dias gratis, o que for mais alto.
--
-- `tem_plano` passa a perguntar pelo plano em uso. E dela que dependem a
-- criacao de eventos e promocoes (0021), o que aparece no site (0029,
-- 0030) e a leitura das metricas, entao tudo muda junto.
--
-- O periodo gratis comeca no dia em que o lugar entra no ar (0028). Antes
-- disso, no rascunho, nao ha `gratis_ate` e nada e liberado: senao uma
-- conta que nunca publica um lugar teria os modulos para sempre.
--
-- Quem paga o Presenca antes de os dias gratis terminarem nao perde nada:
-- segue como Movimento ate a data do periodo gratis.
--
-- O "movimento" daqui e o PLANO_DOS_DIAS_GRATIS de lib/planos.ts. Mudou
-- um, mude o outro.
-- ============================================================

create or replace function public.plano_em_uso(p_local uuid)
returns text language sql stable security definer set search_path = public as $$
  select case
    when l.gratis_ate is not null
     and l.gratis_ate >= (now() at time zone 'America/Sao_Paulo')::date
     and public.nivel_do_plano(public.plano_ativo(l.id))
           < public.nivel_do_plano('movimento')
    then 'movimento'
    else public.plano_ativo(l.id)
  end
  from public.locais l
  where l.id = p_local;
$$;

comment on function public.plano_em_uso(uuid) is
  'O plano que o local pode usar hoje: o pago, ou o Movimento dos dias gratis, o que for mais alto.';

comment on function public.plano_ativo(uuid) is
  'O plano PAGO que vale hoje (vencido responde gratuito). Nao conta os dias gratis: para isso, plano_em_uso.';

create or replace function public.tem_plano(p_local uuid, p_minimo text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.nivel_do_plano(public.plano_em_uso(p_local))
      >= public.nivel_do_plano(p_minimo);
$$;

comment on function public.tem_plano(uuid, text) is
  'O plano em uso do local (o pago ou o dos dias gratis) alcanca o degrau pedido?';


-- ------------------------------------------------------------
-- Ensaio
-- ------------------------------------------------------------
-- Mexe (de mentira) nas datas de um lugar de comerciante e confere o que
-- o periodo gratis libera e quando deixa de liberar. Tudo desfeito.
do $$
declare
  v_dono   uuid;
  v_local  uuid;
  v_promo  uuid;
  v_evento uuid;
  v_hoje   date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  select l.id, l.dono_id into v_local, v_dono
    from public.locais l
    join public.perfis p on p.id = l.dono_id
   where p.papel = 'dono' and l.status = 'publicado'
   limit 1;

  if v_local is null then
    raise notice 'Ensaio pulado: nao ha lugar publicado de comerciante.';
    return;
  end if;

  begin
    -- So este lugar conta: os outros do mesmo dono ficam sem plano e com
    -- os dias gratis ja terminados.
    update public.locais
       set plano = 'gratuito', plano_ate = null, gratis_ate = v_hoje - 30
     where dono_id = v_dono and id <> v_local;

    insert into public.promocoes (local_id, titulo)
    values (v_local, 'ENSAIO 0032')
    returning id into v_promo;

    insert into public.eventos (local_id, titulo, inicio, status, criado_por)
    values (v_local, 'ENSAIO 0032', now() + interval '1 day', 'publicado', v_dono)
    returning id into v_evento;

    -- 1. Sem plano pago, dias gratis valendo: usa o Movimento, e so ele.
    update public.locais
       set plano = 'gratuito', plano_ate = null, gratis_ate = v_hoje + 10
     where id = v_local;
    if public.plano_ativo(v_local) <> 'gratuito' then
      raise exception 'ENSAIO 1: o plano pago deixou de ser "gratuito" (%).',
        public.plano_ativo(v_local);
    end if;
    if public.plano_em_uso(v_local) <> 'movimento' then
      raise exception 'ENSAIO 1: nos dias gratis o plano em uso ficou %.',
        public.plano_em_uso(v_local);
    end if;
    if not public.tem_plano(v_local, 'movimento') then
      raise exception 'ENSAIO 1: nos dias gratis o Movimento nao foi liberado.';
    end if;
    if public.tem_plano(v_local, 'campanha') then
      raise exception 'ENSAIO 1: os dias gratis liberaram o Campanha.';
    end if;
    if not exists (select 1 from public.promocoes_de_hoje(v_local) where id = v_promo) then
      raise exception 'ENSAIO 1: nos dias gratis a promocao nao apareceu.';
    end if;
    if not exists (select 1 from public.eventos_visiveis() where id = v_evento) then
      raise exception 'ENSAIO 1: nos dias gratis o evento nao apareceu.';
    end if;

    -- 2. Ultimo dia do periodo gratis: ainda vale.
    update public.locais set gratis_ate = v_hoje where id = v_local;
    if not public.tem_plano(v_local, 'movimento') then
      raise exception 'ENSAIO 2: no ultimo dia gratis o Movimento ja tinha fechado.';
    end if;

    -- 3. Terminou ontem: o lugar segue no ar (sete dias de prazo), mas o
    --    que e do Movimento fecha.
    update public.locais set gratis_ate = v_hoje - 1 where id = v_local;
    if public.tem_plano(v_local, 'movimento') then
      raise exception 'ENSAIO 3: dias gratis terminados e o Movimento continuou aberto.';
    end if;
    if exists (select 1 from public.promocoes_de_hoje(v_local) where id = v_promo) then
      raise exception 'ENSAIO 3: dias gratis terminados e a promocao continuou no ar.';
    end if;
    if exists (select 1 from public.eventos_visiveis() where id = v_evento) then
      raise exception 'ENSAIO 3: dias gratis terminados e o evento continuou na agenda.';
    end if;

    -- 4. Pagou o Presenca com os dias gratis ainda valendo: segue como
    --    Movimento ate a data; depois, so o Presenca.
    update public.locais
       set plano = 'presenca', plano_ate = v_hoje + 30, gratis_ate = v_hoje + 5
     where id = v_local;
    if not public.tem_plano(v_local, 'movimento') then
      raise exception 'ENSAIO 4: Presenca pago nos dias gratis perdeu o Movimento.';
    end if;
    update public.locais set gratis_ate = v_hoje - 1 where id = v_local;
    if public.tem_plano(v_local, 'movimento') then
      raise exception 'ENSAIO 4: Presenca depois dos dias gratis ficou com o Movimento.';
    end if;
    if not public.tem_plano(v_local, 'presenca') then
      raise exception 'ENSAIO 4: o Presenca pago deixou de valer.';
    end if;

    -- 5. Campanha pago nos dias gratis: vale o Campanha, nao desce.
    update public.locais
       set plano = 'campanha', plano_ate = v_hoje + 30, gratis_ate = v_hoje + 5
     where id = v_local;
    if public.plano_em_uso(v_local) <> 'campanha' then
      raise exception 'ENSAIO 5: Campanha pago nos dias gratis virou %.',
        public.plano_em_uso(v_local);
    end if;

    raise exception 'ensaio concluido' using errcode = 'ZZ032';
  exception when sqlstate 'ZZ032' then
    raise notice 'Ensaio dos dias gratis com Movimento: passou.';
  end;
end $$;
