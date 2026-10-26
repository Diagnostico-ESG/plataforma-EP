# Documentos e versões

Status: ready-for-agent

**Como resolve o problema (desde 2026-10-26, Outros anexos).** Além das versões e dos relatórios, cada processo junta arquivos avulsos: o e-mail com a resposta do setor, a planilha que o setor mandou, a foto do quadro da reunião, um .pdf de apoio. Hoje eles ficam fora da plataforma, sem ligação com o processo. O verso ganha a seção **Outros anexos**, em todas as etapas: Administrador e Integrante enviam .pdf, .docx, .xlsx, .png, .jpg, .jpeg ou .eml de até 20 MB, com o nome original, e cada **anexo** fica marcado com a etapa em que o processo estava. Todo perfil vê e baixa. O anexo não tem número nem trava, e não se substitui: o enviado por engano se **retira**, vai para a lixeira do Drive e some de vez em 30 dias (ADR 0027). O histórico guarda envios e retiradas. A seção "Outros anexos", logo abaixo, descreve a mudança.

**Como resolvia antes (Arquivos por etapa, 2026-10-26).** Com o quadro livre, o processo anda pelas etapas sem trava, mas cada etapa tem um produto: o .bpm do piloto na Modelagem piloto, o .bpm técnico e o relatório na Relatório e modelagem técnica. O verso passa a mostrar só o envio que cabe na etapa atual: versão histórica (V5F) em Não iniciados, **versão piloto** (V6P, número digitado) na Modelagem piloto, **versão em sequência** (V7, número dado pela plataforma) e **relatório** com numeração própria (Relatório V2) na técnica e na Revisão interna. Toda versão que não é histórica exige só o .bpm; o .png e o .bpmn entram junto ou depois. O relatório vale para as versões seguintes até sair outro, e somem "relatório pendente" e "sem alteração de conteúdo". A **trava de arquivos** recusa passar da Modelagem piloto sem versão piloto e da técnica sem versão em sequência e relatório, e a janela da trava oferece o envio ali mesmo. A seção "Arquivos por etapa", logo abaixo, vale sobre o resto desta spec no que divergir.

**Como resolvia antes de 2026-10-26.** Hoje os fluxogramas (.bpmn, .png e o .bpm do Bizagi) e os relatórios de cada processo ficam em pastas e e-mails, sem numeração confiável, sem saber quem enviou o quê e quando, e sem ligação com o andamento do processo. Com esta funcionalidade, o painel do processo ganha a seção **Versões**: a equipe envia cada versão (V1, V2…) com o .bpm do Bizagi e o .png, o .bpmn opcional e o relatório, junto ou depois (ADR 0016: o fluxo se vê pelo .png); registra as versões históricas da primeira etapa do trabalho (V5F); acrescenta o relatório que ficou pendente ou marca "sem alteração de conteúdo"; substitui um arquivo enviado por engano; e baixa qualquer arquivo com o nome padrão (`CEE_V6_Nome do processo`). Os arquivos ficam no Drive compartilhado do CED, numa pasta aberta à equipe e organizada por setor e processo; a plataforma entra no Drive por uma conta de serviço do EP, cuja chave fica só numa função do servidor, e o banco guarda apenas os dados de cada arquivo. A plataforma avisa quando um arquivo foi alterado ou apagado direto no Drive. O banco impõe as regras (numeração, versão histórica só antes da primeira nova, processo em andamento, quem pode) e toda mudança entra no histórico do processo.

Decisões de origem: sabatina de 2026-10-15 (`.scratch/documentos-versoes/sabatina.md`), `CONTEXT.md` (seção "Documentos") e ADRs 0005 (versão do processo com os arquivos dentro), 0006 (envio não muda a etapa), 0007 (arquivo se substitui sem guardar o anterior) e 0008 (arquivos no Drive compartilhado por conta de serviço). Mudança de 2026-10-20 (sabatina do visualizador, que saiu da v1): ADR 0016 (versão exige .bpm e .png; .bpmn opcional); ver a seção "Mudança de 2026-10-20".

## Outros anexos (mudança de 2026-10-26)

Parte 4 da iniciativa quadro-livre. Decisões de origem: `.scratch/quadro-livre/sabatina-parte-4.md` (itens 1 a 14), o mapa (`.scratch/quadro-livre/mapa.md`, Q17) e o ADR 0027 (o anexo se retira e vai para a lixeira do Drive). Continuam valendo os ADRs 0008 (Drive compartilhado por conta de serviço) e 0022 (andamento livre). Termos no `CONTEXT.md`: **Anexo** e **Retirar anexo**. Nada da seção "Arquivos por etapa" muda: versões e relatórios seguem como estão, e o anexo nunca entra na versão.

### Solução

- **Seção "Outros anexos" no verso**, na coluna esquerda, abaixo das versões, em todas as etapas e para todos os perfis: lista única, do mais recente ao mais antigo; cada linha com o nome original, a etapa do envio, quem enviou, a data e [Baixar]; para Administrador e Integrante, com o processo em andamento, [Retirar] em cada linha e [Enviar anexo] no topo da seção.
- **Enviar anexo:** formulário que abre e fecha pelo mesmo botão e rola até aparecer inteiro (o padrão da parte 3), com um campo de arquivo (um arquivo por envio) e [Enviar]. Aceita .pdf, .docx, .xlsx, .png, .jpg, .jpeg e .eml, até 20 MB; o aviso de extensão errada ou tamanho maior vem antes do envio. Sem descrição. O anexo guarda a etapa atual do processo no envio, que não muda depois.
- **Retirar:** confirmação "Retirar 'resposta.eml'? O arquivo vai para a lixeira do Drive e some em 30 dias.", sem motivo. O anexo sai da lista; o arquivo vai para a lixeira do Drive.
- **Drive:** subpasta "Anexos" dentro da pasta do processo, criada no primeiro anexo; o arquivo fica com o nome original. A subpasta acompanha a pasta do processo quando ela é renomeada ou movida.
- **Conferência com o Drive:** os anexos entram na conferência que já existe (arquivo sumido, alterado ou fora da raiz do ambiente; a conferência não checa a subpasta, como a das versões), com as mesmas marcas da lista de versões.
- **Histórico do processo:** "Enviou o anexo 'resposta.eml' (Modelagem piloto)" e "Retirou o anexo 'resposta.eml'".

A Consulta vê a seção e baixa, sem botões. Processo suspenso, cancelado, concluído ou arquivado: só ler e baixar (por isso, em Concluídos não entra anexo; diverge do "em todas as etapas" do mapa, por decisão do usuário, sabatina item 7). O subprocesso tem os próprios anexos, na subpasta "Anexos" da pasta dele; o pai não mostra os dos filhos. Os anexos ficam fora das planilhas dos dashboards.

### Histórias de usuário

#### Enviar

112. Como integrante do EP, quero anexar ao processo o e-mail, a planilha, a imagem ou o documento que recebi, para que fiquem junto do processo e não em pastas soltas.
113. Como integrante do EP, quero enviar anexo em qualquer etapa, de Não iniciados à Publicação, com o processo em andamento.
114. Como integrante do EP, quero que o anexo guarde a etapa em que o processo estava no envio, e que ela não mude quando o processo se move.
115. Como integrante do EP, quero que o anexo fique com o nome original, para reconhecê-lo como veio.
116. Como integrante do EP, quero ser avisado antes do envio se o arquivo tem extensão fora da lista (.pdf, .docx, .xlsx, .png, .jpg, .jpeg, .eml) ou passa de 20 MB, com a frase dizendo o recebido e o esperado.
117. Como integrante do EP, quero que o formulário abra e feche pelo mesmo botão e role até aparecer inteiro.
118. Como integrante do EP, quero ver o progresso do envio e, se falhar, a mensagem sem perder o arquivo escolhido.
119. Como integrante do EP, quero poder enviar dois anexos com o mesmo nome, porque e-mails costumam ter nomes iguais.
120. Como integrante do EP, quero que enviar um anexo não mova o processo, não mude a etiqueta nem o responsável.

#### Ver e baixar

121. Como usuário (inclusive Consulta), quero ver todos os anexos do processo numa lista só, em todas as etapas, do mais recente ao mais antigo, com a etapa, quem enviou e a data.
122. Como usuário (inclusive Consulta), quero baixar qualquer anexo com o nome original, sem precisar ser membro do Drive.
123. Como usuário, quero ver "Nenhum anexo." quando o processo não tem anexos.
124. Como usuário, quero ver o anexo sumido, alterado ou fora da pasta no Drive marcado na conferência, como as versões.

#### Retirar

125. Como integrante do EP, quero retirar um anexo enviado por engano, com uma confirmação, para que ele saia da lista.
126. Como integrante do EP, quero que qualquer Administrador ou Integrante possa retirar, não só quem enviou.
127. Como integrante do EP, quero que o arquivo retirado vá para a lixeira do Drive, para ainda dar para recuperá-lo direto no Drive por 30 dias, e depois sumir.
128. Como integrante do EP, quero que, se a retirada falhar, o anexo continue na lista e eu veja a mensagem.
129. Como integrante do EP, quero que versão, relatório e .pdf da aprovação continuem sem retirada.

#### Perfis, situação, histórico, subprocesso

130. Como Consulta, quero ver e baixar os anexos, sem [Enviar anexo] nem [Retirar].
131. Como integrante do EP, quero que o processo suspenso, cancelado, concluído ou arquivado não tenha envio nem retirada de anexo, e que a plataforma recuse mesmo fora da tela.
132. Como usuário, quero ver no histórico do processo cada anexo enviado (com a etapa) e cada anexo retirado, com quem e quando.
133. Como integrante do EP, quero que o subprocesso tenha os próprios anexos, na própria pasta, e que o pai não mostre os dos filhos.
134. Como administrador, quero que o banco e a função do servidor recusem envio e retirada de quem não pode, mesmo fora da tela.

### Decisões de implementação

#### Interface

- **Componente da seção de anexos** no verso, abaixo da seção de versões, com o formulário de envio (campo de arquivo nativo com `accept` dos sete formatos) e a confirmação da retirada na moldura de confirmação que já existe.
- **Módulo de anexos** próprio (listar, enviar, baixar, retirar), com a tradução das recusas em frases e uma falsa nomeada que imita as recusas do banco e da função. Baixar e conferir reaproveitam o caminho das versões.
- **Estados da seção:** carregando (junto com o verso), "Nenhum anexo.", erro com [Tentar de novo] (inclui falha de conexão), conferência que falhou, "Enviando…" com o progresso, falha do envio em vermelho sem perder o arquivo escolhido, falha da retirada em vermelho com o anexo ainda na lista.
- **Recusas, com a frase:**
  - formato fora da lista: "O anexo precisa ser .pdf, .docx, .xlsx, .png, .jpg, .jpeg ou .eml; recebido: {extensão}.";
  - tamanho: "O anexo pode ter até 20 MB; recebido: {tamanho}.";
  - processo fora de andamento ou arquivado;
  - perfil sem permissão;
  - anexo já retirado (retirada repetida, por exemplo em duas abas).

#### Função do servidor (`arquivos-no-drive`)

- Novo papel `anexo` em `iniciar_envio`, `registrar`, `baixar` e `conferir`, e uma ação nova `retirar`.
- **Nome:** o original, sem o nome padrão (só o limite de 300 caracteres e a troca dos caracteres que o Drive não aceita, pela regra de caracteres que já existe); a conferência do registro não exige o rótulo da versão no nome, só que o arquivo esteja na subpasta "Anexos" do processo e tenha ao menos 1 byte.
- **Subpasta:** criada no primeiro envio dentro da pasta do processo, e o identificador dela guardado no banco, como o da pasta do processo.
- **Retirar:** confere quem pede (Administrador ou Integrante ativo) e a situação do processo, manda o arquivo para a lixeira do Drive pelo `drive_id` guardado (conferindo antes que o arquivo está dentro da subpasta "Anexos" registrada do processo, que se chama "Anexos" e está debaixo da raiz do ambiente; o `baixar` do anexo confere o mesmo, e o envio só usa a subpasta registrada se ela tem esse nome) e então apaga o registro no banco com o token de quem pediu. Se o banco falhar, a função tira o arquivo da lixeira e devolve a recusa.
- O arquivo puro de decisão ganha o papel e a ação, com a tabela de perfis de sempre: Administrador e Integrante enviam e retiram; Consulta só baixa e confere; inativo e sem login, nada.
- **Precisa ser publicada de novo no desenvolvimento** (passo do usuário).

#### Modelo de dados

**Tabela nova `anexos`:**

