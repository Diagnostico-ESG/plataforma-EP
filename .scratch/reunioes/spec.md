# Reuniões

Status: ready-for-agent

**Como resolve o problema.** Hoje as reuniões com os setores ficam em agendas e anotações soltas: não se sabe com certeza quando o EP se reuniu com cada setor, quem estava presente, que processos foram tratados nem o que se combinou. Com esta funcionalidade, a equipe do EP registra na plataforma cada reunião de sensibilização (com o setor) e de modelagem (com o setor, tratando um ou mais processos dele), com data, hora opcional, local, participantes e anotações, inclusive as que ainda vão acontecer. A área Reuniões da faixa lateral mostra todas, com as próximas no topo e filtros por setor, tipo e período; o setor aberto e o painel do processo mostram as reuniões ligadas a eles, com atalho para registrar uma nova já preenchida. A reunião é um registro: não mexe em nenhuma etapa. O banco impõe as regras (setor único, processos do próprio setor, modelagem com processo, setor e processo com reunião não se excluem) e guarda toda mudança no histórico.

Decisões de origem: sabatina de 2026-10-14 (duas rodadas, todas as recomendações aceitas) e `CONTEXT.md` (seção "Reuniões"). Nenhum ADR novo.

## Problema

O EP faz uma ou mais reuniões de sensibilização com cada setor atendido e reuniões de modelagem para os processos dele, mas o registro delas fica fora da plataforma. Quando alguém pergunta "já nos reunimos com o setor X?", "quem do setor estava na modelagem do processo Y?" ou "o que ficou combinado?", a resposta depende da memória ou de arquivos pessoais. As reuniões futuras também não aparecem para a equipe, e reuniões já realizadas ficam sem anotações sem que ninguém perceba.

## Solução

- **Área Reuniões** (item "Reuniões" da faixa lateral, que hoje não abre nada):
  - uma lista com as próximas reuniões no topo (da mais próxima para a mais distante) e depois as realizadas (da mais recente para a mais antiga), cada linha com data e hora, tipo, setor, processos tratados, local e a marca "sem anotações" na realizada que não tem anotações;
  - filtros por setor, tipo e período (de, até), guardados no endereço, com "Limpar filtros";
  - [Registrar reunião] para Administrador e Integrante;
  - clicar numa linha abre o **painel da reunião** à direita, com todos os dados, [Editar] e [Excluir] para Administrador e Integrante, e a aba Histórico.
- **Formulário da reunião:** tipo (sensibilização ou modelagem), setor (só setores ativos), processos do setor (só na modelagem, ao menos um), data, hora (opcional), local, participantes (usuários do EP e responsáveis do setor, marcados em listas, mais "outros participantes" escritos um por linha) e anotações.
- **Setor aberto** (área Setores): ganha a seção Reuniões, com as reuniões do setor e [Registrar reunião] com o setor preenchido.
- **Painel do processo:** ganha a seção Reuniões, com as reuniões de modelagem que trataram o processo e [Registrar reunião] com tipo modelagem, setor e processo preenchidos. O histórico do processo passa a mostrar os eventos dessas reuniões.

A Consulta vê tudo sem nenhum botão de alteração. O banco impõe as regras: quem não pode alterar é recusado mesmo que tente fora da tela, e toda mudança vira evento no histórico.

## Histórias de usuário

### Registrar uma reunião

