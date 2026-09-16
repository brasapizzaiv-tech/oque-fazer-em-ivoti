-- ============================================================
-- Local fora do ar nao deixa evento para tras
-- ============================================================
-- Tirar um local do ar escondia a pagina dele e as promocoes (a funcao das
-- promocoes ja checava o status), mas os eventos continuavam na agenda —
-- com o nome do lugar e um link para uma pagina que agora responde "nao
-- encontrado". Desativar tem que significar sumir inteiro.
--
-- Evento sem local cadastrado continua aparecendo: a feira da praca e o
-- desfile de rua nao pertencem a estabelecimento nenhum, e nao e por isso
-- que deixam de acontecer.
-- ============================================================

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
    -- Seis horas de folga: um evento que começou às 14h ainda interessa a
    -- quem pergunta às 16h.
    and e.inicio >= now() - interval '6 hours'
    -- Ou o evento não tem local cadastrado, ou o local dele está no ar.
    and (
      e.local_id is null
      or exists (
        select 1 from public.locais l
         where l.id = e.local_id
           and l.status = 'publicado'
      )
    )
  order by e.inicio;
$$;
