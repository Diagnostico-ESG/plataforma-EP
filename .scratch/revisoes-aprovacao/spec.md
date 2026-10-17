# Revisões e aprovação

Status: ready-for-agent

**Como resolve o problema.** Hoje a revisão interna e a aprovação no E-protocolo de cada processo ficam na memória da equipe, em e-mails e no Power BI: não se sabe com segurança quem revisou qual versão, se mudou algo, nem qual versão foi aprovada e com que número. Com esta funcionalidade, o painel do processo ganha a seção **Revisão e aprovação**, em que a equipe registra a revisão interna (por um integrante diferente do autor, que corrige ele mesmo e diz se houve alteração) e a aprovação com o número do E-protocolo. A ida ao setor é a própria etapa de revisão pelo setor: em andamento quer dizer "com o setor", e o "voltar a etapa" que já existe leva o processo de volta à revisão interna quando o setor pede ajustes. As etapas de revisão interna, revisão pelo setor e aprovação podem ser **capturadas** por quem vai fazê-las. O "Concluir" dessas etapas continua manual, mas o banco recusa concluí-las sem o que as comprova, e toda mudança entra no histórico do processo.

Decisões de origem: sabatina de 2026-10-16 (`.scratch/revisoes-aprovacao/sabatina.md`), `CONTEXT.md` (seções "Documentos" e "Revisões e aprovação") e ADRs 0006 (envio não muda a etapa), 0007 (arquivo se substitui sem guardar o anterior), 0009 (conclusão das etapas de revisão com trava), 0011 (versão aprovada não tem arquivo substituído) e 0012 (revisão pelo setor sem rodadas, decidido em 2026-10-17, que substitui a trava da etapa 7 do ADR 0009 e deixa sem objeto o ADR 0010).

## Problema

Depois da modelagem técnica (etapa 5), cada processo passa por três etapas que hoje não deixam rastro confiável: a revisão interna, em que um colega confere o trabalho do autor e muitas vezes o corrige; a revisão pelo setor, em que a versão completa vai ao setor, que aprova ou pede ajustes (e então o processo volta, é revisado e vai de novo); e a aprovação formal, aberta no E-protocolo. A equipe precisa saber, para cada processo, quem revisou e se mudou algo, e qual versão foi aprovada e com que número. Também é preciso impedir que o processo seja dado como aprovado sem E-protocolo, que vá ao setor com versão incompleta, ou que seja revisado pelo próprio autor.

## Solução

- **Capturar** nas etapas de revisão interna, revisão pelo setor e aprovação: enquanto a etapa está sem responsável, Administrador e Integrante veem [Capturar] na linha dela e se põem como responsável com um clique. O seletor de responsável que já existe continua valendo. Na revisão interna, o banco recusa como responsável o autor da versão mais recente.
- **Seção Revisão e aprovação** no painel do processo, logo abaixo de Versões, com dois blocos:
  - **Revisão interna:** as revisões registradas, da mais recente para a mais antiga, cada uma com a versão revisada, o revisor, a data, o resultado ("sem alteração" ou "corrigida, gerou a V8"), o escopo da correção e o comentário. Com a etapa de revisão interna em andamento, [Registrar revisão].
  - **Aprovação:** o número do E-protocolo (como link, se houver link), a data, quem registrou e a versão aprovada ("V8 aprovada"). Com a etapa de aprovação em andamento e sem aprovação, [Registrar aprovação].
  - Em cada registro, [Editar] e, no mais recente de cada tipo, [Excluir], para Administrador e Integrante, quando a regra deixa.
