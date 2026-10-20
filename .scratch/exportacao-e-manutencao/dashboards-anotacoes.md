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

### Campos calculados da fonte Processos (interna)

- **Todas as colunas chegam como Texto.** A plataforma escreve as datas como texto `AAAA-MM-DD` e as células vazias como o texto `null`. Trocar o tipo do campo para Data direto **falha** ("não reconhece o formato"): é preciso um campo calculado.
- `Modelagem piloto em` = `CASE WHEN LENGTH(Data da modelagem piloto) = 10 THEN PARSE_DATE("%Y-%m-%d", Data da modelagem piloto) END` (tipo Data).
- `Publicado em` = a mesma fórmula sobre `Data da publicação`.
- Ao digitar a fórmula, **não** escrever os nomes de campo com crase: digitar o início do nome (ex.: `Data da mod`) e teclar Enter para aceitar a sugestão, que insere o campo de verdade. Com crase digitada o editor responde "Código desconhecido da dimensão ou métrica".
- O botão Salvar do editor precisa de dois cliques (o primeiro só tira o foco do editor); a confirmação é a mensagem "Campo calculado salvo".

## Achados

- A coluna **Observações** da aba Processos não apareceu como campo na fonte (a planilha de prova tem 3 processos e a coluna está vazia). Conferir com dados preenchidos.
- O painel do navegador do app é estreito; o trabalho no Data Studio fica bem mais fácil com o painel largo.
- O endereço de criação de fonte com identificador de conector colado à mão é recusado ("código do conector inválido"): sempre escolher o conector pela lista.
