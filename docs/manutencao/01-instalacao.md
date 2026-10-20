# Instalar o ambiente de desenvolvimento

Para quem vai mexer no código. Você não precisa do Claude Code: este roteiro usa só o terminal, o navegador e o painel do Supabase.

Termos usados aqui:

- **Repositório:** a pasta do projeto com todo o histórico de mudanças (git). Este fica no GitHub.
- **Node.js e npm:** o programa que roda as ferramentas do projeto (Node) e o instalador de pacotes que vem com ele (npm).
- **Vite:** a ferramenta que serve a plataforma no seu computador enquanto você programa.
- **Chave publicável:** a chave do projeto Supabase que o navegador usa. Não é secreta, mas também não vai para o git.
- **pgTAP:** o jeito de escrever testes do banco, em arquivos `.sql`, em `supabase/tests/`.

## O que a plataforma usa

- **Interface:** React 19 com TypeScript, servida pelo Vite. Sem biblioteca de interface pronta: o estilo é CSS próprio.
- **Banco, login e funções do servidor:** Supabase (PostgreSQL), um projeto para desenvolvimento e outro para produção. A produção ainda não existe: **conferir no `/ship` de produção**.
- **Arquivos das versões:** Drive compartilhado do CED (ADR 0008). Nada de arquivo no Supabase.
- **Planilhas e dashboards:** Google Planilhas e Data Studio (ADR 0017).

## Antes de começar

1. Tenha **Node.js 24** instalado (o mesmo das verificações do GitHub: `.github/workflows/verificacao.yml`). Confira com `node --version`.
2. Tenha o **git** instalado.
3. Tenha acesso de leitura e escrita ao repositório da plataforma no GitHub.
4. Peça ao Administrador atual da plataforma o acesso ao **projeto Supabase de desenvolvimento** (como membro da equipe do projeto). O ref dele está em `supabase/AMBIENTES.md`.

## Instalar

1. Abra um terminal e vá à pasta onde quer guardar o projeto.
2. Baixe o repositório: `git clone <endereço-do-repositório> "Projeto Aplicação Escritório de Processos"` e entre na pasta.
3. Instale os pacotes: `npm install`. O arquivo `.npmrc` do projeto já liga `legacy-peer-deps`; não o apague.
4. O `npm install` também instala o pre-commit (`husky`): a partir daqui, cada `git commit` roda a verificação sozinho.

## Variáveis de ambiente

A plataforma lê duas variáveis, listadas sem valor em `.env.example`.

1. Na raiz do projeto, copie `.env.example` para `.env.local`. O `.gitignore` ignora todo arquivo `*.local`: ele nunca vai para o git.
2. Abra no navegador o painel do projeto de desenvolvimento: `https://supabase.com/dashboard/project/<ref-do-projeto>/settings/api-keys`.
3. Copie a **URL do projeto** para `VITE_SUPABASE_URL` e a **chave publicável** (começa com `sb_publishable_`) para `VITE_SUPABASE_PUBLISHABLE_KEY`, no `.env.local`.
4. **Nunca** copie a chave secreta (`sb_secret_…`) nem a antiga `service_role` para o projeto: a plataforma não usa e o build de produção é barrado se ela aparecer.

## Rodar

1. `npm run dev` sobe a plataforma em `http://localhost:5173`.
2. Para entrar, o seu e-mail `@ccivil.pr.gov.br` precisa estar autorizado no ambiente (ADR 0001). O Administrador autoriza em **Administração → Usuários** (a lista de autorizações fica nessa aba). Se o ambiente é novo e ainda não há Administrador, veja `docs/implantacao-login.md`, seção "SQL Editor: primeiro administrador".
3. O login pelo Google precisa que `http://localhost:5173` esteja entre os endereços permitidos no painel do Supabase (**Authentication → URL Configuration**). Passo a passo: `docs/implantacao-login.md`.

## Conferir que está tudo certo

Os cinco comandos abaixo são as mesmas verificações do pre-commit e do GitHub Actions. Rode todos depois de instalar; todos devem terminar sem erro.

1. `npm test` roda os testes da interface e das funções do servidor (Vitest). Leva cerca de 1 a 2 minutos.
2. `npm run lint` confere o estilo e os limites de tamanho (arquivo até 300 linhas, função de 4 a 20 linhas, no máximo 10 caminhos por função).
3. `npm run typecheck` confere os tipos do TypeScript.
4. `npm run check:circular` confere que nenhum módulo depende de si mesmo por um caminho de volta.
5. `npm run test:coverage` mede a cobertura de testes; o mínimo do projeto é 70%.

## O banco: testes e tipos

Os testes de banco (`supabase/tests/*.test.sql`) rodam contra o banco de **desenvolvimento**, nunca contra a produção.

- **Rede do escritório:** só a porta 443 abre; as portas do banco (5432 e 6543) ficam fechadas. Por isso os testes de banco rodam no **GitHub Actions**: abra o repositório no GitHub, aba **Actions → Testes de banco → Run workflow**, escolha a branch e rode. Ele também roda sozinho a cada envio à `main` que mexa em `supabase/`.
- **Rede liberada:** `npm run test:db` roda os mesmos testes da sua máquina. Ele lê a cadeia de conexão de `.env.banco.local` (variável `SUPABASE_DB_URL`, do painel do Supabase, que tem a senha do banco) e recusa rodar se a cadeia não for a do projeto de desenvolvimento.
- **Tipos:** depois de uma migração aplicada, `npm run db:types` regenera `src/types/database.ts`. Confira antes que `supabase/.temp/project-ref` traz o ref do desenvolvimento.
- **Aplicar uma migração no desenvolvimento:** no GitHub Actions, **Migrar banco de desenvolvimento → Run workflow**, informando o nome do arquivo de `supabase/migrations/`. Ele só aplica no desenvolvimento e avisa se a migração já foi aplicada.
- **Migração nunca se edita depois de aplicada:** o conserto é uma migração nova (`npx supabase migration new <nome>`).

## Regras de trabalho

1. Todo código novo tem teste; todo bug corrigido ganha um teste que o pegaria.
2. Nunca use `git commit --no-verify`: se o pre-commit barrar, corrija a causa.
3. Dados de teste, exemplos e `seed.sql` só têm dados inventados. Dado pessoal real só existe em produção.
4. Nunca coloque no git: `.env*`, chaves, senhas, tokens, o arquivo da conta de serviço do Google nem nada da pasta `dados-reais/` (fora do git por regra).
5. Mudança de banco é só por migração em `supabase/migrations/`, com o teste escrito antes.

## O que fica por conta de outras pessoas

- Conta de serviço, Drive e Google Cloud: `docs/drive-conta-de-servico.md`.
- Login pelo Google: `docs/implantacao-login.md`.
- Publicar: `02-publicacao.md`. Backup: `03-backup-e-restauracao.md`.
