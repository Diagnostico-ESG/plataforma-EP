# Desvios — caixas de seleção

Entradas só se acrescentam; nunca se editam as antigas.

## 2026-10-27 — /polir

Escopo: `src/styles/caixas.css`, `OpcaoDaCaixa`, Avatar decorativo e as telas que usam as caixas. Auditoria do Impeccable (detector sem apontamentos; medição no Chrome 152, na vitrine local) e polimento. Nota da auditoria: 17/20 (Bom). Acessibilidade 3, desempenho 4, responsivo 3 (uso em desktop), temas 4, integridade 3.

**Achados corrigidos:**
- O filtro Responsável crescia de 29 para 30px ao escolher uma pessoa (Avatar de 20px na caixa fechada), empurrando a fileira de filtros. `.filtro-seletor` e `.busca-campo` ganharam `min-height: 30px` (`Quadro.css`); medido depois: os cinco filtros com 30px.
- O respiro da linha acesa da opção repetia `2px solid` em vez do token: agora `border-left: var(--linha-acesa)` com a cor transparente (`caixas.css`); medido: 2px azul na opção marcada.

**Deixados de fora, com o motivo:**
- A barra azul de 2px à esquerda da opção marcada e com foco (a "linha acesa") é decisão da spec e da identidade (`--linha-acesa`), mesmo havendo na lista de proibições do Impeccable o `border-left` colorido; o menu vizinho (`MenuDeAcoes`) usa só fundo e contorno. Mantida por decisão da spec.
- A caixa fechada copia a opção com o `<selectedcontent>`, sem o tratamento de erro do React: foto do responsável que falha aparece sem imagem nessa cópia (as iniciais só entram na lista aberta). Raro (foto da conta Google); aceito.
- "Escolha o macroprocesso" (sem marca) e um macroprocesso escolhido (com quadradinho de 10px) alinham o texto de forma diferente na caixa fechada. Cosmético; sem ajuste para não inventar marca falsa no texto de ajuda.
- Filtros com 30px e botões do lado com 32px: já era assim antes da funcionalidade; não mexido.
- `option:focus` e `:hover` usam o mesmo fundo; o que distingue a opção marcada é a linha acesa, não o fundo. Intencional.

**Não conferido (para o usuário):** imagem da lista aberta (a captura do painel a fecha); contraste forçado do Windows; Firefox/Safari; verso do cartão no Chrome (Etiqueta e "Trocar" com Esc: a vitrine local não abre o verso). Os critérios `[visual]` da spec seguem presumidos nesses pontos.

## 2026-10-27 — /ship

Ponto de partida da revisão: marco `marco/2026-10-27-inicio-caixas-de-selecao` (`786ffdf`). Passo 0: todas as funcionalidades anteriores têm `Entregue em`, sem `Em revisão desde`.

**Achados corrigidos:**
- `/code-review` (padrões): a montagem de `pessoa: { nome, fotoUrl }` aparecia à mão em 3 lugares (`agoraDoProcesso.ts` duas vezes, `filtrosDosProcessos.ts`); regra do `CLAUDE.md` de lógica repetida. Agora há `pessoaDaOpcao` (`src/processos/pessoaDaOpcao.ts`), com teste, e a linha longa de `responsavelForaDaLista` ficou curta.
- `/code-review` (spec): a frase da spec "foto que falha cai nas iniciais" não vale na caixa fechada (a cópia do `<selectedcontent>` não tem o `onError` do React). Spec atualizada para dizer o que foi construído; o motivo já estava na entrada do `/polir`.

**Deixados de fora, com o motivo:**
- `console.error` filtrado em `src/configurarTestes.ts` só para o aviso "tag desconhecida" do `<selectedcontent>`, que existe apenas no jsdom (no Chrome o React não avisa; verificado). A spec mandava parar se o React reclamasse; ele não reclama no navegador, então não foi preciso parar. Comentado no próprio arquivo.
- `min-height: 30px` repetido em `.busca-campo` e `.filtro-seletor` (Quadro.css): dois usos, mesma justificativa; sem token novo para uma exceção local.
- `filtrosDosProcessos.ts` importa `corDoMacroprocesso` (cor é apresentação dentro da lógica de filtro): a cor sai da regra do cartão e vai pronta para a caixa; separar seria mais código para o mesmo efeito.
- Tipos `OpcaoDoFiltro` e `OpcaoDeResponsavel` com os mesmos campos: dois tipos de módulos diferentes, sem pressa de unir.
- `select:disabled` com `opacity: 0.5` global: conferido que nenhuma tela dava aparência própria à caixa desabilitada, então não soma com outro apagado.
- Passo 3 (pacotes): `package.json` não mudou e `.scratch/security.md` existe; pulado. Passo 7 (banco): sem migração, teste ou função novos; pulado.
- Passo 4 (segurança do código): revisão de reserva, feita por mim (não rodei o `/security-review`, que só o usuário digita; a entrega já está na `main`). Única leitura nova: `usuarios.foto_url` em `listarResponsaveisPossiveis`, que a política "ativo lê todos" já permitia e que o cartão já mostra (`responsavel_foto_url` na view). Nenhuma entrada de fora nova, nenhuma migração, nenhuma chave secreta no código. Sem achado.
