# Sabatina de revisoes-aprovacao (2026-10-16)

Decisões da sabatina (`grill-with-docs`), para o `to-spec`. Os termos estão no `CONTEXT.md` (seção Revisões e aprovação).

## Rodada 1

- **Conclusão das etapas (Q1):** o "Concluir" continua manual e é o único jeito de concluir, mas o banco recusa concluir a etapa 6 sem revisão registrada, a 7 sem rodada "aprovada" e a 8 sem aprovação com E-protocolo. Registrar não muda etapa (mantém o ADR 0006).
- **Capturar (Q2):** botão "Capturar" nas etapas 6, 7 e 8 enquanto estão sem responsável; o seletor de responsável de hoje continua valendo. Na etapa 6, o banco recusa como responsável o autor da versão revisada.
- **Autor que não revisa (Q3):** a versão revisada é a última versão do processo quando a revisão é registrada; o revisor não pode ser o autor dela. Quem substituiu um arquivo não conta.
- **Revisão interna (Q4):** registra versão revisada, revisor, data, resultado ("sem alteração" ou "corrigida"), a versão nova do revisor quando "corrigida", o escopo (fluxograma, relatório ou ambos) só quando "corrigida", e comentário opcional. Na correção, o revisor envia antes a versão nova pela seção Versões e depois registra a revisão escolhendo-a.
- **Versão completa (Q5):** o envio da rodada exige versão com .bpmn, .png e relatório; o banco recusa se faltar.
- **Rodada (Q6):** dois momentos. Envio: data, versão, e-mail. Resposta: data, resultado (aprovada, ajustes solicitados, sem resposta), e-mail. Com ajustes, o EP envia versão nova pela seção Versões, ainda na etapa 7, e abre a rodada seguinte; nova revisão interna só pelo "voltar a etapa". Uma rodada aberta por vez.
- **E-mails (Q7):** os dois opcionais (escolha do usuário; a recomendação era envio obrigatório). Motivo: a aprovação do setor pode acontecer pessoalmente, antes do E-protocolo.
- **Aprovação (Q8):** número do E-protocolo obrigatório, em texto livre (sem espaços nas pontas); link opcional; data; quem registrou. Só depois de uma rodada "aprovada"; a versão aprovada é a da última rodada aprovada. Uma por processo.
- **Quem baixa os e-mails (Q9):** Administrador e Integrante; Consulta vê datas e resultado, mas não baixa os .eml.
- **Tela (Q10):** seção "Revisão e aprovação" no painel do processo, abaixo de Versões, com revisão interna, rodadas e aprovação; "Capturar" na linha da etapa. Fila de revisão fica para o Dashboard (backlog).
- **Catálogo (Q11):** as etapas `revisao_interna`, `revisao_setor` e `aprovacao_setor` ficam protegidas: podem ser renomeadas e movidas, não desativadas nem excluídas.

## Rodada 2 (substitui o que a rodada 1 dizia nos pontos abaixo)

- **E-mails (Q19, substitui Q7 e Q9):** a plataforma não guarda e-mails. A formalização fica no E-protocolo e o histórico, nas caixas de e-mail (ADR 0010). A rodada registra: número, versão enviada, data de envio, data de resposta, resultado e observação opcional. Esta funcionalidade não mexe no Drive.
- **Travas (Q12b, ajusta Q1):**
  - etapa 6: revisão da versão mais recente (uma revisão "corrigida" cobre a versão nova do revisor);
  - etapa 7: ao menos uma rodada respondida "aprovada" ou "ajustes solicitados" e nenhuma aberta. Com ajuste pequeno, o EP faz a versão nova e conclui a 7 sem reenviar ao setor, que vê a versão final no E-protocolo;
  - etapa 8: aprovação registrada.
- **Versão aprovada (Q8b, ajusta Q8):** a mais recente do processo quando a aprovação é registrada, completa (.bpmn, .png e relatório). Exige a etapa 7 com rodada respondida (aprovada ou ajustes), não mais "a última rodada aprovada".
- **Revisão "corrigida":** a versão nova é do próprio revisor e é mais recente que a revisada.
- **Voltar (Q13):** nada se apaga; registros ficam listados com a versão de cada um; a numeração das rodadas continua; não se volta para antes da etapa 8 com aprovação registrada sem antes excluí-la.
- **Corrigir registros (Q14):** edita-se datas, comentário, escopo, resultado da resposta, observação, número e link do E-protocolo; versão e revisor não se editam. Exclui-se só o registro mais recente de cada tipo, e só se nada depender dele (não se exclui a rodada que a aprovação usa, nem a revisão com a etapa 6 concluída). Tudo no histórico com antes e depois. Administrador e Integrante.
- **Quem e quando (Q15):** Administrador e Integrante registram; Consulta só vê. O revisor é quem registra a revisão. Só com a etapa correspondente em andamento e o processo em andamento (suspenso ou cancelado congela).
- **Situação na etapa 7 (Q16):** "pronto para envio" (nenhuma rodada aberta) e "com o setor" (rodada aberta), calculadas, nunca gravadas.
- **Datas (Q17):** só data; nunca no futuro; envio da rodada no dia da revisão ou depois; resposta no dia do envio ou depois; aprovação no dia da última resposta de rodada ou depois. Recusa com as datas na frase.
- **Substituição (Q18b):** recusada em versão aprovada; em versão que foi a uma rodada continua permitida. O Drive guarda o conteúdo substituído por 30 dias em "Gerenciar versões" (ADR 0011).
- Subprocesso e reclassificação: cada item tem as próprias revisões, rodadas e aprovação, que ficam com ele na reclassificação (regras 11 e 13 da especificação).

## Divergências da especificação

- `RodadaRevisaoSetor` previa e-mails de envio e de resposta anexados: saíram (ADR 0010).
- `RevisaoInterna` previa resultado "aprovado | ajustes": virou "sem alteração | corrigida", com o escopo só na correção.
- A seção 3, item 7, já previa a situação calculada; mantida.

## Revisão de 2026-10-17 (no `/to-tickets`; substitui o que as rodadas 1 e 2 diziam nos pontos abaixo)

- **Rodadas (substitui Q6, Q8b, Q12b na etapa 7, Q13 na numeração, Q16 e Q17 nas datas de envio e resposta):** saem. A revisão pelo setor é só a etapa; o ciclo "vai, volta, revisa, vai de novo" fica nos eventos de etapa e no "voltar a etapa" (ADR 0012). O "Concluir" da etapa 7 exige a versão mais recente completa. A aprovação fica no dia da última revisão interna ou depois.
- **Subprocesso:** sem tratamento à parte; é um item como outro, com as mesmas regras. A aprovação do pai não depende da dos subprocessos.
