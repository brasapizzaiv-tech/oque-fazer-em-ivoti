-- ============================================================
-- Pontos turisticos de Ivoti
-- ============================================================
-- Os 12 atrativos publicos da cidade, pra o guia nao nascer vazio.
--
-- Os fatos (datas, medidas, quem construiu, o que tem no lugar) vieram do
-- folheto turistico da Prefeitura. Os textos aqui foram reescritos, e nao
-- copiados: primeiro porque texto de folheto e de quem escreveu, segundo
-- porque o Google penaliza pagina que repete texto que ja existe em outro
-- lugar da internet.
--
-- Coordenadas: conferidas no OpenStreetMap, uma a uma. Os dois pontos que
-- nao foram encontrados (Belvedere e Praca de Skate) ficam sem pino ate
-- alguem marcar no mapa pelo painel — melhor sem pino do que com o pino no
-- lugar errado.
--
-- Sem fotos de proposito: as do folheto sao de quem fotografou. Cada ponto
-- entra com o icone da categoria ate ter foto propria.
-- ============================================================

-- ------------------------------------------------------------
-- Os locais
-- ------------------------------------------------------------
insert into public.locais
  (slug, nome, categoria_id, resumo, descricao, endereco, bairro,
   lat, lng, status, publicado_em, destaque)
select
  v.slug, v.nome, c.id, v.resumo, v.descricao, v.endereco, v.bairro,
  v.lat, v.lng, 'publicado', now(), v.destaque
