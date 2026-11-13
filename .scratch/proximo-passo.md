# Próximo passo (2026-11-13)

**Feito:** `/planejar` de documentos-versoes no modo completo (sabatina, ADR 0047, `CONTEXT.md`, spec). O relatório passa a ser numerado com R ("Relatório R2 (da V7)"), e um botão do Administrador na aba Importação ("3. Relatórios com R") renomeia para R os relatórios numerados que já estão no Drive com V. Seção "Relatório numerado com R" no topo de `.scratch/documentos-versoes/spec.md` (histórias 168 a 179, critérios 1 a 14); entrega única, sem tickets. Specs de documentos-versoes, revisoes-aprovacao e importacao-dados-atuais marcadas "Em revisão desde 2026-11-13".

**Próximo:** `/executar-complexo` no **Sonnet**, com a seção como único ticket (migração, função do servidor, tela e botão, nessa ordem). Depois `/polir`, `/ship` e os roteiros de produção (migração, função `arquivos-no-drive`, site e, por último, o botão na produção; sem esperar o backup, por decisão do usuário).

**Para começar a sessão nova (Sonnet), digite, na ordem:**

```
/stc
```

```
/executar-complexo documentos-versoes: seção "Relatório numerado com R" (mudança de 2026-11-13) de .scratch/documentos-versoes/spec.md, como único ticket (ADR 0047)
```

**Pendente do usuário:** primeiro backup da produção (criar `BACKUP_SENHA_PRODUCAO`) e teste de restauração; visibilidade do site como Público na Netlify.
