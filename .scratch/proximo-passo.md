# Próximo passo (2026-11-05)

**Feito:** `importacao-dados-atuais`, ticket 01 (cadastros e etapas pela planilha): teste de banco 74 e migração `20261106015148_importar_processo` (aplicada no desenvolvimento, ainda NÃO na produção), leitura do .csv, contrato `importacao`, aba Administração → Importação e testes pela tela.

**Próximo:** `/executar-complexo` no ticket 02 (arquivos das versões da pasta). Modelo: Sonnet. Ele começa por registrar o desenho da pasta DOCUMENTOS MAPEAMENTO em `amostra/` (subpastas e padrão de nome, sem nomes reais); depende de você me passar esse desenho.

**Antes da carga real (continua valendo):** publicar a migração `importar_processo` na produção pelo roteiro do `/ship`; backup da produção (criar `BACKUP_SENHA_PRODUCAO`); a carga real é sua, pela tela. Depois dos dois tickets: `/polir` (mexeu na interface) e `/ship`.

**Produção (continua valendo):** Netlify → Público quando a equipe for usar; autorizar os usuários. Abertos: `planilhas-dos-dashboards` e cofre; `.env` no `.gitignore`; decisões de LGPD.
