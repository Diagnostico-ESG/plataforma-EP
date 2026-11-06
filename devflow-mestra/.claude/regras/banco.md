# Regras de banco de dados — DevFlow v3.3

Referência para projetos com a pasta `supabase/`. O `CLAUDE.md` traz as regras curtas e aponta para cá; os comandos que mexem no banco mandam ler as seções daqui. Leia o arquivo inteiro, uma vez por sessão, antes de planejar, criar ou alterar migração, política, função, view, gatilho, bucket, login, Edge Function ou código que envia ou abre arquivos.

## Ambientes e migrações

- Dois ambientes, registrados em `supabase/AMBIENTES.md`: desenvolvimento (Supabase local, via Docker, ou um projeto remoto só para desenvolver) e produção. O arquivo também tem a linha **vínculo atual**: o projeto a que a CLI está ligada agora.
- Antes de qualquer comando que altere o banco (`db push`, `db reset`, `migration up`, `functions deploy`, `secrets set`), confira o alvo: a linha "vínculo atual" e o arquivo `supabase/.temp/project-ref`, que a CLI grava ao vincular a um projeto remoto. No desenvolvimento local, o esperado é "vínculo atual: local" e esse arquivo ausente (ou com o ref do projeto dev). Se o arquivo traz o ref de produção, se a linha e o arquivo apontam para projetos diferentes, ou se o alvo é produção fora de um roteiro do `/ship`, pare e pergunte.
- Estrutura do banco muda só por arquivo de migração em `supabase/migrations/`, criado com `npx supabase migration new`. Migração que já chegou à produção fica como está: correção vira migração nova.
- Toda tabela nasce com RLS ligada e com as políticas na mesma migração, cada política com teste em `supabase/tests/`. O teste vem antes da migração.
- Regras de negócio no banco (sequência de etapas, histórico automático, versões que não se apagam) viram gatilho (trigger) ou função em migração (as regras de "Views e funções" valem para elas), com o mesmo TDD das políticas. O ESLint não lê SQL: mantenha cada função pequena, com uma responsabilidade e nome específico.
- Dados de exemplo ficam em `supabase/seed.sql`, sempre inventados.
- No remoto de desenvolvimento não há `db:reset`: a migração nova chega ao banco com `npx supabase db push`, depois de conferir o vínculo. Migração já enviada ao remoto não se edita, porque o `db push` não a aplica de novo e o banco ficaria diferente do arquivo: o conserto é uma migração nova. Os usuários fictícios do `seed.sql` chegam ao remoto uma vez, com minha aprovação, por `npx supabase db push --include-seed`.
- `npm run test:db` e `db:types` no remoto rodam contra o projeto vinculado: confira o alvo antes, como num comando que altera o banco. No remoto sem Docker, o `test:db` é o `scripts/testar-banco.mjs`, que se conecta pela cadeia de `.env.banco.local` (você não lê esse arquivo) e recusa rodar se ela não for do projeto de desenvolvimento.
- **Carga de dados reais em produção** é feita por mim, com o importador entrando como um usuário administrador (e-mail e senha pedidos na hora, nunca gravados). O importador não usa a chave secreta.
- `git revert` desfaz o arquivo de migração, e o banco continua como estava. Para o banco local acompanhar, rode `npm run db:reset`. Arquivos já enviados ao Storage também ficam.

## Chaves

- A interface fala com o banco só pela chave publicável (`sb_publishable_...`), através de `src/lib/supabase.ts`.
- A chave secreta (`sb_secret_...` ou a antiga `service_role`) fica fora do projeto. Se uma tarefa parecer exigi-la (convite de usuário pela própria plataforma, e-mail automático, cópia para outro sistema), pare e me mostre as opções. Aprovada, ela vive só numa Edge Function (seção "Edge Functions"), e um ADR registra o motivo.

## Views e funções

