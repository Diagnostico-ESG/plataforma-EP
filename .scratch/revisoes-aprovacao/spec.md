# Revisões e aprovação

Status: ready-for-agent

**Como resolve o problema.** Hoje a revisão interna e a aprovação de cada processo ficam na memória da equipe, em e-mails e no Power BI: não se sabe com segurança quem revisou qual versão, se mudou algo, nem qual versão foi aprovada. Com esta funcionalidade, quem conclui a **Revisão interna** diz, na mesma janela do [Concluir], se a versão passou "sem alteração" ou foi "corrigida". Quem conclui a **Aprovação pelo setor** vê qual versão está sendo aprovada e anota, se já tiver, o número, o link e a data do E-protocolo. Revisão e conclusão se gravam juntas, sem botão nem formulário a mais. O banco garante que ninguém revise a própria versão, que nada vá ao setor ou seja aprovado com versão incompleta, e que a versão aprovada não tenha arquivo trocado. Os registros aparecem na gaveta da etapa, no verso do cartão, e toda mudança entra no histórico do processo.

Decisões de origem: sabatina de 2026-10-16 (`.scratch/revisoes-aprovacao/sabatina.md`), revista no `/to-tickets` de 2026-10-17 e no `/planejar` de 2026-10-19; `CONTEXT.md` (seções "Processos", "Documentos" e "Revisões e aprovação"); ADRs 0006 (envio não muda a etapa), 0011 (versão aprovada não tem arquivo substituído), 0012 (revisão pelo setor sem rodadas), 0013 (etapas do setor saem), 0014 (resolver avança; trava do autor na escolha) e 0015 (revisão e aprovação gravadas no Concluir; E-protocolo opcional), que substitui em parte o 0009.

## Problema

Depois do Relatório e modelagem técnica (etapa 2 do catálogo), cada processo passa por três etapas que hoje não deixam rastro confiável: a **Revisão interna** (etapa 3), em que um colega confere o trabalho do autor e muitas vezes o corrige; a **Revisão pelo setor** (etapa 4), em que a versão completa vai ao setor, que aprova ou pede ajustes (e então o processo volta, é revisado e vai de novo); e a **Aprovação pelo setor** (etapa 5), formalizada no E-protocolo. A equipe precisa saber, para cada processo, quem revisou, se mudou algo e qual versão foi aprovada. Também é preciso impedir que o processo seja revisado pelo próprio autor, vá ao setor ou seja aprovado com versão incompleta, ou tenha a versão aprovada alterada.

## O que já existe (partes 1 a 4 da iniciativa)

- **[Assumir]** em qualquer etapa sem responsável, pendente ou em andamento, para Administrador e Integrante (processos-etapas, ticket 14). O antigo "Capturar" desta spec virou o [Assumir] e não precisa de nada novo.
- **Trava do autor na escolha do responsável:** o gatilho `conferir_autor_da_revisao_interna` recusa como responsável da Revisão interna quem enviou a versão mais recente não histórica, no seletor, no [Assumir] e nas janelas de concluir e de voltar (`autor_da_versao:<número>:<nome>`; ADR 0014). A tela já tira essa pessoa das opções (`usuariosParaAEtapa`, `podeAssumir`).
- **Janela de concluir** (`JanelaDeAvanco`), aberta pelo [Concluir] do Agora e pelo arrastar no Quadro, com "Quem fica com a próxima etapa?", gravando pela função `avancar_etapa`, que conclui e inicia a próxima numa gravação só.
- **Voltar a uma etapa** com motivo e responsável (`voltar_a_etapa`).
- O **verso do cartão** (janela central): à esquerda, o Agora, as Etapas (cada linha abre uma gaveta) e Arquivos (versões); à direita, Reunião, Sobre e Estrutura.

## Solução

