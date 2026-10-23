# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-23 (sessão do /executar-complexo do ticket 23)

- **Funcionalidade:** processos-etapas, mudança "Anotações do processo". O ticket 23 (o único) está concluído e integrado na `main` (commit `c122f13`): banco aplicado no desenvolvimento, "Testes de banco" com 46 de 46 arquivos verdes (o 50 com 57 de 57), bateria local verde, tela conferida na vitrine.
- **Próximo comando:** `/polir` (a funcionalidade mexeu na interface), em Sonnet, numa sessão nova; depois `/ship`.
- **Pendências soltas (do usuário):** apagar a branch `tmp-vermelho-23` (remota e local; a trava de git bloqueou a exclusão) e a branch `processos-etapas-23` (já integrada; o `git branch -d` recusou porque a remota estava um commit atrás). Handoff `.scratch/handoff-2026-10-20.md` desatualizado (apagar ou refazer).
