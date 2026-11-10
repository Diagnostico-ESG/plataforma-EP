# Próximo passo (2026-11-09)

**Feito:** ticket 02 de `importacao-dados-atuais` (arquivos das versões da pasta), concluído no commit 8e270ef, já na `main` e no GitHub. A migração `20261110000447_importar_versao` foi aplicada no desenvolvimento. A função `arquivos-no-drive` mudou (marca da importação). Era o último ticket da funcionalidade.

**Função no desenvolvimento:** `arquivos-no-drive` publicada de novo no desenvolvimento em 2026-11-09 (registro em `supabase/AMBIENTES.md`); a seção 2 já pode ser testada lá.

**Próximo, nesta ordem:**
1. `/polir` de `importacao-dados-atuais` (Sonnet, sessão nova, começando pelo `/stc`): o ticket mexeu na tela.
2. `/ship` de `importacao-dados-atuais` (Sonnet).
3. `/planejar checklist-do-cartao` (Opus, modo completo), item 24 do `projeto.md`; perguntas da sabatina no `backlog.md`.

**Em outra frente (continua valendo):** antes da carga real, o backup da produção (criar `BACKUP_SENHA_PRODUCAO`) e a publicação na produção das migrações `20261106230000_importado_concluido_no_quadro` e `20261110000447_importar_versao` e da função `arquivos-no-drive`, pelo roteiro de produção, a seu pedido. Limpar o banco de desenvolvimento (`.scratch/limpar-desenvolvimento.sql`) e importar a planilha e a pasta reais pela tela. Para a equipe usar o site: visibilidade Público na Netlify. Abertos: `planilhas-dos-dashboards` e cofre; `.env` no `.gitignore`; decisões de LGPD; pendências da atualização do DevFlow no `backlog.md`; o teste de banco 22 reprovado na `main` (backlog, `/demanda`); apagar a branch remota `importacao-dados-atuais` (`git push origin --delete importacao-dados-atuais`, comando seu).

**Para começar a sessão nova (Sonnet), digite, na ordem:**

```
/stc
```

```
/polir importacao-dados-atuais
```