| Coluna | Tipo | Obrigatória | Observação |
|---|---|---|---|
| `id` | uuid | sim | |
| `processo_id` | uuid | sim | o processo ou subprocesso dono |
| `etapa_id` | uuid | sim | a etapa atual do processo no envio, preenchida pelo banco |
| `nome` | text | sim | nome original, até 300 caracteres |
| `formato` | text | sim | pdf, docx, xlsx, png, jpg, jpeg ou eml |
| `tamanho` | bigint | sim | em bytes, de 1 a 20 MB |
| `hash_md5` | text | sim | para a conferência com o Drive |
| `drive_id` | text | sim | |
| `enviado_por` | uuid | sim | preenchido pelo banco |
| `enviado_em` | timestamptz | sim | preenchido pelo banco |

**Tabela `processos`, alterada:** coluna nova `drive_pasta_dos_anexos` (text, opcional), o identificador da subpasta "Anexos", preenchida no primeiro envio.

**Quem pode o quê** (RLS):

| Tabela e ação | Administrador | Integrante do EP | Consulta | Inativo | Visitante sem login |
|---|---|---|---|---|---|
| `anexos` ler | sim | sim | sim | não | não |
| `anexos` criar (processo em andamento, não arquivado) | sim | sim | não | não | não |
| `anexos` alterar | não | não | não | não | não |
| `anexos` apagar (retirar; processo em andamento, não arquivado) | sim | sim | não | não | não |

**Dado pessoal:** o nome do arquivo e o conteúdo do .eml podem ter nome, e-mail e conversa de pessoas reais; todo perfil ativo vê e baixa (sabatina item 8; validação de LGPD pelo jurídico segue no backlog). O conteúdo fica só no Drive, nunca no banco. O nome original pode trazer nome de pessoa e vai assim ao Drive e ao banco (a regra de guardar por identificador é a do Storage, que o projeto não usa; ADR 0008); por isso, os logs e as mensagens de erro da função nunca trazem o nome do anexo, só o identificador.

**Arquivos (no Drive, sem Storage):** .pdf, .docx, .xlsx, .png, .jpg, .jpeg e .eml; até 20 MB; Administrador e Integrante enviam e retiram; todo perfil ativo vê e baixa; sem substituição; a retirada manda o arquivo à lixeira do Drive (apagado de vez em 30 dias, ADR 0027). Nenhum bucket.

**Regras que o banco impõe:**

| Regra | Como | Caso de teste que a prova |
|---|---|---|
| Só Administrador e Integrante ativos enviam e retiram; todo perfil ativo lê | políticas de RLS e privilégios | Consulta lê e não inclui nem apaga; inativo e visitante não leem |
| Envio e retirada só com o processo em andamento e não arquivado | gatilho antes de incluir e de apagar | suspenso, cancelado, concluído e arquivado recusados nas duas ações |
| Formato da lista, tamanho de 1 byte a 20 MB, nome até 300 caracteres | restrições | .exe recusado; 20 MB + 1 byte recusado; 0 byte recusado |
| Etapa, autor e data preenchidos pelo banco | gatilho antes de incluir | etapa enviada pela tela ignorada; anexo guarda a etapa atual |
| Anexo não se altera | sem privilégio de alteração | alteração do nome recusada |
| Processo com anexo não se exclui | ligação com recusa na exclusão | excluir processo com um anexo recusado; depois de retirado, aceito |
| Envio e retirada viram evento no histórico, com o nome e a etapa | gatilhos depois de incluir e de apagar | um evento por envio e por retirada, com o nome guardado mesmo depois de apagada a linha |

**Regras de estado:** o anexo não tem situação; mover o processo não mexe nos anexos; a etapa do anexo nunca muda. O processo com anexo não se exclui, como o processo com versão (a ligação recusa a exclusão, e a recusa diz quantos anexos há); a etapa do catálogo com anexo também não, o que já vale porque um processo passou por ela.

**Migração:** só cria (tabela, coluna, políticas, gatilhos, eventos), nada destrutivo. Teste pgTAP antes; vai pelo workflow "Migrar banco de desenvolvimento".

### Decisões de teste

- **Bom teste** confere o que a pessoa vê e consegue fazer, ou o que a função e o banco aceitam e recusam, nunca detalhes internos.
- **Interface (ponto de teste principal: a tela inteira).** Vitest com Testing Library, renderizando o aplicativo inteiro com as falsas nomeadas, como nos `App.*` de hoje (arte anterior: `App.pdfDaAprovacao`, `App.enviarVersao`, `App.baixarArquivo`, `App.conferenciaNoDrive`, `App.versoesNoHistorico`). O que cobre: a seção em várias etapas (Não iniciados, Modelagem piloto, Validação com o setor, Concluídos); enviar com sucesso e a linha nova com a etapa; o anexo mantendo a etapa depois de mover; extensão e tamanho recusados antes do envio; falha do envio sem perder o arquivo; dois anexos com o mesmo nome; baixar; retirar com a confirmação, cancelar a confirmação, falha da retirada; Consulta sem botões; suspenso, concluído e arquivado sem botões; subprocesso com os próprios anexos; os eventos no histórico; a marca da conferência.
- **Funções puras:** formato e tamanho aceitos, texto dos eventos, ordem da lista. Arte anterior: `formularioDeVersao`, `eventosDaValidacaoEDoPdf`.
- **Função do servidor:** o arquivo puro de decisão, no Vitest, com o papel `anexo` e a ação `retirar` por perfil e situação, e a regra do nome original. A ponta a ponta (lixeira e volta da lixeira) se confere publicando no desenvolvimento. Arte anterior: `decisao.test`.
- **Tradução entre o servidor e a tela:** o módulo real com o cliente e o `fetch` simulados, para enviar, retirar e as frases das recusas. Arte anterior: `versoesSupabase.pdf.test`.
- **Banco:** pgTAP, um teste novo cobrindo cada linha da tabela de regras e cada célula de "quem pode o quê", no Docker local e pelo "Testes de banco" na conferência final; `10_privilegios_padrao` e `46_funcoes_e_views_seguras` continuam passando.
- Todos os processos, setores, usuários, nomes e conteúdos de arquivo dos testes são inventados, inclusive os .eml.

### Fora do escopo desta parte

- Substituir anexo; descrição do anexo; enviar vários arquivos de uma vez.
- Restringir o .eml a alguns perfis (fica para a validação de LGPD, no backlog).
- Ver o conteúdo do anexo na plataforma (abre-se o arquivo baixado).
- Anexo em processo concluído ou arquivado.
- Anexos nas planilhas dos dashboards e na exportação em CSV (que está no backlog).
- Recuperar da lixeira pela plataforma (só direto no Drive).

### Decisões tomadas ao escrever esta seção, a confirmar na leitura

1. **A retirada apaga a linha do banco**, e o histórico guarda o nome e a etapa no evento; não há marca de "retirado" na tabela.
2. **A ordem da retirada é Drive primeiro, banco depois**, com volta da lixeira se o banco falhar, para nunca ficar um registro apontando para um arquivo na lixeira sem aviso nem um arquivo com dado pessoal fora da lixeira sem registro.
3. **O identificador da subpasta "Anexos" fica guardado no processo**, como o da pasta do processo, para ela ser achada depois de renomeada.
4. **Um arquivo por envio**, para manter o formulário e o progresso iguais aos das versões.
5. **A seção fica abaixo das versões, na coluna esquerda do verso.**
6. **A conta de serviço precisa poder mandar arquivos à lixeira** no Drive compartilhado (papel de "Gerente de conteúdo" ou acima); se o papel atual não permitir, o ticket diz o passo ao usuário.

### Divergência com `.scratch/especificacao.md`

- A especificação previa o .eml como anexo dos registros de envio e resposta ao setor (seção 4, e-mails do setor). Esses registros saíram (ADR 0012), e o .eml entra agora como anexo do processo, marcado com a etapa.
- A especificação não prevê retirar arquivo. O anexo se retira (ADR 0027); versões e relatórios continuam sem.

### Critérios conferidos olhando a tela

- `[visual]` A seção "Outros anexos" fica abaixo das versões, com as linhas no padrão da lista de versões (nome, etapa, autor, data em mono), e o nome longo se corta sem quebrar a linha.
- `[visual]` O formulário de envio aberto rola até aparecer inteiro e fecha pelo mesmo botão.
- `[visual]` A confirmação da retirada mostra o nome do arquivo e a frase da lixeira sem passar da altura do notebook (1366×768).

### Outras specs afetadas

- Nenhuma. O histórico do processo (spec de `processos-etapas`) só ganha os dois textos de evento, descritos aqui.

## Arquivos por etapa (mudança de 2026-10-26)

Parte 3 da iniciativa quadro-livre. Decisões de origem: `.scratch/quadro-livre/sabatina-parte-3.md` (itens 1 a 11 e 15 a 22), o mapa (`.scratch/quadro-livre/mapa.md`, Q14 e Q15) e os ADRs 0025 (arquivos por etapa, só o .bpm exigido, trava na Modelagem piloto e na técnica; substitui o 0016) e 0026 (relatório com numeração própria; muda o 0005 só no relatório). Continuam valendo os ADRs 0007, 0008 e 0011, o 0022 (andamento livre) e o 0024 (trava de Concluídos). Termos no `CONTEXT.md`: Versão, Versão em sequência, Versão piloto, Versão histórica, Relatório, Trava de arquivos e Substituir arquivo. A data da validação e o .pdf da aprovação, da mesma parte, estão na spec de `revisoes-aprovacao` (seção "Data da validação e .pdf da aprovação"); esta seção descreve o que muda na função do servidor para o .pdf. A mudança no movimento (trava ao mover) é descrita aqui e afeta a spec de `processos-etapas`.

### O que deixa de valer no resto desta spec

- **"Versão nova"** passa a ser de dois tipos: a versão piloto (V6P) e a versão em sequência (V7). Onde o texto antigo diz "versão nova", vale "versão em sequência", salvo nas regras de numeração e de arquivos abaixo.
- **Arquivos exigidos (ADR 0016 e histórias 51 a 62):** a versão piloto e a versão em sequência exigem só o .bpm; .png e .bpmn são opcionais. A versão histórica continua como está. A "versão completa" (.bpm, .png e relatório) já não trava nada desde o ADR 0023 e sai também de `private.papeis_que_faltam`, que fica sem uso.
- **Relatório:** saem "relatório pendente", [Acrescentar relatório], [Sem alteração de conteúdo], a marca "copiado de" e a ação `sem_alteracao` da função. O relatório deixa de ter o número da versão e passa a ter o seu (Relatório V1, V2…). Só .docx nos envios novos. Histórias 5, 22 a 27 e 45 (na parte do relatório) substituídas.
- **Observação da versão:** sai do formulário, da lista e do banco (história 6).
- **Onde se envia:** os botões de envio deixam de aparecer em qualquer etapa (história 13 continua: qualquer integrante envia, sendo ou não o responsável).
- **Formulários** abrem e fecham pelo mesmo botão e rolam até aparecer inteiros.
- **"Acrescentar o .bpmn depois"**, que estava fora do escopo, entra: [Acrescentar .png] e [Acrescentar .bpmn].

### Solução

- **O verso mostra só o envio da etapa atual** (para Administrador e Integrante, com o processo em andamento); a lista de versões aparece em todas as etapas, para todos:
  - **Não iniciados:** [Registrar versão histórica], enquanto não há versão piloto nem em sequência.
  - **Modelagem piloto:** [Enviar versão piloto], enquanto não há versão em sequência.
  - **Relatório e modelagem técnica** e **Revisão interna:** [Enviar versão] e [Enviar relatório].
  - **Validação com o setor, Aprovação pelo setor, Publicação, Concluídos e etapas novas do catálogo:** nenhum envio de versão nem de relatório. Correção pedida pelo setor: o processo volta à Revisão interna.