- **Concluir a Revisão interna:** a janela de concluir ganha, acima de "Quem fica com a próxima etapa?", o **Resultado da revisão**: "Sem alteração: segue a V7" ou "Corrigida: a V8, enviada por você, corrige a V7". Em "Corrigida", o **Escopo** (fluxograma, relatório ou ambos). Há também um **Comentário** opcional. Quem conclui é o revisor. A revisão e a conclusão se gravam juntas.
- **Brecha fechada** (mapa, parte 5): quem enviou a versão revisada não conclui a revisão. Se a pessoa enviou a versão mais recente, só cabe "Corrigida", e só se a versão anterior for de outra pessoa. Quando nenhuma opção cabe, a janela diz por quê ("Quem enviou a versão V7 não pode revisá-la.") e o botão fica desabilitado.
- **Concluir a Revisão pelo setor:** a janela de sempre. Se a versão mais recente não estiver completa (.bpmn, .png e relatório; desde 2026-10-20, .bpm, .png e relatório, ADR 0016), a janela diz o que falta ("A V8 está sem relatório.") e não deixa concluir.
- **Concluir a Aprovação pelo setor:** a janela mostra "Versão aprovada: V8" e pede o **Número do E-protocolo**, o **Link** e a **Data da aprovação**, os três opcionais. Com a versão mais recente incompleta, diz o que falta e não deixa concluir. Sem etapa pendente depois, a janela aparece mesmo assim, sem a pergunta do responsável.
- **Na gaveta da etapa** (lista Etapas do verso):
  - **Revisão interna:** as revisões, da mais recente para a mais antiga, cada uma com a versão revisada, o revisor, a data, o resultado ("Sem alteração" ou "Corrigida, gerou a V8", com o escopo) e o comentário.
  - **Aprovação pelo setor:** "V8 aprovada", o número do E-protocolo (como link, numa aba nova, quando há link), a data da aprovação e quem registrou. Sem número: "Sem número do E-protocolo".
  - [Editar] em cada registro, para Administrador e Integrante, com o processo em andamento.
- **Selo "Aprovada"** na versão aprovada, em Arquivos. Nela, o [Substituir] some.
- **Voltar** para a Aprovação ou para antes dela desfaz a aprovação. A janela de voltar avisa ("A aprovação da V8 será desfeita.") e o histórico guarda o que ela era. As revisões nunca se apagam.
- **Proteções:** nenhum arquivo da versão aprovada se substitui (ADR 0011). As três etapas não se desativam nem se excluem do catálogo; renomear e mover continuam.
- **Histórico do processo:** ganha os eventos de revisão registrada e editada, e de aprovação registrada, editada e desfeita, com o antes e o depois.

Tudo vale igual para qualquer item (processo, subprocesso ou a classificar): os registros pertencem ao item e ficam com ele na reclassificação. A aprovação de um processo pai não depende da dos subprocessos.

A Consulta vê os registros e o selo, sem nenhum botão. Quem não pode alterar é recusado pelo banco, mesmo que tente fora da tela. A plataforma não guarda e-mails.

## Histórias de usuário

### Revisão interna

1. Como revisor, quero escolher "Sem alteração" na janela de concluir a Revisão interna, para dizer que a versão do autor segue para o setor como está.
2. Como revisor, quero escolher "Corrigida" e o escopo (fluxograma, relatório ou ambos), depois de enviar a versão nova em Arquivos, para que fique claro que a V8 é a minha correção da V7.
3. Como revisor, quero ver na janela, antes de confirmar, qual versão foi revisada e qual é a nova, conforme o resultado.
4. Como revisor, quero um comentário opcional, para anotar o que observei.
5. Como autor da versão mais recente, quero ser impedido de concluir a revisão dela, com a frase "Quem enviou a versão V7 não pode revisá-la.", para que a revisão seja sempre de outra pessoa, mesmo se eu tiver assumido a etapa antes de enviar a versão.
6. Como revisor, quero que "Corrigida" só apareça disponível quando a versão mais recente é minha, para não ligar a correção à versão errada.
7. Como Integrante, quero ser impedido de concluir a Revisão interna de um processo sem versão, com uma frase que diga isso.
8. Como Integrante, quero que, depois de voltar à Revisão interna e enviar uma versão nova, concluir de novo registre a revisão dessa versão nova.
9. Como Integrante, quero que o arrastar no Quadro abra a mesma janela, com o resultado da revisão.
10. Como Integrante, quero ver na gaveta da Revisão interna as revisões em ordem, com versão, revisor, data, resultado e comentário.

### Revisão pelo setor

