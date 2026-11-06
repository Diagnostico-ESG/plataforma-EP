# 01: Cadastros e etapas pela planilha

**What to build:** o Administrador abre Administração → Importação, escolhe a aba PRODUTO 33 exportada como .csv, vê a prévia (setores, macroprocessos e processos que entram, etapa de cada processo, o que será pulado, avisos), confirma e recebe o resumo. Os processos aparecem na Lista, no Quadro e em Cadastros nos setores e etapas certos. Regras na spec `importacao-dados-atuais` (histórias 1 a 40), em `amostra/cabecalho.md`, no ADR 0044 e no termo do `CONTEXT.md`. Só Administrador; nunca altera o que já existe.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Teste pgTAP antes da migração: operação de banco de gravar processo importado (sem `security definer` fora de `private`), só Administrador; recusa Integrante, Consulta, usuário desativado e visitante; cria setor e macroprocesso só se faltam; reaproveita os existentes; pula processo existente (mesmo setor e nome, sem diferença de caixa e espaços); cada processo inteiro ou nada; etapa e status certos; Concluídos já tirado do Quadro com a Data da Publicação; anotação; um único histórico "importado da planilha" com quem importou; contagem de parado começa na importação; nada existente é alterado. `00_rls_ligada`, `46_funcoes_e_views_seguras` e os demais continuam passando.
- [x] Migração não destrutiva, aplicada no desenvolvimento pelo workflow "Migrar banco de desenvolvimento"; tipos atualizados.
- [x] Módulo de leitura do .csv separado de banco e de tela: etapa pela última coluna "Concluído" ("Não realizada" conta), Não iniciados com A fazer, VII concluída vai a Concluídos (sem data: Publicação, Finalizado, aviso), macroprocesso sem numeral romano, "Subprocesso Geral"/"Subprocesso de eventos"/"DL - DIRETOR LEGISLATIVO"/vazio em "A definir", setor com nome igual à sigla, coluna D ignorada, data "16 10 2026" e "01/09/2026" aceitas e outras ignoradas com aviso, data de piloto em Não iniciados ignorada com aviso, "Concluído" depois de vazio vale como última e avisa, nome com " - " segue como processo, linha repetida vale a primeira e lista a segunda, Observações viram Anotações. Separador e acentos do .csv conferidos com arquivo inventado.
- [x] Contrato `importacao` com implementação real e falsa nomeada; a prévia usa os setores e processos existentes para marcar "já existia".
- [x] Tela: entrada "Importação" em Administração só para Administrador; Integrante, Consulta e o endereço direto não abrem nada; explica as duas etapas e a ordem; escolher arquivo, prévia (contagens, etapa por processo, pulados, avisos), arquivo com colunas faltando recusado com quais faltam; [Confirmar] só habilitado com algo a gravar; nada gravado antes de confirmar; resumo com criados, pulados e avisos; falha no meio diz o que já entrou; rodar de novo pula o que existe. Seção "2. Arquivos das versões" aparece desabilitada, para o ticket 02.
- [x] Testes pela tela (padrão `App.*.test.tsx`, falsos de `acesso`, `cadastros`, `processos`, `importacao`) com .csv inventado (setores XYZ e ABC, "Exemplo Alfa"): cada regra acima, perfil sem acesso, nada gravado antes de confirmar, segunda rodada, processos nas telas de sempre.
- [x] `[visual]` A tela, a prévia e o resumo seguem o padrão de Administração, sem texto redundante.
- [x] Passo do usuário anotado: backup da produção (criar `BACKUP_SENHA_PRODUCAO`) antes da carga real; a carga real é dele, pela tela.

## Notas da execução (2026-11-05)

- **Passo do usuário (antes da carga real):** backup do banco de produção (criar `BACKUP_SENHA_PRODUCAO`) e publicar a migração `20261106015148_importar_processo` na produção pelo roteiro do `/ship`; a carga real é dele, pela tela Administração → Importação, com o .csv exportado da aba PRODUTO 33.
- **Testes de banco:** o Docker estava fechado; o teste `74_importar_processo` (51 verificações) foi provado no workflow "Testes de banco" (61 de 61 arquivos), vermelho antes da migração e verde depois.
- **`[visual]`:** a tela foi vista só numa vitrine local com módulos falsos e dados inventados (prévia e resumo lidos como texto; uma captura da prévia); nada visto com o login real.

Concluído em 2026-11-05 (commit 508996e)
