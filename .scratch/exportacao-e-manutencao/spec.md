# Planilhas dos dashboards e documentação de manutenção

Status: ready-for-agent

**Mudança de 2026-10-23 (Andamento livre).** As fases do Regimento passam a contar pela posição do processo no catálogo, e não mais pelo status de cada etapa. Os suspensos saem das planilhas, como os cancelados. A fase VII só conclui com a data da publicação registrada. O detalhe está na seção "Andamento livre", logo abaixo, que vale sobre o resto desta spec no que divergir.

**Como resolve o problema.** Hoje a planilha que alimenta o dashboard em Power BI é preenchida à mão, e o dashboard depende de uma licença de outra instituição. Com esta funcionalidade, a plataforma escreve sozinha duas planilhas do Google todo dia às 6h: a **Planilha interna**, com o andamento de cada processo e de cada **Fase do Regimento**, e a **Planilha pública**, só com contagens. Os dois dashboards passam ao Data Studio da conta do CED. O Administrador acompanha as tentativas e pede uma atualização na hora pela aba **Planilhas** da Administração, e escolhe a fase de cada etapa no catálogo. Quem assumir o sistema depois encontra em `docs/manutencao/` o necessário para instalar, publicar, fazer backup, restaurar e manter as planilhas e os dashboards.

Decisões de origem: sabatina de 2026-10-20 (`.scratch/exportacao-e-manutencao/sabatina.md`); `CONTEXT.md` (Fase do Regimento e a seção "Dashboards"); ADRs 0004 (catálogo configurável), 0008 (Drive pela conta de serviço), 0017 (planilhas alimentadas pela plataforma e dashboards no Data Studio) e 0018 (o banco agenda e entrega os dados, sem chave secreta).

## Andamento livre (mudança de 2026-10-23)

Parte 1 da iniciativa quadro-livre. Decisões de origem: `.scratch/quadro-livre/sabatina-parte-1.md` (itens 4, 7 e 9) e os ADRs 0022 e 0024. Termo no `CONTEXT.md`: Fase do Regimento. O modelo comum (etapa atual, etiqueta, passagens, Não iniciados e Concluídos) está na seção "Andamento livre" da spec de `processos-etapas`.

### O que deixa de valer no resto desta spec

- **Histórias substituídas:**
  - 11: os suspensos saem;
  - 12: os rótulos mudam;
  - 13: a data da modelagem piloto, sem reunião, vem da fase IV;
  - 14: a data da publicação vem do processo;
  - 18: a regra das fases;
  - 20: a exceção da Publicação;
  - 21: a data de conclusão.
- **Pacote:** os andamentos e a escolha de publicação saem dele.
- **Situações da fase que saem:** "Pronto para iniciar", "Aguardando etapa anterior" e "Não publicado".

Continuam valendo a aba Planilhas, o botão, as tentativas, o cofre, a Edge Function, a planilha pública (com as contagens) e a documentação de manutenção.

### Solução

- **Quem entra nas planilhas:** os processos em andamento e os concluídos, arquivados ou não. Saem os suspensos e os cancelados, arquivados ou não.
- **Situação de cada fase IV a VII**, pela posição da etapa atual no catálogo ativo:
  - **"Sem etapa"**: a fase não tem etapa ativa (como hoje);
  - **"Concluída"**: o processo está numa etapa depois da última etapa da fase; ou está na última etapa da fase com a etiqueta Concluído; ou está em Concluídos. A fase VII só conclui com a data da publicação registrada;
  - **"Sem publicação"**: só na fase VII, quando a regra acima a concluiria mas não há data da publicação, inclusive em Concluídos sem publicação. Não conta como concluída;
  - **"Em andamento"**: o processo está numa etapa da fase (e a fase não está concluída);
  - **"Não iniciada"**: no resto, inclusive em Não iniciados.
- **Fases I a III:** sempre concluídas, como hoje.
- **Data de conclusão da fase:** a mais recente em que a fase passou a contar como concluída, calculada das passagens do processo (entradas, saídas e o momento em que a etiqueta virou Concluído). Na fase VII, é a data da publicação.
- **Rótulo da situação do processo:**
  - "Publicado": em Concluídos, com a data da publicação;
  - "Concluído": em Concluídos, sem publicação;
  - "Não iniciado": em Não iniciados;
  - "Em andamento · {fase}": a fase da etapa atual.

  Saem "Próxima" e "Suspenso".
- **Data da modelagem piloto:** a data da reunião; sem ela, a data de conclusão da fase IV.
- **Data da publicação:** `publicado_em` do processo.
- **Catálogo:** a fase continua obrigatória nas etapas de trabalho. Não iniciados e Concluídos não têm fase, e o catálogo mostra "—" nelas.

