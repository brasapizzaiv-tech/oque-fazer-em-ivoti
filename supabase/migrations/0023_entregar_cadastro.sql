-- ============================================================
-- Entregar um cadastro para a conta do comerciante
-- ============================================================
-- A implantacao e um servico vendido: a administracao vai ao lugar,
-- fotografa e monta o cadastro inteiro. So que o dono de um lugar e quem
-- o criou — se a administracao cria, o lugar fica na conta dela, e o
-- comerciante nunca consegue trocar uma foto ou publicar uma promocao.
--
-- Esta funcao passa o lugar para a conta de quem tem o e-mail informado.
--
-- Mora no banco, e nao numa tela, por dois motivos. O e-mail das contas
-- fica numa tabela que o site nao enxerga, de proposito. E "trocar o dono
-- de um estabelecimento" e o tipo de acao que precisa da mesma regra
-- venha de onde vier: so a administracao.
--
-- Devolve uma palavra, e nao um erro, quando a conta nao existe: e a
-- situacao mais comum — o comerciante ainda nao se cadastrou — e a tela
-- precisa explicar o que fazer, nao mostrar uma falha.
-- ============================================================

create or replace function public.entregar_local(p_local uuid, p_email text)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_conta uuid;
begin
  if not public.eh_admin() then
    raise exception 'So a administracao entrega um cadastro.';
  end if;

  select id into v_conta
    from auth.users
   where lower(email) = lower(trim(p_email))
   limit 1;

  if v_conta is null then
    return 'sem_conta';
  end if;

  update public.locais set dono_id = v_conta where id = p_local;
  if not found then
    return 'sem_local';
  end if;

  return 'ok';
end;
$$;

comment on function public.entregar_local(uuid, text) is
  'Passa o local para a conta com este e-mail. So a administracao.';

-- Funcao nova nasce executavel por qualquer um. Quem nao esta logado nao
-- tem por que sequer chamar esta.
revoke all on function public.entregar_local(uuid, text) from public, anon;
grant execute on function public.entregar_local(uuid, text) to authenticated;
