# Sabatina — repositorio-de-processos (2026-10-28)

Decisões do usuário; o porquê do fim do Arquivado está no ADR 0034 e os termos no `CONTEXT.md` (Concluídos, Tirar do Quadro, Situação do processo, Etiqueta). Muda as specs de publicacao-e-arquivamento e processos-etapas. Demanda em `demanda.md`.

## Arquivado e visualizações

1. **Arquivado deixa de existir** (Q1): saem marca, trava, selo, filtro "Arquivados", Arquivar e Desarquivar, e a coluna `arquivado_em`. Processos arquivados no desenvolvimento voltam ao que eram. Entradas antigas de arquivar/desarquivar ficam no histórico.
2. **Trabalho em curso x portfólio** (Q1): Quadro por etapa e por responsável = trabalho em curso; visualização por setor e Lista = portfólio, com os concluídos sempre.
3. **Coluna Concluídos do Quadro por etapa** (Q10, Q16): continua sempre. O cartão sai por "Tirar do Quadro" ou sozinho 30 dias após entrar em Concluídos. Sair de Concluídos e voltar recomeça a contagem e devolve o cartão. A marca vale para toda a equipe.
4. **Tirar do Quadro** (Q15, Q17): botão no cartão da coluna Concluídos e no verso, só Administrador e Integrante do EP. Desfazer só no aviso logo depois ("Tirado do Quadro · Desfazer"). Não entra no histórico.
5. **Pé da coluna Concluídos** (Q18): "N concluídos fora do Quadro · Ver na Lista", que abre a Lista em "Concluídos".
6. **Quadro por responsável** (Q19): concluído não aparece, na hora.
7. **Escolha "Todos | Concluídos"** (Q11, Q12): par de botões à vista, na Lista (vale na tabela e na árvore) e na visualização por setor. Abre em "Todos".
8. **Cancelados** (Q13, Q20): fora de todas as visualizações. Na Lista, linha "Mostrar cancelados (N)" no fim; ao clicar, bloco "Cancelados" no fim da tabela (na árvore, lista simples com setor e macroprocesso). Não aparece com "Concluídos". O filtro da Situação não oferece "Cancelado". Só na Lista.
9. **"Todos" na visualização por setor** (Q13): em andamento, suspensos e concluídos.
10. **Etiqueta "Em andamento" passa a "Iniciado"** (Q21, opção H): A fazer, Iniciado, Finalizado. Só o rótulo; o valor no banco não muda. A situação continua "Em andamento". Planilhas e CSV não mostram a etiqueta.

## Lista

11. **Agrupar por: Nenhum | Macroprocesso** (demanda): Nenhum = tabela de hoje; Macroprocesso = a mesma tabela com linhas de grupo (Q22): macroprocesso → setor → processo, com os arquivos abaixo do processo ao abri-lo. Colunas Setor e Macroprocesso continuam.
12. **Arquivos do processo na árvore** (Q2, Q6, Q7): a versão mais recente (.bpm, .png, .bpmn se houver), o relatório ligado a ela e o selo "Aprovada" quando for a aprovada. Sem anexos. O .png é só link para o Drive, sem miniatura.
13. **Subprocessos** (Q3): sob o processo pai, recuados, mesmo de outro setor (o selo mostra o setor).
14. **Ramos vazios** (Q4): setor e macroprocesso sem processo (depois dos filtros) não aparecem.
15. **Quais processos** (Q5): os mesmos da tabela, com os mesmos filtros e a escolha Todos | Concluídos.
16. **Aberto e fechado** (Q23): macroprocessos e setores abertos, processos fechados (arquivos carregados ao abrir); botão para abrir todos e fechar todos. Clicar no nome abre o verso.
17. **Ordem** (Q24): macroprocessos por nome, setores por sigla, processos pela ordenação escolhida (padrão: nome).
18. **Filtro e ordenação por coluna** (Q8, Q9, Q14, Q25): a barra de filtros sai da Lista (fica no Quadro); a busca fica acima da tabela. Todas as colunas ordenam (Etapa atual pela ordem do catálogo; Situação em andamento, suspenso, concluído). Todas menos Processo ganham filtro de um valor. Com "Concluídos", o filtro da Situação some.
19. **Coluna "Nome" passa a "Processo"** (Q9).
20. **Endereço da página** (Q26): agrupamento, Todos | Concluídos, filtros e ordenação ficam no endereço.
