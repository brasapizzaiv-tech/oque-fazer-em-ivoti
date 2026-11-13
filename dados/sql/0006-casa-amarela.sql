-- ============================================================
-- Casa Amarela: o rascunho ganha texto, endereço, mapa e horários
-- ============================================================
-- O cadastro existia só com o nome. Este arquivo preenche o resto e
-- deixa o lugar COMO RASCUNHO: publicar é decisão de quem administra.
--
-- De onde vem cada coisa:
--   - 1907, estilo eclético, mercado de trocas, início da Rua da
--     Cascata, Central de Atendimento ao Turista desde 15/08/2026,
--     horários e telefone: página do atrativo no site da Prefeitura
--     (ivoti.rs.gov.br/atrativos/casa-amarela), lida em 13/11/2026.
--   - Incêndio de 2005 e restauro com recursos do Consulado Alemão:
--     portal ivoti.com.br. Não está na página da Prefeitura.
--   - Ponto no mapa: o prédio "Casa Amarela" no OpenStreetMap.
--
-- Pode rodar de novo enquanto o lugar for rascunho: o texto é regravado
-- igual e os horários são trocados pelos mesmos. Depois de publicado,
-- a conferência do fim barra e nada muda.
-- ============================================================

begin;

update public.locais
   set categoria_id = (select id from public.categorias where slug = 'ponto-historico'),
       resumo    = 'Casarão de 1907 na entrada do Núcleo de Casas Enxaimel. Hoje é a Central de Atendimento ao Turista.',
       descricao = E'Na entrada do Núcleo de Casas Enxaimel, a Casa Amarela chama atenção por ser diferente das vizinhas: foi construída em 1907 em estilo eclético, de alvenaria, e não na técnica enxaimel.\n\nNos primeiros anos funcionou como um mercado de trocas, onde os moradores permutavam o que plantavam e produziam por outros itens do dia a dia. Em 2005 um incêndio destruiu parte do prédio, que depois foi restaurado com recursos do Consulado Alemão.\n\nReinaugurada em 15 de agosto de 2026, a casa abriga a Central de Atendimento ao Turista. É o melhor lugar para começar o passeio: ali você pega informações sobre os atrativos de Ivoti antes de seguir a pé para as casas enxaimel e para a Ponte do Imperador.\n\nAbre todos os dias, inclusive nos feriados, no horário de sábado e domingo.',
       endereco  = 'Rua da Cascata',
       bairro    = 'Feitoria Nova',
       lat       = -29.582731,
       lng       = -51.157899,
       telefone  = '(51) 3563-7946'
 where slug = 'casa-amarela'
   and status = 'rascunho';

-- Horários da Central de Atendimento ao Turista.
-- dia_semana: 0 é domingo, 6 é sábado.
delete from public.locais_horarios
 where local_id = (select id from public.locais where slug = 'casa-amarela');

insert into public.locais_horarios (local_id, dia_semana, abre, fecha)
select l.id, d.dia, h.abre, h.fecha
  from public.locais l
 cross join generate_series(1, 5) as d(dia)
 cross join (values ('08:00'::time, '11:30'::time),
                    ('13:00'::time, '17:00'::time)) as h(abre, fecha)
 where l.slug = 'casa-amarela'
union all
select l.id, d.dia, h.abre, h.fecha
  from public.locais l
 cross join (values (0), (6)) as d(dia)
 cross join (values ('09:00'::time, '12:00'::time),
                    ('13:00'::time, '17:00'::time)) as h(abre, fecha)
 where l.slug = 'casa-amarela';

-- Confere antes de valer: tem de ser 1 lugar, ainda rascunho, com 14
-- horários (2 turnos em 7 dias). Qualquer outra conta desfaz tudo.
do $$
declare
  lugares  integer;
  horarios integer;
begin
  select count(*) into lugares
    from public.locais
   where slug = 'casa-amarela' and status = 'rascunho' and lat is not null;

  select count(*) into horarios
    from public.locais_horarios
   where local_id = (select id from public.locais where slug = 'casa-amarela');

  if lugares <> 1 or horarios <> 14 then
    raise exception 'Esperava 1 lugar e 14 horarios, achei % e %', lugares, horarios;
  end if;
end $$;

commit;
