-- ============================================================
-- Sete dias para escolher um plano; depois, o lugar sai do ar
-- ============================================================
-- Decisao do Rafael em 18/11/2026: ao completar os 60 dias gratis, o
-- comerciante e avisado e tem mais 7 dias para escolher um plano. Se nao
-- escolher, o estabelecimento sai do site ate escolher.
--
-- A mesma regra vale para quem tinha plano pago e deixou vencer: 7 dias
-- de prazo a partir do vencimento.
--
-- Como o resto dos planos, isto e uma CONTA, nao uma faxina: ninguem
-- precisa rodar nada no dia certo para o lugar sair nem para ele voltar.
-- O banco guarda, em cada lugar, ate que dia ele fica no ar; as consultas
-- comparam com a data de hoje em Ivoti.
--
--   no_ar_ate = o maior entre o fim do periodo gratis e o fim do plano,
--               mais 7 dias.
--
-- Fica vazio (sem limite) para:
--   - ponto da cidade (lugar sem dono) e lugar que ainda nao foi ao ar;
--   - plano pago sem data de vencimento.
--
-- Nada e apagado e o status nao muda: o lugar continua "publicado", so
-- deixa de aparecer para o visitante. O dono e a administracao continuam
-- vendo e editando. No dia em que a administracao marca um plano, a data
-- anda para a frente e o lugar volta sozinho.
--
-- O 7 daqui e o DIAS_DE_PRAZO de lib/planos.ts. Mudou um, mude o outro.
--
-- Os e-mails de aviso nao moram aqui: saem do site uma vez por dia
-- (/api/cron/prazos) e ficam anotados em avisos_de_prazo, para ninguem
-- receber o mesmo recado duas vezes.
-- ============================================================

alter table public.locais
  add column if not exists no_ar_ate date
  generated always as (
    case
      when dono_id is null or gratis_ate is null then null
      when plano in ('presenca', 'movimento', 'campanha') and plano_ate is null then null
      -- greatest ignora o que estiver vazio
      else greatest(gratis_ate, plano_ate) + 7
    end
  ) stored;

comment on column public.locais.no_ar_ate is
  'Ultimo dia em que o lugar aparece no site sem plano em dia: fim do periodo gratis ou do plano, o que for maior, mais 7 dias. Vazio = sem limite. Calculado sozinho.';

comment on column public.locais.plano_ate is
  'Ultimo dia do plano pago. Quando a administracao encerra um plano a mao, fica com a data do encerramento, para os 7 dias de prazo contarem dali.';


-- ------------------------------------------------------------
-- Quem o visitante enxerga
-- ------------------------------------------------------------
drop policy if exists locais_ler_publicados on public.locais;

create policy locais_ler_publicados on public.locais
  for select using (
    (
      status = 'publicado'
      and (no_ar_ate is null
           or no_ar_ate >= (now() at time zone 'America/Sao_Paulo')::date)
    )
    or dono_id = auth.uid()
    or public.eh_admin()
  );

-- Fotos, horarios, cardapio e etiquetas perguntam aqui.
create or replace function public.pode_ver_local(p_local uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.locais l
    where l.id = p_local
      and (
        (
          l.status = 'publicado'
          and (l.no_ar_ate is null
               or l.no_ar_ate >= (now() at time zone 'America/Sao_Paulo')::date)
        )
        or l.dono_id = auth.uid()
        or public.eh_admin()
      )
  );
$$;


-- ------------------------------------------------------------
-- A agenda: evento de lugar fora do ar tambem sai
-- ------------------------------------------------------------
-- Igual a da 0029, com a data-limite somada ao "o lugar dele esta no ar".
-- Sem isso o card do evento apareceria com um link para pagina que nao
-- abre.
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
           and (l.no_ar_ate is null
                or l.no_ar_ate >= (now() at time zone 'America/Sao_Paulo')::date)
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
-- Os avisos ja mandados
-- ------------------------------------------------------------
-- Uma linha por recado: "prazo" (o gratis ou o plano terminou, voce tem 7
-- dias) e "fora" (saiu do ar). A referencia e a data em que a cobertura
-- terminou: se o comerciante pagar, deixar vencer de novo e cair no
-- prazo outra vez, a data e outra e ele e avisado outra vez.
create table if not exists public.avisos_de_prazo (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locais(id) on delete cascade,
  tipo text not null check (tipo in ('prazo', 'fora')),
  referencia date not null,
  enviado_em timestamptz not null default now(),
  unique (local_id, tipo, referencia)
);

alter table public.avisos_de_prazo enable row level security;

-- So a administracao le. Quem grava e o servidor do site, com a chave de
-- servico, que nao passa por estas regras.
drop policy if exists avisos_de_prazo_ler on public.avisos_de_prazo;
create policy avisos_de_prazo_ler on public.avisos_de_prazo
  for select using (public.eh_admin());


