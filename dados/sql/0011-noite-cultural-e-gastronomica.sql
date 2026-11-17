-- ============================================================
-- Noite Cultural e Gastronômica — Colônia Japonesa
-- ============================================================
-- Do anúncio da Prefeitura de Ivoti no Instagram, de 17/11/2026.
--
-- Sábado, 28 de novembro de 2026, das 17h às 22h, na Colônia Japonesa.
-- Sushi, pratos típicos, sobremesa, hambúrguer e apresentações de taiko
-- e kendo. Realização: Prefeitura de Ivoti e Feira na Colônia Japonesa.
-- Apoio: Escola da Colônia Japonesa.
--
-- O anúncio diz "Colônia Japonesa – Ivoti", sem rua. O evento fica
-- ligado ao Memorial da Colônia Japonesa, que é a página da colônia no
-- guia e dá o mapa a quem toca no evento. Se a noite for em outro ponto
-- da colônia, basta trocar o texto do local no admin.
--
-- Sem imagem: a arte é da Prefeitura e não foi pedida.
-- O anúncio não fala em ingresso, então o texto também não fala.
--
-- Pode rodar mais de uma vez sem duplicar.
-- ============================================================

begin;

delete from public.eventos
 where titulo = 'Noite Cultural e Gastronômica'
   and inicio >= timestamptz '2026-11-28 00:00-03'
   and inicio <  timestamptz '2026-11-29 00:00-03';

insert into public.eventos
  (local_id, titulo, descricao, inicio, fim, local_texto, status)
values (
  (select id from public.locais where slug = 'memorial-da-colonia-japonesa'),
  'Noite Cultural e Gastronômica',
  'Uma noite de comida e cultura japonesa na Colônia Japonesa de Ivoti, das 17h às 22h. Tem sushi, pratos típicos, sobremesa e hambúrguer, além de apresentações de taiko, os tambores japoneses, e de kendo. Realização da Prefeitura de Ivoti e da Feira na Colônia Japonesa, com apoio da Escola da Colônia Japonesa.',
  timestamptz '2026-11-28 17:00-03',
  timestamptz '2026-11-28 22:00-03',
  'Colônia Japonesa',
  'publicado'
);

-- Confere antes de valer. Qualquer conta diferente desfaz tudo.
do $$
declare
  achados integer;
begin
  select count(*) into achados
    from public.eventos
   where titulo = 'Noite Cultural e Gastronômica'
     and inicio = timestamptz '2026-11-28 17:00-03'
     and local_id is not null
     and status = 'publicado';

  if achados <> 1 then
    raise exception 'Esperava 1 evento ligado ao Memorial; achei %. Nada foi alterado.', achados;
  end if;
end $$;

commit;