### Histórias de usuário

56. Como leitor dos dashboards, quero que os suspensos fiquem fora das planilhas, como os cancelados, arquivados ou não, para que as contagens mostrem só o trabalho que anda ou terminou.
57. Como leitor dos dashboards, quero cada fase contada pela posição do processo no catálogo, porque o processo pode pular ou voltar etapas.
58. Como leitor dos dashboards, quero que a última etapa da fase com a etiqueta Concluído já conte a fase como concluída, porque é o sinal de que aquela parte terminou.
59. Como leitor dos dashboards, quero que a fase VII só conte como concluída com a data da publicação, e apareça "Sem publicação" quando o processo foi concluído sem ela, para não inflar os publicados.
60. Como leitor dos dashboards, quero "Não iniciada" no lugar de "Pronto para iniciar" e de "Aguardando etapa anterior".
61. Como leitor dos dashboards, quero a data de conclusão de cada fase como a mais recente em que ela passou a contar como concluída, para contar as conclusões por mês.
62. Como leitor dos dashboards, quero os rótulos "Publicado", "Concluído", "Não iniciado" e "Em andamento · {fase}".
63. Como Administrador, quero que Não iniciados e Concluídos fiquem sem fase no catálogo, porque não pertencem a nenhuma fase do Regimento.

### Decisões de implementação

- **Pacote** (`private.montar_pacote_das_planilhas`):
  - **etapas:** passam a ter `fase` vazia nas duas fixas, e o código identifica `nao_iniciados` e `concluidos`;
  - **processos:**
    - trocam `concluido` e `vai_para_publicacao` por `etapa_atual_id`, `etiqueta` e `publicado_em`;
    - só entram os de situação guardada em andamento (concluído é em andamento em Concluídos);
    - nenhum nome de pessoa, como hoje;
  - **passagens:** `andamentos` dá lugar a elas, com `processo_id`, `etapa_id`, `entrou_em`, `saiu_em` e `concluido_em`, sem `movido_por`.
- **Validação do pacote** (pura): aceita a fase vazia só nas etapas de código `nao_iniciados` e `concluidos`, e exige uma passagem aberta por processo. A recusa diz o campo, o valor recebido e o esperado, como hoje.
- **Funções puras:**
  - a situação das fases, a data de conclusão, o rótulo e as duas datas mudam para as regras acima;
  - as contagens públicas continuam: concluídos da fase e total;
  - a função `planilhas-dos-dashboards` precisa ser publicada de novo no desenvolvimento, e esse passo é seu.
- **Banco:** o pacote é recriado na migração do Andamento livre. Nada muda no cofre, nas tentativas nem no agendamento.

### Decisões de teste

- **Edge Function (a decisão pura):** Vitest com pacotes inventados, provando:
  - cada situação da fase: depois da fase, última etapa com Concluído, a mesma com A fazer, em Concluídos, a VII com e sem data, Não iniciados e uma fase sem etapa;
  - a data de conclusão a partir das passagens, inclusive o processo que volta e conclui de novo (vale a mais recente);
  - cada rótulo;
  - os suspensos e os cancelados fora;
  - a validação da fase vazia e da passagem aberta.

  Arte anterior: `planilhasFases`, `planilhasProcesso`, `planilhasPacote`, `planilhasPublica` e o cenário `planilhasCenario`, que são ajustados.
- **Banco:** o teste `44_pacote_das_planilhas` é reescrito: passagens no lugar de andamentos, suspensos fora, nenhum nome de pessoa.
- **Interface:** o catálogo mostra "—" na fase das duas fixas (`App.catalogoDeEtapas`).

### Decisões tomadas ao escrever esta seção, a confirmar na leitura

1. A fase VII aparece "Sem publicação" sempre que a posição a concluiria sem a data, e não só em Concluídos.
2. A data de conclusão da fase VII é a data da publicação, não o dia em que ela foi registrada.
3. A data da modelagem piloto, sem reunião, passa a ser a da conclusão da fase IV. A parte 2 troca a reunião pela Data da modelagem piloto.

### Critérios conferidos olhando a tela

- `[visual]` No catálogo, a fase "—" das duas etapas fixas fica alinhada com as outras linhas.

## Problema

A equipe atualiza à mão a planilha do dashboard, marcando processo por processo em que fase está. O trabalho se repete, atrasa e erra, e o dashboard público da Casa Civil depende do Power BI com licença do Tecpar. Os dados já estão na plataforma, mas organizados por etapas do catálogo, e o dashboard conta pelas fases I a IX do art. 8º do Regimento. Falta também uma documentação que permita a outra equipe, ou à TI do CED, assumir o sistema.