- **Registrar revisão:** formulário no painel. O revisor é quem registra. Resultado "sem alteração" (a versão revisada é a mais recente) ou "corrigida" (o revisor já enviou a versão nova pela seção Versões; a versão nova é a mais recente, e a revisada é a anterior a ela), com o escopo da correção (fluxograma, relatório ou ambos), a data (hoje vem preenchida) e um comentário opcional.
- **Revisão pelo setor:** nenhum registro próprio. Quando o setor pede ajustes, o EP volta à revisão interna pelo "voltar a etapa"; com ajuste pequeno, o EP envia a versão nova pela seção Versões e conclui a etapa sem nova ida ao setor.
- **Registrar aprovação:** número do E-protocolo (obrigatório), link (opcional), data. A versão aprovada é a mais recente, que precisa estar completa.
- **Travas na conclusão** (ADRs 0009 e 0012): o "Concluir" da revisão interna exige uma revisão que cubra a versão mais recente; o da revisão pelo setor exige que a versão mais recente esteja completa (.bpmn, .png e relatório); o da aprovação exige a aprovação registrada.
- **Proteções:** não se volta para antes da etapa de aprovação enquanto houver aprovação (exclui-se a aprovação antes); nenhum arquivo da versão aprovada pode ser substituído (ADR 0011); as três etapas não podem ser desativadas nem excluídas do catálogo.
- **Histórico do processo:** ganha os eventos de revisão e de aprovação registradas, editadas e excluídas, com o antes e o depois. As idas e voltas ao setor já aparecem nos eventos de etapa.

Tudo vale igual para qualquer item (processo, subprocesso ou a classificar): os registros pertencem ao item e ficam com ele na reclassificação, sem tratamento à parte. A aprovação de um processo pai não depende da dos subprocessos.

A Consulta vê a seção inteira, sem nenhum botão. Quem não pode alterar é recusado pelo banco, mesmo que tente fora da tela. A plataforma não guarda e-mails.

## Histórias de usuário

### Capturar

1. Como Integrante, quero ver [Capturar] na etapa de revisão interna sem responsável, para assumir a revisão com um clique.
2. Como Integrante, quero capturar também as etapas de revisão pelo setor e de aprovação, para mostrar à equipe que eu cuido do envio ao setor ou do E-protocolo.
3. Como autor da versão mais recente, quero ser recusado ao capturar a revisão interna dela, com a frase "Quem enviou a versão V7 não pode revisá-la.", para que a revisão seja sempre de outra pessoa.
4. Como Administrador, quero continuar escolhendo o responsável dessas etapas pelo seletor, para redistribuir o trabalho quando alguém se ausenta.
5. Como Administrador, quero ser recusado ao escolher o autor da versão mais recente como responsável da revisão interna.
6. Como usuário, quero que [Capturar] desapareça quando a etapa já tem responsável, para não tirar a etapa de um colega por engano.
7. Como Consulta, quero ver quem é o responsável dessas etapas, sem [Capturar].

### Revisão interna

8. Como revisor, quero registrar "sem alteração", para dizer que a versão de A segue para o setor como está.
9. Como revisor, quero registrar "corrigida" escolhendo o escopo (fluxograma, relatório ou ambos), depois de enviar a versão nova pela seção Versões, para que fique claro que a V8 é minha correção da V7.
10. Como revisor, quero ser recusado ao registrar "corrigida" quando a versão mais recente não é minha, com uma frase que diga isso, para não ligar a correção à versão errada.
11. Como revisor, quero ser recusado ao registrar a revisão de uma versão que eu mesmo enviei.
12. Como revisor, quero a data de hoje preenchida, podendo trocar por uma data passada, para registrar uma revisão feita ontem.
13. Como revisor, quero um comentário opcional, para anotar o que observei.
14. Como Integrante, quero ver as revisões em ordem, com versão, revisor, data, resultado e comentário, para saber o que já foi conferido.
15. Como Integrante, quero ser recusado ao concluir a revisão interna sem uma revisão da versão mais recente, com a frase "Registre a revisão da versão V9 antes de concluir.", para que nenhuma versão vá ao setor sem conferência.
16. Como Integrante, quero que, depois de voltar à revisão interna e enviar uma versão nova, a revisão antiga não sirva para concluir a etapa de novo.
17. Como Integrante, quero registrar a revisão só com a etapa de revisão interna em andamento e o processo em andamento.

### Revisão pelo setor

18. Como Integrante, quero ser recusado ao concluir a revisão pelo setor quando a versão mais recente não tem relatório, .bpmn ou .png, com a frase dizendo o que falta.
19. Como Integrante, quando o setor pede ajustes, quero voltar à revisão interna pelo "voltar a etapa", para revisar a versão nova e mandá-la de novo; ou, se o ajuste foi pequeno, enviar a versão nova e concluir a etapa sem nova ida ao setor.