- **Enviar versão piloto:** número digitado (vem preenchido com o menor aceito, maior que o de todas as versões do processo), .bpm obrigatório, .png e .bpmn opcionais. Prévia do rótulo (V6P) e dos nomes. Pode haver mais de uma, cada uma com número maior que o das anteriores.
- **Enviar versão** (em sequência): número dado pela plataforma, a partir do maior que já existe, de qualquer tipo (V5F → V6P → V7). .bpm obrigatório; .png, .bpmn e relatório (.docx) opcionais. Com o relatório junto, ele recebe o próximo número de relatório e fica ligado a esta versão.
- **Enviar relatório:** só o .docx, sem versão; a prévia diz "Relatório V3, acompanha a V8" (a versão mais recente, de qualquer tipo que não seja histórica).
- **Relatório que vale:** cada versão mostra os relatórios enviados com ela ou depois dela, enquanto era a mais recente ("Relatório V2", "Relatório V3"); a versão sem relatório próprio mostra o último anterior, "Relatório V2 (da V7)"; antes do primeiro relatório, nada. O relatório da versão histórica aparece como "Relatório da V5F", e os .pdf antigos continuam como estão, sem número.
- **Acrescentar depois:** na versão piloto ou em sequência que não tem .png ou .bpmn, [Acrescentar .png] e [Acrescentar .bpmn], exceto na versão aprovada. Valem em qualquer etapa com o processo em andamento, porque completam uma versão que já existe.
- **Substituir:** nos arquivos da versão piloto e da versão em sequência e em cada relatório numerado. A versão histórica e a versão aprovada, com os relatórios ligados a ela, continuam sem [Substituir] (ADR 0011).
- **Trava de arquivos (ADR 0025):** ao mover o processo para a frente (pela lista do Agora ou arrastando), se ele vem de uma etapa com trava ou de antes dela e vai para depois dela, faltando o que ela exige:
  - **Modelagem piloto:** uma versão piloto;
  - **Relatório e modelagem técnica:** uma versão em sequência e um relatório numerado, sem importar a ligação entre os dois.

  O processo não se move e abre a janela "Para sair da Modelagem piloto, envie a versão piloto (.bpm)" (ou "… da Relatório e modelagem técnica, envie a versão e o relatório", dizendo só o que falta), com o formulário de envio ali mesmo e o botão [Enviar e mover]. Depois do envio, o processo se move. Se a ida passa por duas etapas com trava, a janela da segunda abre depois da primeira; se o destino é Concluídos, a janela da chegada (ADR 0024) vem por último. Voltar, mudar a etiqueta e mover o processo que já estava depois da etapa não travam.
- **Histórico:** eventos novos de versão piloto enviada, relatório enviado e arquivo acrescentado; os eventos antigos ("relatório acrescentado", "sem alteração de conteúdo") mantêm o texto.

A Consulta vê tudo (versões, relatórios, rótulos, o relatório que vale) e baixa, sem nenhum botão. O subprocesso tem as mesmas regras, com numeração e travas próprias, sem herdar do pai.

### Histórias de usuário

#### Envio por etapa

63. Como integrante do EP, quero ver no verso só o envio que cabe na etapa em que o processo está, para não ter de escolher entre formulários de todas as etapas.
64. Como usuário, quero ver a lista de versões e relatórios em todas as etapas, inclusive nas que não têm envio.
65. Como integrante do EP, quero que [Registrar versão histórica] apareça só em Não iniciados e só enquanto o processo não tem versão piloto nem em sequência.
66. Como integrante do EP, quero que [Enviar versão piloto] apareça só na Modelagem piloto e só enquanto não há versão em sequência.
67. Como integrante do EP, quero [Enviar versão] e [Enviar relatório] na Relatório e modelagem técnica e na Revisão interna.
68. Como integrante do EP, quero que a Validação com o setor, a Aprovação pelo setor, a Publicação, Concluídos e as etapas novas do catálogo não tenham envio de versão nem de relatório, para que a correção pedida pelo setor volte à Revisão interna.
69. Como integrante do EP que esqueceu um arquivo, quero mover o processo de volta à etapa e enviar ali, sem a plataforma me impedir de voltar.
70. Como integrante do EP, quero que o formulário abra e feche pelo mesmo botão e role até aparecer inteiro, para não perder o fim dele abaixo da dobra.

#### Versão piloto

71. Como integrante do EP, quero enviar a versão piloto com o número digitado e o sufixo P (V6P), para seguir a numeração que a equipe já usa.
72. Como integrante do EP, quero que o número venha preenchido com o menor aceito, e poder trocá-lo por um maior.
73. Como integrante do EP, quero que a plataforma recuse um número que não seja maior que o de todas as versões do processo, com a frase dizendo o mínimo.
74. Como integrante do EP, quero, num processo sem versão histórica, poder começar a versão piloto de qualquer número a partir de 1.
75. Como integrante do EP, quero enviar mais de uma versão piloto (V6P, V7P), cada uma maior que as anteriores.
76. Como integrante do EP, quero que a versão piloto exija só o .bpm e aceite o .png e o .bpmn junto, se eu tiver.
77. Como integrante do EP, quero que a plataforma recuse versão piloto depois da primeira versão em sequência.
78. Como integrante do EP, quero ver na prévia o rótulo V6P e o nome de cada arquivo (`CEE_V6P_Nome do processo.bpm`).

#### Versão em sequência

79. Como integrante do EP, quero que a versão em sequência continue do maior número que existe, de qualquer tipo (V6P → V7), sem eu digitar.
80. Como integrante do EP, quero que a versão em sequência exija só o .bpm.
81. Como integrante do EP, quero enviar o .png, o .bpmn e o relatório junto, se tiver.
82. Como integrante do EP, quero que, depois da primeira versão em sequência, não entrem mais versões históricas nem piloto.
83. Como integrante do EP, quero que o botão de enviar fique desabilitado só enquanto falta o .bpm (ou o número da piloto, ou o .docx no envio de relatório).

#### Relatório

84. Como integrante do EP, quero enviar o relatório sozinho, sem versão nova, porque o relatório muda menos que o fluxograma.
85. Como integrante do EP, quero que o relatório receba a numeração própria do processo (Relatório V1, V2…), dada pela plataforma.
86. Como integrante do EP, quero ver na prévia o número do relatório e a versão que ele acompanha ("Relatório V3, acompanha a V8") e o nome do arquivo (`CEE_V8_Nome do processo_Relatório V3.docx`).
87. Como integrante do EP, quero que o relatório enviado junto com uma versão fique ligado a ela.
88. Como integrante do EP, quero que só o .docx seja aceito no relatório, com a frase dizendo o formato esperado.
89. Como usuário, quero ver em cada versão o relatório que vale para ela: o seu, ou o último anterior com "(da V7)".
90. Como usuário, quero que a versão nova sem relatório próprio não tenha marca de pendência.
91. Como usuário, quero ver o relatório da versão histórica como "Relatório da V5F" e os .pdf antigos como estão.
92. Como integrante do EP, quero que o primeiro relatório enviado pela plataforma seja o Relatório V1, mesmo que a versão histórica tenha relatório.

#### Acrescentar e substituir

93. Como integrante do EP, quero [Acrescentar .png] e [Acrescentar .bpmn] na versão piloto ou em sequência que não os tem, para completar a versão depois.
94. Como integrante do EP, quero que acrescentar não apareça na versão aprovada nem na histórica, e que a plataforma recuse mesmo fora da tela.
95. Como integrante do EP, quero substituir um arquivo da versão piloto, da versão em sequência ou um relatório numerado enviado por engano.
96. Como integrante do EP, quero que a versão aprovada e os relatórios ligados a ela continuem sem [Substituir].

#### Trava de arquivos

97. Como integrante do EP, quero ser impedido de passar da Modelagem piloto sem versão piloto, para o processo não seguir sem o produto da etapa.
98. Como integrante do EP, quero ser impedido de passar da Relatório e modelagem técnica sem versão em sequência e relatório.
99. Como integrante do EP, quero que a trava valha pela lista do Agora e ao arrastar o cartão, inclusive quando o destino pula por cima da etapa.
100. Como integrante do EP, quero ver numa janela o que falta, só o que falta, e enviar ali mesmo, para o processo se mover logo depois do envio.
101. Como integrante do EP, quero que, ao fechar a janela sem enviar, o processo fique onde estava.
102. Como integrante do EP, quero que, se o envio falhar na janela, o processo fique onde estava e eu veja a mensagem sem perder o que escolhi.
103. Como integrante do EP, quero que voltar, mudar a etiqueta e mover um processo que já estava depois da etapa não travem.
104. Como integrante do EP, quero que os processos que passaram da Modelagem piloto antes desta mudança, sem versão piloto, continuem andando sem aviso.
105. Como integrante do EP, quero que a ida que passa pelas duas etapas com trava peça uma de cada vez, e que a chegada a Concluídos venha depois.
106. Como administrador, quero que o banco recuse o movimento sem os arquivos mesmo fora da tela.

#### Perfis, histórico, subprocesso

107. Como Consulta, quero ver versões, relatórios e o relatório que vale e baixar tudo, sem nenhum botão.
108. Como integrante do EP, quero que o processo suspenso, cancelado ou concluído não tenha envio, acréscimo nem substituição.
109. Como usuário, quero ver no histórico "Enviou a versão piloto V6P", "Enviou o Relatório V3 (acompanha a V8)" e "Acrescentou o .png à V7", e os eventos antigos com o texto de antes.
110. Como integrante do EP, quero que o subprocesso tenha numeração de versões e relatórios e travas próprias, sem herdar do pai.

#### Dados do desenvolvimento

111. Como integrante do EP, quero que as versões em sequência que já existem continuem em sequência, que os relatórios .docx atuais ganhem número na ordem do envio, e que os "sem alteração de conteúdo" deixem de ser relatórios próprios.

### Decisões de implementação

#### Interface

- **Seção de versões no verso** (coluna esquerda, a de hoje): o destaque e as "Versões anteriores (n)" continuam. Mudam:
  - os botões de envio, que passam a depender da etapa atual (lista da Solução);
  - o rótulo, V6P na piloto;
  - a linha do relatório, com o relatório que vale;
  - a pílula "falta relatório" e o espaço tracejado [+ Acrescentar relatório], que saem;
  - o espaço tracejado, que passa a ser [+ Acrescentar .png] e [+ Acrescentar .bpmn] quando faltam;
  - a observação, que sai.
- **Formulários:** um componente de formulário de versão com três modos (histórica, piloto, em sequência), mais o formulário de relatório, que perde a escolha da versão. Campos de arquivo nativos com `accept`. O botão do envio abre e fecha o formulário, e ao abrir ele rola até aparecer inteiro.
- **Janela da trava:** no padrão da janela da chegada a Concluídos (mesma moldura, `JanelaDeEdicao`), com o título "Para sair da {etapa}, envie…", o formulário do que falta (versão piloto; ou versão e relatório, ou só um dos dois) e [Enviar e mover]. Envia, mostra o progresso, e só então move.
- **Decisão de travar na tela:** uma função pura recebe o processo (o que ele tem: versão piloto, versão em sequência, relatório numerado), a etapa de origem, a de destino e o catálogo, e devolve a primeira etapa com trava que falta, ou nada. O movimento consulta essa função antes da regra da chegada a Concluídos. O banco recusa do mesmo jeito (defesa contra a tela).
- **Relatório que vale:** função pura sobre a lista de versões.
- **Módulo de versões:** sai `semAlteracaoDeConteudo`; `acrescentarRelatorio` vira `enviarRelatorio(processoId, numeroDaVersao, numeroDoRelatorio, arquivo)`; `enviarVersao` ganha o tipo (piloto ou em sequência); entra `acrescentarArquivo(versao, papel, arquivo)`. A falsa nomeada acompanha, imitando as recusas do banco.
- **Recusas novas, com a frase:**
  - versão piloto com número que não é maior que o de todas: "O número da versão piloto precisa ser maior que {n}.";
  - versão piloto ou histórica depois da versão em sequência;
  - versão sem .bpm: "A versão precisa do .bpm.";
  - relatório que não é .docx;
  - acrescentar arquivo que a versão já tem;
  - acrescentar ou substituir na versão aprovada;
  - envio fora das etapas em que cabe (banco);
  - trava: "Para sair da Modelagem piloto, envie a versão piloto (.bpm)." e "Para sair da Relatório e modelagem técnica, envie {a versão | o relatório | a versão e o relatório}.".

  Saem as recusas de "relatório já existente", "versão anterior sem relatório" e `versao_sem_bpm_e_png`.
- **Estados da tela:** os da seção continuam (carregando, "Nenhuma versão enviada.", erro com [Tentar de novo], conferência que falhou, "Enviando 2 de 3…", falha em vermelho sem perder o preenchido). A janela da trava tem os mesmos estados do envio e, na falha do movimento depois do envio, diz "Os arquivos foram enviados, mas o processo não foi movido." com o movimento podendo ser refeito (os arquivos já estão registrados, e a trava não abre de novo).

#### Nome padrão dos arquivos

- Versão piloto: `{SIGLA}_V{n}P_{Nome do processo}.{bpm|png|bpmn}`.
- Relatório numerado: `{SIGLA}_V{n}[P]_{Nome do processo}_Relatório V{r}.docx`, com a versão que ele acompanha.
- A regra de caracteres e o nome guardado no envio não mudam; nomes já gravados não mudam.

#### Função do servidor (`arquivos-no-drive`)

- `iniciar_envio` e `registrar` passam a aceitar as operações:
  - versão piloto, com o número digitado;
  - relatório numerado, sem versão escolhida: a função repete na conferência o número do relatório e a versão da prévia, e o banco recusa se mudaram, como já faz com o número da versão;
  - acrescentar arquivo (.png ou .bpmn) a uma versão existente;
  - e o .pdf da aprovação (enviar e substituir; spec de `revisoes-aprovacao`).
