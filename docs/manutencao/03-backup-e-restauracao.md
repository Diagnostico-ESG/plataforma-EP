# Backup e restauração

Roteiro para guardar e recuperar os dados da plataforma. **Hoje só existe o desenvolvimento, com dados inventados; a produção ainda não existe.** Tudo que depende da produção está marcado **"conferir no `/ship` de produção"**. Um backup que nunca foi restaurado não está provado: o teste de restauração faz parte do roteiro.

Termos usados aqui:

- **Backup do banco:** cópia da estrutura (tabelas, regras, funções) e dos dados.
- **Dump:** o arquivo `.sql` que o backup gera.
- **Restaurar:** carregar esse arquivo num banco vazio e conferir se está tudo lá.
- **`psql` e `pg_dump`:** programas do PostgreSQL que carregam e geram dumps. Vêm com o "cliente do PostgreSQL".

Os arquivos do backup têm **dado real** (nomes e e-mails de servidores): guarde-os em local definido pela instituição, fora do repositório e fora da pasta do projeto. Nunca os abra em chat nem os mande por e-mail.

## O que o backup precisa cobrir

1. **O banco do Supabase.** Estrutura e dados: processos, andamentos, versões (os dados de cada arquivo, não o arquivo), usuários, autorizações, cadastros e histórico.
2. **Os arquivos das versões, que não estão no Supabase.** Ficam no **Drive compartilhado do CED** (ADR 0008). O backup deles é o do próprio Drive, da instituição. Dois cuidados:
   - Substituir um arquivo grava o novo por cima, e o Google guarda o anterior por 30 dias (**Gerenciar versões** do arquivo no Drive). Depois, perde-se (ADRs 0007 e 0011).
   - O banco guarda o identificador de cada arquivo no Drive e o hash MD5; se um arquivo sumir do Drive, a plataforma avisa a diferença. Quem apagar a pasta do Drive apaga os arquivos sem passar pela plataforma: restrinja quem pode apagar.
3. **As planilhas dos dashboards** não precisam de backup: a plataforma as reescreve inteiras todo dia às 6h a partir do banco (`06-planilhas-e-dashboards.md`).
4. **Os dashboards do Data Studio** não têm backup automático: o roteiro para refazê-los do zero está em `07-dashboards-no-data-studio.md`.

## Backup automático do Supabase

1. Abra o painel do projeto: `https://supabase.com/dashboard/project/<ref>/database/backups`.
2. Confira o plano. O backup diário automático existe nos planos pagos (Pro, Team e Enterprise); no plano gratuito não há.
3. **Conferir no `/ship` de produção:** o plano da produção, se há backup diário e por quantos dias ele fica. Sem backup automático, o manual abaixo é a única proteção e deve ser agendado.

## Backup manual do banco

Faça antes de aplicar uma migração destrutiva em produção e em intervalos que a instituição definir.

Há dois caminhos. Use o primeiro se o seu computador tem **Docker**; o segundo não precisa de Docker.

### Caminho 1: com Docker (`supabase db dump`)

1. Confira o vínculo: `supabase/.temp/project-ref` deve ter o ref do ambiente de que você vai tirar o backup. Em produção, atualize antes a linha "vínculo atual" de `supabase/AMBIENTES.md` e vincule: `npx supabase link --project-ref <ref>`.
2. Escolha uma pasta de destino **fora do projeto** (aqui, `<pasta>`).
3. Estrutura: `npx supabase db dump -f <pasta>/estrutura.sql`.
4. Dados: `npx supabase db dump --data-only -f <pasta>/dados.sql`. Sem `--data-only` o arquivo sai sem os dados.
5. Papéis do banco: `npx supabase db dump --role-only -f <pasta>/papeis.sql`.
6. A opção `-f` grava o arquivo direto. Evite `>` no PowerShell: ele muda a codificação do arquivo.
7. Se vinculou a produção só para isso, volte o vínculo ao desenvolvimento e atualize `supabase/AMBIENTES.md`.

### Caminho 2: sem Docker (`pg_dump`)

1. Instale o **cliente do PostgreSQL** na versão do banco.
2. No painel do projeto, abra **Connect** e copie a cadeia de conexão do tipo **Session pooler**. Ela tem a senha do banco: guarde só no seu terminal.
3. No PowerShell, rode `pg_dump "<cadeia-de-conexao>" -f <pasta>/completo.sql`. Troque `<cadeia-de-conexao>` pela cadeia do passo 2.
4. A rede do escritório só abre a porta 443; as portas do banco (5432 e 6543) ficam fechadas. Rode de uma rede que as libere, ou use o backup automático do painel.

## Registrar o backup

1. Em `supabase/AMBIENTES.md`, atualize as linhas "último backup de produção" e "último teste de restauração" com a data.
2. Hoje as duas dizem "nenhum": é esperado, porque não há produção. **Conferir no `/ship` de produção:** antes de a produção receber dado real, faça um backup e o teste de restauração abaixo, e registre.

## Teste de restauração

Faça uma vez **antes** de a produção receber dado real e **depois de cada migração destrutiva**. Ele acontece **fora do ambiente de desenvolvimento**, num projeto Supabase separado, criado só para o teste e **apagado depois**, porque o backup tem dado real. Confira o limite de projetos do plano da instituição.

1. Crie um projeto Supabase novo e vazio, só para o teste. Anote o ref como `<ref-do-teste>`.
2. Copie a cadeia de conexão **Session pooler** desse projeto (painel → **Connect**).
3. Aplique os arquivos do backup, na ordem, no PowerShell:
   1. `psql "<cadeia-do-teste>" -f <pasta>/papeis.sql`
   2. `psql "<cadeia-do-teste>" -f <pasta>/estrutura.sql`
   3. `psql "<cadeia-do-teste>" -f <pasta>/dados.sql`
   Com o caminho 2 (um arquivo só), rode só `psql "<cadeia-do-teste>" -f <pasta>/completo.sql`.
4. No SQL Editor do projeto de teste, conte as linhas das tabelas principais: `select 'processos' as tabela, count(*) from public.processos union all select 'versoes', count(*) from public.versoes union all select 'usuarios', count(*) from public.usuarios union all select 'eventos', count(*) from public.eventos;`
5. Rode a mesma consulta no ambiente de origem e **compare os números**. Eles devem ser iguais.
6. Confira que a RLS veio junto: `select tablename from pg_tables where schemaname = 'public' and not rowsecurity;` deve voltar vazio.
7. Se há arquivos no Drive, abra um deles pelo identificador que o banco guarda, para ver que o arquivo existe.
8. **Apague o projeto de teste** quando terminar. Ele tem dado real.
9. Registre a data em `supabase/AMBIENTES.md` ("último teste de restauração").

## A exportação para planilha não substitui o backup

As planilhas dos dashboards servem para ver os números em outra ferramenta e têm só contagens e o andamento (sem nome de pessoa na planilha pública). Não são cópia do banco e não permitem restaurar nada.