### Aprovação

20. Como Integrante, quero registrar a aprovação com o número do E-protocolo, o link (se houver) e a data, para formalizar na plataforma o que foi aprovado.
21. Como Integrante, quero que a aprovação aponte a versão mais recente ("V8 aprovada"), para saber qual arquivo vale.
22. Como Integrante, quero ser recusado ao registrar aprovação sem número, com versão incompleta, com data anterior à última revisão interna, ou quando o processo já tem aprovação.
23. Como Integrante, quero ser recusado ao concluir a etapa de aprovação sem a aprovação registrada.
24. Como usuário, quero abrir o E-protocolo pelo link da aprovação, numa aba nova.
25. Como Integrante, quero ser recusado ao substituir um arquivo da versão aprovada, com a frase "A versão V8 foi aprovada e seus arquivos não podem ser substituídos.", e ver o [Substituir] sumir nela.
26. Como Integrante, quero ser recusado ao voltar a uma etapa anterior à aprovação enquanto houver aprovação, com a frase dizendo para excluir a aprovação antes.

### Corrigir registros

27. Como Integrante, quero editar a data e o comentário da revisão e o escopo da revisão "corrigida", para corrigir um engano.
28. Como Integrante, quero editar o número, o link e a data da aprovação.
29. Como Integrante, quero excluir a revisão mais recente ou a aprovação, com confirmação, quando nada depende dela.
30. Como Integrante, quero ser recusado ao excluir a revisão com a etapa de revisão interna concluída, e a aprovação com a etapa de aprovação concluída, com a frase dizendo o que fazer antes.
31. Como Integrante, quero que edições e exclusões fiquem no histórico com o antes e o depois.

### Perfis, situação e catálogo

32. Como Consulta, quero ver a seção inteira, sem botões.
33. Como usuário de qualquer perfil, quero que tudo fique congelado (sem botões, e recusado pelo banco) com o processo suspenso, cancelado ou concluído.
34. Como Administrador, quero ser recusado ao desativar ou excluir as etapas de revisão interna, revisão pelo setor e aprovação no catálogo, e continuar podendo renomeá-las e movê-las.
35. Como usuário inativo ou visitante, não quero ver nada disso.
36. Como Integrante, quero que o subprocesso tenha a mesma seção, com as próprias revisões e aprovação, e que elas fiquem com o item na reclassificação.

### Histórico e estados da tela

37. Como usuário, quero ver no histórico do processo os eventos de revisão e de aprovação, com quem e quando.
38. Como usuário, quero ver "Carregando…" enquanto a seção carrega, "Nenhuma revisão registrada." e "Sem aprovação registrada." quando não há dados, e uma mensagem com [Tentar de novo] quando a leitura falha, inclusive por falta de conexão.
39. Como usuário, quero que uma recusa ou falha ao gravar apareça em vermelho no formulário, sem perder o que preenchi.

## Decisões de implementação

### Interface

- **Capturar** na linha da etapa, ao lado das ações que já existem, nas etapas de código `revisao_interna`, `revisao_setor` e `aprovacao_setor` sem responsável, com status pendente ou em andamento, para Administrador e Integrante, com o processo em andamento. Grava o próprio usuário como responsável pela mesma alteração do seletor de responsável.
- **Seção Revisão e aprovação** no painel do processo (o mesmo painel para qualquer tipo de item), abaixo da seção Versões, no estilo das seções vizinhas, com os dois blocos da Solução. Cada bloco aparece mesmo vazio, com o seu texto de vazio.
- **Formulários** (revisão, aprovação e as edições) abrem no painel, no padrão do formulário de reunião: data com `input type="date"` (hoje preenchido, sem data futura), resultado por botões de escolha, campos de texto. O formulário da revisão mostra, antes de gravar, qual versão será a revisada e qual a nova, conforme o resultado. O da aprovação mostra a versão que vai (a mais recente) e avisa, sem deixar gravar, se ela estiver incompleta.
- **Excluir** usa a janela de confirmação que já existe.
- **Estados da seção:**
  - carregando: "Carregando…";
  - sem dados: os textos de vazio de cada bloco (com os botões para quem pode);
  - erro, inclusive falha de conexão: "Não foi possível carregar as revisões. Verifique a conexão e tente de novo." com [Tentar de novo], no padrão de `ErroAoCarregar`;
  - gravando: botão desabilitado com "Salvando…";
  - recusa ou falha ao gravar: mensagem em vermelho, sem perder o que foi preenchido.
