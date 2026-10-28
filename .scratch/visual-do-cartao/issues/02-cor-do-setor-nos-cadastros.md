# 02: Cor do setor gravada e mostrada nos cadastros

**What to build:** cada setor passa a ter uma **cor do setor**, guardada no cadastro como o número da cor numa paleta fixa de 30 cores claras, e a sigla aparece sobre essa cor nos cadastros. O setor novo recebe do banco a primeira cor que nenhum setor usa (ativo ou inativo; com as 30 em uso, a 1). Os 22 setores existentes recebem cor na migração, pela ordem alfabética da sigla. A cor fica fora do histórico: gravar só a cor não cria evento, e os eventos do setor não a trazem. Na área Setores, a sigla vira um selo (texto escuro sobre a cor em degradê) na lista de setores, no setor aberto e nas linhas de setor envolvido do macroprocesso; o seletor [Pôr setor] mostra o quadradinho da cor antes de cada setor. Ainda não dá para trocar a cor (ticket 03). Regras completas na seção "Cor do setor" da spec de `cadastros-basicos` (histórias 1 a 4, 12 a 17, 19 a 25) e no ADR 0030; tons no acréscimo de 2026-10-27 em `.scratch/identidade-visual.md`.

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [x] Teste pgTAP antes da migração: cada célula de "quem pode o quê" de `setores.cor` (Administrador, Integrante, Consulta, inativo, visitante) e cada linha da tabela de regras da spec (cor de 1 a 30; primeira livre; inativo ocupa a cor; com as 30 em uso, a 1; cor informada respeitada mesmo repetida; trocar só a cor não vira evento, e cor e nome juntos geram evento sem `cor`; setores coloridos pela ordem da sigla). `11_setores`, `00_rls_ligada` e `10_privilegios_padrao` continuam passando.
- [x] Migração não destrutiva (coluna, preenchimento, restrição, gatilho da primeira livre, gatilhos de evento sem `cor`, privilégios por coluna), rodada no Docker local e aplicada no desenvolvimento pelo workflow "Migrar banco de desenvolvimento"; tipos atualizados.
- [x] Módulo puro da paleta (único ponto com nomes e tons das 30 cores e o tom mais escuro calculado por uma regra fixa); testes: 30 cores distintas, número fora de 1 a 30 cai na 1, contraste do texto escuro de pelo menos 4,5:1 nas duas pontas, para as 30.
- [x] Componente compartilhado do selo do setor (pequeno e de faixa), sem nada no nome acessível.
- [x] Módulo de cadastros lê `cor` em setores, setor aberto e setores envolvidos (criar não envia cor); `CadastrosFalso` imita a primeira livre; testes de `cadastrosSupabase` e `macroprocessosSupabase` com a cor.
- [x] Selo na lista de setores, no setor aberto e nos setores envolvidos (inclusive inativos); quadradinho no [Pôr setor] por `OpcaoDaCaixa` com `cor` e `BotaoDaCaixa`; testes de tela (setor novo com a primeira cor livre, selos, quadradinho sem cor no nome da opção, histórico sem `cor`).
- [x] `npm test` verde; testes de banco verdes no Docker local e no "Testes de banco".
- [ ] `[visual]` O selo da sigla é legível nas 30 cores e o quadradinho do [Pôr setor] segue o do macroprocesso. (presumido: precisa do login real; contraste provado por teste)