- Sai a ação `sem_alteracao`.
- `conferir` e `baixar` passam a cobrir o .pdf da aprovação.
- O arquivo puro de decisão ganha as operações novas, com a mesma tabela de perfis: Administrador e Integrante enviam; Consulta só baixa e confere; inativo e sem login, nada.
- A extensão aceita no relatório novo passa a ser só .docx.
- **Precisa ser publicada de novo no desenvolvimento** (passo do usuário, roteiro em `docs/`).

#### Modelo de dados

**Tabela `versoes`, alterada:**

| Coluna | Tipo | Obrigatória | Observação |
|---|---|---|---|
| `piloto` | boolean | sim | nova; falso por padrão; nunca verdadeira junto com `historica` |
| `numero` | integer | sim | na histórica e na piloto, digitado; na em sequência, dado pelo banco (maior do processo + 1, de qualquer tipo) |
| `observacao` | — | — | **sai** |

**Tabela `arquivos_da_versao`, alterada:**

| Coluna | Tipo | Obrigatória | Observação |
|---|---|---|---|
| `numero_do_relatorio` | integer | não | nova; no relatório de versão piloto ou em sequência, dado pelo banco (maior do processo + 1); nula nos outros papéis, no relatório da histórica e nos .pdf antigos |
| `copiado_de` | — | — | **sai** |

- A unicidade (versão, papel) passa a valer para todo papel menos o relatório numerado: uma versão pode ter mais de um relatório numerado (enviados enquanto ela era a mais recente).
- O número do relatório é único por processo.

**View `processos_com_andamento`:** ganha `tem_versao_piloto`, `tem_versao_em_sequencia` e `tem_relatorio_numerado` (calculados, não guardados), lidos pela tela para decidir a janela da trava antes de mover.

**Quem pode o quê:** a tabela "quem pode o quê" desta spec continua valendo. A coluna `numero_do_relatorio` não é alterável por ninguém (só o banco a preenche), e a substituição continua alterando só tamanho, hash, autor e data. O .pdf da aprovação tem a sua tabela na spec de `revisoes-aprovacao`.

**Arquivos (no Drive, sem Storage):** .bpm, .png e .bpmn na versão piloto e na em sequência; .docx no relatório numerado; até 20 MB cada; Administrador e Integrante enviam, acrescentam e substituem; todo perfil ativo vê e baixa; a substituição grava no mesmo arquivo do Drive, sem guardar o anterior (ADR 0007). Nenhum bucket.

**Regras que o banco impõe** (novas ou alteradas):

| Regra | Como | Caso de teste que a prova |
|---|---|---|
| Versão histórica só com o processo em Não iniciados e sem versão piloto nem em sequência | gatilho antes de incluir em `versoes` | histórica em Não iniciados aceita; na Modelagem piloto recusada; depois da V6P recusada |
| Versão piloto com número maior que o de todas as versões do processo e só antes da primeira em sequência | gatilho antes de incluir | V6P depois da V5F aceita; V5P depois da V5F recusada; V3P sem versão aceita; V7P depois da V6P aceita; piloto depois da V7 recusada |
| Versão piloto só até a Modelagem piloto; versão em sequência e relatório só até a Revisão interna (pela ordem do catálogo) | gatilho antes de incluir em `versoes` e em `arquivos_da_versao` | piloto em Não iniciados aceita (envio da janela da trava); piloto na técnica recusada; versão e relatório na Validação com o setor recusados; em etapa nova do catálogo depois da Revisão interna recusados |
| Versão em sequência: maior número do processo + 1, de qualquer tipo | gatilho que já existe, ajustado | V6P → V7; V5F → V6; sem versão → V1 |
| Versão piloto e em sequência exigem só o .bpm; histórica como antes | gatilho adiado, recriado | piloto só com .bpm aceita; em sequência só com .bpm aceita; sem .bpm recusada; histórica só com .png recusada |
| Relatório numerado: só .docx, número do processo + 1, ligado à versão mais recente que não é histórica | gatilho antes de incluir em `arquivos_da_versao` | relatório sozinho com V8 mais recente fica na V8 com o próximo número; .pdf recusado; relatório sem versão piloto nem em sequência recusado; segundo relatório na mesma versão aceito |
| Acrescentar .png ou .bpmn só na versão piloto ou em sequência que não o tem, fora da aprovada | gatilho antes de incluir | acrescentar .png à V7 sem .png aceito; à V7 que já tem recusado; à versão aprovada recusado; à histórica recusado |
| Versão aprovada e relatórios ligados a ela sem substituição | gatilho que já existe (ADR 0011), estendido ao relatório numerado | substituir relatório ligado à versão aprovada recusado |
| Trava de arquivos ao mover para a frente | `mover_processo` | da Modelagem piloto à técnica sem piloto recusado; de Não iniciados à Revisão interna sem piloto recusado; da técnica à Validação sem relatório recusado; com versão e relatório (ligados a versões diferentes) aceito; voltar da Validação à Modelagem piloto sem nada aceito; processo já na Validação sem piloto movido a Publicação aceito; etapa com trava desativada no catálogo não trava |
| Toda mudança vira evento | gatilhos que já existem, com textos novos | versão piloto, relatório enviado e arquivo acrescentado geram um evento cada |

**Regras de estado:** a versão continua sem situação guardada; o "relatório que vale" e "tem versão piloto, em sequência e relatório" são calculados. Mover para trás não apaga versão nem relatório. Nenhuma versão muda a etapa (ADR 0006).

**Migração (destrutiva, só dados inventados do desenvolvimento):**

- apaga `versoes.observacao`;
- apaga as linhas de relatório com `copiado_de` preenchido (os "sem alteração de conteúdo") e depois a coluna (as cópias no Drive ficam na pasta, como os órfãos; os eventos antigos ficam com o texto);
- numera os relatórios .docx das versões que não são históricas na ordem do envio, por processo;
- deixa sem número os .pdf e o relatório da histórica;
- as versões em sequência atuais continuam em sequência (nenhuma vira piloto);
- recria os gatilhos, a view e `mover_processo`.

A produção ainda não existe; o teste pgTAP de cada regra vem antes, e a migração vai pelo workflow "Migrar banco de desenvolvimento".

### Decisões de teste

- **Bom teste** confere o que a pessoa vê e consegue fazer, ou o que a função do servidor e o banco aceitam e recusam, nunca detalhes internos.
- **Interface (ponto de teste principal: a tela inteira).** Vitest com Testing Library, renderizando o aplicativo inteiro com as falsas nomeadas (versões, processos, revisões, acesso), como nos `App.*` de hoje. A falsa de versões aprende a versão piloto, o relatório numerado e o acrescentar, e imita as recusas novas. A de processos recusa o movimento sem os arquivos, como o banco. O que cobre:
  - os botões de envio em cada etapa (Não iniciados, Modelagem piloto, técnica, Revisão interna, Validação, Concluídos, etapa nova) e a lista em todas;
  - versão piloto com o número preenchido, número trocado, número baixo recusado, piloto sem histórica a partir de 1, duas pilotos, sumindo depois da V7;
  - versão em sequência só com .bpm, com .png, .bpmn e relatório, numeração depois da P;
  - relatório sozinho com a prévia "Relatório V3, acompanha a V8", .pdf recusado, dois relatórios na mesma versão;
  - o relatório que vale ("(da V7)"), a versão sem marca de pendência, "Relatório da V5F" e o .pdf antigo;
  - acrescentar .png e .bpmn, sumindo na versão aprovada e na histórica;
  - substituir relatório numerado, e sem [Substituir] nos ligados à versão aprovada;
  - a trava pela lista e ao arrastar, com o texto de só o que falta, enviar e mover, fechar sem enviar, falha no envio, falha no movimento depois do envio, as duas travas em sequência, depois a chegada a Concluídos; voltar sem trava; processo já adiante sem trava;
  - formulário que abre e fecha e rola até aparecer;
  - Consulta sem botões; processo suspenso sem envio;
  - os eventos novos e os antigos no histórico;
  - os testes de hoje que usam observação, relatório pendente, sem alteração ou versão nova sem tipo passam ao modelo novo (`App.enviarVersao`, `App.versoesNoProcesso`, `App.relatorioDepois`, `App.arquivosDoVerso`, `App.versoesNoHistorico`, `App.substituirArquivo`, `App.registrarVersaoHistorica`, `App.arrastarParaMover`, `App.agoraDoVerso`).
  - Arte anterior: esses mesmos e `App.chegadaAConcluidos` (janela no movimento).
- **Funções puras:** rótulo (V6P), número mínimo da piloto, relatório que vale, primeira trava que falta (com catálogo de etapa desativada e etapa nova), papéis exigidos por tipo, nome padrão (piloto e relatório numerado), textos do histórico. Arte anterior: `rotulos`, `formularioDeVersao`, `destinoDoArrastar`, `publicacao` (`chegadaPedeJanela`), e o teste do nome padrão da função.
- **Função do servidor:** o arquivo puro de decisão, no Vitest, com as operações novas por perfil e as entradas inválidas; a ponta a ponta se confere publicando no desenvolvimento.
- **Tradução entre o servidor e a tela:** o módulo real com o cliente e o `fetch` simulados, para enviar versão piloto, relatório, acrescentar e as frases das recusas novas. Arte anterior: `versoesSupabase`, `recusasDeVersoes`.
- **Banco:** pgTAP, um teste por regra da tabela acima, no Docker local durante o desenvolvimento e pelo "Testes de banco" na conferência final. Os testes `27` (versões), `28` (históricas), `29` (relatório depois, reescrito para o relatório numerado), `30` (substituir) e `52` (mover) mudam; `10_privilegios_padrao` e `46_funcoes_e_views_seguras` continuam passando.
- Todos os processos, setores, usuários e arquivos dos testes são inventados.

### Fora do escopo desta parte

- Outros anexos (parte 4) e visualização por setores (parte 5).
- Numerar o relatório da versão histórica e os .pdf antigos.
- Rever versões já gravadas (nenhuma vira piloto; os processos adiante sem piloto ficam assim).
- "Corrigida" para correção só do relatório: a revisão "corrigida" continua apontando para a versão enviada na passagem (sabatina, item 3).
- Limpar no Drive as cópias dos "sem alteração" apagadas do banco.
- Pendência "versão sem relatório" no painel geral (deixou de existir).

### Decisões tomadas ao escrever esta seção, a confirmar na leitura

1. **O banco limita onde cada envio cabe pela ordem do catálogo, não pela etapa exata:** versão piloto até a Modelagem piloto, versão em sequência e relatório até a Revisão interna, histórica só em Não iniciados. Assim a janela da trava pode enviar a versão piloto com o processo ainda em Não iniciados. A tela mostra só o envio da etapa atual.
2. **A versão enviada pela janela da trava registra a etapa em que o processo estava** (por exemplo, Não iniciados), e não a etapa da trava.
3. **Uma janela por etapa com trava**, na ordem do catálogo, e a da chegada a Concluídos por último, em vez de uma janela só com tudo.
4. **Etapa com trava desativada no catálogo não trava.**
5. **O relatório numerado fica junto dos arquivos da versão** (papel relatório, com o número próprio), e não numa tabela nova: baixar, substituir e conferir no Drive continuam pelo mesmo caminho.
6. **O relatório que vale numa versão** é o de maior número entre os ligados a ela ou a versões anteriores.
7. **O relatório pode acompanhar uma versão piloto**, quando enviado na técnica antes da primeira versão em sequência ("Relatório V1, acompanha a V6P").
8. **O número da versão piloto vem preenchido** com o menor aceito, em vez de vazio.
9. **Acrescentar .png e .bpmn vale em qualquer etapa** com o processo em andamento, porque completa uma versão que já existe.
10. **A tela decide a janela pela view** (campos novos) antes de mover, além da recusa do banco, para a trava vir antes da janela da chegada a Concluídos.

### Divergência com `.scratch/especificacao.md`

- A especificação numera o piloto como versão comum (V6) e o relatório com o número da versão que ele acompanha, com "relatório pendente" e "sem alteração de conteúdo" (seção 4, itens 16 e 19, e o campo de versão do documento). Agora: piloto com sufixo P e número digitado; relatório com numeração própria (ADR 0026).
- A especificação pede .bpmn e .png no piloto e três arquivos na versão que vai ao setor. Agora: só o .bpm é exigido (ADR 0025).

### Critérios conferidos olhando a tela