- **Recusas:** cada recusa chega como código do banco (P0001 "motivo:valor", como em processos) e vira frase na tela, num módulo de frases próprio: perfil sem permissão; processo fora de andamento; etapa fora de andamento; revisor é o autor; versão corrigida não é do revisor ou não é a mais recente; versão incompleta (com o que falta); aprovação já registrada; datas fora de ordem ou no futuro (com as datas); conclusão sem revisão, com versão incompleta ou sem aprovação (com a versão quando cabe); volta com aprovação; substituição em versão aprovada; exclusão que não é a mais recente ou com dependência; etapa protegida no catálogo; responsável da revisão interna é o autor.
- **Histórico do processo:** os eventos novos entram na lista de eventos que já existe, com textos próprios.
- **Módulo de revisões:** um módulo próprio, ao lado de versões e reuniões, com a mesma forma (interface com uma implementação real e uma falsa nomeada): listar revisões e aprovação de um processo; registrar, editar e excluir cada um. A real fala direto com as tabelas pela chave publicável; a RLS e os gatilhos decidem. Sem Edge Function e sem Drive.

### Modelo de dados

**Tipos novos:** `resultado_da_revisao` = `sem_alteracao` | `corrigida`; `escopo_da_correcao` = `fluxograma` | `relatorio` | `ambos`.

**Tabela `revisoes_internas`:**

| Coluna | Tipo | Obrigatória | Observação |
|---|---|---|---|
| `id` | uuid | sim | gerado |
| `processo_id` | uuid → `processos` | sim | referência recusa apagar o processo |
| `versao_revisada_id` | uuid → `versoes` | sim | do mesmo processo; preenchida pelo banco: a mais recente (sem alteração) ou a anterior à corrigida |
| `versao_corrigida_id` | uuid → `versoes` | só em "corrigida" | preenchida pelo banco: a mais recente, que precisa ser do revisor |
| `resultado` | `resultado_da_revisao` | sim | |
| `escopo` | `escopo_da_correcao` | só em "corrigida" | nulo em "sem alteração" |
| `revisada_em` | date | sim | não no futuro |
| `comentario` | text | não | até 2.000 caracteres, sem espaços nas pontas, vazio vira nulo |
| `revisor_id` | uuid → `usuarios` | sim | quem chamou, preenchido pelo banco; não muda |
| `registrada_em` | timestamptz | sim | gerado |

**Tabela `aprovacoes`:**

| Coluna | Tipo | Obrigatória | Observação |
|---|---|---|---|
| `id` | uuid | sim | gerado |
| `processo_id` | uuid → `processos` | sim | único (uma por processo); referência recusa apagar o processo |
| `versao_id` | uuid → `versoes` | sim | preenchida pelo banco: a mais recente, completa |
| `numero_eprotocolo` | text | sim | 1 a 60 caracteres, sem espaços nas pontas |
| `link` | text | não | começa com `https://` ou `http://`; até 500 caracteres |
| `aprovada_em` | date | sim | não no futuro; no dia da última revisão interna ou depois |
| `registrada_por` | uuid → `usuarios` | sim | preenchido pelo banco |
| `registrada_em` | timestamptz | sim | gerado |

**"Versão mais recente"** é a de maior número do processo; **"completa"** é a que tem arquivos de papel `bpmn`, `png` e `relatorio`. Uma função pequena em `private` responde cada uma, usada pelos gatilhos.

**Privilégios padrão:** cada tabela nova nasce com `revoke all` de visitante e de logado e concede de volta a logado: ler; incluir só as colunas que a pessoa escolhe (revisão: `processo_id`, `resultado`, `escopo`, `revisada_em`, `comentario`; aprovação: `processo_id`, `numero_eprotocolo`, `link`, `aprovada_em`); alterar só as colunas editáveis (revisão: `escopo`, `revisada_em`, `comentario`; aprovação: `numero_eprotocolo`, `link`, `aprovada_em`); apagar. O teste `10_privilegios_padrao` continua passando.

