-- ============================================================
-- Cinco lugares com a história conferida na Biblioteca Pública
-- ============================================================
-- Em 21/11/2026 li o que o catálogo da Biblioteca Pública de Ivoti
-- tem em formato digital sobre estes lugares:
--
--   * o Inventário Arquitetônico do Patrimônio Cultural de Ivoti
--     (2020-2021), fichas da Feitoria Nova, da Colônia Japonesa e
--     da Sede;
--   * os artigos de Adriana Konrad e colegas sobre a Antiga Igreja
--     São Pedro (Revista Mosaico, 2022) e sobre o Núcleo de Casas
--     Enxaimel (Métis, 2017, e Mouseion, 2018).
--
-- O que muda:
--
-- 1. Ponte do Imperador. O texto dizia "tombada em 1986". A ficha
--    do inventário e o artigo da Mouseion dão a mesma data:
--    13 de junho de 1988 (inscrição nº 524 no Livro Histórico).
--    Sai também a frase da pedra "encaixada sem argamassa": o
--    inventário mostra, pelo orçamento da obra, que cal e cimento
--    estavam previstos. As medidas passam a ser as do inventário.
--
-- 2. Igreja São Pedro Apóstolo. O texto dizia que o incêndio de
--    1924 "poupou as paredes e a torre". O jornal da época, citado
--    pelo inventário e pelo artigo, diz que as torres também foram
--    atingidas e que os sinos caíram. Entram as datas exatas, a
--    torre de 1890 e as duas datas de 1986. O que a paróquia informa
--    e nenhuma fonte contradiz (piso e vidros de 2012, os usos de
--    hoje) fica como estava.
--
-- 3. Núcleo de Casas Enxaimel. Ganha a história: o povoado de 1826,
--    o nome Buraco do Diabo, a ferraria achada por escavação, o
--    abandono e a restauração.
--
-- 4. Casa do Artesão e 5. Memorial da Colônia Japonesa. Ganham as
--    datas do prédio, que o guia não tinha.
--
-- Nada de nome de proprietário atual, telefone ou e-mail: as fichas
-- trazem, e nada disso veio para cá.
-- Só mexe em resumo e descrição. Pode rodar de novo: dá no mesmo.
-- ============================================================

begin;

-- 1. Ponte do Imperador ---------------------------------------
update public.locais
   set resumo = 'Ponte de pedra grês dos anos 1860, tombada pelo IPHAN em 1988. Três arcos sobre o Arroio Feitoria.',
       descricao = $txt$A ponte de pedra substituiu uma ponte de madeira que já existia ali, num ponto de passagem usado por tropeiros desde o século XVIII. Os documentos do Arquivo Histórico do Estado apontam o começo da obra para 1858, e ela levou cerca de sete anos. O dinheiro veio do Governo Imperial, do governo da Província e de contribuições dos moradores, e entre os trabalhadores havia homens livres e escravizados.

Na época ela era só "a ponte sobre o Arroio Feitoria"; os alemães a chamavam de ponte do Buraco do Diabo. O nome que lembra Dom Pedro II se firmou no século XX. Duas histórias que se contam sobre ela não se confirmam nos papéis da obra: a de que foi erguida sem cal nem cimento (o orçamento previa os dois) e a de que sobrou dinheiro, devolvido ao governo (a ponte custou quase quatro vezes o orçado).

São três arcos de pedra grês. Pelo inventário do patrimônio do município, de 2021, a ponte tem 140 metros contando as rampas, 8 metros de altura e 6,40 metros de largura no trecho plano, abrindo para 13 metros nas pontas. No começo dos anos 1970 um arco menor ruiu; foi refeito em 1973.

É patrimônio histórico nacional desde 13 de junho de 1988, quando foi inscrita no Livro do Tombo Histórico do IPHAN. Fica a 1 km do centro, na entrada do Núcleo de Casas Enxaimel.

Aberta diariamente, acesso gratuito.$txt$
 where slug = 'ponte-do-imperador';

-- 2. Igreja São Pedro Apóstolo --------------------------------
update public.locais
   set descricao = $txt$Conhecida como Antiga Igreja Matriz, ou Igreja Velha. A comunidade católica é de 1834 e teve duas capelas de madeira antes da primeira de alvenaria, inaugurada em 29 de junho de 1857. No lugar dela cresceu a igreja matriz, de pedra grês, cuja torre ficou pronta em 1890. A paróquia foi criada em 4 de novembro de 1867.

Passou por dois incêndios. O de 19 de novembro de 1924 queimou os altares, os bancos e todo o interior e chegou à torre, de onde os sinos caíram; as paredes ficaram de pé, e a igreja reconstruída foi reaberta em 15 de novembro de 1925. Quando a Igreja Nova ficou pronta, em 1969, a antiga serviu de escola paroquial até 1973 e, depois, de espaço para catequese e eventos; em dezembro de 1979 chegou a abrigar uma discoteca.

Em 11 de setembro de 1986 o Estado reconheceu a igreja como patrimônio a preservar. Cinco dias depois veio o segundo incêndio, apagado por uma chuva forte. O IPHAE registra o tombamento com a data de 26 de novembro daquele ano. O telhado de hoje, com estrutura de ferro, é de 2004; o piso e os vidros das janelas, pela cronologia que a paróquia mantém na entrada, de 2012; a escadaria da frente foi refeita em 2017. Em 2022, o restauro completo ainda estava por fazer.

