-- ============================================================
-- A agenda mostra o evento ate ele acabar, e so de lugar que esta no ar
-- ============================================================
-- Dois consertos na mesma funcao, achados na auditoria de 13/11/2026.
--
-- 1. Evento com hora de fim sumia seis horas depois de comecar. A Feira
--    das Flores abria as 9h e ia ate as 18h; as 15h ja tinha saido da
--    agenda e do que o Guia sabe, com a feira cheia. A folga de seis
--    horas so faz sentido para o evento que NAO diz quando termina. Com
--    fim informado, vale o fim. O mesmo para evento sem horario que dura
--    varios dias: fica ate o ultimo dia.
--
-- 2. A 0012 fez a agenda esconder o evento cujo lugar saiu do ar: sem
--    isso o card aparece e o link dele cai numa pagina que nao existe. A
--    0020, ao ensinar a funcao a lidar com evento sem horario, reescreveu
--    a consulta inteira e esse trecho ficou para tras. Volta aqui.
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
  order by e.inicio;
$$;
