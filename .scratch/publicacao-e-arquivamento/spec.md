# Publicação e arquivamento

Status: ready-for-agent

**Como resolve o problema.** Hoje o processo some do Quadro assim que a Aprovação pelo setor se conclui, mesmo que a Publicação ainda esteja em andamento. "Não vai ser publicado" só se diz dispensando a etapa, o que parece definitivo e faz as planilhas mostrarem "Dispensada". E um processo concluído não tem outro lugar além da Lista. Com esta funcionalidade:

- Quem conclui a Aprovação responde, na mesma janela, **"Vai para publicação?"**.
- Com "sim", a Publicação entra em andamento e o processo segue no Quadro até ela se resolver.
- Com "não", ele vai direto para a coluna **Concluídos**, a última do Quadro, como **não publicado**. Ainda pode ser publicado depois: basta **Registrar publicação**, com a data.
- Em Concluídos, um Administrador ou Integrante do EP **arquiva** o processo. Ele sai do Quadro e fica só na Lista, continua concluído para todo o resto e pode ser **desarquivado**.
- A etapa "Revisão pelo setor" passa a se chamar **Validação com o setor**.
- As planilhas mostram "Não publicado" na fase VII de quem não foi publicado.

O banco garante a escolha, a regra do concluído e a trava do arquivado. Toda mudança entra no histórico do processo.

Decisões de origem: sabatina de 2026-10-22 (`.scratch/publicacao-e-arquivamento/sabatina.md`); `CONTEXT.md` (Validação com o setor, Vai para publicação, Não publicado, Registrar publicação, Concluídos, Arquivado, Situação do processo); ADR 0020 (escolha de publicação em campo próprio), que se apoia nos ADRs 0004, 0012, 0014, 0015 e 0017.

Esta funcionalidade muda as specs já entregues de `processos-etapas` (Quadro, Lista, verso, situação), `revisoes-aprovacao` (nome da Validação com o setor, janela de concluir a Aprovação, voltar) e `exportacao-e-manutencao` (fase VII e rótulo da situação nas planilhas). Cada uma ganhou uma nota apontando para esta spec e a linha `Em revisão desde 2026-10-22`.

## Problema

A etapa Publicação (código `publicacao`, opcional, fase VII) já existe no catálogo, mas a plataforma a trata mal:

- O concluído é calculado só pelas etapas obrigatórias. Como a Aprovação é a última obrigatória, o processo sai do Quadro ao concluí-la, mesmo com a Publicação em andamento. A equipe perde de vista o que ainda está sendo publicado.
- O único jeito de dizer "não vai para publicação" é dispensar a etapa. Isso soa definitivo, impede registrar a publicação que aconteça depois e faz as planilhas mostrarem "Dispensada".
- O Quadro mostra só processos em andamento e suspensos. Não há onde ver os recém-concluídos nem como tirar de vista os que já não interessam.
- O nome "Revisão pelo setor" não descreve o que a etapa é: o setor valida a versão.

## Solução

- **Validação com o setor:** a etapa `revisao_setor` passa a se chamar "Validação com o setor" no catálogo (por migração), nas frases e nas mensagens. O código e a regra do ADR 0012 não mudam.
- **Pergunta na Aprovação:** a janela de concluir a Aprovação pelo setor ganha a pergunta obrigatória "Vai para publicação?" (Sim | Não), abaixo dos campos do E-protocolo.
  - Com "Sim", a janela pede o responsável da Publicação ("Quem fica com a próxima etapa?"), e a Publicação entra em andamento.
  - Com "Não", a pergunta do responsável some, a Publicação fica pendente, parada, e o processo vai para Concluídos.
  - A mesma pergunta aparece ao registrar a Aprovação como "realizada anteriormente".
  - Com a Publicação desativada no catálogo, a pergunta não aparece.
