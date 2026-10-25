# Publicação e arquivamento

Status: ready-for-agent

**Como resolve o problema (desde 2026-10-23, Andamento livre).** Concluídos passa a ser a última etapa do catálogo, e o processo chega lá movido como em qualquer outra etapa. Para que não se conte como publicado o que não foi, a chegada pede uma de duas coisas:

- a **data da publicação**, com o link se houver; ou
- **Concluir sem publicação**, com uma explicação obrigatória, porque há processos que não se quer divulgar.

A data também se registra antes, na etapa Publicação, ou depois, no processo concluído sem publicação, mesmo arquivado. O processo **suspenso** ou **cancelado** também pode ser arquivado: ele guarda a situação e a etapa, e desarquivar devolve tudo como estava. Somem a pergunta "Vai para publicação?", o "Não vai mais para publicação" e o "Não publicado". A seção "Andamento livre", logo abaixo, vale sobre o resto desta spec no que divergir.

**Como resolvia antes de 2026-10-23.** Hoje o processo some do Quadro assim que a Aprovação pelo setor se conclui, mesmo que a Publicação ainda esteja em andamento. "Não vai ser publicado" só se diz dispensando a etapa, o que parece definitivo e faz as planilhas mostrarem "Dispensada". E um processo concluído não tem outro lugar além da Lista. Com esta funcionalidade:

- Quem conclui a Aprovação responde, na mesma janela, **"Vai para publicação?"**.
- Com "sim", a Publicação entra em andamento e o processo segue no Quadro até ela se resolver.
- Com "não", ele vai direto para a coluna **Concluídos**, a última do Quadro, como **não publicado**. Ainda pode ser publicado depois: basta **Registrar publicação**, com a data.
- Em Concluídos, um Administrador ou Integrante do EP **arquiva** o processo. Ele sai do Quadro e fica só na Lista, continua concluído para todo o resto e pode ser **desarquivado**.
- A etapa "Revisão pelo setor" passa a se chamar **Validação com o setor**.
- As planilhas mostram "Não publicado" na fase VII de quem não foi publicado.

O banco garante a escolha, a regra do concluído e a trava do arquivado. Toda mudança entra no histórico do processo.

Decisões de origem: sabatina de 2026-10-22 (`.scratch/publicacao-e-arquivamento/sabatina.md`); `CONTEXT.md` (Validação com o setor, Vai para publicação, Não publicado, Registrar publicação, Concluídos, Arquivado, Situação do processo); ADR 0020 (escolha de publicação em campo próprio), que se apoia nos ADRs 0004, 0012, 0014, 0015 e 0017.

Esta funcionalidade muda as specs já entregues de `processos-etapas` (Quadro, Lista, verso, situação), `revisoes-aprovacao` (nome da Validação com o setor, janela de concluir a Aprovação, voltar) e `exportacao-e-manutencao` (fase VII e rótulo da situação nas planilhas). Cada uma ganhou uma nota apontando para esta spec e a linha `Em revisão desde 2026-10-22`.

## Andamento livre (mudança de 2026-10-23)

Parte 1 da iniciativa quadro-livre. Decisões de origem: `.scratch/quadro-livre/sabatina-parte-1.md` (itens 4, 7 e 11) e o ADR 0024, que substitui o ADR 0020. Termos no `CONTEXT.md`: Concluídos, Concluir sem publicação, Registrar publicação, Arquivado e Situação do processo. O modelo comum (mover, etiqueta, responsável, passagens, a etapa Concluídos no catálogo) está na seção "Andamento livre" da spec de `processos-etapas`.

### O que deixa de valer no resto desta spec

- **A escolha de publicação sai inteira:**
  - a pergunta "Vai para publicação?" e a coluna `vai_para_publicacao`;
  - "Não vai mais para publicação";
  - a recusa de dispensar a Publicação (não há mais dispensa);
  - "voltar apaga a escolha";
  - o selo "Não publicado".
