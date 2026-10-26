# Sabatina — parte 3 (Arquivos por etapa), 2026-10-25

Muda `documentos-versoes` e `revisoes-aprovacao`. Parte das decisões do mapa (`.scratch/quadro-livre/mapa.md`, Q14 a Q17) e das partes 1 e 2 (`sabatina-parte-1.md`, `sabatina-parte-2.md`), que não foram reabertas. Todas as recomendações foram aceitas pelo usuário ("Ok para todas", "Ok para tudo"). Termos no `CONTEXT.md`: Versão, **Versão em sequência**, **Versão piloto**, Versão histórica, Relatório, **Trava de arquivos**, Substituir arquivo, data da validação (em Validação com o setor) e o .pdf protocolado (em Aprovação); saem Relatório pendente e Sem alteração de conteúdo. ADRs novos: 0025 (arquivos por etapa, só o .bpm exigido, trava; substitui o 0016) e 0026 (relatório com numeração própria).

## Versões e numeração

1. **Numeração única por processo:** F e P com número digitado; a sequência sem letra continua do maior número existente, de qualquer tipo (V5F → V6P → V7 → V8). Pode haver mais de uma P, cada uma maior que todas as anteriores. Depois da primeira versão em sequência, não entram mais F nem P. Sem F anterior, a P aceita qualquer número a partir de 1.
2. **Formulário da etapa atual:** o verso mostra só os campos da etapa em que o processo está; a lista de versões aparece em todas. Quem esqueceu um arquivo move o processo de volta.
3. **Onde se envia o quê:** Não iniciados, só F (enquanto não há P nem versão em sequência); Modelagem piloto, só P (enquanto não há versão em sequência); Relatório e modelagem técnica e Revisão interna, versão em sequência e relatório, juntos ou separados; Validação com o setor, Aprovação pelo setor, Publicação, Concluídos e etapas novas do catálogo, nenhuma versão nem relatório (correção pedida pelo setor: o processo volta à Revisão interna). A revisão "corrigida" continua apontando para a versão enviada naquela passagem.
4. **Arquivos exigidos (ADR 0025, substitui o 0016):** F, pelo menos um arquivo de fluxograma (como hoje); P e versão em sequência, só o .bpm; .png e .bpmn opcionais. Sai "versão completa" (nada mais a usa depois do ADR 0023).
5. **Acrescentar depois:** [Acrescentar .png] e [Acrescentar .bpmn] na P ou na versão em sequência que não os tem, exceto na versão aprovada.
6. **Formulários abrem e fecham** e rolam até aparecer inteiros (decisão do mapa); sai a Observação.

## Trava de arquivos (ADR 0025)

7. **Quando age:** ao mover o processo para a frente de uma etapa, vindo dela ou de antes e indo para depois dela (pela ordem do catálogo, pela lista ou arrastando), inclusive pulando por cima. Não age ao voltar, ao mudar só a etiqueta, nem para processo que já estava depois da etapa (os do desenvolvimento que passaram da Modelagem piloto sem P ficam sem ela, sem aviso).
8. **O que confere:** Modelagem piloto, existe uma versão P; Relatório e modelagem técnica, existe uma versão em sequência e existe um relatório numerado, sem importar a ligação entre eles.
9. **O que aparece:** janela no padrão do ADR 0024, com o que falta ("Para sair da Modelagem piloto, envie a versão P (.bpm)") e o botão que abre o formulário ali mesmo; o processo só se move depois do envio.

## Relatório (ADR 0026)

10. **Numeração própria:** Relatório V1, V2… por processo; enviado sozinho ou com uma versão, ligado à versão mais recente no envio. Versão sem relatório próprio continua valendo com o último ("Relatório V2 (da V7)"). Saem "relatório pendente", "Sem alteração de conteúdo" e "Acrescentar relatório" (vira "Enviar relatório"). Só .docx nos envios novos.
11. **Relatório da F:** sem número próprio, aparece como "relatório da V5F"; a numeração própria começa no primeiro relatório enviado pela plataforma.

## Validação, Aprovação e Publicação

12. **Data da validação:** dia em que o setor validou o fluxo, diferente da data do E-protocolo; uma por processo, opcional, editável, registrada com o processo na Validação com o setor, com histórico. Fora das planilhas dos dashboards por ora.
13. **.pdf protocolado:** arquivo do registro de aprovação, um por aprovação, opcional, substituível, só .pdf até 20 MB, na pasta do processo no Drive. Quando uma aprovação nova toma o lugar da anterior (ADR 0023), o .pdf da anterior fica guardado e aparece no histórico. Não entra na versão (ADR 0011 continua).
14. **Publicação:** nada muda (data e link já existem, ADR 0024). Concluídos não tem campos.

## Nomes, substituição, conferência

15. **Nomes no Drive:** P `CEE_V6P_Nome do processo.bpm` (e .png, .bpmn); relatório `CEE_V8_Nome do processo_Relatório V2.docx` (versão que acompanha + número próprio); .pdf da aprovação `CEE_V8_Nome do processo_Aprovação.pdf`. Nomes já gravados não mudam.
16. **Substituir:** vale para os arquivos da P, da versão em sequência, de cada relatório numerado e do .pdf da aprovação. A F e a versão aprovada (com o relatório que a acompanha) continuam sem substituição (ADR 0011).
17. **Conferência com o Drive** ("alterado fora da plataforma", "não encontrado no Drive"): vale para todos esses arquivos, inclusive o .pdf da aprovação.

## Dados, histórico, perfis

18. **Dados do desenvolvimento (só inventados):** a coluna `versoes.observacao` é apagada por migração; os relatórios .pdf gravados ficam; as versões em sequência atuais continuam em sequência (não viram P); os relatórios atuais ganham numeração própria na ordem do envio, ligados à versão em que estão; os "sem alteração de conteúdo" deixam de ser relatórios próprios.
19. **Histórico:** eventos novos de versão P enviada, relatório enviado, arquivo acrescentado, .pdf da aprovação enviado ou substituído e data da validação registrada ou alterada; os eventos antigos de "relatório acrescentado" e "sem alteração de conteúdo" mantêm o texto.
20. **Etapas novas do catálogo:** sem campos de arquivo (só os outros anexos da parte 4).
21. **Consulta:** vê tudo (versões, relatórios, .pdf da aprovação, data da validação) e baixa, sem botão, como hoje.
22. **Subprocesso:** as mesmas regras, com numeração e travas próprias, sem herdar do pai.
