# Desvios — login-perfis

Só entradas novas, datadas; as antigas não se editam.

## 2026-10-07 — ticket 02, teste de banco não visto falhando

- **Previsto:** rodar `supabase/tests/04_autorizacoes.test.sql` no SQL Editor antes da migração `20261007214206_autorizar_emails` e vê-lo falhar (TDD).
- **Aconteceu:** a migração foi colada primeiro; o teste rodou só depois e passou (29 de 29). O passo "ver falhar" ficou sem registro.
- **Decisão:** seguir sem reconstruir o passo (o usuário seguiu sem objeção; opção mais simples). As asserções conferem efeitos que só existem com a migração (recusas `email_*` com motivo, eventos com autor, e-mail normalizado, privilégios do visitante), então um teste que passasse sem a migração é improvável.
- **Ordem das tarefas:** o plano punha o banco primeiro; a interface (tarefas 2 a 5) foi feita antes para juntar os passos manuais do SQL Editor numa só ida. Sem efeito no resultado.