- **Concluído** passa a ser: todas as obrigatórias resolvidas e, ainda, escolha "não" ou Publicação resolvida.
- **Publicação não se dispensa mais.** Com a Publicação em andamento, o verso oferece "Não vai mais para publicação", com motivo obrigatório. A ação muda a escolha para "não", devolve a Publicação a pendente (sem responsável e sem datas) e leva o processo a Concluídos.
- **Coluna Concluídos:**
  - É a última do Quadro e aparece sempre, mesmo vazia ("Nenhum processo concluído.").
  - Traz os concluídos não arquivados, em ordem de nome.
  - O cartão de lá não se arrasta. Arrastar um cartão da Publicação para Concluídos abre a janela de concluir a Publicação.
  - No agrupamento por responsável, os concluídos não aparecem. Os cancelados continuam só na Lista.
- **Verso de um processo concluído:**
  - O Agora mostra "Concluído" (com "Publicado em dd/mm/aaaa" ou "Não publicado") e o botão principal [Arquivar].
  - Quando não publicado, aparece também [Registrar publicação].
  - Voltar a uma etapa continua como hoje. Voltar até a Aprovação, ou antes dela, também apaga a escolha (a janela de voltar avisa).
  - Voltar à Publicação de um processo publicado reabre só ela, e a escolha continua "sim".
- **Arquivar e desarquivar:**
  - Arquivar não pede motivo. O processo sai do Quadro e fica na Lista com o selo "Arquivado".
  - No verso do arquivado, o Agora mostra "Arquivado" com [Desarquivar] e, quando não publicado, [Registrar publicação]. Não há outro botão de alteração.
  - Desarquivar devolve o processo a Concluídos.
  - Arquivar e desarquivar entram no histórico (quem e quando).
- **Registrar publicação:** num processo não publicado, concluído ou arquivado, a janela pede a **Data da publicação** e uma **Nota** opcional.
  - A data vem com hoje e é editável. Não pode ser depois de hoje nem antes da data da aprovação, quando a aprovação tem data.
  - Ao confirmar, a escolha vira "sim", a Publicação vira concluída com essa data, e o processo fica onde está.
  - O registro entra no histórico, com a nota.
- **Lista:** selo "Arquivado" e o filtro "Arquivados: Mostrar | Esconder", com "Mostrar" por padrão e guardado no endereço da página.
- **Planilhas:**
  - A fase VII de um processo não publicado sai "Não publicado" e não conta como concluída. Isso substitui a exceção "Dispensada".
  - O rótulo da situação fica "Publicado" com a Publicação concluída e "Concluído" com a escolha "não".
  - Arquivado não aparece nas planilhas: o processo arquivado conta como concluído.

Tudo vale igual para processo, subprocesso e a classificar. Cada item tem a própria escolha e se arquiva sozinho, sem depender do pai nem dos subprocessos.

A Consulta vê a coluna Concluídos, os selos, o filtro e os registros, sem nenhum botão. Quem não pode alterar é recusado pelo banco, mesmo que tente fora da tela.

## Histórias de usuário

### Validação com o setor

1. Como usuário, quero ver "Validação com o setor" no lugar de "Revisão pelo setor" no Quadro, no verso, no catálogo, nas janelas e nas mensagens, para que o nome diga o que a etapa é.
2. Como Administrador, quero que um nome que eu já tenha mudado no catálogo não seja sobrescrito pela migração.

### Escolha de publicação

3. Como Integrante, quero responder "Vai para publicação?" na janela de concluir a Aprovação, para decidir ali mesmo o destino do processo.
4. Como Integrante, quero que a janela não deixe concluir sem resposta, com a frase "Responda se o processo vai para publicação.".
5. Como Integrante, quero escolher o responsável da Publicação quando respondo "Sim", e que a Publicação entre em andamento com ele.
6. Como Integrante, quero que, ao responder "Não", a pergunta do responsável suma e o processo vá para Concluídos.
7. Como Integrante, quero a mesma pergunta ao registrar a Aprovação como "realizada anteriormente", para que processos aprovados antes da plataforma também tenham destino.
8. Como Integrante, quero a mesma janela, com a pergunta, ao arrastar o cartão da Aprovação no Quadro.
9. Como Integrante, quero que a pergunta não apareça quando a Publicação estiver desativada no catálogo, e que o processo vá direto para Concluídos.
10. Como Integrante, quero ver no histórico do processo qual foi a escolha, quem a fez e quando.