**Dado pessoal:** só nomes de usuários (revisor, quem registrou), já vistos por todo perfil ativo. O comentário é texto livre; a tela orienta não anotar dado pessoal de pessoas do setor. Nenhum e-mail é guardado.

**Storage e Drive:** nenhum bucket, nenhuma mudança na função `arquivos-no-drive`. O teste `01_buckets_privados` continua passando.

#### Quem pode o quê (cada célula vira um teste pgTAP)

"Visitante" é quem não entrou; "Inativo" é qualquer perfil com `ativo` falso em `usuarios`.

| Tabela e ação | Administrador | Integrante do EP | Consulta | Inativo | Visitante |
|---|---|---|---|---|---|
| `revisoes_internas` ler | sim | sim | sim | não | não |
| `revisoes_internas` criar, alterar, apagar | sim | sim | não | não | não |
| `aprovacoes` ler | sim | sim | sim | não | não |
| `aprovacoes` criar, alterar, apagar | sim | sim | não | não | não |
| `andamentos` capturar (pôr-se como responsável) | sim | sim | não | não | não |
| `eventos` de revisão e aprovação ler | sim | sim | sim | não | não |
| `eventos` criar, alterar, apagar | não (só os gatilhos incluem) | não | não | não | não |

Criar, alterar e apagar, além do perfil, passam pelas regras abaixo.

#### Regras que o banco impõe

| Regra | Como | Caso de teste que a prova |
|---|---|---|
| Registrar, alterar e excluir só com o processo em andamento | gatilho antes de incluir, alterar e apagar nas duas tabelas | processo suspenso, cancelado ou concluído recusado |
| Revisão só com a etapa `revisao_interna` em andamento; aprovação só com `aprovacao_setor` | o mesmo gatilho | revisão com a etapa pendente recusada; aprovação na etapa de revisão pelo setor recusada |
| Revisor é quem chama e nunca o autor da versão revisada | gatilho antes de incluir preenche `revisor_id` e as versões | autor registrando "sem alteração" da própria versão recusado |
| "Corrigida": a versão mais recente é do revisor, e a revisada é a anterior a ela; escopo obrigatório. "Sem alteração": revisada é a mais recente; sem escopo | gatilho antes de incluir e restrição | "corrigida" com a mais recente de outra pessoa recusada; "sem alteração" com escopo recusada; processo sem versão recusado |
| Responsável da etapa `revisao_interna` nunca é o autor da versão mais recente | gatilho antes de alterar `responsavel_id` em `andamentos` | autor capturando a revisão recusado; outro integrante aceito |
| Aprovação: versão mais recente e completa; uma por processo; número obrigatório; link `http(s)` | gatilho antes de incluir, restrições e índice único | aprovação com versão sem .png recusada; segunda aprovação recusada; link `ftp://` recusado |
| Datas: nunca no futuro; aprovação no dia da última revisão interna ou depois | gatilho antes de incluir e alterar | cada uma recusada com as datas na frase |
| Concluir `revisao_interna` exige revisão cuja versão revisada (sem alteração) ou corrigida seja a mais recente | gatilho antes de alterar o status de `andamentos` para `concluida` | concluir sem revisão recusado; concluir com revisão da V7 e V9 mais recente recusado; com revisão "corrigida" que gerou a mais recente aceito |
| Concluir `revisao_setor` exige a versão mais recente completa | o mesmo gatilho | versão sem relatório recusada, com o que falta; versão completa aceita; versão nova completa enviada na própria etapa (ajuste pequeno) aceita |
| Concluir `aprovacao_setor` exige aprovação | o mesmo gatilho | concluir sem aprovação recusado |
| Voltar para etapa anterior à `aprovacao_setor` recusado com aprovação registrada | conferência dentro de `voltar_a_etapa` | voltar à revisão pelo setor com aprovação recusado; voltar à própria aprovação aceito |
| Excluir só a revisão mais recente, e não com `revisao_interna` concluída; aprovação não com `aprovacao_setor` concluída | gatilho antes de apagar | excluir a revisão mais antiga recusado; excluir a aprovação com a etapa reaberta aceito |
| Arquivo de versão aprovada não se substitui | gatilho antes de alterar em `arquivos_da_versao` (e conferência na função `substituir_arquivo`) | substituir o relatório da V8 aprovada recusado; substituir na V7 não aprovada aceito |
| Etapas `revisao_interna`, `revisao_setor` e `aprovacao_setor` não se desativam nem se excluem | gatilho antes de alterar `ativa` e de apagar em `etapas` | desativar e excluir recusados; renomear e mover aceitos |
| Não excluir processo com revisão ou aprovação | referência recusa apagar; a recusa traz a contagem | excluir processo com 1 revisão recusado |
| Toda mudança vira um evento, com autor, ligado ao processo | gatilhos com entidades `revisao_interna` e `aprovacao` e referência no id do processo | registrar, editar e excluir cada um gera um evento com antes e depois |
| Eventos novos lidos por todo perfil ativo | política de leitura em `eventos` para as duas entidades | Consulta lê; inativo e visitante não |
| Vale igual para subprocesso, e os registros ficam com o item na reclassificação | nada a mais: os registros apontam o item | revisão e aprovação de um subprocesso aceitas; depois de reclassificar, continuam no item |

