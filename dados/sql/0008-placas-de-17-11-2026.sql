-- ============================================================
-- Textos corrigidos pelo que está escrito nas placas dos lugares
-- ============================================================
-- Em 17/11/2026 o Rafael fotografou os lugares e, junto, as placas e
-- cartazes afixados em cada um. Este arquivo acerta o texto de quatro
-- cadastros pelo que essas placas dizem. Não mexe em foto, horário,
-- endereço nem mapa.
--
-- De onde vem cada coisa:
--   - Igreja São Pedro Apóstolo: cartaz "Antiga Igreja Matriz", da
--     paróquia, afixado na entrada, com a cronologia e os contatos.
--     O cadastro dizia "construída em 1869" e "segundo incêndio em
--     1987"; a paróquia diz inaugurada em 29/06/1857 e segundo
--     incêndio em 16/09/1986. Vale a paróquia, e o texto diz que a
--     data é dela.
--   - Casa Amarela: placa da Prefeitura na fachada (construída em 1907
--     por Georg Heinrich Ludwig; laticínios e depois agência bancária;
--     comprada pelo município em 2004) e placa da restauração
--     (convênio com o Consulado da Alemanha, 09/03/2008).
--   - Casa do Artesão: placa da Prefeitura na entrada (pertenceu a
--     Herberto Bockorny e abrigou uma escola). A placa fala em "início
--     do século XIX" e o site da Prefeitura em "meados"; o texto fica
--     em "século XIX", que vale para as duas.
--   - Praça Emancipação: placa de bronze da praça (19/10/1964 é a
--     data da emancipação; a inauguração foi em 19/10/1986).
--
-- Pode rodar de novo: o resultado é o mesmo.
-- ============================================================

begin;

update public.locais
   set resumo    = 'A Antiga Igreja Matriz, patrimônio histórico estadual: as paredes resistiram a dois incêndios.',
       descricao = E'Conhecida como Antiga Igreja Matriz, ou Igreja Velha. Pela cronologia que a paróquia mantém na entrada, foi inaugurada em 29 de junho de 1857 e virou sede de paróquia em 1867.\n\nPassou por dois incêndios. O primeiro, em 1924, poupou as paredes e a torre, e a igreja foi reinaugurada no ano seguinte. Quando a Igreja Nova ficou pronta, em 1969, a antiga serviu de escola até 1973 e, depois, de espaço para catequese e eventos. Em 1986 foi declarada patrimônio histórico pelo IPHAE e, em setembro do mesmo ano, sofreu o segundo incêndio. O telhado de hoje, com estrutura de ferro, é de 2004; o piso e os vidros das janelas, de 2012; a escadaria foi refeita em 2017.\n\nHoje a paróquia usa o espaço para missas em língua alemã, exposições, teatro e apresentações de Natal. Muita gente vem fotografar, principalmente para 15 anos e casamentos.\n\nA parte de fora pode ser vista a qualquer hora. Para ver o interior, vale combinar com a paróquia antes de ir. Acesso gratuito.',
       telefone  = '(51) 3786-3271',
       whatsapp  = '51996587368',
       instagram = '@paroquia.spa.ivoti'
 where slug = 'igreja-sao-pedro-apostolo';

update public.locais
   set descricao = E'Na entrada do Núcleo de Casas Enxaimel, a Casa Amarela chama atenção por ser diferente das vizinhas: foi construída em 1907, por Georg Heinrich Ludwig, em estilo eclético, de alvenaria, e não na técnica enxaimel.\n\nNos primeiros anos funcionou como um mercado de trocas, onde os moradores permutavam o que plantavam e produziam por outros itens do dia a dia. Depois abrigou uma indústria de laticínios e, mais tarde, uma agência bancária. Em 2004 o prédio foi comprado pelo município. Em 2005 um incêndio destruiu parte dele; a restauração, feita em convênio com o Consulado da Alemanha, ficou pronta em março de 2008.\n\nReinaugurada em 15 de agosto de 2026, a casa abriga a Central de Atendimento ao Turista. É o melhor lugar para começar o passeio: ali você pega informações sobre os atrativos de Ivoti antes de seguir a pé para as casas enxaimel e para a Ponte do Imperador.\n\nAbre todos os dias, inclusive nos feriados, no horário de sábado e domingo.'
 where slug = 'casa-amarela';

update public.locais
   set descricao = E'A Casa do Artesão fica junto ao Núcleo de Casas Enxaimel, numa casa do século XIX que pertenceu a Herberto Bockorny e já abrigou uma escola. Hoje é cedida aos artesãos da cidade.\n\nAli se vende o que é produzido pelos integrantes da ADETUR, a Associação para o Desenvolvimento Turístico de Ivoti: peças em lã, linha, tecido e madeira, além de cachaças, licores e cervejas artesanais. É um bom lugar para levar uma lembrança da cidade feita por quem mora nela.\n\nAbre todos os dias. Nos sábados, domingos e feriados não fecha ao meio-dia.'
 where slug = 'casa-do-artesao';

update public.locais
   set descricao = E'Fica em frente à Prefeitura Municipal e leva no nome a emancipação de Ivoti, de 19 de outubro de 1964. Foi inaugurada no aniversário de 22 anos da cidade, em 19 de outubro de 1986, pelo então prefeito Arno Henrique Mueller.\n\nÉ arborizada e florida, com bancos à sombra para descansar ou encontrar os amigos e pracinha para as crianças. Tem um painel do artista plástico Milton Schaeffer.\n\nAberta diariamente, acesso gratuito.'
 where slug = 'praca-emancipacao';

-- Confere antes de valer: os quatro lugares têm de existir e ter ficado
-- com o texto novo. Qualquer outra conta desfaz tudo.
do $$
declare
  certos integer;
begin
  select count(*) into certos
    from public.locais
   where (slug = 'igreja-sao-pedro-apostolo' and descricao like '%29 de junho de 1857%')
      or (slug = 'casa-amarela'              and descricao like '%Georg Heinrich Ludwig%')
      or (slug = 'casa-do-artesao'           and descricao like '%Herberto Bockorny%')
      or (slug = 'praca-emancipacao'         and descricao like '%19 de outubro de 1964%');

  if certos <> 4 then
    raise exception 'Esperava 4 lugares com o texto novo e achei %. Nada foi alterado.', certos;
  end if;
end $$;

commit;
