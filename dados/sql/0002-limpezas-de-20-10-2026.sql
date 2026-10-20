-- ============================================================
-- Duas limpezas, independentes uma da outra
-- ============================================================
-- Pode rodar as duas, ou só uma, ou as duas de novo amanhã: nenhuma
-- faz estrago se repetida.
-- ============================================================


-- ------------------------------------------------------------
-- 1. Apagar o local de teste
-- ------------------------------------------------------------
-- O "TESTE do Claude - pode apagar" foi criado para conferir o painel e
-- ficou lá. Conferido antes de escrever isto: ele tem 1 horário
-- cadastrado, nenhuma foto, nenhum evento, nenhuma promoção, nenhuma
-- métrica, e nenhum roteiro que o cite. O horário sai junto sozinho,
-- pela regra do banco. Nada mais é afetado.
--
-- A conta do dono NÃO sai junto, de propósito: conta é de gente, e essa
-- não tem mais nenhum outro lugar cadastrado. Se era sua, de teste,
-- peça o comando separado.

delete from public.locais
 where slug = 'teste-do-claude-pode-apagar';

-- Esperado: DELETE 1 na primeira vez, DELETE 0 se já tiver sido apagado.


-- ------------------------------------------------------------
-- 2. Arquivar as origens do tempo em que a medida era cega
-- ------------------------------------------------------------
-- Até 13/10/2026 a origem do acesso era calculada do jeito errado e só
-- sabia responder "direto" — não porque todo mundo chegasse direto, mas
-- porque a conta olhava o endereço da própria página em vez do site de
-- onde a pessoa veio. São 39 acessos em 7 dias, todos "direto", todos
-- sem informação nenhuma.
--
-- Deixá-los junto dos dados novos faria o acesso direto parecer dominante
-- justamente agora, que a medida começou a distinguir — em 20/10 apareceu
-- o primeiro "google.com".
--
-- NADA É PERDIDO: as linhas vão inteiras para a tabela de arquivo, a
-- mesma do corte de 06/10, com um motivo próprio para dar para separar
-- depois. Se este corte se mostrar exagerado, está tudo lá.
--
-- O corte é em 13/10 inclusive, embora o conserto tenha subido naquele
-- mesmo dia: não dá para saber quais horas do dia 13 já estavam com o
-- código novo, e na dúvida é melhor arquivar um dado bom do que manter
-- um ruim.

begin;

insert into public.metricas_dia_arquivo
select m.*, now(), 'origem cega: medida so sabia dizer direto, corrigida em 13/10/2026'
  from public.metricas_dia m
 where m.tipo = 'site_origem'
   and m.dia <= date '2026-10-13';

delete from public.metricas_dia
 where tipo = 'site_origem'
   and dia <= date '2026-10-13';

commit;


-- ------------------------------------------------------------
-- Conferência
-- ------------------------------------------------------------
select 'local de teste ainda existe?' as pergunta,
       count(*)::text as resposta
  from public.locais where slug = 'teste-do-claude-pode-apagar'
union all
select 'origens que sobraram (devem ser de 14/10 em diante)',
       count(*)::text from public.metricas_dia where tipo = 'site_origem'
union all
select 'origens guardadas no arquivo',
       count(*)::text from public.metricas_dia_arquivo
 where motivo like 'origem cega%';

-- E o que o painel vai mostrar de origem a partir de agora:
select chave, sum(contagem) as acessos
  from public.metricas_dia where tipo = 'site_origem'
 group by chave order by 2 desc;
