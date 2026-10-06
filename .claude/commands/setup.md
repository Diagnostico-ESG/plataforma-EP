---
description: Setup inicial de um projeto novo, depois do /projeto — scaffold, ambiente de teste com cobertura e typecheck, regras de lint, checagem de dependência circular, banco de dados no Supabase (quando o projeto precisa, com cadastro fechado se há login e teste de buckets se há arquivos), git, pre-commit e a trava contra comandos git destrutivos que vem no pacote. Roda uma vez por projeto.
---

Conduza estes passos em ordem. Para skills de invocação direta, devolva o comando pronto para eu rodar.

**Setup que já rodou.** Se `.scratch/inicio-projeto.md` tem a linha `setup concluído em`, o projeto já está montado: faça só o passo 7 (banco), anote em `.scratch/pre-producao.md`, se ele existir, que a revisão anterior não cobre o banco, comite o que o passo criou e diga que o próximo passo é voltar ao comando que mandou para cá (em geral o `/planejar`). Se o `package.json` existe e a linha não, o setup parou no meio: confira passo a passo o que já existe e retome do primeiro que falta.

0. **Node e git.** Rode `node --version`. Precisa ser 22.22.2 ou mais novo na linha 22, ou 24.15 ou mais novo (as versões 23 e 25 não servem): o Vitest, o jsdom e o lint-staged não rodam em versão anterior. Fora disso, pare e me explique como atualizar. Rode também `git config user.name` e `git config user.email`; se algum vier vazio, peça que eu configure, senão o primeiro commit falha.
1. **Resumo do projeto.** Se `.scratch/projeto.md` não existir, pare aqui: explique que o primeiro passo é `/projeto` e não siga. Se existir, leia antes de continuar.
2. **Perguntas iniciais.** Se `.scratch/inicio-projeto.md` não existir: (a) use a resposta sobre dados pessoais ou sensíveis registrada em `.scratch/projeto.md`; se for sim, sugira desativar o claude-mem antes de começar. (b) Pergunte se quero uma auditoria dos pacotes de terceiros instalados. Se sim, leia os hooks e scripts de cada plugin e explique em linguagem simples o que cada um faz: se acessa a internet e para onde, que arquivos grava, que dados envia. Registre as respostas (e o relatório, se houver) em `.scratch/inicio-projeto.md`. Como o arquivo passa a existir, as perguntas não se repetem.
3. **Scaffold.** A pasta atual já contém os arquivos do DevFlow e o `.scratch/`. Sem terminal interativo, o assistente do Vite cancela numa pasta não vazia, e a opção `--overwrite` apagaria `.claude/`, `.scratch/` e `CLAUDE.md`: nunca use `--overwrite`. Crie o projeto numa subpasta e traga os arquivos sem sobrescrever nada:
   - `npm create vite@latest tmpvite -- --template react-ts --eslint --no-interactive`. A opção `--eslint` importa: o padrão do template é o Oxlint, e as regras do DevFlow são do ESLint. Se o assistente perguntar o verificador, escolha **ESLint**.
   - Copie o conteúdo de `tmpvite/` para a pasta atual sem sobrescrever arquivo existente: `cp -rn tmpvite/. .` (o aviso sobre `-n` é inofensivo) ou, no PowerShell, `robocopy tmpvite . /E /XC /XN /XO` (o `robocopy` devolve código de 1 a 7 quando copia com sucesso; só 8 ou mais é erro). O `README.md` e o `CLAUDE.md` do DevFlow continuam como estavam.
   - Apague a subpasta `tmpvite`, troque o `"name"` do `package.json` pelo nome do projeto (minúsculas e hífens) e rode `npm install`.
   - Confirme que existe `eslint.config.js` e que `.claude/`, `.scratch/` e `CLAUDE.md` seguem no lugar.
