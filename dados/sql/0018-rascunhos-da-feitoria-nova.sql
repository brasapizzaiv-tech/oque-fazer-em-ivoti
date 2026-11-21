-- ============================================================
-- Rascunhos da Feitoria Nova: o que dá para preencher
-- ============================================================
-- Em 21/11/2026 havia seis roteiros em rascunho (os caminhos da Rota
-- Enxaimel) e doze lugares em rascunho. Com o inventário do patrimônio
-- do município (2020-2021, fichas 007 e 008 da Feitoria Nova) dá para
-- preencher três deles:
--
-- 1. Museu Cláudio Oscar Becker (lugar): endereço, pino e história.
-- 2. Casa Zimmermann (lugar): endereço, pino, categoria e história.
-- 3. Caminho Feitoria Nova (roteiro): a descrição e as quatro paradas
--    que já estão publicadas no guia.
--
-- NADA É PUBLICADO AQUI. Os três continuam em rascunho: os dois
-- lugares ainda não têm foto nem horário conferido, e a decisão de
-- pôr no ar é da administração.
--
-- O que o inventário diz sobre o uso de cada casa vale para 2021.
-- Nenhum nome de proprietário ou de morador atual veio das fichas.
-- Pode rodar de novo: dá no mesmo.
-- ============================================================

begin;

-- 1. Museu Cláudio Oscar Becker -------------------------------
update public.locais
   set endereco = 'Rua da Cascata',
       numero   = '180',
       bairro   = 'Feitoria Nova',
       lat      = -29.583000,
       lng      = -51.156200,
       descricao = $txt$O museu da cidade ocupa uma das casas em enxaimel do Núcleo, que se estima ser de por volta de 1830. Antes de virar museu ela foi moradia: no fim dos anos 1930 e na década de 1940 morava ali quem trabalhava na casa comercial vizinha. Uma antiga moradora contou ao inventário do patrimônio que, criança, via a água da enchente subir pelas frestas do assoalho.

A prefeitura comprou a casa em 1994. O museu foi inaugurado em 20 de maio de 1995, ainda em outro endereço, ganhou no ano seguinte o nome de Cláudio Oscar Becker, que fez parte da comissão de emancipação de Ivoti, e mais tarde se mudou para o Núcleo. A casa é tombada pelo município desde 2004.

Em 2021 o acervo tinha perto de 1.650 peças, entre roupas, utensílios e móveis dos colonos, e um pavilhão ao lado guardava as peças maiores. Estão ali também os cravos, as ferraduras e as ferragens de carroça achados na escavação da antiga ferraria vizinha.

É ponto de carimbo do passaporte da Rota Enxaimel, junto com os Departamentos de Cultura e de Turismo.$txt$
 where slug = 'museu-claudio-oscar-becker';

-- 2. Casa Zimmermann ------------------------------------------
update public.locais
   set endereco = 'Rua da Cascata',
       numero   = '158',
       bairro   = 'Feitoria Nova',
       lat      = -29.582990,
       lng      = -51.156430,
       categoria_id = coalesce(
         categoria_id,
         (select id from public.categorias where nome = 'Ponto histórico')
       ),
       resumo = 'Casa em enxaimel do Núcleo, tombada pelo município, onde funcionou uma ferraria.',
       descricao = $txt$Casa em enxaimel de meados do século XIX, na Rua da Cascata, ao lado do museu. Nos fundos dela a família Zimmermann tinha uma ferraria. Em 2006 e 2007 uma escavação arqueológica achou ali cinzas, carvão e muitas peças de metal, como cravos, ferraduras e ferragens de carroça, de porta e de janela. Mais da metade de tudo o que foi encontrado era de metal, e o uso mais intenso do lugar foi entre 1828 e 1851. As peças estão no museu municipal.

A família vendeu a casa em 1945, e nos anos 1980 ela estava abandonada. A prefeitura a comprou em 1994. Por volta de 1995 ela serviu de aula prática num curso de restauro de enxaimel, com especialistas vindos da Alemanha, e ficou conhecida como a casa de janelas amarelas. É tombada pelo município desde 2004 e passou por novo restauro em 2019.

Em 2021 funcionava ali um comércio de produtos artesanais e coloniais.$txt$
 where slug = 'casa-zimmermann';

-- 3. Caminho Feitoria Nova ------------------------------------
-- As paradas são as quatro que já estão publicadas, na ordem de quem
-- chega do centro: atravessa a ponte e entra no Núcleo.
update public.roteiros
   set descricao = 'A pé pela Feitoria Nova, o povoado de 1826 junto ao Arroio Feitoria: a Ponte do Imperador, a Casa Amarela, a Casa do Artesão e as casas em enxaimel do Núcleo. As paradas ficam a menos de 200 metros uma da outra.',
       locais = array(
         select l.id
           from public.locais l
           join unnest(array[
                  'ponte-do-imperador',
                  'casa-amarela',
                  'casa-do-artesao',
                  'nucleo-de-casas-enxaimel'
                ]) with ordinality as o(slug, ordem) on o.slug = l.slug
          where l.status = 'publicado'
          order by o.ordem
       )
 where slug = 'caminho-feitoria-nova'
   and curado = true;

-- Confere antes de valer. Qualquer conta diferente desfaz tudo.
do $$
declare
  lugares  integer;
  paradas  integer;
  no_ar    integer;
begin
  select count(*) into lugares
    from public.locais
   where slug in ('museu-claudio-oscar-becker', 'casa-zimmermann')
     and lat is not null and lng is not null
     and categoria_id is not null
     and descricao like '%tombada pelo município desde 2004%';

  if lugares <> 2 then
    raise exception 'Esperava 2 lugares preenchidos; achei %. Nada foi alterado.', lugares;
  end if;

  select coalesce(array_length(locais, 1), 0) into paradas
    from public.roteiros
   where slug = 'caminho-feitoria-nova';

  if paradas <> 4 then
    raise exception 'Esperava 4 paradas no Caminho Feitoria Nova; achei %. Nada foi alterado.', paradas;
  end if;

  -- Este SQL não publica nada: os três têm de seguir em rascunho.
  select (select count(*) from public.locais
           where slug in ('museu-claudio-oscar-becker', 'casa-zimmermann')
             and status = 'publicado')
       + (select count(*) from public.roteiros
           where slug = 'caminho-feitoria-nova' and publicado = true)
    into no_ar;

  if no_ar <> 0 then
    raise exception 'Algum dos três já estava publicado (%). Confira antes de rodar. Nada foi alterado.', no_ar;
  end if;
end $$;

commit;
