# Enxugar o cartão e o cadastro

Status: ready-for-agent

Funcionalidade 15, mudança em `processos-etapas` e `repositorio-de-processos` (as duas já entregues). Origem: `.scratch/enxugar-cartao-e-cadastro/demanda.md` e `sabatina.md` (2026-10-29); ADR 0035 (substitui a parte do ADR 0013 sobre a data da modelagem piloto); `CONTEXT.md` ("Anotações" e "Data da modelagem piloto"). Onde as specs de `processos-etapas` e `repositorio-de-processos` divergirem desta, vale esta.

**Como resolve o problema.** O cadastro de Novo processo e o verso do cartão acumularam campos que confundem mais do que ajudam: a Origem (novo ou retomado), que ninguém usa; dois textos livres (Contexto e Observações) ao lado de um terceiro (as Anotações); e uma data da modelagem piloto que servia ao mesmo tempo de agenda e de registro, gerando os selos "Modelagem hoje" e "Modelagem dd/mm" em cartões que ainda nem começaram. O verso repete o macroprocesso e o tipo no topo e no lado direito, mostra há quanto tempo o responsável está no processo e um "Trocar" separado do nome, e a árvore da Lista amontoa os arquivos numa linha só, com rótulos curtos. Com esta mudança, o cadastro pede só o necessário e um único texto livre, as **Anotações**; a data passa a ser só a de **realização** da modelagem piloto, registrada na linha da etapa Modelagem piloto, nunca no futuro; o verso mostra o responsável pela foto e pelo nome, que se clica para trocar; o cartão perde os selos de modelagem e de "Sem responsável"; e a árvore recua cada nível e lista os arquivos um abaixo do outro, pelo nome completo e com o ícone do tipo. O aviso "Escolha o setor do processo." deixa de ficar na tela depois que o setor é escolhido.

## Problema

A equipe do EP cadastra processos preenchendo campos que não usa (Origem) ou que não sabe distinguir (Contexto, Observações, Anotações), e uma data da modelagem piloto que ora é agenda, ora é registro. No Quadro, cartões de Não iniciados ganham selo de "Modelagem hoje" por causa de uma agenda que a plataforma não deveria guardar, e cartões sem responsável ganham um selo que só ocupa espaço. No verso, o topo repete o macroprocesso e o tipo que já estão no "Sobre", o responsável vem com um tempo ("há 1 dia") e um "Trocar" que poluem a linha, a seção dos arquivos tem um nome genérico, e a foto do responsável é pequena demais para reconhecer a pessoa. Na Lista agrupada por macroprocesso, os níveis da árvore quase não se distinguem e os arquivos aparecem lado a lado, com rótulos curtos, sem o nome real nem o tipo. No cadastro, a mensagem "Escolha o setor do processo." continua na tela depois que o setor é escolhido.

## Solução

- **Cadastro de Novo processo:** Nome, Setor, Macroprocesso, Tipo (e o processo pai, no subprocesso) e um campo **Anotações**. Saem Origem, Data da modelagem piloto, Contexto e Observações. O Editar processo perde Origem, Contexto e Observações e não ganha campo de Anotações (elas se escrevem no verso).
- **Anotações:** o texto livre único do processo, que agora já pode nascer no cadastro. O texto já gravado em Contexto e Observações é juntado nas Anotações pela migração.
- **Data da modelagem piloto:** só a data de realização. Sai do cadastro e do lado direito do verso; fica na linha da Modelagem piloto das Etapas, onde se registra, com o processo na Modelagem piloto ou depois dela, sem data futura. As datas futuras já gravadas são apagadas pela migração.
- **Cartão do Quadro:** saem os selos "Modelagem hoje", "Modelagem dd/mm" e "Sem responsável". Sem responsável, a frente não mostra ninguém. A foto (ou a bolinha com a letra) fica um pouco maior.
- **Verso:** sai o subtítulo do topo (macroprocesso · tipo); o responsável aparece só pela foto e pelo nome, sem o tempo e sem o "Trocar", e clicar no nome abre a escolha; sem responsável, um texto discreto "Escolher responsável" (só para quem pode alterar); a foto fica um pouco maior; o "Sobre" fica com Setor, Macroprocesso e Tipo; a seção "Arquivos" passa a se chamar "Documentos do Mapeamento".
- **Origem:** sai de vez da plataforma e do banco; o histórico antigo continua legível.
- **Árvore da Lista:** cada nível (macroprocesso, setor, processo, subprocesso, arquivos) recuado em relação ao de cima; os arquivos da versão mais recente um abaixo do outro, cada um com o nome completo do arquivo e o ícone do tipo (.docx, .bpmn, .bpm, .png).
- **Planilha interna dos dashboards:** a coluna "Observações" fica, com o cabeçalho, sempre vazia; "Data da modelagem piloto" continua, com a conclusão da fase IV no lugar quando a data está vazia.
- **Bug do setor:** ao mudar qualquer campo do formulário, a mensagem de recusa some.

