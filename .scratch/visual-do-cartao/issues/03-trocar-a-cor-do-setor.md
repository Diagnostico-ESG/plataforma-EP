# 03: Trocar a cor do setor

**What to build:** Administrador e Integrante do EP trocam a cor do setor no setor aberto, por uma grade com as 30 amostras da paleta (botões de rádio nativos num grupo com legenda "Cor do setor"), com a cor atual em linha acesa. As amostras usadas por outro setor aparecem marcadas, com nome acessível "{nome da cor}, em uso por {SIGLA}", sem impedir a escolha: dois setores podem ter a mesma cor. A troca grava junto com o [Salvar] do formulário; se falhar, a escolha continua marcada com a mensagem de falha de hoje. A Consulta não vê a grade. No Novo setor não há grade (o banco escolhe; troca-se depois). Regras completas na seção "Cor do setor" da spec de `cadastros-basicos` (histórias 5 a 11, 18) e no ADR 0030.

**Blocked by:** 02 (Cor do setor gravada e mostrada nos cadastros)

**Status:** ready-for-agent

- [ ] Editar setor envia `cor`; teste do módulo de cadastros com o cliente simulado.
- [ ] Grade no setor aberto com a cor atual marcada e as em uso com o nome acessível (a primeira sigla em ordem, quando mais de um setor usa); função pura do nome acessível com teste, se existir.
- [ ] Trocar e salvar, inclusive por uma cor em uso; falha mantendo a escolha; Consulta sem a grade; Novo setor sem a grade; testes de tela (arte anterior: `App.editarSetor`).
- [ ] A recusa do banco para Consulta, inativo e visitante, provada no ticket 02, continua passando.
- [ ] `npm test` verde.
- [ ] `[visual]` A grade cabe no formulário do setor sem rolar para os lados, com a escolhida em linha acesa e as em uso marcadas de forma discreta, inclusive em 1366×768.