11. Como Integrante, quero ser impedido de concluir a Revisão pelo setor quando a versão mais recente não tem relatório, .bpmn ou .png, com a janela dizendo o que falta.
12. Como Integrante, quando o setor pede ajustes, quero voltar à Revisão interna, para revisar a versão nova e mandá-la de novo; ou, se o ajuste foi pequeno, enviar a versão nova e concluir a etapa sem nova ida ao setor.

### Aprovação

13. Como Integrante, quero ver na janela de concluir a Aprovação qual versão está sendo aprovada ("Versão aprovada: V8").
14. Como Integrante, quero anotar o número, o link e a data do E-protocolo se já os tiver, e concluir sem eles se ainda não chegaram.
15. Como Integrante, quero ser recusado com link que não começa com `http://` ou `https://`, com data futura ou anterior à última revisão interna, com a frase dizendo o porquê, sem perder o que preenchi.
16. Como Integrante, quero ser impedido de concluir a Aprovação com a versão mais recente incompleta.
17. Como usuário, quero ver na gaveta da Aprovação a versão aprovada, o número, a data e quem registrou, e abrir o E-protocolo pelo link numa aba nova.
18. Como usuário, quero ver o selo "Aprovada" na versão aprovada, em Arquivos.
19. Como Integrante, quero ser recusado ao substituir um arquivo da versão aprovada, com a frase "A versão V8 foi aprovada e seus arquivos não podem ser substituídos.", e ver o [Substituir] sumir nela.
20. Como Integrante, ao voltar para a Aprovação ou para antes dela, quero ser avisado de que a aprovação será desfeita, e que ela saia ao confirmar, com o antes no histórico.

### Corrigir registros

21. Como Integrante, quero editar o comentário e, na revisão "corrigida", o escopo, para corrigir um engano.
22. Como Integrante, quero editar o número, o link e a data da aprovação, inclusive para acrescentar o número que chegou depois da conclusão.
23. Como Integrante, quero que as edições fiquem no histórico com o antes e o depois.

### Perfis, situação e catálogo

24. Como Consulta, quero ver os registros na gaveta e o selo, sem botões.
25. Como usuário de qualquer perfil, quero que tudo fique congelado (sem botões, e recusado pelo banco) com o processo suspenso, cancelado ou concluído.
26. Como Administrador, quero ser recusado ao desativar ou excluir as etapas Revisão interna, Revisão pelo setor e Aprovação pelo setor no catálogo, e continuar podendo renomeá-las e movê-las.
27. Como usuário inativo ou visitante, não quero ver nada disso.
28. Como Integrante, quero que o subprocesso tenha as mesmas regras, com as próprias revisões e aprovação, e que elas fiquem com o item na reclassificação.

### Histórico e estados da tela

29. Como usuário, quero ver no histórico do processo os eventos de revisão e de aprovação, com quem e quando.
30. Como usuário, quero ver "Carregando…" enquanto os registros da gaveta carregam, "Nenhuma revisão registrada." e "Sem aprovação registrada." quando não há dados, e uma mensagem com [Tentar de novo] quando a leitura falha, inclusive por falta de conexão.
31. Como usuário, quero que uma recusa ou falha ao gravar apareça em vermelho na janela, sem perder o que preenchi.

## Decisões de implementação

### Interface

- **Janela de concluir:** a `JanelaDeAvanco` recebe, conforme o código da etapa, um bloco a mais acima da escolha do responsável. Quem a monta é o mesmo caminho do [Concluir] do Agora e do arrastar no Quadro, então os dois ganham o bloco juntos.
  - `revisao_interna`: o Resultado, com botões de escolha e a prévia das versões em cada opção; o Escopo, só em "Corrigida"; o Comentário (até 2.000 caracteres). A opção que não cabe fica desabilitada, com o motivo ao lado. Se nenhuma cabe, aparece a frase e o botão principal fica desabilitado.
  - `revisao_setor`: sem campos. Com versão incompleta (ou sem versão), a frase do que falta, e o botão desabilitado.
  - `aprovacao_setor`: "Versão aprovada: V8"; Número do E-protocolo (até 60 caracteres), Link (até 500), Data da aprovação com `input type="date"` (vazia ao abrir, sem data futura). Com versão incompleta, a frase e o botão desabilitado.
  - Dispensar e "Realizada anteriormente" não mudam: as três etapas são obrigatórias, e "realizada anteriormente" continua sem registro (processos aprovados antes da plataforma).
