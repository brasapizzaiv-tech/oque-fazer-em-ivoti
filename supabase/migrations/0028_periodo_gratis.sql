-- ============================================================
-- Os 60 dias gratis de quem entra no guia
-- ============================================================
-- O comercio que se cadastra ganha 60 dias sem pagar, para ver o guia
-- funcionando; depois vem a mensalidade. Para isso valer, o banco precisa
-- saber ATE QUANDO vai o periodo de cada um.
--
-- A data fica guardada, em vez de ser calculada a partir da publicacao:
--   - a publicacao muda (um lugar devolvido e aprovado de novo ganharia
--     outros 60 dias, para sempre);
--   - a administracao pode esticar o prazo de alguem, como cortesia,
--     mudando so esta data.
--
-- Conta a partir do dia em que o lugar entra no ar ja com dono. Lugar sem
-- dono e ponto da cidade (praca, ponte, memorial): fica no guia de graca
-- e nao tem prazo. Se um ponto ja publicado for entregue a um
-- comerciante, o prazo comeca no dia da entrega.
--
-- Esta migracao so marca a data e deixa as telas mostrarem. Ela NAO tira
-- ninguem do ar quando o prazo acaba: isso e decisao para depois.
-- ============================================================

alter table public.locais
  add column if not exists gratis_ate date;

comment on column public.locais.gratis_ate is
  'Ultimo dia do periodo gratis do comercio. Preenchido sozinho quando o lugar entra no ar com dono; a administracao pode alterar.';

create or replace function public.marcar_periodo_gratis()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- A data nao e do dono para mexer: senao bastava escrever um ano que
  -- vem e o periodo gratis nunca acabava.
  if public.pedido_sem_poder() then
    if tg_op = 'UPDATE' then
      new.gratis_ate := old.gratis_ate;
    else
      new.gratis_ate := null;
    end if;
  end if;

  -- Marca uma vez so: na primeira vez em que o lugar esta no ar e tem dono.
  if new.gratis_ate is null
     and new.status = 'publicado'
     and new.dono_id is not null then
    new.gratis_ate := (now() at time zone 'America/Sao_Paulo')::date + 60;
  end if;

  return new;
end;
$$;

-- O nome comeca por "zz" de proposito: os gatilhos de uma tabela rodam em
-- ordem alfabetica, e este precisa enxergar o status ja decidido pelas
-- travas (locais_travar_novo, locais_travar_status).
drop trigger if exists locais_zz_periodo_gratis on public.locais;

create trigger locais_zz_periodo_gratis
  before insert or update on public.locais
  for each row execute function public.marcar_periodo_gratis();

-- Quem ja esta no ar com dono: conta a partir do dia em que foi publicado.
update public.locais
   set gratis_ate = coalesce(publicado_em, criado_em)::date + 60
 where gratis_ate is null
   and status = 'publicado'
   and dono_id is not null;


-- ------------------------------------------------------------
-- Ensaio
-- ------------------------------------------------------------
-- Publica (de mentira) um cadastro que esta esperando analise e confere
-- a data; depois o dono tenta esticar o proprio prazo. Tudo desfeito.
do $$
declare
  v_admin uuid;
  v_dono  uuid;
  v_local uuid;
  v_ate   date;
  v_hoje  date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  select id into v_admin from public.perfis where papel = 'admin' limit 1;

  select l.id, l.dono_id into v_local, v_dono
    from public.locais l
    join public.perfis p on p.id = l.dono_id
   where p.papel = 'dono' and l.status <> 'publicado' and l.gratis_ate is null
   limit 1;

  if v_admin is null or v_local is null then
    raise notice 'Ensaio pulado: nao ha cadastro de comerciante esperando publicacao.';
    return;
  end if;

  begin
    perform set_config('request.jwt.claim.role', 'authenticated', true);

    -- A administracao publica: o prazo nasce, 60 dias a frente.
    perform set_config('request.jwt.claim.sub', v_admin::text, true);
    update public.locais set status = 'publicado' where id = v_local;
    select gratis_ate into v_ate from public.locais where id = v_local;
    if v_ate is distinct from v_hoje + 60 then
      raise exception 'ENSAIO: publicado e o prazo ficou %, esperava %.', v_ate, v_hoje + 60;
    end if;

    -- O dono tenta esticar o prazo.
    perform set_config('request.jwt.claim.sub', v_dono::text, true);
    update public.locais set gratis_ate = v_hoje + 3650 where id = v_local;
    select gratis_ate into v_ate from public.locais where id = v_local;
    if v_ate is distinct from v_hoje + 60 then
      raise exception 'ENSAIO: o dono esticou o proprio prazo para %.', v_ate;
    end if;

    -- A administracao estica, como cortesia: vale.
    perform set_config('request.jwt.claim.sub', v_admin::text, true);
    update public.locais set gratis_ate = v_hoje + 90 where id = v_local;
    select gratis_ate into v_ate from public.locais where id = v_local;
    if v_ate is distinct from v_hoje + 90 then
      raise exception 'ENSAIO: a administracao nao conseguiu esticar o prazo.';
    end if;

    -- Sair do ar e voltar nao reinicia a contagem.
    update public.locais set status = 'inativo' where id = v_local;
    update public.locais set status = 'publicado' where id = v_local;
    select gratis_ate into v_ate from public.locais where id = v_local;
    if v_ate is distinct from v_hoje + 90 then
      raise exception 'ENSAIO: voltar ao ar mexeu no prazo (%).', v_ate;
    end if;

    raise exception 'ensaio concluido' using errcode = 'ZZ028';
  exception when sqlstate 'ZZ028' then
    raise notice 'Ensaio do periodo gratis: passou.';
  end;
end $$;
