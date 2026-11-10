# Próximo passo (2026-11-10)

**Feito:** `importacao-dados-atuais` entregue em 2026-11-10 (commit 005cea9, marco `marco/2026-11-10-entrega-importacao-dados-atuais`), com ressalva: o `[visual]` da segunda entrega foi conferido só por medida no navegador, na vitrine local. O `/ship` achou e corrigiu dois defeitos (o `.pdf` do relatório que não voltava na segunda rodada e os avisos que faltavam na prévia). A revisão de segurança não achou nada, e a auditoria de pacotes não achou nada que vá ao navegador.

**Próximo:** `/planejar checklist-do-cartao` (Opus, modo completo), item 24 do `projeto.md`; perguntas da sabatina no `backlog.md` (linha de 2026-11-09). Demandas fora do plano entram pelo `/demanda` (Opus para classificar).

**Antes da carga real (a seu pedido, pelos roteiros de `.claude/regras/producao.md`):**
- O backup da produção (criar `BACKUP_SENHA_PRODUCAO`).
- A publicação na produção das migrações `20261106230000_importado_concluido_no_quadro` e `20261110000447_importar_versao` e da função `arquivos-no-drive`.
- A publicação do site.
- Depois, limpar o banco de desenvolvimento, se quiser (`.scratch/limpar-desenvolvimento.sql`), e importar a planilha e a pasta reais pela tela. Para a equipe usar o site, a visibilidade Público na Netlify.

**Abertos no backlog:**
- O teste de banco 22 (catálogo do desenvolvimento com uma etapa entre "Revisão interna" e "Validação com o setor").
- Confirmar a versão histórica importada sem etapa (história 49).
- As melhorias deixadas de fora pela revisão.
- As ferramentas de desenvolvimento com vulnerabilidade.
- Apagar a branch remota `importacao-dados-atuais` (comando seu: `git push origin --delete importacao-dados-atuais`).

**Para começar a sessão nova (Opus), digite, na ordem:**

```
/stc
```

```
/planejar checklist-do-cartao
```