1. Como integrante do EP, quero registrar uma reunião de sensibilização com um setor, para guardar quando e com quem ela aconteceu.
2. Como integrante do EP, quero registrar uma reunião de modelagem com um setor e marcar os processos dele que foram tratados, para saber em que reunião cada processo foi modelado.
3. Como integrante do EP, quero marcar vários processos numa mesma reunião de modelagem, para não repetir o registro quando uma tarde cobriu dois ou três processos.
4. Como integrante do EP, quero que a reunião de modelagem exija ao menos um processo, para que ela nunca fique solta.
5. Como integrante do EP, quero ver na escolha de processos só os processos e subprocessos do setor da reunião, em qualquer situação (em andamento, suspenso, cancelado ou concluído), para lançar também reuniões antigas.
6. Como integrante do EP, quero que a reunião de sensibilização não tenha processos, para que o formulário não me peça o que não existe.
7. Como integrante do EP, quero informar a data e, se quiser, a hora de início, para registrar reuniões das quais não sei a hora exata.
8. Como integrante do EP, quero escrever o local em texto livre (sala, endereço ou link da chamada).
9. Como integrante do EP, quero marcar quais usuários do EP participaram, escolhendo de uma lista, para que o nome fique igual ao cadastro.
10. Como integrante do EP, quero marcar quais responsáveis do setor participaram, escolhendo da lista do setor da reunião.
11. Como integrante do EP, quero escrever outros participantes, um por linha, para registrar quem não está cadastrado.
12. Como integrante do EP, quero escrever as anotações em texto simples, com bastante espaço, para registrar o que foi tratado e combinado.
13. Como integrante do EP, quero registrar uma reunião que ainda vai acontecer e preencher as anotações depois.
14. Como integrante do EP, quero que só setores ativos apareçam na escolha do setor, para não registrar reunião com setor que não é mais atendido.
15. Como integrante do EP, quero que, ao trocar o setor no formulário, os processos e responsáveis marcados que não são do novo setor saiam da marcação, para não gravar algo incoerente.
16. Como integrante do EP, quero que, ao trocar o tipo para sensibilização, os processos marcados saiam, para não gravar algo incoerente.
17. Como integrante do EP, quero que o botão de salvar fique desabilitado enquanto faltam tipo, setor, data ou (na modelagem) processo, para saber o que falta.
18. Como integrante do EP, quero ver uma mensagem clara quando a gravação falhar ou o banco recusar, sem perder o que preenchi.

### Consultar reuniões

19. Como usuário, quero abrir a área Reuniões e ver todas as reuniões, para ter o panorama do trabalho com os setores.
20. Como usuário, quero ver as próximas reuniões no topo, da mais próxima para a mais distante, para saber o que vem a seguir.
21. Como usuário, quero ver as realizadas abaixo, da mais recente para a mais antiga.
22. Como integrante do EP, quero ver a marca "sem anotações" nas reuniões realizadas sem anotações, para lembrar de preenchê-las.
23. Como usuário, quero filtrar por setor, por tipo e por período, para achar uma reunião específica.
24. Como usuário, quero que os filtros fiquem no endereço, para voltar a eles ou mandar o link a um colega.
25. Como usuário, quero limpar todos os filtros de uma vez.
26. Como usuário, quero clicar numa reunião e ver o painel com todos os dados dela: tipo, setor, processos, data, hora, local, participantes e anotações.
27. Como usuário, quero ver marcados como inativos o usuário, o setor ou o processo que deixaram de estar ativos depois da reunião, para entender o registro antigo.
28. Como usuário, quero clicar num processo tratado na reunião e abrir o painel dele.

### Alterar e excluir

29. Como integrante do EP, quero editar qualquer campo da reunião, inclusive tipo e setor, para corrigir um registro errado.
30. Como integrante do EP, quero excluir uma reunião, com confirmação, para tirar uma reunião que não aconteceu.
31. Como administrador, quero que a exclusão fique no histórico com tudo o que a reunião tinha, para nada se perder.

### Reuniões no setor e no processo

32. Como usuário, quero ver as reuniões do setor no setor aberto, para saber se a sensibilização já aconteceu e quantas houve.
33. Como integrante do EP, quero registrar uma reunião a partir do setor aberto, já com o setor preenchido.
34. Como usuário, quero ver no painel do processo as reuniões de modelagem que trataram o processo.
35. Como integrante do EP, quero registrar uma reunião a partir do painel do processo, já com tipo modelagem, setor e processo preenchidos.
36. Como usuário, quero ver no histórico do processo os eventos das reuniões que o trataram.

### Histórico

37. Como usuário, quero ver na aba Histórico da reunião quem a criou, alterou ou excluiu, quando e o que mudou.
38. Como usuário, quero ver os eventos de reunião no histórico geral, junto com os demais.
39. Como usuário, quero que salvar sem mudar nada não gere evento.

### Perfis

40. Como pessoa de perfil Consulta, quero ver a área Reuniões, o painel da reunião e as seções do setor e do processo, sem nenhum botão de alteração.
41. Como administrador, quero que o banco recuse a gravação feita pela Consulta, por usuário inativo e por visitante, mesmo fora da tela.