- **O concluído calculado pela escolha:** concluído passa a ser estar em Concluídos.
- **A Publicação como andamento:** a data da publicação passa a ser campo do processo.
- **Histórias substituídas:** 3 a 15, 18 (o cartão de Concluídos agora se arrasta), 20, 21, 22 (o selo), 27 (o suspenso e o cancelado também se arquivam), 33 (a Publicação "concluída"), 35 a 38 e 44.

Continuam valendo:
- a Validação com o setor;
- a coluna Concluídos sempre visível, com a frase do vazio, em ordem de nome e com os filtros;
- arquivar e desarquivar, com o selo e o filtro "Arquivados" na Lista;
- o arquivado sem outras alterações;
- Registrar publicação, com as recusas de data;
- a Consulta só lendo.

### Solução

- **Chegada a Concluídos** (pela lista "Etapa" do Agora ou arrastando, spec de `processos-etapas`). Se o processo já tem a data da publicação, ele vai direto. Senão, abre a janela "Levar {processo} a Concluídos", com duas opções em botões de escolha, nenhuma marcada ao abrir:
  - **"Publicado"**: Data da publicação (`input type="date"`, hoje por padrão, sem data futura, e não antes da data da aprovação quando há) e Link (opcional, `http://` ou `https://`, até 500 caracteres);
  - **"Concluir sem publicação"**: Explicação (obrigatória, até 2.000 caracteres), com a dica "Por que este processo não será publicado?".

  [Levar a Concluídos] fica desabilitado até a opção escolhida estar completa. Esc ou [Cancelar] não gravam, e o cartão volta. A recusa ou falha aparece em vermelho, sem perder o preenchido.
- **Registrar publicação:**
  - na etapa Publicação, o Agora traz [Registrar publicação], com a mesma Data e o Link;
  - em Concluídos sem publicação e no arquivado sem publicação, o mesmo botão;
  - o processo fica onde está;
  - registrada a data, o botão vira [Corrigir publicação], com a janela preenchida (não no arquivado).
- **Sair de Concluídos** (mover de volta) apaga a explicação de concluir sem publicação, que era a condição daquela chegada. A data da publicação fica, porque a publicação aconteceu. Registrar a publicação num processo já concluído sem publicação grava a data e não apaga a explicação: a tela passa a mostrar "Publicado", e a explicação antiga só sai na próxima saída de Concluídos (decisão da implementação, `desvios.md` de 2026-10-25).
- **Agora em Concluídos:**
  - "Concluído · Publicado em dd/mm/aaaa" (com o link, numa aba nova, quando há) ou "Concluído sem publicação: {explicação}";
  - [Registrar publicação] quando sem publicação;
  - [Arquivar], que é o principal.
- **Cartão em Concluídos:** selo "Sem publicação" quando não há data, no lugar de "Não publicado".
- **Arquivar:**
  - vale para o processo concluído, suspenso ou cancelado, sem motivo;
  - o arquivado sai do Quadro e guarda a situação e a etapa;
  - a Lista mostra a situação e o selo juntos ("Arquivado · Cancelado", "Arquivado · Suspenso", "Arquivado · Concluído");
  - o verso do suspenso e do cancelado traz [Arquivar] ao lado de [Retomar].
- **Desarquivar** devolve tudo como estava: o suspenso volta ao Quadro na etapa dele, o cancelado continua só na Lista, e o concluído volta a Concluídos.
- **O arquivado** só registra a publicação (quando não tem data) e desarquiva. Não se move, não muda a etiqueta, o responsável nem as Anotações, não retoma e não edita.
- **Histórico:**
  - "Concluiu sem publicação", com a explicação como motivo;
  - "Registrou a publicação" e "Corrigiu a publicação", com a data e o link;
  - "Arquivou" e "Desarquivou", como hoje;
  - a explicação apagada ao sair de Concluídos vai no "antes" do evento do movimento.

### Histórias de usuário

