# Refazer os dashboards no Data Studio

Roteiro para montar, do zero, os dois dashboards que leem as planilhas da plataforma (`06-planilhas-e-dashboards.md`): o **dashboard interno** (3 páginas, só para a equipe) e o **dashboard público** (1 página, por link "Não listado"). Decisão de origem: ADR 0017 (os dashboards saem do Power BI, que usa licença do Tecpar, e passam ao Data Studio da conta institucional do CED).

Estado hoje: os dois dashboards existem **só no desenvolvimento, com dados de prova** (3 processos), montados na conta institucional do CED. **O visual ainda é o padrão do Data Studio**: a revisão visual (se parecem com o Power BI atual) foi adiada pelo usuário e está no backlog do projeto. Portanto este roteiro refaz a **estrutura e os números**, não o acabamento. **Conferir no `/ship` de produção:** refazer os dois dashboards com as planilhas de **produção**.

Termos usados aqui:

- **Data Studio (antes Looker Studio):** a ferramenta gratuita do Google para montar relatórios sobre planilhas. Fica em `datastudio.google.com`.
- **Fonte de dados:** a ligação do Data Studio com uma aba de uma planilha. Uma fonte por aba.
- **Campo calculado:** uma coluna nova, calculada por fórmula a partir das colunas da fonte.
- **Combinação (blend):** juntar duas fontes por uma coluna em comum, para um gráfico usar as duas.
- **Credenciais "do proprietário":** quem abre o relatório vê os dados mesmo sem acesso à planilha. É o que se quer no dashboard público; no interno, o controle é o compartilhamento do relatório.

## Antes de começar

1. Entre no Data Studio com a **conta institucional do CED** (a conta do Google do próprio órgão, não uma pessoal). Confira a conta no ícone do canto superior direito.
2. Na primeira vez, o Data Studio pede duas autorizações: acesso à API do Data Studio e acesso ao Google Planilhas. Autorize as duas, nessa conta. Revogar: `myaccount.google.com/permissions`.
3. Tenha à mão os endereços das duas planilhas de **produção** (interna e pública). O identificador não fica neste documento nem no git: ele está no cofre do banco e no navegador de quem administra as planilhas.
4. Antes de montar, confira em **Administração → Planilhas** que a última atualização está "Concluída" e que as abas têm linhas.

## 1. Criar as quatro fontes de dados

1. Abra `datastudio.google.com/datasources/create` e escolha o conector **Google Planilhas**. Escolha o conector pela lista; não cole identificador de conector no endereço.
2. Escolha a planilha **interna** e a aba **Processos**. Deixe marcadas "Usar a primeira linha como cabeçalhos" e "Incluir células ocultas e filtradas". Clique em **Conectar**.
3. Repita para a aba **Fases** da planilha **interna**.
4. Repita para a aba **Resumo** da planilha **pública**.
5. Repita para a aba **Fases** da planilha **pública**.
6. Nomeie as fontes de modo que dê para distinguir a interna da pública (por exemplo "EP-planilha interna - Processos").
7. **A planilha pública nunca se usa em fonte da interna, nem o contrário.** O dashboard público só pode ter as duas fontes públicas.

## 2. Campos calculados das fontes internas

As datas chegam como **texto** `AAAA-MM-DD`, e as células vazias como o texto `null`. Trocar o tipo do campo para Data direto falha ("não reconhece o formato"): use campo calculado.

1. Na fonte **interna / Processos**, clique em **Adicionar um campo**.
2. Nome: `Modelagem piloto em`. Fórmula: `CASE WHEN LENGTH(Data da modelagem piloto) = 10 THEN PARSE_DATE("%Y-%m-%d", Data da modelagem piloto) END`. Salve.
3. Repita com o nome `Publicado em` e a coluna `Data da publicação`.
4. Na fonte **interna / Fases**, crie `Concluída em` com a mesma fórmula sobre a coluna `Data de conclusão`.
5. Ao digitar o nome de uma coluna dentro da fórmula, digite o começo (por exemplo `Data da mod`), espere a sugestão aparecer e tecle **Enter**: o editor transforma o texto em campo. Texto que não virou campo dá "Código desconhecido da dimensão ou métrica".
6. O botão **Salvar** do editor pode precisar de dois cliques (o primeiro só tira o foco). A confirmação é a mensagem "Campo calculado salvo".

## 3. Dashboard interno

Crie um relatório em branco (`datastudio.google.com/reporting/create`), adicione as fontes **internas** (Processos e Fases), dê o nome "Dashboard interno do EP" e salve. A janela "Revise o acesso aos dados antes de salvar" deve listar **só** as fontes internas.

### 3.1 Campos calculados do relatório (fonte Fases)

