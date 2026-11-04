
## 2026-11-04 — Aprovação parcial da prévia (critério 18)
- O usuário aprovou só a faixa de fundo das colunas (tom neutro mais escuro, título dentro e alinhado aos cartões). Disse que o restante da prévia era "muito diferente" do app.
- A arrumação do verso **não** foi aprovada: o esboço em `previa-verso.html` não usava os componentes reais. Decisão: montar a arrumação no app real e mostrar uma captura dele ao usuário antes de fechar a Tarefa 8.3. Tarefas 1 a 7 seguem; o critério 18 fica aberto até essa aprovação.

## 2026-11-04 — Item 7 da spec (sem [Enviar relatório]) adiado por decisão do usuário
- A spec e o ADR 0042 supõem um "+ Acrescentar relatório" na versão, mas ele saiu no ticket 10 de `documentos-versoes`: hoje o único caminho para mandar um relatório sem versão nova é o [Enviar relatório]. Tirá-lo deixaria o relatório só no formulário da versão nova.
- Decisão do usuário: **manter o [Enviar relatório] por ora**. Nada muda na seção de versões, na Confirmação de arquivos nem nos testes de relatório. O critério 5 e o 6 de pronto ficam abertos; o `/ship` e a spec devem registrar isso. Se o usuário quiser tirar o botão depois, é preciso antes criar o "+ Acrescentar relatório" (espaço tracejado na versão mais recente que abre o `FormularioDeRelatorio`).
- Os rótulos do botão de envio já estão como a spec pede ("Enviar versão" / "Enviar versão piloto").

## 2026-11-04 — Verso rearrumado (critérios 11 e 17 da solução e de pronto)
- Arrumações vistas no app real (vitrine local com módulos falsos): A (Anotações embaixo, exigia rolar), C (Anotações sob os arquivos) e a **proposta do usuário**, escolhida e aprovada: duas colunas, com as Anotações numa coluna à direita em fundo mais escuro (`--fundo-faixa`). Isso substitui o desenho do esboço `previa-verso.html`. Capturas em `verso-no-app-real-*.jpg`. O critério 18 fica cumprido para o Quadro (faixa) e para o verso (duas colunas), ambos aprovados pelo usuário.
- Janela do verso: 880 → 1000 px (a primeira tentativa de 1100 foi estreitada a pedido). Campo de Anotações: 14 linhas de altura mínima em vez das 10,5 da spec, por pedido do usuário; borda do campo trocada pela cor `--linha`.
- Efeito colateral: com as colunas Setor e Macroprocesso fora da Lista agrupada, o filtro por setor ou macroprocesso não tem mais menu ali (vale pelo endereço ou voltando a "Agrupar por: Nenhum").
- Os critérios `[visual]` foram conferidos só na vitrine local (módulos falsos, sem o login real); ficam presumidos no app real para o `/ship`: selo menor, faixas nas Linhas e nos quadros por responsável e por setor, cartão parado sem borda, miniatura com .png de verdade.
- Testes instáveis vistos no pre-commit, que passaram na segunda rodada: `App.dataDaModelagemPiloto`/"Registrar data" (efeito da mudança, já corrigido) e um teste de "processo suspenso não mostra [Enviar relatório] nem [Substituir]" (instável, já no backlog).
