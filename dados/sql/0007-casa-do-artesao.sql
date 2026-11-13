-- ============================================================
-- Casa do Artesão: o rascunho ganha texto, endereço, mapa e horários
-- ============================================================
-- O cadastro existia só com o nome e a categoria. Este arquivo preenche
-- o resto e deixa o lugar COMO RASCUNHO: publicar é decisão de quem
-- administra. Fotos não entram aqui.
--
-- De onde vem cada coisa:
--   - O que vende, quem produz (ADETUR), "meados do século XIX",
--     Rua da Cascata e horários: página do atrativo no site da
--     Prefeitura (ivoti.rs.gov.br/atrativos/casa-do-artesao), lida em
--     13/11/2026. Os mesmos horários aparecem no site Vale Germânico.
--   - Ponto no mapa: a ficha "Casa do Artesão" no Google Maps.
--   - Sem telefone: a página da Prefeitura só traz o geral da
--     Prefeitura, que não é o da casa.
--
-- Pode rodar de novo enquanto o lugar for rascunho. Depois de
-- publicado, a conferência do fim barra e nada muda.
-- ============================================================

begin;

update public.locais
   set categoria_id = (select id from public.categorias where slug = 'artesanato'),
       resumo    = 'Artesanato e bebidas artesanais feitos por gente de Ivoti, numa das casas do Núcleo Enxaimel.',
       descricao = E'A Casa do Artesão fica junto ao Núcleo de Casas Enxaimel, numa casa que existe desde meados do século XIX.\n\nAli se vende o que é produzido pelos integrantes da ADETUR, a Associação para o Desenvolvimento Turístico de Ivoti: peças em lã, linha, tecido e madeira, além de cachaças, licores e cervejas artesanais. É um bom lugar para levar uma lembrança da cidade feita por quem mora nela.\n\nAbre todos os dias. Nos sábados, domingos e feriados não fecha ao meio-dia.',
       endereco  = 'Rua da Cascata',
       bairro    = 'Feitoria Nova',
       lat       = -29.582820,
       lng       = -51.157184
 where slug = 'casa-do-artesao'
   and status = 'rascunho';

-- Horários. dia_semana: 0 é domingo, 6 é sábado.
delete from public.locais_horarios
 where local_id = (select id from public.locais where slug = 'casa-do-artesao');

insert into public.locais_horarios (local_id, dia_semana, abre, fecha)
select l.id, d.dia, h.abre, h.fecha
  from public.locais l
 cross join generate_series(1, 5) as d(dia)
 cross join (values ('09:00'::time, '11:30'::time),
                    ('13:00'::time, '17:00'::time)) as h(abre, fecha)
 where l.slug = 'casa-do-artesao'
union all
select l.id, d.dia, '09:00'::time, '17:00'::time
  from public.locais l
 cross join (values (0), (6)) as d(dia)
 where l.slug = 'casa-do-artesao';

-- Confere antes de valer: tem de ser 1 lugar, ainda rascunho, com 12
-- horários (2 turnos de segunda a sexta, 1 no sábado e 1 no domingo).
-- Qualquer outra conta desfaz tudo.
do $$
declare
  lugares  integer;
  horarios integer;
begin
  select count(*) into lugares
    from public.locais
   where slug = 'casa-do-artesao' and status = 'rascunho' and lat is not null;

  select count(*) into horarios
    from public.locais_horarios
   where local_id = (select id from public.locais where slug = 'casa-do-artesao');

  if lugares <> 1 or horarios <> 12 then
    raise exception 'Esperava 1 lugar e 12 horarios, achei % e %', lugares, horarios;
  end if;
end $$;

commit;
