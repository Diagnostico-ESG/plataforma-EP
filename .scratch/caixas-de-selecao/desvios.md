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
