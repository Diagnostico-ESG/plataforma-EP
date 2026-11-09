# Próximo passo (2026-11-09)

**Feito:** protocolo atualizado para o DevFlow v3.5 (commits de263e6 e 7438699, marco `marco/2026-11-09-atualizacao-devflow-3-5`). Demanda nova classificada como funcionalidade nova: **checklist-do-cartao** (item 24 do `projeto.md`). O `/planejar` dela parou antes do marco: o usuário decidiu fechar antes a importação, que está "Em revisão" sem marca de entrega. Perguntas já levantadas para a sabatina no `backlog.md` (linha de 2026-11-09).

**Conferido pelo /stc em 2026-11-09:** os seis últimos commits (atualização v3.5, demanda do checklist e este arquivo) estão na branch `ccr-44fbcae1-g1zm3t` no GitHub, e a `main` do GitHub ainda está em `c7d4696`. Antes do ticket 02, levar esses commits para a `main` (merge da branch), para a sessão nova partir do protocolo v3.5.

**Próximo, nesta ordem:**
1. Ticket 02 da importação (`.scratch/importacao-dados-atuais/issues/02-arquivos-das-versoes-da-pasta.md`) com `/executar-complexo` (Sonnet, sessão nova, começando pelo `/stc`).
2. `/polir` e `/ship` de `importacao-dados-atuais` (Sonnet).
3. `/planejar checklist-do-cartao` (Opus, modo completo).

**Em outra frente (continua valendo):** antes da carga real: backup da produção (criar `BACKUP_SENHA_PRODUCAO`) e publicar na produção a migração `20261106230000_importado_concluido_no_quadro` (ADR 0045; já aplicada no desenvolvimento) pelo roteiro de produção, a seu pedido. Limpar o banco de desenvolvimento (`.scratch/limpar-desenvolvimento.sql`) e importar a planilha real pela tela. Para a equipe usar o site: visibilidade Público na Netlify. Abertos: `planilhas-dos-dashboards` e cofre; `.env` no `.gitignore`; decisões de LGPD; pendências da atualização do DevFlow no `backlog.md`.

**Para começar a sessão nova (Sonnet), digite, na ordem:**

```
/stc
```

```
/executar-complexo .scratch/importacao-dados-atuais/issues/02-arquivos-das-versoes-da-pasta.md
```