## Solução

- **Fase no catálogo.** Cada etapa do catálogo ganha a **Fase do Regimento**, obrigatória, com as opções IV a IX, escolhida pelo Administrador ao criar e ao editar a etapa. A tabela do catálogo mostra a fase de cada etapa. As seis etapas atuais recebem: Modelagem piloto → IV; Relatório e modelagem técnica → V; Revisão interna, Revisão pelo setor e Aprovação pelo setor → VI; Publicação → VII. Mudar a fase entra no histórico do catálogo, como as outras mudanças.
- **Planilha interna** (equipe), duas abas, sem nenhum nome de pessoa:
  - **Processos:** uma linha por processo, com área (sigla do setor), macroprocesso, processo, tipo, situação (rótulo), data da modelagem piloto, data da publicação, última versão e observações.
  - **Fases:** uma linha por processo e fase I a VII, com a situação da fase e a data em que ela foi concluída.
- **Planilha pública:** só contagens, sem nome de processo nem de pessoa: total de processos, total de setores, e, para cada fase I a VII, os concluídos e o total, com a data e a hora da atualização.
- **Atualizar as planilhas:** as duas são reescritas inteiras, todo dia às 6h de Brasília e pelo botão [Atualizar planilhas agora]. Se a escrita de uma planilha falha, ela fica como estava, e a próxima atualização acerta.
- **Aba Planilhas na Administração**, só para o Administrador: as últimas 10 tentativas (quando, automática ou pelo botão e de quem, resultado e, na falha, o motivo), o link das duas planilhas e o botão. Durante uma atualização, o botão fica desligado e a tentativa aparece "Em andamento". Um segundo pedido nesse meio-tempo é recusado com "Já há uma atualização em andamento."
- **Dashboards** no Data Studio da conta do CED, montados por Claude no navegador, com a sua revisão visual: o interno, compartilhado só com a equipe, e o público, por link "Não listado", com a planilha pública como fonte. Ficam parecidos com os quatro do Power BI de hoje, dentro do que o Data Studio permite.
- **Documentação de manutenção** em `docs/manutencao/`, em português, para quem assumir o sistema.

## Histórias de usuário

### Fase do Regimento no catálogo

1. Como Administrador, quero escolher a fase do Regimento (IV a IX) ao criar uma etapa, para que ela conte no dashboard desde o primeiro dia.
2. Como Administrador, quero ser impedido de salvar uma etapa sem fase, com a frase "Escolha a fase do Regimento.", para que nenhuma etapa fique fora das planilhas sem aviso.
3. Como Administrador, quero trocar a fase de uma etapa existente pelo [Editar] do catálogo, para corrigir uma escolha errada.
4. Como Administrador, quero ver a fase de cada etapa na tabela do catálogo, para conferir a ligação entre etapas e fases.
5. Como Administrador, quero que as seis etapas atuais já venham com a fase certa, sem precisar escolher uma por uma.
6. Como Administrador, quero que a mudança de fase apareça no histórico do catálogo, com o antes e o depois, para saber quem mudou e quando.
7. Como Integrante ou Consulta, quero ser impedido de mudar a fase, mesmo fora da tela, porque o catálogo é do Administrador.
8. Como Administrador, quero que a fase de uma etapa protegida (Revisão interna, Revisão pelo setor, Aprovação pelo setor) também se possa mudar, porque a proteção é contra desativar e excluir, não contra editar.

### Planilha interna

