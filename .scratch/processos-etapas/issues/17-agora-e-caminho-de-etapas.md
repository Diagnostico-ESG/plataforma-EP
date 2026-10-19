# 17: Cartão "Agora" e caminho de etapas

**Como resolve a sua parte.** No painel atual, para saber o que fazer é preciso achar a etapa atual no meio do caminho e escolher entre vários botões. Este ticket põe no alto da janela o cartão "Agora", com a etapa atual, quem cuida dela, há quantos dias e um único botão principal, e transforma o caminho de etapas numa lista compacta só de leitura, com o detalhe de cada etapa numa gaveta. As ações da etapa atual saem do caminho e vão para o Agora de uma vez.

**What to build:** na coluna esquerda do verso, o cartão Agora (borda de 2 px em `azul`): "Agora · etapa {n} de {total}", o nome da etapa atual, avatar e nome do responsável, "há {n} dias" e o link "Trocar". Dias na etapa em cinza até 15; a partir de 16, a pílula âmbar "{n} dias nesta etapa". Botão principal [Iniciar {etapa}] na etapa atual pendente (um clique) ou [Concluir {etapa}] em andamento (janela de avanço da parte 2; sem pendente depois, conclui direto). "⋯" do Agora com Dispensar (só na opcional) e Realizada anteriormente, pelas janelas da parte 2. Sem responsável: "Sem responsável" e [Assumir] ao lado do principal, com a trava do autor da parte 2. "Trocar": lista suspensa com "{nome} (você)" primeiro, os demais integrantes ativos e "Ninguém por enquanto" no fim, gravando ao escolher; a falha mostra a mensagem de erro de gravação e mantém o responsável. Suspenso (âmbar claro) e cancelado (cinza claro) com o motivo e [Retomar] como principal, no lugar do aviso atual. Concluído (verde claro) com "Concluído em {data}", a data da última etapa obrigatória resolvida. Consulta: sem botões nem "Trocar", borda cinza, "Com {nome} há {n} dias" ou "Sem responsável". Abaixo, as Etapas em linhas compactas com um sinal por status (concluída, atual, pendente, opcional, dispensada, realizada anteriormente), a data (na atual, "desde {data}") e as iniciais; clicar abre a gaveta, uma por vez, com datas, nota, responsável, [Corrigir datas] e, nas resolvidas anteriores à atual, [Voltar a esta etapa]; nas pendentes depois da atual, o "Trocar" e o [Assumir]; a atual aberta mostra só datas e nota; suspenso ou cancelado, só leitura. Spec: `.scratch/processos-etapas/spec.md` (histórias 112 a 122 e 137; "Interface", "Verso do cartão", itens Agora e Etapas; "Observações", decisões da parte 3; "Decisões de teste", Agora, etapas e funções puras novas).

**Blocked by:** 16 (A janela do verso do cartão).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Funções puras da contagem de dias na etapa, do limite de 15 dias e do "Concluído em" com testes unitários.
- [ ] Agora pendente com [Iniciar {etapa}]; em andamento com [Concluir {etapa}] abrindo a janela de avanço; última etapa concluindo direto.
- [ ] "⋯" do Agora com Dispensar só na opcional e Realizada anteriormente, pelas janelas da parte 2.
- [ ] Sem responsável: "Sem responsável" e [Assumir]; ausente na Revisão interna para o autor da versão mais recente não histórica.
- [ ] "Trocar" com a pessoa da tela primeiro, "(você)", e "Ninguém por enquanto" no fim; grava ao escolher; a falha mostra a mensagem de erro e mantém o responsável.
- [ ] Dias na etapa: número até 15 e a pílula "{n} dias nesta etapa" a partir de 16.
- [ ] Suspenso e cancelado com o motivo e [Retomar]; o aviso antigo de processo suspenso ou cancelado sai.
- [ ] Concluído com "Concluído em {data}".
- [ ] Consulta: o Agora sem botões nem "Trocar", com "Com {nome} há {n} dias".
- [ ] Etapas com o nome acessível de cada status; gaveta uma por vez, abrindo e fechando pelo teclado com o estado anunciado; Corrigir datas e Voltar a esta etapa onde cabem; Trocar e [Assumir] nas pendentes depois da atual; só leitura em suspenso e cancelado.
- [ ] Testes de interface com o aplicativo inteiro cobrindo os itens acima.
- [ ] `[visual]` O Agora é a única coisa acesa da janela: borda de 2 px em `azul` e o único botão principal; na Consulta, borda cinza e sem botões; suspenso em âmbar claro, cancelado em cinza claro e concluído em verde claro.
- [ ] `[visual]` As etapas são linhas compactas e quietas: só o verde de concluída e o azul da atual têm cor; o resto é cinza, com selos neutros para opcional, dispensada e anterior; a gaveta do detalhe abre sem empurrar a janela para fora da tela.
