# Próximo passo (2026-11-06)

**Feito:** `/planejar` (modo curto) e `/executar-simples` do ajuste de `importacao-dados-atuais` (implementado no commit fbb2957; 3793 testes passando). Na seção "Ajuste de 2026-11-06" da spec (`.scratch/importacao-dados-atuais/spec.md`): a Modelagem piloto ou a VII concluídas sem data, ou com data ilegível, usam a data de hoje, com aviso na prévia (a VII vai para Concluídos); a sigla "DAE/CTL" entra como "DAE-CTL". O banco não muda.

**Próximo:** `/polir` (Sonnet) na tela Administração → Importação: mudaram só os textos dos avisos da prévia; pular o `/polir` é decisão do usuário. Depois, `/ship` (Sonnet), que pode ir junto com o da `capa-de-entrada`. Em seguida, limpar o desenvolvimento de novo (o catálogo de etapas fica) e importar do zero.

**Em outra sessão:** `capa-de-entrada` implementada e polida em 2026-11-06 (commit fa51ebe; a spec é o único ticket). Próximo dela: `/ship` (Sonnet). Presumido: as mensagens de recusa e de falha vistas na tela a 1366×768 (detalhe em `.scratch/capa-de-entrada/desvios.md`).

**Depois (continua valendo):** ticket 02 da importação (arquivos das versões; precisa do desenho da pasta DOCUMENTOS MAPEAMENTO, sem nomes reais, em `amostra/`).

**Antes da carga real (continua valendo):** publicar a migração `importar_processo` na produção pelo roteiro do `/ship`; backup da produção (criar `BACKUP_SENHA_PRODUCAO`); a carga real é sua, pela tela. Produção: Netlify → Público quando a equipe for usar; autorizar os usuários. Abertos: `planilhas-dos-dashboards` e cofre; `.env` no `.gitignore`; decisões de LGPD.
