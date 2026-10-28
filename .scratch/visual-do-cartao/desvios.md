# Desvios de visual-do-cartao

Só recebe entradas novas, datadas.

## 2026-10-27 — Ticket 02 (cor do setor nos cadastros)

- **`OpcaoDaCaixa` ganhou a prop `corDoSetor` (número da cor), não usa a `cor` do ticket.** O ticket diz "`OpcaoDaCaixa` com `cor`". A `cor` existente recebe um texto CSS e aplica `background` inline; um degradê nesse atalho pode ser descartado pelo jsdom e o teste não o enxergaria. O quadradinho do setor usa duas variáveis CSS (`--cor-claro`, `--cor-escuro`), as mesmas do selo, e o degradê fica no CSS (`.opcao-cor-do-setor`). Efeito na tela: o mesmo quadradinho do macroprocesso, em degradê.
- **O selo no setor aberto editável fica acima do formulário**, porque o título do formulário é texto (`Setor TSA`). Na leitura (Consulta) o selo está na linha "Sigla".
- **Teste 58 ajustado:** ele insere um setor com os gatilhos desligados e passou a informar `cor`, porque a coluna é obrigatória.
- **Tipos gerados exigem `cor` no insert** (coluna obrigatória; o gatilho preenche no banco). `criarSetor` faz a conversão de tipo com comentário.
- **`[visual]` não conferido na tela:** o app exige login e não há vitrine no repositório. O contraste do texto escuro nas duas pontas das 30 cores está provado por teste (4,5:1). Conferir com o login real: selo legível nas 30 cores; quadradinho do [Pôr setor] igual ao do macroprocesso.

## 2026-10-27 — ticket 03 (trocar a cor do setor)

- **A cor só vai no [Salvar] quando mudou.** A spec diz "grava junto com o [Salvar]"; mandar a cor de volta sempre reverteria, sem aviso, uma troca feita por outra pessoa nesse meio-tempo (achado da revisão). Salvar só o nome não envia `cor`.
- **O formulário do setor não espera a lista de setores; a grade espera.** As marcas "em uso por" vêm de uma leitura extra de `listarSetores` ao abrir o setor (a contagem de macroprocessos vem junto e não é usada). Se a leitura falhar, a grade aparece sem as marcas. Aceito: informativo, e a leitura é barata; método próprio só se pesar.
- **"Primeira sigla em ordem" é comparação simples dos textos** (não depende do idioma do navegador). Setor inativo conta como "em uso", como no banco.
- **Dispensado da revisão:** ponto de "em uso" na cor do texto (o texto escuro já tem contraste de 4,5:1 nas duas pontas de todas as cores); faixa de 1 a 30 só no banco (o formulário nunca envia número fora dela).
- **`[visual]` não conferido na tela** (precisa do login real): grade de 30 amostras em 10 colunas sem rolar para os lados, linha acesa na escolhida, ponto discreto nas em uso, inclusive em 1366×768.
