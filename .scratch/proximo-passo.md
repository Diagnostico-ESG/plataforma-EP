# Próximo passo (2026-11-09)

**Feito:** protocolo atualizado do DevFlow v1.9 para a v3.5 (commits de263e6 e 7438699, marco `marco/2026-11-09-atualizacao-devflow-3-5`). "Ajustes deste Projeto" preservados (só `/situação` → `/stc`). O comando de retomada agora é `/stc`; o pre-commit roda só os testes ligados aos arquivos do commit. Pendências da atualização no `backlog.md` (linha de 2026-11-09).

**Próximo:** ticket 02 da importação (`.scratch/importacao-dados-atuais/issues/02-arquivos-das-versoes-da-pasta.md`) com `/executar-complexo` (Sonnet, sessão nova, começando pelo `/stc`).

**Em outra frente (continua valendo):** antes da carga real: backup da produção (criar `BACKUP_SENHA_PRODUCAO`) e publicar na produção a migração `20261106230000_importado_concluido_no_quadro` (ADR 0045; já aplicada no desenvolvimento) pelo roteiro de produção, a seu pedido. Limpar o banco de desenvolvimento (`.scratch/limpar-desenvolvimento.sql`) e importar a planilha real pela tela. Para a equipe usar o site: visibilidade Público na Netlify. Abertos: `planilhas-dos-dashboards` e cofre; `.env` no `.gitignore`; decisões de LGPD.