46. Como integrante do EP, quero que levar o processo a Concluídos peça a data da publicação ou a explicação de concluir sem publicação, para não contar como publicado o que não foi.
47. Como integrante do EP, quero que o processo que já tem a data da publicação vá a Concluídos direto, sem janela.
48. Como integrante do EP, quero a mesma janela ao arrastar o cartão para Concluídos e ao escolher Concluídos na lista do Agora.
49. Como integrante do EP, quero que, sem escolher uma das duas opções completas, o botão fique desabilitado e o processo não vá.
50. Como integrante do EP, quero concluir sem publicação com uma explicação obrigatória, para os processos que não se quer divulgar.
51. Como integrante do EP, quero que Esc ou [Cancelar] deixem o processo e o cartão onde estavam.
52. Como integrante do EP, quero registrar a data da publicação (com o link) com o processo na etapa Publicação, sem movê-lo.
53. Como integrante do EP, quero registrar a publicação depois, num processo concluído sem publicação, mesmo arquivado, e que ele deixe de ser "sem publicação".
54. Como integrante do EP, quero corrigir a data ou o link de uma publicação registrada, fora do arquivado.
55. Como integrante do EP, quero ser recusado com data futura, antes da data da aprovação ou com link fora de `http(s)`, com a frase e o preenchido mantido.
56. Como integrante do EP, quero que tirar o processo de Concluídos apague a explicação de concluir sem publicação, e que a data da publicação fique.
57. Como integrante do EP, quero ver em Concluídos "Publicado em dd/mm/aaaa" ou "Concluído sem publicação: {explicação}", e o selo "Sem publicação" no cartão.
58. Como integrante do EP, quero arquivar um processo suspenso ou cancelado, além do concluído, para tirá-lo do Quadro sem perder a situação.
59. Como integrante do EP, quero ver na Lista "Arquivado · Cancelado" (ou Suspenso, ou Concluído), para saber como o processo estava.
60. Como integrante do EP, quero que desarquivar devolva o processo à situação e à etapa que tinha.
61. Como integrante do EP, quero que o arquivado não aceite nada além de registrar a publicação e desarquivar, nem pela tela nem fora dela.
62. Como integrante do EP, quero que os processos do desenvolvimento ganhem a data da publicação ou a explicação que corresponde à escolha que tinham, sem nada a fazer à mão.
63. Como Consulta, quero ver a linha da publicação, a explicação e os selos, sem botões nem janelas.

### Decisões de implementação

#### Interface

- **Janela de chegada a Concluídos:** nova, no padrão da janela nativa do ADR 0003. É aberta pelo módulo de processos ao mover para Concluídos sem data e grava por `mover_processo` com a data e o link ou com a explicação.
- **Janela de Registrar publicação:** a de hoje troca a Nota pelo Link e ganha o modo "Corrigir publicação", com a janela preenchida.
- **Saem:**
  - `PerguntaDaPublicacao`;
  - a pergunta na janela de concluir a Aprovação;
  - "Não vai mais para publicação";
  - o aviso "A escolha de publicação será apagada";
  - o selo "Não publicado".
- **Agora:**
  - Concluídos e arquivado como em "Solução";
  - suspenso e cancelado com [Arquivar];
  - arquivado suspenso ou cancelado com "Arquivado · {situação}: {motivo}" e [Desarquivar].
- **Lista:** a pílula de situação e o selo "Arquivado" lado a lado. O filtro "Arquivados" continua.
- **Módulo de processos:**
  - `registrarPublicacao(id, data, link)` troca a nota pelo link e serve também para corrigir;
  - a chegada a Concluídos vai em mover o processo;
  - sai `naoVaiMaisParaPublicacao`.
- **Recusas novas:**
  - "Para ir a Concluídos, informe a data da publicação ou conclua sem publicação."
  - "A explicação é obrigatória para concluir sem publicação."
  - "Registre a publicação com o processo na Publicação ou em Concluídos."
  - "O processo arquivado já tem a publicação registrada."
  - "Só se arquiva processo concluído, suspenso ou cancelado."

  Saem as recusas da escolha.
