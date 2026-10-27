
## 2026-10-27 — /polir (impeccable audit + polish)

Auditoria sobre os 9 arquivos de interface da funcionalidade (confirmação de arquivos, "⋯" e janela Editar número, avisos): o detector não achou nada; nota 18/20 (acessibilidade 3, desempenho 4, responsivo 3, tema 4, integridade 4). Feita por leitura do código, sem ver a tela (vitrine local desatualizada; a tela só abre com o login).

**Corrigido**
- [P2] Os avisos da janela "Editar número" estavam em 12px, menores que a prévia logo acima. Passaram ao tamanho normal do corpo (`Versoes.css`, `.formulario-de-versao-avisos`).

**Deixado de fora**
- [P3] O aviso usa `role="status"` e o leitor de tela o lê quando o texto muda. Aceitável: a frase só muda quando muda o caso.
- [P3] `[visual]` em 1366×768 da janela com prévia e avisos (e dos demais critérios visuais da funcionalidade) segue presumido, porque a tela só abre com o login real.
