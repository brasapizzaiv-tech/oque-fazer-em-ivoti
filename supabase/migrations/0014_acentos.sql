-- ============================================================
-- Acentos nas categorias e nas etiquetas
-- ============================================================
-- Elas nasceram sem acento e aparecem em todo lugar do site: no cartao de
-- cada lugar, na trilha de navegacao, nos filtros do Explorar e do mapa.
-- "Praca" aparecia em 7 dos 13 locais publicados.
--
-- Muda so o nome, que e o que a pessoa le. O slug fica como esta: e ele que
-- monta os enderecos (/explorar?categoria=praca), e trocar quebraria os links
-- que ja circulam e o que o Google indexou.
--
-- Tres nomes tambem trocam "pra" por "para". O guia tem uma regra de escrita
-- — a mesma que o assistente segue — de escrever por extenso, e esses nomes
-- eram a propria casa contrariando a regra.
-- ============================================================

update public.categorias set nome = 'Café colonial'          where slug = 'colonial';
update public.categorias set nome = 'Café e confeitaria'     where slug = 'cafe';
update public.categorias set nome = 'Chalé'                  where slug = 'chale';
update public.categorias set nome = 'Cultura e história'     where slug = 'cultura';
update public.categorias set nome = 'Diversão para a criançada' where slug = 'kids';
update public.categorias set nome = 'Outros serviços'        where slug = 'outros-servicos';
update public.categorias set nome = 'Piscina e balneário'    where slug = 'piscina';
update public.categorias set nome = 'Ponto histórico'        where slug = 'ponto-historico';
update public.categorias set nome = 'Praça'                  where slug = 'praca';
update public.categorias set nome = 'Saúde'                  where slug = 'saude';
update public.categorias set nome = 'Serviços'               where slug = 'servicos';
update public.categorias set nome = 'Vinícola'               where slug = 'vinicola';

update public.tags set nome = 'Aceita cartão'        where slug = 'cartao';
update public.tags set nome = 'Acessível'            where slug = 'acessivel';
update public.tags set nome = 'Bom para crianças'    where slug = 'com-crianca';
update public.tags set nome = 'Bom para grupos'      where slug = 'em-grupo';
update public.tags set nome = 'Música ao vivo'       where slug = 'musica-ao-vivo';
update public.tags set nome = 'Opções sem glúten'    where slug = 'sem-gluten';
update public.tags set nome = 'Opções vegetarianas'  where slug = 'vegetariano';
update public.tags set nome = 'Romântico'            where slug = 'romantico';
update public.tags set nome = 'Só com agendamento'   where slug = 'agendamento';