- **Gaveta da etapa** (`DetalheDaEtapa`): nas linhas `revisao_interna` e `aprovacao_setor`, abaixo das datas e da nota, os registros e o [Editar]. A edição abre a `JanelaDeEdicao` (a mesma janela nativa da `JanelaComCampo`, ADR 0003, com vários campos), com os campos editáveis preenchidos.
- **Selo "Aprovada"** na versão aprovada, em destaque ou recolhida, com a `Pilula` que já existe; o [Substituir] não aparece nela.
- **Janela de voltar:** quando a etapa escolhida é a `aprovacao_setor` ou anterior a ela e há aprovação, mostra "A aprovação da V8 será desfeita." acima do motivo.
- **Estados dos registros na gaveta:**
  - carregando: "Carregando…";
  - sem dados: "Nenhuma revisão registrada." ou "Sem aprovação registrada.";
  - erro, inclusive falha de conexão: "Não foi possível carregar as revisões. Verifique a conexão e tente de novo." com [Tentar de novo], no padrão de `ErroAoCarregar`;
  - gravando: botão desabilitado com "Salvando…";
  - recusa ou falha ao gravar: mensagem em vermelho na janela, sem perder o que foi preenchido.
- **Recusas:** cada recusa chega como código do banco (P0001 "motivo:valor", como em processos) e vira frase na tela, num módulo de frases próprio: revisor é o autor da versão revisada (com a versão); "corrigida" sem versão nova do revisor; processo sem versão; versão incompleta (com o que falta); link fora do formato; data no futuro ou antes da última revisão interna (com as datas); conclusão sem revisão da versão mais recente ou sem aprovação (caminho fora da tela); substituição em versão aprovada; etapa protegida no catálogo.
- **Módulo de revisões:** um módulo próprio, ao lado de versões, com a mesma forma (interface com uma implementação real e uma falsa nomeada): listar as revisões e a aprovação de um processo; concluir a Revisão interna; concluir a Aprovação; editar cada registro. A real chama as funções do banco e fala com as tabelas pela chave publicável; a RLS e os gatilhos decidem. Sem Edge Function e sem Drive.
- **Histórico do processo:** os eventos novos entram na lista de eventos que já existe, com textos próprios.

### Modelo de dados

**Tipos novos:** `resultado_da_revisao` = `sem_alteracao` | `corrigida`; `escopo_da_correcao` = `fluxograma` | `relatorio` | `ambos`.

**Tabela `revisoes_internas`:**

| Coluna | Tipo | Obrigatória | Observação |
|---|---|---|---|
| `id` | uuid | sim | gerado |
| `processo_id` | uuid → `processos` | sim | referência recusa apagar o processo |
| `versao_revisada_id` | uuid → `versoes` | sim | do mesmo processo; preenchida pelo banco: a mais recente (sem alteração) ou a anterior à mais recente (corrigida) |
| `versao_corrigida_id` | uuid → `versoes` | só em "corrigida" | preenchida pelo banco: a mais recente, que precisa ser do revisor |
| `resultado` | `resultado_da_revisao` | sim | não muda |
| `escopo` | `escopo_da_correcao` | só em "corrigida" | nulo em "sem alteração" |
| `comentario` | text | não | até 2.000 caracteres, sem espaços nas pontas, vazio vira nulo |
| `revisada_em` | date | sim | preenchida pelo banco: o dia da conclusão, no horário de Brasília (`private.hoje()`); não muda |
| `revisor_id` | uuid → `usuarios` | sim | quem chamou, preenchido pelo banco; não muda |
| `registrada_em` | timestamptz | sim | gerado |

**Tabela `aprovacoes`:**

| Coluna | Tipo | Obrigatória | Observação |
|---|---|---|---|
| `id` | uuid | sim | gerado |
| `processo_id` | uuid → `processos` | sim | único (uma por processo); referência recusa apagar o processo |
| `versao_id` | uuid → `versoes` | sim | preenchida pelo banco: a mais recente, completa; não muda |
| `numero_eprotocolo` | text | não | 1 a 60 caracteres, sem espaços nas pontas, vazio vira nulo |
| `link` | text | não | começa com `https://` ou `http://`; até 500 caracteres; vazio vira nulo |
| `aprovada_em` | date | não | não no futuro; no dia da última revisão interna ou depois |
| `registrada_por` | uuid → `usuarios` | sim | preenchido pelo banco |
| `registrada_em` | timestamptz | sim | gerado |

