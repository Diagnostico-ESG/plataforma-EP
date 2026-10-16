-- Formato do identificador do Drive (documentos-versoes, achado da revisão de segurança do /ship). O drive_id entra na
-- montagem de endereços da API do Google, chamada pela função arquivos-no-drive com a conta de serviço, e Administrador e
-- Integrante gravam essa coluna direto pela API do banco. Só letras, números, "_" e "-" (o que a função já exige no
-- pedido): sem isso, "../x" ou "x?param" mudariam o caminho que a conta de serviço chama. A restrição antiga (não vazio)
-- fica; a nova é mais estrita e a cobre.
alter table public.arquivos_da_versao
  add constraint arquivos_drive_id_formato check (drive_id ~ '^[A-Za-z0-9_-]{1,200}$');

alter table public.pastas_no_drive
  add constraint pastas_drive_id_formato check (drive_id ~ '^[A-Za-z0-9_-]{1,200}$');