9. Como integrante da equipe, quero uma linha por processo na aba Processos, com área, macroprocesso, processo e tipo, para montar o dashboard interno sem digitar nada.
10. Como integrante da equipe, quero que subprocessos e itens "a classificar" entrem cada um como uma linha, com o tipo numa coluna, para filtrar por tipo no dashboard.
11. Como integrante da equipe, quero que os processos cancelados fiquem fora e os suspensos entrem, para que as contagens reflitam o trabalho real.
12. Como integrante da equipe, quero a situação do processo como rótulo pronto ("Publicado", "Concluído", "Em andamento · V", "Próxima · VI", "Suspenso · IV"), porque o Data Studio calcula pouco.
13. Como integrante da equipe, quero a data da modelagem piloto (a data da reunião; sem ela, a data de conclusão da etapa Modelagem piloto), para o gráfico de modelagens por mês com a meta.
14. Como integrante da equipe, quero a data da publicação (a conclusão da etapa Publicação), para contar os publicados no tempo.
15. Como integrante da equipe, quero a última versão do processo ("V7"), no lugar das colunas V1 a V8 da planilha manual.
16. Como integrante da equipe, quero as observações do processo na planilha interna, e só nela, para a tabela de acompanhamento.
17. Como integrante da equipe, quero uma linha por processo e fase I a VII na aba Fases, com a situação da fase, para os gráficos por fase e a tabela processo × fase.
18. Como integrante da equipe, quero a situação de cada fase calculada da mesma forma sempre: concluída quando todas as etapas da fase estão resolvidas; em andamento quando alguma começou ou foi resolvida, sem todas; pronto para iniciar quando a fase anterior está concluída e nenhuma etapa desta começou; aguardando etapa anterior no resto.
19. Como integrante da equipe, quero que as fases I a III saiam sempre concluídas, porque foram feitas fora da plataforma para todos os setores.
20. Como integrante da equipe, quero que uma Publicação dispensada apareça na fase VII como "Dispensada", e não como publicada, para não inflar os publicados.
21. Como integrante da equipe, quero a data de conclusão de cada fase concluída, para contar conclusões por mês.
22. Como integrante da equipe, quero uma coluna de identificação do processo nas duas abas, para ligar Processos e Fases no Data Studio mesmo quando dois processos têm o mesmo nome.
23. Como servidor responsável pelos dados pessoais, quero que nenhum nome de pessoa (nem o responsável) vá à planilha interna, para que ela possa circular na equipe sem expor ninguém.

### Planilha pública

24. Como cidadão que abre o dashboard público, quero o total de processos e o total de setores, para ver o tamanho do trabalho.
25. Como cidadão, quero, para cada fase I a VII, os concluídos e o total, para ver o avanço; a porcentagem é calculada no dashboard.
26. Como cidadão, quero a data e a hora da última atualização, para saber se os números estão em dia.
27. Como servidor responsável pelos dados, quero que a planilha pública não tenha nome de processo nem de pessoa, para que trocar a fonte do relatório público nunca exponha dado interno.

### Atualizar as planilhas

28. Como Administrador, quero que as duas planilhas sejam reescritas todo dia às 6h de Brasília, sem ninguém precisar lembrar.
29. Como Administrador, quero o botão [Atualizar planilhas agora], para atualizar depois de uma mudança grande sem esperar o dia seguinte.
30. Como Administrador, quero que uma escrita que falha deixe a planilha como estava, para que o dashboard nunca mostre uma planilha pela metade.
31. Como Administrador, quero que o botão fique desligado enquanto uma atualização está em andamento, e que um segundo pedido seja recusado com "Já há uma atualização em andamento.", para não haver duas escritas ao mesmo tempo.
32. Como Administrador, quero que uma tentativa que nunca respondeu passe a "Sem resposta" depois de 10 minutos, para que o botão não fique travado para sempre.
33. Como Integrante, Consulta, usuário desativado ou visitante sem login, quero ser impedido de pedir uma atualização, mesmo fora da tela.
34. Como Administrador, quero que a atualização não dependa da chave secreta do Supabase, para que nenhuma peça da plataforma leia o banco inteiro ignorando os perfis (ADR 0018).

### Aba Planilhas da Administração

35. Como Administrador, quero uma aba "Planilhas" na Administração, ao lado de Usuários e Catálogo de etapas.
36. Como Administrador, quero ver as últimas 10 tentativas, da mais recente para a mais antiga, com quando, se foi automática ou pelo botão (e de quem), e o resultado, para saber se as planilhas estão em dia.
37. Como Administrador, quero ver o motivo de uma falha numa frase simples ("O Google recusou a escrita na planilha pública."), sem detalhe técnico nem dado pessoal.
38. Como Administrador, quero o link das duas planilhas na aba, para abri-las numa aba nova do navegador.
39. Como Administrador, quero ver "Nenhuma atualização ainda." antes da primeira tentativa.
40. Como Administrador, quero ver a tentativa que pedi aparecer na hora como "Em andamento" e mudar sozinha para o resultado, sem recarregar a página.
41. Como Administrador, quero que, quando as planilhas ainda não foram configuradas no ambiente, a aba diga isso no lugar dos links, e que o botão explique por que não atualiza.
42. Como Administrador, quero que a lista guarde só as últimas 10 tentativas, para não acumular registros sem uso.
43. Como Administrador, quero estados de carregando, de erro com "Tentar de novo" e de recusa ao pedir, como no resto da Administração.

### Dashboards

