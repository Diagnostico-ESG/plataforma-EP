# 03: Data da modelagem piloto só como realização, na linha das Etapas

**What to build:** a data da modelagem piloto passa a ser só a data em que a modelagem aconteceu (ADR 0035). Ela sai do cadastro de Novo processo e do lado direito do verso, e passa a viver na linha da etapa Modelagem piloto, nas Etapas. Lá aparece "Realizada em dd/mm/aaaa" quando há data. Para quem pode alterar, aparece "Registrar data" ou "Alterar data", que vira ali mesmo o campo de data (o mesmo campo da data da validação), com a opção de apagar. Pode alterar quem é Administrador ou Integrante, com o processo em andamento ou concluído (não suspenso nem cancelado) e na Modelagem piloto ou numa etapa depois dela no catálogo. Fora disso, a data é só leitura e só aparece se existir, inclusive num processo que voltou para Não iniciados. O campo recusa data depois de hoje (em Brasília) antes de enviar, com a data digitada e o limite na mensagem. O banco também recusa data futura, por um gatilho, ao inserir e ao alterar, e a mensagem traz o valor e o limite. A migração apaga as datas futuras já gravadas, com registro no histórico, e tira do cadastro o direito de gravar a data. Registrar a data não move o processo nem muda a etiqueta. O tipo do processo mantém `dataDaModelagemPiloto`, e a planilha interna não muda nesta coluna. Regras completas na spec: seção "Data da modelagem piloto" (histórias 16 a 28), decisão "Data da modelagem piloto no verso" e itens 3, 4 e 6 do "Modelo de dados". Antes de começar, ler `.claude/regras/banco.md`.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Testes pgTAP primeiro, depois a migração. A data futura é recusada ao inserir e ao alterar, com o valor e o limite na mensagem. A data de hoje é aceita. As datas futuras já gravadas são apagadas, com registro no histórico. O cadastro não grava mais a data. Gravar a data é testado com Administrador, Integrante, Consulta, um usuário desativado e um visitante sem login.
- [ ] O cadastro de Novo processo não tem mais o campo da data, e os dados enviados ao módulo de processos não levam mais `dataDaModelagemPiloto`.
- [ ] O lado direito do verso não tem mais a seção da data.
- [ ] Na linha da Modelagem piloto, a data se registra, altera e apaga com o processo na etapa ou depois dela, inclusive em Concluídos. Em Não iniciados, a linha não oferece registrar.
- [ ] O campo recusa data futura antes de enviar, com a data digitada e o limite (hoje, em Brasília) na mensagem.
- [ ] A Consulta e os processos suspensos ou cancelados veem a data só para leitura. Um processo que voltou para Não iniciados com data registrada continua mostrando a data, só para leitura.
- [ ] Enquanto grava, o campo fica desabilitado. Uma falha mostra a mensagem abaixo do campo e mantém a data anterior.
- [ ] Os testes de tela da data da modelagem foram reescritos para o lugar novo. `npm test` verde.
- [ ] pgTAP com as linhas `ok` no Docker local e o workflow "Testes de banco" verde.
- [ ] `[visual]` A data cabe na linha das Etapas sem quebrar o desenho da linha do tempo.