### Publicação em andamento

11. Como Integrante, quero que o processo com a Publicação em andamento continue no Quadro, na coluna Publicação, até ela se resolver.
12. Como Integrante, quero concluir a Publicação pelo [Concluir] do Agora ou arrastando o cartão para Concluídos, para levá-lo a Concluídos como publicado.
13. Como Integrante, quero registrar "Não vai mais para publicação" com motivo, quando se desiste de publicar no meio, para que o processo vá para Concluídos como não publicado.
14. Como Integrante, quero ser recusado ao tentar dispensar a Publicação, com a frase "A Publicação não se dispensa: use \"Não vai mais para publicação\".", e não ver mais o [Dispensar] nela.
15. Como Integrante, quero continuar podendo registrar a Publicação como "realizada anteriormente", com nota.

### Concluídos

16. Como usuário, quero a coluna Concluídos no fim do Quadro, sempre visível, com os concluídos não arquivados em ordem de nome.
17. Como usuário, quero ver "Nenhum processo concluído." quando a coluna está vazia.
18. Como Integrante, quero que o cartão em Concluídos não se arraste para fora dela.
19. Como Integrante, quero que os filtros do Quadro (setor, macroprocesso, tipo) também valham para a coluna Concluídos.
20. Como Integrante, quero que "Só os meus" e o filtro Responsável não tragam concluídos, porque processo concluído não tem etapa atual nem responsável.
21. Como Integrante, quero que o agrupamento por responsável não mostre concluídos.
22. Como usuário, quero que o cartão em Concluídos mostre a barra completa e o selo "Não publicado" quando for o caso.

### Arquivar e desarquivar

23. Como Integrante, quero arquivar um processo concluído pelo [Arquivar] do verso, sem motivo, para tirá-lo do Quadro.
24. Como Integrante, quero ver o arquivado na Lista com o selo "Arquivado" e poder abri-lo.
25. Como Integrante, quero desarquivar pelo [Desarquivar] do verso e ver o processo de volta em Concluídos.
26. Como Integrante, quero que o arquivado não aceite nenhuma alteração além de Registrar publicação e Desarquivar, nem pela tela nem fora dela.
27. Como Integrante, quero ser recusado ao arquivar um processo que não está concluído.
28. Como usuário, quero ver arquivar e desarquivar no histórico do processo, com quem e quando.
29. Como usuário, quero filtrar a Lista por "Arquivados: Mostrar | Esconder", com "Mostrar" por padrão, e que o filtro fique no endereço da página.

### Registrar publicação

30. Como Integrante, quero registrar a publicação de um processo não publicado, concluído ou arquivado, com a data e uma nota opcional.
31. Como Integrante, quero que a data venha com hoje e que eu possa mudá-la.
32. Como Integrante, quero ser recusado com data depois de hoje ou antes da data da aprovação, com a frase dizendo as datas, sem perder o que preenchi.
33. Como Integrante, quero que, depois do registro, o processo apareça como publicado ("Publicado em dd/mm/aaaa") e fique onde estava (Concluídos ou arquivado).
34. Como Integrante, quero que o [Registrar publicação] não apareça num processo já publicado.

### Voltar

35. Como Integrante, ao voltar até a Aprovação ou antes, quero ser avisado de que a escolha de publicação será apagada ("A escolha de publicação será apagada."), e que ela seja perguntada de novo na próxima conclusão da Aprovação.
36. Como Integrante, ao voltar à Publicação de um processo publicado, quero que só ela reabra e que a escolha continue "sim".
37. Como Integrante, quero que voltar a uma etapa de um processo concluído o devolva ao Quadro, na coluna da etapa reaberta.

### Planilhas

38. Como leitor dos dashboards, quero ver "Não publicado" na fase VII de um processo cuja escolha foi "não", e que essa fase não conte como concluída.
39. Como leitor dos dashboards, quero ver a situação "Publicado" com a Publicação concluída e "Concluído" com a escolha "não".
40. Como leitor dos dashboards, quero que o processo arquivado continue contado como concluído.

### Perfis, estados da tela e dados antigos