44. Como integrante da equipe, quero o dashboard interno no Data Studio com as páginas de hoje (visão geral, por fase e tabela processo × fase), compartilhado só com as pessoas da equipe.
45. Como gestor, quero a meta mensal de modelagens (12) no gráfico de modelagens por mês, mudada no próprio Data Studio quando a meta mudar.
46. Como cidadão, quero o dashboard público com os números da página pública de hoje, aberto por um link "Não listado".
47. Como Administrador, quero revisar a aparência dos dashboards antes de trocarem os do Power BI.

### Transição e documentação

48. Como Administrador, quero que o Power BI e a planilha manual continuem até o cadastro dos processos atuais terminar, e um roteiro para a troca do link no site, o fim do Power BI e a exclusão da planilha antiga.
49. Como quem assumir o sistema, quero um guia de instalação do ambiente de desenvolvimento.
50. Como quem assumir o sistema, quero o roteiro de publicação (banco, funções e site).
51. Como quem assumir o sistema, quero o roteiro de backup e restauração.
52. Como quem assumir o sistema, quero o modelo de dados explicado em linguagem de manutenção.
53. Como quem assumir o sistema, quero um índice dos ADRs, para entender por que as coisas são como são.
54. Como quem assumir o sistema, quero o roteiro das planilhas e dos dashboards: configurar o cofre do banco, a conta de serviço, a fase de uma etapa nova, refazer um dashboard do zero.
55. Como quem assumir o sistema, quero que a documentação diga com clareza o que ainda depende da produção, que não existe, para conferir no `/ship` de produção.

## Decisões de implementação

### Interface

- **Administração:** a aba "Planilhas" entra depois de "Catálogo de etapas", na mesma barra de abas. A área se chama `AreaDasPlanilhas` e recebe um módulo novo, o módulo das planilhas, injetado como os de acesso e de processos.
- **Módulo das planilhas** (interface do lado da tela): ler as tentativas e os links; pedir a atualização. Duas implementações nomeadas, a do Supabase e a falsa (com tentativas em memória, as recusas do banco e falhas programáveis), como as dos outros módulos.
- **Enquanto há uma tentativa "Em andamento"**, a aba relê as tentativas a cada poucos segundos e para quando ela termina ou passa a "Sem resposta". Sem tentativa em andamento, não relê.
- **Rótulos das tentativas:** "Automática" ou "Pelo botão · <nome do Administrador>"; resultado "Em andamento", "Concluída", "Falhou" (com o motivo) ou "Sem resposta". Data e hora no fuso de Brasília.
- **Motivos de falha:** um código curto vindo da função (por exemplo, `planilha_interna_recusada`, `planilha_publica_recusada`, `google_indisponivel`, `pacote_invalido`), traduzido numa frase por uma tabela pura da tela. Código desconhecido (inclusive `erro_interno`) vira "A atualização falhou por um motivo não identificado."
- **Catálogo:** o formulário da etapa (criar e editar) ganha o campo "Fase do Regimento", uma lista com IV a IX, sem valor escolhido na criação. A tabela do catálogo ganha a coluna "Fase". A mensagem de recusa segue o padrão do formulário, com o valor recebido. O histórico do catálogo mostra a fase nas linhas "Antes" e "Depois" (formato que já existia), não como "Fase: V → VI".
- **Histórico do catálogo:** o texto do evento de edição passa a citar a fase quando ela muda ("Fase: V → VI").

### Modelo de dados

