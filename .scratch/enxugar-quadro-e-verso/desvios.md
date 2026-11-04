
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

## 2026-11-04 — /polir (audit e polish do Impeccable)
- **Detector** (`impeccable detect`) nos CSS tocados (`Verso`, `Quadro`, `Anotacoes`, `SeloDoSetor`, `VersaoEmDestaque`, `Etapas`, `tokens`): nenhum achado.
- **Corrigido (P1, responsivo): o verso em tela estreita (até 900 px) não empilhava as duas colunas.** A regra do `@media` estava antes da regra base do `.verso-corpo` (grid) e perdia; depois de movida para depois dela, as colunas ficaram uma em cima da outra, mas a de cima encolhia por baixo da de baixo (`flex: none` resolveu). Conferido a 800 px: Documentos, anexos e Anotações empilhados, com o corpo rolando.
- **Conferido sem achado:** faixa das colunas no Quadro por etapa a 1366 px (faixa neutra, título alinhado aos cartões, cartão parado com borda comum e selo de dias); verso a 1000 px em duas colunas; contraste do texto cinza (`--texto-2`) sobre `--fundo-faixa` ≈ 4,8:1 (passa AA); sem erro de console da tela (um 400 de recurso estático da vitrine, fora do app).
- **Deixado de fora, com o motivo:**
  - Borda do campo de Anotações (`--linha`) com contraste baixo de componente (WCAG 1.4.11 pede 3:1): é o mesmo padrão dos demais campos do app (`.agora-lista`) e o usuário pediu a borda mais suave; vale tratar junto para todos os campos num `/polir` do sistema.
  - Quadro com Linhas, por setor e por responsável: a vitrine local não desenhou as linhas (dados falsos sem setor/responsável combinando), então ficam presumidos no app real para o `/ship`.
  - Toque (gesto) e teclado das duas colunas não foram exercitados além do que os testes de tela cobrem.

## 2026-11-04 — /ship (revisão de código, cobertura, circular)
- **Escopo da entrega:** cobre `enxugar-quadro-e-verso` e também `processos-etapas` (linha de etapas só com ícones, ADR 0041, e correção da rolagem do Quadro), `documentos-versoes` e `repositorio-de-processos`, que estavam com `Em revisão desde 2026-11-04`. Ponto de partida da revisão: `a973441` (última entrega de `processos-etapas`).
- **`/code-review` (padrões e spec), achados corrigidos no código:** comentário JSDoc grudado na função errada em `dataDaModelagemPiloto.ts`; componente vazio `TituloDaColuna` removido; JSX do `ColunasDoVerso` reindentado; `colunasDaLista(true).length` virou a constante `TOTAL_DE_COLUNAS_DA_ARVORE`; o esqueleto de carregamento da Lista agrupada também perde as colunas Setor e Macroprocesso; comentário do topo de `Verso.css` (880 → 1000 px) e comentário do `CorpoDoAgora` atualizados.
- **Registrado em vez de corrigido:** o ADR 0042 diz que o [Enviar relatório] sai; o ADR 0043 registra que ele fica (a spec foi atualizada). O resto (default de cor `?? 1` em 8 pontos, `ProcessosFalso.ts` com 319 linhas, cast repetido de `estiloDaCor`, texto "dias nesta etapa" em dois lugares, filtro vindo do endereço sem como limpar na Lista agrupada, "Você" sem o nome para o leitor de tela) foi para o `.scratch/backlog.md`. O singular "1 dias" não ocorre: o selo só aparece com 8 dias ou mais.
- **Falso alarme da revisão de spec:** os arquivos de cor do setor (ADR 0040) aparecem no intervalo só porque o ponto de partida é anterior à entrega de `setor-neutro-e-fotos` (`e863a5c`, 2026-11-03), que já tem a sua marca.
- **Spec atualizada** para o que foi construído: item 7 não feito (ADR 0043), item 10 (14 linhas), item 11 (duas colunas), critérios 5, 6, 16 e 17.
- **Cobertura:** 98,21% das instruções, 94,44% dos ramos, 98,67% das funções, 99,19% das linhas (piso 70%). **Dependência circular:** nenhuma. `package.json` e `supabase/` não mudaram: sem auditoria de pacotes, sem revisão de segurança do código (nenhum login, dado de fora ou política novos) e sem passos de banco.

## 2026-11-04 — Revisão de segurança do código (reserva, depois do /ship)
- O `/security-review` padrão não achou diff (branch já integrada na `main`); foi feita a revisão de reserva, menos completa, por um agente que leu `src/` de `a973441` a HEAD (99 arquivos, quase só telas, CSS e testes).
- **Resultado: nenhum achado com confiança 8 ou mais.** Sem `dangerouslySetInnerHTML`/`innerHTML`/`eval`/`window.open` novos; cor do setor entra por tabela fixa (sem injeção de CSS); nenhuma leitura nova de parâmetro de endereço; o formulário de versão só afrouxou regra da tela (servidor e banco seguem validando e aceitando .bpmn, ADR 0042); sem segredo, `localStorage` nem log com dado pessoal; única consulta nova é a coluna `cor` de `setores`, por chave publicável com RLS.
- **Fora da revisão:** `supabase/` (RLS da coluna `cor`, função do Drive), que este `/ship` não alterou.