4. **Ambiente de teste:** instale `vitest`, `jsdom`, `@testing-library/react`, `@testing-library/dom` e `@vitest/coverage-v8` (mesma versão principal do `vitest`) como dependências de desenvolvimento. O `@testing-library/dom` é exigido pelo `@testing-library/react` e entra explícito porque o `.npmrc` do passo 6 faz o npm deixar de instalar esse tipo de dependência sozinho. No `vite.config.ts`, importe `defineConfig` de `vitest/config` (e não de `vite`), o que dispensa a linha `/// <reference types="vitest/config" />`, e configure `test.environment: 'jsdom'`, `test.exclude: [...configDefaults.exclude, '.claude/worktrees/**']` (com `configDefaults` também vindo de `vitest/config`) e a cobertura: `provider: 'v8'`, `reporter: ['text-summary']`, `include: ['src/**']` e piso de 70% em `thresholds` (`lines`, `functions`, `branches`, `statements`). Adicione aos scripts do `package.json` `"test": "vitest run"`, `"test:coverage": "vitest run --coverage"` e `"typecheck": "tsc -b"`. Crie um teste-fumaça que renderize o componente inicial e clique no botão do contador (assim a cobertura do template fecha o piso) e confirme que `npm test`, `npm run test:coverage` e `npm run typecheck` passam.
5. **Regras de lint.** Acrescente ao `eslint.config.js` as regras que tornam as Convenções de Código automáticas:
   - para todos os arquivos `.ts` e `.tsx`: `complexity: ['error', 10]` e `max-lines: ['error', { max: 300, skipBlankLines: true, skipComments: true }]`;
   - só para arquivos `.ts` de `src/`, exceto os de teste (`**/*.test.ts`) e os de `src/hooks/`: `max-lines-per-function: ['error', { max: 20, skipBlankLines: true, skipComments: true }]`;
   - só para arquivos `.ts` de `src/hooks/`, exceto os de teste: a mesma regra, com `max: 40`. Hooks reúnem estado e efeitos de um formulário ou de uma tela, e o limite de 20 levava a juntar linhas só para caber;
   - componentes `.tsx` ficam fora das regras de função, porque são divididos por responsabilidade;
   - em `globalIgnores`, acrescente `.claude/worktrees` ao `dist`.
   Confirme que `npm run lint` passa.
