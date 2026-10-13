# Desvios — cadastros-basicos

Só entradas novas, datadas.

## 2026-10-13 — /polir dos tickets 01 a 05

Auditoria do Impeccable (17/20) sobre `src/components/cadastros/`; o detector automático não achou nada. Conferência visual na tela real não feita (login do Google barra a sessão): fica para o usuário.

**Corrigido**
- **Campos de formulário sem estilo (P2):** `input`, `select` e `textarea` dos cadastros usavam o visual padrão do navegador. Ganharam o desenho dos campos da Administração (32px, borda de token) em `Cadastros.css`, restrito a `.cadastros`, sem mexer nas outras telas.
- **Estados sem dados sem estilo (P2):** `.cadastros-vazio` não existia no CSS; agora usa o texto secundário, como o aviso do histórico.
- **"Carregando…" sem aviso a leitor de tela (P3):** `role="status"` em `SetorAberto`, `MacroprocessoAberto` e `AreaDeHistorico`.

**Deixado de fora**
- **Tabelas sem rolagem em tela estreita (P3):** o produto é para desktop (PRODUCT.md); celular é opcional.
- **Alvos de toque de 32px (P3):** é o padrão do projeto todo.
- **Classes `historico-*` e `linha-fantasma` vindas de `Administracao.css` (P3):** acoplamento comentado no código; mover para um CSS compartilhado é refatoração, fora do polimento.
