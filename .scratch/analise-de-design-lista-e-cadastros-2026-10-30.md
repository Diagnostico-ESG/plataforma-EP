# Análise crítica de design: Lista e cadastros (2026-10-30)

Complemento de `.scratch/analise-de-design-2026-10-30.md`. Telas vistas no app rodando (localhost, 1440×900), com login do usuário, já com o pacote 3 (`lista-por-setor`) entregue:

- **Lista:** sem agrupamento, agrupada por macroprocesso, agrupada por setor, "Mostrar: Concluídos" e menu de coluna.
- **Setores:** lista, setor aberto, novo setor.
- **Macroprocessos:** lista e macroprocesso aberto.
- **Histórico.**

Nada foi salvo nem alterado. Referência visual de destino: a proposta visual 6 (`.scratch/proposta-visual/proposta-6.html`).

**Correção de termos (2026-10-30, apontada pelo usuário).** Os ícones A fazer, Iniciado e Finalizado são a **etiqueta** da etapa atual. A **situação do processo** (`CONTEXT.md`) é em andamento, suspenso, cancelado ou concluído; concluído é o processo que chegou à etapa Concluídos. O protótipo `lista-e-cadastros.html` foi corrigido:
- a coluna dos ícones se chama "Etiqueta";
- a coluna "Situação" mostra a situação do processo, com "Em andamento" discreto e as exceções (Suspenso, Concluído, Cancelado) em destaque;
- o controle "Mostrar" virou "Situação: Todos | Em andamento | Suspensos | Concluídos | Cancelados".

"Todos" segue a regra do `CONTEXT.md`: cancelados só aparecem quando pedidos. Onde este texto diz "situação" para os ícones, leia "etiqueta". A proposta de juntar "Concluídos" e "Cancelados" num só controle continua valendo, agora com "Suspensos" incluído, que faltava.

## Nota geral (heurísticas de Nielsen, 0 a 4)

| # | Heurística | Lista | Cadastros | Principal problema |
|---|---|---|---|---|
| 1 | Situação visível | 3 | 2 | Cadastros: setor aberto não muda o endereço; "Observação" editável sem dizer se salvou |
| 2 | Linguagem do usuário | 3 | 3 | Histórico mostra login cru ("prova.integrante") em vez do nome |
| 3 | Controle e saída | 3 | 2 | Voltar do navegador sai da área inteira ao abrir um setor |
| 4 | Consistência | 2 | 2 | Criar processo é janela; criar setor é formulário no meio da página; nomes ora link azul, ora texto |
| 5 | Prevenção de erro | 3 | 2 | "Excluir" com o mesmo peso de "Desativar", solto sob uma tabela |
| 6 | Reconhecer em vez de lembrar | 3 | 2 | Bolinhas pretas na grade de cores sem legenda visível |
| 7 | Eficiência | 3 | 2 | Sem busca nem ordenação em 30+ setores |
| 8 | Estética e foco | 2 | 2 | Colunas sem informação; arco-íris pastel; faixas e linhas demais na árvore |
| 9 | Recuperação de erro | 2 | 3 | Lista vazia fala em "filtros" quando só se escolheu "Concluídos" |
| 10 | Ajuda | 2 | 2 | Nada explica marcadores e convenções |
| | **Total** | **26/40** | **22/40** | **Aceitável** nos dois |

## Lista: o que funciona

- Tabela densa e fácil de varrer; ordenação por coluna.
- O menu da seta ▾ de cada coluna ordena e filtra pelo valor, como numa planilha. Para quem vem do Excel, é natural.
- Barrinha de progresso da etapa por linha; "Mostrar cancelados (3)" no pé.
- O agrupamento em árvore (setor → macroprocesso → processo) responde bem "o que cada setor tem".

## Lista sem agrupamento

1. **Controles no padrão antigo.** "Agrupar por" e "Mostrar" são botões soltos sem contêiner. A opção escolhida fica em azul cheio, igual ao "Cadastrar processo": são três azuis cheios na mesma faixa. Aplicar a regra da proposta 6: escolhido em azul-claro, azul cheio só na ação principal, tudo numa faixa branca própria.
2. **Controles relacionados separados.** "Mostrar: Todos | Concluídos" fica no topo e "Mostrar cancelados (3)" lá no pé da tabela. São a mesma pergunta ("quais processos aparecem?"). Proposta: "Mostrar: Em andamento | Concluídos | Cancelados | Todos" num lugar só.
3. **O cabeçalho rola junto.** Ao descer a lista, somem os títulos das colunas e os controles. Com agrupamento a lista fica longa, e o usuário perde a referência de qual coluna é qual. Cabeçalho da tabela e faixa de controles devem ficar fixos.
4. **Colunas que não informam:**
   - **Situação:** "EM ANDAMENTO" em todas as linhas.
   - **Macroprocesso:** "A definir" em quase todas.
   - **Tipo:** "Processo" em quase todas, e "A classificar" quebra em duas linhas.

   Mostrar só as exceções, ou esconder a coluna quando todos os valores são iguais.