#### Regras de estado

- **Revisão pelo setor:** sem estado próprio. A etapa em andamento é o "com o setor"; as idas e voltas são os eventos de etapa que já existem. O Dashboard (v1.5) conta as idas e o tempo com o setor a partir deles.
- **Voltar a uma etapa:** nada se apaga; revisões e aprovação continuam listadas com as suas versões. A volta para antes da aprovação exige excluir a aprovação antes. Depois de uma volta, as travas olham a versão mais recente, então os registros antigos não bastam se houver versão nova.
- **"Realizada anteriormente"** continua permitida nas três etapas, com nota, sem as travas (processos aprovados antes da plataforma). As etapas são obrigatórias, então não se dispensam.
- **Derivados, não guardados:** versão mais recente, versão completa, se o processo está aprovado.

#### Migração

Nenhuma migração destrutiva: tipos, tabelas, gatilhos, funções e políticas novos; gatilhos novos em `andamentos`, `etapas` e `arquivos_da_versao`; mudança na função `voltar_a_etapa` (conferência da aprovação) e na `substituir_arquivo` (versão aprovada), por `create or replace` em migração nova. Nenhum dado existente muda. Nenhum processo do desenvolvimento tem estas etapas concluídas com dado real a preservar; os concluídos de teste não são reavaliados (a trava age só na mudança de status).

## Decisões de teste

- **Bom teste** confere o que a pessoa vê e consegue fazer, ou o que o banco aceita e recusa, nunca detalhes internos.
- **Interface (ponto de teste principal: a tela inteira).**
  - **Como:** Vitest com Testing Library, renderizando o aplicativo inteiro com a implementação falsa nomeada do módulo de revisões, ao lado das falsas do acesso, dos cadastros, dos processos, das reuniões e das versões. A falsa guarda revisões e aprovação, imita as regras e recusas do banco (inclusive as travas na conclusão das etapas e na substituição, que o falso de processos e o de versões passam a consultar) e aceita falhas programáveis na leitura e na gravação.
  - **O que cobre:**
    - [Capturar] por perfil, sumindo com responsável, e a recusa do autor na revisão interna;
    - registrar revisão "sem alteração" e "corrigida" (com a prévia das versões), e as recusas de autor e de versão errada;
    - concluir a revisão pelo setor recusado com versão incompleta, e aceito com versão completa;
    - registrar aprovação, link abrindo em aba nova, [Substituir] sumindo na versão aprovada;
    - cada trava de conclusão (as três), com a frase; o caso do ajuste pequeno sem nova ida ao setor;
    - voltar com aprovação recusado;
    - editar e excluir (só o mais recente, com confirmação) e as recusas por dependência;
    - Consulta sem botões; processo suspenso, cancelado ou concluído sem botões;
    - a seção num subprocesso;
    - catálogo recusando desativar e excluir as três etapas;
    - eventos novos no histórico do processo;
    - estados de carregando, vazio e erro com "Tentar de novo"; recusa e falha ao gravar sem perder o preenchido.
  - **Arte anterior:** `App.reunioesNoProcesso`, `App.painelDoProcesso`, `App.historico`, os testes da seção Versões e os de voltar a etapa e de responsável.
