# 09: Versões por etapa

**Como resolve a sua parte.** Hoje o verso oferece todos os envios em qualquer etapa e exige o .bpm e o .png. Este ticket faz cada etapa mostrar só o seu envio: versão histórica em Não iniciados, **versão piloto** (V6P, número digitado) na Modelagem piloto e **versão em sequência** (V7) na técnica e na Revisão interna. Toda versão que não é histórica exige só o .bpm, e o .png e o .bpmn podem entrar depois (ADR 0025). O relatório e a trava ficam para os tickets 10 e 11; aqui o envio do relatório junto da versão continua como está.

**What to build:** o envio por etapa de ponta a ponta (banco, função do servidor, módulo de versões, verso e testes).

- **Banco:**
  - `versoes.piloto`, nunca junto com `historica`;
  - sai `versoes.observacao`;
  - numeração: histórica e piloto digitadas; piloto maior que todas e só antes da primeira em sequência; em sequência = maior + 1, de qualquer tipo;
  - onde cabe, pela ordem do catálogo: histórica só em Não iniciados, piloto até a Modelagem piloto, em sequência até a Revisão interna;
  - piloto e em sequência exigem só o .bpm (gatilho adiado recriado; sai `versao_sem_bpm_e_png`; `papeis_que_faltam` fica sem uso);
  - acrescentar .png ou .bpmn só na versão piloto ou em sequência que não o tem, fora da aprovada;
  - eventos de versão piloto enviada e de arquivo acrescentado.
- **Função do servidor:** operações de versão piloto e de acrescentar arquivo; nome padrão `CEE_V6P_Nome do processo.bpm`; o arquivo puro de decisão com as operações novas. Termina com o roteiro para o usuário publicar a função no desenvolvimento.
- **Módulo de versões:** `enviarVersao` com o tipo (piloto ou em sequência); `acrescentarArquivo`; a falsa imita as recusas novas.
- **Verso:**
  - botões pela etapa atual: [Registrar versão histórica] em Não iniciados; [Enviar versão piloto] na Modelagem piloto; [Enviar versão] na técnica e na Revisão interna; nada da Validação em diante nem nas etapas novas;
  - formulário da piloto com o número preenchido com o menor aceito e a prévia V6P;
  - .bpm obrigatório; .png e .bpmn opcionais;
  - sem o campo de observação;
  - o botão abre e fecha o formulário, que rola até aparecer inteiro;
  - rótulo V6P na lista;
  - [+ Acrescentar .png] e [+ Acrescentar .bpmn] no lugar tracejado, fora da aprovada e da histórica.
- **Histórico:** "Enviou a versão piloto V6P" e "Acrescentou o .png à V7".

Spec: `.scratch/documentos-versoes/spec.md`, seção "Arquivos por etapa (mudança de 2026-10-26)" (histórias 63 a 83, 93, 94, 107 a 110; migração sem a parte do relatório).

**Branch:** `quadro-livre-parte-3`. A migração vai ao banco de desenvolvimento pelo workflow "Migrar banco de desenvolvimento".

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Testes pgTAP escritos antes da migração e vistos falhar: numeração da piloto (maior que todas, a partir de 1 sem histórica, várias, recusada depois da V7), em sequência depois da piloto, onde cada envio cabe, só o .bpm exigido, acrescentar .png e .bpmn (aceito, repetido recusado, aprovada e histórica recusadas), eventos novos. Os testes `27` e `28` ajustados.
- [ ] Testes de interface com o aplicativo inteiro: os botões em cada etapa (Não iniciados, Modelagem piloto, técnica, Revisão interna, Validação, Concluídos, etapa nova); a piloto com o número preenchido, trocado e recusado; a em sequência só com .bpm; acrescentar .png e .bpmn; formulário que abre, fecha e rola; Consulta e processo suspenso sem botões; eventos no histórico. Os testes de hoje que usam a observação ou o .png obrigatório passam ao modelo novo.
- [ ] O arquivo puro de decisão da função e o nome padrão têm testes das operações novas; os testes do módulo real provam as chamadas e as frases das recusas novas.
- [ ] Funções puras (rótulo V6P, número mínimo da piloto, papéis exigidos por tipo, botões por etapa) com testes unitários.
- [ ] `[visual]` O verso mostra só o botão de envio da etapa atual, sem espaço vazio nas etapas sem envio.
- [ ] `[visual]` O formulário aberto rola até aparecer inteiro e fecha pelo mesmo botão; [+ Acrescentar .png] e [+ Acrescentar .bpmn] no padrão tracejado de hoje.