- **Tipo `fase_do_regimento`**, com os valores IV, V, VI, VII, VIII e IX. As fases I a III não existem no banco: são constantes da montagem.
- **`etapas.fase`**, obrigatória. A migração acrescenta a coluna, preenche as seis etapas atuais pelo código (`modelagem` → IV, relatório e modelagem técnica → V, `revisao_interna`, revisão pelo setor e `aprovacao_setor` → VI, publicação → VII) e só então a torna obrigatória. Os códigos exatos se conferem no banco durante o ticket. `acrescentar_etapa` ganha o parâmetro da fase. A edição pela tabela continua com a RLS de hoje, só para o Administrador. O gatilho do histórico do catálogo passa a levar a fase no antes e no depois.
- **Tabela `atualizacoes_das_planilhas`** (RLS ligada; leitura só do Administrador ativo; ninguém grava direto): quando começou, origem (automática ou botão), quem pediu (nulo na automática), quando terminou, se deu certo, o código do motivo e a ficha de uso único guardada como hash. Um gatilho mantém só as 10 mais recentes. "Em andamento" e "Sem resposta" não se guardam: uma view com `security_invoker` calcula o resultado (sem fim e com menos de 10 minutos é em andamento; sem fim e mais antiga é sem resposta).
- **Cofre do banco (Vault):** o endereço da função, a senha interna e os identificadores das duas planilhas, gravados pelo usuário no SQL Editor por um roteiro. É o único ponto de configuração por ambiente.
- **Funções do banco:**
  - `pedir_atualizacao_das_planilhas()`, chamável pela tela: confere Administrador ativo; recusa com `atualizacao_em_andamento` se há uma em andamento, e com `planilhas_nao_configuradas` se falta algo no cofre; registra a tentativa, gera a ficha e envia o pacote à função pelo pg_net. O trabalho com o cofre e o pg_net fica numa função `security definer` em `private`, com `search_path` vazio.
  - A mesma função privada, com origem automática, é chamada pelo pg_cron todo dia às 9h UTC (6h de Brasília, sem horário de verão). Com uma tentativa em andamento, a automática não começa.
  - `links_das_planilhas()`, só para o Administrador: os dois endereços montados a partir dos identificadores do cofre, ou nulo quando não configurados.
  - `registrar_resultado_das_planilhas(tentativa, ficha, deu_certo, motivo)`, chamável sem login: aceita só a ficha certa da tentativa, uma única vez, e só para uma tentativa ainda sem fim; qualquer outra chamada é recusada sem dizer por quê.
  - O **pacote de dados** montado pela função privada: a data e a hora da geração; as etapas ativas do catálogo (identificador, código, ordem, fase); os processos (identificador, nome, tipo, sigla do setor, nome do macroprocesso, situação guardada, se está concluído, observações, data da reunião, número da última versão não histórica); e os andamentos (processo, etapa, status, início e resolução). Nenhum nome de pessoa nem e-mail entra no pacote.
- **Extensões:** pg_cron, pg_net e o Vault ligados por migração, se ainda não estiverem.

#### Quem pode o quê

| Ação | Administrador | Integrante do EP | Consulta | Desativado | Sem login |
|-|-|-|-|-|-|
| Ver a fase das etapas | sim | sim | sim | não | não |
| Escolher ou mudar a fase | sim | não | não | não | não |
| Ver as tentativas e os links | sim | não | não | não | não |
| Pedir a atualização | sim | não | não | não | não |
| Gravar tentativa direto na tabela | não | não | não | não | não |
| Chamar a montagem do pacote | não | não | não | não | não |
| Registrar o resultado | só com a ficha certa da tentativa, uma vez (a função chama sem login) |||||

#### Regras de estado

- Uma tentativa nasce "Em andamento", com a ficha; termina uma única vez, em "Concluída" ou "Falhou"; sem fim depois de 10 minutos, aparece "Sem resposta" (calculado, não guardado).
- Com uma tentativa "Em andamento", nenhum pedido novo começa (nem o do botão, nem o das 6h).
- Uma tentativa terminada não muda mais.

### Edge Function `planilhas-dos-dashboards`

- Ordem fixa: configuração → senha interna (cabeçalho) → validação do pacote → montagem → escrita → resultado ao banco. Nada toca o Google antes de a senha e o pacote valerem.
- **Não lê o banco.** Só devolve o resultado, pela função `registrar_resultado_das_planilhas`, com a chave publicável.
- **Decisão pura** (arquivos sem Deno, testados no Vitest), em três partes:
  - **Validação do pacote:** formato, tipos e valores aceitos; a recusa diz o campo, o valor recebido e o esperado.
  - **Montagem:** do pacote às linhas das duas abas da planilha interna e às da planilha pública, com as regras da sabatina: cancelados fora; fases I a III concluídas; situação de cada fase IV a VII; exceção da Publicação dispensada; rótulo da situação do processo; data da modelagem piloto; data da publicação; última versão; contagens públicas (total de setores = setores distintos dos processos que entram). Uma fase IV a VII sem nenhuma etapa ativa no catálogo sai "Sem etapa" e não conta como concluída.
  - **Motivo da falha:** do erro do Google ao código curto, sem corpo da resposta nem dado do processo.
- **Escrita:** uma única chamada de atualização em lote do Sheets por planilha, que garante as abas (cria a que faltar), troca o conteúdo inteiro e apaga as linhas que sobrarem. O Google aplica o lote inteiro ou nada, então a planilha que falha fica como estava. As duas planilhas são escritas uma depois da outra: se a interna deu certo e a pública falhou, a tentativa fica "Falhou" com o motivo da pública, e a interna já está nova. A próxima atualização acerta as duas.
- **Credenciais:** a mesma conta de serviço do Drive (segredo que já existe), com o escopo do Sheets, e a senha interna como segredo novo da função. O Sheets precisa estar ligado no projeto do Google Cloud, passo do usuário descrito no roteiro.
- **Logs e respostas** sem nome de processo, observação, identificador de planilha nem token.

