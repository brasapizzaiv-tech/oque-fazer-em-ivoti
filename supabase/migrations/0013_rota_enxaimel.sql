-- ============================================================
-- Rota Enxaimel: estabelecimentos e o primeiro caminho
-- ============================================================
-- Vem de dois materiais que o Rafael trouxe em 17/09/2026:
--
--   1. "Folder Rota Enxaimel", da prefeitura de Ivoti — os caminhos
--      autoguiados e os estabelecimentos de cada um;
--   2. "Guia de Viagem do Vale Germanico", da AMVARS — Ivoti nao e um dos 13
--      municipios dele e aparece so de passagem, mas traz endereco e telefone
--      de dois lugares daqui.
--
-- Tudo entra como RASCUNHO. Nao e timidez: dos 14, nove chegaram so com o
-- nome, sem endereco, sem telefone e sem horario. Publicar assim seria
-- colocar no guia uma pagina que nao responde a pergunta de quem abriu.
-- Como rascunho eles aparecem so no painel da administracao, e a propria
-- tela de edicao ja lista o que falta para publicar.
--
-- O que nao se sabe fica NULO. Nenhuma descricao foi inventada para
-- preencher espaco: a regra do guia inteiro e que e melhor um campo vazio
-- do que um campo bonito e errado.
-- ============================================================

insert into public.locais (slug, nome, categoria_id, resumo, descricao, endereco, bairro, telefone, status)
values
  -- ---- com informacao de verdade nas fontes ----
  (
    'museu-claudio-oscar-becker',
    'Museu Cláudio Oscar Becker',
    42,
    'O museu da cidade, e um dos dois lugares que carimbam o passaporte da Rota Enxaimel.',
    'Guarda a memória da colonização alemã em Ivoti. É também ponto de carimbo do passaporte da Rota Enxaimel, junto com os Departamentos de Cultura e de Turismo.',
    null, null, null,
    'rascunho'
  ),
  (
    'casa-adoma',
    'Casa Adoma',
    22,
    'Cervejaria artesanal com chope na torneira e petiscos alemães.',
    'Chope artesanal tirado direto da torneira — pilsen, weiss e berga — com petiscos como salsichas alemãs, bolinho de batata, pastel e pizza. Tem área externa.',
    'Rua Duque de Caxias, 293',
    'Harmonia',
    '51998334838',
    'rascunho'
  ),
  (
    'rancho-fatbull',
    'Rancho Fatbull',
    22,
    'Cervejaria em estilo celeiro, com espaço para as crianças brincarem.',
    'A construção lembra um celeiro americano, e na área externa há uma pickup F100 de 1978 com colchonetes e almofadas. Bom para ir com criança ou sentar com os amigos. No cardápio, o bolinho de costela e a batata da casa, com queijo fundido, carne de panela, sour cream e farofa.',
    'Avenida Presidente Lucena, 5760',
    'Nova Vila',
    '51999930101',
    'rascunho'
  ),

  -- ---- so o nome: o folder cita, mas nao descreve ----
  ('cachacaria-weber-haus', 'Cachaçaria Weber Haus', 35, null, null, null, null, null, 'rascunho'),
  ('queijaria-nova-alemanha', 'Queijaria Nova Alemanha', 35, null, null, null, null, null, 'rascunho'),
  ('hotel-spazio', 'Hotel Spazio', 28, null, null, null, null, null, 'rascunho'),
  ('casa-do-artesao', 'Casa do Artesão', 38, null, null, null, null, null, 'rascunho'),
  ('lancheria-do-paulinho', 'Lancheria do Paulinho', 12, null, null, null, null, null, 'rascunho'),
  ('finger-flores', 'Finger Flores', 50, null, null, null, null, null, 'rascunho'),

  -- ---- nem a categoria da para afirmar ----
  -- Estes cinco o folder lista como pontos dos caminhos, sem dizer o que sao.
  -- "Casa" no Nucleo Enxaimel tanto pode ser casa historica quanto comercio
  -- dentro de uma. Chutar a categoria colocaria o lugar na busca errada, que
  -- e pior do que nao ter categoria.
  ('casa-amarela', 'Casa Amarela', null, null, null, null, null, null, 'rascunho'),
  ('casa-zimmermann', 'Casa Zimmermann', null, null, null, null, null, null, 'rascunho'),
  ('casa-do-tempo', 'Casa do Tempo', null, null, null, null, null, null, 'rascunho'),
  ('leben-haus', 'Leben Haus', null, null, null, null, null, null, 'rascunho'),
  ('tenda-da-carmem', 'Tenda da Carmem', null, null, null, null, null, null, 'rascunho')
