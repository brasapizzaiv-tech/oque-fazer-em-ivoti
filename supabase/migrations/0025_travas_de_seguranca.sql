-- ============================================================
-- Travas que faltavam no banco
-- ============================================================
-- O painel grava direto do navegador, entao a unica barreira de verdade
-- e o banco. A auditoria de 13/11/2026 achou quatro portas abertas:
--
--   1. perfis: a conta podia atualizar a propria linha inteira, e o papel
--      (dono ou admin) mora nela. Qualquer conta virava administracao.
--   2. locais: as travas de plano e de status so valiam na EDICAO. Um
--      lugar podia nascer ja publicado, com plano pago e em destaque.
--   3. eventos: nada conferia o status nem o lugar. O dono publicava sem
--      passar pela fila e pendurava evento na pagina de outro comercio.
--   4. somar_metrica: aceitava qualquer quantidade, ate negativa.
--
-- As tres primeiras travas seguem o costume das que ja existem
-- (travar_plano, travar_status): nao dao erro, so devolvem o valor certo.
-- A excecao e o evento em lugar alheio, que e recusado: ali nao existe
-- "valor certo" para devolver.
--
-- Quem as travas seguram: pedido que chega pela API como visitante ou
-- conta comum. Administracao logada passa. Servidor do site (service_role)
-- e o SQL Editor passam: sao eles que criam os lugares da cidade e
-- promovem um admin novo.
-- ============================================================


-- Verdadeiro quando o pedido vem do navegador de alguem que nao e admin.
create or replace function public.pedido_sem_poder()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce(auth.role(), '') in ('anon', 'authenticated')
     and not public.eh_admin();
$$;


-- ------------------------------------------------------------
-- 1. O papel da conta nao muda pela mao do dono dela
-- ------------------------------------------------------------
create or replace function public.travar_papel()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.papel is distinct from old.papel and public.pedido_sem_poder() then
    new.papel := old.papel;
  end if;
  return new;
end;
$$;

drop trigger if exists perfis_travar_papel on public.perfis;

create trigger perfis_travar_papel
  before update on public.perfis
  for each row execute function public.travar_papel();


-- ------------------------------------------------------------
-- 2. Lugar novo nasce rascunho, sem plano e sem destaque
-- ------------------------------------------------------------
create or replace function public.travar_local_novo()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.pedido_sem_poder() then
    new.status          := 'rascunho';
    new.plano           := 'gratuito';
    new.plano_ate       := null;
    new.plano_desde     := null;
    new.destaque        := false;
    new.publicado_em    := null;
    new.desativado_em   := null;
    new.motivo_rejeicao := null;
  end if;
  return new;
end;
$$;

drop trigger if exists locais_travar_novo on public.locais;

create trigger locais_travar_novo
  before insert on public.locais
  for each row execute function public.travar_local_novo();


-- ------------------------------------------------------------
-- 3. Evento passa pela fila, e so no lugar de quem o criou
-- ------------------------------------------------------------
-- De quebra resolve um beco sem saida: evento devolvido pela
-- administracao ficava preso em "rejeitado", porque salvar a correcao
-- nao mexia no status e a fila so lista "em_analise". Agora, corrigiu e
-- salvou, volta para a fila.
create or replace function public.travar_evento()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.pedido_sem_poder() then
    return new;
  end if;

  if tg_op = 'INSERT' then
    new.status := 'em_analise';
  else
    new.criado_por := old.criado_por;

    if old.status = 'rejeitado' then
      new.status := 'em_analise';
    elsif new.status is distinct from old.status
          and new.status <> 'em_analise' then
      new.status := old.status;
    end if;
  end if;

  if new.local_id is not null
     and (tg_op = 'INSERT' or new.local_id is distinct from old.local_id)
     and not public.pode_editar_local(new.local_id) then
    raise exception 'Este lugar nao esta na sua conta.'
      using errcode = '42501';
  end if;

  return new;
end;
$$;

drop trigger if exists eventos_travar on public.eventos;

create trigger eventos_travar
  before insert or update on public.eventos
  for each row execute function public.travar_evento();


