# Próximo passo (2026-11-10)

**Feito:**
- `importacao-dados-atuais` foi entregue em 2026-11-10 (commit 005cea9). Todas as funcionalidades da lista da v1 estão entregues. As migrações da importação foram aplicadas na produção, e a função `arquivos-no-drive` foi publicada de novo (registro em `supabase/AMBIENTES.md`).
- `/planejar revisoes-aprovacao` terminou (Duas revisões): a Revisão interna passa a se chamar Revisão do fluxograma, e a Revisão do relatório entra logo depois dela. Os registros estão em:
  - a seção "Duas revisões" de `.scratch/revisoes-aprovacao/spec.md`, com as cinco decisões novas confirmadas;
  - o ADR 0046 e o `CONTEXT.md`;
  - as notas nas specs de documentos-versoes, processos-etapas e importacao-dados-atuais;
  - o ticket único `.scratch/revisoes-aprovacao/issues/07-duas-revisoes.md`;
  - o marco `marco/2026-11-10-inicio-revisoes-aprovacao`.

**Próximo: executar o ticket 07** com o `/executar-complexo` (Sonnet). São duas migrações, testes de banco, tipos e tela, e as partes dependem umas das outras. Depois vêm o `/polir` e o `/ship`.

**Ainda pendente, a seu pedido:** publicar o site pelo roteiro "Publicar o site" de `.claude/regras/producao.md` (Sonnet). O site no ar é o do commit `0451a0e` e ainda não tem a seção 2 da Importação. Você pode publicar agora ou esperar o ticket 07 para publicar tudo de uma vez. Com a migração nova, a publicação do banco vem antes do site.

**Depois, por sua conta:**
- A carga real pela tela: primeiro a planilha, depois a pasta.
- Deixar a visibilidade do site como Público na Netlify.
- Com dados na produção, criar `BACKUP_SENHA_PRODUCAO` e fazer o primeiro backup.

**Para começar a sessão nova (Sonnet), digite, na ordem:**

```
/stc
```

```
/executar-complexo .scratch/revisoes-aprovacao/issues/07-duas-revisoes.md
```
