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

## 2026-10-27 — Ticket 04 (cor do setor na área Processos)

- **O Reclassificar não ganhou o quadradinho porque não tem campo Setor.** A spec (decisão 4) e o ticket dizem que a janela de Reclassificar usa o mesmo campo Setor do formulário, mas `JanelaDeReclassificacao` só troca o tipo e o processo pai (as opções de pai são "SIGLA — Nome", texto, fora do escopo). O quadradinho entrou no filtro Setor e no campo Setor do Novo processo e do Editar, que são o mesmo componente (`CamposDoProcesso`). Divergência spec × código a rever na leitura da spec; nada foi mudado na janela.
- **Docker local desligado:** o teste 67 e a migração rodaram só pelos workflows. O 67 falhou antes (`column "setor_cor" does not exist`, 0 ok) e passou depois, 7 de 7, com os demais arquivos verdes.
- **O helper `cartaoDe` dos testes aceita o nome na faixa** (`.cartao-nome, .cartao-faixa-nome`): por setor o nome do processo mudou de lugar. Os testes antigos que liam `.cartao-sigla` passaram a ler `.cartao-faixa` (a classe `.cartao-sigla` e `.cartao-topo` saíram do CSS).
- **A cor da falsa de processos** vem de `ProcessosFalso.corDoSetor` (padrão: a cor 1); `montarNosCadastros` a liga aos cadastros, para a troca de cor aparecer no Quadro depois de recarregar.
- **`[visual]` visto só em parte, na vitrine local (módulos falsos, 1366×768):** a faixa ocupa o topo do cartão de lado a lado (medido: 300 de 302 px, a diferença é a borda de 1 px), com cantos arredondados e a sigla centralizada, no agrupamento por etapa, na cor 1. **Não visto:** o nome do processo na faixa (a vitrine não tem setores, então o agrupamento por setor fica vazio), a faixa com a borda vermelha do parado, as 30 cores e um nome longo, e o selo do verso, o da Lista, o título da coluna e o quadradinho com o login real. Seguem presumidos.

## 2026-10-27 — /polir de visual-do-cartao (tickets 01 a 04)

- **Auditoria (código, `impeccable detect` nos arquivos dos tickets 01 a 04 e leitura de tokens e CSS):** 0 problemas de design; 2 avisos do detector. Acessibilidade: a cor não entra em nenhum nome acessível (selo e faixa só levam o texto da sigla ou do nome); o contraste do texto escuro nas duas pontas das 30 cores está provado por teste (4,5:1); `forced-color-adjust: none` no selo e no quadradinho preserva a cor no contraste forçado; a sigla (ou o título da coluna) está sempre escrita. Tema: o projeto não tem modo escuro, então o texto escuro sobre o tom claro não corre risco. Responsivo e desempenho: sem largura fixa, sem animação nova, sem toque especial; uso em desktop.
- **Corrigido:** os dois tamanhos de fonte soltos (`1rem` no nome da faixa e `1.125rem` na sigla da faixa) passaram a usar os tokens `--tam-coluna` (16px) e `--tam-painel` (18px); comentário sobre o raio da faixa.
- **Deixado de fora:** o raio de `calc(var(--canto) - 1px)` na faixa, que o detector acusa como fora da escala do DESIGN.md: é o raio do cartão menos a borda de 1px, para a faixa encostar no canto de dentro, e vale só para a faixa; um token novo para isso seria enfeite. O `[visual]` dos tickets 01 a 04 segue presumido (precisa do login real).
