# Próximo passo (2026-11-11)

**Feito:**
- Duas revisões publicadas na produção (banco e site, marco `marco/2026-11-11-publicacao`).
- Carga real feita pelo usuário na produção (planilha e pasta). Backup e teste de restauração adiados por decisão do usuário (backlog).

**Demanda confirmada pelo `/demanda` (2026-11-11):** o relatório passa a ser numerado com R em vez de V ("Relatório R2 (da V1P)"), **só a troca da letra**, sem relatório piloto (o R1P foi descartado pelo usuário). Tipo: mudança em funcionalidade existente (documentos-versoes, regra do ADR 0026), no modo completo do `/planejar`, porque a letra também está no banco (a função `private.rotulo_do_relatorio`, que monta o texto do histórico) e na Edge Function `arquivos-no-drive` (nome do arquivo no Drive, `_Relatório V3`, e a conferência desse nome no registro). Pede uma migração e uma nova publicação da função, as duas também na produção.

Decisões para a sabatina:
- Os arquivos que já estão no Drive com "Relatório V2" no nome (inclusive os da carga real): renomear para R ou só os novos saem com R.
- O histórico já gravado guarda "Relatório V2" como texto e não se altera: confirmar que fica assim.
- Lugares da tela com a letra: verso, lista de versões, Agora, ação principal da Revisão do relatório, frases e opções da revisão, histórico.

**Para começar a sessão nova (Opus), digite, na ordem:**

```
/stc
```

```
/planejar documentos-versoes: o relatório passa a ser numerado com R em vez de V ("Relatório R2 (da V1P)"), só a troca da letra, sem relatório piloto; a letra está também no banco (private.rotulo_do_relatorio) e na Edge Function arquivos-no-drive (nome no Drive); decidir o que acontece com os arquivos já no Drive com "Relatório V" no nome e com o histórico já gravado
```

**Pendente do usuário:** primeiro backup da produção (criar `BACKUP_SENHA_PRODUCAO`) e teste de restauração; visibilidade do site como Público na Netlify.
