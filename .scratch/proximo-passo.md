# Próximo passo (2026-11-06)

**Feito:** leitura dos nomes da pasta real DOCUMENTOS MAPEAMENTO (autorizada pelo usuário) e desenho com nomes inventados em `.scratch/importacao-dados-atuais/amostra/pasta.md` (commit 241d32f). A pasta segue o padrão `SIGLA_Vn[F|P]_Nome[_Relatório].ext`, mas traz oito casos que a spec não prevê (seção "O que a pasta tem e a spec não prevê").

**Próximo:** `/planejar importacao-dados-atuais` (modo curto; Opus, porque há decisões de regra) para decidir os oito casos e atualizar a spec e o ticket 02. Depois, ticket 02 com `/executar-complexo` (Sonnet).

**Em outra frente (continua valendo):** `/polir` e depois `/ship` da `capa-de-entrada` (Sonnet; variante M implementada em 2026-11-06, commit 7b585ad). Limpar o banco de desenvolvimento (`.scratch/limpar-desenvolvimento.sql`) e importar a planilha real pela tela. Antes da carga real: backup da produção (criar `BACKUP_SENHA_PRODUCAO`), publicar a migração `importar_processo` pelo roteiro do `/ship` e publicar o site de novo (9 commits em `src/` depois da versão no ar). Abertos: `planilhas-dos-dashboards` e cofre; `.env` no `.gitignore`; decisões de LGPD.