41. Como Consulta, quero ver a coluna Concluídos, os selos, o filtro e os registros, sem botões e sem arrastar.
42. Como usuário inativo ou visitante, não quero ver nada disso.
43. Como usuário, quero que uma recusa ou falha ao gravar apareça em vermelho na janela, sem perder o que preenchi, e que o cartão volte ao lugar quando a gravação falha ao soltá-lo.
44. Como Integrante, quero que os processos que já existem no desenvolvimento ganhem a escolha que corresponde ao estado deles, sem nada a fazer à mão.
45. Como Administrador, quero que o subprocesso siga as mesmas regras, com a própria escolha e o próprio arquivamento.

## Decisões de implementação

### Interface

- **Janela de concluir** (`JanelaDeAvanco`): para a etapa `aprovacao_setor`, o bloco da aprovação ganha a pergunta "Vai para publicação?" com dois botões de escolha, sem nenhum marcado ao abrir.
  - "Sim" mostra a escolha do responsável da próxima etapa. "Não" a esconde.
  - O botão principal fica desabilitado até haver resposta.
  - A janela de "realizada anteriormente" da Aprovação ganha a mesma pergunta.
  - O arrastar no Quadro usa a mesma janela.
  - A pergunta só aparece quando o processo tem a Publicação pendente depois da Aprovação.
- **Agora do verso:**
  - Publicação em andamento: [Concluir] e, ao lado do [Assumir] ou no menu da etapa, "Não vai mais para publicação", que abre a janela de motivo no padrão de suspender.
  - Concluído não arquivado: "Concluído", a linha "Publicado em dd/mm/aaaa" ou "Não publicado", [Arquivar] como principal e [Registrar publicação] quando não publicado.
  - Arquivado: "Arquivado", a mesma linha, [Desarquivar] e [Registrar publicação] quando não publicado.
  - No arquivado, o menu do verso e as gavetas não oferecem nenhuma alteração.
- **Janela de Registrar publicação:** Data da publicação com `input type="date"` (hoje por padrão, `max` hoje e `min` na data da aprovação, quando houver) e Nota (até 2.000 caracteres).
- **Gaveta da Publicação:** a [Dispensar] some. "Realizada anteriormente" continua.
- **Quadro:**
  - A função que monta as colunas por etapa acrescenta, no fim, a coluna Concluídos (`chave` fixa) com os concluídos não arquivados.
  - O destino do arrastar a partir da Publicação passa a ser Concluídos, que abre a janela de concluir a Publicação.
  - A coluna Concluídos nunca é origem de arrastar.
  - O agrupamento por responsável continua só com em andamento e suspensos.
- **Cartão:** selo "Não publicado" no concluído com escolha "não". A barra de progresso usa o caminho, como hoje.
- **Lista:** selo "Arquivado" ao lado da situação. Filtro "Arquivados" (Mostrar | Esconder), no endereço como os demais (`arquivados=esconder` quando escondido), e o [Limpar filtros] volta a "Mostrar".
- **Janela de voltar:** quando a etapa escolhida é a `aprovacao_setor` ou anterior e o processo tem escolha, mostra "A escolha de publicação será apagada." junto do aviso da aprovação desfeita.
- **Estados da tela:** Quadro e Lista mantêm os estados de carregando, vazio e erro (com [Tentar de novo], inclusive por falta de conexão) que já têm. A coluna Concluídos vazia mostra "Nenhum processo concluído.". As janelas mostram "Salvando…" ao gravar e a recusa ou falha em vermelho, sem perder o preenchido.
- **Recusas:** cada uma chega como código do banco (P0001 "motivo:valor") e vira frase no módulo de frases de situação ou de etapa:
  - escolha de publicação obrigatória;
  - Publicação não se dispensa;
  - arquivar processo não concluído;
  - processo arquivado (qualquer alteração);
  - desarquivar processo não arquivado;
  - registrar publicação em processo já publicado, sem Publicação no caminho ou não concluído;
  - data da publicação no futuro ou antes da aprovação (com as datas);
  - "não vai mais para publicação" sem motivo ou com a Publicação fora de andamento.
