---
version: 1
slug: "src-app-tsx"
primary_target: "src/App.tsx"
related_targets: []
---

Escopo: moldura do sistema (faixa lateral + barra superior) e estado vazio do Quadro de processos; peças básicas (tokens, fontes, ícones SVG próprios, pílulas, avatar, botões, foco). Modo: Operate. Sem dados, sem cartões/colunas/painel (vêm do /planejar de "Processos e etapas").

Direção fixada pelo usuário em `.scratch/identidade-visual.md` (aprovada 2026-10-07); não houve rodada de conceitos.

## Direction contract

THESIS: quadro de etapas com uma única linha acesa azul de 2px que acompanha o foco; recusa o painel administrativo genérico de cartões com sombra e cores espalhadas.
OWN-WORLD: fundo #EDF1F9, folhas brancas com borda #E1E6EF de 1px, azul #3A5AFE só na barra superior, ação principal e linha acesa; Source Sans 3 + IBM Plex Mono para códigos; cantos 6px; cor só em pílulas de situação.
STORY: a equipe abre o sistema, reconhece onde está (faixa lateral, Quadro ativo) e vê o próximo passo (cadastrar o primeiro processo ou importar a planilha).
FIRST VIEWPORT: faixa lateral 56px à esquerda, barra azul no topo com "EP", título "Processos" e alternância Quadro | Lista; área de trabalho em #EDF1F9 com bloco tracejado centralizado contendo a mensagem de vazio e o botão Cadastrar processo.
FORM: direção fixada pelo brief (sem seed; brief-pinned).
FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
