-- ============================================================
-- 19ª Feira das Flores — 2026
-- ============================================================
-- Transcrito do folheto oficial da prefeitura (foto de 13/10/2026):
-- dias 16, 17, 18, 23, 24 e 25 de outubro de 2026, das 9h às 18h,
-- no Núcleo de Casas Enxaimel, entrada gratuita.
--
-- Pode rodar mais de uma vez sem duplicar nada.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. O tema: o site veste a roupa da feira de 16 a 25 de outubro
-- ------------------------------------------------------------
-- O periodo vai direto de 16 a 25 e inclui os dias 19 a 22, em que nao
-- ha feira. E de proposito: o tema e a roupa da temporada, e tira-la no
-- meio, entre um fim de semana e outro, faria o site parecer que a feira
-- acabou justamente quando as pessoas estao se organizando para o
-- segundo. Quais dias tem feira esta na programacao e na agenda.
--
-- A cor saiu do folheto: o verde escuro do nome. Alem de ser a cor certa,
-- ela e mais legivel que a que estava cadastrada — o branco sobre ela da
-- 4,95 de contraste com o vidro a 78%, enquanto o verde anterior so
-- chegava a 4,52 e exigia 93%, quase tapando a foto do fundo.
update public.temas set
  subtitulo = '19ª',
  inicio    = date '2026-10-16',
  fim       = date '2026-10-25',
  cor          = '#3F4E2C',  -- o verde do nome, no folheto
  cor_destaque = '#E8571F',  -- o laranja das datas; so risco, nunca texto
  onde = 'Núcleo de Casas Enxaimel',
  lat  = -29.582604,
  lng  = -51.156966,
  programacao =
'Sex 16/10 · 9h — Início da feira
Sex 16/10 · 14h às 18h — Bandinha típica Vira Copos
Sex 16/10 · 18h — Encerramento
Sáb 17/10 · 9h — Início da feira
Sáb 17/10 · 10h — Solenidade de abertura do evento
Sáb 17/10 · 9h às 13h e 14h às 18h — Bandinha típica Bremen
Sáb 17/10 · 18h — Encerramento
Dom 18/10 · 9h — Início da feira
Dom 18/10 · 9h às 13h — Bandinha típica Klabunde e Cia
Dom 18/10 · 14h às 18h — Bandinha típica Klabunde e Cia
Dom 18/10 · Talentos locais em cena, pelos 62 anos de Ivoti:
Dom 18/10 · 13h30 — Diálogo no dialeto Hunsrik com alunos da Rede Municipal de Ensino
Dom 18/10 · 13h40 — Projeto Vida Saudável: danças folclóricas alemãs
Dom 18/10 · 14h10 — Grupo de Danças Alemãs Volkstanzgruppe Berghanschneiss
Dom 18/10 · 14h45 — CTG Harmonia Gaúcha: invernadas artísticas, declamação e chula
Dom 18/10 · 15h45 — Grupo Folclórico de Danças Roda Alegre
Dom 18/10 · 16h45 — Diálogo com alunos de Língua Japonesa
Dom 18/10 · 17h — Ivoti Wadaiko, grupo de taikos da Colônia Japonesa
Dom 18/10 · 18h — Encerramento
Sex 23/10 · 9h — Início da feira
Sex 23/10 · 14h às 18h — Bandinha típica Vira Copos
Sex 23/10 · 18h — Encerramento
Sáb 24/10 · 9h — Início da feira
Sáb 24/10 · 9h às 13h e 14h às 18h — Bandinha típica Bremen
Sáb 24/10 · 18h — Encerramento
Dom 25/10 · 9h — Início da feira
Dom 25/10 · 9h às 13h e 14h às 18h — Bandinha típica Bremen
Dom 25/10 · 18h — Encerramento da 19ª Feira das Flores',
  expositores =
'Flores
Folhagens
Aromas
Artesanato
Oficinas florais
Produtos coloniais
Cachaças
Cervejas artesanais
Gastronomia variada',
  publicado = true
where slug = 'feira-das-flores';

-- O "19ª edicao" estava na Feira do Mel por engano — o folheto mostra que
-- a 19ª e a das Flores. Numero de edicao errado e pior que nenhum, entao
-- a do Mel fica sem ate alguem confirmar qual e a dela.
update public.temas set subtitulo = null where slug = 'feira-do-mel';

-- ------------------------------------------------------------
-- 2. A agenda: um evento por dia de feira
-- ------------------------------------------------------------
-- Seis eventos e nao um so de 16 a 25, porque a Agenda agrupa pelo dia de
-- inicio: assim cada dia de feira aparece no seu lugar, e os dias 19 a 22,
-- em que nao ha feira, ficam vazios como na vida real. Cada um some
-- sozinho seis horas depois de acabar.
delete from public.eventos
 where local_id = (select id from public.locais where slug = 'nucleo-de-casas-enxaimel')
   and titulo = '19ª Feira das Flores'
   and inicio >= timestamptz '2026-10-16 00:00-03'
   and inicio <  timestamptz '2026-10-26 00:00-03';

insert into public.eventos (local_id, titulo, descricao, inicio, fim, local_texto, status)
select
  (select id from public.locais where slug = 'nucleo-de-casas-enxaimel'),
  '19ª Feira das Flores',
  d.descricao,
  d.inicio,
  d.fim,
  'Núcleo de Casas Enxaimel',
  'publicado'
from (values
  (timestamptz '2026-10-16 09:00-03', timestamptz '2026-10-16 18:00-03',
   'Primeiro dia da feira. Bandinha típica Vira Copos das 14h às 18h. Entrada gratuita.'),
  (timestamptz '2026-10-17 09:00-03', timestamptz '2026-10-17 18:00-03',
   'Solenidade de abertura às 10h. Bandinha típica Bremen das 9h às 13h e das 14h às 18h. Entrada gratuita.'),
  (timestamptz '2026-10-18 09:00-03', timestamptz '2026-10-18 18:00-03',
   'Talentos locais em cena das 13h30 às 17h, pelos 62 anos de Ivoti: Hunsrik, danças alemãs, CTG Harmonia Gaúcha, Roda Alegre, língua japonesa e o Ivoti Wadaiko. Bandinha típica Klabunde e Cia. Entrada gratuita.'),
  (timestamptz '2026-10-23 09:00-03', timestamptz '2026-10-23 18:00-03',
   'Segundo fim de semana. Bandinha típica Vira Copos das 14h às 18h. Entrada gratuita.'),
  (timestamptz '2026-10-24 09:00-03', timestamptz '2026-10-24 18:00-03',
   'Bandinha típica Bremen das 9h às 13h e das 14h às 18h. Entrada gratuita.'),
  (timestamptz '2026-10-25 09:00-03', timestamptz '2026-10-25 18:00-03',
   'Último dia da 19ª Feira das Flores, com encerramento às 18h. Bandinha típica Bremen. Entrada gratuita.')
) as d(inicio, fim, descricao);

commit;

-- ------------------------------------------------------------
-- Conferencia
-- ------------------------------------------------------------
select slug, subtitulo, inicio, fim, publicado from public.temas order by slug;
select inicio::date as dia, titulo from public.eventos
 where titulo = '19ª Feira das Flores' order by inicio;