- **Módulo de processos:** a interface ganha `arquivar`, `desarquivar`, `registrarPublicacao` e `naoVaiMaisParaPublicacao`, na implementação real e na falsa nomeada. A conclusão da Aprovação (módulo de revisões) e o avanço (módulo de andamentos) passam a levar a escolha. A real chama as funções do banco pela chave publicável, e a RLS e os gatilhos decidem.
- **Histórico do processo:** eventos com textos próprios para escolha de publicação, "não vai mais para publicação" (com motivo), publicação registrada (com data e nota), arquivado e desarquivado.
- **Textos:** "Revisão pelo setor" sai das frases da tela (versão completa, janelas, rótulos e falsas de teste). O nome da etapa vem do catálogo.

### Modelo de dados

**Colunas novas em `processos`:**

| Coluna | Tipo | Obrigatória | Observação |
|---|---|---|---|
| `vai_para_publicacao` | boolean | não | nulo = sem resposta; `true` = sim; `false` = não. Muda só pelas funções abaixo e pela volta |
| `arquivado_em` | timestamptz | não | nulo = não arquivado. Muda só por arquivar e desarquivar |

**View `processos_com_andamento`** (por `create or replace`, campos novos no fim, sem mudar os antigos):

- `situacao` = `concluido` quando a guardada é `em_andamento`, nenhuma obrigatória está pendente ou em andamento e (`vai_para_publicacao` é `false` ou não há andamento da Publicação pendente ou em andamento).
- Processo concluído não tem etapa atual: os campos `etapa_atual_*` e o responsável vêm nulos.
- Campos novos: `vai_para_publicacao`, `arquivado_em`, `publicado_em` (data de resolução da Publicação, quando resolvida).

**Funções** (sem `security definer`: rodam com a permissão de quem chama, e a RLS decide):

- `avancar_etapa(p_andamento, p_acao, p_nota, p_responsavel, p_vai_para_publicacao)`: parâmetro novo, nulo por padrão.
  - Ao resolver a `aprovacao_setor` com a Publicação pendente depois dela, a resposta é obrigatória e se grava no processo.
  - Com "não", a próxima a iniciar é a primeira pendente depois da Publicação, se houver.
  - Recriada (apaga e cria), com as chamadas antigas ajustadas.
- `concluir_aprovacao(…, p_vai_para_publicacao)`: repassa a escolha a `avancar_etapa`.
- `nao_vai_mais_para_publicacao(p_processo, p_motivo)`: só com a Publicação em andamento. A escolha vira "não", e a Publicação volta a pendente, sem responsável e sem datas, com o motivo no evento.
- `registrar_publicacao(p_processo, p_data, p_nota)`: só em processo concluído (arquivado ou não) com escolha "não" e a Publicação pendente no caminho. A escolha vira "sim", e a Publicação vira concluída com início e fim na data. A nota vai para o evento.
- `arquivar_processo(p_processo)` e `desarquivar_processo(p_processo)`: só em processo concluído não arquivado e em arquivado, respectivamente.
- `voltar_a_etapa`: quando a etapa escolhida é a `aprovacao_setor` ou anterior, também apaga a escolha.
- Dentro dessas funções, uma marca da transação (como `ep.voltando`) libera as mudanças que os gatilhos recusariam fora delas: coluna nova de `processos`, andamento de processo arquivado e transição da Publicação.

**Privilégios:** `grant update (vai_para_publicacao, arquivado_em)` a logado, com o gatilho que só aceita a mudança dentro das funções. O teste `10_privilegios_padrao` continua passando.

**Dado pessoal:** nenhum novo. A nota e o motivo são texto livre, e a tela orienta a não anotar dado pessoal de pessoas do setor.

**Storage, Drive e Edge Functions:**

- Nenhum bucket novo e nenhuma mudança em `arquivos-no-drive`. O teste `01_buckets_privados` continua passando.
- O pacote das planilhas (`private.montar_pacote_das_planilhas`) passa a incluir `vai_para_publicacao`.
- As funções puras das planilhas mudam (fase VII e rótulo), então a função `planilhas-dos-dashboards` precisa ser publicada de novo no desenvolvimento. Esse passo é seu.

