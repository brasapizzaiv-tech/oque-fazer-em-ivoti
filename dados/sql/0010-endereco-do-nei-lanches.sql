-- ============================================================
-- Nei lanches: endereço com maiúscula e bairro com acento
-- ============================================================
-- O cadastro entrou com "avenida presidente lucena" e "concordia",
-- tudo minúsculo e sem acento. É o único lugar publicado assim, e o
-- texto aparece do jeito que está na página do lugar, na etiqueta do
-- bairro na lista e no cartão "Como chegar" do Guia.
--
-- O nome ("Nei lanches") fica como o comerciante escreveu.
-- Pode rodar de novo: o resultado é o mesmo.
-- ============================================================

begin;

update public.locais
   set endereco = 'Avenida Presidente Lucena',
       bairro   = 'Concórdia'
 where slug = 'nei-lanches';

-- Confere antes de valer. Qualquer conta diferente desfaz tudo.
do $$
declare
  certos integer;
begin
  select count(*) into certos
    from public.locais
   where slug = 'nei-lanches'
     and endereco = 'Avenida Presidente Lucena'
     and bairro = 'Concórdia';

  if certos <> 1 then
    raise exception 'Esperava 1 lugar corrigido; achei %. Nada foi alterado.', certos;
  end if;
end $$;

commit;