**Funções novas** (sem `security definer`: rodam com a permissão de quem chama, e a RLS decide):

- `concluir_revisao_interna(p_andamento, p_resultado, p_escopo, p_comentario, p_responsavel)`: inclui a revisão e chama `avancar_etapa(p_andamento, 'concluir', null, p_responsavel)`, numa gravação só.
- `concluir_aprovacao(p_andamento, p_numero, p_link, p_data, p_responsavel)`: inclui a aprovação e chama `avancar_etapa` do mesmo jeito.

**"Versão mais recente"** é a de maior número do processo; **"completa"** é a que tem arquivos de papel `bpmn`, `png` e `relatorio`. Uma função pequena em `private` responde cada uma, usada pelos gatilhos. (Mudou em 2026-10-20, ADR 0016: "completa" passa a ser `bpm`, `png` e `relatorio`; vale a seção "Mudança de 2026-10-20" da spec de `documentos-versoes`.)

**Privilégios padrão:** cada tabela nova nasce com `revoke all` de visitante e de logado e concede de volta a logado: ler; incluir só as colunas que a pessoa escolhe (revisão: `processo_id`, `resultado`, `escopo`, `comentario`; aprovação: `processo_id`, `numero_eprotocolo`, `link`, `aprovada_em`); alterar só as editáveis (revisão: `escopo`, `comentario`; aprovação: `numero_eprotocolo`, `link`, `aprovada_em`); apagar só na aprovação, que um gatilho limita à volta de etapa. O teste `10_privilegios_padrao` continua passando.

**Dado pessoal:** só nomes de usuários (revisor, quem registrou), já vistos por todo perfil ativo. O comentário é texto livre; a tela orienta não anotar dado pessoal de pessoas do setor. Nenhum e-mail é guardado.

**Storage e Drive:** nenhum bucket, nenhuma mudança na função `arquivos-no-drive`. O teste `01_buckets_privados` continua passando.

#### Quem pode o quê (cada célula vira um teste pgTAP)

"Visitante" é quem não entrou; "Inativo" é qualquer perfil com `ativo` falso em `usuarios`.

| Tabela e ação | Administrador | Integrante do EP | Consulta | Inativo | Visitante |
|---|---|---|---|---|---|
| `revisoes_internas` ler | sim | sim | sim | não | não |
| `revisoes_internas` criar (pela conclusão), alterar | sim | sim | não | não | não |
| `revisoes_internas` apagar | não | não | não | não | não |
| `aprovacoes` ler | sim | sim | sim | não | não |
| `aprovacoes` criar (pela conclusão), alterar | sim | sim | não | não | não |
| `aprovacoes` apagar | só pela volta de etapa | só pela volta de etapa | não | não | não |
| `eventos` de revisão e aprovação ler | sim | sim | sim | não | não |
| `eventos` criar, alterar, apagar | não (só os gatilhos incluem) | não | não | não | não |

Criar, alterar e apagar, além do perfil, passam pelas regras abaixo.

#### Regras que o banco impõe

