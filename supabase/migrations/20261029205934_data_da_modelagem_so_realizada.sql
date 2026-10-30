-- Data da modelagem piloto só como realização (ADR 0035; enxugar-cartao-e-cadastro, ticket 03). Destrutiva só para dados
-- inventados do desenvolvimento: as datas futuras eram agenda, não registro.

-- Antes de o gatilho existir: apaga as datas futuras. O gatilho de eventos do processo registra cada mudança no histórico.
update public.processos set data_da_modelagem_piloto = null where data_da_modelagem_piloto > private.hoje();

-- Gatilho, e não check: o limite (hoje em Brasília) muda todo dia. A mensagem traz a data recebida e o limite
-- (padrão "motivo:valor" das recusas do banco, lido por src/processos/recusasDoBanco.ts).
create function private.conferir_data_da_modelagem_piloto() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.data_da_modelagem_piloto > private.hoje() then
    raise exception 'modelagem_no_futuro:%:%', new.data_da_modelagem_piloto, private.hoje();
  end if;
  return new;
end $$;

create trigger conferir_data_da_modelagem_piloto before insert or update of data_da_modelagem_piloto on public.processos
  for each row execute function private.conferir_data_da_modelagem_piloto();

-- O cadastro deixa de gravar a data: ela se registra depois, por update, na linha da etapa Modelagem piloto.
revoke insert (data_da_modelagem_piloto) on public.processos from authenticated;