### Dashboards e documentação

- **Ticket de dashboards:** Claude monta os dois relatórios no Data Studio pelo navegador do app, com o login do usuário na conta do CED, e o usuário revisa. O compartilhamento do interno com as pessoas da equipe e a mudança do público para "Não listado" são confirmados com o usuário no momento. Fica registrado em `docs/manutencao/` como refazer cada página do zero.
- **Ticket de documentação:** `docs/manutencao/` com instalação, publicação (banco, funções, site), backup e restauração, modelo de dados, índice dos ADRs, e planilhas e dashboards (cofre do banco, conta de serviço, fase de etapa nova, roteiro do Data Studio, troca do link no site e transição). O que depende da produção vai com o que se sabe hoje, marcado para conferir no `/ship` de produção.

#### Migração

Nenhuma migração destrutiva: tipo, coluna, tabela, view, funções, gatilho e o agendamento novos; `acrescentar_etapa` recriada com o parâmetro da fase; o gatilho do histórico do catálogo recriado com a fase. As seis etapas atuais recebem a fase na própria migração.

## Decisões de teste

- **Bom teste** confere o que a pessoa vê e consegue fazer, ou o que o banco aceita e recusa, nunca detalhes internos.
- **Interface (ponto de teste: a tela inteira).**
  - **Como:** Vitest com Testing Library, renderizando o aplicativo inteiro com a implementação falsa nomeada do módulo das planilhas, ao lado das falsas do acesso, dos cadastros e dos processos (o catálogo falso passa a guardar a fase e a imitar a recusa sem fase).
  - **O que cobre:**
    - aba Planilhas: só para o Administrador; lista das tentativas com origem, quem, resultado e motivo; "Nenhuma atualização ainda."; os dois links em aba nova; ambiente sem configuração;
    - [Atualizar planilhas agora]: a tentativa aparece "Em andamento", o botão desliga e a tentativa muda sozinha para o resultado; a recusa "Já há uma atualização em andamento."; "Sem resposta" libera o botão;
    - só as 10 mais recentes na lista;
    - catálogo: escolher a fase ao criar, recusa sem fase, trocar a fase ao editar, a coluna Fase na tabela, a fase no histórico do catálogo;
    - estados de carregando, erro com "Tentar de novo" e falha ao pedir sem quebrar a aba.
  - **Arte anterior:** `App.administracao`, `App.catalogoDeEtapas`, `App.focoNaAdministracao`, `App.gestaoDeUsuarios`, `App.historico`.
- **Tradução entre o banco e a tela.** Testes pequenos do módulo das planilhas real com o cliente simulado (classe ou função nomeada), provando as chamadas e que cada código de recusa vira a frase; o mesmo para a fase no módulo do catálogo. Arte anterior: `catalogoSupabase`, `andamentosSupabase`.
- **Edge Function (ponto de teste: a decisão pura).** Vitest sobre a validação do pacote, a montagem das linhas e o motivo da falha, com pacotes inventados: cada regra da situação da fase, a exceção da Publicação dispensada, cada rótulo da situação do processo, cancelados fora e suspensos dentro, subprocesso e "a classificar" contando um cada, as duas datas, a última versão, a fase "Sem etapa", as contagens públicas e a ausência de nome de pessoa nas linhas. Arte anterior: os testes de `supabase/functions/_shared/` (`decisao`, `registro`, `nomePadrao`). A chamada de ponta a ponta (escrita real no Sheets) se confere no desenvolvimento, com a função publicada pelo usuário.
- **Banco (pgTAP).**
  - **Fase obrigatória:** etapa sem fase recusada; valores fora de IV a IX recusados; as seis etapas atuais com a fase da sabatina; `acrescentar_etapa` com a fase; mudança de fase no histórico do catálogo; Integrante e Consulta sem poder mudar a fase.
  - **Pedir a atualização:** só o Administrador ativo (Integrante, Consulta, desativado e visitante recusados); recusa com uma em andamento; recusa sem configuração.
  - **Registro das tentativas:** só as 10 mais recentes ficam; leitura só do Administrador ativo; ninguém grava direto; o resultado calculado (em andamento, sem resposta, concluída, falhou).
  - **Resultado:** ficha certa aceita uma única vez; ficha errada, tentativa já terminada ou repetição recusadas.
  - **Pacote:** a função que o monta não é chamável pela tela; o pacote não traz nome nem e-mail de usuário.
  - **Testes gerais:** `00_rls_ligada` e `10_privilegios_padrao` cobrem a tabela nova sem mudança.
  - **Testes antigos afetados:** os do catálogo de etapas e os que criam etapas passam a informar a fase.
  - **Onde rodam:** os testes vêm antes da migração e rodam pelo GitHub Actions ("Testes de banco"). A migração vai pelo workflow "Migrar banco de desenvolvimento". O pg_net envia de verdade só no banco remoto; o teste confere o registro da tentativa e a ficha, não a chegada à função.