## Histórias de usuário

### Cadastro e edição do processo

1. Como integrante do EP, quero cadastrar um processo sem escolher a Origem, para não responder a uma pergunta que não uso.
2. Como integrante do EP, quero cadastrar um processo sem informar a data da modelagem piloto, para não confundir agenda com registro.
3. Como integrante do EP, quero um só campo de texto livre no cadastro, chamado Anotações, para escrever o contexto e as observações num lugar só.
4. Como integrante do EP, quero que o que escrevi nas Anotações do cadastro apareça no bloco das Anotações do verso, para continuar escrevendo de onde parei.
5. Como integrante do EP, quero que as Anotações do cadastro registrem quem escreveu e quando, como as escritas no verso, para saber a origem do texto.
6. Como integrante do EP, quero que o campo Anotações do cadastro aceite o mesmo tamanho que o bloco do verso, para não ser barrado num lugar e aceito no outro.
7. Como integrante do EP, quero cadastrar um processo com as Anotações em branco, para não ser obrigado a escrever nada.
8. Como integrante do EP, quero que o Editar processo não tenha Origem, Contexto nem Observações, para que a edição mostre só o que existe.
9. Como integrante do EP, quero que a mensagem "Escolha o setor do processo." suma assim que eu escolher o setor, para não achar que ainda falta algo.
10. Como integrante do EP, quero que qualquer mensagem de recusa do formulário suma quando eu mudar um campo, para que ela só reapareça se, ao enviar de novo, ainda houver problema.

### Anotações e textos antigos

11. Como integrante do EP, quero que o Contexto e as Observações já gravados passem para as Anotações, para não perder nada do que a equipe escreveu.
12. Como integrante do EP, quero que o texto juntado diga de onde veio ("Contexto: …", "Observações: …") e venha antes do que já havia nas Anotações, para reconhecer cada parte.
13. Como integrante do EP, quero que a junção ignore os trechos vazios, para não ver rótulos sem texto.
14. Como integrante do EP, quero que o "Sobre" do verso mostre só Setor, Macroprocesso e Tipo, para não haver um segundo lugar de texto livre.
15. Como pessoa de perfil Consulta, quero continuar lendo as Anotações, inclusive o texto juntado, sem poder alterar.

### Data da modelagem piloto

16. Como integrante do EP, quero registrar a data em que a modelagem piloto aconteceu na linha da Modelagem piloto das Etapas, para guardar o registro junto da etapa a que pertence.
17. Como integrante do EP, quero registrar essa data quando o processo está na Modelagem piloto ou numa etapa depois dela, inclusive em Concluídos, para registrar modelagens antigas sem voltar o processo.
18. Como integrante do EP, quero que o processo em Não iniciados não ofereça registrar a data, porque a modelagem ainda não aconteceu.
19. Como integrante do EP, quero que o campo recuse data futura, com a data digitada e o limite (hoje, em Brasília), para não usar o campo como agenda.
20. Como integrante do EP, quero que o banco também recuse data futura, para que nenhum caminho fuja da regra.
21. Como integrante do EP, quero alterar ou apagar a data já registrada, para corrigir um engano.
22. Como integrante do EP, quero que registrar a data não mova o processo nem mude a etiqueta, porque é só um dado.
23. Como pessoa de perfil Consulta, quero ver a data registrada na linha da Modelagem piloto, sem poder alterar.
24. Como integrante do EP, quero que um processo suspenso ou cancelado mostre a data só para leitura, como os outros dados dele.
25. Como integrante do EP, quero que um processo que voltou para Não iniciados com data registrada continue mostrando a data, só para leitura.
26. Como integrante do EP, quero que a data não apareça mais no lado direito do verso, para que ela só exista num lugar.
27. Como integrante do EP, quero que as datas futuras já gravadas sejam apagadas, porque eram agendas e não realizações.
28. Como integrante do EP, quero que a mudança de data continue registrada no histórico do processo, como hoje.

