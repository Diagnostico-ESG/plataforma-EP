# 05: Andamento das etapas do processo

**Como resolve a sua parte.** O processo cadastrado precisa andar pelo seu caminho. Este ticket liga as ações das etapas no painel do processo (iniciar, concluir, dispensar e realizada anteriormente), com o banco garantindo que a primeira etapa do processo só começa quando o setor resolveu as dele, que nenhuma etapa pula a anterior e que só uma fica em andamento por vez. O cartão acompanha a etapa atual no Quadro, e quando todas as etapas obrigatórias se resolvem o processo aparece como Concluído e sai do Quadro.

**What to build:** as ações de etapa no painel do processo, reaproveitando as do ticket 02 e a janela de nota; a regra do setor resolvido antes da primeira etapa do processo; o Concluído calculado; o cartão mudando de coluna e saindo do Quadro ao concluir. Spec: `.scratch/processos-etapas/spec.md` (histórias 22 (concluídos), 30 a 37, 44, 57; seções "Interface", "Regras que o banco impõe" e "Regras de estado").

**Blocked by:** 04 (Cadastro de processos e o Quadro).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Testes pgTAP antes da migração (se houver migração): iniciar a primeira etapa do processo com etapa do setor pendente recusado; iniciar a 5 com a 4 pendente recusado; segunda em andamento no processo recusada; dispensar obrigatória recusado; nota obrigatória; a view devolve `concluido` quando todas as obrigatórias estão resolvidas, inclusive com a 9 pendente.
- [ ] Módulo de processos (real e falso) aplica as ações aos andamentos do processo; recusas: "O setor {SIGLA} ainda não resolveu as etapas do setor.", "Já há uma etapa em andamento neste processo: {etapa}.", mais as do ticket 02.
- [ ] Painel: ações na etapa atual ([Iniciar], [Concluir], [Dispensar] só se opcional, [Realizada anteriormente]); etapa atual destacada, resolvidas com ✓, futuras apagadas; pílula "Concluído".
- [ ] Quadro: o cartão muda de coluna depois de cada ação; o processo concluído sai do Quadro.
- [ ] A Consulta não vê as ações.
- [ ] Testes de interface com o aplicativo inteiro: cada ação com sucesso e com falha, cada recusa, a janela de nota, o processo saindo de "Aguardando o setor" quando o setor resolve as etapas, o cartão mudando de coluna e o concluído saindo do Quadro.

Concluído em 2026-10-14 (commit 48b38b3)