- `[visual]` O verso mostra só o botão de envio da etapa atual; nas etapas sem envio, a lista de versões aparece sem espaço vazio no lugar dos botões.
- `[visual]` A janela da trava diz o que falta na primeira linha e mostra o formulário inteiro sem passar da altura do notebook (1366×768).
- `[visual]` A linha do relatório no destaque mostra "Relatório V2" ou "Relatório V2 (da V7)" sem quebrar a linha dos arquivos; [+ Acrescentar .png] e [+ Acrescentar .bpmn] no padrão tracejado de hoje.
- `[visual]` O formulário aberto rola até aparecer inteiro e fecha pelo mesmo botão.

### Outras specs afetadas

- `revisoes-aprovacao`: data da validação e .pdf da aprovação (seção própria, da mesma data).
- `processos-etapas`: o movimento ganha a trava de arquivos (`mover_processo`, a view e o Quadro ao arrastar). Esta seção é a que vale; a spec de `processos-etapas` não foi alterada.

## Problema

O EP produz, para cada processo, uma sequência de fluxogramas e relatórios: o piloto depois da reunião de modelagem, a versão técnica com o relatório, as correções da revisão interna. Hoje esses arquivos ficam espalhados, a numeração é feita à mão no nome do arquivo, e não se sabe com segurança qual é a versão mais recente, quem a enviou, em que etapa do trabalho, nem se o relatório daquela versão já existe. Os arquivos da primeira etapa do trabalho (V5F) também precisam continuar valendo, e a numeração nova tem de continuar a partir deles. A instituição quer os arquivos no seu próprio Drive, onde a equipe também consegue abri-los direto.

## Solução

- **Seção Versões no painel do processo** (e do subprocesso, que tem as suas):
  - a lista das versões, da mais recente para a mais antiga, cada uma com o rótulo (V7, ou V5F na histórica), data e hora do envio, quem enviou, a etapa em que foi enviada (a histórica não tem), a observação da mudança e os arquivos (.bpmn, .png, .bpm, relatório), cada um com o nome padrão e um link que baixa o arquivo;
  - a marca **"relatório pendente"** na versão nova sem relatório;
  - as marcas **"alterado fora da plataforma"** e **"não encontrado no Drive"** no arquivo que mudou ou sumiu no Drive;
  - para Administrador e Integrante, com o processo em andamento: [Enviar versão]; [Registrar versão histórica], enquanto não houver versão nova; em cada versão com relatório pendente, [Acrescentar relatório] e [Sem alteração de conteúdo]; em cada arquivo de versão nova, [Substituir].
- **Enviar versão:** um formulário no painel com os campos de arquivo .bpm e .png (obrigatórios), .bpmn (opcional), relatório .docx ou .pdf (opcional) e a observação (opcional). Mostra o número que a versão vai receber e o nome que cada arquivo vai ter. Confere os arquivos antes de enviar, mostra o progresso ("Enviando 2 de 3…") e só registra a versão depois que todos chegaram ao Drive.
- **Registrar versão histórica:** o mesmo formulário com o número digitado (5 vira V5F) e os arquivos que existirem (basta o .bpm, ou o .bpmn com o .png; relatório opcional).
- **Acrescentar relatório:** escolhe a versão (a mais recente com relatório pendente vem escolhida) e envia o .docx ou o .pdf.
- **Sem alteração de conteúdo:** na versão nova com relatório pendente, registra o relatório da versão anterior com o nome da versão nova, com um clique de confirmação.
- **Substituir:** troca um arquivo da versão por outro do mesmo tipo, com confirmação que avisa que o anterior não fica guardado.
- **Baixar:** o link de cada arquivo traz o arquivo pela plataforma e o abre numa aba nova (ou baixa, se o navegador bloquear a aba), com o nome padrão.
- **Histórico do processo:** ganha os eventos de versão enviada, versão histórica registrada, relatório acrescentado, sem alteração de conteúdo e arquivo substituído.

A Consulta vê a seção e baixa os arquivos, sem nenhum botão de alteração, e não precisa ser membro do Drive. Quem não pode alterar é recusado pela função do servidor e pelo banco, mesmo que tente fora da tela.

## Histórias de usuário

### Enviar uma versão

1. Como integrante do EP, quero enviar o fluxograma de um processo (.bpm do Bizagi e .png), para que a versão fique registrada com número, data e autor.
2. Como integrante do EP, quero que o número da versão seja dado pela plataforma, continuando a numeração do processo (inclusive a das versões históricas), para não errar a numeração à mão.
3. Como integrante do EP, quero ver, antes de enviar, o número que a versão vai receber e o nome de cada arquivo, para conferir o que vai ser gravado.
4. Como integrante do EP, quero enviar o .bpmn junto, se tiver, sem que ele seja exigido (ADR 0016).
5. Como integrante do EP, quero enviar o relatório junto com o fluxograma, quando ele já estiver pronto, para não precisar de um segundo envio.
6. Como integrante do EP, quero escrever uma observação curta sobre o que mudou na versão, se quiser.
7. Como integrante do EP, quero que a versão registre sozinha a etapa em que o processo está, para saber depois se ela foi o piloto, a técnica ou a correção da revisão.
8. Como integrante do EP, quero que o envio não mexa nas etapas, para que o andamento continue sendo decidido por mim.
9. Como integrante do EP, quero que o botão de enviar fique desabilitado enquanto faltam o .bpm ou o .png, para saber o que falta.
10. Como integrante do EP, quero ser avisado antes do envio se escolhi um arquivo com extensão errada, maior que 20 MB, um .png que não é imagem ou um .bpmn que não é BPMN, para não gravar o arquivo errado.
11. Como integrante do EP, quero ver o progresso do envio, para saber que a plataforma está trabalhando.
12. Como integrante do EP, quero que, se algum arquivo falhar, a versão não seja registrada e eu veja uma mensagem clara, sem perder o que preenchi, para tentar de novo.
13. Como integrante do EP, quero enviar uma versão mesmo sem ser o responsável da etapa atual, para que qualquer integrante possa registrar o trabalho.

### Versões históricas

14. Como integrante do EP, quero registrar as versões da primeira etapa do trabalho (V5F), para que o histórico do processo comece de onde ele realmente começou.
15. Como integrante do EP, quero digitar o número da versão histórica, para seguir a numeração que os arquivos já tinham.
16. Como integrante do EP, quero registrar uma versão histórica só com o .bpm, quando for o único arquivo que existe.
17. Como integrante do EP, quero registrar várias versões históricas (V3F, V4F, V5F).
18. Como integrante do EP, quero que a primeira versão nova continue a numeração (V5F → V6).
19. Como integrante do EP, quero que a plataforma recuse uma versão histórica depois que o processo já tem versão nova, para a numeração não se embaralhar.
20. Como integrante do EP, quero que a plataforma recuse um número de versão histórica que já existe no processo.
21. Como usuário, quero ver a versão histórica com o sufixo F e sem a etapa, e saber que ela é somente leitura.

### Relatório

22. Como integrante do EP, quero acrescentar o relatório a uma versão que ainda não tem, para completar a versão quando ele ficar pronto.
23. Como integrante do EP, quero que a versão mais recente com relatório pendente venha escolhida, e poder escolher outra mais antiga.
24. Como integrante do EP, quero ver a marca "relatório pendente" nas versões novas sem relatório, para não esquecer de enviá-lo.
25. Como integrante do EP, quero marcar "sem alteração de conteúdo" quando o relatório não mudou de uma versão para a outra, para que a versão nova tenha o relatório com o número certo sem que eu precise enviá-lo de novo.
26. Como integrante do EP, quero que "sem alteração de conteúdo" só apareça quando a versão anterior tem relatório.
27. Como usuário, quero ver na versão que o relatório veio de "sem alteração de conteúdo" e de qual versão.

### Substituir arquivo

28. Como integrante do EP, quero substituir um arquivo enviado por engano, sem criar versão nova, porque o conteúdo do trabalho não mudou.
29. Como integrante do EP, quero ser avisado, antes de confirmar, que o arquivo anterior não fica guardado.
30. Como integrante do EP, quero que o arquivo novo passe pelas mesmas conferências do envio e seja do mesmo tipo do que sai.
31. Como integrante do EP, quero que o histórico registre a troca, com quem, quando, qual arquivo e o nome e a impressão digital (hash) do que saiu, para saber depois que o arquivo mudou.
32. Como integrante do EP, quero que a versão histórica não tenha [Substituir].

### Baixar e abrir

33. Como usuário (inclusive Consulta), quero baixar qualquer arquivo de qualquer versão, com o nome padrão, sem precisar ser membro do Drive.
34. Como usuário, quero que o arquivo abra numa aba nova quando o navegador sabe mostrá-lo (.png, .pdf), e seja baixado nos outros casos.
35. Como usuário, quero ver uma mensagem clara quando o arquivo não puder ser baixado (sem conexão, arquivo apagado no Drive).

### Arquivos no Drive

36. Como integrante do EP, quero encontrar os arquivos no Drive compartilhado do CED, numa pasta por setor e por processo, com os nomes padrão, para abri-los direto quando precisar.
37. Como integrante do EP, quero que o subprocesso tenha a sua pasta dentro da pasta do setor dele.
38. Como integrante do EP, quero que, quando o processo for renomeado ou o setor mudar de sigla ou o processo mudar de setor, a pasta acompanhe, e os arquivos mantenham o nome da época.
39. Como integrante do EP, quero ver a marca "alterado fora da plataforma" quando alguém mudou o arquivo direto no Drive, e "não encontrado no Drive" quando ele sumiu, para não confiar num registro desatualizado.
40. Como administrador, quero que o desenvolvimento use um Drive separado do oficial, para que nenhum teste toque os arquivos reais.

### Perfis e situação

41. Como usuário da Consulta, quero ver a seção Versões e baixar os arquivos, sem nenhum botão de alteração.
42. Como integrante do EP, quero que enviar, registrar histórica, acrescentar relatório, marcar sem alteração e substituir só funcionem com o processo em andamento; suspenso, cancelado ou concluído só permite consultar e baixar.
43. Como administrador, quero que a função do servidor e o banco recusem quem não pode, mesmo que a pessoa tente fora da tela.
44. Como usuário inativo, não devo conseguir ver nem baixar nada.

### Histórico e efeitos

45. Como usuário, quero ver no histórico do processo cada versão enviada, versão histórica registrada, relatório acrescentado, sem alteração de conteúdo e arquivo substituído, com autor e data.
46. Como integrante do EP, quero que a plataforma recuse excluir um processo que tem versões, dizendo quantas, para não perder o vínculo com os arquivos.
47. Como integrante do EP, quero que a reclassificação (processo ↔ subprocesso) mantenha as versões no item.
48. Como integrante do EP, quero que trocar o setor ou renomear o processo continue permitido com versões, e que os arquivos já enviados mantenham o nome com que foram enviados.

### Estados da tela

49. Como usuário, quero ver "Carregando…" enquanto as versões chegam, "Nenhuma versão enviada." quando não há nenhuma, e uma mensagem com [Tentar de novo] quando a leitura falha.
50. Como usuário, quero que a seção funcione mesmo quando a conferência com o Drive falha, com um aviso discreto de que os arquivos não puderam ser conferidos.

## Decisões de implementação

### Interface

- **Seção Versões** no painel do processo, no estilo das seções vizinhas (Reuniões, Subprocessos), entre o caminho de etapas e o histórico. Lista de versões da mais recente para a mais antiga; cada versão é um bloco com cabeçalho (rótulo, data e hora, autor, etapa, marcas) e a lista dos arquivos, cada um com o nome padrão como link de download e, quando cabe, [Substituir].
- **Rótulo:** `V{número}` na versão nova, `V{número}F` na histórica.
- **Formulários** (enviar versão, versão histórica, acrescentar relatório, substituir) abrem no painel, no padrão do formulário de reunião. Campos de arquivo nativos (`input type="file"` com `accept`), um por papel. O botão de enviar fica desabilitado enquanto falta arquivo obrigatório ou alguma conferência falhou; cada conferência que falha mostra a mensagem ao lado do campo.
- **Sem alteração de conteúdo** e **substituir** usam a janela de confirmação que já existe.
- **Estados da seção:**
  - **carregando:** "Carregando…";
  - **sem dados:** "Nenhuma versão enviada." (com os botões para quem pode);
  - **erro, inclusive falha de conexão:** "Não foi possível carregar as versões. Verifique a conexão e tente de novo." com [Tentar de novo], no padrão de `ErroAoCarregar`;
  - **conferência com o Drive falhou:** a lista aparece normalmente, com o aviso "Não foi possível conferir os arquivos no Drive." e sem as marcas de alteração;
  - **envio em andamento:** "Enviando 2 de 3…", com os campos travados;
  - **falha no envio, no download ou recusa:** mensagem em vermelho, sem perder o que foi preenchido.
