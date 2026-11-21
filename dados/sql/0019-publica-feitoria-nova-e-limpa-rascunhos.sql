-- ============================================================
-- Publica o Caminho Feitoria Nova e apaga três rascunhos vazios
-- ============================================================
-- Decidido pelo Rafael em 21/11/2026 ("sim para as duas"):
--
-- 1. O roteiro Caminho Feitoria Nova, preenchido no SQL 0018, vai
--    para o ar: quatro paradas, todas já publicadas no guia.
--
-- 2. Saem os rascunhos de roteiro "Caminho Picada 48 Alta", "Caminho
--    Picada 48 Baixa" e "Caminho Picada Feijão". Eles foram criados
--    em 17/09/2026 só com o título e nunca foram preenchidos. O site
--    passou a ter esses três como páginas de caminho (/caminhos/...),
--    com mapa e história, e os rascunhos ficaram sem função.
--
--    APAGAR NÃO TEM VOLTA, mas o que se perde é só o título: os três
--    estão sem descrição, sem parada e sem capa. Por segurança, só é
--    apagado o que continuar assim: vazio e fora do ar. As páginas
--    /caminhos não são tocadas (elas vêm do código, não desta tabela).
--
-- Pode rodar de novo: dá no mesmo.
-- ============================================================

begin;

-- 1. Publica ---------------------------------------------------
update public.roteiros
   set publicado = true
 where slug = 'caminho-feitoria-nova'
   and curado = true
   and coalesce(array_length(locais, 1), 0) = 4;

-- 2. Apaga os três rascunhos vazios -----------------------------
delete from public.roteiros
 where slug in (
         'caminho-picada-48-alta',
         'caminho-picada-48-baixa',
         'caminho-picada-feijao'
       )
   and curado = true
   and publicado = false
   and descricao is null
   and capa_url is null
   and coalesce(array_length(locais, 1), 0) = 0;

-- Confere antes de valer. Qualquer conta diferente desfaz tudo.
do $$
declare
  no_ar    integer;
  sobraram integer;
  fora     integer;
begin
  select count(*) into no_ar
    from public.roteiros
   where slug = 'caminho-feitoria-nova' and publicado = true;

  if no_ar <> 1 then
    raise exception 'O Caminho Feitoria Nova não ficou publicado (%). Nada foi alterado.', no_ar;
  end if;

  -- Toda parada do roteiro publicado tem de estar no ar.
  select count(*) into fora
    from public.roteiros r
    cross join unnest(r.locais) as p(id)
    left join public.locais l on l.id = p.id and l.status = 'publicado'
   where r.slug = 'caminho-feitoria-nova'
     and l.id is null;

  if fora <> 0 then
    raise exception 'O Caminho Feitoria Nova tem % parada(s) fora do ar. Nada foi alterado.', fora;
  end if;

  select count(*) into sobraram
    from public.roteiros
   where slug in (
           'caminho-picada-48-alta',
           'caminho-picada-48-baixa',
           'caminho-picada-feijao'
         );

  if sobraram <> 0 then
    raise exception 'Sobraram % rascunho(s) que não estavam vazios; confira antes. Nada foi alterado.', sobraram;
  end if;
end $$;

commit;
