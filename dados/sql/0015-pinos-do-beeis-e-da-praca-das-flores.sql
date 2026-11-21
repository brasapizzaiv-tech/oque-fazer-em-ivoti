-- ============================================================
-- Pinos: Beeis Burger e Brasa ganha o seu, Praça das Flores acerta
-- ============================================================
-- Em 21/11/2026 conferi os 17 lugares publicados contra o
-- OpenStreetMap e o Google Maps. Quinze estavam no lugar. Dois não:
--
-- 1. Beeis Burger e Brasa não tinha pino nenhum. Aparecia nas
--    listas, mas não no mapa, e o Guia não sabia a que distância
--    ele fica dos outros lugares. A posição é a do Google Maps para
--    o mesmo endereço do cadastro (Av. Presidente Lucena, 618,
--    Vista Alegre).
--
-- 2. A Praça das Flores estava com a coordenada arredondada, a uns
--    27 metros do ponto certo. Vai para a posição do Google Maps.
--
-- Só mexe na latitude e na longitude.
-- Pode rodar de novo: o resultado é o mesmo.
-- ============================================================

begin;

update public.locais
   set lat = -29.618772,
       lng = -51.165037
 where slug = 'beeis-burger-e-brasa';

update public.locais
   set lat = -29.606065,
       lng = -51.158636
 where slug = 'praca-das-flores';

-- Confere antes de valer. Qualquer conta diferente desfaz tudo.
do $$
declare
  certos   integer;
  sem_pino integer;
begin
  select count(*) into certos
    from public.locais
   where (slug = 'beeis-burger-e-brasa' and lat = -29.618772 and lng = -51.165037)
      or (slug = 'praca-das-flores'     and lat = -29.606065 and lng = -51.158636);

  if certos <> 2 then
    raise exception 'Esperava 2 lugares corrigidos; achei %. Nada foi alterado.', certos;
  end if;

  select count(*) into sem_pino
    from public.locais
   where status = 'publicado' and (lat is null or lng is null);

  if sem_pino <> 0 then
    raise exception 'Ainda há % lugar(es) publicado(s) sem pino. Nada foi alterado.', sem_pino;
  end if;
end $$;

commit;
