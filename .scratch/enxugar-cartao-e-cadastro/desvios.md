# Desvios — enxugar-cartao-e-cadastro

## 2026-10-29 — `/polir` (audit + polish)

Escopo: os 28 arquivos `.tsx`/`.css` alterados desde o marco `marco/2026-10-29-inicio-enxugar-cartao-e-cadastro`.

**Audit (leitura de código + detector do Impeccable):** detector com 0 problemas. Sem achados P0 nem P1. Foco de teclado global (`index.css`), nome acessível do botão do responsável, ícones de arquivo decorativos e contraste de "Escolher responsável" (`--texto-2` sobre branco, cerca de 5,9:1) conferidos.

**Corrigido**
- [P3] Estado desabilitado: o nome do responsável e "Escolher responsável" mantinham o cursor de clique enquanto a gravação está em andamento. `Agora.css` ganhou `cursor: default` no `:disabled`.

**Deixado de fora**
- Aviso do detector (`Quadro.css:262`, `border-radius: 1px`): falso positivo; é `calc(var(--canto) - 1px)` da faixa do cartão, anterior a esta funcionalidade.
- O nome do responsável só mostra o sublinhado ao passar o mouse (decisão da spec: "parece texto"). Quem usa só teclado vê o contorno de foco; não mudei.
- Critérios `[visual]` não vistos na tela: exigem o login institucional; o servidor de desenvolvimento não foi aberto. Seguem por conferir com o login real.