from (values
  (
    'portico-de-ivoti',
    'Pórtico de Ivoti',
    'ponto-historico',
    'O cartão-postal de quem chega na cidade, erguido em 2007.',
    'O Pórtico marca a entrada de Ivoti desde 2007. O projeto se inspirou na Ponte do Imperador no uso da pedra grês, e os detalhes que imitam madeira são uma referência às casas enxaimel espalhadas pelo município — as duas marcas mais fortes da arquitetura daqui reunidas num lugar só.

Aberto diariamente, com acesso gratuito.',
    'Entrada da cidade', 'Cidade Nova',
    -29.624325, -51.136480, true
  ),
  (
    'belvedere',
    'Belvedere',
    'mirante',
    'Mirante no fim da Av. Presidente Lucena, com luneta pra enxergar o vale de perto.',
    'No fim da Avenida Presidente Lucena, o belvedere abre a vista para o interior de Ivoti. A olho nu já vale a parada; desde 2009 há uma luneta de observação fixa instalada no local, que aproxima os detalhes da paisagem.

Aberto diariamente, acesso gratuito.',
    'Final da Avenida Presidente Lucena', null,
    null, null, true
  ),
  (
    'ponte-do-imperador',
    'Ponte do Imperador',
    'ponto-historico',
    'Ponte de pedra grês de 1864, tombada pelo IPHAN. São 148 metros sobre o Arroio Feitoria.',
    'Construída entre 1857 e 1864, a ponte leva esse nome em homenagem a Dom Pedro II, que destinou 30 contos de réis para a obra. São 148 metros de comprimento e largura que varia de 7,7 a 14,2 metros, em estilo romano.

A pedra grês foi empilhada e encaixada sem argamassa — o cimento aparece só nas colunas dentro da água. Três grandes arcos deixam passar as águas do Arroio Feitoria.

Virou Patrimônio Histórico Nacional em 1986, tombada pelo IPHAN. Fica a 1 km do centro, dentro do Núcleo de Casas Enxaimel.

Aberta diariamente, acesso gratuito.',
    'Rua Tuiuti', 'Feitoria Nova',
    -29.583229, -51.158296, true
  ),
  (
    'igreja-sao-pedro-apostolo',
    'Igreja São Pedro Apóstolo',
    'igreja',
    'A Antiga Igreja Matriz, de 1869, tombada como patrimônio estadual.',
    'Conhecida como Antiga Igreja Matriz, começou a ser construída em 1869. Foi desativada depois do segundo incêndio, em 1987. Em 1986 havia sido tombada como Patrimônio Histórico e Artístico Estadual pelo IPHAE.

A parte de fora pode ser vista a qualquer hora. Para conhecer o interior é preciso agendar a visita.

Acesso gratuito.',
    'Rua do Cemitério', 'Centro',
    -29.591634, -51.160729, true
  ),
  (
    'nucleo-de-casas-enxaimel',
    'Núcleo de Casas Enxaimel',
    'ponto-historico',
    'Casas originais da imigração alemã, com Casa do Artesão e a Feira Colonial nos fins de semana.',
    'No bairro Feitoria Nova está o conjunto de casas construídas na técnica enxaimel, originais do período da imigração alemã em Ivoti.

Hoje funcionam ali a Secretaria de Turismo, Desporto e Cultura, a Casa do Artesão e o Armazém da Feira Colonial. Aos sábados, domingos e feriados acontece a Feira Colonial, com produtos coloniais, artesanato, flores e uma variedade grande de produtos da região.

É também onde acontecem os principais eventos do município: Páscoa em Ivoti, Feira do Livro, Feira do Mel, Rosca e Nata, Festival da Cachaça, Ivotiche e a Feira das Flores.

Aberto diariamente, entrada gratuita. Vale confirmar o horário de funcionamento das casas com a Secretaria de Turismo.',
    'Rua da Feitoria', 'Feitoria Nova',
    -29.582604, -51.156966, true
  ),
  (
    'memorial-da-colonia-japonesa',
    'Memorial da Colônia Japonesa',
    'museu',
    'O acervo da colônia japonesa que se estabeleceu em Ivoti a partir de 1966.',
    'O memorial conta a trajetória dos imigrantes japoneses e seus descendentes que se estabeleceram na colônia de Ivoti a partir de 1966.

No acervo doado ao espaço estão utensílios de trabalho usados na viagem do Japão ao Brasil, objetos de uso doméstico e esportivo, vestimentas típicas, documentos e artesanato.

Aberto diariamente, acesso gratuito. Vale confirmar o horário antes de ir.',
    'Rua Sakura', null,
    -29.595915, -51.125813, false
  ),
  (
    'praca-neldo-holler',
    'Praça Neldo Holler',
    'praca',
    'A única praça do Rio Grande do Sul remodelada por Burle Marx.',
    'Na Avenida Presidente Lucena, a praça foi construída em 1979 e batizada em homenagem ao primeiro prefeito de Ivoti.

O que a torna especial: o projeto de remodelação, de 1990, é assinado por Roberto Burle Marx — a única praça no Rio Grande do Sul com projeto do arquiteto paisagista.

Aberta diariamente, acesso gratuito.',
    'Avenida Presidente Lucena', 'Sete de Setembro',
    -29.608196, -51.162855, true
  ),
  (
    'praca-emancipacao',
    'Praça Emancipação',
    'praca',
    'Em frente à Prefeitura, arborizada e florida, com painel de Milton Schaeffer.',
    'Inaugurada em 19 de outubro de 1986 pelo então prefeito Arno Henrique Mueller, fica em frente à Prefeitura Municipal.

É arborizada e florida, com espaço pra descansar ou encontrar os amigos. Tem um painel do artista plástico Milton Schaeffer.

Aberta diariamente, acesso gratuito.',
    'Em frente à Prefeitura Municipal', 'Centro',
    -29.592901, -51.160929, false
  ),
  (
    'praca-concordia',
    'Praça Concórdia',
    'praca',
    'Chafariz, brinquedos e área gastronômica. É onde acontecem o Kerb in Ivoti e o Natal no Coração.',
    'Construída em 1959, fica na Avenida Presidente Lucena, em frente à Sociedade de Canto Concórdia.

Tem espaço arborizado, brinquedos infantis e chafariz. Conta também com uma área gastronômica, onde expositores do município vendem alimentação em horários determinados.

É o palco de eventos tradicionais da cidade, como o Kerb in Ivoti e o Natal no Coração.

Aberta diariamente, acesso gratuito.',
    'Avenida Presidente Lucena', 'Harmonia',
    -29.604067, -51.162905, true
  ),
  (
    'praca-de-skate-geraldo-jose-frohlich',
    'Praça de Skate e Lazer Geraldo José Fröhlich',
    'praca',
    'Pista de skate com mini-ramp e street, mais quadra e brinquedos.',
    'Na Avenida Castro Alves, no bairro Concórdia. A pista de skate atende as modalidades mini-ramp e street.

Tem ainda brinquedos infantis, quadra de esportes e espaço arborizado.

Aberta diariamente, acesso gratuito.',
    'Avenida Castro Alves', 'Concórdia',
    null, null, false
  ),
  (
    'praca-ecologica-edio-klein',
    'Praça Ecológica Vereador Edio Klein – Oscar Nicolao Müller',
    'praca',
    '7,5 mil m² de área verde pra piquenique, caminhada e educação ambiental.',
    'Com cerca de 7,5 mil metros quadrados, é uma ampla área verde pensada pra piquenique, passeio em família, brinquedos infantis e caminhada.

O espaço tem foco no convívio com o meio ambiente, com atividades de educação ambiental e lazer ao ar livre. Ali acontecem o Eco Sábado e a Páscoa em Ivoti.

Aberta diariamente, acesso gratuito.',
    null, null,
    -29.600803, -51.163304, false
  ),
  (
    'praca-bom-jardim',
    'Praça Bom Jardim',
    'praca',
    'Conhecida como praça Ivoti Legal: pista de patins, churrasqueiras, caminhódromo e academia ao ar livre.',
    'A comunidade também chama de praça Ivoti Legal. É uma área bem arborizada, com pista de concreto para patins e patinetes, churrasqueiras, caminhódromo, brinquedos infantis e academia ao ar livre.

Aberta diariamente, acesso gratuito.',
    null, 'Bom Jardim',
    -29.616653, -51.167252, false
  )
) as v(slug, nome, cat, resumo, descricao, endereco, bairro, lat, lng, destaque)
join public.categorias c on c.slug = v.cat
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- Etiquetas
-- ------------------------------------------------------------
-- So o que o folheto sustenta. Nada de "estacionamento" ou "acessivel"
-- chutado: se a informacao nao existe, a etiqueta nao entra.
insert into public.locais_tags (local_id, tag_id)
select l.id, t.id
from (values
  ('portico-de-ivoti', 'gratuito'),
  ('portico-de-ivoti', 'ao-ar-livre'),
  ('belvedere', 'gratuito'),
  ('belvedere', 'ao-ar-livre'),
  ('belvedere', 'vista-bonita'),
  ('ponte-do-imperador', 'gratuito'),
  ('ponte-do-imperador', 'ao-ar-livre'),
  ('ponte-do-imperador', 'vista-bonita'),
  ('igreja-sao-pedro-apostolo', 'gratuito'),
  ('igreja-sao-pedro-apostolo', 'agendamento'),
  ('nucleo-de-casas-enxaimel', 'gratuito'),
  ('nucleo-de-casas-enxaimel', 'ao-ar-livre'),
  ('nucleo-de-casas-enxaimel', 'em-grupo'),
  ('memorial-da-colonia-japonesa', 'gratuito'),
  ('praca-neldo-holler', 'gratuito'),
  ('praca-neldo-holler', 'ao-ar-livre'),
  ('praca-emancipacao', 'gratuito'),
  ('praca-emancipacao', 'ao-ar-livre'),
  ('praca-concordia', 'gratuito'),
  ('praca-concordia', 'ao-ar-livre'),
  ('praca-concordia', 'com-crianca'),
  ('praca-de-skate-geraldo-jose-frohlich', 'gratuito'),
  ('praca-de-skate-geraldo-jose-frohlich', 'ao-ar-livre'),
  ('praca-de-skate-geraldo-jose-frohlich', 'com-crianca'),
  ('praca-ecologica-edio-klein', 'gratuito'),
  ('praca-ecologica-edio-klein', 'ao-ar-livre'),
  ('praca-ecologica-edio-klein', 'com-crianca'),
  ('praca-ecologica-edio-klein', 'em-grupo'),
  ('praca-bom-jardim', 'gratuito'),
  ('praca-bom-jardim', 'ao-ar-livre'),
  ('praca-bom-jardim', 'com-crianca')
) as v(local, tag)
join public.locais l on l.slug = v.local
join public.tags t on t.slug = v.tag
on conflict do nothing;

-- ------------------------------------------------------------
-- Horarios
-- ------------------------------------------------------------
-- So para o que e ao ar livre e sem portao: o folheto diz "aberta
-- diariamente, acesso gratuito", entao 24 horas e a leitura honesta.
--
-- Nucleo, Memorial e Igreja ficam SEM horario de proposito: tem gente
-- trabalhando e horario de expediente que o folheto nao informa. O site vai
-- mostrar "Horario nao informado" ate alguem preencher — melhor do que
-- mandar a pessoa numa porta fechada.
insert into public.locais_horarios (local_id, dia_semana, abre, fecha)
select l.id, d.dia, '00:00'::time, '23:59'::time
from public.locais l
cross join generate_series(0, 6) as d(dia)
where l.slug in (
  'portico-de-ivoti',
  'belvedere',
  'ponte-do-imperador',
  'praca-neldo-holler',
  'praca-emancipacao',
  'praca-concordia',
  'praca-de-skate-geraldo-jose-frohlich',
  'praca-ecologica-edio-klein',
  'praca-bom-jardim'
);
