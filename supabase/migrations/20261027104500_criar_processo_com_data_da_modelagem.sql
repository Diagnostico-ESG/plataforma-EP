-- Bug de 2026-10-27: o cadastro de processo envia data_da_modelagem_piloto na criação (nula quando o campo está vazio), mas a coluna
-- (antes data_da_reuniao) só recebeu permissão de alterar; o banco recusava toda criação com 42501. Não destrutiva.
grant insert (data_da_modelagem_piloto) on public.processos to authenticated;
