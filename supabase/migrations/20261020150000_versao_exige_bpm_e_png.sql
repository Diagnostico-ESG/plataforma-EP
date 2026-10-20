-- documentos-versoes, mudança de 2026-10-20 (ADR 0016): a versão nova exige o .bpm e o .png; o .bpmn fica opcional, e a
-- versão completa (trava da Revisão pelo setor e da Aprovação, ADR 0009) passa a ser .bpm, .png e relatório.
-- Não destrutiva: recria duas funções (create or replace mantém dono e concessões). O gatilho só age na inclusão, então
-- nenhuma versão já gravada é revista. O horário do nome vem depois da migração do fuso (20261020143000), escolhida à mão.

-- A nova tem .bpm e .png; a histórica, o .bpm ou o par .bpmn e .png (o relatório é opcional nas duas). Conferido no
-- fim da gravação (restrição adiada), porque a versão entra antes dos arquivos.
create or replace function private.conferir_arquivos_da_versao() returns trigger
language plpgsql set search_path = ''
as $$
declare
  papeis public.papel_do_arquivo[] := array(select papel from public.arquivos_da_versao where versao_id = new.id);
begin
  if new.historica then
    if not (papeis @> array['bpm']::public.papel_do_arquivo[] or papeis @> array['bpmn', 'png']::public.papel_do_arquivo[]) then
      raise exception 'historica_sem_arquivo_de_fluxograma';
    end if;
  elsif not papeis @> array['bpm', 'png']::public.papel_do_arquivo[] then
    raise exception 'versao_sem_bpm_e_png';
  end if;
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- Os papéis que a versão completa exige e ela ainda não tem, na ordem em que a frase os lista.
create or replace function private.papeis_que_faltam(p_versao uuid) returns text[]
language sql stable set search_path = ''
as $$
  select coalesce(array_agg(exigido.papel order by exigido.ordem), '{}')
  from (values ('bpm', 1), ('png', 2), ('relatorio', 3)) as exigido (papel, ordem)
  where not exists (
    select 1 from public.arquivos_da_versao a where a.versao_id = p_versao and a.papel::text = exigido.papel) $$;
