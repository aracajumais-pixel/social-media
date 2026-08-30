-- Adiciona colunas para guardar o ID e a URL de cada subpasta do Drive,
-- em vez de só a pasta raiz do cliente (google_drive_folder_url).

alter table public.clients
  add column if not exists drive_rascunhos_folder_id text,
  add column if not exists drive_rascunhos_folder_url text,
  add column if not exists drive_aprovados_folder_id text,
  add column if not exists drive_aprovados_folder_url text,
  add column if not exists drive_inspiracoes_folder_id text,
  add column if not exists drive_inspiracoes_folder_url text,
  add column if not exists drive_recibos_folder_id text,
  add column if not exists drive_recibos_folder_url text;
