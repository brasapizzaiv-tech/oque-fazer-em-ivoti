-- ============================================================
-- Evento que so tem data
-- ============================================================
-- O calendario oficial da prefeitura de 2027 traz dez eventos com dia e
-- lugar, e nenhum horario. Ate agora o cadastro exigia uma hora, entao
-- so havia duas saidas: inventar "9h" — que o site anunciaria como se
-- fosse verdade, mandando gente cedo demais — ou deixar o ano inteiro
-- de fora da agenda.
--
-- Esta coluna e a terceira saida: o evento existe com a data e a tela
-- simplesmente nao fala de hora. Calendario de prefeitura quase nunca
-- vem com horario, entao isto vale para todo ano que vier.
--
-- O comerciante que cadastra pelo painel continua informando a hora: ele
-- sabe a que horas abre. A coluna nasce "false" e nada muda para quem ja
-- estava cadastrado.
-- ============================================================

alter table public.eventos
  add column if not exists sem_hora boolean not null default false;

comment on column public.eventos.sem_hora is
  'A data e certa, a hora nao foi divulgada. A tela esconde o horario.';

-- ------------------------------------------------------------
-- O evento de dia inteiro precisa durar o dia inteiro
-- ------------------------------------------------------------
-- A regra de visibilidade dava seis horas de folga depois do inicio, o
-- que serve para um show das 14h. Para um evento sem hora, gravado a
-- meia-noite, essa conta o tiraria da agenda as 6 da manha do proprio
-- dia — some bem no dia em que acontece.
--
-- Entao quem nao tem hora fica ate o fim do seu dia, no fuso de Ivoti.
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
        -- vale o dia todo: compara com a meia-noite de hoje em Ivoti
        then e.inicio >= date_trunc('day', now() at time zone 'America/Sao_Paulo')
                           at time zone 'America/Sao_Paulo'
        -- seis horas de folga: um evento que comecou as 14h ainda
        -- interessa a quem pergunta as 16h
        else e.inicio >= now() - interval '6 hours'
      end
    )
  order by e.inicio;
$$;