### Efeitos nos cadastros

42. Como integrante do EP, quero que um setor com reuniões não possa ser excluído, com uma mensagem que diga quantas reuniões ele tem, para que o registro não se perca (o caminho é desativá-lo).
43. Como integrante do EP, quero que um processo tratado numa reunião não possa ser excluído, com uma mensagem que diga quantas reuniões o trataram (o caminho é cancelá-lo).
44. Como integrante do EP, quero que o responsável do setor excluído continue nas reuniões em que esteve, como outro participante com o nome que tinha, para a lista de responsáveis ficar limpa sem apagar quem estava presente.
45. Como integrante do EP, quero que a reclassificação de um processo não mexa nas reuniões dele.

## Decisões de implementação

### Interface

- **Área Reuniões:** a área `reunioes`, que já existe na faixa lateral sem tela, ganha tela. Segue o padrão da Lista de processos: tabela compacta, filtros no endereço com "Limpar filtros", e painel à direita para o item aberto (o id do item aberto também no endereço).
- **Próxima ou realizada:** é calculado na tela a partir da data, sem campo guardado. Reunião com data depois de hoje é próxima; a de hoje e as anteriores são realizadas. A marca "sem anotações" só aparece nas realizadas.
- **Estados de cada tela que carrega dados** (área Reuniões, painel da reunião, formulário e as seções no setor e no processo):
  - **carregando:** o aviso "Carregando…" no lugar do conteúdo, no padrão das outras áreas;
  - **sem dados:** "Nenhuma reunião registrada." (com [Registrar reunião] para quem pode); com filtros, "Nenhuma reunião com esses filtros." e [Limpar filtros]; na seção do setor ou do processo, "Nenhuma reunião.";
  - **erro, inclusive falha de conexão:** "Não foi possível carregar as reuniões. Verifique a conexão e tente de novo." com [Tentar de novo], no padrão de `ErroAoCarregar`;
  - **reunião que não existe mais:** o painel avisa que ela foi excluída, no padrão do item inexistente dos cadastros.
- **Período:** os filtros "de" e "até" são campos de data nativos, e cada um pode ficar vazio.
- **Formulário:** abre no painel à direita, no padrão do cadastro de processo. Tipo em escolha única, setor em lista de setores ativos (o setor inativo da reunião que já existe aparece marcado), processos em caixas de marcar com os processos e subprocessos do setor, data e hora em campos nativos (`date` e `time`), local em campo de uma linha, usuários do EP em caixas de marcar com os usuários ativos, responsáveis do setor em caixas de marcar com a lista do setor, outros participantes e anotações em áreas de texto. Os usuários e responsáveis já marcados que ficaram inativos ou saíram da lista continuam aparecendo marcados.
- **Exclusão:** pela janela de confirmação que já existe.
- **Recusas do banco:** cada recusa chega como código, que vira mensagem na tela, no padrão de `recusasDeProcessos`: setor inativo, processo de outro setor, modelagem sem processo, sensibilização com processo, responsável de outro setor, texto longo demais; na exclusão de setor e de processo, a contagem de reuniões.
- **Seções no setor e no processo:** lista curta (data, tipo e, no setor, os processos) com clique que abre a reunião na área Reuniões, e [Registrar reunião] que abre o formulário preenchido.
- **Histórico:** a aba Histórico da reunião e o histórico geral usam a lista de eventos que já existe; os textos dos eventos de reunião ganham o seu formato (tipo, data, setor, o que mudou). O histórico do processo inclui os eventos de reunião em que o processo aparece antes ou depois da mudança.
- **Módulo de reuniões:** um módulo próprio, ao lado do de processos, com a mesma forma (interface com uma implementação Supabase e uma falsa nomeada): listar reuniões, ler uma reunião com o histórico, opções do formulário (setores ativos, processos e responsáveis de um setor, usuários ativos), salvar (criar ou alterar) e excluir. As leituras do setor aberto e do painel do processo ganham as reuniões ligadas.

### Modelo de dados

**Tipo novo:** `tipo_de_reuniao` = `sensibilizacao` | `modelagem`.

**Tabela `reunioes`:**

