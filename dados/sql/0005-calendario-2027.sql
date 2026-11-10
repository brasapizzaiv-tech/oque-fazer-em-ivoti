-- ============================================================
-- O calendario de eventos de Ivoti em 2027
-- ============================================================
-- Do documento oficial "EVENTOS IVOTI 2027" da prefeitura, recebido em
-- 10/11/2026. O proprio documento avisa, no rodape: "eventos sujeitos a
-- mudanca de datas". Esse aviso vai na descricao de cada um — quem le a
-- agenda em marco precisa saber que a data de dezembro ainda pode andar.
--
-- UMA LINHA POR DIA DE EVENTO, e nao uma por evento. A agenda agrupa
-- pelo dia em que a coisa comeca, entao um evento de seis dias gravado
-- numa linha so apareceria no primeiro dia e sumiria da agenda no
-- segundo — bem enquanto ainda esta acontecendo.
--
-- Nenhum deles tem hora: o calendario traz dia e lugar, mais nada.
-- Entram com "sem_hora", e a tela simplesmente nao fala de horario, em
-- vez de inventar um "9h" que mandaria gente cedo demais.
--
-- Pode rodar mais de uma vez: limpa 2027 antes de inserir.
-- ============================================================

begin;

delete from public.eventos
 where inicio >= timestamptz '2027-01-01 00:00-03'
   and inicio <  timestamptz '2028-01-01 00:00-03'
   and titulo in (
     '32º Kerb in Ivoti',
     'Re-kerb em Nova Tramandaí',
     '5ª Páscoa em Ivoti',
     '44ª Feira do Livro',
     '20ª Feira do Mel, Rosca e Nata',
     '38ª Kolonistenfest',
     '4º Festival da Cachaça',
     '3º Ivotchê',
     '20ª Feira das Flores',
     'Natal no Coração'
   );

-- A descricao vai SO no primeiro dia de cada bloco seguido. O Kerb tem
-- seis dias em sequencia; repetir o mesmo paragrafo seis vezes faria a
-- agenda parecer travada. Quem abre no dia 24 ve o titulo e o lugar, que
-- e o que importa naquele dia.
--
-- O truque do bloco: numa sequencia de dias seguidos, "data menos a
-- posicao na lista" da sempre o mesmo valor. Quando ha um intervalo, o
-- valor muda — e e assim que os tres fins de semana da Feira do Mel
-- viram tres blocos, cada um com a sua descricao.
with programado as (
  select e.titulo, e.descricao, e.lugar, e.onde, d.dia,
         d.dia - (row_number() over (partition by e.titulo order by d.dia))::int as bloco
  from (values

  ('32º Kerb in Ivoti',
   'A festa mais antiga da cidade, em seis dias seguidos na Praça Concórdia.',
   'praca-concordia', 'Praça Concórdia',
   array['2027-01-21','2027-01-22','2027-01-23','2027-01-24','2027-01-25','2027-01-26']::date[]),

  ('Re-kerb em Nova Tramandaí',
   'O encerramento do Kerb, na comunidade de Nova Tramandaí.',
   null, 'Nova Tramandaí',
   array['2027-01-30']::date[]),

  ('5ª Páscoa em Ivoti',
   'Dois fins de semana de Páscoa espalhados por três lugares: o Núcleo de Casas Enxaimel, a Praça Ecológica e o Memorial da Colônia Japonesa.',
   'nucleo-de-casas-enxaimel', 'Núcleo de Casas Enxaimel, Praça Ecológica e Memorial da Colônia Japonesa',
   array['2027-03-19','2027-03-20','2027-03-21','2027-03-26','2027-03-27','2027-03-28']::date[]),

  ('44ª Feira do Livro',
   'Uma semana de feira do livro no Núcleo de Casas Enxaimel.',
   'nucleo-de-casas-enxaimel', 'Núcleo de Casas Enxaimel',
   array['2027-04-26','2027-04-27','2027-04-28','2027-04-29','2027-04-30','2027-05-01','2027-05-02']::date[]),

  ('20ª Feira do Mel, Rosca e Nata',
   'Três fins de semana de mel, rosca e nata no Núcleo de Casas Enxaimel.',
   'nucleo-de-casas-enxaimel', 'Núcleo de Casas Enxaimel',
   array['2027-05-21','2027-05-22','2027-05-23','2027-05-28','2027-05-29','2027-05-30','2027-06-04','2027-06-05','2027-06-06']::date[]),

  ('38ª Kolonistenfest',
   'A festa do colono, com desfile pelo Centro da cidade. A comunidade homenageada ainda vai ser definida.',
   null, 'Centro de Ivoti',
   array['2027-07-17','2027-07-18']::date[]),

  ('4º Festival da Cachaça',
   'Dois fins de semana de cachaça no Núcleo de Casas Enxaimel.',
   'nucleo-de-casas-enxaimel', 'Núcleo de Casas Enxaimel',
   array['2027-08-07','2027-08-08','2027-08-14','2027-08-15']::date[]),

  ('3º Ivotchê',
   'A festa gaúcha de Ivoti, no Núcleo de Casas Enxaimel.',
   'nucleo-de-casas-enxaimel', 'Núcleo de Casas Enxaimel',
   array['2027-09-04','2027-09-05']::date[]),

  ('20ª Feira das Flores',
   'A feira que dá o apelido à cidade, junto com o aniversário do município. Dois fins de semana no Núcleo de Casas Enxaimel.',
   'nucleo-de-casas-enxaimel', 'Núcleo de Casas Enxaimel',
   array['2027-10-15','2027-10-16','2027-10-17','2027-10-22','2027-10-23','2027-10-24']::date[]),

  ('Natal no Coração',
   'O Natal de Ivoti, em dez dias espalhados por três fins de semana de dezembro, no Núcleo de Casas Enxaimel e na Praça Concórdia.',
   'nucleo-de-casas-enxaimel', 'Núcleo de Casas Enxaimel e Praça Concórdia',
   array['2027-12-03','2027-12-04','2027-12-05','2027-12-10','2027-12-11','2027-12-12','2027-12-17','2027-12-18','2027-12-19','2027-12-20']::date[])

  ) as e(titulo, descricao, lugar, onde, dias),
  lateral unnest(e.dias) as d(dia)
)
insert into public.eventos
  (local_id, titulo, descricao, inicio, fim, local_texto, status, sem_hora)
select
  (select id from public.locais where slug = p.lugar),
  p.titulo,
  case
    when row_number() over (partition by p.titulo, p.bloco order by p.dia) = 1
    then p.descricao || ' Data sujeita a mudança, conforme o calendário da prefeitura.'
  end,
  (p.dia + time '00:00') at time zone 'America/Sao_Paulo',
  null,
  p.onde,
  'publicado',
  true
from programado p;

commit;

-- ------------------------------------------------------------
-- Conferencia
-- ------------------------------------------------------------
select titulo,
       count(*) as dias,
       min(inicio)::date as primeiro,
       max(inicio)::date as ultimo,
       bool_and(sem_hora) as todos_sem_hora
  from public.eventos
 where inicio >= timestamptz '2027-01-01 00:00-03'
 group by titulo
 order by min(inicio);