-- ------------------------------------------------------------
-- Ensaio
-- ------------------------------------------------------------
-- Mexe (de mentira) nas datas de um lugar de comerciante e confere, com
-- os olhos do visitante, quando ele aparece e quando some. Tudo desfeito.
do $$
declare
  v_local  uuid;
  v_evento uuid;
  v_ate    date;
  v_ve     integer;
  v_hoje   date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  select l.id into v_local
    from public.locais l
    join public.perfis p on p.id = l.dono_id
   where p.papel = 'dono' and l.status = 'publicado'
   limit 1;

  if v_local is null then
    raise notice 'Ensaio pulado: nao ha lugar publicado de comerciante.';
    return;
  end if;

  begin
    insert into public.eventos (local_id, titulo, inicio, status)
    values (v_local, 'ENSAIO 0030', now() + interval '1 day', 'publicado')
    returning id into v_evento;

    -- 1. Gratis terminou ha 7 dias: hoje e o ultimo dia no ar.
    update public.locais
       set plano = 'gratuito', plano_ate = null, gratis_ate = v_hoje - 7
     where id = v_local;
    select no_ar_ate into v_ate from public.locais where id = v_local;
    if v_ate is distinct from v_hoje then
      raise exception 'ENSAIO 1: a data-limite ficou %, esperava %.', v_ate, v_hoje;
    end if;
    set local role anon;
    select count(*) into v_ve from public.locais where id = v_local;
    reset role;
    if v_ve <> 1 then
      raise exception 'ENSAIO 1: no ultimo dia do prazo o visitante ja nao via o lugar.';
    end if;
    if not public.pode_ver_local(v_local) then
      raise exception 'ENSAIO 1: no ultimo dia do prazo as fotos ja estavam fechadas.';
    end if;
    if not exists (select 1 from public.eventos_visiveis() where id = v_evento) then
      raise exception 'ENSAIO 1: no ultimo dia do prazo o evento ja tinha saido.';
    end if;

    -- 2. Passou um dia do prazo: fora do ar.
    update public.locais set gratis_ate = v_hoje - 8 where id = v_local;
    set local role anon;
    select count(*) into v_ve from public.locais where id = v_local;
    reset role;
    if v_ve <> 0 then
      raise exception 'ENSAIO 2: prazo vencido e o visitante continuou vendo o lugar.';
    end if;
    if public.pode_ver_local(v_local) then
      raise exception 'ENSAIO 2: prazo vencido e as fotos continuaram abertas.';
    end if;
    if exists (select 1 from public.eventos_visiveis() where id = v_evento) then
      raise exception 'ENSAIO 2: prazo vencido e o evento do lugar continuou na agenda.';
    end if;

    -- 3. A administracao marcou um plano: volta sozinho.
    update public.locais set plano = 'presenca', plano_ate = v_hoje + 30
     where id = v_local;
    set local role anon;
    select count(*) into v_ve from public.locais where id = v_local;
    reset role;
    if v_ve <> 1 then
      raise exception 'ENSAIO 3: com plano em dia o lugar nao voltou.';
    end if;

    -- 4. O plano venceu ha 8 dias: fora. Ha 7: ainda no ar.
    update public.locais set plano_ate = v_hoje - 8 where id = v_local;
    set local role anon;
    select count(*) into v_ve from public.locais where id = v_local;
    reset role;
    if v_ve <> 0 then
      raise exception 'ENSAIO 4: plano vencido ha 8 dias e o lugar continuou no ar.';
    end if;
    update public.locais set plano_ate = v_hoje - 7 where id = v_local;
    set local role anon;
    select count(*) into v_ve from public.locais where id = v_local;
    reset role;
    if v_ve <> 1 then
      raise exception 'ENSAIO 4: plano vencido ha 7 dias e o lugar ja tinha saido.';
    end if;

    -- 5. Plano encerrado a mao hoje (fica "gratuito" com a data de hoje):
    --    sete dias a partir de hoje.
    update public.locais set plano = 'gratuito', plano_ate = v_hoje where id = v_local;
    select no_ar_ate into v_ate from public.locais where id = v_local;
    if v_ate is distinct from v_hoje + 7 then
      raise exception 'ENSAIO 5: plano encerrado hoje e a data-limite ficou %.', v_ate;
    end if;

    -- 6. Plano pago sem vencimento e ponto da cidade: sem limite.
    update public.locais set plano = 'campanha', plano_ate = null where id = v_local;
    select no_ar_ate into v_ate from public.locais where id = v_local;
    if v_ate is not null then
      raise exception 'ENSAIO 6: plano sem vencimento ganhou data-limite (%).', v_ate;
    end if;
    update public.locais set plano = 'gratuito', dono_id = null where id = v_local;
    select no_ar_ate into v_ate from public.locais where id = v_local;
    if v_ate is not null then
      raise exception 'ENSAIO 6: lugar sem dono ganhou data-limite (%).', v_ate;
    end if;

    raise exception 'ensaio concluido' using errcode = 'ZZ030';
  exception when sqlstate 'ZZ030' then
    raise notice 'Ensaio dos sete dias: passou.';
  end;

  -- O papel volta ao de sempre mesmo que o ensaio tenha parado no meio.
  reset role;
end $$;
