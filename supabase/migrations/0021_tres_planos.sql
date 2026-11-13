-- ============================================================
-- De "gratuito e premium" para tres planos pagos
-- ============================================================
-- O modelo de negocio mudou em novembro de 2026: todo comercio paga uma
-- mensalidade, em tres degraus.
--
--   presenca   R$ 49,90   a pagina completa no guia
--   movimento  R$ 99,90   + eventos, promocoes e metricas
--   campanha   R$ 199,90  + prioridade no Guia, roteiros, assistente
--
-- O "gratuito" continua existindo como palavra, mas muda de sentido: e o
-- lugar SEM plano pago. Vale para os pontos da cidade — pracas, ponte,
-- memorial —, que nao tem dono e nunca vao pagar, e para o comercio cujo
-- plano venceu.
--
-- Os precos nao moram no banco. Ficam em lib/planos.ts, junto com a
-- tabela que diz qual recurso pertence a qual degrau: preco muda mais do
-- que estrutura, e mudar preco nao deveria pedir migracao.
--
-- Quem era premium vira campanha, que e o degrau com os mesmos recursos.
-- ============================================================

-- A trava do plano reverte qualquer mudanca feita por quem nao e admin, e
-- a migracao roda sem usuario logado. Sem desligar, o update abaixo
-- seria desfeito em silencio.
alter table public.locais disable trigger locais_travar_plano;

alter table public.locais drop constraint locais_plano_check;
update public.locais set plano = 'campanha' where plano = 'premium';
alter table public.locais
  add constraint locais_plano_check
  check (plano in ('gratuito', 'presenca', 'movimento', 'campanha'));

alter table public.locais enable trigger locais_travar_plano;

comment on column public.locais.plano is
  'gratuito (sem plano pago), presenca, movimento ou campanha. Plano pago so vale se plano_ate ainda nao passou.';

-- O historico guarda o nome do plano de cada periodo.
alter table public.planos_historico drop constraint planos_historico_plano_check;
update public.planos_historico set plano = 'campanha' where plano = 'premium';
alter table public.planos_historico
  add constraint planos_historico_plano_check
  check (plano in ('gratuito', 'presenca', 'movimento', 'campanha'));

-- ------------------------------------------------------------
-- O plano que vale hoje
-- ------------------------------------------------------------
-- Mesma regra de lib/planos.ts: plano pago vencido responde "gratuito",
-- e a data e a de Ivoti, nao a do servidor.
create or replace function public.plano_ativo(p_local uuid)
returns text language sql stable security definer set search_path = public as $$
  select case
    when l.plano in ('presenca', 'movimento', 'campanha')
     and (l.plano_ate is null
          or l.plano_ate >= (now() at time zone 'America/Sao_Paulo')::date)
    then l.plano
    else 'gratuito'
  end
  from public.locais l
  where l.id = p_local;
$$;

-- ------------------------------------------------------------
-- A altura de cada degrau
-- ------------------------------------------------------------
-- As regras perguntam "este lugar tem pelo menos o plano tal?", e nao
-- "este lugar e do plano tal?". Assim o plano de cima herda tudo o que o
-- de baixo libera sem ninguem precisar listar os tres nomes em cada
-- politica.
create or replace function public.nivel_do_plano(p_plano text)
returns integer language sql immutable as $$
  select case p_plano
    when 'campanha'  then 3
    when 'movimento' then 2
    when 'presenca'  then 1
    else 0
  end;
$$;

create or replace function public.tem_plano(p_local uuid, p_minimo text)
returns boolean language sql stable security definer set search_path = public as $$
  select public.nivel_do_plano(public.plano_ativo(p_local))
      >= public.nivel_do_plano(p_minimo);
$$;

comment on function public.tem_plano(uuid, text) is
  'O plano ativo do local alcanca o degrau pedido?';

-- As metricas pertencem ao plano Movimento.
create or replace function public.pode_ver_metricas(p_local uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.eh_admin()
      or (public.pode_editar_local(p_local)
          and public.tem_plano(p_local, 'movimento'));
$$;

comment on function public.pode_ver_metricas(uuid) is
  'Dono com plano Movimento ou acima, ou a administracao.';

-- "eh_premium" e nome antigo e ainda pode estar em uso por alguma
-- consulta. Passa a querer dizer o degrau de cima, que ficou com os
-- recursos que o premium tinha.
create or replace function public.eh_premium(p_local uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.tem_plano(p_local, 'campanha');
$$;

-- ------------------------------------------------------------
-- Eventos e promocoes passam a ser do plano Movimento
-- ------------------------------------------------------------
-- Antes eram de todo mundo. A tela ja esconde o formulario de quem nao
-- tem o plano, mas tela se contorna: quem souber o endereco da API
-- gravaria um evento direto. A regra precisa morar aqui.
--
-- Sao politicas RESTRITIVAS: somam-se as que ja existem em vez de
-- substitui-las. Quem podia criar continua precisando de tudo o que
-- precisava antes, e agora tambem do plano.
--
-- So a CRIACAO e fechada. Editar e apagar o que ja existe continua
-- livre para o dono — um plano que vence nao pode deixar um evento
-- errado no ar sem ninguem conseguir corrigir.

-- O usuario logado tem algum lugar com o plano pedido?
create or replace function public.dono_com_plano(p_minimo text)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.locais l
    where l.dono_id = auth.uid()
      and public.tem_plano(l.id, p_minimo)
  );
$$;

comment on function public.dono_com_plano(text) is
  'Quem esta logado e dono de ao menos um local com o plano pedido?';

-- Evento pode acontecer fora do estabelecimento (uma praca, um salao),
-- entao a pergunta e sobre QUEM cria, nao sobre onde acontece.
drop policy if exists eventos_plano on public.eventos;
create policy eventos_plano on public.eventos
  as restrictive for insert
  with check (public.eh_admin() or public.dono_com_plano('movimento'));

-- Promocao sempre pertence a um lugar, entao vale o plano daquele lugar.
drop policy if exists promocoes_plano on public.promocoes;
create policy promocoes_plano on public.promocoes
  as restrictive for insert
  with check (public.eh_admin() or public.tem_plano(local_id, 'movimento'));