#### Quem pode o quê (cada célula vira um teste pgTAP)

"Visitante" é quem não entrou; "Inativo" é qualquer perfil com `ativo` falso em `usuarios`.

| Ação | Administrador | Integrante do EP | Consulta | Inativo | Visitante |
|---|---|---|---|---|---|
| ler `vai_para_publicacao`, `arquivado_em` e `publicado_em` | sim | sim | sim | não | não |
| responder a escolha (concluir a Aprovação) | sim | sim | não | não | não |
| não vai mais para publicação | sim | sim | não | não | não |
| registrar publicação | sim | sim | não | não | não |
| arquivar, desarquivar | sim | sim | não | não | não |
| alterar `vai_para_publicacao` ou `arquivado_em` direto | não | não | não | não | não |
| ler os eventos novos | sim | sim | sim | não | não |

#### Regras que o banco impõe

| Regra | Como | Caso de teste que a prova |
|---|---|---|
| Resolver a `aprovacao_setor` com a Publicação pendente depois exige a escolha | `avancar_etapa` | concluir e "realizada anteriormente" sem escolha recusados; com escolha aceitos |
| "Sim" inicia a Publicação com o responsável; "não" a deixa pendente e inicia a próxima pendente depois dela, se houver | `avancar_etapa` | os dois caminhos; etapa de teste depois da Publicação iniciada no "não" |
| Concluído: obrigatórias resolvidas e (escolha "não" ou Publicação resolvida) | view | "sim" com Publicação em andamento não concluído; "não" concluído; "sim" com Publicação concluída concluído |
| Publicação desativada: sem pergunta, e o processo conclui com a Aprovação | view e `avancar_etapa` | catálogo sem a Publicação: Aprovação concluída sem escolha aceita e processo concluído |
| Publicação não se dispensa | gatilho de andamento | dispensar a Publicação recusado; "realizada anteriormente" aceito |
| Não vai mais para publicação: só com a Publicação em andamento e com motivo | função | sem motivo recusado; Publicação pendente recusado; aceito: escolha "não", etapa pendente sem responsável e datas, evento com motivo |
| Registrar publicação: concluído, escolha "não", Publicação no caminho; data nem futura nem antes da aprovação | função | processo em andamento recusado; já publicado recusado; data de amanhã recusada; data antes de `aprovada_em` recusada; sem aprovação com data, qualquer data passada aceita; aceito em arquivado, que continua arquivado |
| Arquivar só concluído não arquivado; desarquivar só arquivado | funções | arquivar em andamento, suspenso ou cancelado recusado; arquivar duas vezes recusado; desarquivar não arquivado recusado |
| Arquivado não muda nada além de registrar publicação e desarquivar | `conferir_processo_em_andamento` e gatilhos de `processos`, `andamentos`, `versoes`, `arquivos_da_versao`, `revisoes_internas` e `aprovacoes` | voltar etapa, corrigir datas, trocar responsável, enviar versão, substituir arquivo, editar a aprovação, editar o processo, suspender, cancelar, reclassificar e excluir recusados no arquivado |
| Voltar até a Aprovação ou antes apaga a escolha; voltar à Publicação a mantém | `voltar_a_etapa` | os dois casos |
| As colunas novas só mudam dentro das funções | gatilho em `processos` | `update` direto recusado mesmo para Administrador |
| Toda mudança vira evento ligado ao processo, com autor | gatilhos de evento | escolha, desistência, publicação registrada, arquivar e desarquivar geram evento com antes e depois |
| Eventos novos lidos por todo perfil ativo | política de leitura em `eventos` | Consulta lê; inativo e visitante não |
| Vale igual para subprocesso | nada a mais | subprocesso arquivado sem mexer no pai |

#### Regras de estado

- **Escolha:** nulo até a Aprovação; "sim" ou "não" ao resolvê-la. "Não" vira "sim" por Registrar publicação, "sim" vira "não" por "Não vai mais para publicação", e qualquer valor volta a nulo na volta até a Aprovação ou antes.
- **Arquivado** é marca, não situação: a situação continua `concluido`. Voltar a uma etapa, que tiraria o processo de concluído, é recusado no arquivado. Para isso, desarquiva-se antes.
- **Derivados, não guardados:** concluído, publicado (`publicado_em`), não publicado (concluído com escolha "não").