### Cartão do Quadro

29. Como integrante do EP, quero que nenhum cartão mostre "Modelagem hoje" ou "Modelagem dd/mm", porque a plataforma não guarda mais agenda.
30. Como integrante do EP, quero que o cartão sem responsável não mostre selo nem foto, para que a frente fique limpa.
31. Como integrante do EP, quero continuar vendo a coluna "Sem responsável" no Quadro agrupado por responsável, para achar o que ninguém pegou.
32. Como integrante do EP, quero a foto do responsável (ou a bolinha com a letra) um pouco maior na frente do cartão, para reconhecer a pessoa de relance.

### Verso do cartão

33. Como integrante do EP, quero que o topo do verso mostre só o nome do processo, sem o macroprocesso e o tipo, porque eles já estão no "Sobre".
34. Como integrante do EP, quero ver o responsável no verso só pela foto e pelo nome, sem o tempo ("há 1 dia"), para a linha ficar limpa.
35. Como integrante do EP, quero clicar no nome do responsável para escolher outro, sem um "Trocar" separado.
36. Como integrante do EP, quero que, sem responsável, o verso mostre um texto discreto "Escolher responsável", que abre a mesma escolha.
37. Como pessoa de perfil Consulta, quero ver o nome do responsável sem poder clicar para trocar, e não ver "Escolher responsável" quando não há ninguém.
38. Como integrante do EP, quero a foto do responsável um pouco maior no verso, para reconhecer a pessoa.
39. Como integrante do EP, quero que o responsável inativo continue identificado como "(Inativo)" ao lado do nome.
40. Como integrante do EP, quero que a seção dos arquivos do verso se chame "Documentos do Mapeamento", para dizer o que ela guarda.
41. Como integrante do EP, quero que a Origem não apareça mais no "Sobre".

### Árvore da Lista

42. Como integrante do EP, quero que cada nível da árvore (macroprocesso, setor, processo, subprocesso) fique recuado em relação ao de cima, para ver a hierarquia de relance.
43. Como integrante do EP, quero que os arquivos de um processo aberto fiquem recuados abaixo dele, um abaixo do outro, para ler cada um sem esforço.
44. Como integrante do EP, quero ver o nome completo de cada arquivo, como foi enviado, para saber exatamente qual é.
45. Como integrante do EP, quero ver o ícone do tipo de cada arquivo (.docx, .bpmn, .bpm, .png), para achar o que procuro sem ler a extensão.
46. Como integrante do EP, quero continuar vendo a versão mais recente e o selo "Aprovada" acima dos arquivos, e baixar cada arquivo clicando no nome, como hoje.

### Origem e planilhas

47. Como administrador, quero que a Origem saia do banco, para não guardar um dado que ninguém usa.
48. Como integrante do EP, quero que o histórico antigo que menciona a Origem, o Contexto ou as Observações continue legível, para não perder o registro do que mudou.
49. Como responsável pelos painéis do Data Studio, quero que a planilha interna mantenha a coluna "Observações" (vazia) e a "Data da modelagem piloto", para nenhum painel quebrar.

## Decisões de implementação

