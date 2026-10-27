-- Cor do setor (visual-do-cartao, ticket 02, ADR 0030): número da cor numa paleta fixa de 30 cores.
-- Os tons ficam na tela (src/cadastros/corDoSetor.ts); o banco só conhece o número.

alter table public.setores add column cor integer;

-- Setores existentes: pela ordem alfabética da sigla (1, 2, 3...; acima de 30 recomeça em 1).
-- A cor não faz parte do antes/depois dos eventos de setor, então o preenchimento não gera eventos.
update public.setores s set cor = ((o.posicao - 1) % 30) + 1
  from (select id, row_number() over (order by sigla) as posicao from public.setores) o where o.id = s.id;

alter table public.setores alter column cor set not null;
alter table public.setores add constraint setores_cor_faixa check (cor between 1 and 30);

-- Setor novo sem cor recebe a primeira que nenhum setor (ativo ou inativo) usa; com as 30 em uso, a 1.
-- Duas criações simultâneas podem receber a mesma cor: aceito, a repetição é permitida.
create function private.atribuir_cor_do_setor() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.cor is null then
    new.cor := coalesce((select n from generate_series(1, 30) as n
      where not exists (select 1 from public.setores s where s.cor = n) order by n limit 1), 1);
  end if;
  return new;
end $$;

revoke execute on function private.atribuir_cor_do_setor() from public, anon, authenticated;

create trigger atribuir_cor_do_setor before insert on public.setores
  for each row execute function private.atribuir_cor_do_setor();

-- Quem já informa os outros campos informa e altera a cor (a RLS decide quem).
grant insert (cor) on public.setores to authenticated;
grant update (cor) on public.setores to authenticated;