No painel Dados do relatório, com a fonte **Fases** selecionada, **Adicionar um campo** para cada um destes:

1. `Concluídas` = `SUM(CASE WHEN Situação = "Concluída" THEN 1 ELSE 0 END)`
2. `Total de processos` = `COUNT_DISTINCT(Identificador)`
3. `Prontos para iniciar` = `SUM(CASE WHEN Situação = "Pronto para iniciar" THEN 1 ELSE 0 END)`
4. `Aguardando` = `SUM(CASE WHEN Situação = "Aguardando etapa anterior" THEN 1 ELSE 0 END)`
5. `Avanço I a VII` = `SUM(CASE WHEN Situação = "Concluída" THEN 1 ELSE 0 END) / COUNT(Situação)`
6. `Avanço IV a VII` = `SUM(CASE WHEN Fase IN ("IV","V","VI","VII") AND Situação = "Concluída" THEN 1 ELSE 0 END) / SUM(CASE WHEN Fase IN ("IV","V","VI","VII") THEN 1 ELSE 0 END)`
7. `Publicados` = `COUNT_DISTINCT(CASE WHEN Fase = "VII" AND Situação = "Concluída" THEN Identificador END)`
8. `Fase nº` = `CASE Fase WHEN "I" THEN 1 WHEN "II" THEN 2 WHEN "III" THEN 3 WHEN "IV" THEN 4 WHEN "V" THEN 5 WHEN "VI" THEN 6 WHEN "VII" THEN 7 WHEN "VIII" THEN 8 ELSE 9 END` (para ordenar as fases romanas, que em ordem alfabética ficam trocadas)

Nos cartões `Avanço I a VII` e `Avanço IV a VII`, mude o tipo do campo para **Porcentagem** (clique no campo, **Tipo de dado → Numérico → Porcentagem**).

### 3.2 Combinação "Processos e fases"

1. Menu **Recurso → Gerenciar combinações de dados → Adicionar uma combinação**.
2. Tabela 1 = a fonte **Fases**, com as dimensões Identificador, Área, Fase, Processo, Situação e `Concluída em`.
3. **Mesclar outra tabela** = a fonte **Processos**, com as dimensões Identificador, Macroprocesso, `Modelagem piloto em`, `Publicado em` e Situação.
4. **Configurar mesclagem**: operador **Externa à esquerda**; condição **Identificador** (tabela 1) = **Identificador** (tabela 2). Aplique.
5. Nome: "Processos e fases". Salve.

### 3.3 Página 1: visão geral

1. Quatro **cartões** (scorecards) com a fonte Fases: `Total de processos`, `Publicados`, `Avanço I a VII` e `Avanço IV a VII`.
2. **Gráfico de colunas** com a fonte Fases: dimensão **Fase**, métricas `Concluídas` e `Total de processos`; em **Classificar**, escolha `Fase nº` **crescente**.
3. **Tabela dinâmica com mapa de calor** (setor × fase) com a fonte Fases: linhas **Área**, coluna **Fase**, métrica `Concluídas`.
4. **Gráfico de colunas** das modelagens piloto por mês com a fonte **Processos**: dimensão `Modelagem piloto em`, com **Tipo de dado → Data e hora → Ano e mês**; métrica **Record Count**. Em **Estilo → Linhas de referência → Adicionar uma linha de referência**: rótulo "Meta mensal (12)", tipo **Valor constante**, valor **12**. **A meta muda aqui mesmo, no Data Studio, quando a meta mudar.**

### 3.4 Página 2: por fase

1. **Adicionar página**.
2. **Lista suspensa** (menu **Adicionar um controle**) com o campo **Fase**, no topo.
3. Três cartões com a fonte Fases: `Concluídas`, `Prontos para iniciar` e `Aguardando`.
4. **Gráfico de colunas** "processos por setor": dimensão **Área**, métrica `Total de processos`.
5. A lista suspensa filtra os cartões e o gráfico da página.

### 3.5 Página 3: processo × fase

1. **Adicionar página**.
2. **Tabela** com a fonte "Processos e fases": dimensões `Concluída em`, Situação (da fase), Fase, Situação (do processo, que traz o rótulo "Em andamento · V" ou "Próxima · IV"), Área e Processo. Remova a métrica que o Data Studio põe sozinho, se ficar inválida.
3. **Observações:** o Power BI de hoje mostra observações na tabela. A aba `Processos` traz a coluna, mas o Data Studio a descarta enquanto toda a coluna vier vazia (foi o que aconteceu com os dados de prova). Com processos que tenham observação, confira se ela aparece como campo da fonte e acrescente-a à tabela; se não aparecer, registre como problema da plataforma.

### 3.6 Conferir os números

