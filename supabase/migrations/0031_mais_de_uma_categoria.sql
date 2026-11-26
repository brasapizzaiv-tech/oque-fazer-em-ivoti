-- ============================================================
-- Mais de uma categoria por lugar
-- ============================================================
-- Em 26/11/2026 um comerciante parou no cadastro: o lugar dele e cafe
-- colonial, padaria e confeitaria, e o formulario so deixava escolher uma
-- coisa. Quem procurasse "padaria" nao o acharia.
--
-- Como fica: a categoria principal continua onde sempre esteve
-- (`categoria_id`). E ela que aparece junto do nome, que da o emoji do
-- pino no mapa e que diz ao buscador que tipo de lugar e. Ao lado dela
-- entra uma lista com ATE DUAS outras categorias (`categorias_extras`),
-- e o lugar passa a aparecer nos filtros e na busca de todas elas.
--
-- Por que uma lista na propria linha, e nao uma tabela de ligacao como a
-- das etiquetas: uma segunda ligacao entre `locais` e `categorias` faria
-- todas as consultas do site que pedem "a categoria do lugar" ficarem
-- ambiguas, e o site sairia do ar entre a migracao e a publicacao do
-- codigo novo. A lista nao muda nada para quem ja le a tabela.
--
-- Por que duas: sem teto, bastava marcar tudo para aparecer em todo
-- filtro, e os filtros deixariam de dizer alguma coisa.
-- ============================================================

alter table public.locais
  add column if not exists categorias_extras integer[] not null default '{}';

comment on column public.locais.categorias_extras is
  'Ate duas categorias alem da principal (categoria_id). O lugar aparece nos filtros e na busca de todas.';

alter table public.locais
  drop constraint if exists locais_ate_duas_categorias_extras;

alter table public.locais
  add constraint locais_ate_duas_categorias_extras
  check (cardinality(categorias_extras) <= 2);

-- A lista chega do formulario e o banco arruma antes de guardar: tira
-- repetida, tira a que ja e a principal e tira numero que nao e de
-- categoria nenhuma. Assim nenhuma tela precisa desconfiar do que le.
create or replace function public.arrumar_categorias_extras()
returns trigger
language plpgsql
set search_path = public
as $$
begin
  if new.categorias_extras is null then
    new.categorias_extras := '{}';
  end if;

  if cardinality(new.categorias_extras) > 0 then
    new.categorias_extras := coalesce((
      select array_agg(x.id order by x.pos)
        from (
          select e.id, min(e.pos) as pos
            from unnest(new.categorias_extras) with ordinality as e(id, pos)
           where e.id is distinct from new.categoria_id
             and exists (select 1 from public.categorias c where c.id = e.id)
           group by e.id
        ) x
    ), '{}');
  end if;

  -- Lugar sem principal nao fica so com "outras": a primeira assume.
  if new.categoria_id is null and cardinality(new.categorias_extras) > 0 then
    new.categoria_id := new.categorias_extras[1];
    new.categorias_extras := new.categorias_extras[2:];
  end if;

  return new;
end;
$$;

drop trigger if exists locais_arrumar_categorias on public.locais;

create trigger locais_arrumar_categorias
  before insert or update on public.locais
  for each row execute function public.arrumar_categorias_extras();


-- ------------------------------------------------------------
-- Ensaio
-- ------------------------------------------------------------
-- Grava uma lista suja num lugar qualquer e confere o que ficou; depois
-- tenta passar do teto. Tudo desfeito.
do $$
declare
  v_local     uuid;
  v_principal integer;
  v_outras    integer[];
  v_ficou     integer[];
  v_recusou   boolean := false;
begin
  select id, categoria_id into v_local, v_principal
    from public.locais
   where categoria_id is not null
   limit 1;

  select array_agg(id order by id) into v_outras
    from (
      select id from public.categorias
       where id <> v_principal
       order by id
       limit 3
    ) c;

  if v_local is null or coalesce(cardinality(v_outras), 0) < 3 then
    raise notice 'Ensaio pulado: nao ha lugar ou categoria bastante para testar.';
    return;
  end if;

  begin
    -- Repetida, igual a principal e inexistente: sobram so as duas boas.
    update public.locais
       set categorias_extras = array[
             v_principal, v_outras[1], v_outras[1], -1, v_outras[2]
           ]
     where id = v_local;

    select categorias_extras into v_ficou from public.locais where id = v_local;
    if v_ficou is distinct from array[v_outras[1], v_outras[2]] then
      raise exception 'ENSAIO: a lista ficou %, esperava %.',
        v_ficou, array[v_outras[1], v_outras[2]];
    end if;

    -- Tres outras: passa do teto, o banco recusa.
    begin
      update public.locais set categorias_extras = v_outras where id = v_local;
    exception when check_violation then
      v_recusou := true;
    end;
    if not v_recusou then
      raise exception 'ENSAIO: o banco aceitou tres categorias extras.';
    end if;

    -- Sem principal, a primeira das outras assume.
    update public.locais
       set categoria_id = null,
           categorias_extras = array[v_outras[1], v_outras[2]]
     where id = v_local;

    select categoria_id, categorias_extras into v_principal, v_ficou
      from public.locais where id = v_local;
    if v_principal is distinct from v_outras[1]
       or v_ficou is distinct from array[v_outras[2]] then
      raise exception 'ENSAIO: sem principal ficou % e %.', v_principal, v_ficou;
    end if;

    raise exception 'ensaio concluido' using errcode = 'ZZ031';
  exception when sqlstate 'ZZ031' then
    raise notice 'Ensaio das categorias extras: passou.';
  end;
end $$;
