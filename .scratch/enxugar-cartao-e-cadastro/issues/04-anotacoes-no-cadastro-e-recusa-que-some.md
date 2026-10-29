# 04: Anotações no cadastro e recusa do formulário que some

**What to build:** o cadastro de Novo processo ganha o campo **Anotações**, uma área de texto. O que se escreve ali aparece no bloco das Anotações do verso, com quem escreveu e quando, como o texto escrito no verso. As Anotações em branco ou só com espaços vão como nulas, e o cadastro funciona sem elas. O limite das Anotações sobe de 2.000 para 8.000 caracteres, no banco, no campo do cadastro e no bloco do verso. O Editar processo não ganha o campo. No banco, o cadastro passa a poder gravar as Anotações, e o gatilho que preenche quem e quando passa a valer também ao inserir, com texto não nulo. Junto, corrige o bug do setor: a mensagem de recusa do formulário (de validação ou do banco), que hoje só se calcula ao enviar e nunca se apaga, passa a sumir em qualquer mudança de campo, no cadastro e na edição, e volta no próximo envio se o problema continuar. Regras completas na spec: histórias 3 a 7, 9 e 10, decisões "Formulário do processo" (parte das Anotações) e "Bug do setor", e itens 2 e 5 do "Modelo de dados". Antes de começar, ler `.claude/regras/banco.md`.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Testes pgTAP primeiro, depois a migração. O limite novo de 8.000 caracteres é aceito, e o que passa disso é recusado. O cadastro grava as Anotações com quem escreveu e quando. Cadastrar com Anotações é testado com Administrador, Integrante, Consulta, um usuário desativado e um visitante sem login. Ler as Anotações também é testado com cada um deles.
- [ ] O cadastro tem o campo Anotações, com o limite de 8.000. O texto aparece no bloco do verso com quem e quando, e em branco vai como nulo.
- [ ] O bloco das Anotações do verso aceita até 8.000 caracteres.
- [ ] O Editar processo não tem o campo Anotações.
- [ ] Depois de "Escolha o setor do processo.", escolher o setor faz a mensagem sumir. Qualquer mudança de campo apaga a recusa, de validação ou do banco, e ela volta ao enviar de novo se o problema continuar. Há um teste de regressão.
- [ ] `npm test` verde. pgTAP com as linhas `ok` no Docker local e o workflow "Testes de banco" verde.