| Coluna | Tipo | Obrigatória | Observação |
|---|---|---|---|
| `id` | uuid | sim | gerado |
| `setor_id` | uuid → `setores` | sim | referência recusa apagar o setor |
| `tipo` | `tipo_de_reuniao` | sim | |
| `data` | date | sim | pode ser futura |
| `hora` | time | não | hora de início |
| `local` | text | não | até 300 caracteres, sem espaços nas pontas, vazio vira nulo |
| `anotacoes` | text | não | até 10.000 caracteres, vazio vira nulo |
| `outros_participantes` | text[] | sim (vazia por padrão) | um nome por item, cada um até 200 caracteres, sem itens vazios |
| `criado_em` | timestamptz | sim | gerado |

**Tabela `reunioes_processos`** (processos tratados na modelagem): `reuniao_id` → `reunioes` (apaga junto com a reunião), `processo_id` → `processos` (recusa apagar o processo); chave nas duas colunas.

**Tabela `reunioes_usuarios`** (usuários do EP presentes): `reuniao_id` → `reunioes` (apaga junto), `usuario_id` → `usuarios`; chave nas duas colunas. Usuário não se apaga depois do primeiro acesso, então a referência não precisa de regra de exclusão.

**Tabela `reunioes_responsaveis`** (responsáveis do setor presentes): `reuniao_id` → `reunioes` (apaga junto), `responsavel_id` → `responsaveis_do_setor` (apaga junto, depois que o gatilho copia o nome); chave nas duas colunas.

**Dado pessoal:** nomes de usuários, de responsáveis do setor e de outros participantes. Todo perfil ativo os vê, como já vê os responsáveis do setor (decisão da sabatina de cadastros-basicos). O e-mail do responsável não aparece na reunião.

**Privilégios padrão:** cada tabela nova nasce com `revoke all` de visitante e de logado e concede de volta só o necessário a logado (`reunioes`: inclui e altera só tipo, setor, data, hora, local, anotações e outros participantes; as tabelas de ligação: inclui e apaga). Assim o teste `10_privilegios_padrao` continua passando.

**Gravação em várias linhas:** salvar uma reunião (os dados mais as três listas de ligação) passa por uma função do banco chamada pela interface, sem `security definer`, que roda com a permissão de quem chama e grava tudo de uma vez. A RLS decide o resto. Excluir pode ir direto à tabela.

#### Quem pode o quê (cada célula vira um teste pgTAP)

"Visitante" é quem não entrou; "Inativo" é qualquer perfil com `ativo` falso em `usuarios`.

| Tabela e ação | Administrador | Integrante do EP | Consulta | Inativo | Visitante |
|---|---|---|---|---|---|
| `reunioes` ler | sim | sim | sim | não | não |
| `reunioes` criar, alterar, apagar | sim | sim | não | não | não |
| `reunioes` alterar id, criado_em | não | não | não | não | não |
| `reunioes_processos`, `reunioes_usuarios`, `reunioes_responsaveis` ler | sim | sim | sim | não | não |
| `reunioes_processos`, `reunioes_usuarios`, `reunioes_responsaveis` criar, apagar | sim | sim | não | não | não |
| tabelas de ligação alterar | não (troca é apagar e criar) | não | não | não | não |
| `eventos` de reunião ler | sim | sim | sim | não | não |
| `eventos` criar, alterar, apagar | não (só os gatilhos ou a função incluem) | não | não | não | não |

#### Regras que o banco impõe

