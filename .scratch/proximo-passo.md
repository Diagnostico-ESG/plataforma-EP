# Próximo passo (2026-11-13)

**Feito:** `/executar-complexo` de documentos-versoes, seção "Relatório numerado com R" (ADR 0047), junta à `main` (91b2dd0); spec com `Implementado em 2026-11-13`. Plano em `.scratch/documentos-versoes/plano-relatorio-com-r.md`. Migração `20261113161937_relatorio_com_r` aplicada no banco de desenvolvimento ("Testes de banco" verde, 65 de 65). Função `arquivos-no-drive` publicada no desenvolvimento (recusa sem login conferida). A tela mostra "Relatório R2", e a aba Importação ganhou a seção "3. Relatórios com R".

**Não conferido ainda:** a ponta a ponta com o Drive no desenvolvimento (relatório novo saindo com `_Relatório R2.docx`, o botão renomeando de verdade e o histórico "Renomeou o arquivo … para …", critérios 5, 7 e 8), que o usuário pode fazer entrando no site de desenvolvimento como Administrador; e o critério 14 (`[visual]`), que fica para o `/polir`.

**Próximo:** `/polir` no **Sonnet** (a mudança mexeu na tela). Depois `/ship` e os roteiros de produção, nesta ordem: migração, função `arquivos-no-drive`, site e, por último, o botão "Renomear para R" na produção. Não espera o backup, por decisão do usuário.

**Para começar a sessão nova (Sonnet), digite, na ordem:**

```
/stc
```

```
/polir documentos-versoes: seção "Relatório numerado com R" (rótulos com R e a seção "3. Relatórios com R" da aba Importação; critério 14 da spec)
```

**Pendente do usuário:** primeiro backup da produção (criar `BACKUP_SENHA_PRODUCAO`) e teste de restauração; visibilidade do site como Público na Netlify.