- Uma view lê as tabelas com os poderes de quem a criou e ignora a RLS delas, a menos que nasça com `with (security_invoker = true)`. Toda view (as do dashboard, por exemplo) leva essa opção.
- Função `security definer` só em schema que a API não expõe (por exemplo `private`), com `search_path` vazio e nomes qualificados lá dentro (`public.perfis`). O uso do schema e a execução da função são concedidos só a `authenticated`.
- **Não guarde o que se calcula.** Dado derivado de outras linhas (a etapa atual de um processo, uma contagem, um atraso) vira view ou função. Duas fontes para a mesma informação acabam divergindo. Guardar numa coluna só com ADR que diga por quê, e com um gatilho testado que mantenha as duas coerentes.

## Desempenho e edição simultânea

- **Índice.** Toda coluna usada em filtro, ordenação, junção ou numa política de RLS que consulta outra tabela tem índice, criado na mesma migração que a coluna ou a política. Chave estrangeira também. Com a tabela passando de alguns milhares de linhas, rode `explain` nas 5 consultas mais usadas e mostre o antes e o depois; antes disso, não otimize.
- **Sem `select *`** nas funções de acesso: peça só as colunas que a tela usa.
- **Sem consulta por item (N+1).** Uma lista que mostra dados de outra tabela traz tudo numa consulta só (relação embutida do cliente do Supabase ou view), nunca uma consulta por linha.
- **Edição simultânea.** Tabela que duas pessoas podem editar ao mesmo tempo ganha uma coluna `versao` (inteiro, soma 1 a cada alteração, por gatilho). O `update` só vale se a versão ainda é a que a pessoa leu; zero linhas alteradas é conflito, e a interface avisa ("outra pessoa alterou este registro; recarregue") sem sobrescrever. Teste de banco: duas leituras, dois `update`, o segundo é recusado. Registro que só uma pessoa edita (o próprio perfil, por exemplo) dispensa. A decisão é por tabela e fica na seção Modelo de dados da spec.

## Login e perfis

Vale quando o projeto tem login.

- Login é a primeira funcionalidade: nenhuma tela de dados antes de login, perfis e RLS por perfil estarem prontos e testados.
- Cadastro aberto desligado: `enable_signup = false` em `[auth]` e em `[auth.email]` do `supabase/config.toml`, e a opção equivalente no painel do projeto remoto. Quem cria os usuários sou eu, no painel do Supabase (Authentication → Users).
- Os perfis ficam numa tabela própria, ligada ao usuário do login (mesmo `id` de `auth.users`), com o perfil e a coluna `ativo`. Usuário desativado perde o acesso pela política; o registro e o histórico dele ficam.
- **A linha de perfil nasce por gatilho.** Um gatilho em `auth.users`, numa migração, cria a linha com o perfil de menor permissão e `ativo` verdadeiro assim que eu crio o usuário no painel. Se o gatilho falhar, a criação do usuário falha junto: mantenha a função mínima e testada. A função do gatilho segue a regra de "Views e funções". Um teste pgTAP cria um usuário fictício e confere que a linha nasce com o menor perfil.
- **Primeiro administrador.** Só um administrador promove outro, então o primeiro é promovido por mim, uma única vez em cada ambiente: você me entrega o comando SQL com um marcador no lugar do e-mail (`<meu-email>`), eu preencho e rodo no editor SQL do painel. O e-mail real fica fora da conversa, de migração, de `seed.sql` e do git. No desenvolvimento local, o `seed.sql` cria um administrador fictício para os testes.
- As políticas usam `(select auth.uid())` e uma função auxiliar que lê o perfil sem gerar recursão na RLS, pela regra de "Views e funções". Em `public` ela ficaria chamável de fora, com os poderes de quem a criou.
- Cada política tem teste com um usuário fictício de cada perfil, um usuário desativado e um visitante sem login (que não lê nada). Cada célula da tabela "quem pode o quê" da spec vira um teste.
- A segurança está na RLS. A interface pode esconder o que o perfil não usa; botão escondido não protege nada.
- Recuperação e troca de senha têm tela. No Supabase local, os e-mails caem na caixa de teste local; o endereço dela aparece no `npx supabase status`, que eu rodo no meu terminal porque a saída também traz chaves. O serviço de e-mail padrão do Supabase entrega só a membros da equipe do projeto, 2 mensagens por hora, e serve apenas para teste. Em produção, a recuperação de senha exige um servidor de e-mail próprio (SMTP), configurado antes da publicação.