- **Formulário do processo.** Os campos compartilhados de cadastro e edição perdem Origem, Contexto, Observações e Data da modelagem piloto. Só o cadastro ganha "Anotações" (área de texto, mesmo limite do bloco do verso). Os campos do formulário e os dados enviados ao módulo de processos perdem `origem`, `contexto`, `observacoes` e `dataDaModelagemPiloto` e ganham `anotacoes` (só no cadastro). Em branco ou só espaços, as Anotações vão como nulas, como no bloco do verso.
- **Bug do setor.** A causa: a mensagem de recusa do formulário é calculada só ao enviar e nunca é apagada ao mudar um campo. A correção: toda mudança de campo apaga a mensagem; ela volta, se for o caso, no próximo envio. Vale para recusas de validação e do banco.
- **Tipos do processo.** O processo lido e o da lista perdem `origem`, `contexto` e `observacoes`; `dataDaModelagemPiloto` fica. Os rótulos da Origem saem. O módulo falso e o do Supabase acompanham.
- **Selos do cartão.** Saem os tipos de selo `modelagem` e `sem_responsavel` e as funções deles; a ordem dos demais não muda. O módulo que dizia se a modelagem é "próxima" ou "realizada" perde essa parte (o que sobrar só se usar para a data de hoje em Brasília fica onde já está, ou se junta ao que já calcula "hoje em Brasília").
- **Data da modelagem piloto no verso.** Sai a seção do lado direito. A linha da etapa Modelagem piloto nas Etapas mostra "Realizada em dd/mm/aaaa" quando há data e, para quem pode alterar, "Registrar data" ou "Alterar data", que vira ali mesmo o campo de data (reaproveitando o campo de data do processo, o mesmo da data da validação), com apagar. Editável quando: perfil Administrador ou Integrante, processo em andamento ou concluído (não suspenso nem cancelado) e etapa atual com ordem igual ou maior que a da Modelagem piloto no catálogo. Fora disso, só leitura, e só aparece se houver data. O campo recusa data maior que hoje em Brasília antes de enviar, com a mensagem "A data da modelagem piloto não pode ser depois de hoje: recebido dd/mm/aaaa, limite dd/mm/aaaa." (o texto exato fica com a execução, mantendo valor recebido e limite).
- **Responsável no verso.** A linha do responsável no Agora mostra a foto (tamanho maior que hoje) e o nome; sem o tempo na etapa ao lado do nome e sem o "Trocar". O nome é o botão que abre a lista suspensa de responsáveis (a mesma de hoje: escolher grava, Esc fecha só a lista, o foco volta ao nome). Sem responsável, o botão tem o texto "Escolher responsável", em estilo discreto. Na Consulta, o nome é texto, e sem responsável nada aparece. O [Assumir] e o aviso de dias na etapa parada continuam como estão. O nome acessível do botão diz a ação ("Trocar o responsável: Ana Teste" ou "Escolher responsável").
- **Tamanho da foto.** Frente do cartão: de 20 para 24 px. Verso: de 24 para 32 px. Ajuste fino no `/polir`.
- **Cabeçalho do verso.** Sai o subtítulo (a bolinha da cor do macroprocesso, o nome do macroprocesso e o tipo). Ficam o selo do setor, o nome, a pílula de situação fora do normal, o "⋯" e o fechar.
- **"Sobre" do verso.** Fica com Setor, Macroprocesso e Tipo. Sai o bloco de textos longos.
- **Seção de arquivos do verso.** O título passa a "Documentos do Mapeamento"; o nome acessível da região acompanha. Não é termo do glossário (sabatina, decisão 7). A legenda "Arquivos" do formulário de envio de versão não muda.
- **Árvore da Lista.** Recuo crescente por nível, num passo fixo: macroprocesso no nível 0, setor no 1, processo no 2, subprocesso no 3, e a linha dos arquivos um passo à frente do processo a que pertence. Os arquivos viram uma lista vertical: em cada item, o ícone do tipo e o nome completo do arquivo (o nome original gravado), como link de download (mesmo comportamento de hoje, inclusive a falha abaixo do nome). Os tipos com ícone: .docx (relatório), .bpmn, .bpm e .png; outro formato que chegue usa um ícone genérico de arquivo. Os ícones entram no conjunto de ícones já desenhado no projeto, sem biblioteca nova. A seleção de arquivos (fluxo e relatório que vale, sem anexos nem .pdf da aprovação), a ordem, o rótulo da versão e o selo "Aprovada" não mudam.
- **Planilha interna (Edge Function `planilhas-dos-dashboards`).** A coluna "Observações" sai sempre vazia, com o cabeçalho. A função deixa de ler `observacoes` do pacote. "Data da modelagem piloto" não muda. A função precisa ser publicada de novo no desenvolvimento depois da migração.
- **Histórico.** Eventos antigos guardam `origem`, `contexto` e `observacoes` no estado; a leitura do histórico continua sabendo nomear essas chaves. Eventos novos não as têm mais.

## Modelo de dados

Uma migração, destrutiva só para dados inventados do desenvolvimento (não há produção). Em ordem:

1. **Junta os textos nas Anotações.** Para cada processo com `contexto` ou `observacoes` não vazios: `anotacoes` passa a ser, separados por uma linha em branco e só os trechos não vazios, "Contexto: <contexto>", "Observações: <observacoes>" e o texto que já havia nas Anotações. A junção passa pelo gatilho das Anotações (quem e quando ficam com a migração: nulo e a hora da migração).
2. **Limite das Anotações.** Sobe de 2.000 para 8.000 caracteres (a soma dos três limites antigos, 4.000 + 2.000 + 2.000, mais os rótulos), no banco e nos dois campos da tela.
3. **Apaga as datas futuras** de `data_da_modelagem_piloto` (maiores que hoje em `America/Sao_Paulo`), registrando a mudança no histórico como as outras.
4. **Recusa data futura:** gatilho em `processos` (antes de inserir e de alterar a data) que recusa `data_da_modelagem_piloto` maior que hoje em Brasília, com mensagem que traz a data recebida e o limite. Gatilho, e não `check`, porque a data de hoje muda e o `check` precisa ser fixo.
5. **Anotações no cadastro:** `grant insert (anotacoes)` em `processos` para `authenticated`; o gatilho que preenche quem e quando as Anotações mudaram passa a valer também ao inserir, com texto não nulo.
6. **Sai a data do cadastro:** `revoke insert (data_da_modelagem_piloto)`. A data continua gravável pela função de hoje (que passa a recusar data futura pelo gatilho).
7. **Sai a Origem, o Contexto e as Observações:** a view `processos_com_andamento` é recriada sem `origem`, `contexto` e `observacoes` (mesmas colunas e ordem no resto, `security_invoker = true`); as funções que listam as colunas uma a uma (estado do processo guardado no histórico, leituras do processo, pacote das planilhas) deixam de citar as três; os privilégios de coluna saem; as colunas `origem`, `contexto` e `observacoes` e o tipo `origem_do_processo` são apagados.

**Quem pode o quê** (sem tabela nova; a RLS de `processos` não muda):

| Ação | Administrador | Integrante do EP | Consulta | Usuário desativado | Visitante sem login |
|-|-|-|-|-|-|
| Cadastrar processo com Anotações | sim | sim | não | não | não |
| Gravar a data da modelagem piloto (passado ou hoje) | sim | sim | não | não | não |
| Gravar data futura | não (recusa) | não (recusa) | não | não | não |
| Ler Anotações e data | sim | sim | sim | não | não |

## Estados de tela

A mudança não traz tela nova que carrega dados.

- **Cadastro:** sem mudança nos estados (carregando as opções, erro ao carregar, recusa do banco). A recusa some ao mudar um campo.
- **Data na linha da Modelagem piloto:** gravando, o campo fica desabilitado; falha de gravação (inclusive de conexão) mostra a mensagem abaixo do campo e mantém a data anterior, como a data da validação hoje.
- **Escolha do responsável:** falha de gravação mantém o responsável anterior e mostra o aviso de hoje.
- **Árvore:** "Carregando arquivos…", erro com "Tentar de novo" e "Sem versão ainda." continuam como hoje, no novo recuo.

## Decisões de teste

- **Um ponto de teste: a tela inteira.** Os testes renderizam o `App` com os módulos falsos (processos, cadastros, versões, revisões, planilhas, acesso) e agem como a pessoa: preenchem o cadastro, abrem o verso pela rota, clicam, digitam. Conferem só o que se vê e o que o módulo falso recebeu, nunca detalhes internos. Arte anterior: `App.cadastrarProcesso.test.tsx`, `App.dataDaModelagemPiloto.test.tsx`, `App.dataDaValidacao.test.tsx`, `App.cartaoDoQuadro.test.tsx`, `App.versoDoCartao.test.tsx`, `App.agoraDoVerso.test.tsx`, `App.contextoDoVerso.test.tsx`, `App.arvoreDaLista.test.tsx`, `App.anotacoesDoProcesso.test.tsx`, com o "hoje" simulado só no `Date`.
- Os testes existentes que cobrem o que sai (Origem, Contexto, Observações, selo de modelagem, selo "Sem responsável", data no lado direito, "Trocar") são reescritos para o comportamento novo, não apagados sem substituto.
- **Banco (pgTAP), segundo ponto, inevitável:** a junção dos textos (com e sem cada trecho), o limite novo, a recusa de data futura ao inserir e ao alterar (com o valor e o limite na mensagem), a data de hoje aceita, as datas futuras apagadas, as Anotações no cadastro com quem e quando, a view sem as três colunas, cada célula da tabela "quem pode o quê" com cada perfil, o desativado e o visitante. Arte anterior: `63_criar_processo_com_data_da_modelagem.test.sql`, os testes das Anotações. Rodam no Docker local; o workflow "Testes de banco" confere no fim.
- **Planilha:** o teste puro da planilha interna (Vitest, em `supabase/functions/_shared/`) passa a conferir "Observações" sempre vazia e "Data da modelagem piloto" sem mudança.
- Módulos de lógica que mudam (selos do cartão, validação do processo) mantêm seus testes unitários atualizados.

