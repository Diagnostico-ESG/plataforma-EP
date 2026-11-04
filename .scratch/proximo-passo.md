# Próximo passo (2026-11-04)

**Situação:** duas demandas do dia feitas e comitadas na `main`: (1) linha de etapas do verso só com ícones (ADR 0041, `/polir` feito, spec de `processos-etapas` com `Em revisão desde 2026-11-04`); (2) bug da rolagem do Quadro: com uma coluna grande, a roda do mouse fazia a página rolar além do Quadro e sobrava um vazio embaixo, porque o texto `.visualmente-oculto` (position: absolute) de cada cartão escapava da área que rola. Corrigido com `position: relative` em `.quadro-colunas` e `.coluna-cartoes` (commit a6ca858 e o do teste), conferido no navegador (vitrine local, janela de 700 px: página volta a ter 700 px; Linhas também) e com teste de regressão (`Quadro.css.test.ts`, que lê o CSS; o jsdom não mede altura). Marco: `marco/2026-11-04-antes-correcao-rolagem-da-coluna`.

**Próximo comando:** `/polir` (Sonnet) para a correção do Quadro (passo 5 do caminho do bug, mexeu em CSS). O `/ship` não é necessário (sem dependência, migração, função ou login).

**Depende do usuário:** ver no app real, com o login, (a) a rolagem da coluna grande sem o vazio embaixo e (b) o verso com a linha de etapas só de ícones.

**Adiados (cada um pelo `/demanda`):** o mesmo vazamento de `.visualmente-oculto` pode alongar a página na Lista e em outras áreas com `overflow: auto` (backlog); a solução na raiz (`position: relative` em `.area-de-trabalho`) não foi aplicada porque muda a âncora de popovers; testes instáveis (`App.relatorioDepois`, `App.substituirArquivo`, `App.publicarSemRevisoes`); demais itens do `.scratch/backlog.md`.
