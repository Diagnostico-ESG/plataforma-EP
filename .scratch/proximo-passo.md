# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-23 (sessão do /executar-complexo do ticket 23)

- **Funcionalidade:** processos-etapas, ticket 23 "Anotações do processo", na branch `processos-etapas-23` (plano em `.scratch/processos-etapas/plano-23.md`).
- **Feito:** Tarefas 2 a 7 do plano (regras puras, módulo e falsa, gravador, bloco na tela, saída sem perder texto, conferência na tela, desvios). Bateria local verde (188 arquivos, 2.545 testes), lint, typecheck e dependências circulares limpos. O teste de banco `supabase/tests/50_anotacoes_do_processo.test.sql` está no GitHub (branch enviada). A migração `20261023175017_anotacoes_do_processo.sql` está commitada na branch, **sem ser enviada**.
- **Parado porque:** o `gh` não está autenticado nesta máquina (precisa de `gh auth login` ou do botão "Run workflow" no GitHub), então os workflows não puderam ser disparados.
- **O que falta (Tarefa 1, passos 3, 5, 6 e 7):**
  1. "Testes de banco" na branch `processos-etapas-23` (só com o teste enviado): esperado **vermelho** no 50.
  2. `git push` da branch (leva a migração), "Migrar banco de desenvolvimento" com `20261023175017_anotacoes_do_processo.sql`, depois "Testes de banco" de novo: esperado 57 de 57 e todos os arquivos verdes.
  3. `npm run db:types` (vínculo `yclkzyoebpsxmgpbcbus`) e conferir que o diff de `src/types/database.ts` não traz diferença real (os tipos foram escritos à mão); linha da migração em `supabase/AMBIENTES.md`; commit.
  4. Fechar o ticket: merge na `main` (`git switch main`, `git merge`, `git branch -d processos-etapas-23`), linha `Concluído em` no `issues/23-anotacoes-do-processo.md`, itens de `nao-testados.md` em `melhorias-protocolo.md`, push da `main`.
- **Próximo comando depois do 23:** `/polir` (a funcionalidade mexeu na interface) e depois `/ship`. Modelo Sonnet. Retomar com `/executar-complexo` no ticket 23 (ele continua do passo 3 da Tarefa 1) em sessão com o `gh` autenticado.
- **Pendências soltas:** handoff `.scratch/handoff-2026-10-20.md` desatualizado (apagar ou refazer).
