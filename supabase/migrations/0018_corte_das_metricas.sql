-- ============================================================
-- Corte nas metricas: o que havia nao servia
-- ============================================================
-- Em 06/10/2026 o painel mostrava 571 acessos em tres dias. Olhando por
-- pagina, 552 deles eram de uma unica tela, o Explorar, e as outras
-- paginas somavam quase nada. Pessoa que abre o Explorar abre tambem a
-- pagina de algum lugar; centenas de visitas a uma pagina so, e zero as
-- outras, e maquina.
--
-- Havia duas fontes de sujeira:
--
--   1. O ambiente de desenvolvimento gravava NESTA tabela. Cada tela
--      aberta para conferir largura ou contraste virava acesso, e as
--      varreduras automaticas abrem dezenas de uma vez.
--   2. Robo que executa o programa da pagina, que a contagem no
--      navegador nao filtrava.
--
-- As duas foram fechadas no codigo. Esta migracao limpa o que ja estava
-- gravado, porque numero inflado nao e so inutil: o comerciante paga
-- para ver estes dados, e se ele acreditar em "250 acessos" a gente
-- vendeu uma promessa que o site nao cumpriu.
--
-- NADA E PERDIDO. As linhas vao inteiras para uma tabela de arquivo
-- antes de sairem daqui. Se um dia alguem quiser saber o que havia, ou
-- se este corte se mostrar exagerado, esta tudo la.
-- ============================================================

create table if not exists public.metricas_dia_arquivo (
  -- "excluding identity": a coluna id da tabela viva e gerada pelo banco
  -- e recusa valor vindo de fora. No arquivo ela precisa guardar o id
  -- que a linha tinha, senao a copia perde justamente o que a liga ao
  -- original.
  like public.metricas_dia including all excluding indexes excluding identity,
  arquivada_em timestamptz not null default now(),
  motivo text not null default 'corte de 06/10/2026: mistura de teste e robo'
);

comment on table public.metricas_dia_arquivo is
  'O que foi tirado de metricas_dia no corte. Guardado, nao apagado.';

alter table public.metricas_dia_arquivo enable row level security;

-- So a administracao enxerga o arquivo.
drop policy if exists metricas_arquivo_ler on public.metricas_dia_arquivo;
create policy metricas_arquivo_ler on public.metricas_dia_arquivo
  for select using (public.eh_admin());

-- Copia e limpa, numa transacao so: a migracao inteira roda dentro de
-- uma, entao ou as duas acontecem ou nenhuma.
insert into public.metricas_dia_arquivo
  select m.*, now(), 'corte de 06/10/2026: mistura de teste e robo'
  from public.metricas_dia m;

delete from public.metricas_dia;
