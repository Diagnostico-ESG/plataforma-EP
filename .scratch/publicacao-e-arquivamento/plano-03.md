# Plano do ticket 03 — Planilhas com "Não publicado"

> Execução com `superpowers:executing-plans`, na branch `publicacao-e-arquivamento-03`. Marque `- [x]` ao fim de cada passo.

**Ticket:** `.scratch/publicacao-e-arquivamento/issues/03-planilhas-com-nao-publicado.md` (o "o que construir" e os critérios de aceite estão lá; este plano só ordena a execução).
**Spec:** `.scratch/publicacao-e-arquivamento/spec.md` (histórias 38 a 40; Modelo de dados, "Storage, Drive e Edge Functions"; Decisões de teste).

## Regras de `.claude/regras/banco.md` que valem aqui

- Alvo conferido: `supabase/AMBIENTES.md` (vínculo atual `yclkzyoebpsxmgpbcbus`, desenvolvimento).
- Teste de banco antes da migração; migração criada com `npx supabase migration new`; migração, teste e tipos no mesmo commit.
- `private.montar_pacote_das_planilhas` continua `security definer`, `search_path` vazio, sem execução para `anon`/`authenticated` (teste 44 e 46 provam). A view continua `security_invoker = true`.
- Pacote sem nome nem e-mail de usuário: só entra o campo `vai_para_publicacao` (sim/não/sem resposta), que não é dado pessoal.
- Testes de banco e migração pelos workflows do GitHub ("Testes de banco" e "Migrar banco de desenvolvimento"), na branch, conforme "Ajustes deste Projeto". `git push` sem `--force`.
- A republicação da função `planilhas-dos-dashboards` e a conferência pela aba Planilhas são do usuário (fora da sessão).

## Desenho

- **Pacote:** cada processo ganha `'vai_para_publicacao', p.vai_para_publicacao` (jsonb `true`/`false`/`null`). `concluido` já vem de `p.situacao = 'concluido'`, que na view vale também para o arquivado (arquivar não muda `situacao`), então "arquivado conta como concluído" já vale; o teste prova.
- **`planilhasPacote.ts`:** `ProcessoDoPacote.vai_para_publicacao: boolean | null`; regra nova `booleanoOuNulo` (`'booleano ou nulo'`).
- **`planilhasFases.ts`:** `SituacaoDaFase` troca `'Dispensada'` por `'Não publicado'`. `situacaoDasFases(etapas, andamentos, vaiParaPublicacao = null)`: na fase VII com etapas e escolha `false`, a situação é `'Não publicado'` (sem data), antes da regra de resolvidas. Fora isso, fase toda resolvida é `'Concluída'` (a exceção da dispensa sai; a Publicação não se dispensa mais).
- **`planilhasProcesso.ts`:** `analisarProcessos` passa `processo.vai_para_publicacao` a `situacaoDasFases`. `rotuloDoProcesso` não muda: VII concluída → "Publicado"; senão concluído → "Concluído" (cobre "não" e arquivado). `faseAtual` já ignora 'Não publicado' (não está nas abertas).
- **`planilhasPublica.ts`:** não muda (conta só 'Concluída'); ganha teste.
- **Exemplos e cenário:** `processoDe` ganha `vai_para_publicacao: null`; o cenário troca o "Sem publicacao" (publicação dispensada) por "Nao publicado" (escolha `false`, Publicação pendente) e ganha "Arquivado" (concluído, publicado; o pacote não traz o arquivamento, o teste prova que conta como concluído).

## Tarefas

### Tarefa 1 — Banco: pacote traz a escolha

- [x] Teste `supabase/tests/44_pacote_das_planilhas.test.sql` antes da migração: `plan(31)` → novo total; na preparação, mais dois processos (`T44 Nao Publicado` com `vai_para_publicacao = false` e Publicação pendente, e `T44 Arquivado` concluído com `arquivado_em` preenchido pelo dono); asserções: o pacote traz `vai_para_publicacao` `false` do não publicado, `null` do comum e `true` de um com escolha "sim"; o arquivado vai com `concluido = true`; a lista de chaves do processo ganha `vai_para_publicacao`.
- [x] `npx supabase migration new pacote_com_escolha_de_publicacao`; `create or replace function private.montar_pacote_das_planilhas()` igual à anterior com o campo novo; manter o `revoke execute`.
- [x] `npm run db:types` (a assinatura não muda; conferir que o diff de `src/types/database.ts` é vazio) e commit de migração + teste.
- [x] Push da branch e disparo do "Testes de banco" (aplicação da migração no desenvolvimento: workflow "Migrar banco de desenvolvimento" na branch, antes do teste de banco, como no ticket 02); ler o resultado.

### Tarefa 2 — Funções puras (Vitest, em `supabase/functions/_shared/`)

- [x] Testes que falham: `planilhasPacote.test.ts` (campo aceito `true`/`false`/`null`, recusado texto, com a frase "esperado booleano ou nulo, recebido string"); `planilhasFases.test.ts` (VII com escolha `false` e Publicação pendente → 'Não publicado', sem data; escolha `false` não afeta a fase VI; escolha `true`/`null` com Publicação concluída → 'Concluída'; trocar o teste da "Dispensada" por: publicação dispensada, sem escolha, conta 'Concluída'); `planilhasInterna.test.ts` (fase VII do não publicado 'Não publicado' e data vazia; rótulo 'Concluído' para o não publicado e para o arquivado; 'Publicado' com a Publicação concluída, inclusive a registrada depois com escolha `true`); `planilhasPublica.test.ts` (a fase VII não conta o não publicado e conta o publicado).
- [x] Implementar os desenhos acima em `planilhasPacote.ts`, `planilhasFases.ts`, `planilhasProcesso.ts`, `planilhasExemplos.ts`, `planilhasCenario.ts`; ajustar os testes existentes do cenário (contagens e linha 'Sem publicacao').
- [x] `npm test`, `npm run lint`, `npm run typecheck`, `npm run check:circular` passam; commit.

### Tarefa 3 — Documentação e fechamento

- [x] `docs/manutencao/06-planilhas-e-dashboards.md` (linha de "Situação de cada fase") e `docs/planilhas-publicar-a-funcao.md` se citarem a "Dispensada": trocar por "Não publicado" e lembrar a republicação. `GLOSSARIO.md`/`CONTEXT.md` só se citarem "Dispensada" nas planilhas.
- [x] Commit; entregar ao usuário a lista do que é dele: republicar `planilhas-dos-dashboards` no desenvolvimento e pedir uma atualização pela aba Planilhas (critério final do ticket).