## Arquivos (Storage)

Vale quando o projeto guarda arquivos enviados.

- Bucket sempre privado, criado em migração, com as políticas de `storage.objects` na mesma migração, por perfil e com teste. O teste `supabase/tests/01_buckets_privados.test.sql`, criado no `/setup`, falha se algum bucket for público; bucket público só com ADR.
- O arquivo é guardado com nome por identificador (uuid), sem nome de setor, processo ou pessoa no caminho. Nome original, formato, tamanho e hash ficam numa tabela.
- A interface abre o arquivo por URL assinada de curta duração, gerada na hora. URL assinada nunca é guardada no banco.
- O bucket tem tamanho máximo definido, e o formato é conferido no envio: arquivo enviado é dado de fora e passa por validação.
- Versões de arquivo nunca se apagam: nenhuma política de `storage.objects` dá permissão de apagar pela interface.
- O backup do banco não leva os arquivos do Storage. O roteiro "Backup e restauração" de `producao.md` cobre os dois.

## Edge Functions

Vale só quando uma funcionalidade aprovada exige a chave secreta ou uma credencial que não pode ir ao navegador.

- Cada função vive em `supabase/functions/<nome-específico>/`, criada com `npx supabase functions new`. A chave secreta só existe como variável de ambiente da função (a que o Supabase injeta ou um segredo cadastrado por mim com `npx supabase secrets set`), fora do código, do `.env.example` e do git.
- A função confere por conta própria, antes de qualquer ação com a chave secreta, quem a chamou: usuário logado, ativo e com o perfil exigido, lido da tabela de perfis. A verificação de login que a plataforma faz na entrada da função não substitui essa conferência. No primeiro uso, confirme na documentação atual do Supabase como a função autentica o usuário e quais variáveis o Supabase injeta nela, porque isso mudou com as chaves novas.
- A decisão (quem pode, qual entrada vale) fica num arquivo puro, sem dependência do Deno, testado no Vitest, incluindo o chamador sem permissão. A chamada de ponta a ponta se confere com `npx supabase functions serve` e um usuário fictício de cada perfil. No remoto de desenvolvimento, sem a pilha local, publique a função no projeto dev com `npx supabase functions deploy <nome> --use-api` (vínculo conferido, minha aprovação) e confira lá.
- A entrada é dado de fora e passa por validação. Resposta e logs não trazem dado pessoal; o erro devolve só uma mensagem genérica.
- Exemplo, o convite de usuário pela própria plataforma: o administrador chama a função, ela confere o perfil dele, convida pelo e-mail (`auth.admin.inviteUserByEmail`) e grava o evento no histórico. A linha de perfil nasce pelo gatilho de "Login e perfis"; a função não a cria de novo. O e-mail do convite também depende do SMTP próprio.
- Publicar função em produção só pelo roteiro "Publicar no banco de produção" do `/ship`, com minha aprovação.

## Publicação

Publicar no banco de produção, publicar o site e fazer backup só pelos roteiros de `.claude/regras/producao.md`, com minha aprovação no momento. A primeira publicação exige antes a "Revisão de segurança para produção", no mesmo arquivo.

## Ciclo de teste e migração do desenvolvimento

O `/setup` registra em `.scratch/inicio-projeto.md` qual dos três ciclos o projeto usa. Em todos, o teste vem antes da migração, e a migração nova leva junto, no mesmo commit, o teste de banco e os tipos atualizados.

