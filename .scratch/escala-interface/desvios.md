# Desvios — escala da interface

## 2026-10-14 — /polir (audit + polish)

Escopo: ajuste visual de fontes (+2px) e larguras (+15%) em tokens (commit f27476b). Auditoria só no código; a tela não foi aberta (o app exige login no Supabase e não há servidor de visualização configurado).

**Achados corrigidos:** nenhum — não havia o que corrigir.
- Nenhum `font-size` fixo em CSS ou TSX: tudo passa pelos tokens `--tam-*`, então a escala nova chegou a todas as telas.
- Avatar calcula a fonte como 0,42 do diâmetro: acompanha sozinho.
- Larguras em px que sobraram são de uso único e decididas (entrada 360px, quadro vazio 420px) ou de ícones/botões (32/40/48px), sem texto dentro.
- Detector do Impeccable sem apontamentos.

**Deixados de fora:**
- `.botao-icone` de 32px (abaixo de 44px): já existia, passa no mínimo de 24px do WCAG 2.2 AA, uso em desktop.
- Conferência visual com a escala nova (quebra de linha, `Moldura` com reticências na barra de título, faixa lateral de 56px com o "EP" em 18px): fica para o usuário abrir o app e olhar.
- `--largura-coluna-quadro` ainda sem uso em CSS: entra no ticket 04.