Com dados conhecidos, confira: total de processos, publicados, o avanço (concluídas ÷ linhas de fase), os cartões da página 2 e as barras por fase, contra a aba **Fases** da planilha interna. Nos dados de prova do desenvolvimento (3 processos, 21 linhas de fase): total 3, publicados 0, avanço I a VII 47,62% (10 de 21), IV a VII 8,33% (1 de 12), concluídas 10, prontos para iniciar 2, aguardando 8.

## 4. Dashboard público

1. Crie outro relatório em branco, **só** com as fontes **públicas** (Resumo e Fases). A janela "Revise o acesso aos dados" deve listar só elas. Nome: "Dashboard público do EP".
2. Na fonte **pública / Fases**, crie o campo `% concluído` = `SUM(Concluídos) / SUM(Total)`. Tipo **Porcentagem**.
3. Três cartões: `% concluído` (fonte Fases), `Total de processos` e `Total de setores` (fonte Resumo; a métrica usa Soma).
4. **Gráfico de colunas** com a fonte Fases pública: dimensão **Fase**, métrica `% concluído`, classificado por **Fase crescente**.
5. Opcional: texto pequeno com o campo "Atualizado em" da fonte Resumo.
6. Nos dados de prova: `% concluído` 47,62%, 3 processos, 3 setores; fases I, II e III em 100%, IV em 33% e V a VII em 0%.

## 5. Compartilhar

Cada compartilhamento é **decidido por quem administra, na hora**; nenhum passo abaixo se faz sem essa decisão.

1. **Dashboard interno:** **Compartilhar → Gerenciar acesso**. Adicione **só as pessoas da equipe do EP**, uma a uma (ou um grupo do Google), com permissão de **Visualizador**. Não use "Qualquer pessoa com o link". Como o relatório usa as credenciais do proprietário, quem abrir vê os dados sem ter acesso à planilha: por isso o acesso se controla aqui.
2. **Dashboard público:** **Compartilhar → Gerenciar acesso → Acesso geral → Qualquer pessoa com o link** (visualizador), que é o "Não listado". Só a planilha pública entra nele; confirme antes que o relatório não tem nenhuma fonte interna e que a página não mostra nome de processo ou de pessoa.
3. Copie o link do dashboard público para a troca no site (seção seguinte).

No desenvolvimento, os dois relatórios **ainda não foram compartilhados com ninguém**; o compartilhamento foi adiado para junto do acabamento visual.

## 6. Trocar o link no site da Casa Civil

**Conferir no `/ship` de produção.** O site da Casa Civil não faz parte deste repositório; quem o edita é a equipe do site.

1. Só faça isto depois de o cadastro dos processos atuais terminar e de a equipe conferir que os números do dashboard novo batem com o do Power BI.
2. Peça à equipe do site da Casa Civil que troque, na página do EP, o link do dashboard do Power BI pelo link do **dashboard público** do Data Studio (seção 5).
3. Abra a página do EP depois da troca, sem estar logado em nenhuma conta, e confira que o dashboard abre.
4. Guarde o link antigo por um tempo, caso seja preciso voltar.

## 7. Encerrar o Power BI

**Conferir no `/ship` de produção.** A licença do Power BI em uso é do Tecpar, não do CED.

1. Só depois de a seção 6 estar feita e de o Data Studio estar em uso há alguns dias sem queixa.
2. Avise a quem administra o Power BI do Tecpar que o relatório do EP pode ser retirado.
3. Peça que retirem a publicação aberta do relatório (o link público antigo deixa de funcionar).
4. Guarde uma cópia do arquivo do relatório, se o Tecpar permitir, antes de excluí-lo.

## 8. Excluir a planilha manual

**Conferir no `/ship` de produção.** A planilha preenchida à mão que alimenta o Power BI só se exclui depois de tudo acima.

1. Confirme que o Power BI foi encerrado (seção 7) e que a equipe não preenche mais essa planilha.
2. Faça uma cópia da planilha antiga e guarde-a no Drive compartilhado do CED, numa pasta de arquivo morto.
3. Peça a quem é dono da planilha antiga que a mova para a lixeira do Google Drive. Ela fica 30 dias na lixeira, e dá para restaurar nesse prazo.

## Limites do Data Studio (em relação ao Power BI)

- Não há o visual de HTML do Power BI. A matriz de situação por fase vira tabela com mapa de calor, não os "chips" coloridos.
- Há menos controle fino de interação e de formatação condicional.
- O Data Studio calcula menos: por isso a plataforma já entrega as situações por fase prontas na planilha.
- O visual ainda precisa de acabamento (tema, cores, alinhamento, títulos e nomes das páginas). **Ainda não foi feito.** Ver o backlog do projeto (`.scratch/backlog.md`, item de 2026-10-20 sobre a revisão visual dos dashboards).
