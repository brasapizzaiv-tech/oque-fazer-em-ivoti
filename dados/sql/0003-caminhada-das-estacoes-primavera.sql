-- ============================================================
-- Caminhada das Estações de Ivoti — Etapa Primavera 2026
-- ============================================================
-- Do anúncio da Prefeitura de Ivoti no Instagram, de 30/10/2026.
--
-- Sábado, 7 de novembro de 2026. Concentração às 7h, saída às 7h30,
-- no Núcleo de Casas Enxaimel. 9,3 km.
--
-- O horário cadastrado é o da CONCENTRAÇÃO e não o da saída: quem lê a
-- agenda precisa saber a que horas estar lá, não a que horas o primeiro
-- passo acontece.
--
-- O fim fica em branco de propósito. O anúncio não diz a que horas
-- termina, e inventar um horário de chegada seria criar informação que
-- ninguém conferiu. A agenda não precisa dele: o evento sai de lá
-- sozinho seis horas depois de começar.
--
-- Pode rodar mais de uma vez sem duplicar.
-- ============================================================

begin;

delete from public.eventos
 where titulo = 'Caminhada das Estações — Etapa Primavera'
   and inicio >= timestamptz '2026-11-07 00:00-03'
   and inicio <  timestamptz '2026-11-08 00:00-03';

insert into public.eventos
  (local_id, titulo, descricao, inicio, fim, local_texto, status)
values (
  (select id from public.locais where slug = 'nucleo-de-casas-enxaimel'),
  'Caminhada das Estações — Etapa Primavera',
  'Caminhada de 9,3 km pelo interior de Ivoti. Concentração às 7h e saída às 7h30, no Núcleo de Casas Enxaimel. No percurso tem frutas, apoio com água e música com o saxofonista Itiel Maciel. Quem completa o trajeto ganha a medalha da etapa, que representa a terceira parte da Ponte do Imperador. Inscrição gratuita para moradores de Ivoti e R$ 20 para quem vem de outro município.',
  timestamptz '2026-11-07 07:00-03',
  null,
  'Núcleo de Casas Enxaimel',
  'publicado'
);

commit;

-- ------------------------------------------------------------
-- Conferência
-- ------------------------------------------------------------
select inicio, titulo, local_texto, status
  from public.eventos_visiveis()
 order by inicio;
