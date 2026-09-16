-- ============================================================
-- Publicação agendada de evento
-- ============================================================
-- O comerciante monta a divulgação com antecedência e escolhe quando ela
-- aparece. Até lá o evento existe só para ele, no painel.
--
-- Nulo = aparece assim que for aprovado, que é como funciona hoje. Nenhum
-- evento já cadastrado muda de comportamento.
-- ============================================================

alter table public.eventos add column publicar_em timestamptz;

comment on column public.eventos.publicar_em is
  'A partir de quando o evento aparece no site. Nulo = assim que aprovado.';

-- O site pergunta "o que está visível agora" a toda hora; o painel filtra por
-- dono. Este índice serve aos dois.
create index eventos_visiveis on public.eventos (status, publicar_em, inicio);

-- ------------------------------------------------------------
-- Os eventos que o visitante pode ver
-- ------------------------------------------------------------
-- Uma regra só para a agenda, a página do local, o Explorar e o Gui. Sem
-- isso, "publicado" significaria uma coisa em cada tela.
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
  order by e.inicio;
$$;