5. **Altura das linhas irregular.** "Responsável" quebra o nome em duas linhas, e nomes longos de processo também. Usar o avatar com iniciais e o nome numa linha só, cortado com reticências.
6. **Nomes em azul de link.** A coluna principal inteira fica azul. Basta o nome em texto escuro, com sublinhado ao passar o mouse.
7. **Selos de setor no padrão pastel antigo.** Trocar pelos selos da proposta (cor viva, texto branco).
8. **Texto da etapa pequeno demais.** "Relatório e modelagem técnica · 3 de 8" em 11px, cinza, sobre a barrinha. Usar a trilha de 8 tracinhos da proposta com o nome da etapa em 12–13px.

## Lista agrupada (por macroprocesso e por setor)

1. **Marcador solto nos processos.** Em várias linhas, o marcador "•" fica sozinho numa linha e o nome do processo desce para a linha de baixo, com um recuo diferente do das linhas vizinhas. Acontece com nomes longos ("Atendimento e repasse...", "Aprimoramento da Governança..."). É um defeito visual, não uma escolha: marcador e nome devem ficar na mesma linha, com o nome quebrando ao lado do marcador.
2. **Coluna repetindo o grupo.** Agrupado por setor, cada linha ainda mostra o selo do setor; agrupado por macroprocesso, a coluna "Macroprocesso" repete o nome do grupo. A coluna do agrupamento deve sumir enquanto ele está ativo.
3. **Nível vazio no agrupamento por setor.** Quase todo setor tem um único subgrupo, "A definir", que ocupa uma linha inteira sem dizer nada. Duas saídas:
   - pular o nível do macroprocesso quando o setor tem um subgrupo só;
   - mostrar o macroprocesso como coluna, e não como nível da árvore.
4. **Peso visual dos grupos.**
   - Cada grupo tem faixa lilás de largura total, uma linha azul de 2px em cima e, logo abaixo, outra faixa para o subgrupo. Em sequência, a tela vira listras.
   - A linha azul também conflita com a "linha acesa" do DESIGN.md, que deveria marcar só o que está em foco.

   Proposta: grupo em fundo cinza bem claro, com selo e nome em negrito; subgrupo só com recuo e texto, sem fundo.
5. **Nome do setor em azul só neste agrupamento.** Não fica claro se é clicável nem para onde leva. Se abre o setor, dizer com um ícone de seta; se não, texto escuro.
6. **"Abrir todos" sozinho numa segunda linha.** Ele aparece à direita, abaixo de "Cadastrar processo", e cria uma linha extra de controles. Deve ficar junto do "Agrupar por", como "Abrir todos / Fechar todos".
7. **Mesma posição de rolagem ao trocar o agrupamento.** Ao trocar, a página fica no meio da lista nova. Ela deveria voltar ao topo.

## Lista vazia

"Mostrar: Concluídos" sem nenhum concluído mostra "Nenhum processo com estes filtros." e o botão "Limpar filtros". O usuário não usou filtro, só escolheu o que mostrar. Proposta: "Nenhum processo concluído ainda.", com o botão "Mostrar todos". A frase deve ser centralizada e com o mesmo bloco tracejado do quadro vazio, para não parecer erro.

## Setores (lista)

1. **Arco-íris na coluna Sigla:** 30 selos pastel, no padrão que você reprovou. Usar os selos da proposta.
2. **Coluna "Situação" vazia em todas as linhas.** Como "Mostrar inativos" já separa os inativos, a coluna só precisa aparecer quando eles estão visíveis, ou virar um selo "Inativo" ao lado do nome.
3. **Sem busca e sem ordenação** numa lista de 30+ setores. Uma busca por sigla ou nome no topo resolve.
4. **Linha clicável sem sinal.** Na lista de macroprocessos o nome é link azul; na de setores, nada indica que a linha abre. As duas listas devem seguir o mesmo padrão: linha inteira clicável, com destaque ao passar o mouse.
5. **Sem título de página.** As abas Setores/Macroprocessos/Histórico têm estilo diferente das abas da Administração, que ainda repetem o nome da aba num título grande. Escolher um padrão só.

## Setor aberto