| Regra | Como | Caso de teste que a prova |
|---|---|---|
| Incluir e alterar só com o processo em andamento | gatilho antes de incluir e alterar nas duas tabelas | processo suspenso, cancelado ou concluído recusado |
| Revisão só com a etapa `revisao_interna` em andamento; aprovação só com `aprovacao_setor` em andamento | gatilho antes de incluir | revisão com a etapa pendente recusada; aprovação na Revisão pelo setor recusada |
| Revisor é quem chama e nunca o autor da versão revisada | gatilho antes de incluir preenche `revisor_id`, `revisada_em` e as versões | autor concluindo "sem alteração" da própria versão recusado; quem assumiu a etapa e depois enviou a versão mais recente, concluindo "sem alteração", recusado |
| "Corrigida": a mais recente é do revisor, e a revisada é a anterior a ela, de outra pessoa; escopo obrigatório. "Sem alteração": revisada é a mais recente; sem escopo | gatilho antes de incluir e restrição | "corrigida" com a mais recente de outra pessoa recusada; "corrigida" com só uma versão recusada; "sem alteração" com escopo recusada; processo sem versão recusado |
| Concluir a `revisao_interna` exige revisão cuja versão revisada (sem alteração) ou corrigida seja a mais recente | gatilho antes de alterar o status de `andamentos` para `concluida` | `avancar_etapa` direto, sem revisão, recusado; com revisão da V7 e V9 mais recente recusado; `concluir_revisao_interna` aceito e a próxima etapa iniciada |
| Revisão e conclusão juntas: se a conclusão falha, a revisão não fica | `concluir_revisao_interna` numa transação | responsável da próxima inativo: nada gravado |
| Concluir a `revisao_setor` exige a versão mais recente completa | o mesmo gatilho | versão sem relatório recusada, com o que falta; sem versão recusada; completa aceita; versão nova completa enviada na própria etapa aceita |
| Aprovação: versão mais recente e completa; uma por processo; link `http(s)`; número e data opcionais | gatilho antes de incluir, restrições e índice único | versão sem .png recusada; segunda aprovação recusada; link `ftp://` recusado; sem número, link e data aceita |
| Data da aprovação nunca no futuro e no dia da última revisão interna ou depois | gatilho antes de incluir e alterar | cada uma recusada, com as datas na frase; data vazia aceita |
| Concluir a `aprovacao_setor` exige aprovação | o gatilho de conclusão | `avancar_etapa` direto, sem aprovação, recusado; `concluir_aprovacao` aceito |
| Voltar para a `aprovacao_setor` ou antes dela apaga a aprovação | dentro de `voltar_a_etapa`; gatilho antes de apagar em `aprovacoes` só aceita durante a volta | voltar à Revisão pelo setor com aprovação: aprovação apagada e evento "desfeita" com o antes; apagar a aprovação direto recusado |
| Versão, resultado, revisor, datas preenchidas e quem registrou não mudam | privilégios de coluna | alterar `versao_id` ou `resultado` recusado |
| Arquivo de versão aprovada não se substitui | gatilho antes de alterar em `arquivos_da_versao` (e conferência na função `substituir_arquivo`) | substituir o relatório da V8 aprovada recusado; substituir na V7 não aprovada aceito; depois da volta que desfaz a aprovação, aceito |
| Etapas `revisao_interna`, `revisao_setor` e `aprovacao_setor` não se desativam nem se excluem | gatilho antes de alterar `ativa` e de apagar em `etapas` | desativar e excluir recusados; renomear e mover aceitos |
| Não excluir processo com revisão ou aprovação | referência recusa apagar; a recusa traz a contagem | excluir processo com 1 revisão recusado |
| Toda mudança vira um evento, com autor, ligado ao processo | gatilhos com entidades `revisao_interna` e `aprovacao` e referência no id do processo | registrar, editar e desfazer geram um evento com antes e depois |
| Eventos novos lidos por todo perfil ativo | política de leitura em `eventos` para as duas entidades | Consulta lê; inativo e visitante não |
| Vale igual para subprocesso, e os registros ficam com o item na reclassificação | nada a mais: os registros apontam o item | revisão e aprovação de um subprocesso aceitas; depois de reclassificar, continuam no item |

#### Regras de estado

- **Revisão pelo setor:** sem estado próprio. A etapa em andamento é o "com o setor"; as idas e voltas são os eventos de etapa que já existem. O Dashboard (v1.5) conta as idas e o tempo com o setor a partir deles.
- **Voltar a uma etapa:** as revisões nunca se apagam e continuam listadas com as suas versões. A aprovação se apaga quando a volta é para a `aprovacao_setor` ou antes dela. Depois de uma volta, as travas olham a versão mais recente, então revisões antigas não bastam se houver versão nova.
- **"Realizada anteriormente"** continua permitida nas três etapas, com nota, sem registro nem trava (processos aprovados antes da plataforma). As etapas são obrigatórias, então não se dispensam.
- **Derivados, não guardados:** versão mais recente, versão completa, se o processo está aprovado.

#### Migração

