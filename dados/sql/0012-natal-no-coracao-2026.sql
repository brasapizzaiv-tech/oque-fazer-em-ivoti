-- ============================================================
-- Natal no Coração de 2026
-- ============================================================
-- A agenda tinha o Natal no Coração só de dezembro de 2027 (veio do
-- calendário oficial de 2027). O deste ano ficou de fora: entre a Noite
-- Cultural de 28/11 e o Kerb de janeiro a agenda estava vazia, e o Guia
-- respondia "dezembro de 2027" a quem perguntava pelo Natal.
--
-- Datas do calendário de festas da Rota Romântica (rotaromantica.com.br),
-- conferido em 17/11/2026: 4 a 6, 10 a 13 e 17 a 21 de dezembro de 2026,
-- na Praça Concórdia. CONFIRA COM A PREFEITURA ANTES DE RODAR: a fonte não
-- é a prefeitura, e ela não traz horário.
--
-- Uma linha por dia, sem hora, como no calendário de 2027 (0005).
-- Pode rodar mais de uma vez sem duplicar.
-- ============================================================

begin;

delete from public.eventos
 where titulo = 'Natal no Coração'
   and inicio >= timestamptz '2026-12-01 00:00-03'
   and inicio <  timestamptz '2027-01-01 00:00-03';

with dias as (
  select d.dia,
         d.dia - (row_number() over (order by d.dia))::int as bloco
    from unnest(array[
      '2026-12-04','2026-12-05','2026-12-06',
      '2026-12-10','2026-12-11','2026-12-12','2026-12-13',
      '2026-12-17','2026-12-18','2026-12-19','2026-12-20','2026-12-21'
    ]::date[]) as d(dia)
)
insert into public.eventos
  (local_id, titulo, descricao, inicio, fim, local_texto, status, sem_hora)
select
  (select id from public.locais where slug = 'praca-concordia'),
  'Natal no Coração',
  -- A descrição vai só no primeiro dia de cada bloco seguido, para a
  -- agenda não repetir o mesmo parágrafo doze vezes.
  case
    when row_number() over (partition by bloco order by dia) = 1
    then 'O Natal de Ivoti, em três blocos de dezembro na Praça Concórdia: de 4 a 6, de 10 a 13 e de 17 a 21. Programação e horários de cada dia são divulgados pela prefeitura.'
  end,
  (dia + time '00:00') at time zone 'America/Sao_Paulo',
  null,
  'Praça Concórdia',
  'publicado',
  true
from dias;

-- Confere antes de valer. Qualquer conta diferente desfaz tudo.
do $$
declare
  achados integer;
begin
  select count(*) into achados
    from public.eventos
   where titulo = 'Natal no Coração'
     and inicio >= timestamptz '2026-12-01 00:00-03'
     and inicio <  timestamptz '2027-01-01 00:00-03'
     and local_id is not null
     and sem_hora
     and status = 'publicado';

  if achados <> 12 then
    raise exception 'Esperava 12 dias de Natal ligados à Praça Concórdia; achei %. Nada foi alterado.', achados;
  end if;
end $$;

commit;
