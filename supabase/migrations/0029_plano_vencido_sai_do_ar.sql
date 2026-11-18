-- ============================================================
-- Plano vencido tira a promocao e o evento do ar
-- ============================================================
-- Decisao do Rafael em 18/11/2026: quem nao pagou nao tem por que
-- aparecer. Ate aqui o plano so fechava a CRIACAO (0021): quem pagava um
-- mes de Movimento, cadastrava uma promocao sem prazo e parava de pagar
-- continuava com ela na capa do guia para sempre.
--
-- Nada e apagado. A promocao e o evento ficam guardados e voltam ao ar
-- sozinhos no dia em que o plano for renovado. O dono continua podendo
-- editar e apagar o que e dele.
--
-- A regra entra nas duas funcoes que o site e o Guia ja usam para
-- perguntar "o que esta valendo", entao tela e chat mudam juntos.
--
-- Promocao sempre pertence a um lugar: vale o plano daquele lugar.
--
-- Evento pode acontecer fora do estabelecimento (praca, salao), entao a
-- pergunta e sobre QUEM o cadastrou, como ja era na criacao (0021):
--   - sem autor (os eventos da cidade, que entram por SQL) ou cadastrado
--     pela administracao: aparece sempre;
--   - cadastrado por comerciante: aparece enquanto ele tiver ao menos um
--     estabelecimento com o plano Movimento ou acima.
-- ============================================================

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
    -- o plano do lugar ainda cobre promocoes
    and public.tem_plano(l.id, 'movimento')
    and (p_local is null or p.local_id = p_local)
    and (p.vale_ate is null or p.vale_ate >= (now() at time zone 'America/Sao_Paulo')::date)
    -- lista vazia = todos os dias
    and (
      cardinality(p.dias_semana) = 0
      or extract(dow from (now() at time zone 'America/Sao_Paulo'))::smallint = any(p.dias_semana)
    )
  order by p.hora_inicio nulls first, p.titulo;
$$;


create or replace function public.eventos_visiveis()
returns setof public.eventos
language sql
stable
security definer
set search_path = public
as $$
  select e.*
  from public.eventos e
  where e.status = 'publicado'
    and (e.publicar_em is null or e.publicar_em <= now())
    and (
      case when e.sem_hora
        -- vale o dia todo, ate o ultimo dia: compara com a meia-noite de
        -- hoje em Ivoti
        then coalesce(e.fim, e.inicio)
               >= date_trunc('day', now() at time zone 'America/Sao_Paulo')
                    at time zone 'America/Sao_Paulo'
        -- com fim informado, ate o fim; sem fim, seis horas de folga: um
        -- evento que comecou as 14h ainda interessa a quem pergunta as 16h
        else coalesce(e.fim, e.inicio + interval '6 hours') >= now()
      end
    )
    -- Ou o evento nao tem lugar cadastrado, ou o lugar dele esta no ar.
    and (
      e.local_id is null
      or exists (
        select 1 from public.locais l
         where l.id = e.local_id
           and l.status = 'publicado'
      )
    )
    -- Evento de comerciante so aparece enquanto o plano dele cobre eventos.
    and (
      e.criado_por is null
      or exists (
        select 1 from public.perfis p
         where p.id = e.criado_por
           and p.papel = 'admin'
      )
      or exists (
        select 1 from public.locais l
         where l.dono_id = e.criado_por
           and public.tem_plano(l.id, 'movimento')
      )
    )
  order by e.inicio;
$$;


-- ------------------------------------------------------------
-- Ensaio
-- ------------------------------------------------------------
-- Da (de mentira) o plano Movimento a um comerciante, cadastra uma
-- promocao e um evento, e confere que os dois aparecem; vence o plano e
-- confere que somem; por fim, que o evento da cidade no mesmo lugar
-- continua na agenda. Tudo desfeito no fim.
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
    -- So este lugar conta: os outros do mesmo dono ficam sem plano.
    update public.locais set plano = 'gratuito', plano_ate = null
     where dono_id = v_dono and id <> v_local;
    update public.locais set plano = 'movimento', plano_ate = v_hoje + 1
     where id = v_local;

    insert into public.promocoes (local_id, titulo)
    values (v_local, 'ENSAIO 0029')
    returning id into v_promo;

    insert into public.eventos (local_id, titulo, inicio, status, criado_por)
    values (v_local, 'ENSAIO 0029', now() + interval '1 day', 'publicado', v_dono)
    returning id into v_evento;

    -- Plano em dia: os dois no ar.
    if not exists (select 1 from public.promocoes_de_hoje(v_local) where id = v_promo) then
      raise exception 'ENSAIO: com o plano em dia a promocao nao apareceu.';
    end if;
    if not exists (select 1 from public.eventos_visiveis() where id = v_evento) then
      raise exception 'ENSAIO: com o plano em dia o evento nao apareceu.';
    end if;

    -- Plano vencido ontem: os dois fora.
    update public.locais set plano_ate = v_hoje - 1 where id = v_local;
    if exists (select 1 from public.promocoes_de_hoje(v_local) where id = v_promo) then
      raise exception 'ENSAIO: plano vencido e a promocao continuou no ar.';
    end if;
    if exists (select 1 from public.eventos_visiveis() where id = v_evento) then
      raise exception 'ENSAIO: plano vencido e o evento continuou na agenda.';
    end if;

    -- Plano em dia, mas abaixo do Movimento: os dois fora.
    update public.locais set plano = 'presenca', plano_ate = v_hoje + 30
     where id = v_local;
    if exists (select 1 from public.promocoes_de_hoje(v_local) where id = v_promo) then
      raise exception 'ENSAIO: plano Presenca e a promocao apareceu.';
    end if;
    if exists (select 1 from public.eventos_visiveis() where id = v_evento) then
      raise exception 'ENSAIO: plano Presenca e o evento apareceu.';
    end if;

    -- Renovou: voltam sozinhos.
    update public.locais set plano = 'campanha', plano_ate = v_hoje + 30
     where id = v_local;
    if not exists (select 1 from public.promocoes_de_hoje(v_local) where id = v_promo) then
      raise exception 'ENSAIO: plano renovado e a promocao nao voltou.';
    end if;
    if not exists (select 1 from public.eventos_visiveis() where id = v_evento) then
      raise exception 'ENSAIO: plano renovado e o evento nao voltou.';
    end if;

    -- Evento da cidade (sem autor) num lugar sem plano: continua na agenda.
    update public.locais set plano = 'gratuito', plano_ate = null where id = v_local;
    update public.eventos set criado_por = null where id = v_evento;
    if not exists (select 1 from public.eventos_visiveis() where id = v_evento) then
      raise exception 'ENSAIO: o evento da cidade saiu da agenda.';
    end if;

    raise exception 'ensaio concluido' using errcode = 'ZZ029';
  exception when sqlstate 'ZZ029' then
    raise notice 'Ensaio do plano vencido: passou.';
  end;
end $$;
