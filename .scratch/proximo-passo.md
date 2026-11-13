# Próximo passo (2026-11-13)

**Feito:** `/executar-complexo` e `/polir` de documentos-versoes, seção "Relatório numerado com R" (ADR 0047), na `main`. Spec com `Implementado em 2026-11-13`. Polimento registrado em `.scratch/documentos-versoes/desvios.md` (entrada de 2026-11-13): auditoria 19/20, critério 14 conferido numa vitrine local temporária, uma correção de marcação e o foco do teclado na aba Importação levado ao backlog. Migração `20261113161937_relatorio_com_r` aplicada no banco de desenvolvimento; função `arquivos-no-drive` publicada no desenvolvimento.

**Não conferido ainda:** a ponta a ponta com o Drive no desenvolvimento (relatório novo com `_Relatório R2.docx`, o botão renomeando de verdade e o histórico "Renomeou o arquivo … para …", critérios 5, 7 e 8), que o usuário pode fazer entrando no site de desenvolvimento como Administrador.

**Próximo:** `/ship` no **Sonnet** (com Opus na revisão de segurança para produção). As specs em revisão desde 2026-11-13 são documentos-versoes, revisoes-aprovacao e importacao-dados-atuais. Depois do `/ship`, os roteiros de produção, nesta ordem: migração, função `arquivos-no-drive`, site e, por último, o botão "Renomear para R" na produção. Não espera o backup, por decisão do usuário.

**Para começar a sessão nova (Sonnet), digite, na ordem:**

```
/stc
```

```
/ship documentos-versoes: seção "Relatório numerado com R" (ADR 0047), com revisoes-aprovacao e importacao-dados-atuais em revisão desde 2026-11-13
```

**Pendente do usuário:** primeiro backup da produção (criar `BACKUP_SENHA_PRODUCAO`) e teste de restauração; visibilidade do site como Público na Netlify.