- **Tradução entre o banco e a tela.** Testes pequenos do módulo de revisões real com o cliente simulado (classe ou função nomeada), provando as chamadas às tabelas e que cada código de recusa vira a frase. Arte anterior: `reunioesSupabase`, `andamentosSupabase`, `recusasDeVersoes`.
- **Funções puras** (prévia das versões da revisão, versão completa, textos do histórico, frases de recusa): testes unitários pequenos.
- **Banco.**
  - **Testes:** pgTAP, um teste por célula da tabela "quem pode o quê" (com um usuário inventado de cada perfil, um inativo e um visitante) e um por regra da tabela de regras.
  - **Testes gerais:** `00_rls_ligada`, `01_buckets_privados` e `10_privilegios_padrao` cobrem as tabelas novas sem mudança.
  - **Testes antigos afetados:** os de andamento, voltar a etapa, catálogo, exclusão de processo e substituição de arquivo ganham casos (ou ajustes) para as travas novas; casos antigos que concluem as etapas 6 a 8 sem registro passam a montá-los antes.
  - **Onde rodam:** os testes vêm antes da migração e rodam pelo GitHub Actions ("Testes de banco"). A migração vai pelo workflow "Migrar banco de desenvolvimento".
- Todos os processos, setores, usuários, números de E-protocolo e textos dos testes são inventados.

## Critérios de aceite que se conferem olhando a tela

- [visual] A seção Revisão e aprovação segue o estilo das seções Versões e Reuniões (títulos, espaçamentos, botões), com os dois blocos separados e legíveis.
- [visual] [Capturar] cabe na linha da etapa sem quebrar o alinhamento das outras ações.
- [visual] Os formulários mostram claramente qual versão será revisada ou aprovada antes de gravar.

## Fora do escopo

- Rodadas com o setor (cada envio e resposta registrados): saíram em 2026-10-17 (ADR 0012). Se o Dashboard (v1.5) precisar, entram como tabela nova.
- E-mails do setor (.eml): não ficam na plataforma.
- Fila de revisão e "revisões pendentes por integrante": Dashboard (v1.5; backlog).
- Devolver ao autor para corrigir: depois (especificação, seção 3, item 4).
- Alertas por e-mail (revisão pendente, setor sem resposta): v2 (backlog).
- Publicação (etapa 9) e o registro `Publicacao`: v1.5.
- Aviso "estrutura alterada após aprovação" no processo pai (regra 14 da especificação): fica para quando o vínculo de subprocesso com pai aprovado for tratado; registrar no backlog.
- Pai esperar a aprovação dos subprocessos: não há regra; cada item se aprova sozinho.
- Prazo e atraso por etapa: Prazos (v1.5).

## Observações

- **Divergências da especificação:** a `RodadaRevisaoSetor` saiu inteira (ADR 0012); a `RevisaoInterna` previa resultado "aprovado | ajustes" (virou "sem alteração | corrigida", com escopo só na correção); a `Aprovacao` aponta a versão mais recente, que pode ter passado por um ajuste pequeno sem nova ida ao setor.
- **Mudança de 2026-10-17 (decisão do usuário, no `/to-tickets`):** saíram as rodadas (tabela, situação "pronto para envio / com o setor", travas de datas entre envio e resposta); a trava da etapa 7 passou a ser "versão mais recente completa"; a data da aprovação passou a ser conferida contra a última revisão interna; o subprocesso deixou de ter tratamento à parte.
- **"Realizada anteriormente" nas três etapas, sem trava:** decidido na escrita da spec, para os processos aprovados antes da plataforma (Importação, funcionalidade 8). Se o usuário quiser exigir os registros também aí, é uma linha a mais no gatilho.
- **Concluídos antigos:** a trava age só quando o status muda, então processos de teste já concluídos no desenvolvimento não são recusados.
- O Drive guarda por 30 dias o conteúdo de um arquivo substituído, em "Gerenciar versões" (ADR 0011); a plataforma não precisa fazer nada para isso.
