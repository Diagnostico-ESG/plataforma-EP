# Próximo passo (2026-11-06)

**Feito:** decisões da pasta DOCUMENTOS MAPEAMENTO levadas à spec e ao ticket 02 de `importacao-dados-atuais` pelo `/planejar` modo curto (marco `marco/2026-11-06-inicio-importacao-dados-atuais-2`): a pasta manda (V1 a V8 da planilha só na comparação), F histórica e número único por processo, .docx como relatório e .pdf em Outros anexos, letra diferente da do .bpm junta à versão do .bpm, subpasta com linha nas Anotações e relatório final das lacunas. Desenho e decisões em `amostra/pasta.md`.

**Próximo:** ticket 02 da importação (`.scratch/importacao-dados-atuais/issues/02-arquivos-das-versoes-da-pasta.md`) com `/executar-complexo` (Sonnet, sessão nova).

**Em outra frente (continua valendo):** `capa-de-entrada` entregue em 2026-11-06 (commit 6c6ea75, com ressalva do critério visual 7). Para a equipe ver a capa, publicar o site de novo na Netlify (roteiro "Publicar o site" do `/ship`, a seu pedido). Limpar o banco de desenvolvimento (`.scratch/limpar-desenvolvimento.sql`) e importar a planilha real pela tela. Antes da carga real: backup da produção (criar `BACKUP_SENHA_PRODUCAO`), publicar na produção a migração `20261106230000_importado_concluido_no_quadro` (concluídos importados no Quadro, ADR 0045; já aplicada no desenvolvimento em 2026-11-06) pelo roteiro do `/ship` e publicar o site de novo (9 commits em `src/` depois da versão no ar). Abertos: `planilhas-dos-dashboards` e cofre; `.env` no `.gitignore`; decisões de LGPD.

