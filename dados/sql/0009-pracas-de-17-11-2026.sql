-- ============================================================
-- Praças: horário, pino, endereço e uma praça nova
-- ============================================================
-- Na tarde de 17/11/2026 o Rafael fotografou as praças que faltavam.
-- As fotos trazem placas, avisos e o ponto no mapa de onde foram
-- tiradas. Este arquivo acerta o cadastro pelo que elas mostram e
-- cria a Praça das Flores, que não existia no guia.
--
-- De onde vem cada coisa:
--   - Praça de Skate: aviso na grade ("Horário 8h às 19h30"; nas
--     quartas, 9h às 11h e 14h às 16h, só alunos da oficina) e placa
--     de inauguração (18/10/2008). O pino é a localização gravada nas
--     fotos tiradas dentro da praça.
--   - Praça Bom Jardim: placa de regras no quiosque ("Horário de
--     funcionamento: 8h às 19h30").
--   - Praça Ecológica: placa de rua ao lado da entrada (Rua Vereador
--     Hugo Birk, Bairro Brasília).
--   - Praça Concórdia: placa do Monumento à Petúnia (aço patinável,
--     origami, arquitetos Carlos Henrique Goldman e Esdras de Souza
--     Tonin).
--   - Praça Neldo Holler: placa de bronze (19 de outubro de 1979).
--   - Praça das Flores: placa (1.738,80 m², 12 de janeiro de 2007) e
--     o que as fotos mostram. A rua e o bairro vêm do mapa, pelo ponto
--     das fotos; o Rafael confere antes de publicar.
--
-- A Praça das Flores entra COMO RASCUNHO: publicar é decisão de quem
-- administra. Pode rodar de novo: o resultado é o mesmo.
-- ============================================================

begin;

-- ---------------- Praça de Skate ----------------
update public.locais
   set lat = -29.598228,
       lng = -51.159553,
       descricao = E'Na Avenida Castro Alves, no bairro Concórdia, inaugurada em outubro de 2008. A pista de skate atende as modalidades mini-ramp e street.\n\nTem ainda brinquedos infantis, quadra de esportes e espaço arborizado.\n\nAberta todos os dias, das 8h às 19h30, com acesso gratuito. Nas quartas-feiras, das 9h às 11h e das 14h às 16h, a pista fica reservada aos alunos da oficina de skate.'
 where slug = 'praca-de-skate-geraldo-jose-frohlich';

-- ---------------- Praça Bom Jardim ----------------
update public.locais
   set descricao = E'A comunidade também chama de praça Ivoti Legal. É uma área bem arborizada, com pista de concreto para patins e patinetes, churrasqueiras, caminhódromo, brinquedos infantis e academia ao ar livre.\n\nAberta todos os dias, das 8h às 19h30, com acesso gratuito.'
 where slug = 'praca-bom-jardim';

-- As duas deixam de constar como abertas 24 horas.
delete from public.locais_horarios
 where local_id in (select id from public.locais
                     where slug in ('praca-de-skate-geraldo-jose-frohlich', 'praca-bom-jardim'));

insert into public.locais_horarios (local_id, dia_semana, abre, fecha)
select l.id, d.dia, '08:00'::time, '19:30'::time
  from public.locais l
 cross join generate_series(0, 6) as d(dia)
 where l.slug in ('praca-de-skate-geraldo-jose-frohlich', 'praca-bom-jardim');

-- ---------------- Praça Ecológica ----------------
update public.locais
   set endereco = 'Rua Vereador Hugo Birk',
       bairro   = 'Brasília'
 where slug = 'praca-ecologica-edio-klein';

-- ---------------- Praça Concórdia ----------------
update public.locais
   set resumo    = 'Chafariz, brinquedos, área gastronômica e o Monumento à Petúnia. Palco do Kerb in Ivoti e do Natal no Coração.',
       descricao = E'Construída em 1959, fica na Avenida Presidente Lucena, em frente à Sociedade de Canto Concórdia.\n\nTem espaço arborizado, brinquedos infantis e chafariz. Conta também com uma área gastronômica, onde expositores do município vendem alimentação em horários determinados.\n\nÉ ali que fica o Monumento à Petúnia, a flor símbolo de Ivoti: uma escultura em aço patinável inspirada no origami japonês, dos arquitetos Carlos Henrique Goldman e Esdras de Souza Tonin.\n\nÉ o palco de eventos tradicionais da cidade, como o Kerb in Ivoti e o Natal no Coração.\n\nAberta diariamente, acesso gratuito.'
 where slug = 'praca-concordia';

-- ---------------- Praça Neldo Holler ----------------
update public.locais
   set descricao = E'Na Avenida Presidente Lucena, a praça foi inaugurada em 19 de outubro de 1979 e batizada em homenagem ao primeiro prefeito de Ivoti.\n\nO que a torna especial: o projeto de remodelação, de 1990, é assinado por Roberto Burle Marx — a única praça no Rio Grande do Sul com projeto do arquiteto paisagista.\n\nTem pergolado com primaveras, pracinha para as crianças e bancos à sombra.\n\nAberta diariamente, acesso gratuito.'
 where slug = 'praca-neldo-holler';

-- ---------------- Praça das Flores (nova, como rascunho) ----------------
insert into public.locais
  (slug, nome, categoria_id, resumo, descricao, endereco, bairro, lat, lng, status)
select 'praca-das-flores',
       'Praça das Flores',
       c.id,
       'Praça de bairro com muro de flores pintadas, pracinha e quiosque de madeira.',
       E'Praça de bairro inaugurada em janeiro de 2007. O muro pintado com flores, sol e nuvens dá o tom do lugar.\n\nTem pracinha para as crianças, um quiosque elevado de madeira, aparelhos de ginástica ao ar livre, bancos e gramado.\n\nAberta diariamente, acesso gratuito.',
       'Avenida Castro Alves',
       'Concórdia',
       -29.606200,
       -51.158400,
       'rascunho'
  from public.categorias c
 where c.slug = 'praca'
   and not exists (select 1 from public.locais where slug = 'praca-das-flores');

insert into public.locais_horarios (local_id, dia_semana, abre, fecha)
select l.id, d.dia, '00:00'::time, '23:59'::time
  from public.locais l
 cross join generate_series(0, 6) as d(dia)
 where l.slug = 'praca-das-flores'
   and not exists (select 1 from public.locais_horarios h where h.local_id = l.id);

insert into public.locais_tags (local_id, tag_id)
select l.id, t.id
  from (values ('gratuito'), ('ao-ar-livre'), ('com-crianca')) as v(tag)
  join public.tags t on t.slug = v.tag
  join public.locais l on l.slug = 'praca-das-flores'
on conflict do nothing;

-- Confere antes de valer. Qualquer conta diferente desfaz tudo.
do $$
declare
  textos   integer;
  horarios integer;
  flores   integer;
begin
  select count(*) into textos
    from public.locais
   where (slug = 'praca-de-skate-geraldo-jose-frohlich' and lat is not null and descricao like '%8h às 19h30%')
      or (slug = 'praca-bom-jardim'           and descricao like '%8h às 19h30%')
      or (slug = 'praca-ecologica-edio-klein' and endereco = 'Rua Vereador Hugo Birk')
      or (slug = 'praca-concordia'            and descricao like '%Monumento à Petúnia%')
      or (slug = 'praca-neldo-holler'         and descricao like '%19 de outubro de 1979%');

  select count(*) into horarios
    from public.locais_horarios h
    join public.locais l on l.id = h.local_id
   where l.slug in ('praca-de-skate-geraldo-jose-frohlich', 'praca-bom-jardim')
     and h.abre = '08:00' and h.fecha = '19:30';

  select count(*) into flores
    from public.locais
   where slug = 'praca-das-flores';

  if textos <> 5 or horarios <> 14 or flores <> 1 then
    raise exception 'Esperava 5 textos, 14 horários e 1 praça nova; achei %, % e %. Nada foi alterado.',
      textos, horarios, flores;
  end if;
end $$;

commit;
