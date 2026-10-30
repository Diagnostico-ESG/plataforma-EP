# 05: Origem, Contexto e Observações saem de vez

**What to build:** a plataforma passa a ter um só texto livre por processo, as Anotações. A migração junta nas Anotações o Contexto e as Observações já gravados: "Contexto: …", "Observações: …" e o texto que já havia, nessa ordem, separados por uma linha em branco e só com os trechos não vazios, passando pelo gatilho das Anotações (quem fica nulo e quando fica com a hora da migração). Depois a migração recria a view `processos_com_andamento` sem `origem`, `contexto` e `observacoes`, com as mesmas colunas e a mesma ordem no resto e `security_invoker = true`. As funções que listam as colunas uma a uma (o estado guardado no histórico, as leituras do processo e o pacote das planilhas) deixam de citar as três. Os privilégios de coluna, as colunas e o tipo `origem_do_processo` são apagados. Na tela, os campos Origem, Contexto e Observações saem do cadastro e do Editar processo, os rótulos da Origem saem, e o "Sobre" do verso fica só com Setor, Macroprocesso e Tipo. Os tipos do processo e os módulos falso e do Supabase acompanham. A planilha interna (Edge Function `planilhas-dos-dashboards`) mantém a coluna "Observações", com o cabeçalho, sempre vazia, e deixa de ler `observacoes` do pacote. A "Data da modelagem piloto" da planilha não muda. O histórico antigo que tem Origem, Contexto ou Observações continua legível. Regras completas na spec: histórias 1, 8, 11 a 15, 41 e 47 a 49, decisões "Formulário do processo", "Tipos do processo", "'Sobre' do verso", "Planilha interna" e "Histórico", e itens 1 e 7 do "Modelo de dados". Antes de começar, ler `.claude/regras/banco.md`.

**Blocked by:** 04 (a junção precisa do limite de 8.000 caracteres nas Anotações)

**Status:** ready-for-agent

- [x] Testes pgTAP primeiro, depois a migração. A junção é testada com só Contexto, só Observações, os dois, os dois com Anotações já existentes e nenhum, e trechos vazios não geram rótulo. A view não tem as três colunas e mantém `security_invoker`. As colunas e o tipo da Origem não existem mais. A leitura das Anotações juntadas é testada com cada perfil, com um usuário desativado e com um visitante sem login.
- [x] O cadastro e o Editar processo não têm Origem, Contexto nem Observações, e os dados enviados não levam mais esses campos.
- [x] O "Sobre" do verso mostra só Setor, Macroprocesso e Tipo.
- [x] A Consulta lê as Anotações, inclusive o texto juntado, sem poder alterar.
- [x] O histórico antigo com `origem`, `contexto` ou `observacoes` no estado continua com os nomes legíveis.
- [x] O teste puro da planilha interna confere "Observações" sempre vazia, com o cabeçalho, e "Data da modelagem piloto" sem mudança.
- [x] Os tipos do banco foram gerados de novo, e os testes de tela que cobriam Origem, Contexto e Observações foram reescritos para o comportamento novo. `npm test` verde.
- [x] pgTAP com as linhas `ok` no workflow "Testes de banco" verde (59 de 59; o Docker local não sobe).
- [x] Fica avisado ao usuário que a `planilhas-dos-dashboards` precisa ser publicada de novo no desenvolvimento depois da migração.

Concluído em 2026-10-29 (commit 0839f97)