6. **Dependências circulares.** Crie o arquivo `.npmrc` na raiz com a linha `legacy-peer-deps=true`, antes de instalar o `madge`. Motivo: o `madge` declara TypeScript 5 como dependência opcional e o projeto usa a versão 6, e o npm recusa a instalação (erro ERESOLVE). O `.npmrc` vai para o git, então qualquer cópia do projeto instala do mesmo jeito. Efeito colateral: o npm deixa de instalar sozinho dependências exigidas por outros pacotes (como o `@testing-library/dom` do passo 4); se um pacote novo reclamar de algo faltando, instale o que falta de forma explícita. Depois: instale `madge` como dependência de desenvolvimento e adicione o script `"check:circular": "madge --circular --extensions ts,tsx src"`. Confirme que roda sem apontar nada.
7. **Banco de dados.** Este passo também roda sozinho, depois do setup, quando o projeto passa a precisar de banco, login ou arquivos (o `/planejar` e o `/projeto` mandam para cá): nesse caso, faça só os itens que ainda não existem e, em `.scratch/inicio-projeto.md`, troque a linha "sem banco" por "banco: local" ou "banco: remoto de desenvolvimento" e registre o que foi acrescentado. Leia em `.scratch/projeto.md` se o projeto tem login, se guarda arquivos enviados ou se os dados precisam ser vistos por mais de uma pessoa ou em mais de um computador. Qualquer um dos três pede banco. Se nenhum, registre "sem banco" em `.scratch/inicio-projeto.md` e pule para o passo 8. Na dúvida, pergunte. Se sim, o DevFlow usa o Supabase, o único banco com roteiro escrito aqui. Se o projeto tiver uma exigência que o Supabase não atende (banco ou API da empresa que já existe, nuvem ou região exigida, dado sensível que pede hospedagem própria, uso sem internet), diga em uma frase qual é e pergunte como quero seguir antes de continuar. Seguindo com o Supabase:
   a. **Ambiente de desenvolvimento.** Explique em uma frase cada opção e recomende a local:
      - **Local:** uma cópia do banco roda neste computador, via Docker. Os testes podem apagar e recriar tudo sem risco.
      - **Remoto de desenvolvimento:** um projeto Supabase separado, criado só para desenvolver, para quando o banco local não sobe nesta máquina. Pergunte se a máquina tem Docker (`docker info`). Com Docker, os testes de banco usam o comando da CLI. **Sem Docker**, os testes de banco rodam pelo script do DevFlow (item j), porque o `supabase test db` e o `db dump` rodam dentro de um contêiner mesmo com o banco remoto.
   b. **Local:** confira se o Docker está rodando (`docker info`); se não estiver, pare e me explique como instalar ou ligar, ou ofereça o remoto de desenvolvimento. Se `npm`, `git` ou o Supabase CLI falharem por erro de rede ou de certificado, a causa costuma ser o proxy da rede corporativa: veja a seção 9 do `README.md`. Depois: `npm install supabase --save-dev`, `npx supabase init` e `npx supabase start`. O `start` imprime também a chave secreta local, que não pode entrar na conversa (o claude-mem a gravaria): rode-o com a saída descartada (`npx supabase start > /dev/null 2>&1`; no PowerShell, `npx supabase start *> $null`) e confira só o código de saída. Se falhar, peça que eu rode o comando no meu terminal e cole só a mensagem de erro, sem as linhas de chave. Peça que eu rode `npx supabase status` no meu terminal e copie a URL e a chave publicável para o `.env.local`.
      **Remoto de desenvolvimento:** peça que eu crie no painel do Supabase um projeto chamado `<nome-do-projeto>-dev` e informe o identificador dele (project ref). Depois: `npm install supabase --save-dev` e `npx supabase init`. Depois, peça que eu rode no meu terminal `npx supabase login` (abre o navegador) e `npx supabase link --project-ref <ref-dev>` (pode pedir a senha do banco, que nunca vem para a conversa) e confirme. Peça que eu copie a URL e a chave publicável desse projeto para o `.env.local`.
   c. (Faça este item antes de pedir que eu preencha o `.env.local` no item b.) Crie `.env.example` com `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY`, sem valores, e confirme que o `.gitignore` cobre o `.env.local`. A chave usada é a publicável (`sb_publishable_...`); a `anon`, mais antiga e longa, começando por `eyJ`, está sendo descontinuada pelo Supabase.
   d. Acrescente `supabase/.temp/` e `supabase/.branches/` ao `.gitignore` da raiz (o `supabase init` só cria o `.gitignore` dele quando já existe repositório git, e aqui o `git init` vem depois). Registre em `.scratch/inicio-projeto.md` a linha "banco: local" ou "banco: remoto de desenvolvimento". Crie `supabase/AMBIENTES.md` com seis linhas: desenvolvimento (local, ou o ref do projeto dev), produção ("ainda não criado"), **vínculo atual** ("local" ou o ref do projeto dev: o projeto a que a CLI está ligada agora), última migração publicada em produção ("nenhuma"), último backup de produção ("nenhum") e último teste de restauração ("nenhum").
   e. `npm install @supabase/supabase-js`. Crie `src/lib/supabase.ts` como único ponto de conexão: lê as duas variáveis, lança erro com contexto se faltar alguma e exporta o cliente tipado com `Database`.
   f. Crie o `scripts/gerar-tipos.mjs`, que gera os tipos sem arriscar o arquivo: com o Docker desligado, o redirecionamento `>` gravaria a mensagem de erro dentro de `src/types/database.ts`. O script grava num arquivo temporário e só o troca pelo definitivo se o comando terminar com sucesso:
      ```js
      import { execFileSync } from 'node:child_process'
      import { mkdirSync, renameSync, writeFileSync } from 'node:fs'

      const destino = 'src/types/database.ts'
      const alvo = process.argv.slice(2)
      const saida = execFileSync('npx', ['supabase', 'gen', 'types', 'typescript', ...alvo], {
        encoding: 'utf8',
        shell: process.platform === 'win32',
      })
      if (!saida.includes('export type')) {
        throw new Error(`A saída não parece um arquivo de tipos: ${saida.slice(0, 200)}`)
      }
      mkdirSync('src/types', { recursive: true })
      writeFileSync(`${destino}.tmp`, saida)
      renameSync(`${destino}.tmp`, destino)
      ```
      Scripts no `package.json`: `"db:types": "node scripts/gerar-tipos.mjs --local"` (no remoto, `--project-id <ref-dev>` no lugar de `--local`) e `"test:db": "supabase test db"` (no remoto, com `--linked`; no remoto sem Docker, o `test:db` é o do item j). O arquivo de tipos é gerado automaticamente e passa das 300 linhas: acrescente `src/types/database.ts` aos arquivos ignorados do ESLint e à exclusão de cobertura (`coverage.exclude`). Só no local: `"db:reset": "supabase db reset"`, que recria o banco do zero com as migrações e o `seed.sql`. No remoto de desenvolvimento, a migração nova chega ao banco com `npx supabase db push` (com o vínculo conferido no projeto dev; se a CLI pedir a senha do banco, pare e peça que eu rode o comando); o reset apaga o projeto vinculado e fica fora dos scripts: é decisão minha, caso a caso.
   g. Crie `supabase/tests/00_rls_ligada.test.sql`, que falha se alguma tabela do schema `public` estiver sem RLS:
      ```sql
      begin;
      create extension if not exists pgtap with schema extensions;
      select plan(1);
      select is(
        (select count(*)::int from pg_tables
         where schemaname = 'public' and not rowsecurity),
        0,
        'toda tabela pública tem RLS ligada'
      );
      select * from finish();
      rollback;
      ```
   h. Confirme que `npm run db:types` gera o arquivo de tipos, que `npm run test:db` passa, que o typecheck passa com o cliente tipado e que `npm run test:coverage` continua acima do piso (se o `src/lib/supabase.ts` derrubar a cobertura, escreva o teste dele: variável faltando lança erro com contexto). Os testes de banco ficam fora do pre-commit, porque dependem do banco ligado: rodam na execução e no `/ship`. Pelo mesmo motivo, o `npm test` nunca depende do banco: o que envolve o banco é testado no `test:db`, e os testes do Vitest simulam as funções de acesso.
   i. **Login e arquivos.** Leia em `.scratch/projeto.md` se o projeto tem login com perfis de acesso e se guarda arquivos enviados. Sem nenhum dos dois, pule este item.
      - **Com login:** desligue o cadastro aberto. No local, `enable_signup = false` nas seções `[auth]` (vale para todo cadastro) e `[auth.email]` (cadastro por e-mail) do `supabase/config.toml`, e reinicie com `npx supabase stop` e `npx supabase start` (saída descartada, como no item b). No remoto de desenvolvimento, faça a mesma mudança no `config.toml` (para o arquivo ficar igual ao painel) e peça que eu desligue a opção de permitir novos cadastros, na seção Authentication do painel. Confirme que o cadastro fechou: entregue-me pronto um comando que tenta criar um usuário com e-mail inventado (para o PowerShell, `Invoke-RestMethod` com método POST para `<URL>/auth/v1/signup` e a chave publicável no cabeçalho `apikey`; no Bash, `curl`); eu rodo no meu terminal e a resposta esperada é uma recusa de cadastro (algo como `signup_disabled`). Registre em `.scratch/inicio-projeto.md` a linha "banco: login preparado". Lembre que os usuários serão criados por mim no painel, que o perfil deles nasce por gatilho e que o primeiro administrador é promovido por mim uma única vez, ambos como descrito na seção "Login e perfis" de `.claude/regras/banco.md`, e que a primeira funcionalidade do projeto será o login.
      - **Com arquivos:** crie `supabase/tests/01_buckets_privados.test.sql`, que falha se algum bucket do Storage for público, registre em `.scratch/inicio-projeto.md` a linha "banco: arquivos preparados" e confirme que `npm run test:db` passa com ele:
        ```sql
        begin;
        create extension if not exists pgtap with schema extensions;
        select plan(1);
        select is(
          (select count(*)::int from storage.buckets where public),
          0,
          'nenhum bucket do Storage é público'
        );
        select * from finish();
        rollback;
        ```
   j. **Remoto sem Docker: testes de banco pelo script do DevFlow.** Faça este item no lugar do comando `supabase test db` dos itens f e h.
      - `npm install --save-dev pg` e copie `.claude/modelos/testar-banco.mjs` para `scripts/testar-banco.mjs`, sem alterar. Ele roda os mesmos arquivos de `supabase/tests/`, conectando direto ao banco de desenvolvimento, e sai com erro se algum teste falhar.
      - Script no `package.json`: `"test:db": "node scripts/testar-banco.mjs <ref-dev>"`. O ref é a trava do script: ele só roda se a cadeia de conexão citar esse ref, e por isso nunca roda contra a produção.
      - Peça que eu crie o arquivo `.env.banco.local` (o `.gitignore` do Vite já ignora `*.local`; você não o lê) com uma linha: `SUPABASE_DB_URL="<cadeia de conexão>"`. A cadeia é a do projeto **de desenvolvimento**, copiada do painel (botão Connect, opção "Session pooler", que funciona em rede comum), com a senha do banco no lugar indicado. A senha fica só nesse arquivo.
      - Rode `npm run test:db`: os testes do item g (e do item i, se houver) devem passar. Para ver um teste falhar e passar no TDD, rode um arquivo só: `npm run test:db -- supabase/tests/<arquivo>`.
      - Registre em `.scratch/inicio-projeto.md` a linha "banco: testes pelo script (sem Docker)". Nesta variante, os tipos saem de `--project-id <ref-dev>` (item f), a Edge Function se confere com `functions deploy --use-api` no projeto dev, e o backup de produção usa o painel ou o `pg_dump` (roteiro de backup do `/ship`).
