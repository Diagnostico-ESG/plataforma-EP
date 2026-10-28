# Desvios de visual-do-cartao

Só recebe entradas novas, datadas.

## 2026-10-27 — Ticket 02 (cor do setor nos cadastros)

- **`OpcaoDaCaixa` ganhou a prop `corDoSetor` (número da cor), não usa a `cor` do ticket.** O ticket diz "`OpcaoDaCaixa` com `cor`". A `cor` existente recebe um texto CSS e aplica `background` inline; um degradê nesse atalho pode ser descartado pelo jsdom e o teste não o enxergaria. O quadradinho do setor usa duas variáveis CSS (`--cor-claro`, `--cor-escuro`), as mesmas do selo, e o degradê fica no CSS (`.opcao-cor-do-setor`). Efeito na tela: o mesmo quadradinho do macroprocesso, em degradê.
- **O selo no setor aberto editável fica acima do formulário**, porque o título do formulário é texto (`Setor TSA`). Na leitura (Consulta) o selo está na linha "Sigla".
- **Teste 58 ajustado:** ele insere um setor com os gatilhos desligados e passou a informar `cor`, porque a coluna é obrigatória.
- **Tipos gerados exigem `cor` no insert** (coluna obrigatória; o gatilho preenche no banco). `criarSetor` faz a conversão de tipo com comentário.
- **`[visual]` não conferido na tela:** o app exige login e não há vitrine no repositório. O contraste do texto escuro nas duas pontas das 30 cores está provado por teste (4,5:1). Conferir com o login real: selo legível nas 30 cores; quadradinho do [Pôr setor] igual ao do macroprocesso.
