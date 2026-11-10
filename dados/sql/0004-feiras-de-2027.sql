-- ============================================================
-- As tres feiras com tema, agora com as datas de 2027
-- ============================================================
-- Do calendario oficial "EVENTOS IVOTI 2027" da prefeitura, recebido em
-- 10/11/2026. O proprio documento avisa: "eventos sujeitos a mudanca de
-- datas". Se alguma mudar, e so rodar de novo com a data nova.
--
-- So entram aqui as tres que vestem o site inteiro. Os outros sete
-- eventos do calendario sao agenda, nao tema.
--
-- A programacao tem uma linha por dia de feira, e nao porque alguem
-- queira ler "Dia de feira" nove vezes: e dali que o site aprende QUAIS
-- dias a feira abre. A Feira do Mel acontece em tres fins de semana com
-- duas semanas de intervalo no meio, e sem essas linhas o site diria
-- "acontecendo agora" numa quarta-feira de portao fechado. Quando a
-- prefeitura soltar a programacao de verdade, ela substitui estas
-- linhas e o resto continua funcionando igual.
--
-- Pode rodar mais de uma vez.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 32º Kerb in Ivoti — 21 a 26 de janeiro, Praça Concórdia
-- ------------------------------------------------------------
-- Seis dias seguidos, sem intervalo.
update public.temas set
  subtitulo   = '32º',
  inicio      = date '2027-01-21',
  fim         = date '2027-01-26',
  onde        = 'Praça Concórdia',
  lat         = (select lat from public.locais where slug = 'praca-concordia'),
  lng         = (select lng from public.locais where slug = 'praca-concordia'),
  programacao =
'Qui 21/01 · Dia de festa
Sex 22/01 · Dia de festa
Sáb 23/01 · Dia de festa
Dom 24/01 · Dia de festa
Seg 25/01 · Dia de festa
Ter 26/01 · Dia de festa',
  publicado   = true
where slug = 'kerb-in-ivoti';

-- ------------------------------------------------------------
-- 20ª Feira do Mel, Rosca e Nata — tres fins de semana
-- 21 a 23 e 28 a 30 de maio, e 04 a 06 de junho
-- ------------------------------------------------------------
update public.temas set
  subtitulo   = '20ª',
  inicio      = date '2027-05-21',
  fim         = date '2027-06-06',
  onde        = 'Núcleo de Casas Enxaimel',
  lat         = (select lat from public.locais where slug = 'nucleo-de-casas-enxaimel'),
  lng         = (select lng from public.locais where slug = 'nucleo-de-casas-enxaimel'),
  programacao =
'Sex 21/05 · Dia de feira
Sáb 22/05 · Dia de feira
Dom 23/05 · Dia de feira
Sex 28/05 · Dia de feira
Sáb 29/05 · Dia de feira
Dom 30/05 · Dia de feira
Sex 04/06 · Dia de feira
Sáb 05/06 · Dia de feira
Dom 06/06 · Dia de feira',
  publicado   = true
where slug = 'feira-do-mel';

-- ------------------------------------------------------------
-- 20ª Feira das Flores e Aniversário do Município
-- 15 a 17 e 22 a 24 de outubro
-- ------------------------------------------------------------
-- Troca as datas de 2026 pelas de 2027. A programacao de 2026, que veio
-- do folheto impresso, sai junto: ela era daquela edicao.
update public.temas set
  subtitulo   = '20ª',
  inicio      = date '2027-10-15',
  fim         = date '2027-10-24',
  onde        = 'Núcleo de Casas Enxaimel',
  programacao =
'Sex 15/10 · Dia de feira
Sáb 16/10 · Dia de feira
Dom 17/10 · Dia de feira
Sex 22/10 · Dia de feira
Sáb 23/10 · Dia de feira
Dom 24/10 · Dia de feira',
  publicado   = true
where slug = 'feira-das-flores';

commit;

-- ------------------------------------------------------------
-- Conferencia
-- ------------------------------------------------------------
select slug, subtitulo, inicio, fim, onde, publicado,
       array_length(string_to_array(programacao, chr(10)), 1) as dias_de_feira
  from public.temas
 order by inicio;
