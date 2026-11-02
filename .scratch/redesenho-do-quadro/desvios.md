# Desvios de redesenho-do-quadro

## 2026-11-02 — /polir (tickets 01 a 05)

**Auditoria (`/impeccable audit`):** o detector rodou nos 48 arquivos de tela e estilo que o redesenho mexeu e achou 0 problemas, mais 1 aviso. A miniatura do verso foi vista na vitrine local (módulos falsos) a 1366×768.

**Corrigido:**
- [P2, acessibilidade] Texto "Sem imagem (.png) nesta versão" e "Não foi possível carregar a imagem." herdavam o cinza do ícone (`--icone-inativo`), sem contraste de texto sobre o fundo do quadro. Passaram ao `--texto-2` (`VersaoEmDestaque.css`).
- [P3, consistência] A data da etapa na trilha usava `font-size: 10px`, fora da escala de tipos do `DESIGN.md`; passou a `--tam-selo` (11px). Trilha conferida na vitrine: continua cabendo em uma linha (`Etapas.css`).
- [P3, clareza] O botão da miniatura ganhou a dica "Abrir o .png inteiro" e o cursor de mão (era lupa, mas o clique abre uma aba).

**Deixado de fora:**
- Imagem corrompida que o navegador não consegue decodificar deixa o quadro vazio em vez de mostrar o aviso de erro. O servidor só entrega o .png enviado pelo EP, e o caso não está nos critérios; trate se aparecer.
- Imagem real não vista: a vitrine devolve texto no lugar do .png, então só o texto alternativo apareceu. O visual com a imagem de verdade, o tamanho de 11rem × 8rem para um fluxograma largo e o login real ficam como ressalva para o `/ship`.
- Celular: o verso é janela fixa de 880 × 740, uso interno em desktop (PRODUCT.md); responsivo não foi tratado.
