-- Importação dos dados atuais, ajuste de 2026-11-06 (ADR 0045, revoga a Q20 da sabatina). Não destrutiva: o processo
-- importado em Concluídos deixa de entrar tirado do Quadro e segue a regra de todo concluído (fica na coluna até alguém
-- tirar ou até completar 30 dias em Concluídos, contados da importação). Igual à da migração importar_processo, sem a
-- chamada a gravar_tirada_do_quadro; create or replace mantém as permissões já dadas.
create or replace function private.importar_processo(p_setor text, p_macroprocesso text, p_nome text, p_etapa text,
  p_data_da_publicacao date, p_data_da_modelagem_piloto date, p_anotacoes text) returns text
language plpgsql security definer set search_path = ''
as $$
declare
  v_etapa public.etapas;
  v_setor uuid;
  v_processo public.processos;
begin
  if not (private.perfil_atual() = 'administrador' and private.usuario_ativo()) then
    raise exception 'sem permissão para importar' using errcode = '42501';
  end if;
  select * into v_etapa from public.etapas where codigo = p_etapa and ativa;
  if not found then
    raise exception 'etapa_invalida:%', p_etapa;
  end if;
  v_setor := (select id from public.setores where upper(sigla) = upper(btrim(p_setor)));
  if exists (select 1 from public.processos where setor_id = v_setor and lower(nome) = lower(btrim(p_nome))) then
    return 'ja_existia';
  end if;
  perform set_config('ep.importando_etapa', v_etapa.codigo, true);
  insert into public.processos (setor_id, macroprocesso_id, nome, publicado_em, data_da_modelagem_piloto, anotacoes)
  values (private.setor_da_importacao(p_setor), private.macroprocesso_da_importacao(p_macroprocesso), p_nome,
    p_data_da_publicacao, p_data_da_modelagem_piloto, p_anotacoes)
  returning * into v_processo;
  perform private.registrar_importacao(v_processo, v_etapa);
  perform set_config('ep.importando_etapa', '', true);
  return 'criado';
end $$;