8. Confirme que `.scratch/` **não** está no `.gitignore` e acrescente a ele as linhas `.claude/worktrees/` e `dados-reais/` (a pasta onde eu posso guardar dados reais para uma carga; você nunca lê o que há nela, e ela nunca vai para o git).
9. `git init -b main`, primeiro commit e o marco `marco/AAAA-MM-DD-inicio`.
10. `/mattpocock-skills:setup-matt-pocock-skills`. Quando ele perguntar onde guardar specs e tickets, escolha arquivos locais em `.scratch/`; o rastreador de tarefas de fora (GitHub, Linear) fica fora. Se a skill recusar ser acionada, devolva o comando pronto.
11. `/impeccable:impeccable init` (se recusar ser acionado, devolva o comando pronto).
12. **Pre-commit.** Não use skill de terceiros aqui: a `setup-pre-commit` do Matt Pocock não existe na instalação testada, e a de outro pacote instala o Prettier, que contraria a regra de que o ESLint decide o estilo. Precisa dos passos 3 a 6 prontos. Faça à mão:
    - `npm install --save-dev husky lint-staged` e `npx husky init`;
    - no `package.json`, `"lint-staged": { "*.{ts,tsx}": "eslint --max-warnings=0 --no-warn-ignored" }`;
    - o arquivo `.husky/pre-commit` com três linhas: `npx lint-staged`, `npm run typecheck` e `npm test`;
    - confira com um commit de teste que as três checagens aparecem na saída (sem arquivo `.ts` no commit, o lint-staged só avisa que não achou arquivos; é o esperado), e que um erro de lint num arquivo novo bloqueia o commit. Depois, apague o arquivo de teste com erro (ele não chegou a ser comitado) e tire-o da área de preparo com `git restore --staged <arquivo>`.
    A cobertura e a checagem de dependência circular ficam fora do pre-commit, para não deixar cada commit lento: rodam no `/ship`.