- **Recusas:** cada recusa chega como código (da função ou do banco) e vira mensagem na tela, no padrão de `recusasDeReunioes`: perfil sem permissão, processo fora de andamento, versão histórica depois de versão nova, número histórico repetido, versão sem .bpm ou .png, histórica sem arquivo de fluxograma, relatório já existente, versão anterior sem relatório (no "sem alteração"), substituir em versão histórica, tipo de arquivo diferente na substituição, extensão não aceita, arquivo maior que 20 MB, Drive sem espaço, e na exclusão do processo a contagem de versões.
- **Histórico do processo:** os eventos de versão entram na lista de eventos que já existe, com textos próprios (rótulo, papel do arquivo, nome, e, na substituição, o nome e o hash do que saiu).
- **Módulo de versões:** um módulo próprio, ao lado de processos e reuniões, com a mesma forma (interface com uma implementação real e uma falsa nomeada): listar as versões de um processo (com os arquivos e as marcas da conferência), enviar versão, registrar histórica, acrescentar relatório, sem alteração de conteúdo, substituir e baixar. A implementação real fala com a função do servidor e envia os bytes direto ao Drive pela sessão de envio; a leitura da lista vem do banco.

### Conferência dos arquivos (no navegador, antes do envio)

Funções puras, usadas pelo formulário:

- extensão aceita para o papel: `.bpmn`, `.png`, `.bpm`, e `.docx` ou `.pdf` no relatório;
- tamanho até 20 MB;
- `.png` começa com a assinatura do formato PNG;
- `.bpmn` é XML com o elemento `definitions` do namespace do BPMN 2.0 (lido com o `DOMParser` nativo).

A checagem completa do conteúdo do .bpmn é da v1.5. A função do servidor repete as conferências de extensão e tamanho (o navegador não é confiável) e, depois do envio, confere o tamanho real informado pelo Drive.

### Nome padrão dos arquivos

Função pura, usada no formulário (prévia) e na função do servidor (nome gravado no Drive e no banco):

- fluxograma: `{SIGLA}_V{número}[F]_{Nome do processo}.{extensão}`; relatório: `{SIGLA}_V{número}[F]_{Nome do processo}_Relatório.{extensão}`;
- sigla e nome do processo são os do momento do envio; acentos mantidos; os caracteres `\ / : * ? " < > |` e os de controle viram `-`; espaços repetidos viram um só.
- O nome fica guardado no envio (regra 18): renomear o processo ou o setor depois não muda os nomes já gravados. Na substituição, o arquivo novo recebe o nome do que sai.

### Função do servidor (Edge Function `arquivos-no-drive`)

É a primeira Edge Function do projeto (seção "Edge Functions" de `.claude/regras/banco.md`). Referência que já funciona no Drive do CED: a função `drive-upload` e o módulo `evidenciaDrive` do Projeto Diagnóstico de Maturidade ESG.

- **Segredos** (no projeto Supabase de cada ambiente, gravados pelo usuário no terminal dele): e-mail e chave privada da conta de serviço do EP e o identificador do Drive compartilhado (ou pasta raiz) daquele ambiente; também a lista de origens aceitas (endereço do site). Fora do código, do `.env.example` e do git; a configuração é lida num único ponto da função.
- **A chave secreta do Supabase não é usada.** A função fala com o banco com o login de quem chamou (o token que chega no pedido), então a RLS vale para tudo o que ela lê e grava. A única credencial secreta é a da conta de serviço do Google, usada só para falar com o Drive, com o escopo de acesso total do Drive (conta de serviço não passa pela tela de consentimento).
- **Antes de qualquer ação**, confere quem chamou: logado, linha em `usuarios` ativa e com o perfil exigido pela ação. A decisão (quem pode, qual entrada vale) fica num **arquivo puro**, sem dependência do Deno, testado no Vitest.
- **Ações:**
  - `iniciar_envio`: recebe processo, papel, nome original, tamanho e, conforme o caso, versão (relatório, substituição) ou número histórico. Confere perfil, situação do processo (lida da view `processos_com_andamento`), extensão e tamanho; garante a pasta do processo no Drive (criando ou renomeando/movendo a pasta, ver "Pastas"); abre uma sessão de envio resumível no Drive com o nome padrão (ou, na substituição, uma sessão de atualização do mesmo arquivo do Drive) e devolve o endereço da sessão. Os bytes vão do navegador direto ao Google.
  - `registrar`: recebe a operação (versão nova, histórica, relatório, substituição) e os identificadores dos arquivos que chegaram ao Drive; lê de cada um, no Drive, o tamanho real, o formato e o hash MD5; confere tamanho e formato; e grava tudo no banco numa única chamada à função do banco correspondente, com o login de quem chamou. Se algo falhar, nada é gravado e os arquivos que subiram ficam órfãos na pasta (a função não apaga nada).
  - `sem_alteracao`: na versão nova com relatório pendente, copia no Drive o relatório da versão anterior para a pasta do processo com o nome da versão nova e registra o arquivo no banco, marcado como vindo da versão anterior.
  - `baixar`: confere que quem chamou está ativo e que lê o arquivo pela RLS; busca os bytes no Drive e devolve com o nome padrão. A interface monta o arquivo no navegador e o abre (ou baixa, se a aba for bloqueada), como na plataforma ESG.
  - `conferir`: para um processo, compara o hash e a existência de cada arquivo no Drive com o que o banco guarda e devolve, por arquivo, `ok`, `alterado` ou `nao_encontrado`. Chamada ao abrir a seção Versões; o resultado não é gravado.
- **Substituir sem guardar o anterior** (ADR 0007): a substituição grava o conteúdo novo no **mesmo arquivo do Drive** (mesmo identificador); a plataforma não guarda o anterior. O próprio Drive pode manter a revisão anterior por um tempo, fora do controle da plataforma.
- **Resposta e logs** sem dado pessoal; erro com código e mensagem genérica.
- **Drive sem espaço:** o erro de cota do Google no envio vira a recusa "não há espaço no Drive".

### Pastas no Drive

- `<raiz do ambiente> / <SIGLA do setor> / <Nome do processo> / <arquivos>`; o subprocesso tem a sua pasta dentro da pasta do setor dele (não dentro da pasta do pai).
- O identificador da pasta do setor e da pasta do processo no Drive fica guardado no banco, para a pasta ser achada mesmo depois de renomeada.
- **A pasta acompanha na próxima vez que a plataforma mexe nela:** a cada `iniciar_envio`, a função confere se o nome e o lugar da pasta batem com a sigla e o nome atuais e, se não, renomeia ou move a pasta. Os arquivos mantêm o nome com que foram enviados.

### Modelo de dados

**Tipos novos:** `papel_do_arquivo` = `bpmn` | `png` | `bpm` | `relatorio`.

**Tabela `versoes`:**

| Coluna | Tipo | Obrigatória | Observação |
|---|---|---|---|
| `id` | uuid | sim | gerado |
| `processo_id` | uuid → `processos` | sim | referência recusa apagar o processo |
| `numero` | integer | sim | maior que zero; único por processo; na versão nova, dado pelo banco (maior número do processo + 1, contando as históricas) |
| `historica` | boolean | sim | falso por padrão |
| `etapa_id` | uuid → `etapas` | não | na versão nova, a etapa atual do processo no envio, preenchida pelo banco (view `processos_com_andamento`); nula na histórica |
| `observacao` | text | não | até 2.000 caracteres, sem espaços nas pontas, vazio vira nulo |
| `enviada_por` | uuid → `usuarios` | sim | quem chamou, preenchido pelo banco |
| `enviada_em` | timestamptz | sim | gerado |

**Tabela `arquivos_da_versao`:**

| Coluna | Tipo | Obrigatória | Observação |
|---|---|---|---|
| `id` | uuid | sim | gerado |
| `versao_id` | uuid → `versoes` | sim | |
| `papel` | `papel_do_arquivo` | sim | único por versão |
| `nome` | text | sim | nome padrão, com extensão, gravado no envio; até 300 caracteres |
| `formato` | text | sim | extensão: `bpmn`, `png`, `bpm`, `docx` ou `pdf`, coerente com o papel |
| `tamanho` | bigint | sim | em bytes, até 20 MB |
| `hash_md5` | text | sim | o MD5 informado pelo Drive no envio (32 caracteres hexadecimais) |
| `drive_id` | text | sim | identificador do arquivo no Drive |
| `copiado_de` | uuid → `arquivos_da_versao` | não | preenchido no "sem alteração de conteúdo": o relatório da versão anterior |
| `enviado_por` | uuid → `usuarios` | sim | preenchido pelo banco; muda na substituição |
| `enviado_em` | timestamptz | sim | gerado; muda na substituição |

**Tabela `pastas_no_drive`:** `id` (uuid), `setor_id` → `setores` ou `processo_id` → `processos` (exatamente um dos dois; único), `drive_id` (text). Escrita só pela função do servidor, com o login de quem chamou (Administrador e Integrante).

**Gravação em várias linhas:** cada operação (versão nova com os arquivos, histórica, relatório, sem alteração, substituição) é uma função do banco chamada pela função do servidor com o login de quem chamou, sem `security definer`, que grava tudo de uma vez. A RLS decide o resto.

**Privilégios padrão:** cada tabela nova nasce com `revoke all` de visitante e de logado e concede de volta só o necessário a logado (`versoes`: ler e incluir; `arquivos_da_versao`: ler, incluir e alterar só `tamanho`, `hash_md5`, `enviado_por` e `enviado_em`; `pastas_no_drive`: ler, incluir e alterar `drive_id`). Assim o teste `10_privilegios_padrao` continua passando.

**Dado pessoal:** o nome de quem enviou (já visto por todo perfil ativo). Os arquivos podem conter nomes de servidores e de responsáveis do setor; ficam no Drive, e na plataforma todo perfil ativo pode baixá-los, como já vê os responsáveis do setor.

**Storage:** nenhum bucket. O teste `01_buckets_privados` continua passando.

#### Quem pode o quê (cada célula vira um teste pgTAP)

"Visitante" é quem não entrou; "Inativo" é qualquer perfil com `ativo` falso em `usuarios`.

| Tabela e ação | Administrador | Integrante do EP | Consulta | Inativo | Visitante |
|---|---|---|---|---|---|
| `versoes` ler | sim | sim | sim | não | não |
| `versoes` criar | sim | sim | não | não | não |
| `versoes` alterar, apagar | não | não | não | não | não |
| `arquivos_da_versao` ler | sim | sim | sim | não | não |
| `arquivos_da_versao` criar | sim | sim | não | não | não |
| `arquivos_da_versao` alterar (substituir: tamanho, hash, autor, data) | sim | sim | não | não | não |
| `arquivos_da_versao` alterar nome, papel, versão, drive_id; apagar | não | não | não | não | não |
| `pastas_no_drive` ler | sim | sim | sim | não | não |
| `pastas_no_drive` criar, alterar drive_id | sim | sim | não | não | não |
| `pastas_no_drive` apagar | não | não | não | não | não |
| `eventos` de versão ler | sim | sim | sim | não | não |
| `eventos` criar, alterar, apagar | não (só os gatilhos incluem) | não | não | não | não |

**Função do servidor** (arquivo puro de decisão, testado no Vitest), por ação:

| Ação | Administrador | Integrante do EP | Consulta | Inativo | Sem login |
|---|---|---|---|---|---|
| `iniciar_envio`, `registrar`, `sem_alteracao` | sim | sim | não | não | não |
| `baixar`, `conferir` | sim | sim | sim | não | não |

#### Regras que o banco impõe