#### Migração

Não destrutiva, com teste antes:

- colunas novas;
- nome da `revisao_setor` trocado só se ainda for "Revisão pelo setor";
- view, funções e gatilhos recriados;
- política de leitura dos eventos novos.

Dados existentes (só há desenvolvimento):

| Situação atual | Depois da migração |
|---|---|
| Publicação concluída, realizada anteriormente ou em andamento | escolha "sim" |
| Publicação dispensada | escolha "não", etapa de volta a pendente e nota apagada |
| Publicação pendente com a Aprovação resolvida | escolha "não" |
| Aprovação não resolvida | sem resposta |

A atualização dos dados roda com os gatilhos de evento desligados, como na migração de 2026-10-18. A migração vai pelo workflow "Migrar banco de desenvolvimento".

## Decisões de teste

- **Bom teste** confere o que a pessoa vê e consegue fazer, ou o que o banco aceita e recusa, nunca detalhes internos.
- **Interface (ponto de teste principal: a tela inteira).**
  - **Como:** Vitest com Testing Library, renderizando o aplicativo inteiro com as implementações falsas nomeadas (acesso, cadastros, processos, andamentos, versões e revisões). A falsa de processos guarda a escolha e o arquivamento, imita as regras e recusas do banco (inclusive a regra nova do concluído e a trava do arquivado) e aceita falhas programáveis.
  - **O que cobre:**
    - pergunta na janela de concluir a Aprovação: sem resposta não conclui; "Sim" com responsável; "Não" sem responsável e o processo em Concluídos; o mesmo pelo arrastar e pela "realizada anteriormente"; sem pergunta com a Publicação desativada;
    - Publicação em andamento no Quadro; concluir pelo verso e arrastando para Concluídos; "Não vai mais para publicação" com motivo; [Dispensar] fora da Publicação;
    - coluna Concluídos sempre visível, vazia com a frase, ordem de nome, sem arrastar para fora, com os filtros, sem concluídos no "Só os meus" e no agrupamento;
    - arquivar, desarquivar, selo e filtro da Lista (com o endereço), arquivado sem botões de alteração;
    - Registrar publicação em concluído e em arquivado, com as recusas de data;
    - voltar com o aviso da escolha apagada e voltar à Publicação mantendo a escolha;
    - "Validação com o setor" nos textos;
    - Consulta sem botões;
    - eventos novos no histórico;
    - recusa e falha ao gravar sem perder o preenchido.
  - **Arte anterior:** `App.aprovacao`, `App.avancoDaEtapa`, `App.arrastarParaConcluir`, `App.agoraDoVerso`, `App.situacaoDoProcesso`, `App.quadro`, `App.soOsMeus`, `App.revisaoDoSetor`, `App.lista`, `App.filtrosDosProcessos`, `App.voltarDatasResponsavel`, `App.historico`.
- **Tradução entre o banco e a tela.** Testes pequenos dos módulos reais com o cliente simulado (classe ou função nomeada), provando as chamadas novas e que cada código de recusa vira a frase. Arte anterior: `situacaoSupabase`, `andamentosSupabase`, `processosSupabase`.
- **Funções puras** (colunas do Quadro com Concluídos, destino do arrastar, filtro de arquivados, texto do Agora concluído, selo "Não publicado", fase VII e rótulo da situação das planilhas): testes unitários pequenos. Arte anterior: `colunasDoQuadro`, `destinoDoArrastar`, `filtrosDosProcessos`, `planilhasFases`, `planilhasProcesso`.
- **Banco.**
  - **Testes:** pgTAP, um teste por célula da tabela "quem pode o quê" (com um usuário inventado de cada perfil, um inativo e um visitante) e um por regra da tabela de regras.
  - **Migração dos dados:** um teste monta processos nos quatro estados antigos e confere a escolha depois, ensaiado dentro de um teste temporário antes de aplicar.
  - **Testes gerais:** `00_rls_ligada`, `01_buckets_privados` e `10_privilegios_padrao` sem mudança.
  - **Testes antigos afetados:**
    - os que concluem a Aprovação passam a responder a escolha;
    - os que dispensam a Publicação passam a usar outra etapa opcional ou a esperar a recusa;
    - os que esperam o concluído pela regra antiga e os do pacote das planilhas são ajustados.
  - **Onde rodam:** os testes vêm antes da migração e rodam pelo GitHub Actions ("Testes de banco").