| Regra | Como | Caso de teste que a prova |
|---|---|---|
| Reunião nova só em setor ativo; a que já existe continua válida se o setor ficar inativo | gatilho antes de incluir e de trocar o setor | registrar em setor inativo recusado; desativar setor com reunião mantém a reunião |
| Modelagem tem ao menos um processo; sensibilização não tem nenhum | gatilho de restrição adiado para o fim da gravação (`deferrable initially deferred`) em `reunioes` e `reunioes_processos` | modelagem sem processo recusada; sensibilização com processo recusada; trocar o tipo para sensibilização tirando os processos na mesma gravação aceito |
| Processo da reunião é do setor da reunião | gatilho antes de incluir em `reunioes_processos`, ao trocar o setor da reunião e ao trocar o setor do processo (recusado se ele tem reunião; migração `processo_com_reunioes_nao_troca_de_setor`) | processo de outro setor recusado; trocar o setor com processo do setor antigo recusado; trocar o setor de processo com reunião recusado com a contagem |
| Processo em qualquer situação pode ser tratado | nenhuma restrição de situação | processo cancelado aceito |
| Responsável presente é do setor da reunião | gatilho antes de incluir em `reunioes_responsaveis` e ao trocar o setor | responsável de outro setor recusado |
| Não excluir setor com reunião | referência recusa apagar; a recusa traz a contagem | excluir setor com 2 reuniões recusado com "2" |
| Não excluir processo tratado em reunião | referência recusa apagar; a recusa traz a contagem | excluir processo com 1 reunião recusado com "1" |
| Responsável excluído vira outro participante com o nome que tinha | gatilho antes de apagar em `responsaveis_do_setor` acrescenta o nome a `outros_participantes` das reuniões dele | excluir responsável presente em 2 reuniões deixa o nome nas duas, como outro participante, com o evento de alteração |
| Textos no tamanho e sem espaços nas pontas; vazio vira nulo | restrições e gatilho antes de gravar | anotações com 10.001 caracteres recusadas; local "  " guardado como nulo; outro participante vazio descartado |
| Toda mudança vira um evento só por gravação, com autor, e com o estado completo antes e depois (dados, processos, usuários, responsáveis) | gatilhos (ou a função de salvar) com entidade `reuniao` e referência no id da reunião | criar, alterar e excluir geram um evento cada; a exclusão traz tudo no "antes" |
| Gravação sem mudança não vira evento | comparação de antes e depois | salvar sem mudar nada não gera evento |
| Eventos de reunião lidos por todo perfil ativo | política de leitura em `eventos` para a entidade `reuniao` | Consulta lê; inativo e visitante não |

#### Regras de estado

A reunião não tem situação guardada. "Próxima" e "realizada" são calculadas pela data, na tela. A reunião não muda o status de nenhuma etapa; as etapas "Reunião de sensibilização" e "Reunião de modelagem" continuam andando à mão.

#### Migração

Nenhuma migração destrutiva: só tabelas, tipo, gatilhos, políticas e uma função novos, mais o gatilho novo em `responsaveis_do_setor` e a política nova em `eventos`. Nenhum dado existente muda.

## Decisões de teste

- **Bom teste** confere o que a pessoa vê e consegue fazer, ou o que o banco aceita e recusa, nunca detalhes internos.
- **Interface (ponto de teste principal: a tela inteira).**
  - **Como:** Vitest com Testing Library, renderizando o aplicativo inteiro com a implementação falsa nomeada do módulo de reuniões. Ela guarda reuniões, ligações e histórico, aceita falhas programáveis e imita as recusas do banco, ao lado das falsas do acesso, dos cadastros e dos processos.
  - **O que cobre:**
    - a área Reuniões para cada perfil (Consulta sem botões);
    - a ordem (próximas no topo, depois realizadas) e a marca "sem anotações";
    - filtros no endereço e "Limpar filtros";
    - registrar sensibilização e modelagem, com um e com vários processos;
    - botão de salvar desabilitado enquanto falta campo obrigatório;
    - trocar setor e tipo desmarcando o que não cabe;
    - editar e excluir, com sucesso e com falha;
    - cada mensagem de recusa;
    - setor, usuário e processo inativos marcados;
    - as seções no setor aberto e no painel do processo, com o formulário preenchido;
    - histórico da reunião, do processo e geral;
    - a recusa de excluir setor e processo com reunião;
    - o responsável excluído aparecendo como outro participante;
    - estados de carregando, vazio (sem reuniões e sem resultado nos filtros) e erro de cada tela, com "Tentar de novo";
    - reunião que não existe mais (excluída por outra pessoa).
  - **Arte anterior:** os testes de tela de processos-etapas (`App.lista`, `App.filtrosDosProcessos`, `App.painelDoProcesso`, `App.cadastrarProcesso`) e de cadastros-basicos (`App.historicoDosCadastros`, `App.excluirSetor`).
