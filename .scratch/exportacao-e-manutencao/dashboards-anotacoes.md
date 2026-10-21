# Dashboards no Data Studio — anotações de montagem (ticket 04)

Insumo do ticket 05 (roteiro para refazer cada dashboard do zero). Conta: `ced@ccivil.pr.gov.br` (Data Studio da conta institucional do CED). Planilhas do **desenvolvimento** (dados de prova): "EP-planilha interna (dev)" e "EP-planilha pública (dev)". Em produção, repetir com as planilhas de produção.

## Antes de começar

1. Entrar no Data Studio (datastudio.google.com) com a conta do CED. Na primeira vez, o Data Studio pede duas autorizações: acesso à API do Data Studio e acesso ao Google Planilhas. As duas são da conta, no próprio navegador.
2. Criar > Fonte de dados > conector **Google Planilhas**, escolher a planilha e a aba. Manter marcado "Usar a primeira linha como cabeçalhos" e "Incluir células ocultas e filtradas".
3. Uma fonte de dados por aba que o dashboard usa (o conector do Google Planilhas lê uma aba por fonte).

## Fontes de dados

| Fonte | Planilha / aba | Observações |
| --- | --- | --- |
| EP-planilha interna (dev) - Processos | interna / Processos | Credenciais dos dados: "Centro Estadual de Desburocratizacao" (conta do CED). |

| EP-planilha interna (dev) - Fases | interna / Fases | Colunas: Identificador, Área, Processo, Fase, Situação, Data de conclusão. Tudo Texto. Campo calculado `Concluída em` (mesma fórmula, sobre `Data de conclusão`). |
| EP-planilha pública (dev) - Resumo | pública / Resumo | Colunas: Total de processos (número), Total de setores (número), Atualizado em (data e hora). Tipos já reconhecidos. |
| EP-planilha pública (dev) - Fases | pública / Fases | Colunas: Fase (texto), Concluídos (número), Total (número). Tipos já reconhecidos. |

A fonte da planilha pública não tem nenhum campo de pessoa nem de processo. Criar as duas fontes públicas só a partir da planilha pública, nunca da interna.

### Campos calculados da fonte Processos (interna)

- **Todas as colunas chegam como Texto.** A plataforma escreve as datas como texto `AAAA-MM-DD` e as células vazias como o texto `null`. Trocar o tipo do campo para Data direto **falha** ("não reconhece o formato"): é preciso um campo calculado.
- `Modelagem piloto em` = `CASE WHEN LENGTH(Data da modelagem piloto) = 10 THEN PARSE_DATE("%Y-%m-%d", Data da modelagem piloto) END` (tipo Data).
- `Publicado em` = a mesma fórmula sobre `Data da publicação`.
- Ao digitar a fórmula, **não** escrever os nomes de campo com crase: digitar o início do nome (ex.: `Data da mod`) e teclar Enter para aceitar a sugestão, que insere o campo de verdade. Com crase digitada o editor responde "Código desconhecido da dimensão ou métrica".
- O botão Salvar do editor precisa de dois cliques (o primeiro só tira o foco do editor); a confirmação é a mensagem "Campo calculado salvo".

## Dashboard interno (relatório "Dashboard interno do EP (dev)")

Criado em Data Studio pelo endereço `datastudio.google.com/reporting/create` (o botão "Criar Relatório" da página da fonte abre aba nova e o navegador do app bloqueia). Fontes no relatório: Processos e Fases (internas). Credenciais dos dados: do proprietário (quem abre o relatório vê os dados sem ter acesso à planilha; por isso o compartilhamento do interno é restrito à equipe).

- **Combinação "Processos e fases"** (Combinação > Adicionar uma combinação): tabela 1 = Fases (dimensões Identificador, Área, Fase, Processo, Situação, Concluída em), tabela 2 = Processos (Identificador, Macroprocesso, Modelagem piloto em, Publicado em, Situação). Junção externa à esquerda por Identificador = Identificador. Serve à tabela processo × fase.
- **Campos calculados no relatório, sobre a fonte Fases:**
  - `Concluídas` = `SUM(CASE WHEN Situação = "Concluída" THEN 1 ELSE 0 END)`
  - `Total de processos` = `COUNT_DISTINCT(Identificador)`
  - `Prontos para iniciar` / `Aguardando` = o mesmo SUM, com "Pronto para iniciar" / "Aguardando etapa anterior"
  - `Avanço I a VII` = `SUM(CASE WHEN Situação = "Concluída" THEN 1 ELSE 0 END) / COUNT(Situação)`
  - `Avanço IV a VII` = concluídas das fases IV a VII dividido pelas linhas das fases IV a VII (`Fase IN ("IV","V","VI","VII")`)
  - `Publicados` = `COUNT_DISTINCT(CASE WHEN Fase = "VII" AND Situação = "Concluída" THEN Identificador END)`
  - `Fase nº` = `CASE Fase WHEN "I" THEN 1 ... WHEN "VIII" THEN 8 ELSE 9 END` (para ordenar as fases romanas, que em ordem alfabética saem fora de ordem)