on conflict (slug) do nothing;

-- ------------------------------------------------------------
-- Horarios do museu
-- ------------------------------------------------------------
-- O unico horario que os dois materiais trazem. Fecha para o almoco, entao
-- cada dia sao duas faixas.
insert into public.locais_horarios (local_id, dia_semana, abre, fecha, observacao)
select l.id, d.dia, d.abre::time, d.fecha::time, d.obs
from public.locais l
cross join (values
  (2, '08:00', '12:00', null),
  (2, '13:00', '17:00', null),
  (3, '08:00', '12:00', null),
  (3, '13:00', '17:00', null),
  (4, '08:00', '12:00', null),
  (4, '13:00', '17:00', null),
  (5, '08:00', '12:00', null),
  (5, '13:00', '17:00', null),
  (6, '09:00', '12:00', 'Mesmo horário em feriados'),
  (6, '13:00', '17:00', 'Mesmo horário em feriados'),
  (0, '09:00', '12:00', 'Mesmo horário em feriados'),
  (0, '13:00', '17:00', 'Mesmo horário em feriados')
) as d(dia, abre, fecha, obs)
where l.slug = 'museu-claudio-oscar-becker'
  and not exists (
    select 1 from public.locais_horarios h where h.local_id = l.id
  );

-- ------------------------------------------------------------
-- Os caminhos autoguiados
-- ------------------------------------------------------------
-- Seis caminhos, todos com saida e chegada no Nucleo de Casas Enxaimel.
--
-- Só um deles entra com as paradas: o Morro do Pedro. O folder traz cinco
-- listas de estabelecimentos, uma por painel, mas os titulos dos outros
-- quatro paineis sao desenho, nao texto — nao saem do arquivo, e ligar lista
-- a caminho por proximidade seria adivinhacao. Roteiro errado manda gente
-- para a estrada errada, entao os outros cinco ficam sem parada ate o Rafael
-- dizer qual e qual.
--
-- Todos nascem despublicados: as paradas ainda sao rascunho, e roteiro so
-- vale quando os lugares dele estao no ar.
insert into public.roteiros (token, titulo, descricao, slug, curado, publicado, ordem, locais)
values
  (
    replace(gen_random_uuid()::text, '-', ''),
    'Caminho Morro do Pedro',
    'Um dos caminhos autoguiados da Rota Enxaimel, com saída e chegada no Núcleo de Casas Enxaimel. O percurso é circular e sinalizado num só sentido.',
    'caminho-morro-do-pedro', true, false, 1, '{}'
  ),
  (replace(gen_random_uuid()::text, '-', ''), 'Caminho Picada 48 Alta',  null, 'caminho-picada-48-alta',  true, false, 2, '{}'),
  (replace(gen_random_uuid()::text, '-', ''), 'Caminho Picada 48 Baixa', null, 'caminho-picada-48-baixa', true, false, 3, '{}'),
  (replace(gen_random_uuid()::text, '-', ''), 'Caminho Picada Feijão',   null, 'caminho-picada-feijao',   true, false, 4, '{}'),
  (replace(gen_random_uuid()::text, '-', ''), 'Caminho Feitoria Nova',   null, 'caminho-feitoria-nova',   true, false, 5, '{}'),
  (replace(gen_random_uuid()::text, '-', ''), 'Caminho Nova Vila',       null, 'caminho-nova-vila',       true, false, 6, '{}')
on conflict (slug) do nothing;

-- As paradas do Morro do Pedro, na ordem do folder, começando pelo Núcleo,
-- que é de onde todos os caminhos saem.
update public.roteiros r
set locais = (
  select array_agg(l.id order by ordem.n)
  from (values
    ('nucleo-de-casas-enxaimel', 1),
    ('casa-amarela', 2),
    ('casa-do-artesao', 3),
    ('lancheria-do-paulinho', 4),
    ('casa-adoma', 5),
    ('casa-zimmermann', 6),
    ('museu-claudio-oscar-becker', 7)
  ) as ordem(slug, n)
  join public.locais l on l.slug = ordem.slug
)
where r.slug = 'caminho-morro-do-pedro'
  and cardinality(r.locais) = 0;
