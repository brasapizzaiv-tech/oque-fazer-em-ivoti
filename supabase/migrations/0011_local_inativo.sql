-- ============================================================
-- Tirar um local do ar sem apagar
-- ============================================================
-- Um estabelecimento fecha, muda de dono, para para reforma. Apagar seria
-- perder o historico junto: as metricas, as fotos, o que o Guia ja aprendeu
-- a indicar. Entao ele ganha um status novo, 'inativo'.
--
-- A vantagem de usar o status, e nao uma coluna separada, e que o site
-- inteiro ja filtra por 'publicado': a pagina do local, o mapa, o Explorar,
-- a agenda e o catalogo que o Guia le. Nenhum deles precisa saber que o
-- 'inativo' existe — o local simplesmente para de aparecer, em todos de uma
-- vez, sem chance de sobrar num canto esquecido.
-- ============================================================

alter table public.locais
  drop constraint if exists locais_status_check;

alter table public.locais
  add constraint locais_status_check
  check (status in ('rascunho', 'em_analise', 'publicado', 'rejeitado', 'inativo'));

-- Quando saiu do ar. Serve para a tela mostrar "fora do ar desde 12/09" e
-- para voce saber ha quanto tempo aquilo esta parado.
alter table public.locais
  add column if not exists desativado_em timestamptz;

-- ------------------------------------------------------------
-- Quem pode mudar o status para o que
-- ------------------------------------------------------------
-- As regras de acesso deixam o dono editar o proprio local, e status e uma
-- coluna como outra qualquer: ate aqui, nada impedia um dono de gravar
-- status = 'publicado' direto pela API e pular a sua aprovacao. Com a
-- desativacao isso ficaria pior ainda, porque bastaria desativar e reativar.
--
-- Entao o caminho fica preso, do mesmo jeito que o plano ja estava: o dono
-- so pode mandar para analise, tirar do ar o que ja estava no ar, e devolver
-- ao ar o que ele mesmo tirou. Publicar, devolver para ajuste e qualquer
-- outro atalho continuam sendo seus.
--
-- Nao da erro quando alguem tenta: devolve o status anterior em silencio,
-- igual ao travar_plano. Erro aqui so ensinaria onde esta a porta.
create or replace function public.travar_status()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status is distinct from old.status and not public.eh_admin() then
    if not (
         (old.status in ('rascunho', 'rejeitado') and new.status = 'em_analise')
      or (old.status = 'publicado' and new.status = 'inativo')
      or (old.status = 'inativo'   and new.status = 'publicado')
    ) then
      new.status := old.status;
    end if;
  end if;

  -- A data de saida se cuida sozinha, entao nenhuma tela precisa lembrar
  -- de gravar ou de limpar.
  if new.status = 'inativo' and old.status is distinct from 'inativo' then
    new.desativado_em := now();
  elsif new.status is distinct from 'inativo' then
    new.desativado_em := null;
  end if;

  return new;
end;
$$;

drop trigger if exists locais_travar_status on public.locais;

create trigger locais_travar_status
  before update on public.locais
  for each row execute function public.travar_status();
