-- ============================================================
-- As duas feiras que se repetem: Colonial e da Colônia Japonesa
-- ============================================================
-- Do calendário de eventos da Rota Romântica, lido em 17/11/2026.
--
-- FEIRA COLONIAL
--   Todos os sábados, domingos e feriados, no Núcleo de Casas Enxaimel,
--   das 9h às 17h, entrada gratuita. (O texto da fonte diz "das 9h às
--   17h"; o campo de horário da mesma página diz "9h às 18h". Fica o
--   mais curto, que é também o horário da Casa do Artesão.)
--   Entra todo sábado e domingo de 21/11/2026 a 28/02/2027, mais a
--   sexta 20/11, feriado, que a fonte lista. O Natal (25/12) e o Ano
--   Novo (01/01) caem em sexta e NÃO entram: a regra diz "feriados", mas
--   ninguém confirmou feira nesses dois dias.
--
-- FEIRA DA COLÔNIA JAPONESA
--   No segundo e no último domingo de cada mês, das 9h às 17h, na Rua
--   Sakura (Estrada da Colônia Japonesa, 1353). Fica ligada ao Memorial
--   da Colônia Japonesa, que é a página da colônia no guia e dá o mapa.
--   Entram: 29/11, 13/12 e 27/12 de 2026; 10/01, 31/01, 14/02 e 28/02
--   de 2027.
--
-- Vai até o fim de fevereiro de propósito: feira semanal marcada para o
-- ano inteiro encheria a agenda e o que o Guia lê. Quando fevereiro
-- chegar, é só rodar outro arquivo com os meses seguintes.
--
-- O texto explicativo vai só no primeiro dia de cada fim de semana, como
-- nos outros eventos de vários dias.
--
-- Pode rodar mais de uma vez sem duplicar.
-- ============================================================

begin;

delete from public.eventos
 where titulo in ('Feira Colonial', 'Feira da Colônia Japonesa')
   and inicio >= timestamptz '2026-11-20 00:00-03'
   and inicio <  timestamptz '2027-03-01 00:00-03';

-- Feira Colonial: a sexta 20/11 e todo sábado e domingo até 28/02/2027.
with dias as (
  select d::date as dia
    from generate_series(date '2026-11-20', date '2027-02-28', interval '1 day') as d
   where extract(dow from d) in (0, 6)
      or d::date = date '2026-11-20'
)
insert into public.eventos
  (local_id, titulo, descricao, inicio, fim, local_texto, status)
select
  (select id from public.locais where slug = 'nucleo-de-casas-enxaimel'),
  'Feira Colonial',
  case
    when dia = date '2026-11-20'
      or (extract(dow from dia) = 6 and dia <> date '2026-11-21')
    then 'Todos os sábados, domingos e feriados, das 9h às 17h, no Núcleo de Casas Enxaimel. Cerca de 29 expositores vendem produtos coloniais e orgânicos, mel, artesanato, flores, folhagens e cervejas artesanais. A entrada é gratuita.'
  end,
  (dia + time '09:00') at time zone 'America/Sao_Paulo',
  (dia + time '17:00') at time zone 'America/Sao_Paulo',
  'Núcleo de Casas Enxaimel',
  'publicado'
from dias;

-- Feira da Colônia Japonesa: segundo e último domingo de cada mês.
insert into public.eventos
  (local_id, titulo, descricao, inicio, fim, local_texto, status)
select
  (select id from public.locais where slug = 'memorial-da-colonia-japonesa'),
  'Feira da Colônia Japonesa',
  'No segundo e no último domingo de cada mês, das 9h às 17h, na Colônia Japonesa de Ivoti. Culinária e produtos típicos japoneses, plantas e apresentações culturais.',
  (dia + time '09:00') at time zone 'America/Sao_Paulo',
  (dia + time '17:00') at time zone 'America/Sao_Paulo',
  'Colônia Japonesa',
  'publicado'
from unnest(array[
  '2026-11-29', '2026-12-13', '2026-12-27',
  '2027-01-10', '2027-01-31', '2027-02-14', '2027-02-28'
]::date[]) as d(dia);

-- Confere antes de valer. Qualquer conta diferente desfaz tudo.
do $$
declare
  colonial   integer;
  japonesa   integer;
  fora_do_dia integer;
begin
  select count(*) into colonial
    from public.eventos
   where titulo = 'Feira Colonial'
     and inicio >= timestamptz '2026-11-20 00:00-03'
     and inicio <  timestamptz '2027-03-01 00:00-03'
     and local_id is not null
     and status = 'publicado';

  select count(*) into japonesa
    from public.eventos
   where titulo = 'Feira da Colônia Japonesa'
     and inicio >= timestamptz '2026-11-20 00:00-03'
     and inicio <  timestamptz '2027-03-01 00:00-03'
     and local_id is not null
     and status = 'publicado';

  -- A feira japonesa só pode cair em domingo.
  select count(*) into fora_do_dia
    from public.eventos
   where titulo = 'Feira da Colônia Japonesa'
     and inicio >= timestamptz '2026-11-20 00:00-03'
     and inicio <  timestamptz '2027-03-01 00:00-03'
     and extract(dow from inicio at time zone 'America/Sao_Paulo') <> 0;

  if colonial <> 31 then
    raise exception 'Esperava 31 dias de Feira Colonial ligados ao Núcleo; achei %. Nada foi alterado.', colonial;
  end if;
  if japonesa <> 7 then
    raise exception 'Esperava 7 dias de Feira da Colônia Japonesa ligados ao Memorial; achei %. Nada foi alterado.', japonesa;
  end if;
  if fora_do_dia <> 0 then
    raise exception 'A Feira da Colônia Japonesa caiu em % dia(s) que não são domingo. Nada foi alterado.', fora_do_dia;
  end if;
end $$;

commit;
