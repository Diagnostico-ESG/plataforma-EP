# Sabatina — publicacao-e-arquivamento (2026-10-22)

Decisões do usuário; o porquê da escolha de publicação está no ADR 0020 e os termos no `CONTEXT.md` (Validação com o setor, Vai para publicação, Não publicado, Registrar publicação, Concluídos, Arquivado). Muda as specs de revisoes-aprovacao e processos-etapas.

## Fatos conferidos no código

- A etapa Publicação já existe: código `publicacao`, opcional, ordem 9, fase VII.
- Hoje o concluído é calculado na view `processos_com_andamento` (obrigatórias resolvidas); como a Aprovação é a última obrigatória, o processo some do Quadro ao concluí-la, mesmo com a Publicação em andamento.
- O Quadro (`src/processos/colunasDoQuadro.ts`) mostra só em andamento e suspensos.
- A planilha pública já conta a fase VI concluída, que equivale a "todos os aprovados".

## Decisões

1. **Nome:** "Revisão pelo setor" passa a "Validação com o setor" na tela, nas mensagens e no catálogo (por migração). O código `revisao_setor` fica. A regra (ADR 0012) não muda.
2. **Escolha de publicação (ADR 0020):** campo próprio no processo (sim, não ou sem resposta), respondido na janela de concluir a Aprovação ("Vai para publicação?"). Com "sim", a janela pede o responsável da Publicação, que entra em andamento. Com "não", a Publicação fica pendente, parada, e o processo vai para Concluídos.
3. **Concluído:** obrigatórias resolvidas e (escolha "não" ou Publicação resolvida).
4. **Publicação não se dispensa mais.** Com a Publicação em andamento, a ação "Não vai mais para publicação", com motivo, muda a escolha para "não", devolve a etapa a pendente e leva o processo a Concluídos.
5. **Arquivado é marca, não situação:** só processo concluído se arquiva; continua concluído para tudo, inclusive planilhas.
6. **Coluna Concluídos:** a última do Quadro, sempre visível (mesmo vazia), com os concluídos não arquivados, em ordem de nome. Cartão não se arrasta para fora dela. Cancelados continuam só na Lista. No agrupamento por responsável, concluídos não aparecem. Arquivar em lote fica fora.
7. **Arquivar e desarquivar:** Administrador ou Integrante do EP, no verso; sem motivo; os dois entram no histórico do processo (quem e quando). Desarquivar devolve a Concluídos. A Lista mostra o selo "Arquivado" e ganha um filtro para mostrar ou esconder arquivados (padrão: mostrar).
8. **Voltar a uma etapa:** arquivado não permite voltar nem mexer em etapas (só Registrar publicação e Desarquivar). Concluído permite voltar como hoje; voltar até a Aprovação ou antes desfaz a aprovação e apaga a escolha de publicação. Voltar à Publicação de um publicado reabre só ela; a escolha continua "sim".
9. **Registrar publicação:** Administrador ou Integrante do EP, em processo não publicado (concluído ou arquivado). Data da publicação com hoje por padrão, editável, nem depois de hoje nem antes da data da Aprovação; nota opcional. A escolha vira "sim", a Publicação vira concluída com essa data e o processo fica onde está. Entra no histórico.
10. **Dados já existentes (só no desenvolvimento):** Publicação concluída ou em andamento → "sim"; dispensada → "não" e a etapa volta a pendente; pendente com Aprovação concluída → "não"; Aprovação não concluída → sem resposta.
11. **Casos de borda:** Publicação desativada no catálogo → a pergunta não aparece e o processo vai direto a Concluídos. Etapa depois da Publicação (hoje nenhuma) → o "não" pula a Publicação e avança para a próxima pendente.
12. **Planilhas:** fase VII de um não publicado sai "Não publicado" e não conta como concluída; substitui a exceção "Dispensada". Rótulo da situação: "Publicado" com a Publicação concluída, "Concluído" com a escolha "não". Arquivado não aparece nas planilhas.
13. **Fase da Publicação:** continua VII.
14. **"Finalizados" no dashboard:** nada na plataforma; a fase VI concluída já conta os aprovados. Trocar o rótulo no Data Studio fica com o usuário, por fora (backlog).