- Todos os processos, setores, usuários e textos dos testes são inventados.

## Critérios de aceite que se conferem olhando a tela

- [visual] A aba Planilhas segue o estilo das abas Usuários e Catálogo de etapas: lista legível, o resultado de cada tentativa distinguível pela cor das mensagens da plataforma e pelo texto, e o botão no lugar dos botões principais da Administração.
- [visual] O campo "Fase do Regimento" e a coluna Fase cabem no formulário e na tabela do catálogo sem quebrar o alinhamento, no notebook (1366×768).
- [visual] Os dois dashboards no Data Studio ficam parecidos com as páginas de hoje do Power BI, revisados pelo usuário. (Ficou para o usuário finalizar por fora do projeto, decisão de 2026-10-22; o compartilhamento dos dois dashboards foi feito.)

## Fora do escopo

- **Exportação em CSV:** saiu para o backlog (ADR 0017).
- **Painel próprio da plataforma** e Prazos: v1.5 (backlog).
- **Fases VIII e IX nas planilhas:** ficam fora enquanto não houver etapa nelas.
- **Coluna "Question."** da planilha manual: fica fora.
- **Aviso por e-mail** quando a atualização falha: não há; o Administrador vê na aba.
- **Atualizar a cada mudança:** a reescrita é diária e pelo botão (ADR 0017).
- **Troca do link no site, fim do Power BI e exclusão da planilha antiga:** passos do usuário, descritos na documentação.
- **Responsável ou qualquer nome de pessoa nas planilhas.**
- **Data das etapas no fuso de Brasília:** corrigido depois (migração `20261020180000_datas_das_etapas_no_fuso`): as datas de início e conclusão passaram a usar o dia de Brasília (`private.hoje()`).

## Observações

- **Mudança de 2026-10-22 (publicacao-e-arquivamento, ADR 0020):** a fase VII de um processo não publicado sai "Não publicado" (não conta como concluída), no lugar da exceção "Dispensada"; o rótulo da situação fica "Publicado" com a Publicação concluída e "Concluído" com a escolha "não"; o pacote das planilhas ganha a escolha. O detalhe está em `.scratch/publicacao-e-arquivamento/spec.md`.
- **Divergência da especificação:** a "exportação em CSV para usar Power BI" virou as planilhas alimentadas pela plataforma e os dashboards no Data Studio (ADR 0017).
- **Robô das 6h sem chave secreta:** decisão do usuário nesta spec (ADR 0018). O botão e a atualização automática seguem o mesmo caminho pelo banco.
- **Transição:** a planilha manual e o Power BI continuam em uso até o cadastro dos processos atuais terminar; os dashboards novos podem ser montados antes, com os dados do desenvolvimento ou da produção, conforme o que existir.
- **Produção:** ainda não existe. O cofre, o agendamento e a função entram em produção pelo roteiro de publicação do `/ship`, com a aprovação do usuário.
- **Passos do usuário** (fora da sessão): criar as duas planilhas em branco no Drive compartilhado, ligar o Sheets no projeto do Google Cloud, gravar o segredo novo da função, gravar o cofre do banco pelo SQL Editor, publicar a função no desenvolvimento e entrar no Data Studio no navegador do app.

Entregue em 2026-10-22 (commit 06c8052), com ressalva: critérios [visual] dos tickets 01 e 02 vistos só na vitrine local com módulos falsos e o dos dashboards (ticket 04) em aberto, a finalizar pelo usuário por fora; camada Deno da função planilhas-dos-dashboards sem teste automático; resultado atual do "Testes de banco" no GitHub não reconferido; revisão de segurança foi a de reserva (menos completa)

Entregue em 2026-10-23 (commit ae1fb54), com ressalva: critérios [visual] da mudança de publicacao-e-arquivamento presumidos (a tela não foi vista); revisão de segurança foi a de reserva (menos completa); as ressalvas das entregas anteriores seguem valendo
Em revisão desde 2026-10-23
