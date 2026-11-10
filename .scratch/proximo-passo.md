# Próximo passo (2026-11-10)

**Feito:**
- `importacao-dados-atuais` foi entregue em 2026-11-10 (commit 005cea9, marco `marco/2026-11-10-entrega-importacao-dados-atuais`).
- O Checklist do cartão passou para a v1.5 por decisão do usuário (está no `projeto.md` e no `backlog.md`). Todas as funcionalidades da lista da v1 estão entregues.
- Na produção, em 2026-11-10:
  - as migrações `20261106230000_importado_concluido_no_quadro` e `20261110000447_importar_versao` foram aplicadas pelo workflow;
  - a função `arquivos-no-drive` foi publicada de novo, e ela recusa quem não está logado;
  - o backup foi dispensado, porque a produção ainda não tem dados.
  - Registro completo em `supabase/AMBIENTES.md`.

**Próximo, a seu pedido: publicar o site** pelo roteiro "Publicar o site" de `.claude/regras/producao.md` (Sonnet). O site no ar é o do commit `0451a0e` e ainda não tem a seção 2 da Importação. As migrações novas não quebram esse site, mas sem o site novo a seção 2 não aparece.

**Depois, por sua conta:**
- A carga real pela tela: primeiro a planilha, depois a pasta. Antes, você pode limpar o banco de desenvolvimento (`.scratch/limpar-desenvolvimento.sql`).
- Para a equipe usar o site, deixar a visibilidade como Público na Netlify.
- Com dados na produção, toda publicação de migração passa a pedir backup antes: criar `BACKUP_SENHA_PRODUCAO` e fazer o primeiro backup pelo roteiro "Backup e restauração".

**Demandas fora do plano** entram pelo `/demanda` (Opus para classificar). No backlog estão:
- o teste de banco 22;
- confirmar que a versão histórica importada fica sem etapa;
- as melhorias que a revisão deixou de fora;
- as ferramentas de desenvolvimento com vulnerabilidade;
- a branch remota `importacao-dados-atuais` a apagar (comando seu).

**Para começar a sessão nova (Sonnet), digite, na ordem:**

```
/stc
```

```
Publique o site na produção, pelo roteiro "Publicar o site" de .claude/regras/producao.md.
```
