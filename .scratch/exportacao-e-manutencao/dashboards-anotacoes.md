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
- **Dificuldade:** o painel do navegador do app tem altura pequena (440 px) e o painel de propriedades do Data Studio fica cortado; o controle de ordenação do gráfico não foi alcançado. O gráfico por fase sai ordenado pelo valor, não pela ordem romana, até a ordenação por `Fase nº` ser configurada.
- Arrastar um campo do painel Dados para o campo "Dimensão" ou "Métrica" do painel de propriedades troca o campo do gráfico (acrescenta, no caso de métrica já preenchida pelo gráfico novo).

## Achados

- A coluna **Observações** da aba Processos não apareceu como campo na fonte (a planilha de prova tem 3 processos e a coluna está vazia). Conferir com dados preenchidos.
- O painel do navegador do app é estreito; o trabalho no Data Studio fica bem mais fácil com o painel largo.
- O endereço de criação de fonte com identificador de conector colado à mão é recusado ("código do conector inválido"): sempre escolher o conector pela lista.
