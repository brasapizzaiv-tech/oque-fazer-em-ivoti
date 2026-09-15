-- ============================================================
-- Horario do Memorial da Colonia Japonesa
-- ============================================================
-- Na migration 0004 o Memorial ficou sem horario: o folheto so dizia
-- "aberto diariamente", e inventar horario de um lugar com expediente
-- manda a pessoa numa porta fechada.
--
-- A placa na entrada, visivel na foto que o Rafael tirou, informa:
--
--   Funcionamento
--   . Terca a Sexta:               8h as 12h - 13h as 17h
--   . Sabado, domingo e feriado:  10h as 12h - 13h as 17h
--   Entrada Gratuita
--
-- Segunda-feira fica de fora da placa, ou seja: fechado.
-- Feriado o site nao trata; segue o horario de fim de semana na pratica.
-- ============================================================

delete from public.locais_horarios
where local_id = (select id from public.locais where slug = 'memorial-da-colonia-japonesa');

insert into public.locais_horarios (local_id, dia_semana, abre, fecha)
select l.id, v.dia, v.abre::time, v.fecha::time
from public.locais l
cross join (values
  -- terca a sexta
  (2, '08:00', '12:00'), (2, '13:00', '17:00'),
  (3, '08:00', '12:00'), (3, '13:00', '17:00'),
  (4, '08:00', '12:00'), (4, '13:00', '17:00'),
  (5, '08:00', '12:00'), (5, '13:00', '17:00'),
  -- sabado e domingo
  (6, '10:00', '12:00'), (6, '13:00', '17:00'),
  (0, '10:00', '12:00'), (0, '13:00', '17:00')
) as v(dia, abre, fecha)
where l.slug = 'memorial-da-colonia-japonesa';

-- Agora que o horario e conhecido, sai o aviso de conferir antes de ir.
update public.locais
set descricao = replace(
      descricao,
      'Aberto diariamente, acesso gratuito. Vale confirmar o horário antes de ir.',
      'Entrada gratuita. Fecha às segundas-feiras.'
    )
where slug = 'memorial-da-colonia-japonesa';
