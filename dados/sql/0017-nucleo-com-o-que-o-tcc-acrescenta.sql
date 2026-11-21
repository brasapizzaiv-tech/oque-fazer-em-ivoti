-- ============================================================
-- Núcleo de Casas Enxaimel: o que o TCC acrescenta
-- ============================================================
-- Fonte: Adriana Konrad, "Patrimônio histórico, identidade e turismo:
-- o processo de revitalização do Núcleo de Casas Enxaimel", TCC de
-- História, Feevale, 2015 (136 páginas, no catálogo da Biblioteca
-- Pública de Ivoti). Lido inteiro em 21/11/2026; os quatro pontos
-- abaixo foram conferidos no texto.
--
-- Entram na descrição, que já tinha sido reescrita no SQL 0016:
--
--   1. os ofícios do povoado: fábrica de cerveja e de gasosa e
--      oficina de carroças (p. 50);
--   2. por que o Núcleo não tem igreja: as duas escolas, uma
--      católica e uma evangélica, serviam também de culto (p. 56);
--   3. a segunda explicação para o nome Buraco do Diabo: o bandido
--      conhecido como Menino Diabo, na Guerra dos Farrapos (p. 44);
--   4. o público da Feira do Mel, Rosca e Nata: mais de 50 mil
--      pessoas em 2015, pela estimativa da Brigada Militar (p. 89).
--
-- O que o TCC repete e o inventário do patrimônio desmente (a ponte
-- "sem cimento", os 148 metros) NÃO entra.
-- Só mexe na descrição. Pode rodar de novo: dá no mesmo.
-- ============================================================

begin;

update public.locais
   set descricao = $txt$No bairro Feitoria Nova, logo depois da Ponte do Imperador, fica o conjunto de casas em enxaimel de um dos povoados mais antigos de Ivoti. Ele é de 1826, formado por imigrantes vindos do Hunsrück, e até a metade do século XX foi o centro de comércio da região: tinha vendas, dois bancos, salão de baile, ferraria, curtumes, oficina de carroças e fábrica de cerveja e de gasosa. Igreja não tinha: as duas escolas, uma católica e uma evangélica, serviam também para o culto.

Os alemães chamavam o lugar de Teufelsloch, o Buraco do Diabo, e há duas explicações para o nome. Uma é que os primeiros colonos, estranhando a mata, tomaram um tamanduá pelo diabo. A outra vem da Guerra dos Farrapos: um bandido conhecido como Menino Diabo teria torturado e mandado matar um colono ali.

Do povoado antigo restam sete casas, a maioria em enxaimel. Estima-se que a do Museu Municipal Cláudio Oscar Becker seja de por volta de 1830. Nos fundos da casa vizinha funcionava uma ferraria, e uma escavação feita em 2006 e 2007 achou ali cravos, ferraduras e ferragens de carroça, hoje guardados no museu.

Nos anos 1980 as casas estavam abandonadas. A prefeitura começou a comprá-las em 1990 e a restaurá-las em seguida, com a ajuda de especialistas alemães em enxaimel. Três delas são tombadas pelo município desde 2004.

Hoje funcionam ali a Secretaria de Turismo, Desporto e Cultura, a Casa do Artesão e o Armazém da Feira Colonial. Aos sábados, domingos e feriados acontece a Feira Colonial, com produtos coloniais, artesanato, flores e uma variedade grande de produtos da região.

É também onde acontecem os principais eventos do município: Páscoa em Ivoti, Feira do Livro, Feira do Mel, Rosca e Nata, Festival da Cachaça, Ivotiche e a Feira das Flores. A do Mel, Rosca e Nata é a maior: em 2015 a Brigada Militar estimou o público em mais de 50 mil pessoas.

Aberto diariamente, entrada gratuita. Vale confirmar o horário de funcionamento das casas com a Secretaria de Turismo.$txt$
 where slug = 'nucleo-de-casas-enxaimel';

-- Confere antes de valer. Qualquer conta diferente desfaz tudo.
do $$
declare
  certos integer;
begin
  select count(*) into certos
    from public.locais
   where slug = 'nucleo-de-casas-enxaimel'
     and descricao like '%Menino Diabo%'
     and descricao like '%mais de 50 mil pessoas%';

  if certos <> 1 then
    raise exception 'Esperava 1 lugar atualizado; achei %. Nada foi alterado.', certos;
  end if;
end $$;

commit;
