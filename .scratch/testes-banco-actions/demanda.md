# Demanda — testes-banco-actions (2026-10-09)

Classificação do `/demanda`, confirmada pelo usuário em 2026-10-09. Entrada para o `/planejar` no modo curto.

- **O que é:** rodar a bateria de testes de banco (`npm run test:db`, `scripts/testar-banco.mjs`, `supabase/tests/`) pelo GitHub Actions, porque a rede do escritório bloqueia a porta 5432.
- **Objetivo imediato:** destravar o passo 7 do `/ship` de login-perfis (parado desde 2026-10-08).
- **Tipo:** funcionalidade pequena (algo novo, sem regra de negócio, sem tela, sem mudança na estrutura dos dados). Escolhida em vez de ajuste pequeno por ser peça nova que guarda a credencial do banco num serviço externo.
- **Repositório:** https://github.com/Diagnostico-ESG/plataforma-EP (privado, numa organização; enviado em 2026-10-09 com `main` e os marcos; `origin/HEAD` criado).
- **Caminho:** `/planejar` modo curto → `/executar-simples` → (sem `/polir`: não há tela) → `/ship`. Assim que o Actions rodar, retomar o `/ship login-perfis` no passo 7 com o resultado; depois, o `/ship` desta funcionalidade (ou junto, se o `/planejar` concluir que vale).

## Pontos para o `/planejar`

- **Quando roda:** só sob comando (botão no GitHub, `workflow_dispatch`) ou a cada envio. Mais seguro começar pelo botão.
- **Conexão:** a conexão direta do Supabase (`db.<ref>.supabase.co`) é só IPv6, e os computadores do GitHub Actions não usam IPv6; a cadeia guardada em `SUPABASE_DB_URL` deve ser a do pooler (modo sessão). A trava do script (a cadeia precisa citar o ref de desenvolvimento) continua valendo; no pooler o usuário é `postgres.<ref>`, então o ref aparece.
- **Segredo:** a cadeia de conexão vai para os Secrets do repositório, cadastrada pelo usuário pelo site; nunca passa pela conversa.
- **Dado pessoal:** o banco de desenvolvimento tem contas reais de quem entrou com o Google. Os testes desfazem tudo ao terminar, mas o segredo dá acesso ao banco. Registrar na spec.
- **Handoff de 2026-10-08:** dizia "rodar `npm run test:db` numa rede liberada"; o caminho agora é este. Valem os arquivos.
