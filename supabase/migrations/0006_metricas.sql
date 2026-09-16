-- ============================================================
-- Metricas do guia
-- ============================================================
-- Uma tabela so para todo numero que o painel mostra: acesso a pagina,
-- clique em telefone, visualizacao de evento, indicacao para o comercio.
--
-- Por que uma tabela so, e nao uma por tipo: o painel do comerciante mostra
-- tudo junto ("340 acessos, 28 cliques no WhatsApp, 12 indicacoes"), e o do
-- admin soma a cidade inteira. Com uma tabela, cada tela sai numa consulta.
-- Com quatro, sairia em quatro, e cada numero novo pediria tabela nova.
--
-- Guarda contagem por dia, nao evento por evento: um ano inteiro de um
-- comercio movimentado nao passa de algumas centenas de linhas.
--
-- NENHUM dado pessoal aqui: nem nome, nem e-mail, nem endereco de rede, nem
-- cookie de rastreio. Sao contadores. Isso mantem o site fora da parte
-- pesada da LGPD e dispensa aviso de consentimento.
-- ============================================================

create table public.metricas_dia (
  -- Chave propria, sem significado. As colunas que identificam a linha de
  -- verdade (dia, tipo, local, alvo, chave) precisam aceitar nulo — e coluna
  -- dentro de chave primaria vira obrigatoria no Postgres, queira ou nao.
  -- A unicidade real fica no indice mais abaixo.
  id bigint generated always as identity primary key,

  dia date not null,

  -- O que foi contado. Texto livre de proposito: tipo novo nao pede migracao.
  --   pagina            abriu a pagina de um estabelecimento
  --   clique_telefone   | clique_whatsapp | clique_site
  --   clique_instagram  | clique_rota     | clique_cardapio
  --   evento_visto      | promocao_vista  (com alvo apontando qual)
  --   indicacao         saiu do guia para o comercio
  --   site_pagina       acesso a uma pagina do site (chave = o caminho)
  --   site_origem       de onde o visitante veio (chave = o site de origem)
  tipo text not null,

  -- De quem e o numero. Nulo quando e do site inteiro (admin).
  local_id uuid references public.locais(id) on delete cascade,

  -- O evento ou a promocao especifica, quando o tipo pede.
  alvo uuid,

  -- Texto solto que o tipo precisar: o caminho da pagina, o site de origem.
  chave text,

  contagem integer not null default 0
);

-- A unicidade de verdade: uma linha por dia, tipo, local, alvo e chave.
-- Precisa do coalesce porque, no Postgres, nulo nunca e igual a nulo — sem
-- isso o banco aceitaria varias linhas iguais com local nulo.
create unique index metricas_dia_unica on public.metricas_dia (
  dia,
  tipo,
  coalesce(local_id, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(alvo, '00000000-0000-0000-0000-000000000000'::uuid),
  coalesce(chave, '')
);

-- Os tres caminhos que as telas percorrem.
create index metricas_dia_local on public.metricas_dia (local_id, dia desc);
create index metricas_dia_tipo on public.metricas_dia (tipo, dia desc);
create index metricas_dia_alvo on public.metricas_dia (alvo) where alvo is not null;

alter table public.metricas_dia enable row level security;

-- O dono ve os numeros dos lugares dele; o admin ve tudo, inclusive as linhas
-- do site inteiro (local_id nulo).
create policy metricas_ler on public.metricas_dia
  for select using (
    (local_id is not null and public.pode_editar_local(local_id))
    or public.eh_admin()
  );

-- ------------------------------------------------------------
-- Somar
-- ------------------------------------------------------------
-- Chamada pelo servidor com a chave de servico, que ignora as regras de
-- acesso. Soma 1 na linha do dia, criando se ainda nao existir.
create or replace function public.somar_metrica(
  p_tipo text,
  p_local uuid default null,
  p_alvo uuid default null,
  p_chave text default null,
  p_quanto integer default 1
)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_dia date := (now() at time zone 'America/Sao_Paulo')::date;
begin
  -- O "on conflict" precisa apontar para o mesmo formato do indice unico.
  insert into public.metricas_dia (dia, tipo, local_id, alvo, chave, contagem)
  values (v_dia, p_tipo, p_local, p_alvo, p_chave, p_quanto)
  on conflict (
    dia,
    tipo,
    coalesce(local_id, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(alvo, '00000000-0000-0000-0000-000000000000'::uuid),
    coalesce(chave, '')
  )
  do update set contagem = public.metricas_dia.contagem + p_quanto;
end;
$$;

-- ------------------------------------------------------------
-- Traz as visitas ja contadas
-- ------------------------------------------------------------
-- A tabela "visitas" contava so acesso a pagina de local. Vira o tipo
-- "pagina" aqui e sai de cena — um lugar so para todo numero.
insert into public.metricas_dia (dia, tipo, local_id, contagem)
select dia, 'pagina', local_id, contagem from public.visitas
on conflict do nothing;

drop function if exists public.registrar_visita(uuid);
drop table if exists public.visitas;
