# Próximo passo (2026-11-03)

**Situação:** a revisão de `setor-neutro-e-fotos` (ADR 0040) está implementada (`12d7604`) e polida (`9347863`): selo do setor nas 12 cores, Status no quase preto do texto, e o cabeçalho do Quadro por setor sem a moldura em volta do selo. O `/polir` também conferiu as duas correções das Linhas do Quadro (grade e altura): seguram. Achados e o que ficou de fora em `.scratch/setor-neutro-e-fotos/desvios.md`. Testes: 3372 passando. A spec tem `Em revisão desde 2026-11-03` e `Implementado em`.

**Próximo comando:** `/ship` de `setor-neutro-e-fotos` (Sonnet), em sessão nova começando pelo `/situação`.

**Depende do usuário:** ver o app com o login real (cores dos selos, cabeçalho do Quadro por setor, ícones de Status, Linhas do Quadro); a vitrine local só foi lida pelos estilos calculados, sem captura.

**Adiados (cada um pelo `/demanda`):** rolagem vertical ao arrastar cartão até a borda nas Linhas; bug do histórico "Moveu o processo" (`src/cadastros/historicoDosCadastros.ts:19`); nome do setor ao passar o mouse no selo da Lista e do verso; dividir o `Quadro.css` e `/impeccable document` (com o `DESIGN.md` desatualizado); lentidão da primeira abertura da miniatura; no `.scratch/backlog.md`: renomear "etiqueta" para "status" no código, bloco repetido do Avatar, um só ponto para "sem cor vale a 1", teste instável de `substituirArquivo`.