- **Estados:** a janela mostra "Salvando…" e a recusa ou falha em vermelho, sem perder o preenchido. A coluna Concluídos vazia continua com "Nenhum processo concluído.".

#### Modelo de dados

**`processos`:**
- sai `vai_para_publicacao`;
- entram:
  - `publicado_em`, data, não futura e não antes de `aprovacoes.aprovada_em` quando há;
  - `link_da_publicacao`, texto, `http(s)`, até 500 caracteres, vazio vira nulo;
  - `explicacao_sem_publicacao`, texto, até 2.000 caracteres, sem espaços nas pontas, vazio vira nulo;
- as três mudam só pelas funções (`mover_processo` e `registrar_publicacao`), com o gatilho que já recusa mudança fora delas (marca da transação, como hoje);
- `arquivado_em` continua.

**Regras da chegada e da saída** (dentro de `mover_processo`):
- para Concluídos sem `publicado_em`, exige a data (grava `publicado_em` e o link) ou a explicação (grava `explicacao_sem_publicacao`); sem nenhuma, recusa;
- ao sair de Concluídos, apaga `explicacao_sem_publicacao`;
- invariante: processo em Concluídos tem `publicado_em` ou `explicacao_sem_publicacao`.

**`registrar_publicacao(p_processo, p_data, p_link)`:**
- só com o processo na Publicação, em andamento, ou em Concluídos (arquivado ou não);
- no arquivado, só sem `publicado_em`;
- grava a data e o link, e o processo fica onde está.

**`arquivar_processo` e `desarquivar_processo`:**
- arquivar aceita processo concluído (em Concluídos), suspenso ou cancelado, não arquivado;
- desarquivar só limpa `arquivado_em`;
- a trava do arquivado continua em todos os gatilhos de hoje e passa a valer em `passagens` (mover e etiqueta) e em `responsavel_id`.

**View `processos_com_andamento`:**
- `publicado_em` passa a ser a coluna do processo;
- entram `link_da_publicacao` e `sem_publicacao` (verdadeiro em Concluídos sem `publicado_em`);
- sai `vai_para_publicacao`.

**Funções que saem:** `nao_vai_mais_para_publicacao`, a conferência da escolha e a da dispensa da Publicação.

**Pacote das planilhas:** troca a escolha pela data da publicação (spec de `exportacao-e-manutencao`).

**Dado pessoal:** a explicação é texto livre, e a tela orienta a não anotar dado pessoal de pessoas do setor. Ela fica fora das planilhas.

#### Quem pode o quê (cada célula vira um teste pgTAP)

| Ação | Administrador | Integrante do EP | Consulta | Inativo | Visitante |
|---|---|---|---|---|---|
| ler `publicado_em`, `link_da_publicacao`, `explicacao_sem_publicacao`, `arquivado_em` | sim | sim | sim | não | não |
| levar a Concluídos com data ou explicação | sim | sim | não | não | não |
| registrar ou corrigir publicação | sim | sim | não | não | não |
| arquivar e desarquivar | sim | sim | não | não | não |
| alterar as colunas de publicação ou `arquivado_em` direto | não | não | não | não | não |

#### Regras que o banco impõe

| Regra | Como | Caso de teste que a prova |
|---|---|---|
| Chegar a Concluídos exige data ou explicação | `mover_processo` | sem nenhuma recusado; com data aceito; com explicação aceito; com data já registrada aceito sem parâmetros |
| Explicação obrigatória e com limite | restrição e função | explicação vazia recusada; 2.001 caracteres recusados |
| Data da publicação não futura e não antes da aprovação; link `http(s)` | restrições e funções | amanhã recusada; antes de `aprovada_em` recusada; `ftp://` recusado |
| Sair de Concluídos apaga a explicação e mantém a data | `mover_processo` | os dois casos |
| Registrar publicação só na Publicação ou em Concluídos; no arquivado, só sem data | `registrar_publicacao` | em Não iniciados recusado; arquivado com data recusado; arquivado sem data aceito e continua arquivado |
| Arquivar concluído, suspenso ou cancelado; desarquivar devolve como estava | funções | em andamento fora de Concluídos recusado; suspenso arquivado e desarquivado continua suspenso na mesma etapa |
| Arquivado não se move nem muda etiqueta, responsável e Anotações | gatilhos | os quatro recusados |
| Colunas de publicação só pelas funções | gatilho em `processos` | `update` direto recusado mesmo para Administrador |
| Toda mudança vira evento | gatilhos de evento | concluir sem publicação, registrar e corrigir publicação, arquivar e desarquivar geram evento |

