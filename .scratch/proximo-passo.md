# Próximo passo (2026-11-06)

**Feito:** `/ship` da primeira entrega de `importacao-dados-atuais` (ticket 01 e ajuste de 2026-11-06), entregue com ressalva no commit ec2b9d0, marco `marco/2026-11-06-entrega-importacao-dados-atuais`. A revisão corrigiu três achados (1b2225d); o resto está em `.scratch/backlog.md` (linha de 2026-11-06). A revisão de segurança foi só a de reserva, por decisão do usuário.

**Próximo (seu):** limpar o banco de desenvolvimento de novo (`.scratch/limpar-desenvolvimento.sql`, que preserva o catálogo de etapas) e importar a planilha real do zero pela tela. Para a produção: roteiro "Publicar no banco de produção" do `/ship` (migração `importar_processo`), com backup antes (criar `BACKUP_SENHA_PRODUCAO`), e publicar o site. Depois, ticket 02 da importação com `/executar-complexo` (Sonnet), que precisa do desenho da pasta DOCUMENTOS MAPEAMENTO, sem nomes reais, em `amostra/`.

**Em outra sessão:** `capa-de-entrada` implementada e polida em 2026-11-06 (commit fa51ebe; a spec é o único ticket). Próximo dela: `/ship` (Sonnet). Presumido: as mensagens de recusa e de falha vistas na tela a 1366×768 (detalhe em `.scratch/capa-de-entrada/desvios.md`).

**Depois (continua valendo):** ticket 02 da importação (arquivos das versões; precisa do desenho da pasta DOCUMENTOS MAPEAMENTO, sem nomes reais, em `amostra/`).

**Antes da carga real (continua valendo):** publicar a migração `importar_processo` na produção pelo roteiro do `/ship`; backup da produção (criar `BACKUP_SENHA_PRODUCAO`); a carga real é sua, pela tela. Produção: Netlify → Público quando a equipe for usar; autorizar os usuários. Abertos: `planilhas-dos-dashboards` e cofre; `.env` no `.gitignore`; decisões de LGPD.