- **A. Docker local** ("banco: local"). `npx supabase start` (saída descartada), teste de banco que falha em `supabase/tests/`, migração (`npx supabase migration new`), `npm run db:reset`, `npm run test:db`, `npm run db:types`. O `supabase test db` mostra "FAIL" porque os testes devolvem o resultado como exceção (formato para o editor SQL): valem as linhas `ok` e `not ok`.
- **B. Remoto de desenvolvimento, porta do banco aberta** ("banco: testes pelo script"). Teste que falha, migração, `npx supabase db push` (vínculo conferido), `npm run test:db` (script `scripts/testar-banco.mjs`), `npm run db:types` (por `--project-id`).
- **C. Remoto de desenvolvimento, porta do banco fechada** ("banco: testes pelo GitHub"). A porta 5432 (e a 6543) fica bloqueada em algumas redes; o teste de banco e a migração rodam no GitHub Actions. Ordem: teste que falha, **migração (commit e push da branch)**, workflow "Migrar banco de desenvolvimento" (informe só o nome do arquivo), workflow "Testes de banco", `npm run db:types` (por `--project-id`, que fala por HTTPS) e commit. Código que lê a tabela nova só se escreve depois dos tipos. O workflow de migração para com aviso se a migração já foi aplicada e recusa banco de outro projeto. Como disparar: `execucao.md`. Sem repositório no GitHub, este ciclo não existe: use B (se a porta abre) ou aplique a migração à mão no editor SQL, rodada por mim.

Migração já aplicada no remoto de desenvolvimento não se edita: o conserto é migração nova. Os arquivos do ensaio (`migracoesPendentes.mjs`, `relatorio-tap.mjs`, `travaDoProjeto.mjs`) vêm de `.claude/modelos/` e fazem o `testar-banco.mjs` rodar as migrações pendentes dentro da transação de cada teste.

## Conferências do /ship (passo 7)

Rode se a funcionalidade criou ou alterou arquivos em `supabase/migrations/`, `supabase/tests/` ou `supabase/functions/`. Confira em `supabase/AMBIENTES.md` (linha "vínculo atual") que o alvo é o desenvolvimento; no local, ligue o banco se estiver parado, com a saída descartada (`npx supabase start > /dev/null 2>&1`), porque ela traz a chave secreta local.

- **Testes:** pelo ciclo do projeto (A, B ou C), o `npm run test:db` passa (no ciclo C, o resultado do workflow "Testes de banco" na branch, confirmado por mim, vale). O teste `00_rls_ligada` garante que nenhuma tabela ficou sem RLS.
- **Tipos em dia:** `npm run db:types` e `git diff --exit-code src/types/database.ts`. Diferença: os tipos estavam desatualizados; comite e registre.
- **Migração destrutiva:** procure nas migrações novas por `drop table`, `drop column`, `rename` e `alter column ... type`. Se achar, destaque no relatório e peça minha confirmação antes de concluir.
- **Chave secreta:** procure `sb_secret_` e `service_role` em `src/`, no `.env.example` e em `supabase/functions/` (nesta pasta, só lida de variável de ambiente, nunca com o valor escrito). Qualquer outra ocorrência bloqueia a entrega.
- **Views e funções:** `create view` sem `security_invoker = true`, e `security definer` fora de schema não exposto ou sem `search_path` vazio, bloqueiam a entrega.
- **Funções** (`supabase/functions/`): a primeira ação é conferir quem chamou (logado, ativo, perfil exigido); a decisão tem teste no Vitest, com o chamador sem permissão; resposta e logs sem dado pessoal; ADR explicando por que a função existe; a chave só lida de variável de ambiente.
- **Perfis** (login): cada célula da tabela "quem pode o quê" da spec tem teste em `supabase/tests/`, com um usuário de cada perfil, um desativado e um visitante. Cadastro aberto continua desligado (`enable_signup = false` em `[auth]` e `[auth.email]`; no remoto, pergunte-me se segue desligado no painel; com login por provedor externo, confira o gancho que barra a criação). O gatilho que cria a linha de perfil tem teste.
- **Desempenho e concorrência:** coluna nova de filtro, ordenação ou junção com índice; nenhum `select *` nem consulta por item nas funções de acesso novas; tabela editável por mais de uma pessoa com `versao` e teste do conflito, ou a dispensa registrada na spec.
- **Storage** (arquivos): `01_buckets_privados` passa; nenhum bucket público (sem ADR); políticas de `storage.objects` com teste por perfil e nenhuma permite apagar pela interface; caminhos por identificador, sem nome de pessoa; bucket com tamanho máximo.
- **No relatório,** liste as políticas de cada tabela nova em linguagem simples, por perfil quando há login.
