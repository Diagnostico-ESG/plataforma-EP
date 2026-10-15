# Desvios — documentos-versoes

## 2026-10-15 — ticket 01 (ligação com o Drive)

- **`iniciar_envio` recebe `numero` e `historica` da tela.** A spec prevê o número dado pelo banco, mas a tabela `versoes` só nasce no ticket 02. Neste ticket o número vem no pedido (a prova usa 99); o ticket 02 passa a calcular no banco e a ignorar o da tela.
- **`baixar` confere a pasta, não `arquivos_da_versao`.** Só sai arquivo que está numa pasta de processo registrada em `pastas_no_drive` e legível por quem chamou (a RLS dela). O ticket 02 troca pela RLS de `arquivos_da_versao`.
- **Quem chamou é conferido pelo `@supabase/server` (`createSupabaseContext`, `auth: 'user'`), com `verify_jwt = false`.** O plano previa `supabase-js` com `auth.getUser()` e a verificação da plataforma ligada. O modelo gerado hoje pela CLI (`supabase functions new`) e a documentação atual recomendam a conferência dentro da função, pelas chaves do projeto (`SUPABASE_PUBLISHABLE_KEYS`, `SUPABASE_JWKS`). O cliente devolvido usa o login de quem chamou; o `supabaseAdmin` do contexto não é usado.
- **A chave da conta de serviço entra como um segredo só, `EP_DRIVE_CONTA_JSON_BASE64`** (o JSON inteiro do Google em base64), no lugar de e-mail e chave separados. Gravar a chave PEM com quebras de linha pelo PowerShell é frágil; o base64 não tem aspas nem quebras. Os segredos ficaram: `EP_DRIVE_CONTA_JSON_BASE64`, `EP_DRIVE_RAIZ_ID`, `EP_ORIGENS_ACEITAS`.
- **Código compartilhado e arquivo puro de decisão em `supabase/functions/_shared/`** (`nomePadrao.ts`, `decisao.ts`, `drive.ts`), alcançados pelo ESLint (com o limite de 20 linhas por função), pelo `tsc` e pelo Vitest. O ticket 02 importa o nome padrão de lá na prévia do formulário.
- **Os arquivos Deno da função (`supabase/functions/arquivos-no-drive/`) não passam pelo `tsc`**: não há Deno nesta máquina, e os tipos do Deno não entram no projeto da interface. O ESLint os lê; o comportamento se prova pela prova de ponta a ponta.
- **Papel do Drive: Gerente de conteúdo**, conferido na ajuda do Google (support.google.com/a/users/answer/12380484): inclui, edita e move arquivos e pastas, e só manda para a lixeira. Registrado no roteiro.
