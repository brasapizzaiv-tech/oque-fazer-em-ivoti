-- ============================================================
-- Segunda leva de travas da auditoria de 13/11/2026
-- ============================================================
--   1. Lugar que a administracao tirou do ar nao volta pela mao do dono.
--   2. O deposito de fotos so aceita imagem, e de tamanho razoavel.
--   3. Endereco de imagem no cadastro tem de ser do proprio deposito.
--   4. As travas de plano e de status deixam o SQL Editor trabalhar.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Quem tirou do ar
-- ------------------------------------------------------------
-- O dono pode tirar o proprio lugar do ar e devolver quando quiser (fechou
-- para reforma, voltou). Mas a mesma regra deixava ele devolver um lugar
-- que a ADMINISTRACAO tinha tirado — por falta de pagamento, por
-- reclamacao — com um toque, e sem registro de quem tinha desativado.
alter table public.locais
  add column if not exists tirado_pela_administracao boolean not null default false;

comment on column public.locais.tirado_pela_administracao is
  'Verdadeiro quando foi a administracao que pos o lugar como inativo. Enquanto valer, o dono nao consegue devolver ao ar.';

create or replace function public.travar_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_sem_poder boolean := public.pedido_sem_poder();
begin
  if v_sem_poder then
    -- A marca nao e do dono para mexer.
    new.tirado_pela_administracao := old.tirado_pela_administracao;

    if new.status is distinct from old.status and not (
         (old.status in ('rascunho', 'rejeitado') and new.status = 'em_analise')
      or (old.status = 'publicado' and new.status = 'inativo')
      or (old.status = 'inativo'   and new.status = 'publicado'
          and not old.tirado_pela_administracao)
    ) then
      new.status := old.status;
    end if;

  elsif new.status is distinct from old.status then
    -- Mudanca feita pela administracao (ou pelo servidor): a marca
    -- acompanha. Fica de pe quando e ela quem desativa, cai em qualquer
    -- outra mudanca.
    new.tirado_pela_administracao :=
      (new.status = 'inativo' and public.eh_admin());
  end if;

  -- A data de saida se cuida sozinha, entao nenhuma tela precisa lembrar
  -- de gravar ou de limpar.
  if new.status = 'inativo' and old.status is distinct from 'inativo' then
    new.desativado_em := now();
  elsif new.status is distinct from 'inativo' then
    new.desativado_em := null;
  end if;

  return new;
end;
$$;


-- ------------------------------------------------------------
-- 4. (junto, porque e a mesma ideia) As travas e o SQL Editor
-- ------------------------------------------------------------
-- As duas travas antigas perguntavam "e admin logado?". No SQL Editor nao
-- ha ninguem logado, entao um ajuste de plano ou de status escrito ali
-- era desfeito em silencio — o comando dizia UPDATE 1 e nada mudava. A
-- pergunta certa e a das travas novas: "o pedido veio do navegador de
-- alguem sem poder?". (travar_status, acima, ja usa a nova.)
create or replace function public.travar_plano()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if (new.plano is distinct from old.plano
      or new.plano_ate is distinct from old.plano_ate
      or new.plano_desde is distinct from old.plano_desde
      or new.destaque is distinct from old.destaque)
     and public.pedido_sem_poder() then
    new.plano := old.plano;
    new.plano_ate := old.plano_ate;
    new.plano_desde := old.plano_desde;
    new.destaque := old.destaque;
  end if;
  return new;
end;
$$;


-- ------------------------------------------------------------
-- 2. O deposito de fotos
-- ------------------------------------------------------------
-- Qualquer conta logada subia qualquer arquivo, de qualquer tamanho. As
-- telas agora reduzem e convertem a foto antes de enviar (sai JPG ou PNG
-- de menos de 1 MB), entao 10 MB e folga de sobra para o envio direto.
update storage.buckets
   set file_size_limit = 10 * 1024 * 1024,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'locais';


-- ------------------------------------------------------------
-- 3. Endereco de imagem
-- ------------------------------------------------------------
-- Os quatro campos sao texto livre gravado pelo navegador. O site so sabe
-- mostrar imagem do proprio deposito: um endereco de outro lugar, ou com
-- "?" no meio, derruba a pagina inteira em que o cartao aparece (capa,
-- Explorar, agenda). Conferido antes: nenhuma linha existente foge disto.
do $$
declare
  c_padrao constant text :=
    '^https://[a-z0-9]+[.]supabase[.]co/storage/v1/object/public/[^?#[:space:]]+$';
  r record;
