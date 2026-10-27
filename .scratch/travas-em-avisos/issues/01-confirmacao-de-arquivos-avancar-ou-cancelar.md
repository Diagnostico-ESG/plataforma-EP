# 01: Confirmação de arquivos: avançar ou cancelar

**What to build:** mover o processo para a frente da Modelagem piloto ou da Relatório e modelagem técnica sem os arquivos delas deixa de ser recusado. A tela pergunta, com o texto da etapa e só o que falta (uma pergunta só quando a ida atravessa as duas), e oferece [Avançar mesmo assim] e [Cancelar]. O banco aceita o movimento e grava no evento o que faltava, e o histórico mostra "Moveu para … sem …". Sai também a sobra da trava do autor. Regras completas na seção "Travas em avisos" da spec de `documentos-versoes` (Confirmação de arquivos, histórias 135 a 138 e 141 a 147, 167) e no ADR 0028. Neste ticket, a pergunta ainda não tem [Enviar arquivos agora] (ticket 02).

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Teste pgTAP antes da migração: `mover_processo` (mesma assinatura) aceita mover para a frente sem os arquivos e grava, no lado "depois" do evento, a lista do que faltava (etapa e peça), só quando falta algo; casos da tabela de regras da spec (piloto sem piloto; Não iniciados → Revisão interna com as duas etapas; técnica → Validação sem relatório; com tudo, sem lista; voltar, sem lista; etapa desativada fora da lista). `59_trava_de_arquivos` passa ao modelo novo; `52_mover_processo`, `10_privilegios_padrao` e `46_funcoes_e_views_seguras` continuam passando.
- [x] Migração não destrutiva, aplicada no desenvolvimento pelo workflow "Migrar banco de desenvolvimento"; tipos atualizados.
- [x] A decisão pura de hoje devolve todas as etapas que faltam na ida, em ordem.
- [x] Janela de confirmação com o título em negrito e a frase da etapa (textos da spec, só o que falta; lista por etapa quando atravessa as duas), saída de uma função pura com teste.
- [x] [Avançar mesmo assim] move na hora (ou abre a chegada a Concluídos, quando é o destino), sem conferir os arquivos de novo; [Cancelar] e Esc deixam o processo onde estava; falha da gravação mostra a mensagem de erro de hoje.
- [x] Mesma pergunta pela lista do Agora e ao arrastar, inclusive quando o destino pula a etapa; voltar, mesma etapa, etiqueta, processo já adiante e etapa desativada não perguntam.
- [x] Histórico mostra "Moveu para {etapa} sem {o que faltava}", lido do evento (inclusive a lista das duas etapas).
- [x] Saem as recusas `trava_piloto`, `trava_tecnica:<falta>` e `autor_da_versao`, com as frases delas; nenhuma tela traz "Quem enviou a versão… não pode…".
- [x] Falsa de processos deixa de recusar e guarda o que faltava; testes `App.*` da trava, do arrastar e da chegada a Concluídos passam ao modelo novo.
- [ ] `[visual]` A pergunta cabe em 1366×768, também com a lista das duas etapas.
