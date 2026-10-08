# Desvios — login-perfis

Só entradas novas, datadas; as antigas não se editam.

## 2026-10-07 — ticket 02, teste de banco não visto falhando

- **Previsto:** rodar `supabase/tests/04_autorizacoes.test.sql` no SQL Editor antes da migração `20261007214206_autorizar_emails` e vê-lo falhar (TDD).
- **Aconteceu:** a migração foi colada primeiro; o teste rodou só depois e passou (29 de 29). O passo "ver falhar" ficou sem registro.
- **Decisão:** seguir sem reconstruir o passo (o usuário seguiu sem objeção; opção mais simples). As asserções conferem efeitos que só existem com a migração (recusas `email_*` com motivo, eventos com autor, e-mail normalizado, privilégios do visitante), então um teste que passasse sem a migração é improvável.
- **Ordem das tarefas:** o plano punha o banco primeiro; a interface (tarefas 2 a 5) foi feita antes para juntar os passos manuais do SQL Editor numa só ida. Sem efeito no resultado.

## 2026-10-08 — ticket 03, ordem das tarefas e teste instável corrigido no caminho

- **Ordem das tarefas:** o plano punha o banco primeiro; o teste de banco `05_gerir_usuarios.test.sql` foi gravado primeiro, a interface (tarefas 2 a 4) veio em seguida e os passos manuais do SQL Editor ficaram juntos no fim. Desta vez o teste foi visto falhando antes da migração (26 de 40 `not ok`) e passando depois (40 de 40); 02, 03 e 04 continuaram passando.
- **Teste instável (fora do escopo do ticket, corrigido nele):** a falha intermitente de "Excluir" registrada no handoff de 2026-10-07 voltou na tarefa 3 e foi reproduzida (1 de 4 rodadas frias). Causa: os testes de tela esperavam `findByRole('table')`, mas a tabela já existe no estado carregando (`aria-busy`); numa rodada lenta, procuravam o botão antes de as linhas chegarem. Correção: esperar `findByRole('table', { busy: false })` em `App.administracao.test.tsx` e `App.autorizacoes.test.tsx` (commit próprio, 914f393); 6 de 6 rodadas frias passaram depois. Feito no ticket porque bloqueava os commits (o pre-commit roda os testes) e o arquivo de teste novo usa o mesmo padrão.
- **Teste na tela:** feito pelo usuário com a própria conta (único usuário real no dev): corrigir o próprio nome, o nome mantido depois de sair e entrar, as duas travas "a si mesmo" e a aparência. Desativar e reativar outra pessoa e a trava do último administrador ficam provados só pelos testes de banco e de tela (não há segunda conta real; ADR 0001).

## 2026-10-08 — ticket 04, coluna "Alvo", ordem das tarefas e teste instável da entrada

- **Coluna "Alvo" (sobre quem foi a mudança):** não está escrita no ticket nem na spec (história 38 pede data e hora, quem fez, a ação e o antes e depois). Acrescentada porque, sem ela, "Desativou" não responde a uma auditoria: e-mail para eventos de autorização, nome atual para eventos de usuário (o id, se o usuário não for achado). Decisão de execução registrada no `plano-04.md`; o usuário conferiu a tela sem objeção.
- **Histórico em lista, não em tabela:** a spec fala em "tabela compacta" para Administração > Usuários; o histórico ficou numa lista ordenada (`<ol>`) com a mesma aparência compacta. Uma segunda tabela na área confundiria os testes que buscam a tabela de usuários, e a lista ordenada já diz que a ordem importa.
- **Ordem das tarefas:** como nos tickets 02 e 03, os arquivos do banco foram gravados primeiro, a interface (tarefas 2 a 4) veio em seguida e os passos no SQL Editor ficaram juntos no fim. O teste `06_historico.test.sql` foi visto falhando antes da migração (17 de 25 `not ok`) e passando depois (25 de 25); 02, 03, 04 e 05 continuaram passando.
- **Teste instável da entrada (fora do escopo, corrigido no ticket):** o primeiro commit da branch foi barrado pelo pre-commit com `App.entrada.test.tsx` falhando ("o botão chama o Google": 0 chamadas). Causa, a mesma do teste corrigido no ticket 03: o botão "Entrar" já existe, desligado, enquanto o acesso é conferido, e numa rodada lenta o clique caía nele. Correção: esperar o botão ligado antes de clicar; 4 de 4 rodadas frias passaram. O plano foi junto no mesmo commit (06ab39c), porque tinha ficado preparado da tentativa barrada.
- **Arquivo de teste esvaziado por engano:** o usuário esvaziou `supabase/tests/02_login_barreira.test.sql` ao copiá-lo; o conteúdo foi recuperado da versão comitada (`git show HEAD:…`), sem perda.
- **Achado fora do escopo:** `usuarios`, `usuarios_emails` e `autorizacoes` aceitam `truncate` de `authenticated` (e as duas primeiras, de `anon`). Sem caminho pela API (o PostgREST não oferece `truncate`); registrado no `backlog.md` para o `/demanda` antes do `/ship`.