Hoje a paróquia usa o espaço para missas em língua alemã, exposições, teatro e apresentações de Natal. Muita gente vem fotografar, principalmente para 15 anos e casamentos.

A parte de fora pode ser vista a qualquer hora. Para ver o interior, vale combinar com a paróquia antes de ir. Acesso gratuito.$txt$
 where slug = 'igreja-sao-pedro-apostolo';

-- 3. Núcleo de Casas Enxaimel ---------------------------------
update public.locais
   set descricao = $txt$No bairro Feitoria Nova, logo depois da Ponte do Imperador, fica o conjunto de casas em enxaimel de um dos povoados mais antigos de Ivoti. Ele é de 1826, formado por imigrantes vindos do Hunsrück, e até a metade do século XX foi o centro de comércio da região: tinha vendas, escolas, salão de baile, dois bancos, ferraria e curtumes.

Os alemães chamavam o lugar de Teufelsloch, o Buraco do Diabo. Uma das explicações que se contam é que os primeiros colonos, estranhando a mata, tomaram um tamanduá pelo diabo.

Do povoado antigo restam sete casas, a maioria em enxaimel. Estima-se que a do Museu Municipal Cláudio Oscar Becker seja de por volta de 1830. Nos fundos da casa vizinha funcionava uma ferraria, e uma escavação feita em 2006 e 2007 achou ali cravos, ferraduras e ferragens de carroça, hoje guardados no museu.

Nos anos 1980 as casas estavam abandonadas. A prefeitura começou a comprá-las em 1990 e a restaurá-las em seguida, com a ajuda de especialistas alemães em enxaimel. Três delas são tombadas pelo município desde 2004.

Hoje funcionam ali a Secretaria de Turismo, Desporto e Cultura, a Casa do Artesão e o Armazém da Feira Colonial. Aos sábados, domingos e feriados acontece a Feira Colonial, com produtos coloniais, artesanato, flores e uma variedade grande de produtos da região.

É também onde acontecem os principais eventos do município: Páscoa em Ivoti, Feira do Livro, Feira do Mel, Rosca e Nata, Festival da Cachaça, Ivotiche e a Feira das Flores.

Aberto diariamente, entrada gratuita. Vale confirmar o horário de funcionamento das casas com a Secretaria de Turismo.$txt$
 where slug = 'nucleo-de-casas-enxaimel';

-- 4. Casa do Artesão ------------------------------------------
update public.locais
   set descricao = $txt$A Casa do Artesão fica junto ao Núcleo de Casas Enxaimel, numa casa em enxaimel, provavelmente de meados do século XIX, que pertenceu a Herberto Bockorny e já abrigou uma escola. No inventário do patrimônio ela aparece como Casa Edelwein, o nome da última família que morou ali. O município comprou a casa em 1990 e a tombou em 2004. Hoje ela é cedida aos artesãos da cidade.

Ali se vende o que é produzido pelos integrantes da ADETUR, a Associação para o Desenvolvimento Turístico de Ivoti: peças em lã, linha, tecido e madeira, além de cachaças, licores e cervejas artesanais. É um bom lugar para levar uma lembrança da cidade feita por quem mora nela.

Abre todos os dias. Nos sábados, domingos e feriados não fecha ao meio-dia.$txt$
 where slug = 'casa-do-artesao';

-- 5. Memorial da Colônia Japonesa -----------------------------
update public.locais
   set descricao = $txt$O memorial conta a trajetória dos imigrantes japoneses e seus descendentes em Ivoti. As primeiras 26 famílias se instalaram na colônia a partir de 20 de dezembro de 1966.

O prédio foi a escola dos filhos dos colonos, inaugurada em 20 de fevereiro de 1971 com a presença do governador do Estado e do cônsul do Japão. A escola funcionou até 1997 e o prédio ficou 13 anos fechado, até ser reformado para o memorial, aberto em 11 de novembro de 2010. Do lado de fora há um jardim japonês de 719 m².

No acervo doado ao espaço estão utensílios de trabalho usados na viagem do Japão ao Brasil, objetos de uso doméstico e esportivo, vestimentas típicas, documentos e artesanato. O memorial guarda também a história da cooperativa de hortigranjeiros criada em 1969, que a comunidade lembra como o símbolo do seu tempo mais próspero.

Entrada gratuita. Fecha às segundas-feiras.$txt$
 where slug = 'memorial-da-colonia-japonesa';

-- Confere antes de valer. Qualquer conta diferente desfaz tudo.
do $$
declare
  certos integer;
begin
  select count(*) into certos
    from public.locais
   where (slug = 'ponte-do-imperador'           and descricao like '%13 de junho de 1988%' and resumo like '%em 1988%')
      or (slug = 'igreja-sao-pedro-apostolo'    and descricao like '%19 de novembro de 1924%')
      or (slug = 'nucleo-de-casas-enxaimel'     and descricao like '%Teufelsloch%')
      or (slug = 'casa-do-artesao'              and descricao like '%Casa Edelwein%')
      or (slug = 'memorial-da-colonia-japonesa' and descricao like '%20 de fevereiro de 1971%');

  if certos <> 5 then
    raise exception 'Esperava 5 lugares atualizados; achei %. Nada foi alterado.', certos;
  end if;
end $$;

commit;
