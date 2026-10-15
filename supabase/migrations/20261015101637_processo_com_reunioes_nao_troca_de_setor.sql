-- Reuniões: o processo de uma reunião é sempre do setor da reunião. A regra já valia ao incluir o processo na reunião
-- e ao trocar o setor da reunião, mas faltava o terceiro caminho: trocar o setor do processo. Achado do /ship.
-- Reclassificar o tipo continua livre; só a troca de setor é recusada, com a contagem de reuniões.
create function private.conferir_processo_sem_reunioes_na_troca_de_setor() returns trigger
language plpgsql set search_path = ''
as $$
declare
  total integer := (select count(*) from public.reunioes_processos where processo_id = old.id);
begin
  if total > 0 then
    raise exception 'processo_com_reunioes_muda_de_setor:%', total;
  end if;
  return new;
end $$;

create trigger conferir_processo_sem_reunioes_na_troca_de_setor before update of setor_id on public.processos
  for each row when (new.setor_id is distinct from old.setor_id)
  execute function private.conferir_processo_sem_reunioes_na_troca_de_setor();

revoke execute on function private.conferir_processo_sem_reunioes_na_troca_de_setor() from public, anon, authenticated;
