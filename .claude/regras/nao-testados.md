# Itens ainda não testados num projeto real — DevFlow v1.9

Como usar: ao terminar um comando, leia o bloco dele e o bloco "Qualquer momento". Para cada item que aconteceu nesta execução e ainda não tem entrada em `.scratch/melhorias-protocolo.md`, acrescente uma entrada com a data, o item, o que era esperado e o que aconteceu. Quem avalia se funcionou sou eu.

O `/status` só lê e não registra nada.

## Qualquer momento

- Regra do `--no-verify` e bloqueio do commit que pula o pre-commit.
- Trava de git ativa dentro do Claude Code (bloqueio de `reset --hard`, checkout de arquivo, `tag -d`, pasta `.git`, evento ilegível), com o `settings.json` na forma `command` + `args`.
- Regra de skill ausente e de skill que recusa ser acionada.
- Handoff em `.scratch/`; troca de sessão com `/status` na retomada; `/cost` por sessão em `custos.md`, com coluna de funcionalidade.
- Leitura de `.claude/regras/banco.md` antes de mexer no banco; conferência do alvo antes de comando de banco.
- Dados reais: pasta `dados-reais/` nunca lida; regra de fixtures; aviso de dado pessoal com a pergunta sobre o claude-mem.
- Sufixo `-2`, `-3` nos marcos; fechamento só em relatório técnico extenso; pasta dos ADRs.

## /projeto

- Partida de uma especificação pronta; fases da especificação no backlog; pergunta sobre registro de leitura; escopo conferido antes das perguntas.

## /setup

- Passo 0 (Node); scaffold em subpasta e cópia sem sobrescrever; `--eslint`; `.npmrc`; typecheck; pre-commit; exclusão de `.claude/worktrees/`; limite de 40 linhas em hooks.
- Passo 7: local e remoto de desenvolvimento; `AMBIENTES.md` com "vínculo atual"; `scripts/gerar-tipos.mjs`; saída do `supabase start` descartada; `login` e `link` rodados por mim; teste do cadastro fechado; nome dos testes de banco (`*.test.sql`: confirmar que `supabase test db` os recolhe); testes de banco pelo `scripts/testar-banco.mjs` contra um projeto Supabase de verdade (item j: conexão pelo "Session pooler", criação da extensão pgTAP, tipos por `--project-id` sem Docker); passo 7 reexecutado depois do setup.
- Linha `setup concluído em`; teste ao vivo da trava.

## /concepcao-livre, /concepcao-premium e /implementar-identidade

- `.scratch/identidade-visual.md` entre a concepção e a implementação; teste-fumaça reescrito; marco `identidade` ao final; `/polir` depois de um redesenho.

## /planejar

- Classificação de tamanho e modo curto; passo "Iniciativa grande" (`wayfinder`) e a dispensa por especificação anexada.
- Conferência de entregas anteriores; linha `Em revisão desde`; nome curto da funcionalidade anotado em `projeto.md`.
- Spec em `.scratch/<funcionalidade>/spec.md`; seção Modelo de dados; tabela "quem pode o quê"; regras de estado; critério `[visual]`.
- Login e perfis na spec (gatilho de perfil, primeiro administrador, usuário desativado, recuperação de senha); arquivos no Storage; regras no banco por gatilho; "Não guarde o que se calcula".
- Amostra anonimizada antes do importador; importador entrando como administrador.

## /executar-simples e /executar-complexo

- TDD de políticas de RLS; teste `00_rls_ligada`; migração aplicada com `db push` no remoto de desenvolvimento; migração já enviada ao remoto corrigida por migração nova.
- Gatilho que cria a linha de perfil; função auxiliar das políticas; testes por perfil; views com `security_invoker`; bucket privado e URL assinada.
- Edge Function: conferência do chamador, decisão testada no Vitest, publicação no projeto de desenvolvimento.
- Branch comum no `/executar-complexo`; retomada com a branch aberta; `plano-<número>.md`; linha `Concluído em` nos tickets e `Implementado em` na spec.

## /polir

- Testes, commit e registro dos achados em `desvios.md` depois do polimento.

## /ship

- Conferência de entregas anteriores; marca de entrega e marca com ressalva; entrada por bug ou ajuste.
- ADR de dependência de produção; `/security-review` e revisão de reserva; "verificado manualmente".
- Passo 7: checagens de banco, de perfis e de Storage.

## /demanda, /voltar e /status

- `/demanda`: perguntas, classificação, funcionalidade pequena, caminho de bug (marco, `code-review`, relatório, aviso de produção).
- `/voltar`: volta com `git revert`, registros de `.scratch/` preservados, migração desfeita, migração já publicada, dependência com `git show`.
- `/status`: retomada numa sessão nova; avisos de vínculo em produção, backup e revisão.

## Roteiros de produção do /ship

- Revisão de segurança para produção (com e sem banco) e inventário de dados pessoais; trava da primeira publicação.
- Publicar no banco de produção: painel conferido antes do `db push`, só funcionalidades entregues, vínculo feito por mim, backup, `db push`, funções, volta ao desenvolvimento, primeiro administrador, retomada de publicação interrompida.
- Publicar o site: build com variáveis de produção, busca em `dist/`.
- Backup em três arquivos e teste de restauração num projeto separado.