#### Migração dos dados (dentro da migração do Andamento livre)

| Estado antes | Depois |
|---|---|
| escolha "sim" e Publicação concluída ou realizada anteriormente | `publicado_em` = a data de resolução da Publicação; processo em Concluídos |
| escolha "sim" e Publicação em andamento | sem data; processo na etapa Publicação |
| escolha "não" (concluído) | `explicacao_sem_publicacao` = "Concluído sem publicação no modelo anterior da plataforma."; processo em Concluídos |
| concluído sem escolha (Publicação desativada ou ausente do caminho) | a mesma explicação |
| sem escolha e não concluído | nada |

Depois da conversão, apaga `vai_para_publicacao` e as funções da escolha. Roda com os gatilhos de evento desligados.

### Decisões de teste

- **Interface (a tela inteira):**
  - a janela de chegada a Concluídos, pela lista e pelo arrastar: o botão desabilitado sem opção completa, as duas opções, Esc com o cartão de volta, a ida direta com a data já registrada;
  - Registrar e Corrigir publicação na Publicação, em Concluídos e no arquivado, com as recusas;
  - sair de Concluídos apagando a explicação;
  - o Agora de Concluídos e o selo "Sem publicação";
  - arquivar o suspenso e o cancelado, a Lista com "Arquivado · {situação}", desarquivar de volta;
  - o arquivado sem outras alterações;
  - Consulta sem botões.

  Arte anterior: `App.concluidos`, `App.arquivamento`, `App.listaDosArquivados`, `App.registrarPublicacao`. `App.escolhaDePublicacao` e `App.naoVaiMaisParaPublicacao` são apagados.
- **Tradução:** mover com os dados da chegada, `registrarPublicacao` com o link, e as frases novas. Arte anterior: `publicacaoSupabase`, `situacaoSupabase`.
- **Funções puras:** o texto do Agora de Concluídos, o selo "Sem publicação" e a opção completa da janela. Arte anterior: `publicacao`.
- **Banco:** pgTAP, um teste por célula e por regra, e a conversão. Os testes `48` e `49` são reescritos (a escolha sai; o arquivamento ganha suspenso e cancelado).

### Decisões tomadas ao escrever esta seção, a confirmar na leitura

1. Sair de Concluídos apaga a explicação e mantém a data da publicação.
2. Uma publicação registrada se corrige pelo mesmo botão, que vira [Corrigir publicação], fora do arquivado. A Nota da janela antiga vira o Link, que a sabatina pediu.
3. Registrar publicação também vale na etapa Publicação, antes de chegar a Concluídos, como diz o `CONTEXT.md`.
4. A explicação dos processos convertidos é um texto fixo, que diz que vieram do modelo anterior.

### Critérios conferidos olhando a tela

- `[visual]` A janela de chegada a Concluídos mostra as duas opções lado a lado ou uma embaixo da outra, com só os campos da escolhida, sem passar da altura do notebook (1366×768).
- `[visual]` Na Lista, "Arquivado" e a pílula da situação ficam juntos, sem quebrar a linha da tabela.

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
Entregue em 2026-10-25 (commit cc17e13), com ressalva: critérios [visual] vistos só na vitrine local, com módulos falsos (as janelas de registrar revisão e aprovação e qualquer tela com o login real não foram vistas); revisão de segurança foi a de reserva (menos completa); as ressalvas das entregas anteriores seguem valendo
