# Dashboards no Data Studio — plano de execução (ticket 04)

> **Para quem executa:** use `superpowers:executing-plans`. Marque as caixas (`- [x]`) ao terminar cada passo.

**Meta:** montar no Data Studio (conta do CED), pelo navegador do app, o dashboard interno (3 páginas) e o público (1 página), lendo as planilhas que a plataforma escreve. Sem código novo: o produto é o que fica no Data Studio e as anotações em `.scratch/exportacao-e-manutencao/dashboards-anotacoes.md` (insumo do ticket 05).

**Ticket:** `issues/04-dashboards-no-data-studio.md` (critérios citados como "critério N"). **Spec:** histórias 44 a 47. **ADRs:** 0017. **Layout das abas:** `desvios.md` (ticket 03).

**Branch:** `exportacao-e-manutencao-04`. Marco: `marco/2026-10-20-inicio-exportacao-e-manutencao-04`.

## Regras que valem

- Dados só inventados: as planilhas do desenvolvimento têm só dados de prova. Nada de dado real entra no Data Studio nesta sessão.
- Login na conta do CED é do usuário, no navegador do app; senha nunca passa por mim. Não saio da conta nem mexo em configuração da conta.
- Compartilhar o interno e tornar o público "Não listado": só com o "sim" do usuário na hora (critério 3).
- Sem banco, sem função, sem migração: não há teste automatizado. A verificação é conferir cada gráfico contra a planilha.

## Tarefas

- [ ] **1. Pré-requisitos.** Usuário entra no Data Studio (lookerstudio.google.com) na conta do CED no navegador do app e passa os dois endereços das planilhas (interna e pública). Conferir as abas e colunas lendo a planilha.
- [ ] **2. Fontes de dados.** Interno: abas Processos e Fases da planilha interna. Público: abas Resumo e Fases da pública. Converter as datas (texto AAAA-MM-DD) para data; campos calculados de porcentagem.
- [ ] **3. Dashboard interno, página 1 (visão geral).** Avanço I a VII e IV a VII, total, publicados, conclusão por fase, setor × fase, modelagens piloto por mês com a meta 12 (critério 1).
- [ ] **4. Página 2 (por fase).** Concluídos, prontos para iniciar, aguardando, processos por setor, com controle de fase.
- [ ] **5. Página 3 (tabela processo × fase).** Situação por fase e observações.
- [ ] **6. Dashboard público.** Total de processos, setores, % concluídas, barras por fase I a VII, só com a planilha pública (critério 2).
- [ ] **7. Conferência dos números** contra as planilhas.
- [ ] **8. Compartilhamento** com confirmação do usuário na hora: interno só equipe; público "Não listado" (critério 3).
- [ ] **9. Anotações** em `dashboards-anotacoes.md` (critério 4) e revisão visual do usuário (critério 5).
- [ ] **10. Fechamento.** Marcar critérios, `desvios.md`, `melhorias-protocolo.md`, linha `Concluído em` no ticket, merge, push.
