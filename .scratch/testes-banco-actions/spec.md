# testes-banco-actions — spec

Classificação, motivo e caminho: `demanda.md` desta pasta. Decisões da conversa do `/planejar` de 2026-10-09 abaixo.

## Como resolve o problema

A rede do escritório só abre a porta 443, então `npm run test:db` (que conecta ao Postgres pela porta 5432) não roda daqui. Os computadores do GitHub (Actions) não têm esse bloqueio. Esta funcionalidade acrescenta dois arquivos de workflow em `.github/workflows/` que rodam no GitHub o que hoje roda no computador do usuário: a bateria de testes de banco (a mesma `npm run test:db`, sem mudar o script) e, em separado, as verificações de código. O usuário lê o resultado na aba Actions do site. Assim o passo 7 do `/ship` de `login-perfis` ganha o resultado que faltava.

Sem tela, sem regra de negócio, sem mudança na estrutura dos dados.

## O que muda

1. `.github/workflows/testes-banco.yml` — roda `npm ci` e `npm run test:db`.
   - **Disparo:** envio (`push`) para a branch `main` que altere `supabase/**`, `scripts/testar-banco.mjs`, `scripts/relatorio-tap.mjs`, `package.json` ou o próprio arquivo do workflow; **e** botão manual (`workflow_dispatch`).
   - Segredo `SUPABASE_DB_URL` entra como variável de ambiente do passo. O script já lê `SUPABASE_DB_URL` do ambiente e só usa o `.env.banco.local` se ele existir (no GitHub não existe).
   - Uma execução por vez (`concurrency`, sem cancelar a que está rodando), para dois envios seguidos não rodarem testes de banco em paralelo no mesmo banco.
   - Permissões mínimas (`contents: read`).
2. `.github/workflows/verificacao.yml` — roda `npm ci`, `npm run lint`, `npm run typecheck`, `npm test` e `npm run check:circular`. Disparo: envio para `main` e botão manual. Não usa nenhum segredo.
3. Node na versão do computador do usuário (24), fixada nos dois arquivos.

Fora do escopo: cobertura no Actions, build, publicação, banco de produção (o `/ship` tem roteiros próprios), deploy do site.

## Conexão com o banco

- A conexão direta do Supabase (`db.<ref>.supabase.co`) é só IPv6 e o GitHub Actions não usa IPv6. A cadeia guardada em `SUPABASE_DB_URL` deve ser a do **Session pooler** (painel do projeto dev → Connect → Session pooler; usuário `postgres.<ref>`, porta 5432 do endereço do pooler, que é alcançável do GitHub).
- A trava do script (a cadeia precisa conter o ref de desenvolvimento) continua valendo; no pooler o ref aparece no usuário.
- `npm run test:db` no workflow usa o ref de desenvolvimento do próprio `package.json`: o workflow não consegue apontar para produção.

## Segredo e dado pessoal (decisão do usuário, 2026-10-09)

- O usuário cadastra `SUPABASE_DB_URL` em Settings → Secrets and variables → Actions do repositório, pelo site do GitHub. A cadeia nunca passa pela conversa nem entra em arquivo do projeto.
- O banco de desenvolvimento tem contas reais de quem entrou com o Google. Os testes desfazem tudo ao terminar, mas o segredo dá acesso ao banco. **Risco aceito pelo usuário:** quem administra a organização no GitHub pode rodar o workflow e, na prática, alcançar o banco dev. Mitigação: repositório privado; se o risco passar a incomodar, trocar a senha do banco no painel mata a cadeia antiga.
- Os logs do Actions mostram só nomes de testes e contagens (o script nunca imprime a cadeia). Falha de conexão pode citar o endereço do servidor: se isso aparecer, avisar e não copiar o valor.

## Critérios de pronto

- [ ] Os dois arquivos existem, com o disparo e as permissões acima, e o YAML é válido (conferido localmente).
- [ ] Depois de eu cadastrar o segredo e enviar o código: o botão "Run workflow" de "Testes de banco" roda, e a execução termina verde com os 10 arquivos de teste (`00` a `09`) passando. Verificado pelo usuário na aba Actions (ou pela saída que ele colar).
- [ ] "Verificação" termina verde no mesmo envio.
- [ ] Um envio que só altera `src/` não dispara "Testes de banco" (confere o filtro).
- [ ] Nenhuma cadeia de conexão em arquivo, log ou conversa.
- [ ] `[visual]` — nenhum.

Sem testes automatizados próprios: o "teste" é a execução real no GitHub (as duas primeiras caixas acima). Arquivo YAML não tem função de lógica a cobrir.

## Passos do usuário (fora da sessão)

1. O repositório já existe (`Diagnostico-ESG/plataforma-EP`).
2. No painel do Supabase (projeto dev): Connect → Session pooler → copiar a cadeia (trocando a senha pela real).
3. No GitHub: Settings → Secrets and variables → Actions → New repository secret → nome `SUPABASE_DB_URL`.
4. Enviar o código (`git push`) e apertar "Run workflow" em "Testes de banco".
