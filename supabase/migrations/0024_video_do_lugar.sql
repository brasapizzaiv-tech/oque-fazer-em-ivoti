-- ============================================================
-- O video do lugar
-- ============================================================
-- A implantacao completa inclui um video curto do estabelecimento. A
-- pagina do lugar so sabia mostrar foto.
--
-- Guarda o LINK de um video ja publicado no YouTube ou no Instagram, e
-- nao o arquivo: video de celular pesa 100 MB por minuto e sai num
-- formato que metade dos navegadores nao toca. As duas redes convertem e
-- entregam na qualidade que a conexao aguenta.
-- ============================================================

alter table public.locais
  add column if not exists video_url text;

comment on column public.locais.video_url is
  'Link de um video do YouTube ou do Instagram. A pagina monta o quadro a partir do codigo do video.';