- **Tradução entre o banco e a tela.** Testes pequenos do módulo de reuniões real com o cliente Supabase simulado, provando que os códigos de recusa viram as mensagens e que as linhas do banco viram os tipos da tela. Arte anterior: `andamentosSupabase`, `catalogoSupabase`, `recusasDeProcessos`.
- **Funções puras** (próxima ou realizada, ordem da lista, filtros a partir do endereço, textos do histórico): testes unitários pequenos.
- **Banco.**
  - **Testes:** pgTAP, um teste por célula da tabela "quem pode o quê" (com um usuário inventado de cada perfil, um inativo e um visitante) e um por regra da tabela de regras.
  - **Testes gerais:** `00_rls_ligada` e `10_privilegios_padrao` cobrem as tabelas novas sem mudança.
  - **Testes antigos:** conferir os testes de exclusão de setor, de processo e de responsável do setor, que passam a ter um caso com reunião.
  - **Onde rodam:** os testes vêm antes da migração e rodam pelo GitHub Actions ("Testes de banco"). A migração vai pelo workflow "Migrar banco de desenvolvimento".
- Todas as reuniões, setores, processos, responsáveis, participantes e usuários dos testes são inventados.

## Fora do escopo

- Concluir ou iniciar etapa a partir da reunião: a reunião é só registro. Se fizer falta, vira demanda.
- Reunião com mais de um setor.
- Situação da reunião (agendada, realizada, cancelada): reunião que não aconteceu é excluída.
- Problemas e oportunidades identificados na reunião (Apontamento): v2, no backlog.
- Formulário estruturado que gera o rascunho do relatório: v2, no backlog.
- Anexos (ata, apresentação, e-mail de convite): a funcionalidade 5 trata de arquivos; anexar à reunião vira demanda, se preciso.
- Convite, agenda ou lembrete por e-mail ou calendário.
- Texto com formatação nas anotações.
- Prazos e indicadores ligados a reuniões: funcionalidades 8 e 9.
- Importação de reuniões antigas: funcionalidade 10, se a planilha atual tiver reuniões.
- Edição simultânea da mesma reunião por duas pessoas: vale a última gravação.
- Registro de quem consultou (backlog).

## Observações

- Critérios conferidos olhando a tela, para o `/ship`:
  - `[visual]` A área Reuniões é uma tabela compacta, no padrão da Lista de processos, com as próximas separadas das realizadas.
  - `[visual]` A marca "sem anotações" é discreta, com texto (nunca só cor).
  - `[visual]` O painel da reunião abre à direita com a lista esmaecida atrás; abaixo de 900px de largura, ocupa a tela inteira.
  - `[visual]` As pílulas de inativo (usuário, setor, processo) seguem o padrão das pílulas existentes, com cor e texto.
  - `[visual]` As seções Reuniões do setor aberto e do painel do processo seguem o estilo das seções vizinhas (responsáveis do setor, subprocessos).
  - `[visual]` Para a Consulta, área, painel e seções não mostram campos editáveis nem botões de alteração.
  - `[visual]` Mensagens de falha e de recusa em vermelho.
- **Divergências com `.scratch/especificacao.md`**, decididas na sabatina de 2026-10-14:
  - a especificação tinha um processo opcional por reunião; a modelagem passou a ter um ou mais processos, e a sensibilização nenhum;
  - "participantes" virou três listas (usuários, responsáveis do setor e outros), em vez de um campo só.
- **Decisões tomadas ao escrever a spec, a confirmar na leitura:**
  - **Reunião de hoje conta como realizada** (e ganha a marca "sem anotações" se não tiver anotações).
  - **Setor da reunião pode ser trocado na edição**, desde que os processos e responsáveis marcados sejam do novo setor (o formulário desmarca os que não são).
  - **Usuários na escolha:** todos os usuários ativos, de qualquer perfil, e não só Administrador e Integrante, porque alguém da Consulta pode ter estado presente.
  - **Outros participantes** ficam guardados como lista de nomes (um por linha no formulário), para o responsável excluído entrar nela sem mexer no texto escrito.
- **Rede do escritório:** a migração vai pelo workflow "Migrar banco de desenvolvimento" e precisa ser registrada em `supabase/AMBIENTES.md` para o `migration repair` antes da primeira publicação em produção.
- **Privilégios padrão:** toda tabela nova em `public` reprova o teste `10_privilegios_padrao` até receber o seu `revoke`.
Entregue em 2026-10-15 (commit ccd2f8b), com ressalva: critérios [visual] presumidos (a tela não foi conferida)