## Fora do escopo

- Apagar a coluna "Observações" da planilha interna (backlog; decidir com o Data Studio).
- Histórico de versões das Anotações.
- Agenda das modelagens dentro da plataforma (ADR 0035).
- Mudar o [Assumir], o aviso de processo parado ou a coluna "Sem responsável" do agrupamento por responsável.
- Novos tipos de arquivo ou anexos na árvore.
- Exportação em CSV (não existe, ADR 0017).

## Decisões tomadas ao escrever esta spec (confirmadas pelo usuário em 2026-10-29)

- Limite das Anotações sobe para 8.000 caracteres, para a junção nunca cortar texto (a sabatina não tratou do tamanho; é a opção mais conservadora, e baixar depois é fácil enquanto não há produção).
- O Editar processo não ganha campo de Anotações: elas continuam só no bloco do verso, para não haver dois lugares de escrever o mesmo texto depois do cadastro.
- A data registrada continua visível, só para leitura, quando o processo volta para Não iniciados.
- Tamanhos da foto: 24 px na frente e 32 px no verso.
- O tempo na etapa ("há 1 dia") sai só da linha do responsável; o aviso de processo parado continua.
- Arquivo de formato sem ícone próprio usa um ícone genérico.

## Divergência com `.scratch/especificacao.md`

A especificação original lista no processo os campos origem (novo | retomado), contexto e observações. Esta spec os retira, por decisão do usuário na sabatina de 2026-10-29: o contexto e as observações passam a viver nas Anotações, e a Origem deixa de existir.

## Critérios de pronto

1. O cadastro de Novo processo não tem Origem, Data da modelagem piloto, Contexto nem Observações, e tem Anotações; o texto escrito aparece no bloco das Anotações do verso, com quem e quando.
2. O Editar processo não tem Origem, Contexto nem Observações.
3. Ao escolher o setor depois da mensagem "Escolha o setor do processo.", a mensagem some.
4. Nenhum cartão mostra "Modelagem hoje", "Modelagem dd/mm" nem "Sem responsável"; a coluna "Sem responsável" do agrupamento por responsável continua.
5. A data da modelagem piloto se registra, altera e apaga na linha da Modelagem piloto das Etapas, com o processo nela ou depois; em Não iniciados, não se oferece; data futura é recusada pela tela e pelo banco, com o valor e o limite; a Consulta só lê.
6. O lado direito do verso não tem a seção da data; o "Sobre" tem só Setor, Macroprocesso e Tipo.
7. O topo do verso não mostra o macroprocesso nem o tipo.
8. O responsável no verso aparece pela foto e pelo nome, sem tempo nem "Trocar"; clicar no nome abre a escolha; sem responsável, "Escolher responsável" para Administrador e Integrante, nada para a Consulta.
9. A seção de arquivos do verso se chama "Documentos do Mapeamento".
10. Na árvore, os arquivos aparecem um abaixo do outro, com o nome completo e o ícone do tipo, e cada um baixa ao clicar.
11. A migração junta Contexto e Observações nas Anotações, apaga datas futuras, recusa data futura, apaga Origem, Contexto, Observações e o tipo da Origem; os testes pgTAP passam no Docker local e no workflow "Testes de banco".
12. A planilha interna sai com "Observações" vazia e "Data da modelagem piloto" como antes.
13. O histórico antigo com Origem, Contexto ou Observações continua legível.
14. `[visual]` A foto do responsável está maior na frente do cartão e no verso, sem desalinhar a linha.
15. `[visual]` Na árvore, cada nível está recuado em relação ao de cima, e a linha dos arquivos se lê como parte do processo acima.
16. `[visual]` "Escolher responsável" aparece discreto, sem competir com o botão principal do Agora.
17. `[visual]` A data na linha da Modelagem piloto cabe na linha das Etapas sem quebrar o desenho da linha do tempo.

Entregue em 2026-10-30 (commit 7a02d80), com ressalva: critérios [visual] 14 a 17 presumidos (nada visto com o login real); revisão de segurança foi a de reserva (menos completa: o /security-review só viu documentação); conferência do cadastro aberto no painel do Supabase de desenvolvimento adiada (backlog); a Edge Function planilhas-dos-dashboards ainda precisa ser publicada de novo no desenvolvimento; pgTAP só no workflow "Testes de banco" (Docker indisponível); as ressalvas das entregas anteriores seguem valendo
