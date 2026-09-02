-- ============================================================
-- Categorias e etiquetas iniciais do guia
-- ============================================================
-- Sao as gavetas em que os estabelecimentos se encaixam na hora
-- do cadastro, e o vocabulario que o chat usa pra entender
-- pedidos como "quero comer um hamburguer" ou "algo ao ar livre".
-- ============================================================

-- ---------- Categorias principais ----------
insert into public.categorias (slug, nome, emoji, ordem) values
  ('gastronomia',   'Comer e beber',      '🍽️', 10),
  ('vida-noturna',  'Bares e vida noturna', '🍺', 20),
  ('hospedagem',    'Onde ficar',         '🛏️', 30),
  ('natureza',      'Natureza e trilhas', '🌳', 40),
  ('turismo-rural', 'Fazendas e turismo rural', '🐴', 50),
  ('cultura',       'Cultura e historia', '🏛️', 60),
  ('lazer',         'Lazer e esporte',    '⚽', 70),
  ('compras',       'Compras',            '🛍️', 80),
  ('servicos',      'Servicos',           '🔧', 90)
on conflict (slug) do nothing;

-- ---------- Subcategorias ----------
insert into public.categorias (slug, nome, emoji, ordem, pai_id)
select v.slug, v.nome, v.emoji, v.ordem, p.id
from (values
  -- Comer e beber
  ('restaurante',   'Restaurante',    '🍛', 10, 'gastronomia'),
  ('pizzaria',      'Pizzaria',       '🍕', 20, 'gastronomia'),
  ('hamburgueria',  'Hamburgueria',   '🍔', 30, 'gastronomia'),
  ('churrascaria',  'Churrascaria',   '🥩', 40, 'gastronomia'),
  ('cafe',          'Cafe e confeitaria', '☕', 50, 'gastronomia'),
  ('padaria',       'Padaria',        '🥖', 60, 'gastronomia'),
  ('sorveteria',    'Sorveteria',     '🍦', 70, 'gastronomia'),
  ('lanches',       'Lanches e petiscos', '🌭', 80, 'gastronomia'),
  ('colonial',      'Cafe colonial',  '🥐', 90, 'gastronomia'),
  ('delivery',      'Delivery',       '🛵', 100, 'gastronomia'),
  -- Bares e vida noturna
  ('bar',           'Bar',            '🍻', 10, 'vida-noturna'),
  ('pub',           'Pub',            '🍺', 20, 'vida-noturna'),
  ('cervejaria',    'Cervejaria',     '🍺', 30, 'vida-noturna'),
  ('vinicola',      'Vinicola',       '🍷', 40, 'vida-noturna'),
  ('balada',        'Balada e casa de show', '🎶', 50, 'vida-noturna'),
  -- Onde ficar
  ('hotel',         'Hotel',          '🏨', 10, 'hospedagem'),
  ('pousada',       'Pousada',        '🏡', 20, 'hospedagem'),
  ('chale',         'Chale',          '🛖', 30, 'hospedagem'),
  ('camping',       'Camping',        '⛺', 40, 'hospedagem'),
  -- Natureza e trilhas
  ('trilha',        'Trilha',         '🥾', 10, 'natureza'),
  ('cascata',       'Cascata',        '💦', 20, 'natureza'),
  ('parque',        'Parque',         '🌲', 30, 'natureza'),
  ('praca',         'Praca',          '🌸', 40, 'natureza'),
  ('mirante',       'Mirante',        '🔭', 50, 'natureza'),
  -- Fazendas e turismo rural
  ('fazenda',       'Fazenda',        '🚜', 10, 'turismo-rural'),
  ('pesque-pague',  'Pesque e pague', '🎣', 20, 'turismo-rural'),
  ('produtor',      'Produtor local', '🧀', 30, 'turismo-rural'),
  ('cavalgada',     'Cavalgada',      '🐎', 40, 'turismo-rural'),
  -- Cultura e historia
  ('museu',         'Museu',          '🖼️', 10, 'cultura'),
  ('igreja',        'Igreja',         '⛪', 20, 'cultura'),
  ('ponto-historico', 'Ponto historico', '🏰', 30, 'cultura'),
  ('teatro',        'Teatro e cinema', '🎭', 40, 'cultura'),
  ('artesanato',    'Artesanato',     '🧶', 50, 'cultura'),
  -- Lazer e esporte
  ('quadra',        'Quadra e campo', '🏟️', 10, 'lazer'),
  ('academia',      'Academia',       '🏋️', 20, 'lazer'),
  ('piscina',       'Piscina e balneario', '🏊', 30, 'lazer'),
  ('kids',          'Diversao pra criancada', '🎠', 40, 'lazer'),
  ('passeio',       'Passeio guiado', '🚶', 50, 'lazer'),
  -- Compras
  ('loja',          'Loja',           '🏪', 10, 'compras'),
  ('mercado',       'Mercado',        '🛒', 20, 'compras'),
  ('feira',         'Feira',          '🧺', 30, 'compras'),
  -- Servicos
  ('saude',         'Saude',          '🩺', 10, 'servicos'),
  ('beleza',        'Beleza',         '💇', 20, 'servicos'),
  ('oficina',       'Oficina e auto', '🔩', 30, 'servicos'),
  ('outros-servicos', 'Outros servicos', '📌', 40, 'servicos')
) as v(slug, nome, emoji, ordem, pai_slug)
join public.categorias p on p.slug = v.pai_slug
on conflict (slug) do nothing;

-- ---------- Etiquetas ----------
insert into public.tags (slug, nome, emoji, ordem) values
  ('ao-ar-livre',      'Ao ar livre',        '☀️', 10),
  ('com-crianca',      'Bom pra criancas',   '🧒', 20),
  ('aceita-pet',       'Aceita pet',         '🐶', 30),
  ('estacionamento',   'Estacionamento',     '🅿️', 40),
  ('acessivel',        'Acessivel',          '♿', 50),
  ('wifi',             'Wi-Fi',              '📶', 60),
  ('ar-condicionado',  'Ar-condicionado',    '❄️', 70),
  ('musica-ao-vivo',   'Musica ao vivo',     '🎤', 80),
  ('vegetariano',      'Opcoes vegetarianas', '🥗', 90),
  ('sem-gluten',       'Opcoes sem gluten',  '🌾', 100),
  ('romantico',        'Romantico',          '💛', 110),
  ('em-grupo',         'Bom pra grupos',     '👥', 120),
  ('vista-bonita',     'Vista bonita',       '📸', 130),
  ('delivery',         'Faz entrega',        '🛵', 140),
  ('retirada',         'Retirada no local',  '🥡', 150),
  ('reserva',          'Aceita reserva',     '📅', 160),
  ('cartao',           'Aceita cartao',      '💳', 170),
  ('pix',              'Aceita Pix',         '📲', 180),
  ('gratuito',         'Entrada gratuita',   '🆓', 190),
  ('agendamento',      'So com agendamento', '🕐', 200)
on conflict (slug) do nothing;