-- ------------------------------------------------------------
-- 4. O contador so soma de 1 em 1, e so tipo com cara de tipo
-- ------------------------------------------------------------
-- Quem pode CHAMAR esta funcao (so o servidor do site) e decidido em
-- scripts/migrate.mjs, que reaplica as permissoes no fim de toda rodada.
create or replace function public.somar_metrica(
  p_tipo text,
  p_local uuid default null,
  p_alvo uuid default null,
  p_chave text default null,
  p_quanto integer default 1
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dia date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  if p_quanto is distinct from 1
     or p_tipo is null
     or p_tipo !~ '^[a-z_]{1,40}$'
     or length(coalesce(p_chave, '')) > 200 then
    return;
  end if;

  -- O "on conflict" precisa apontar para o mesmo formato do indice unico.
  insert into public.metricas_dia (dia, tipo, local_id, alvo, chave, contagem)
  values (v_dia, p_tipo, p_local, p_alvo, p_chave, 1)
  on conflict (
    dia,
    tipo,
    coalesce(local_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(alvo, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(chave, '')
  )
  do update set contagem = public.metricas_dia.contagem + 1;
end;
$$;


-- ------------------------------------------------------------
-- Ensaio: as travas seguram mesmo?
-- ------------------------------------------------------------
-- Finge ser um comerciante logado e tenta as quatro coisas. Tudo o que o
-- ensaio grava e desfeito no fim (o bloco termina num erro de proposito,
-- que o banco desfaz). Se alguma tentativa passar, a migracao inteira
-- falha e nada disto entra no banco.
do $$
declare
  v_dono   uuid;
  v_alheio uuid;
  v_texto  text;
  r        record;
begin
  select id into v_dono
    from public.perfis
   where papel = 'dono'
   order by criado_em
   limit 1;

  if v_dono is null then
    raise notice 'Ensaio pulado: nao ha conta de comerciante.';
    return;
  end if;

  select id into v_alheio
    from public.locais
   where dono_id is distinct from v_dono
   limit 1;

  begin
    perform set_config('request.jwt.claim.sub', v_dono::text, true);
    perform set_config('request.jwt.claim.role', 'authenticated', true);

    if not public.pedido_sem_poder() then
      raise exception 'ENSAIO: o disfarce de comerciante nao pegou.';
    end if;

    -- 1. virar administracao
    update public.perfis set papel = 'admin' where id = v_dono;
    select papel into v_texto from public.perfis where id = v_dono;
    if v_texto <> 'dono' then
      raise exception 'ENSAIO: a conta virou %.', v_texto;
    end if;

    -- 2. lugar que nasce publicado e pago
    insert into public.locais (nome, slug, dono_id, status, plano, plano_ate, destaque)
    values ('Ensaio da trava', 'ensaio-da-trava-0025', v_dono,
            'publicado', 'campanha', current_date + 365, true)
    returning status, plano, plano_ate, destaque into r;
    if r.status <> 'rascunho' or r.plano <> 'gratuito'
       or r.plano_ate is not null or r.destaque then
      raise exception 'ENSAIO: lugar novo saiu %, %, destaque %.',
        r.status, r.plano, r.destaque;
    end if;

    -- 3a. evento que nasce publicado
    insert into public.eventos (titulo, inicio, status, criado_por)
    values ('Ensaio da trava', now() + interval '30 days', 'publicado', v_dono)
    returning status into v_texto;
    if v_texto <> 'em_analise' then
      raise exception 'ENSAIO: evento novo saiu %.', v_texto;
    end if;

    -- 3b. evento na pagina de outro lugar
    if v_alheio is not null then
      begin
        insert into public.eventos (titulo, inicio, local_id, criado_por)
        values ('Ensaio da trava', now() + interval '30 days', v_alheio, v_dono);
        raise exception 'ENSAIO: evento em lugar alheio foi aceito.';
      exception when insufficient_privilege then
        null; -- recusado, como deve ser
      end;
    end if;

    -- 4. contador com quantidade inventada
    perform public.somar_metrica('pagina', null, null, 'ensaio-da-trava', -50);
    perform public.somar_metrica('pagina', null, null, 'ensaio-da-trava', 5000);
    if exists (select 1 from public.metricas_dia where chave = 'ensaio-da-trava') then
      raise exception 'ENSAIO: o contador aceitou quantidade inventada.';
    end if;

    -- Passou em tudo: sai por um erro combinado, para o banco desfazer o
    -- que o ensaio gravou.
    raise exception 'ensaio concluido' using errcode = 'ZZ025';
  exception when sqlstate 'ZZ025' then
    raise notice 'Ensaio das travas: passou nas quatro.';
  end;
end $$;
