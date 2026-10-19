# Sabatina da parte 4 — Cartão do Quadro (processos-etapas)

Iniciada em 2026-10-19 pelo `grill-with-docs`. Marco: `marco/2026-10-19-inicio-cartao-do-quadro`.

## Fatos do código (levantados antes das perguntas)

- O cartão (`CartaoDoProcesso.tsx`) traz sigla, macroprocesso, nome, pílula de tipo (Subprocesso, A classificar), pílula "Suspenso" e o avatar do responsável da etapa atual. Ordem na coluna: pelo nome.
- O cartão Agora do verso já conta os dias na etapa (`diasNaEtapa.ts`, `LIMITE_DE_DIAS_NA_ETAPA = 15`, âmbar acima do limite).
- O Quadro lê a view `processos_com_andamento` (`security_invoker = true`), que não traz o início da etapa atual, a última versão nem a contagem de subprocessos.
- Catálogo: Modelagem piloto, Relatório e modelagem técnica, Revisão interna, Revisão pelo setor, Aprovação pelo setor, Publicação (opcional).

## Rodada 1 (todas as recomendações aceitas)

1. **Barra de progresso:** em pedaços, um por etapa do caminho do processo; resolvidas (concluída, realizada anteriormente, dispensada) preenchidas, a atual destacada, as seguintes vazias. Sempre visível, discreta, em cinza e azul, sem cor de alerta.
2. **Dias na etapa:** selo só acima de 15 dias na etapa atual, em âmbar ("18 dias nesta etapa"). Sem selo no suspenso nem na etapa atual não iniciada.
3. **Versão:** rótulo da última versão ("V3", "V5F") em texto neutro, só quando o processo tem versão.
4. **Pendência:** "Relatório pendente" só da Revisão interna em diante (antes disso, faltar o relatório é o trabalho normal). "Sem responsável" como selo neutro quando a etapa atual não tem responsável. Nenhuma outra pendência por enquanto.
5. **Próxima reunião:** "Reunião 24/10" (ou "Reunião hoje") quando a data é hoje ou futura; some depois da data.
6. **Subprocessos:** "3 subprocessos", neutro, só no cartão do pai. O subprocesso continua só com a pílula "Subprocesso".
7. **Arrastar para concluir:** só cartão com etapa em andamento, só para a coluna seguinte; outra coluna devolve o cartão com um aviso curto. Não se arrastam: suspenso, etapa não iniciada (não inicia e conclui de uma vez, para não perder a data de início), perfil Consulta. Soltar abre a janela "Quem fica com a próxima etapa?" (parte 2); cancelar devolve o cartão. O que a parte 5 acrescentar a essa janela vale para o arrastar. A última etapa só se conclui pelo verso.
8. **Teclado:** sem atalho novo; o caminho é Enter no cartão e o [Concluir] do Agora.
9. **Agrupar por Responsável:** uma coluna por pessoa que tem cartão (depois dos filtros), em ordem alfabética, e "Sem responsável" no fim; pessoa inativa marcada; o cartão mostra o nome da etapa atual no lugar do avatar; sem arrastar; a escolha fica no endereço, como os filtros.
10. **Só os meus:** processos em que a pessoa é responsável pela etapa atual; atalho de um clique para o filtro Responsável = eu; só para Administrador e Integrante.
11. **Ordem na coluna:** continua pelo nome.

## Rodada 2 (todas as recomendações aceitas)

12. **Coluna de destino do arrastar:** a coluna para onde o processo de fato avança (a primeira etapa pendente depois da atual), mesmo que não seja a vizinha; durante o arrastar, só ela fica destacada.
13. **Toque:** arrastar desligado em tela de toque; usa-se o verso.
14. **Contagem de subprocessos:** todos, menos os cancelados.
15. **Ordem dos selos:** dias parado (âmbar), Relatório pendente, Sem responsável, Reunião, Versão, Subprocessos; quebram de linha, sem limite.
16. **Processo parado:** registrado no `CONTEXT.md` (etapa atual iniciada há mais de 15 dias). O selo continua dizendo "18 dias nesta etapa".
17. **Dados do Quadro:** a view `processos_com_andamento` ganha, por migração nova não destrutiva, o início da etapa atual, a situação de cada etapa (para a barra), a última versão com a marca de relatório e a contagem de subprocessos. Um pedido só; a RLS continua a mesma.

## Rodada 3 (padrões propostos; o usuário seguiu para o `to-spec`, o que os aceita)

18. **Lista:** sem barra e sem selos; a mudança é só do cartão do Quadro.
19. **Só os meus sem cartão:** "Nenhum processo com você agora." com [Ver todos], que desliga o filtro.
20. **Consulta:** vê barra, selos e o "Agrupar por"; não vê "Só os meus" e não arrasta.

## ADR

Nenhum: as decisões são fáceis de reverter e seguem o mapa e os ADRs 0013 e 0014.
