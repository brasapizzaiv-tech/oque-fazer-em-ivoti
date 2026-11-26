-- ============================================================
-- O cardapio em foto
-- ============================================================
-- Pedido do Rafael em 26/11/2026: o comerciante ja tem o cardapio pronto
-- (impresso, em arte, em print) e nao quer digitar item por item. Passa a
-- poder subir a imagem do cardapio, uma por pagina.
--
-- Os itens digitados (locais_itens) continuam existindo e valem junto: e
-- por eles que a busca e o Guia sabem que um lugar tem "pizza de
-- calabresa". A foto mostra o cardapio a quem ja esta na pagina do lugar;
-- nao ensina nada a busca.
--
-- Mora numa tabela propria, e nao em locais_fotos, de proposito: foto do
-- cardapio nao e foto do lugar. Nao entra na galeria, nao vira capa, nao
-- conta como "tem fotos".
--
-- O arquivo vai para o mesmo deposito das fotos ("locais"), na pasta do
-- lugar, entao herda os limites de la (so imagem, ate 10 MB).
-- ============================================================

create table if not exists public.locais_cardapio_fotos (
  id uuid primary key default gen_random_uuid(),
  local_id uuid not null references public.locais(id) on delete cascade,
  url text not null,
  -- O tamanho da imagem, para a pagina reservar o espaco antes de ela
  -- carregar (cardapio em pe e cardapio deitado tem formatos bem diferentes).
  largura integer check (largura is null or largura > 0),
  altura integer check (altura is null or altura > 0),
  ordem integer not null default 0,
  criado_em timestamptz not null default now(),
  -- Mesma trava das outras imagens (0027): so endereco do proprio deposito.
  constraint locais_cardapio_fotos_do_deposito check (
    url ~ '^https://[a-z0-9]+[.]supabase[.]co/storage/v1/object/public/[^?#[:space:]]+$'
  )
);

create index if not exists locais_cardapio_fotos_local_idx
  on public.locais_cardapio_fotos (local_id);

comment on table public.locais_cardapio_fotos is
  'As paginas do cardapio em imagem, na ordem em que aparecem. Vale junto com os itens digitados (locais_itens).';

alter table public.locais_cardapio_fotos enable row level security;

-- As mesmas regras das fotos: le quem pode ver o lugar, mexe quem pode
-- editar o lugar (o dono e a administracao).
drop policy if exists cardapio_fotos_ler on public.locais_cardapio_fotos;
create policy cardapio_fotos_ler on public.locais_cardapio_fotos
  for select using (public.pode_ver_local(local_id));

drop policy if exists cardapio_fotos_mexer on public.locais_cardapio_fotos;
create policy cardapio_fotos_mexer on public.locais_cardapio_fotos
  for all using (public.pode_editar_local(local_id))
  with check (public.pode_editar_local(local_id));


-- ------------------------------------------------------------
-- O teto de paginas
-- ------------------------------------------------------------
-- Doze paginas cobrem com folga um cardapio de restaurante. Sem teto, a
-- pagina do lugar viraria um album e o deposito, um arquivo morto. O 12
-- daqui e o MAXIMO_DE_PAGINAS_DO_CARDAPIO de lib/cardapio.ts.
create or replace function public.limitar_cardapio_fotos()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if (select count(*) from public.locais_cardapio_fotos
       where local_id = new.local_id) >= 12 then
    raise exception 'O cardapio em foto aceita ate 12 paginas.'
      using errcode = 'check_violation';
  end if;
  return new;
end;
$$;

drop trigger if exists locais_cardapio_fotos_teto on public.locais_cardapio_fotos;

create trigger locais_cardapio_fotos_teto
  before insert on public.locais_cardapio_fotos
  for each row execute function public.limitar_cardapio_fotos();


-- ------------------------------------------------------------
-- Ensaio
-- ------------------------------------------------------------
-- Grava paginas (de mentira) num lugar de comerciante: o dono consegue,
-- outra conta nao, o visitante le, endereco de fora e a 13a pagina sao
-- recusados. Tudo desfeito.
do $$
declare
  v_dono  uuid;
  v_local uuid;
  v_n     integer;
  v_ok    boolean;
  c_url constant text :=
    'https://ensaio.supabase.co/storage/v1/object/public/locais/ensaio/pagina.jpg';
begin
  select l.id, l.dono_id into v_local, v_dono
    from public.locais l
    join public.perfis p on p.id = l.dono_id
   where p.papel = 'dono' and l.status = 'publicado'
     and (l.no_ar_ate is null
          or l.no_ar_ate >= (now() at time zone 'America/Sao_Paulo')::date)
   limit 1;

  if v_local is null then
    raise notice 'Ensaio pulado: nao ha lugar publicado de comerciante.';
    return;
  end if;

  begin
    -- O dono grava duas paginas.
    perform set_config('request.jwt.claim.sub', v_dono::text, true);
    perform set_config('request.jwt.claims',
      json_build_object('sub', v_dono, 'role', 'authenticated')::text, true);
    set local role authenticated;
    insert into public.locais_cardapio_fotos (local_id, url, ordem)
    values (v_local, c_url, 0), (v_local, c_url, 1);
    reset role;

    -- Outra conta nao grava no lugar dos outros.
    perform set_config('request.jwt.claim.sub',
      '00000000-0000-0000-0000-000000000000', true);
    perform set_config('request.jwt.claims',
      json_build_object('sub', '00000000-0000-0000-0000-000000000000',
                        'role', 'authenticated')::text, true);
    set local role authenticated;
    v_ok := false;
    begin
      insert into public.locais_cardapio_fotos (local_id, url)
      values (v_local, c_url);
    exception when insufficient_privilege then
      v_ok := true;
    end;
    reset role;
    if not v_ok then
      raise exception 'ENSAIO: outra conta gravou no cardapio de um lugar alheio.';
    end if;

    -- O visitante le as duas.
    set local role anon;
    select count(*) into v_n
      from public.locais_cardapio_fotos where local_id = v_local;
    reset role;
    if v_n <> 2 then
      raise exception 'ENSAIO: o visitante viu % paginas, esperava 2.', v_n;
    end if;

    -- Endereco de fora do deposito: recusado.
    v_ok := false;
    begin
      insert into public.locais_cardapio_fotos (local_id, url)
      values (v_local, 'https://exemplo.com/cardapio.jpg');
    exception when check_violation then
      v_ok := true;
    end;
    if not v_ok then
      raise exception 'ENSAIO: o banco aceitou imagem de fora do deposito.';
    end if;

    -- Ate doze cabe; a decima terceira, nao.
    insert into public.locais_cardapio_fotos (local_id, url, ordem)
    select v_local, c_url, g from generate_series(2, 11) g;
    v_ok := false;
    begin
      insert into public.locais_cardapio_fotos (local_id, url)
      values (v_local, c_url);
    exception when check_violation then
      v_ok := true;
    end;
    if not v_ok then
      raise exception 'ENSAIO: o banco aceitou a decima terceira pagina.';
    end if;

    raise exception 'ensaio concluido' using errcode = 'ZZ033';
  exception when sqlstate 'ZZ033' then
    raise notice 'Ensaio do cardapio em foto: passou.';
  end;

  -- O papel volta ao de sempre mesmo que o ensaio tenha parado no meio.
  reset role;
end $$;