13. **Trava de git.** Ela vem pronta no pacote do DevFlow: `.claude/settings.json` e `.claude/hooks/bloquear-git-destrutivo.mjs` (mais o arquivo de teste dela). Não use skill de terceiros. Confira que os arquivos estão no projeto; se já existir um `.claude/settings.json` com outras configurações, acrescente só o bloco `hooks`, sem apagar o resto. Depois:
    - `npm test` roda os testes da trava e passa;
    - `node .claude/hooks/bloquear-git-destrutivo.mjs --testar "git reset --hard"` termina com bloqueio, e com `"git status"` termina liberado;
    - teste ao vivo, com um comando inofensivo: tente rodar `git branch -D branch-que-nao-existe` (exceção autorizada à regra de que esses comandos são meus: o ramo não existe, e o objetivo é ver a trava agir). A resposta deve ser o bloqueio da trava; o erro comum do git ("branch not found") indica trava desligada. Se o git responder, a trava não está ativa: pare e me avise.

Ao final, acrescente a `.scratch/inicio-projeto.md` a linha `setup concluído em AAAA-MM-DD`, comite o que os passos 10 a 13 criaram e resuma em linguagem simples o que ficou configurado (incluindo qual ambiente de banco foi escolhido, se houver banco) e lembre que o próximo passo é `/concepcao-livre` ou `/concepcao-premium`, com o modelo da tabela do Funil de Trabalho.