| Regra | Como | Caso de teste que a prova |
|---|---|---|
| Número da versão nova é o maior do processo + 1, contando as históricas | gatilho antes de incluir em `versoes` | processo com V5F recebe V6; processo sem versão recebe V1; número enviado pela interface é ignorado na versão nova |
| Número único por processo | restrição única (`processo_id`, `numero`) | histórica V5F repetida recusada |
| Versão histórica só enquanto o processo não tem versão nova | gatilho antes de incluir | histórica depois do V6 recusada |
| Versão nova registra a etapa atual do processo; a histórica não tem etapa | gatilho antes de incluir | versão enviada com a etapa "Reunião de modelagem" atual guarda essa etapa; histórica com etapa nula |
| Envio e alterações só com o processo em andamento | gatilho antes de incluir em `versoes` e de incluir e alterar em `arquivos_da_versao` | processo suspenso, cancelado ou concluído recusado |
| Versão nova tem .bpm e .png (.bpmn opcional; ADR 0016); histórica tem .bpm ou o par .bpmn e .png | gatilho de restrição adiado para o fim da gravação (`deferrable initially deferred`) | versão sem .png recusada; versão sem .bpm recusada; versão com .bpm e .png, sem .bpmn, aceita; histórica só com .bpm aceita; histórica só com .png recusada |
| Um arquivo por papel em cada versão | restrição única (`versao_id`, `papel`) | segundo relatório na mesma versão recusado |
| Formato coerente com o papel; tamanho até 20 MB; nome até 300 caracteres | restrições | relatório `.png` recusado; 20 MB + 1 byte recusado |
| Versão histórica é somente leitura | gatilho antes de incluir e alterar em `arquivos_da_versao` | relatório acrescentado ou arquivo substituído em histórica recusado (o relatório da histórica só entra na criação dela) |
| "Sem alteração de conteúdo" só copia o relatório da versão imediatamente anterior, que precisa ter relatório | gatilho antes de incluir com `copiado_de` | copiar de versão sem relatório recusado; copiar de versão que não é a anterior recusado |
| Substituir só troca o conteúdo (tamanho, hash, autor, data) | privilégio de coluna | alterar `nome` ou `drive_id` recusado |
| Versão e arquivo não se apagam | sem política nem privilégio de apagar | apagar recusado para todo perfil |
| Não excluir processo com versão | referência recusa apagar; a recusa traz a contagem | excluir processo com 2 versões recusado com "2" |
| Toda mudança vira um evento, com autor, ligado ao processo | gatilhos com entidade `versao` e referência no id do processo | enviar, registrar histórica, acrescentar relatório, sem alteração e substituir geram um evento cada; a substituição traz no "antes" o nome e o hash do que saiu |
| Eventos de versão lidos por todo perfil ativo | política de leitura em `eventos` para a entidade `versao` | Consulta lê; inativo e visitante não |

#### Regras de estado

A versão não tem situação guardada. "Relatório pendente" é calculado (versão nova sem arquivo de papel `relatorio`), na tela. "Alterado fora da plataforma" e "não encontrado no Drive" são calculados a cada abertura pela ação `conferir`, sem gravar. A versão não muda o status de nenhuma etapa (ADR 0006).

#### Migração

Nenhuma migração destrutiva: tabelas, tipo, gatilhos, funções e políticas novos, e a política nova em `eventos`. Nenhum dado existente muda.

## Decisões de teste

- **Bom teste** confere o que a pessoa vê e consegue fazer, ou o que a função do servidor e o banco aceitam e recusam, nunca detalhes internos.
- **Interface (ponto de teste principal: a tela inteira).**
  - **Como:** Vitest com Testing Library, renderizando o aplicativo inteiro com a implementação falsa nomeada do módulo de versões. Ela guarda versões, arquivos, conferências e histórico, aceita falhas programáveis (no envio de um arquivo, no registro, no download, na conferência) e imita as recusas, ao lado das falsas do acesso, dos cadastros, dos processos e das reuniões.
  - **O que cobre:**
    - a seção Versões para cada perfil (Consulta só com os links de download);
    - enviar versão com .bpm e .png, com .bpmn, com relatório; número e nomes na prévia; botão desabilitado sem arquivo obrigatório;
    - cada conferência de arquivo que falha (extensão, tamanho, PNG, BPMN);
    - progresso e falha no meio do envio (nada registrado, formulário preservado);
    - registrar histórica (só .bpm; várias); botão sumindo depois da versão nova; número repetido recusado;
    - acrescentar relatório (versão escolhida por padrão e outra), "sem alteração de conteúdo" (aparece só quando cabe);
    - substituir com confirmação; histórica sem [Substituir];
    - baixar (aba nova e queda para download) e falha no download;
    - marcas "relatório pendente", "alterado fora da plataforma", "não encontrado no Drive" e o aviso de conferência que falhou;
    - processo suspenso, cancelado ou concluído sem botões de alteração;
    - cada mensagem de recusa; a recusa de excluir processo com versões;
    - eventos de versão no histórico do processo;
    - estados de carregando, vazio e erro com "Tentar de novo".
  - **Arte anterior:** `App.reunioesNoProcesso`, `App.painelDoProcesso`, `App.historico`, `App.recusaComReunioes`.
- **Função do servidor: a regra de quem pode.** O arquivo puro de decisão, testado no Vitest: cada célula da tabela da função (cada perfil, inativo, sem login), processo fora de andamento, extensão e tamanho recusados, e as entradas inválidas (campo faltando, tipo errado). A chamada de ponta a ponta (Drive de verdade) se confere publicando a função no projeto de desenvolvimento, com o Drive de desenvolvimento e um usuário inventado de cada perfil; no remoto sem Docker, `functions serve` não está disponível.
- **Tradução entre o servidor e a tela.** Testes pequenos do módulo de versões real com o cliente e o `fetch` simulados (classes ou funções nomeadas), provando que os códigos de recusa viram as mensagens, que o envio usa o endereço da sessão devolvido pela função e que a versão só é registrada depois que todos os arquivos chegaram. Arte anterior: `reunioesSupabase`, `recusasDeReunioes`.
- **Funções puras** (conferência dos arquivos, nome padrão, rótulo, relatório pendente, número da próxima versão para a prévia, textos do histórico): testes unitários pequenos.
- **Banco.**
  - **Testes:** pgTAP, um teste por célula da tabela "quem pode o quê" (com um usuário inventado de cada perfil, um inativo e um visitante) e um por regra da tabela de regras.
  - **Testes gerais:** `00_rls_ligada`, `01_buckets_privados` e `10_privilegios_padrao` cobrem as tabelas novas sem mudança.
  - **Testes antigos:** o de exclusão de processo passa a ter um caso com versão.
  - **Onde rodam:** os testes vêm antes da migração e rodam pelo GitHub Actions ("Testes de banco"). A migração vai pelo workflow "Migrar banco de desenvolvimento".
- Todos os processos, setores, usuários, nomes de arquivo e conteúdos dos testes são inventados; os arquivos de teste no Drive de desenvolvimento também.

## Fora do escopo

- E-mails trocados com o setor (.eml): funcionalidade 6 (rodadas de revisão).
- Tipo "outro" de documento.
- Trava da versão enviada ao setor ou aprovada: decidida no planejamento da funcionalidade 6.
- Envio que muda a etapa (atribuir a etapa 5, concluir a etapa 5): ADR 0006; vira demanda se fizer falta.
- PNG gerado a partir do .bpmn e o visualizador de .bpmn: saíram da v1 em 2026-10-20 (ADR 0016; backlog, versão futura).
- Acrescentar o .bpmn depois a uma versão que não o tem (só no envio; ver "Mudança de 2026-10-20").
- Checagem automática do conteúdo do .bpmn: v1.5.
- Converter .bpm em .bpmn: backlog.
- Baixar a versão inteira num .zip.
- Comparação visual entre versões: v2.
- Importação das versões históricas em lote: funcionalidade 10.
- Pendência "versão sem relatório" no painel geral: funcionalidade 9.
- Projeto do Google Cloud institucional, liberado pela TI: depois da v1 (backlog).
- Sincronizar os membros do Drive compartilhado com os usuários da plataforma: o usuário mantém as permissões direto no Drive.
- Limpeza de arquivos órfãos no Drive (envio que falhou no meio): o usuário os vê na pasta; a função não apaga nada.
- Registro de quem baixou cada arquivo (backlog).

## Observações

- **Verso do cartão (2026-10-19, parte 3 da experiencia-do-quadro):** a seção de versões passa para a coluna esquerda do verso do cartão, com a versão mais recente numa linha de destaque (número e data em mono), o que falta na pílula âmbar ("falta relatório") e no espaço tracejado [+ Acrescentar relatório] no lugar do relatório, um botão por arquivo com a barrinha de cor do tipo, as anteriores recolhidas em "Versões anteriores (n)" e "Registrar versão histórica" num "⋯" da seção. O que cada ação faz não muda. O desenho está na spec de `processos-etapas` ("Verso do cartão").
- Critérios conferidos olhando a tela, para o `/ship`:
  - `[visual]` A seção Versões segue o estilo das seções vizinhas do painel (Reuniões, Subprocessos), com cada versão como um bloco e os arquivos em lista.
  - `[visual]` As marcas "relatório pendente", "alterado fora da plataforma" e "não encontrado no Drive" seguem o padrão das pílulas existentes, com cor e texto (nunca só cor).
  - `[visual]` O formulário de envio mostra a prévia do número e dos nomes, e o progresso do envio fica visível sem rolar.
  - `[visual]` Para a Consulta e para o processo fora de andamento, a seção não mostra botões de alteração; os links de download continuam.
  - `[visual]` Mensagens de falha e de recusa em vermelho.
  - `[visual]` O arquivo baixado abre numa aba nova (.png, .pdf) ou é salvo com o nome padrão.
- **Passos do usuário, fora da sessão** (descritos no ticket da função, com o roteiro):
  1. criar a conta de serviço do EP no projeto Google Cloud pessoal (o mesmo do login) e gerar a chave;
  2. criar os Drives compartilhados (ou pastas raiz) "EP – desenvolvimento" e "EP – produção" no Drive do CED e adicionar a conta de serviço como membro com permissão para criar, renomear e mover pastas e arquivos (a conferir no ticket qual papel do Drive basta, provavelmente "Gerente de conteúdo");
  3. gravar os segredos no projeto Supabase de desenvolvimento, no próprio terminal (a chave nunca vem para a conversa);
  4. aprovar a publicação da função no projeto de desenvolvimento;
  5. manter no Drive as permissões da equipe (Integrantes como Colaborador; o usuário como Administrador).
- **Divergências com `.scratch/especificacao.md`**, decididas na sabatina de 2026-10-15:
  - Documento, VersãoDocumento e ArquivoVersao viraram versão do processo com os arquivos dentro (ADR 0005);
  - o envio não atribui nem conclui a etapa 5 (ADR 0006);
  - "versões nunca são apagadas; substituir cria versão nova" virou "a versão nunca se apaga; um arquivo se substitui sem guardar o anterior" (ADR 0007);
  - Storage com cópia ao Drive na v1.5 virou Drive desde já, sem Storage (ADR 0008);
  - "referência ao Drive" deixou de ser opcional: todo arquivo tem o identificador do Drive;
  - o .bpm é opcional (decisão aberta 11.8). Mudou em 2026-10-20 (ADR 0016): na versão nova o .bpm é obrigatório e o .bpmn opcional, ao contrário da regra 3 da seção 5 da especificação, e o visualizador de .bpmn saiu da v1.
- **Decisões tomadas ao escrever a spec, a confirmar na leitura:**
  - **"Sem alteração de conteúdo" faz uma cópia do relatório no Drive** (pela própria função, sem passar pelo navegador), com o nome da versão nova. Na sabatina, a ideia era não duplicar o arquivo, mas isso valia para o Storage; com a pasta aberta à equipe, sem a cópia o relatório do V7 não apareceria no Drive com o nome do V7, e substituir um dos dois mudaria os dois.
  - **O hash é o MD5 informado pelo Drive**, lido pela função depois do envio, e não um hash calculado no navegador: é o único que o Drive informa de volta, e é com ele que a conferência "alterado fora da plataforma" funciona.
  - **A função grava no banco com o login de quem chamou**, e não com a chave secreta do Supabase, que continua fora do projeto. A única chave secreta é a da conta de serviço do Google.
  - **A pasta acompanha a renomeação na próxima vez que a plataforma mexe nela** (próximo envio), e não no momento em que o processo é renomeado, para não acoplar a tela de processos à função do servidor.
  - **A substituição grava no mesmo arquivo do Drive**, o que não apaga nada (a função não apaga, decisão da sabatina) e não deixa o anterior visível na pasta.
  - **A conferência com o Drive roda a cada abertura da seção Versões**, sem gravar o resultado.
  - **Versão histórica também exige o processo em andamento**, como as demais ações.
  - **Observação da versão até 2.000 caracteres.**
- **Rede do escritório:** a migração vai pelo workflow "Migrar banco de desenvolvimento" e precisa ser registrada em `supabase/AMBIENTES.md` para o `migration repair` antes da primeira publicação em produção. A função também precisa entrar nos roteiros "Publicar no banco de produção" e "Backup e restauração" do `/ship` (o backup do banco não leva os arquivos; eles estão no Drive do CED).
- **Privilégios padrão:** toda tabela nova em `public` reprova o teste `10_privilegios_padrao` até receber o seu `revoke`.
- **Primeira Edge Function do projeto:** no primeiro uso, confirmar na documentação atual do Supabase como a função autentica o usuário e quais variáveis ele injeta (regra de `banco.md`); o pré-commit e o ESLint precisam alcançar o arquivo puro de decisão.

## Como ficou construído (acertos do /ship, 2026-10-16)

O que a implementação faz de diferente do texto acima, ou além dele. O porquê de cada ponto está em `desvios.md`.