begin
  for r in
    select * from (values
      ('locais',       'capa_url',   'locais_capa_do_deposito'),
      ('locais_fotos', 'url',        'locais_fotos_do_deposito'),
      ('eventos',      'imagem_url', 'eventos_imagem_do_deposito'),
      ('promocoes',    'imagem_url', 'promocoes_imagem_do_deposito')
    ) as t(tabela, coluna, nome)
  loop
    execute format('alter table public.%I drop constraint if exists %I', r.tabela, r.nome);
    execute format(
      'alter table public.%I add constraint %I check (%I is null or %I ~ %L)',
      r.tabela, r.nome, r.coluna, r.coluna, c_padrao
    );
  end loop;
end $$;


-- ------------------------------------------------------------
-- Ensaio
-- ------------------------------------------------------------
-- Finge ser a administracao tirando um lugar do ar, depois o dono
-- tentando devolver. E o caminho normal: o dono tira e devolve o proprio
-- lugar. Tudo o que o ensaio grava e desfeito no fim.
do $$
declare
  v_admin uuid;
  v_dono  uuid;
  v_local uuid;
  r       record;
begin
  select id into v_admin from public.perfis where papel = 'admin' limit 1;

  select l.id, l.dono_id into v_local, v_dono
    from public.locais l
    join public.perfis p on p.id = l.dono_id
   where p.papel = 'dono' and l.status = 'publicado'
   limit 1;

  if v_admin is null or v_local is null then
    raise notice 'Ensaio pulado: falta admin ou lugar publicado de comerciante.';
    return;
  end if;

  begin
    -- A administracao tira do ar.
    perform set_config('request.jwt.claim.role', 'authenticated', true);
    perform set_config('request.jwt.claim.sub', v_admin::text, true);
    update public.locais set status = 'inativo' where id = v_local;
    select status, tirado_pela_administracao into r from public.locais where id = v_local;
    if r.status <> 'inativo' or not r.tirado_pela_administracao then
      raise exception 'ENSAIO: a administracao tirou do ar e ficou %, marca %.',
        r.status, r.tirado_pela_administracao;
    end if;

    -- O dono tenta devolver, e tenta apagar a marca.
    perform set_config('request.jwt.claim.sub', v_dono::text, true);
    update public.locais
       set status = 'publicado', tirado_pela_administracao = false
     where id = v_local;
    select status, tirado_pela_administracao into r from public.locais where id = v_local;
    if r.status <> 'inativo' or not r.tirado_pela_administracao then
      raise exception 'ENSAIO: o dono devolveu ao ar um lugar tirado pela administracao.';
    end if;

    -- A administracao devolve: a marca cai.
    perform set_config('request.jwt.claim.sub', v_admin::text, true);
    update public.locais set status = 'publicado' where id = v_local;
    select status, tirado_pela_administracao into r from public.locais where id = v_local;
    if r.status <> 'publicado' or r.tirado_pela_administracao then
      raise exception 'ENSAIO: a administracao devolveu e ficou %, marca %.',
        r.status, r.tirado_pela_administracao;
    end if;

    -- O caminho normal do dono: tira e devolve o proprio lugar.
    perform set_config('request.jwt.claim.sub', v_dono::text, true);
    update public.locais set status = 'inativo' where id = v_local;
    update public.locais set status = 'publicado' where id = v_local;
    select status into r from public.locais where id = v_local;
    if r.status <> 'publicado' then
      raise exception 'ENSAIO: o dono nao conseguiu devolver o proprio lugar (ficou %).', r.status;
    end if;

    -- E o dono continua sem conseguir se dar um plano.
    update public.locais set plano = 'campanha', destaque = true where id = v_local;
    select plano, destaque into r from public.locais where id = v_local;
    if r.plano = 'campanha' and r.destaque then
      raise exception 'ENSAIO: o dono conseguiu se dar o plano Campanha.';
    end if;

    -- Endereco de imagem de fora e recusado.
    begin
      update public.locais set capa_url = 'https://exemplo.com/foto.jpg?x=1' where id = v_local;
      raise exception 'ENSAIO: endereco de imagem de fora foi aceito.';
    exception when check_violation then
      null; -- recusado, como deve ser
    end;

    raise exception 'ensaio concluido' using errcode = 'ZZ027';
  exception when sqlstate 'ZZ027' then
    raise notice 'Ensaio da segunda leva: passou.';
  end;
end $$;
