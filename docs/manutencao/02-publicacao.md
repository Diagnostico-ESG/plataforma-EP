# Publicar: banco, funções e site

Roteiro para quem publica a plataforma sem o Claude Code. Hoje só existe o ambiente de **desenvolvimento**; a **produção ainda não existe**. Tudo que depende da produção está marcado **"conferir no `/ship` de produção"**, e quem fizer a primeira publicação deve refazer essas conferências com o ambiente real em mãos.

Termos usados aqui:

- **Migração:** arquivo em `supabase/migrations/` que muda a estrutura do banco. É a única forma de mudar o banco.
- **Vínculo (link):** a ligação entre a CLI do Supabase no seu computador e um projeto. Tudo que a CLI faz vale para o projeto vinculado, por isso o vínculo se confere antes de cada comando.
- **Função do servidor (Edge Function):** pequeno programa que roda no Supabase. Há duas: `arquivos-no-drive` e `planilhas-dos-dashboards`.
- **Segredo:** valor guardado no Supabase que só a função lê (chave da conta do Google, senha interna).
- **Site:** o que o navegador baixa (a pasta `dist/` do build). É estático.

## Antes de tudo

1. Os ambientes e o vínculo atual ficam em `supabase/AMBIENTES.md` (linhas "desenvolvimento", "produção", "vínculo atual", "última migração publicada em produção"). Leia e atualize esse arquivo em cada publicação.
2. O vínculo real da CLI está em `supabase/.temp/project-ref` (o `.gitignore` o ignora). Antes de **qualquer** comando que altere o banco, confira que ele traz o ref do ambiente que você quer.
3. `npx supabase login` e `npx supabase link --project-ref <ref>` você roda no seu terminal: o `login` abre o navegador e o `link` pode pedir a senha do banco. Nunca cole essa senha em chat, e-mail ou arquivo do projeto.
4. Só publique depois de `npm test`, `npm run lint`, `npm run typecheck` e `npm run check:circular` passarem, e de os testes de banco passarem no GitHub Actions (`01-instalacao.md`).
5. A rede do escritório só abre a porta 443. `npx supabase db push` e os testes de banco usam as portas do banco, que ficam fechadas aqui: o `db push` precisa de rede liberada (outro local) ou de outro caminho. **Conferir no `/ship` de produção** qual caminho será usado para aplicar migrações em produção.

## A primeira vez, em produção (ainda não feita)

Cada item abaixo é **conferir no `/ship` de produção**.

1. Peça a quem administra o Supabase do CED que crie o projeto de produção na região **São Paulo (sa-east-1)** e informe o ref. Registre o ref em `supabase/AMBIENTES.md`.
2. No painel do projeto de produção, **antes** de qualquer migração, confira cada ponto:
   1. **Cadastro aberto**: o ADR 0001 exige que "Allow new users to sign up" fique **ligado** (sem isso, o primeiro acesso pelo Google não cria a conta); quem barra é o banco, pelo domínio e pela autorização. Os demais provedores de login ficam desligados, principalmente e-mail e senha.
   2. **SMTP próprio** configurado, se algum e-mail automático for usado.
   3. **URL Configuration**: Site URL e Redirect URLs só com o endereço do site publicado.
   4. **Plano e backup**: veja `03-backup-e-restauracao.md`.
   5. **Quem é membro da equipe** do projeto.
3. Faça o login pelo Google funcionar em produção (`docs/implantacao-login.md`).
4. Rode uma revisão de segurança antes de abrir a produção: toda tabela com RLS e política testada, toda view com `security_invoker = true`, toda função `security definer` só em schema não exposto com `search_path` vazio, nenhum `sb_secret_` nem `service_role` em `src/` ou `dist/`, e nenhum dado pessoal real em arquivo do git.

## Publicar o banco (migrações)

1. Abra `supabase/AMBIENTES.md` e anote a "última migração publicada em produção". Liste o que veio depois: `ls supabase/migrations`.
2. Leia cada migração pendente e diga em uma frase o que ela muda. Atenção às **destrutivas** (que apagam tabela, coluna ou dado): faça backup antes (`03-backup-e-restauracao.md`).
3. Confira que cada migração pendente pertence a uma funcionalidade já entregue pelo `/ship`. O `db push` aplica **todas** as pendentes de uma vez.
4. Atualize a linha "vínculo atual" de `supabase/AMBIENTES.md` para "produção" e, só então, vincule a CLI: `npx supabase link --project-ref <ref-da-producao>`. Nessa ordem, um erro no meio deixa o registro do lado seguro.
5. Enquanto o vínculo estiver em produção, rode **só** `npx supabase db push` e `npx supabase functions deploy`. Nada de `npm run test:db`, `db reset` ou `migration up`.
6. Aplique: `npx supabase db push`. Se a CLI pedir a senha do banco, digite-a só no terminal.
7. Primeira publicação: as migrações aplicadas à mão no desenvolvimento (SQL Editor) **não estão no histórico da CLI**. Antes do primeiro `db push` em produção, registre-as com `npx supabase migration repair --status applied <versão>` numa rede com as portas do banco liberadas (`supabase/AMBIENTES.md`, nota de 2026-10-06). **Conferir no `/ship` de produção.**
8. Volte o vínculo para o desenvolvimento: `npx supabase link --project-ref <ref-do-desenvolvimento>`.
9. Atualize em `supabase/AMBIENTES.md` a "última migração publicada em produção" e o "vínculo atual" (de volta ao desenvolvimento), e comite.
10. Se a publicação parar no meio, a linha "vínculo atual" continua dizendo "produção". Compare `supabase/.temp/project-ref` com os refs do arquivo: se a CLI ainda aponta para produção, repita o `db push` (ele só aplica o que falta); se já aponta para o desenvolvimento, faça só o passo 9.