Nenhuma migração destrutiva: tipos, tabelas, funções, gatilhos e políticas novos; gatilhos novos em `andamentos`, `etapas` e `arquivos_da_versao`; mudança em `voltar_a_etapa` (apagar a aprovação) e em `substituir_arquivo` (versão aprovada), por `create or replace` ou recriação em migração nova. Nenhum dado existente muda. Os processos de teste já concluídos no desenvolvimento não são reavaliados (a trava age só na mudança de status).

## Decisões de teste

- **Bom teste** confere o que a pessoa vê e consegue fazer, ou o que o banco aceita e recusa, nunca detalhes internos.
- **Interface (ponto de teste principal: a tela inteira).**
  - **Como:** Vitest com Testing Library, renderizando o aplicativo inteiro com a implementação falsa nomeada do módulo de revisões, ao lado das falsas do acesso, dos cadastros, dos processos e das versões. A falsa guarda revisões e aprovação, imita as regras e recusas do banco (inclusive a trava na conclusão das três etapas e na substituição, que a falsa de processos e a de versões passam a consultar) e aceita falhas programáveis na leitura e na gravação.
  - **O que cobre:**
    - janela de concluir da Revisão interna: as duas opções com a prévia, "Corrigida" desabilitada sem versão do revisor, o autor impedido com a frase, processo sem versão, o escopo só em "Corrigida"; o mesmo pelo arrastar no Quadro;
    - Revisão pelo setor impedida com versão incompleta e aceita com versão completa; o caso do ajuste pequeno;
    - janela de concluir da Aprovação: a versão aprovada, concluir sem número e com número, link e data; recusas de link e de data; versão incompleta;
    - gaveta com os registros, o link em aba nova, o selo "Aprovada" e o [Substituir] sumindo;
    - voltar com o aviso e a aprovação desfeita;
    - editar os registros e acrescentar o número depois;
    - Consulta sem botões; processo suspenso, cancelado ou concluído sem botões;
    - um subprocesso;
    - catálogo recusando desativar e excluir as três etapas;
    - eventos novos no histórico do processo;
    - estados de carregando, vazio e erro com "Tentar de novo"; recusa e falha ao gravar sem perder o preenchido.
  - **Arte anterior:** `App.avancoDaEtapa`, `App.arrastarParaConcluir`, `App.assumirEAutor`, `App.etapasDoVerso`, `App.arquivosDoVerso`, `App.substituirArquivo`, `App.voltarDatasResponsavel`, `App.historico`.
- **Tradução entre o banco e a tela.** Testes pequenos do módulo de revisões real com o cliente simulado (classe ou função nomeada), provando as chamadas e que cada código de recusa vira a frase. Arte anterior: `andamentosSupabase`, `versoesSupabase`, `recusasDeVersoes`.
- **Funções puras** (opções de resultado que cabem para quem conclui, prévia das versões, versão completa e o que falta, textos do histórico, frases de recusa): testes unitários pequenos.
- **Banco.**
  - **Testes:** pgTAP, um teste por célula da tabela "quem pode o quê" (com um usuário inventado de cada perfil, um inativo e um visitante) e um por regra da tabela de regras.
  - **Testes gerais:** `00_rls_ligada`, `01_buckets_privados` e `10_privilegios_padrao` cobrem as tabelas novas sem mudança.
  - **Testes antigos afetados:** os de andamento, avanço, voltar a etapa, catálogo, exclusão de processo e substituição de arquivo ganham casos (ou ajustes) para as travas novas; casos antigos que concluem as etapas 3 a 5 por `avancar_etapa` passam a montar a revisão, a versão completa e a aprovação antes, ou a usar as funções novas.
  - **Onde rodam:** os testes vêm antes da migração e rodam pelo GitHub Actions ("Testes de banco"). A migração vai pelo workflow "Migrar banco de desenvolvimento".
- Todos os processos, setores, usuários, números de E-protocolo e textos dos testes são inventados.

## Critérios de aceite que se conferem olhando a tela

- [visual] A janela de concluir da Revisão interna e a da Aprovação mostram claramente qual versão é revisada ou aprovada antes de confirmar, sem ficar mais alta que a tela do notebook (1366×768).
- [visual] Os registros na gaveta da etapa seguem o estilo das datas e da nota da gaveta, legíveis e sem quebrar o alinhamento das Etapas.
- [visual] O selo "Aprovada" segue o estilo das pílulas de Arquivos.