- **Página 1 (visão geral), feito até agora:** quatro cartões (Total de processos, Publicados, Avanço I a VII, Avanço IV a VII) e um gráfico de barras Fase × Concluídas e Total de processos. Conferência com a planilha de prova (3 processos, 21 linhas de fase): total 3, publicados 0, avanço I a VII 0,48 (10 de 21), avanço IV a VII 0,08 (1 de 12). Batem.
- **Página 1 (visão geral)**, completa: quatro cartões (Total de processos, Publicados, Avanço I a VII e Avanço IV a VII, os dois últimos em formato Porcentagem: 47,62% e 8,33%, o que bate com 10 de 21 e 1 de 12 fases concluídas na planilha de prova), gráfico de colunas por fase (Fase × Concluídas e Total de processos, ordenado por `Fase nº` crescente: em Configuração, seção "Classificar"), tabela dinâmica com mapa de calor Área × Fase (linhas = Área, coluna = Fase, métrica = Concluídas) e gráfico de colunas das modelagens piloto por mês (fonte Processos; dimensão `Modelagem piloto em` com tipo "Ano e mês"; métrica Record Count; linha de referência "Meta mensal (12)" de valor constante 12 em Estilo > Linhas de referência. A meta 12 muda ali mesmo, no Data Studio).
- **Página 2 (por fase):** lista suspensa de Fase no topo (controle), cartões Concluídas (10), Prontos para iniciar (2) e Aguardando (8), e gráfico de colunas "processos por setor" (Área × Total de processos). Fonte: Fases interna. O controle de Fase filtra os cartões e o gráfico da página.
- **Página 3 (processo × fase):** tabela com a fonte "Processos e fases" (combinação), uma linha por processo e fase: Concluída em, Situação da fase, Fase, Situação do processo (rótulo "Em andamento · V", "Próxima · IV"), Área e Processo. O Identificador ficou fora da tabela. **Observações** não aparece: a coluna da planilha chega vazia (ver Achados).
- **Nomes das páginas:** ficaram "Página sem título"; mudar o nome pelo painel "Páginas do relatório" não funcionou no navegador do app (ctrl+A selecionou os componentes em vez do texto). Renomear à mão, na ficha de revisão visual.
- **Dificuldade (resolvida):** com o painel do navegador de 440 px de altura o painel de propriedades fica cortado e não se alcança o "Classificar"; com o painel maior ele aparece. No navegador do app, menus e botões do Data Studio só respondem ao clique depois de um `hover` (passar o mouse) sobre eles, e desenhar um gráfico exige um passo para escolher o tipo e outro, separado, para arrastar no canvas.

## Dashboard público (relatório "Dashboard público do EP (dev)")

Relatório separado, só com as fontes da **planilha pública** (nenhuma fonte interna foi adicionada; a janela "Revise o acesso aos dados" lista só Resumo e Fases públicas). Credenciais dos dados: do proprietário.

- Campo calculado na fonte Fases pública: `% concluído` = `SUM(Concluídos) / SUM(Total)`. Ao digitar, o Enter só aceita a sugestão de campo se o popup de sugestões já apareceu: esperar ~1 s entre digitar o início do nome e teclar Enter.
- Cartões: `% concluído` (47,62%, formato Porcentagem), Total de processos (3, fonte Resumo) e Total de setores (3, fonte Resumo).
- Gráfico de colunas por fase (fonte Fases pública): dimensão Fase, métricas `% concluído` (e Total, no eixo da direita), classificado por Fase crescente. Valores de prova: fases I, II e III em 100%, IV em 33% (1 de 3), V a VII em 0%.
- "Atualizado em" (Resumo) ainda não aparece na página; pode entrar como texto pequeno.
- Arrastar um campo do painel Dados para o campo "Dimensão" ou "Métrica" do painel de propriedades troca o campo do gráfico (acrescenta, no caso de métrica já preenchida pelo gráfico novo).

## Achados

- A coluna **Observações** da aba Processos não apareceu como campo na fonte (a planilha de prova tem 3 processos e a coluna está vazia). Conferir com dados preenchidos.
- O painel do navegador do app é estreito; o trabalho no Data Studio fica bem mais fácil com o painel largo.
- O endereço de criação de fonte com identificador de conector colado à mão é recusado ("código do conector inválido"): sempre escolher o conector pela lista.

