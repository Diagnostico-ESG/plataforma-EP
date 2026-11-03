# Próximo passo (2026-11-03)

**Situação:** a revisão de `setor-neutro-e-fotos` foi planejada no `/planejar` modo curto: o selo do setor volta às 12 cores fortes em ciclo sobre o número da coluna `cor` (sem escolha no cadastro, sem coluna tingida, cor também nos cabeçalhos do Quadro e no quadradinho das caixas de seleção) e os três ícones de Status ficam no tom do texto (`--texto`), diferentes só pela forma. Spec atualizada (com `Em revisão desde 2026-11-03`), ADR 0040 e `CONTEXT.md` ("Cor do setor") comitados. Marco `marco/2026-11-03-inicio-setor-neutro-e-fotos-2`. Nada de código ainda.

**Próximo comando:** `/executar-simples` com a spec `.scratch/setor-neutro-e-fotos/spec.md` como único ticket (Sonnet), em sessão nova começando pelo `/situação`. Ponto de partida do código: `src/cadastros/corDoSetor.ts` no commit `5ae9029^` (apagado em `5ae9029`, que também mostra cada arquivo que deixou de receber `cor`).

**Pendências que seguem:** as duas correções das Linhas do Quadro (commits `a59677c` a `f77b41c`) também não passaram pelo `/polir` nem pelo `/ship`; o próximo `/ship` de `setor-neutro-e-fotos` cobre as duas coisas. Conferência visual com o login real segue com o usuário.

**Adiados (cada um pelo `/demanda`):** rolagem vertical ao arrastar cartão até a borda nas Linhas; bug do histórico "Moveu o processo" (`src/cadastros/historicoDosCadastros.ts:19`); nome do setor ao passar o mouse no selo da Lista e do verso; dividir o `Quadro.css` e `/impeccable document`; lentidão da primeira abertura da miniatura; no `.scratch/backlog.md`: renomear "etiqueta" para "status" no código, bloco repetido do Avatar, teste instável de `substituirArquivo`.