## Fora do escopo

- Rodadas com o setor (cada envio e resposta registrados): saíram em 2026-10-17 (ADR 0012). Se o Dashboard (v1.5) precisar, entram como tabela nova.
- E-mails do setor (.eml): não ficam na plataforma.
- Excluir revisão ou aprovação por botão (ADR 0015): a volta de etapa cuida disso.
- Fila de revisão e "revisões pendentes por integrante": Dashboard (v1.5; backlog).
- Devolver ao autor para corrigir: depois (especificação, seção 3, item 4).
- Alertas por e-mail (revisão pendente, setor sem resposta, E-protocolo sem número): v2 (backlog).
- Publicação (etapa 6) e o registro `Publicacao`: v1.5.
- Aviso "estrutura alterada após aprovação" no processo pai (regra 14 da especificação): fica para quando o vínculo de subprocesso com pai aprovado for tratado (backlog).
- Pai esperar a aprovação dos subprocessos: não há regra; cada item se aprova sozinho.
- Prazo e atraso por etapa: Prazos (v1.5).

## Observações

- **Mudança de 2026-10-22 (publicacao-e-arquivamento, ADR 0020):** a Revisão pelo setor passa a se chamar Validação com o setor (código e regra iguais); a janela de concluir a Aprovação ganha a pergunta "Vai para publicação?"; voltar até a Aprovação ou antes também apaga a escolha. O item "Publicação (etapa 6) … v1.5" de Fora do escopo deixa de valer. O detalhe está em `.scratch/publicacao-e-arquivamento/spec.md`.
- **Divergências da especificação:** a `RodadaRevisaoSetor` saiu inteira (ADR 0012); a `RevisaoInterna` previa resultado "aprovado | ajustes" (virou "sem alteração | corrigida", com escopo só na correção); a `Aprovacao` aponta a versão mais recente, que pode ter passado por um ajuste pequeno sem nova ida ao setor, e o número do E-protocolo passou a opcional (ADR 0015).
- **Mudança de 2026-10-17 (no `/to-tickets`):** saíram as rodadas; a trava da Revisão pelo setor passou a ser "versão mais recente completa"; a data da aprovação passou a ser conferida contra a última revisão interna; o subprocesso deixou de ter tratamento à parte.
- **Mudança de 2026-10-19 (no `/planejar`, parte 5 da iniciativa experiencia-do-quadro; ADR 0015):** o [Registrar] separado e a seção "Revisão e aprovação" saíram; a revisão e a aprovação se gravam na janela de concluir e aparecem na gaveta da etapa; o número, o link e a data do E-protocolo passaram a opcionais; voltar desfaz a aprovação; não se exclui registro, só se edita; o "Capturar" virou o [Assumir] já feito na parte 2, com a trava do autor na escolha (ADR 0014); as etapas foram renumeradas (Revisão interna 3, Revisão pelo setor 4, Aprovação 5) depois do ADR 0013, que tirou as etapas do setor (a Revisão pelo setor continua). As quatro decisões de gravação, lugar, volta e correção seguiram a recomendação, sem objeção do usuário; o E-protocolo opcional foi decisão explícita dele.
- **"Realizada anteriormente" nas três etapas, sem trava:** para os processos aprovados antes da plataforma (Importação, funcionalidade 8). Se o usuário quiser exigir os registros também aí, é uma linha a mais no gatilho.
- **Concluídos antigos:** a trava age só quando o status muda, então processos de teste já concluídos no desenvolvimento não são recusados.
- O Drive guarda por 30 dias o conteúdo de um arquivo substituído, em "Gerenciar versões" (ADR 0011); a plataforma não precisa fazer nada para isso.

Entregue em 2026-10-20 (commit 6ce74d6), com ressalva: critérios [visual] presumidos (selo "Aprovada" ao lado das pílulas de Arquivos, janela de edição e registro da Revisão interna na gaveta não foram vistos na tela; a janela de concluir e a gaveta da Aprovação foram vistas na vitrine local, com módulos falsos); função arquivos-no-drive com a trava de versão aprovada ainda sem publicar no desenvolvimento

Em revisão desde 2026-10-22
