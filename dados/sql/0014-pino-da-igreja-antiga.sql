-- ============================================================
-- Igreja São Pedro Apóstolo: o pino vai para a igreja antiga
-- ============================================================
-- O texto do lugar fala da Antiga Igreja Matriz (a "Igreja Velha",
-- de 1857, tombada pelo IPHAE), mas o pino estava em cima da igreja
-- nova, a de 1969, que fica a uns 47 metros dali, na avenida.
--
-- A posição nova é a da ficha nº 6 do Inventário do Patrimônio
-- Cultural de Ivoti (2021), e bate com o OpenStreetMap a menos de
-- 3 metros. É a mesma que a parada 14 do passeio do centro usa.
--
-- Só mexe na latitude e na longitude. O endereço fica como está.
-- Pode rodar de novo: o resultado é o mesmo.
-- ============================================================

begin;

update public.locais
   set lat = -29.591369,
       lng = -51.161114
 where slug = 'igreja-sao-pedro-apostolo';

-- Confere antes de valer. Qualquer conta diferente desfaz tudo.
do $$
declare
  certos integer;
begin
  select count(*) into certos
    from public.locais
   where slug = 'igreja-sao-pedro-apostolo'
     and lat = -29.591369
     and lng = -51.161114;

  if certos <> 1 then
    raise exception 'Esperava 1 lugar corrigido; achei %. Nada foi alterado.', certos;
  end if;
end $$;

commit;
