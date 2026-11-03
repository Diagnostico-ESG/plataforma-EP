# Próximo passo (2026-11-03)

**Situação:** a revisão de `setor-neutro-e-fotos` (ADR 0040) está implementada no commit `12d7604`, com `Implementado em` na spec: o selo do setor voltou às 12 cores fortes em ciclo sobre o número da coluna `cor` (em todo selo, inclusive no cabeçalho da coluna do Quadro por setor e das Linhas por setor, e no quadradinho das opções de setor nas caixas de seleção), sem escolha no cadastro, sem enviar `cor` e sem coluna tingida; os três ícones de Status ficaram em `var(--texto)`, diferentes só pela forma. Testes: 3372 passando (uma falha instável num teste de relatório, que passou na repetição). Code-review nos dois eixos sem achado duro; dois cheiros foram ao backlog.

**Próximo comando:** `/polir` (Sonnet), em sessão nova começando pelo `/situação`. Ele cobre também as duas correções das Linhas do Quadro (commits `a59677c` a `f77b41c`), que ainda não passaram pelo `/polir`. Depois, `/ship` de `setor-neutro-e-fotos`.

**Depende do usuário:** ver o app com o login real (cores dos selos, cabeçalho colorido no Quadro por setor, ícones de Status em quase preto, Linhas do Quadro).

**Adiados (cada um pelo `/demanda`):** rolagem vertical ao arrastar cartão até a borda nas Linhas; bug do histórico "Moveu o processo" (`src/cadastros/historicoDosCadastros.ts:19`); nome do setor ao passar o mouse no selo da Lista e do verso; dividir o `Quadro.css` e `/impeccable document` (com o `DESIGN.md` desatualizado); lentidão da primeira abertura da miniatura; no `.scratch/backlog.md`: renomear "etiqueta" para "status" no código, bloco repetido do Avatar, um só ponto para "sem cor vale a 1", teste instável de `substituirArquivo`.
