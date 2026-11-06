# Próximo passo (2026-11-06)

**Feito:** leitura dos nomes da pasta real DOCUMENTOS MAPEAMENTO (autorizada pelo usuário) e desenho com nomes inventados em `.scratch/importacao-dados-atuais/amostra/pasta.md` (commit 241d32f). A pasta segue o padrão `SIGLA_Vn[F|P]_Nome[_Relatório].ext`, mas traz oito casos que a spec não prevê (seção "O que a pasta tem e a spec não prevê").

**Próximo:** `/ship capa-de-entrada` (Sonnet, sessão nova), escolhido pelo usuário antes do `/planejar` porque login-perfis está "Em revisão desde 2026-11-06". Depois, `/planejar importacao-dados-atuais` no modo completo (Opus): as decisões do usuário sobre a pasta estão em `amostra/pasta.md` ("Decisões do usuário") e mudam regras do CONTEXT.md (V1F e V1 no mesmo processo, relatório numerado na histórica, "Arquivos históricos" que ainda não existe); brainstorming dispensado, segue direto para o `grill-with-docs`. Depois, ticket 02 com `/executar-complexo` (Sonnet).

**Em outra frente (continua valendo):** `/ship` da `capa-de-entrada` (Sonnet; variante M implementada e polida em 2026-11-06). Limpar o banco de desenvolvimento (`.scratch/limpar-desenvolvimento.sql`) e importar a planilha real pela tela. Antes da carga real: backup da produção (criar `BACKUP_SENHA_PRODUCAO`), publicar a migração `importar_processo` pelo roteiro do `/ship` e publicar o site de novo (9 commits em `src/` depois da versão no ar). Abertos: `planilhas-dos-dashboards` e cofre; `.env` no `.gitignore`; decisões de LGPD.

