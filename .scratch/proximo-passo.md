# Próximo passo (2026-11-10)

**Feito:**
- `importacao-dados-atuais` entregue em 2026-11-10 (commit 005cea9, marco `marco/2026-11-10-entrega-importacao-dados-atuais`), com ressalva: o `[visual]` da segunda entrega foi conferido só por medida no navegador.
- O Checklist do cartão passou para a v1.5 por decisão do usuário em 2026-11-10 (antes do `/planejar`; registrado no `projeto.md` e no `backlog.md`).
- Com isso, todas as funcionalidades da lista da v1 estão entregues.

**Próximo, a seu pedido: levar à produção o que falta para a carga real**, pelos roteiros de `.claude/regras/producao.md` (Sonnet), nesta ordem:
1. Backup da produção (criar `BACKUP_SENHA_PRODUCAO`).
2. Publicar no banco de produção as migrações `20261106230000_importado_concluido_no_quadro` e `20261110000447_importar_versao`, e a função `arquivos-no-drive`.
3. Publicar o site.

Depois disso, a carga real é sua, pela tela. Antes, você pode limpar o banco de desenvolvimento (`.scratch/limpar-desenvolvimento.sql`). Para a equipe usar o site, deixe a visibilidade como Público na Netlify.

**Demandas fora do plano** entram pelo `/demanda` (Opus para classificar). No backlog estão:
- o teste de banco 22 reprovado na `main`;
- confirmar a versão histórica importada sem etapa;
- as melhorias que a revisão deixou de fora;
- as ferramentas de desenvolvimento com vulnerabilidade;
- a branch remota `importacao-dados-atuais` a apagar (comando seu).

**Para começar a sessão nova (Sonnet), digite, na ordem:**

```
/stc
```

```
Publique na produção, pelos roteiros de .claude/regras/producao.md: o backup, as migrações 20261106230000_importado_concluido_no_quadro e 20261110000447_importar_versao, a função arquivos-no-drive e o site.
```
