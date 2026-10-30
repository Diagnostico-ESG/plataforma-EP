# Desvios de lista-por-setor

## 2026-10-30 — /polir

**Auditoria (`/impeccable audit`).** Detector sem achados novos (0 anti-padrões). Verificação visual em página temporária local com os módulos falsos do projeto (apagada depois), em 800 px de largura:

- Barra da Lista sem a Busca; "Agrupar por" com Nenhum, Macroprocesso e Setor legíveis, o escolhido em azul cheio. Critério 10 da spec atendido.
- Árvore por Setor: setor (faixa azul clara, selo e borda azul em cima), macroprocesso (faixa cinza recuada) e processo se distinguem; o subprocesso de outro setor vem recuado sob o pai, com o selo do setor dele.
- Árvore por Macroprocesso: mesma aparência de antes (faixas, recuos e selos iguais), apesar da troca das classes para `grupo-raiz` e `grupo-filho`.

**Corrigido:** nada; não havia achado a corrigir, então o `/impeccable polish` não aplicou mudança de código.

**Deixado de fora, com o motivo:**
- Aviso do detector em `Quadro.css` linha 262 (`border-radius: 1px` fora da escala do DESIGN.md): já existia antes desta funcionalidade e não é da Lista.
- Celular (375 px): não verificado; o produto é de uso em desktop e o layout para celular é opcional (PRODUCT.md).
- Teclado e leitor de tela: coberto só pelos testes de tela (nomes acessíveis, `aria-expanded`, `aria-pressed`); não conferi o anel de foco no navegador.
