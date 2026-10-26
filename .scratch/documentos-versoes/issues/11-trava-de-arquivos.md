# 11: Trava de arquivos

**Como resolve a sua parte.** Com o andamento livre, nada impede o processo de sair da Modelagem piloto sem o .bpm do piloto, ou da técnica sem a versão e o relatório. Este ticket faz a **trava de arquivos** (ADR 0025): ao mover para a frente de uma dessas etapas, faltando o que ela exige, o processo não se move e uma janela diz o que falta e oferece o envio ali mesmo. Depois do envio, o processo se move. Voltar, mudar a etiqueta e mover um processo que já estava adiante não travam.

**What to build:** a trava de ponta a ponta (banco, view, movimento na tela, janela e testes).

- **Banco:**
  - `mover_processo` recusa ir da etapa com trava (ou de antes dela) para depois dela, faltando: na Modelagem piloto, uma versão piloto; na técnica, uma versão em sequência e um relatório numerado, sem importar a ligação;
  - etapa com trava desativada no catálogo não trava;
  - a view `processos_com_andamento` ganha `tem_versao_piloto`, `tem_versao_em_sequencia` e `tem_relatorio_numerado`.
- **Tela:**
  - função pura que devolve a primeira etapa com trava que falta (origem, destino, catálogo e o que o processo tem);
  - o movimento consulta a trava antes da chegada a Concluídos, pela lista do Agora e ao arrastar;
  - janela "Para sair da {etapa}, envie…", só com o que falta (versão piloto; ou versão e relatório, ou um dos dois), no padrão da janela da chegada, com [Enviar e mover];
  - se a ida passa pelas duas etapas com trava, uma janela de cada vez; Concluídos por último;
  - fechar sem enviar deixa o processo onde estava; falha no envio, nada move e nada se perde; falha no movimento depois do envio: "Os arquivos foram enviados, mas o processo não foi movido.";
  - a falsa de processos recusa o movimento como o banco.
- **Recusas:** "Para sair da Modelagem piloto, envie a versão piloto (.bpm)." e "Para sair da Relatório e modelagem técnica, envie {a versão | o relatório | a versão e o relatório}.".

Spec: `.scratch/documentos-versoes/spec.md`, seção "Arquivos por etapa (mudança de 2026-10-26)" (histórias 97 a 106; decisões 1 a 4 e 10). Afeta o movimento descrito na spec de `processos-etapas`.

**Branch:** `quadro-livre-parte-3`. A migração vai ao banco de desenvolvimento pelo workflow "Migrar banco de desenvolvimento".

**Blocked by:** 09 (Versões por etapa) e 10 (Relatório com numeração própria): a trava confere a versão piloto e o relatório numerado, e a janela usa os formulários deles.

**Status:** ready-for-agent

## Critérios de aceite

- [x] Testes pgTAP escritos antes da migração e vistos falhar: Modelagem piloto → técnica sem piloto recusado; Não iniciados → Revisão interna sem piloto recusado; técnica → Validação sem relatório recusado; com versão e relatório ligados a versões diferentes aceito; voltar sem nada aceito; processo já adiante sem piloto aceito; etapa desativada não trava; os campos novos da view. O teste `52` ajustado; `46_funcoes_e_views_seguras` continua passando.
- [x] Testes de interface com o aplicativo inteiro: a trava pela lista e ao arrastar, a janela com só o que falta, enviar e mover, fechar sem enviar, falha no envio, falha no movimento depois do envio, as duas travas em sequência, depois a chegada a Concluídos, voltar sem trava, processo adiante sem trava. `App.arrastarParaMover`, `App.agoraDoVerso` e `App.chegadaAConcluidos` ajustados onde a trava muda o caminho.
- [x] A função pura da trava tem testes unitários (catálogo com etapa desativada e etapa nova); os testes do módulo real provam a frase da recusa.
- [ ] `[visual]` A janela da trava diz o que falta na primeira linha e mostra o formulário inteiro sem passar da altura do notebook (1366×768).

O critério `[visual]` fica sem marca: a janela foi montada numa vitrine local com módulos falsos e só medida (a captura de tela não funcionou), não vista no app real (ver `.scratch/documentos-versoes/desvios.md`, 2026-10-26).
Concluído em 2026-10-26 (commit 557b696)