## Primeiro administrador

Só um Administrador cria outro, então o primeiro é promovido à mão, uma vez por ambiente. Roteiro completo em `docs/implantacao-login.md`, seção "SQL Editor: primeiro administrador". **Conferir no `/ship` de produção.** O e-mail real nunca vai para migração, `seed.sql`, chat nem git.

## Publicar as funções do servidor

As duas funções ficam com a verificação de login do Supabase desligada (`supabase/config.toml`, seção `[functions.<nome>]`, `verify_jwt = false`): cada uma confere quem chamou por conta própria (a primeira, o login e o perfil; a segunda, a senha interna que o banco manda).

1. Segredos que cada função lê, **sem valores aqui**:

   | Função | Segredos |
   | --- | --- |
   | `arquivos-no-drive` | `EP_DRIVE_CONTA_JSON_BASE64` (chave da conta de serviço em base64), `EP_DRIVE_RAIZ_ID` (pasta raiz do Drive compartilhado), `EP_ORIGENS_ACEITAS` (endereços do site permitidos) |
   | `planilhas-dos-dashboards` | `EP_PLANILHAS_SENHA` (a mesma do cofre do banco), `EP_CHAVE_PUBLICAVEL` (chave publicável do projeto), e os da conta de serviço acima |

2. Grave cada segredo, com o vínculo conferido: `npx supabase secrets set NOME=valor --project-ref <ref>`. A chave da conta de serviço sai de um arquivo JSON: use o comando do passo 3 de `docs/drive-conta-de-servico.md` para gravá-la sem mostrá-la na tela.
3. Confira só os nomes: `npx supabase secrets list --project-ref <ref>`.
4. Publique: `npx supabase functions deploy arquivos-no-drive --use-api --project-ref <ref>` e `npx supabase functions deploy planilhas-dos-dashboards --use-api --no-verify-jwt --project-ref <ref>`. O `--use-api` monta a função nos servidores do Supabase, sem Docker, e usa só a porta 443.
5. Confira que as duas aparecem em `https://supabase.com/dashboard/project/<ref>/functions`.
6. Roteiros completos, com o que fazer se algo falhar: `docs/drive-conta-de-servico.md` e `docs/planilhas-publicar-a-funcao.md`. As planilhas ainda pedem o cofre do banco (`docs/planilhas-cofre-do-banco.md`).
7. Em **produção**, os endereços do cofre e os segredos são os de produção, não os do desenvolvimento. **Conferir no `/ship` de produção.**

## Publicar o site

**Hospedagem ainda não decidida.** A especificação previa hospedagem estática (Netlify, Vercel ou similar); a escolha, o endereço e a exigência de região ou de nuvem do CED ficam para a primeira publicação. **Conferir no `/ship` de produção.** Quando decidida, registre em um arquivo `.scratch/publicacao.md` a hospedagem, o endereço, as variáveis de ambiente, e a data e o commit de cada publicação.

1. O site precisa de duas variáveis: `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`, **as do projeto de produção**, nunca as do desenvolvimento. Se a hospedagem faz o build, configure-as no painel dela. Se o build é feito no seu computador, crie `.env.production.local` (ignorado pelo git) com as duas.
2. Rode `npm run build`. Se falhar, não publique.
3. Procure na pasta `dist/` as cadeias `sb_secret_` e `service_role`. Qualquer ocorrência **bloqueia** a publicação. Quando o build é do seu computador, procure também `127.0.0.1`, `localhost:54321` e o ref do projeto de desenvolvimento: se aparecerem, o build usou o banco errado. A URL e a chave publicável de produção aparecem no pacote de qualquer jeito, e isso é esperado.
4. Confira de novo o painel do Supabase de produção: cadastro aberto como no ADR 0001, SMTP próprio, redirecionamentos só com o endereço do site.
5. Publique pelo método da hospedagem escolhida.
6. Abra o endereço publicado, confira a página inicial e entre e saia pelo Google.
7. Crie um marco no git: `git tag marco/AAAA-MM-DD-publicacao`, e envie-o com `git push origin "refs/tags/marco/AAAA-MM-DD-publicacao"`.

## Depois de publicar

1. Confira em **Administração → Planilhas** se a atualização das planilhas funciona no ambiente (`06-planilhas-e-dashboards.md`).
2. Confira o backup e o teste de restauração (`03-backup-e-restauracao.md`).
3. Se o que você publicou mudou uma tabela ou coluna que o site já no ar usa, republique o site logo em seguida.
