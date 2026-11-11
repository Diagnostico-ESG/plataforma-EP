# Próximo passo (2026-11-11)

**Feito:**
- Banco de produção: as migrações `20261110165927_duas_revisoes_etapas` e `20261110171004_duas_revisoes_registro` foram aplicadas pelo workflow "Migrar banco de produção" (listar: run 43041622577; aplicar: run 43041839624). O backup foi dispensado porque a produção está vazia. Registro em `supabase/AMBIENTES.md`.
- Site: o build do commit `2224eee` foi publicado pelo usuário na Netlify e conferido (entrar, Quadro, sair). Registro em `.scratch/publicacao.md` e marco `marco/2026-11-11-publicacao`.
- Toda a v1 está entregue e no ar.

**Depois, por sua conta, nesta ordem:**
1. Antes da carga real, fazer o backup e o teste de restauração uma vez, com a produção ainda vazia (roteiro "Backup e restauração" de `.claude/regras/producao.md`). Antes, crie o segredo `BACKUP_SENHA_PRODUCAO` no GitHub. O teste de restauração precisa de um terceiro projeto Supabase, temporário: confira se o seu plano permite.
2. A carga real pela tela: primeiro a planilha, depois a pasta.
3. Deixar a visibilidade do site como Público na Netlify.

**Para começar a sessão nova (Sonnet), digite, na ordem:**

```
/stc
```

```
/ship revisoes-aprovacao: rodar o roteiro "Backup e restauração" de .claude/regras/producao.md, com a produção ainda vazia, antes da carga real
```

Qualquer demanda nova (bug, ajuste ou funcionalidade) entra pelo `/demanda`, em sessão Opus.
