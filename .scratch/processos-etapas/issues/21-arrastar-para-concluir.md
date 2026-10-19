# 21: Arrastar o cartão para concluir a etapa

**Como resolve a sua parte.** Hoje, para concluir uma etapa, é preciso abrir o processo e clicar em [Concluir] no Agora. Este ticket deixa a pessoa arrastar o cartão até a coluna para onde o processo vai e soltar ali: abre a mesma janela "Quem fica com a próxima etapa?", e confirmar conclui e avança como no verso. Só a coluna certa acende durante o arrastar, e soltar fora dela não faz nada além de explicar onde soltar.

**What to build:** arrastar nativo do navegador, sem biblioteca. Cartão arrastável só para Administrador e Integrante, com a etapa atual em andamento, processo em andamento e etapa pendente depois da atual (não no suspenso, na etapa pendente, na última etapa nem para a Consulta). Coluna de destino: a da primeira etapa pendente depois da atual, calculada pelo caminho trazido no ticket 20; só ela ganha o realce (borda tracejada azul) durante o arrastar. Soltar no destino abre a janela de avanço da parte 2 (as mesmas opções, a opção marcada e a trava do autor) e confirmar grava pela função de avanço que já existe; Esc ou [Cancelar] não grava. Soltar em outra coluna devolve o cartão com o aviso "Solte o cartão na coluna {etapa}.". Ao confirmar, o Quadro recarrega; a falha mostra a mensagem de erro de gravação e nada muda. O cartão continua link (clique e Enter abrem o verso). Spec: `.scratch/processos-etapas/spec.md` (histórias 155 a 163; "Interface", Quadro, item Arrastar para concluir; "Decisões de teste", arrastar e "Arrastar nos testes"; "Observações", parte 4).

**Blocked by:** 20 (A barra de progresso e os selos do cartão do Quadro).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Função pura da coluna de destino (ou nenhuma) com testes unitários, inclusive quando a etapa vizinha já está resolvida.
- [ ] O cartão é arrastável só nos casos permitidos; não no suspenso, na etapa pendente, na última etapa nem para a Consulta.
- [ ] Durante o arrastar, só a coluna de destino recebe o realce.
- [ ] Soltar no destino abre a janela de avanço com o título dela; confirmar move o cartão para a coluna nova.
- [ ] Esc e [Cancelar] deixam tudo como estava.
- [ ] Soltar em outra coluna mostra "Solte o cartão na coluna {etapa}." e não grava.
- [ ] A falha de gravação mostra a mensagem e nada muda.
- [ ] Clique e Enter no cartão continuam abrindo o verso.
- [ ] Testes de interface com o aplicativo inteiro, disparando os eventos nativos de arrastar e soltar, cobrindo os itens acima.
- [ ] `[visual]` Durante o arrastar, só a coluna de destino ganha a borda tracejada azul; o cartão arrastado fica levemente apagado no lugar de origem.

Concluído em 2026-10-19 (commit ce858dc)