- **Número da versão:** o banco dá o número (gatilho `preparar_versao`); a tela manda o número da prévia e o registro recusa com `numero_da_versao_mudou` se o banco der outro, para o nome do arquivo no Drive nunca divergir.
- **Seção Versões:** fica em Detalhes, depois de Reuniões e antes das ações do processo. Só o [Acrescentar relatório] fica na seção; o [Sem alteração de conteúdo] fica em cada versão com relatório pendente.
- **Substituição:** "mesmo tipo" é mesmo papel e mesma extensão. A confirmação vem depois de escolher o arquivo. A substituição atualiza o mesmo arquivo do Drive (mesmo identificador); o nome fica. Substituir o relatório original de uma cópia "sem alteração" não muda a cópia (`copiado_de` e a marca seguem).
- **Download:** só `.png` e `.pdf` abrem em aba nova; os demais formatos baixam direto, com o nome padrão. O servidor devolve sempre `application/octet-stream`.
- **Função do servidor, conferências além das da spec:**
  - o arquivo registrado precisa estar na pasta do processo (`arquivo_fora_da_pasta`), ter o rótulo da versão no nome (`_V<n>_` ou `_V<n>F_`; na substituição o nome fica) e ter ao menos 1 byte;
  - o relatório depois só vale para versão do próprio processo;
  - antes de baixar, substituir, conferir, copiar ou mover pelo `drive_id` guardado, a função confere que o item está debaixo da raiz do ambiente (`_shared/raiz.ts`), porque a conta de serviço enxerga mais que a pasta do ambiente e o `drive_id` é gravado pelo banco por quem escreve;
  - a pasta do processo não é acertada (renomeada ou movida) numa substituição; a próxima versão nova a acerta.
- **Banco:** `drive_id` só com letras, números, `_` e `-` (até 200), nas duas tabelas (migração `20261016200000_drive_id_com_formato`). Versão histórica é somente leitura depois da chamada que a cria. Cada arquivo que entra depois da versão gera um evento (`acrescentar_relatorio`, `sem_alteracao`, `substituir`).
- **Recusas da tela:** arquivo vazio e `entrada_invalida` têm frase própria (antes viravam "erro inesperado").
- **Provas pendentes:** a conferência visual das telas e a prova no Drive dos critérios 3 e 4 do ticket 08 (sigla trocada e mudança de setor) e da saída do Integrante dos tickets 01, 02, 04 e 05. A função corrigida nesta etapa ainda precisa ser publicada no desenvolvimento.

## Mudança de 2026-10-20: a versão exige o .bpm e o .png (ADR 0016)

**Como resolve.** O trabalho do EP acontece no Bizagi: o .bpm é o arquivo que permite continuar o fluxo a partir de uma versão, e o .png é o que se lê. Até aqui a versão exigia o .bpmn, que só serviria ao visualizador no navegador; o visualizador saiu da v1 e o fluxo se vê pelo .png, que já abre em aba nova. Com a mudança, a versão nova exige o .bpm e o .png, o .bpmn fica opcional, e a "versão completa" que destrava a Revisão pelo setor e a Aprovação passa a ser .bpm, .png e relatório. Nenhuma tela nova; muda o que é obrigatório, a ordem dos campos e dos arquivos, e as frases do que falta.

### Histórias de usuário

51. Como integrante do EP, quero que a versão nova exija o .bpm e o .png, para que toda versão tenha o arquivo editável do Bizagi e a imagem do fluxo.
52. Como integrante do EP, quero poder enviar uma versão sem o .bpmn, porque a plataforma não o usa na v1.
53. Como integrante do EP, quero enviar o .bpmn junto, se tiver, e vê-lo na versão como os demais arquivos.
54. Como integrante do EP, quero que o botão de enviar fique desabilitado enquanto faltam o .bpm ou o .png, e não por faltar o .bpmn.
55. Como integrante do EP, quero ver no formulário de envio, nesta ordem, "Fluxograma Bizagi (.bpm)", "Imagem do fluxo (.png)" e ".bpmn (opcional)", e depois o relatório e a observação.
56. Como usuário, quero ver os arquivos da versão (no destaque e nas versões anteriores) na ordem .png, .bpm, relatório e .bpmn (se houver), com o .png primeiro porque é o que se abre para ver o fluxo.
57. Como integrante do EP, quero que a plataforma recuse, mesmo fora da tela, uma versão nova sem .bpm, com a mensagem "A versão precisa do .bpm e do .png.".
58. Como integrante do EP, quero ser impedido de concluir a Revisão pelo setor ou a Aprovação quando a versão mais recente não tem .bpm, .png ou relatório, com a janela dizendo o que falta ("A V8 está sem .bpm e relatório.").
59. Como integrante do EP, quero concluir a Revisão pelo setor e a Aprovação quando a versão mais recente tem .bpm, .png e relatório, mesmo sem .bpmn.
60. Como integrante do EP, quero substituir o .bpmn de uma versão que já o tem, como qualquer outro arquivo; a versão sem .bpmn não ganha botão para acrescentá-lo depois.
61. Como integrante do EP, quero que a versão histórica continue aceitando só o .bpm, ou o par .bpmn e .png, como antes.
62. Como usuário, quero que as versões já gravadas continuem aparecendo e baixando como antes, com ou sem .bpm.

### Decisões de implementação

- **Banco (migração nova, não destrutiva):** recria a função do gatilho que confere os arquivos da versão nova, trocando o par exigido `bpmn` + `png` por `bpm` + `png`; a regra da histórica não muda. Recria `private.papeis_que_faltam` com `bpm`, `png` e `relatorio`, nessa ordem (a ordem da frase), usada pela trava da Revisão pelo setor e da Aprovação (ADR 0009). O tipo `papel_do_arquivo` não muda (o `bpmn` continua aceito). O gatilho só age na inclusão: nenhuma versão já gravada é revista, e não há dado a corrigir (a produção ainda não existe; no desenvolvimento só há dados inventados).
- **Recusa do banco:** o código da recusa da versão sem os arquivos obrigatórios passa de `versao_sem_bpmn_e_png` a `versao_sem_bpm_e_png` (o nome antigo enganaria quem buscar por ele), no gatilho recriado e na tradução da tela, com o texto "A versão precisa do .bpm e do .png.".
- **Tela, formulário de envio:** os papéis obrigatórios da versão nova passam a ser `bpm` e `png`; os campos aparecem na ordem .bpm, .png, .bpmn, relatório, observação; os rótulos passam a "Fluxograma Bizagi (.bpm)", "Imagem do fluxo (.png)" e ".bpmn (opcional)". O formulário da histórica não muda de regra (basta o .bpm, ou o .bpmn com o .png), só acompanha a ordem nova.
- **Tela, arquivos da versão:** a ordem de exibição passa a .png, .bpm, relatório, .bpmn, no destaque e nas versões anteriores, com os rótulos curtos dos botões ajustados ao novo papel do .bpm (o "Fluxograma" deixa de ser o .bpmn). Os rótulos exatos o `/polir` pode ajustar.
- **Tela, frase do que falta:** a lista dos exigidos da janela de concluir a Revisão pelo setor e a Aprovação passa a .bpm, .png e relatório, na mesma ordem do banco, com o rótulo ".bpm".
- **Função do servidor:** nada muda; ela já aceita os quatro papéis, e quem exige os obrigatórios é o banco. Não precisa de nova publicação por causa desta mudança.
- **Conferência no navegador:** o .bpm continua conferido só pela extensão e pelo tamanho; o .bpmn, quando enviado, continua conferido como BPMN.

### Modelo de dados

- **Tabelas e colunas:** nenhuma criada ou alterada; o tipo `papel_do_arquivo` fica como está.
- **Quem pode o quê:** nada muda (a tabela "quem pode o quê" acima continua valendo).
- **Regras que o banco impõe, alteradas:**

| Regra | Como | Caso de teste que a prova |
|---|---|---|
| Versão nova tem .bpm e .png; .bpmn opcional | gatilho de restrição adiado, recriado | sem .bpm recusada com `versao_sem_bpm_e_png`; .bpm e .png sem .bpmn aceita; .bpmn e .png sem .bpm recusada |
| Versão completa (trava da Revisão pelo setor e da Aprovação) é .bpm, .png e relatório | `private.papeis_que_faltam` recriada | concluir com .bpm, .png e relatório sem .bpmn aceito; sem .bpm recusado, com `bpm` entre os que faltam |

- **Migração:** não destrutiva (só recria duas funções); nenhum dado existente muda, e nenhuma versão já gravada é revista.

### Decisões de teste

- **Ponto de teste: a tela inteira**, com as implementações falsas nomeadas (a falsa de versões passa a recusar a versão nova sem .bpm ou .png, imitando o banco). Casos: enviar com .bpm e .png sem .bpmn; botão desabilitado sem .bpm; botão habilitado sem .bpmn; ordem dos campos no formulário; ordem dos arquivos no destaque e nas anteriores; concluir a Revisão pelo setor e a Aprovação com .bpm, .png e relatório sem .bpmn; janela dizendo "sem .bpm" quando falta; histórica só com .bpm continua aceita. Os testes da tela que hoje montam versões com .bpmn e .png passam a montá-las com .bpm e .png onde a versão precisa estar completa.
- **Banco (pgTAP, antes da migração):** versão nova com .bpm e .png aceita; sem .bpm recusada; sem .png recusada; com .bpmn e .png sem .bpm recusada; `papeis_que_faltam` devolve `bpm` quando falta; concluir Revisão pelo setor e Aprovação com .bpm, .png e relatório, sem .bpmn, aceito. Os testes antigos que gravam versões com .bpmn e .png passam a gravá-las com .bpm e .png. Rodam pelo "Testes de banco"; a migração vai pelo "Migrar banco de desenvolvimento".
- **Funções puras:** papéis obrigatórios, ordem dos arquivos e frase do que falta, com testes unitários pequenos.
- **Arte anterior:** `App.enviarVersao`, `App.versoesNoProcesso`, `App.revisaoDoSetor`, `App.aprovacao`; pgTAP `27` (versões) e `38` (etapas protegidas e revisão do setor).

### Critérios para o `/ship`

- `[visual]` O formulário de envio mostra .bpm e .png como obrigatórios e o .bpmn por último, marcado como opcional.
- `[visual]` No destaque da versão, o .png vem primeiro, depois o .bpm, o relatório (ou o espaço de acrescentar) e o .bpmn, se houver.

### Entrega

Uma só, sem tickets: esta seção é o ticket (confirmado pelo usuário em 2026-10-20). Execução por `/executar-complexo` (migração com teste antes, depois a tela, as falsas e os testes antigos), plano em `plano-mudanca-bpm.md`; a linha `Implementado em` entra no fim desta seção.

### Fora do escopo desta mudança

- Botão "Acrescentar .bpmn" numa versão que não o tem.
- Visualizador de .bpmn e geração do .png a partir do .bpmn (backlog).
- Rever as versões já gravadas sem .bpm.

### Outras specs afetadas

A trava da versão completa está descrita na spec de `revisoes-aprovacao` (".bpmn, .png e relatório") e os botões dos arquivos no destaque, na de `processos-etapas` ("Fluxograma .bpmn", "Imagem .png"…). Esta seção é a que vale; as duas specs recebem uma nota apontando para cá.

Entregue em 2026-10-16 (commit 869901d), com ressalva: critérios [visual] presumidos (a tela não foi conferida) e função arquivos-no-drive corrigida ainda não publicada no desenvolvimento
Entregue em 2026-10-19 (commit 8ef4091), com ressalva: as provas no Drive real (critérios 3 e 4 do ticket 08 e a saída do Integrante dos tickets 01, 02, 04 e 05) seguem pendentes; a tela dos arquivos foi vista só na vitrine local, com módulos falsos
Implementado em 2026-10-20 (commit 95f2881)
Entregue em 2026-10-20 (commit 02c0aa7), com ressalva: os dois critérios [visual] da mudança do .bpm (ordem dos campos do formulário e ordem dos arquivos no destaque) presumidos, a tela foi vista só na vitrine local, com módulos falsos; as provas no Drive real da entrega anterior seguem pendentes
Entregue em 2026-10-26 (commit d971dfc), com ressalva: critérios [visual] presumidos (a tela nunca foi vista com o login real: verso e janela da trava, linha do relatório, campo da data da validação, .pdf na gaveta e janela "Registrar aprovação" em 1366×768); função arquivos-no-drive ainda não publicada no desenvolvimento, com a camada Deno sem teste automático, e provas no Drive real pendentes; revisão de segurança foi a de reserva (menos completa); as ressalvas das entregas anteriores seguem valendo

Em revisão desde 2026-10-26