1. **Sem endereço próprio.** Ao abrir um setor, o endereço continua `#/setores`.
   - Recarregar a página ou usar "voltar" do navegador perde o lugar.
   - Não dá para mandar o link de um setor para alguém.
   - O processo, ao contrário, tem endereço próprio.
2. **Faixa colorida de largura total** com a sigla no topo, e logo abaixo o título "Setor CED" repetindo a sigla. A faixa é decoração; o selo ao lado do título basta.
3. **Formulário estreito e tabelas largas.** Os campos ocupam ~350px à esquerda e as tabelas abaixo ocupam a largura toda. Sobra um vazio grande à direita e o alinhamento fica quebrado. Proposta: dados do setor em duas colunas (Nome e Sigla lado a lado; Observações embaixo), com a mesma largura das tabelas.
4. **Grade de cores:**
   - As bolinhas pretas no canto querem dizer "cor já usada por outro setor", mas isso só está no rótulo para leitor de tela.
   - Mostrar a sigla de quem usa ao passar o mouse e uma legenda curta ("• já usada").
   - Se a paleta mudar para os selos da proposta, a grade fica menor (8 a 10 cores).
5. **Botões no lugar errado:**
   - "Salvar" e "Voltar à lista" ficam no meio da página, entre o formulário e as tabelas.
   - "Desativar" e "Excluir" ficam sob a tabela de macroprocessos e parecem agir sobre ela.
   - Proposta: "Voltar" como seta junto do título; "Salvar" ao lado; "Desativar" e "Excluir" num menu "···" no cabeçalho, com "Excluir" em vermelho e pedindo confirmação.
6. **"Processos do setor"** é uma boa adição. Deve usar exatamente a mesma tabela da Lista, para não haver dois desenhos de tabela de processos.

## Novo setor

1. **Formulário aberto no meio da página**, empurrando a lista para baixo, enquanto "Novo processo" abre numa janela. A mesma ação ("criar") tem duas formas. Escolher uma: janela, como o processo, que é o que recomendo para cadastros curtos.
2. **Sem escolha de cor na criação.** A cor só aparece ao editar. Quem cria o setor deveria escolher a cor ali, ou o sistema sugerir a próxima livre.
3. **Campos obrigatórios não marcados.** Nome e Sigla são obrigatórios? Marcar com "obrigatório" ou asterisco.

## Macroprocessos (lista e aberto)

1. **Colunas vazias:** "Código" vazio ("—") em quase todas as linhas e "Situação" vazia. Mesma recomendação dos setores.
2. **Título longo repetido.** O macroprocesso aberto repete o nome inteiro, em negrito e em duas linhas, como título, e de novo no campo "Nome". Título curto: "Macroprocesso", com o nome só no campo, ou o nome no título e o campo sem rótulo duplicado.
3. **"Observação" editável dentro da tabela de setores envolvidos, sem botão nem aviso de salvo.** Não fica claro se salva sozinha, se precisa do "Salvar" de cima ou se se perde. Mostrar "Salvo" depois de digitar, ou um botão por linha.
4. **"Desativar" e "Excluir" soltos no pé.** Mesmo problema e mesma proposta do setor aberto.

## Histórico

1. **Conteúdo completo e útil**, com data em fonte mono e o que mudou antes e depois.
2. **Login cru:** "prova.integrante" aparece em vez do nome da pessoa.
3. **Fica dentro de "Setores", mas registra também processos** ("Criou NAS — Teste" é um processo). O lugar e o filtro "Item: Todos os itens" não dizem isso. Renomear o filtro para "Tipo: Processos | Setores | Macroprocessos" ajuda.
4. **"Antes/Depois" despeja todos os campos.** Destacar em negrito só o campo que mudou.

## Prioridades

1. **[P1] Árvore da Lista:** corrigir o marcador solto, tirar a coluna que repete o grupo, pular o nível de subgrupo único e aliviar as faixas.
2. **[P1] Controles da Lista no padrão da proposta 6:** faixa própria, selecionado em azul-claro, "Mostrar" num lugar só (com cancelados), "Abrir todos" junto do agrupamento, cabeçalho fixo.
3. **[P1] Setor e macroprocesso abertos:** endereço próprio, botões no cabeçalho, "Excluir" separado e em vermelho.
4. **[P2] Colunas sem informação** na Lista e nos cadastros (Situação, Código, Tipo, Macroprocesso "A definir").
5. **[P2] Selos de setor da proposta** na Lista, nos cadastros e na grade de cores.
6. **[P2] Criar sempre do mesmo jeito** (janela) e com cor na criação do setor.
7. **[P3] Histórico:** nome em vez do login, filtro por tipo, destaque do campo alterado.
