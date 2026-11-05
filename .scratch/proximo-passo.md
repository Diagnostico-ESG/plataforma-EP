# Próximo passo (2026-11-05)

**Onde estamos:** produção (Supabase `plataforma-ep-prod`, ref shiummttjxncahitrjwe) criada e painel conferido (`.scratch/pre-producao.md`). Plano Free com dado real, decisão do usuário. Workflow "Migrar banco de produção" criado (`.github/workflows/migrar-producao.yml`), ainda sem o segredo.

**Faltam, nesta ordem (passo 5 de `.scratch/roteiro-producao.md`):**
1. Usuário cria o segredo `SUPABASE_DB_URL_PRODUCAO` no GitHub (Session pooler da produção, com a senha do banco), sem mostrar o valor na conversa.
2. Disparar o workflow com `modo = listar` e `confirmar = PRODUCAO`; conferir as 78 pendentes.
3. Com aprovação do usuário no momento, disparar com `modo = aplicar`.
4. Rodar a consulta do catálogo na produção (RLS, views, funções, permissões de `anon`).
5. Passos 6 a 10 do roteiro (segredos e funções, login, site na Netlify, backup manual por GitHub Actions + teste de restauração, primeira conferência).

**Abertos:** endereço da Netlify; projeto do Google no login; `.env` no `.gitignore` (backlog); decisões de LGPD.

Comando e modelo: continuar nesta mesma conversa ou `/situação` em sessão Sonnet.