- Todos os processos, setores, usuários, datas e textos dos testes são inventados.

## Critérios de aceite que se conferem olhando a tela

- [visual] A coluna Concluídos fica no fim do Quadro, com o mesmo estilo das demais, e não empurra o Quadro além da largura do notebook (1366×768) de um jeito diferente das outras colunas.
- [visual] A pergunta "Vai para publicação?" fica clara na janela de concluir a Aprovação, sem a janela passar da altura da tela do notebook.
- [visual] O Agora do processo concluído e do arquivado mostra a situação, a linha da publicação e os botões sem quebrar o alinhamento do verso.
- [visual] Os selos "Arquivado" (Lista) e "Não publicado" (cartão) seguem o estilo das pílulas que já existem.

## Fora do escopo

- Arquivar em lote.
- Mostrar os cancelados no Quadro: continuam só na Lista.
- Trocar o rótulo "Finalizados" no Data Studio: fica com você, por fora (backlog).
- Mudar a fase da Publicação: continua VII.
- Concluídos no agrupamento por responsável.
- Prazos, alertas e Dashboard próprio: v1.5 e v2 (backlog).
- Desfazer uma publicação registrada por botão: a volta à Publicação faz isso.

## Observações

- **Onde está esta spec:** o `/planejar` pede que a demanda que altera uma funcionalidade atualize a spec dela. Esta funcionalidade, porém, está no `projeto.md` com nome e pasta próprios e mexe em três specs entregues. Segui o que já foi feito em revisoes-aprovacao e na mudança do .bpm: spec própria, com uma nota e a linha `Em revisão desde 2026-10-22` em cada spec afetada.
- **Escolhas desta spec que a sabatina não fixou** (adotadas como o caminho mais simples e fácil de desfazer; confirmadas pelo usuário em 2026-10-22):
  1. A pergunta também aparece ao registrar a Aprovação como "realizada anteriormente".
  2. Processo concluído fica sem etapa atual e sem responsável. Por isso, "Só os meus" e o filtro Responsável não trazem concluídos, e o filtro Etapa = Publicação não traz os não publicados.
  3. Arquivado recusa qualquer alteração (dados, etapas, versões, aprovação, situação, reclassificação, exclusão), menos Registrar publicação e Desarquivar.
  4. A data mínima da publicação é a `aprovada_em`. Sem ela (E-protocolo sem data ou Aprovação "realizada anteriormente"), não há mínimo.
  5. A nota de Registrar publicação fica no histórico, não na etapa, porque a etapa concluída não guarda nota hoje.
  6. "Não vai mais para publicação" deixa a Publicação sem responsável e sem datas.
  7. Do Quadro, o arrastar a partir da Aprovação continua indo para a coluna seguinte (Publicação). Quem responde "Não" na janela vê o cartão ir para Concluídos.
  8. "Realizada anteriormente" continua permitida na Publicação em andamento.
- **Divergências da especificação:** a especificação previa a Publicação como registro próprio na v1.5. Ela continua sendo só a etapa, com a escolha no processo (ADR 0020).
- **Exceção na trava do arquivado:** o subprocesso arquivado aceita a propagação de `macroprocesso_id` vinda do processo pai (só dentro do gatilho do pai e sem mudar mais nada). Fora isso, o arquivado recusa tudo, menos Registrar publicação e Desarquivar.

Entregue em 2026-10-23 (commit ae1fb54), com ressalva: critérios [visual] da publicacao-e-arquivamento presumidos (coluna Concluídos, pergunta na janela, selos "Não publicado" e "Arquivado", Agora do concluído e do arquivado não foram vistos na tela); revisão de segurança foi a de reserva (menos completa); as ressalvas das entregas anteriores seguem valendo