## Compartilhamento (2026-10-21)

- **Interno:** compartilhado como Visualizador, à mão pelo usuário, com as oito pessoas da equipe; o usuário confirmou acesso geral "Restrito". Uma das pessoas só foi aceita pelo Google depois de o endereço ter conta do Google (e-mail institucional sem conta Google dá "Esse endereço não existe"; a saída é a pessoa criar uma Conta do Google com o endereço atual).
- **Público:** "Não listado", papel Leitor, feito por Arquivo > Compartilhar > Configurações de link, com o "sim" do usuário; conferido reabrindo a janela. No painel estreito do navegador do app, Compartilhar fica dentro do menu Arquivo.

## Visual do Power BI na página 1 do interno (2026-10-21)

Insumo para o ticket 05. Escolha padrão (usuário sem preferência firme): sem cópia de segurança do relatório (o navegador do app bloqueia a aba da cópia); proteção pelo Histórico de versões do Data Studio. Trabalho feito pelo Claude in Chrome na conta do CED; o editor pediu autorização do Google Planilhas na primeira abertura no Chrome (erro enganoso "a planilha não existe mais").

- **Página:** 1200 × 680 px (proporção do Power BI), fundo `#E8EDF5`, componentes brancos com raio 10, cabeçalho `#003070`, grade de 10 px.
- **Cartões:** fonte Fases; título pelo "Nome de exibição" do campo na métrica; avanços com tipo Porcentagem; texto em `#003070`. Sem barra de progresso nem linha colorida (limite do Data Studio).
- **Painel A:** barras horizontais, dimensão Fase, métrica `% concluído` = `Concluídas / Total de processos` (Porcentagem, 0 casas), barras `#003070`, rótulos ligados, sem legenda.
- **Painel B:** tabela dinâmica Área × Fase; métrica `Situação nº` = `MAX(CASE Situação WHEN "Concluída" THEN 4 WHEN "Em andamento" THEN 3 WHEN "Pronto para iniciar" THEN 2 ELSE 1 END)`; aparência Número; 4 regras de formatação condicional (4 `#3DBE7A`, 3 `#F5A623`, 2 `#3F8FE0`, 1 `#E3E7EF`), cor da fonte igual à do fundo para esconder o número. Largura mínima de coluna da dinâmica (~77 px): o painel precisa ser largo para as 7 etapas.
- **Painel C:** barras `#003070`, rótulos ligados, sem legenda, linha de referência 12.
- **Limites do Data Studio:** sem campo de posição/tamanho (só arrasto; a grade ajuda); sem barra de progresso nos cartões; sem pílulas de situação; texto de título é caixa de texto à parte.
- **Faltam na página 1:** legenda das cores, seletor de Setor, faixa "Visão Geral", frases calculadas. Páginas 2, 3 e público: o usuário continua à mão.
- **Separação entre as células do mapa (painel B):** a tabela dinâmica só tem "Cor da borda da célula" (já em branco, linha de 1 px); não há espessura, espaçamento nem cantos arredondados. Decisão do usuário em 2026-10-21: deixar assim por enquanto. Alternativas, se voltar a importar: linhas brancas verticais por cima (só separa as etapas) ou tabela comum com 7 métricas e 28 regras de cor.

## Visual do dashboard público (2026-10-21)

- **Página:** 1200 × 680 px, grade de 10 px, fundo `#EEF3F9`, componentes brancos com raio 14.
- **Cabeçalho:** retângulo com degradê linear a 90° de `#0069B4` a `#2B4A66`, sem borda; título (32 px, negrito, branco) e subtítulo (14 px, branco) em caixas de texto.
- **Cartões:** fontes Resumo (Total de processos, Total de setores) e Fases (% concluído); texto das legendas pelo "Nome de exibição" do campo; números em `#1A6DB5`, e o % em verde.
- **Painel "Andamento do trabalho":** barras horizontais, dimensão Fase, métrica `% concluído` (Porcentagem), barras `#1A6DB5`, rótulos ligados, sem legenda. Uma barra por etapa (I a VII): o Power BI agrupa I a III, o que o Data Studio faria só com um campo calculado a mais.
- **Cartões de texto:** "Para que serve…" (fundo branco) e "O que vem depois" (fundo `#FFF8C4`), caixas de texto com fundo e raio.
- **Cuidado:** clicar numa barra no editor aplica um filtro cruzado (aparece uma ficha "Fase X" no topo); remover em "Redefinir".
- **Diferenças do Power BI:** sem ícones redondos, sem a faixa amarela sob o título, sem o selo de data no rodapé do texto e com a barra de cada etapa em vez do agrupamento I a III.
