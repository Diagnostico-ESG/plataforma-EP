# Próximo passo (2026-11-03)

**Situação:** a correção das Linhas do Quadro (bug: grade virava fila por ordem de carregamento do CSS) está no commit `a59677c` e seguintes, na `main`, com marco `marco/2026-11-03-antes-correcao-linhas-do-quadro`; a segunda correção (altura das linhas: cada linha cresce com seus cartões) está nos commits `12affa2` e `f77b41c`, com marco `marco/2026-11-03-antes-correcao-altura-das-linhas`. As duas correções vieram depois da última marca de entrega (`a973441`); conferido pelo `/situação` em 2026-11-03. Code-review feito (padrões e spec, sem achado duro). Falta o `/polir` da interface e a sua conferência no app real: o critério `[visual]` 15 (colunas alinhadas, cabeçalho único no alto, selo no cabeçalho da linha) segue presumido.

**Próximo comando:** `/polir` (Sonnet), se quiser; ou só abrir o app com o login e conferir o Quadro por etapa com Linhas = Setor e = Responsável. Se destoar, `/demanda`. Sessão nova começando pelo `/situação`.

**Depende do usuário:** ver o app com o login real (Linhas, selo do setor, Status, pílulas, foto do Google, miniatura com .png real).

**Adiados (cada um pelo `/demanda`):** rolagem vertical ao arrastar cartão até a borda nas Linhas (novo); bug do histórico "Moveu o processo" (`src/cadastros/historicoDosCadastros.ts:19`); nome do setor ao passar o mouse no selo da Lista e do verso; dividir o `Quadro.css` e `/impeccable document`; lentidão da primeira abertura da miniatura; coluna `cor` de `setores` sem uso; no `.scratch/backlog.md`: renomear "etiqueta" para "status" no código, bloco repetido do Avatar, teste instável de `substituirArquivo` (e um teste que falhou uma vez em `npm test` em 2026-11-03 e passou na repetição).
