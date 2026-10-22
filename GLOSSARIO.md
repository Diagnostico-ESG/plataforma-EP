# Glossário — DevFlow v1.9

Termos técnicos explicados em linguagem simples, conforme foram surgindo nas conversas sobre o protocolo. Atualizar conforme novos termos aparecerem.

## Git e controle de versão

**Git** — programa instalado localmente (não depende de internet) que guarda o histórico completo de mudanças de um projeto. Cada "commit" é um retrato do estado do código num momento específico, com data, autor e mensagem. Permite voltar atrás, comparar versões, e juntar mudanças feitas em paralelo. Diferente do GitHub, que é um serviço online que hospeda uma cópia desse histórico na nuvem — o Git funciona sozinho, sem o GitHub.

**Branch** — uma "linha do tempo" paralela do código, criada para testar ou construir algo sem mexer na versão principal (a `main` ou `master`, conforme o projeto) até ter certeza de que funciona.

**Worktree** — recurso do Git que permite ter duas branches abertas ao mesmo tempo, em pastas diferentes no computador, sem precisar trocar de uma para outra o tempo todo. O DevFlow não usa por padrão, porque a segunda pasta atrapalhava a pré-visualização, os testes e a instalação; só entra quando você pede trabalho em paralelo.

**Marco (tag)** — um nome fixo dado a um ponto do histórico do Git (ex.: `marco/2026-10-02-inicio-formulario-contato`). Funciona como um marcador de página: permite voltar exatamente àquele estado depois, sem precisar achar o código do commit.

**Marca de entrega** — a linha `Entregue em AAAA-MM-DD (commit ...)` que o `/ship` grava no fim da spec de uma funcionalidade, junto com um marco `entrega-<funcionalidade>`. Mostra que a funcionalidade passou pela revisão final. O `/planejar` e o `/status` usam a marca para avisar quando uma funcionalidade ficou sem `/ship`. Se a funcionalidade volta a mudar depois de entregue, ganha abaixo a linha `Em revisão desde`, até o próximo `/ship`.

**Diff** — o que mudou entre duas versões do código, linha a linha. É sobre o diff de uma funcionalidade que o `code-review` trabalha.

**Merge** — juntar uma branch de volta à principal. No `/executar-complexo`, a branch da funcionalidade é integrada à principal ao final e depois apagada.

**Repositório (repo)** — a pasta do projeto inteira, com todo o histórico do Git. "Repositório remoto" é uma cópia dele num servidor (GitHub, por exemplo); o DevFlow funciona sem.

**Pull Request (PR)** — pedido formal de revisão antes de juntar uma branch, numa plataforma como o GitHub. O DevFlow funciona sem. O `/security-review` compara a branch atual com a principal e pode não achar nada num projeto sem repositório remoto ou já integrado; nesse caso o Claude faz a revisão de reserva.

**Revert** — jeito de desfazer uma mudança no Git criando um registro novo que anula o anterior, sem apagar nada do histórico. É o oposto do `reset --hard`, que apaga o histórico e não tem volta.

**Trava de git** — programa (um hook do Claude Code) que lê cada comando que o Claude vai rodar no terminal e cancela os que apagam histórico ou descartam trabalho não salvo, como `reset --hard`, `clean`, `push --force`, `branch -D`, `tag -d` e `stash drop`, e o commit que pula o pre-commit. Olha só o comando em si: um texto entre aspas ou uma mensagem de commit que cite esses termos passa. O que você digita no seu terminal não passa por ela.

**Heredoc** — jeito de escrever um texto de várias linhas dentro de um comando de terminal, entre dois marcadores iguais (por exemplo `<<EOF` e `EOF`). A trava de git ignora esse texto, a não ser que ele seja entregue a um shell para ser executado.

## Testes e TDD

**TDD (ciclo vermelho → código → verde)** — disciplina de escrever o teste antes do código. **Vermelho**: o teste é escrito primeiro e falha, porque o código ainda não existe. **Código**: a implementação é escrita com o único objetivo de fazer esse teste passar. **Verde**: o teste roda de novo e passa, confirmando que funciona de verdade — não só na aparência.

**Vitest** — a ferramenta que roda os testes do projeto (`npm test`). Os testes da trava de git também rodam nele.

**Pre-commit** — checagem que o git roda antes de aceitar cada commit. No DevFlow: lint dos arquivos alterados, typecheck e testes. Se algo falhar, o commit não acontece, e o Claude corrige a causa.

**Teste de regressão** — teste criado especificamente porque um erro já aconteceu uma vez, para garantir que ele nunca volte a passar despercebido.

**Mock** — peça "de mentira" que substitui algo externo real (um envio de e-mail, uma chamada de API) só para fins de teste, evitando depender de internet ou afetar sistemas reais. Estilo recomendado: nomeado e reutilizável (ex.: `FakeEmailSender`), não um stub solto e improvisado dentro de um único teste.

**Cobertura de testes** — porcentagem do código que os testes executaram pelo menos uma vez. O relatório aponta as linhas que nenhum teste tocou, o que ajuda a achar caminhos esquecidos. Não diz se os testes conferem alguma coisa: um teste que roda o código sem verificar o resultado conta do mesmo jeito. Por isso o DevFlow usa um piso baixo (70%) e nunca pede teste só para bater o número.

**Teste E2E (ponta a ponta)** — um robô usa o sistema num navegador, como uma pessoa faria: abre a página, preenche, clica e confere o resultado. Ainda não faz parte do DevFlow (ver "Implementações futuras" no README).

**Teste de mutação** — sabotagens pequenas e propositais no código para ver se os testes percebem. Se nenhum teste falhar, os testes daquele trecho são fracos. Ainda não faz parte do DevFlow.

**DoD (Definition of Done)** — checklist objetiva que define o que precisa ser verdade para uma tarefa ser considerada pronta (testes passando, build limpo, etc.) — tira a subjetividade de "pronto" virar opinião de cada um.

## Ferramentas e ambiente

**Terminal, shell e PATH** — o terminal é a janela onde se digitam comandos; o shell é o programa que os interpreta (Bash, PowerShell). O PATH é a lista de pastas onde o shell procura os programas: "o Node precisa estar no PATH" quer dizer que digitar `node` tem de funcionar em qualquer pasta.

**Pipe e redirecionamento** — o pipe (`|`) entrega a saída de um comando ao seguinte; o redirecionamento (`>`) grava a saída num arquivo. A trava de git olha os dois, porque um comando perigoso pode chegar ao shell por eles.

**Dependência** — pacote de terceiros que o projeto usa. "De desenvolvimento" só roda na sua máquina (testes, lint); "de produção" vai junto para o navegador de quem usa o sistema, e por isso cada uma nova ganha um ADR.

**`.gitignore`** — arquivo que lista o que o git não deve guardar: senhas (`.env.local`), pastas geradas (`node_modules`, `dist`), dados reais (`dados-reais/`).

**Proxy** — servidor da rede corporativa por onde passa todo o acesso à internet. O navegador o usa sozinho; `npm` e `git` precisam ser configurados (seção 9 do README).

**Node.js** — motor que roda JavaScript fora do navegador, direto no computador. É a base por trás de quase tudo no projeto: `npm`, `npx`, Vite, Husky e a trava de git rodam em cima dele.

**npm / npx** — `npm` é o gerenciador de pacotes que vem com o Node (instala bibliotecas como Vite, React, Vitest). `npx` baixa e roda uma ferramenta na hora, sem instalar permanentemente.

**`.npmrc`** — arquivo de configurações do npm, na raiz do projeto. O DevFlow cria um com `legacy-peer-deps=true`, que manda o npm ignorar exigências de versão opcionais entre pacotes (o `madge` pede TypeScript 5 e o projeto usa a 6). Efeito colateral: o npm deixa de instalar sozinho pacotes que outros pacotes exigem, então eles precisam ser instalados de forma explícita.

**Vite** — ferramenta que criou e roda o projeto: serve a página localmente com atualização instantânea a cada salvamento (durante o desenvolvimento) e monta a versão final otimizada (o build).

**React** — biblioteca de código que monta as telas em peças reutilizáveis chamadas componentes (um botão, um cartão de processo, uma janela) e atualiza só a peça afetada quando um dado muda. É o que desenha toda a interface do projeto; o Vite a roda e a empacota.

**SPA (Single Page Application, aplicação de página única)** — site que o navegador baixa uma vez e, depois, troca só o conteúdo da tela a cada clique, sem recarregar tudo (como o Gmail). A plataforma é uma SPA feita com React e Vite, ligada a um banco na nuvem (Supabase).

**Next.js** — estrutura pronta (framework) para criar aplicações com React que também têm servidor: monta páginas no servidor, cria rotas automaticamente e permite escrever funções de servidor no mesmo projeto. Serve para sites públicos que precisam abrir rápido e aparecer bem em buscas. A plataforma não usa: é um sistema interno, com servidor próprio no Supabase, e o React com Vite basta.

**SSR (Server-Side Rendering, renderização no servidor)** — o servidor monta a página pronta antes de enviá-la, em vez de mandar uma página vazia que o JavaScript do navegador preenche. É o que o Next.js faz. Numa SPA, como a da plataforma, a montagem acontece no navegador.

**SEO (Search Engine Optimization, otimização para buscadores)** — conjunto de cuidados para um site aparecer bem nos resultados do Google. Só importa para sites públicos; a plataforma, atrás de login, não precisa disso.

**Husky** — ferramenta que faz o Git obrigar checagens (lint, typecheck, testes) a rodar a cada `git commit`, bloqueando o commit se algo falhar. Configurado uma vez pelo `/setup`, roda sozinho em todo commit futuro.

**lint-staged** — complemento do Husky que roda o lint só nos arquivos que entraram no commit, e não no projeto inteiro.

**Lint** — checagem automática de estilo e erros bobos no código (variável não usada, import esquecido), sem rodar o programa. No projeto, feito pelo ESLint.

**ESLint** — a ferramenta de lint do projeto. Além das regras de estilo, o DevFlow configura três limites: complexidade, tamanho de arquivo e tamanho de função.

**Complexidade ciclomática** — quantos caminhos diferentes existem dentro de uma função. Cada `if`, `else`, laço ou condição com `&&` abre mais um. Quanto mais caminhos, mais difícil de testar e de entender. O DevFlow limita a 10 por função.

**Dependência circular** — dois arquivos que dependem um do outro (A importa B, e B importa A). Causa erros estranhos ao carregar a página e amarra os arquivos, que não podem mais mudar separados. O `madge` procura esses casos no `/ship`.

**jsdom e Testing Library** — peças que simulam um navegador dentro dos testes, para testar telas sem abrir uma janela.

**Teste-fumaça** — teste mínimo, que só confirma que a tela abre sem quebrar. É o primeiro teste do projeto, criado no `/setup`.

**Typecheck** — confere se cada informação no código está no formato certo (ex.: não tentar usar texto onde deveria ser número), antes de rodar. No projeto, o script `npm run typecheck` roda no pre-commit.

**Build** — processo que transforma o código-fonte (TypeScript, JSX) em HTML/CSS/JavaScript puro que o navegador entende, otimizado e pronto para produção. Diferente de lint/typecheck/teste: confirma que o projeto está estruturalmente completo (sem import quebrado, sem arquivo faltando), não que o comportamento está certo.

**Hook** — pequeno programa que roda sozinho em certos momentos, sem pedir licença. Os hooks do Git rodam a cada commit (é assim que o Husky funciona). Os hooks do Claude Code rodam no início da sessão ou antes e depois de cada ação do Claude (é assim que o Ponytail, o claude-mem e a trava de git agem "sozinhos"). Em React, "hook" é outra coisa: uma função que guarda estado ou efeitos de uma tela (`useAlgumaCoisa`), em `src/hooks/`.

**claude-mem** — plugin opcional que guarda um resumo das sessões passadas. Grava o que o Claude lê, por isso dado pessoal e chave nunca devem entrar na conversa.

**Subagente** — outro Claude, aberto pelo principal para fazer uma parte do trabalho em paralelo (a revisão de código usa dois).

**Boilerplate** — o conteúdo de exemplo que vem no projeto recém-criado (a tela inicial do Vite, por exemplo) e é substituído pelo conteúdo real.

**Modelo (Opus, Sonnet)** — as versões do Claude. O Opus raciocina melhor e custa mais; o Sonnet é mais rápido e barato. O DevFlow indica qual usar em cada etapa (tabela do `CLAUDE.md`).

**Token** — dois sentidos. Em IA, a unidade em que os modelos leem e escrevem texto, mais ou menos um pedaço de palavra; é por token que se mede o uso e se cobra o custo. Em design, um token CSS é uma variável com um valor da identidade visual (uma cor, um espaçamento), usada em todo o código.

**Skill** — pacote de instruções que ensina o Claude a fazer um tipo de tarefa (sabatina, revisão de código, polimento). Algumas o Claude aciona sozinho; as de **invocação direta** só rodam quando você digita o comando, e por isso os comandos do DevFlow param e devolvem o comando pronto.

**Plugin** — conjunto de skills, comandos e hooks instalado de uma vez no Claude Code (Matt Pocock Skills, Superpowers, Impeccable).

**Ponytail** — plugin que lembra o Claude de não acrescentar o que ninguém pediu (YAGNI). Quando ele deixa algo de fora de propósito, marca `skipped: [X] → add when [Y]` no fim da resposta.

**Cache de prompt** — memória de curto prazo do servidor que evita reprocessar, a cada mensagem, a parte da conversa que não mudou. Deixa as respostas mais rápidas e baratas. É perdido quando se troca de modelo ou se edita o `CLAUDE.md` no meio de uma sessão.

**Handoff** — documento curto que passa o estado de uma sessão para a próxima. No DevFlow, leva só o que os arquivos do projeto não guardam (uma decisão em aberto, o raciocínio de uma tarefa pela metade) e é salvo em `.scratch/`. O estado em si é lido pelo `/status`.

## Banco de dados

**Supabase** — serviço que oferece banco de dados, login e armazenamento de arquivos prontos. A interface do projeto conversa direto com ele, sem um servidor próprio no meio.

**Armazenamento local do navegador (localStorage)** — espaço que o navegador oferece a cada página para guardar pequenos dados no próprio computador, sem servidor. Os dados ficam só naquele navegador, naquele computador, e se apagam quando a pessoa limpa os dados de navegação. Serve para projetos sem banco, como um sandbox. Quem usa o navegador pode ler e alterar o que está lá, por isso o `/ship` trata esse conteúdo como dado que chega de fora.

**Ambiente de desenvolvimento / produção** — o banco onde o Claude trabalha e testa, e o banco que as pessoas usam de verdade. Ficam separados para que um erro durante o desenvolvimento não apague dados reais. Os dois estão registrados em `supabase/AMBIENTES.md`.

**Docker** — programa que roda outros programas em caixas isoladas dentro do computador. O Supabase local usa o Docker para rodar uma cópia completa do banco na sua máquina.

**Migração** — arquivo com as instruções que mudam a estrutura do banco (criar uma tabela, acrescentar uma coluna). Fica no git, em `supabase/migrations/`, e o banco inteiro pode ser recriado a partir delas. Migração que já foi para a produção não é editada: correção vira migração nova.

**Migração destrutiva** — migração que pode apagar dados, como remover uma coluna ou mudar o tipo dela. O `/ship` avisa e pede confirmação.

**RLS (Row Level Security)** — regras dentro do banco que dizem quem pode ler e alterar cada linha. No Supabase, é o que protege os dados, porque a chave usada pela interface é pública.

**Política** — cada regra de RLS. Ex.: "qualquer pessoa pode criar uma sugestão"; "ninguém apaga sugestões pela interface".

**Chave publicável** — chave (`sb_publishable_...`) que a interface usa para falar com o Supabase. Pode ficar exposta no navegador; a proteção vem das políticas. Substitui a antiga chave `anon`.

**Chave secreta** — chave (`sb_secret_...`, antes `service_role`) que ignora todas as políticas e tem acesso total aos dados. Nunca vai para a interface nem para o git. Projetos DevFlow não a usam; se uma funcionalidade a exigir, ela só pode ficar numa Edge Function, com ADR e a sua aprovação.

**Seed** — dados de exemplo carregados no banco de desenvolvimento (`supabase/seed.sql`). Sempre fictícios.

**Tipos gerados** — arquivo que o Supabase CLI escreve a partir das tabelas do banco, dizendo ao TypeScript o formato de cada dado. Se o banco muda e os tipos não, o typecheck acusa a diferença.

**Schema** — divisão do banco em compartimentos com nome (`public`, `private`, `auth`, `storage`). O que está em `public` fica acessível pela API do Supabase; o DevFlow guarda as funções sensíveis num schema que a API não expõe.

**Security definer** — opção de uma função do banco que a faz rodar com os poderes de quem a criou, e não de quem a chama. Útil para ler a tabela de perfis dentro das políticas, e perigosa se a função ficar chamável de fora: por isso fica num schema não exposto, com `search_path` vazio.

**Vínculo atual** — o projeto do Supabase a que a ferramenta de linha de comando está ligada no momento (desenvolvimento ou produção). Fica anotado em `supabase/AMBIENTES.md`, e o Claude confere antes de qualquer comando que altere o banco.

**pgTAP** — ferramenta para escrever testes dentro do próprio banco. No DevFlow, testa as políticas de RLS.

**Perfil** — o papel de cada usuário no sistema (por exemplo administrador, integrante, consulta). Fica numa tabela própria, ligada ao usuário do login, e as políticas de RLS usam o perfil para decidir quem pode o quê. A linha de cada usuário nasce por um gatilho, e o primeiro administrador é promovido por você, com um comando SQL no painel. Todo usuário novo nasce com o perfil de menor permissão.

**Cadastro aberto** — a possibilidade de qualquer pessoa criar uma conta sozinha. Nos projetos DevFlow com login, ela fica desligada: quem cria os usuários é você, no painel do Supabase, sem escrever código.

**Tabela "quem pode o quê"** — tabela da spec com uma linha por tabela e ação (ler, criar, alterar, apagar) e uma coluna por perfil, incluindo o visitante sem login e o usuário desativado. Cada célula vira uma política e um teste.

**Trigger (gatilho)** — regra que o banco executa sozinho quando algo acontece, como gravar uma linha no histórico a cada mudança de status ou impedir que uma versão seja apagada. Fica numa migração e tem teste em `supabase/tests/`.

**Storage** — a parte do Supabase que guarda arquivos (documentos, imagens). Os arquivos ficam em "buckets", espécie de pastas com regras de acesso próprias. No DevFlow, todo bucket é privado.

**URL assinada** — endereço temporário para abrir um arquivo de um bucket privado. Vale por pouco tempo e é gerado na hora de abrir, então um endereço copiado deixa de funcionar logo.

**Edge Function** — pequeno programa que roda no servidor do Supabase, fora do navegador. É o único lugar onde a chave secreta pode ficar. As regras dela estão em `.claude/regras/banco.md`, ainda sem teste num projeto real.

**Dados reais (`dados-reais/`)** — planilhas, e-mails e bases com dados de pessoas de verdade. O Claude escreve e testa o importador com arquivo fictício; a carga real é feita por você, fora da sessão. A pasta `dados-reais/` fica fora do git e o Claude nunca lê o que há nela.

**Teste de restauração** — restaurar um backup num banco de teste e conferir que os dados e os arquivos voltaram. Um backup que nunca foi restaurado não está provado.

**View (visão)** — consulta guardada no banco que se comporta como uma tabela, muito usada para os números do dashboard. Por padrão, ela lê com os poderes de quem a criou e ignora as regras de RLS das tabelas; criada com `security_invoker = true`, passa a obedecer às regras de quem a consulta. No DevFlow, toda view leva essa opção.

**SMTP** — o servidor que envia e-mails de verdade. O serviço de e-mail padrão do Supabase só entrega a membros da equipe do projeto e serve para teste; em produção, a recuperação de senha e os convites exigem um SMTP próprio, da instituição ou de um serviço de envio.

**Fixture** — arquivo de exemplo guardado no projeto para os testes usarem (um diagrama, uma planilha). Vai para o git, por isso não pode ter nome de pessoa, e-mail ou informação sigilosa.

**Revisão de segurança para produção** — conferência do projeto inteiro, de ponta a ponta, feita antes da primeira publicação: banco, chaves, painéis do Supabase e da hospedagem, acesso por perfil, código e pacotes. Está no `/ship` e deixa o registro em `.scratch/pre-producao.md`.

**Inventário de dados pessoais** — lista, gerada na revisão para produção, de cada tabela, coluna e bucket com dado de pessoa, para que fim, quem vê, onde fica e por quanto tempo. É o documento que você leva ao encarregado de dados.

**Verificado manualmente** — no relatório do `/ship`, o que os testes automáticos não alcançam (como o desenho de um diagrama) e que foi conferido abrindo a tela. Se ninguém olhou, o item entra como presumido.

**Ref do projeto (project ref)** — o código que identifica cada projeto no Supabase (aparece no endereço do painel). É por ele que a ferramenta de linha de comando sabe a qual projeto se ligar.

**CLI** — ferramenta usada por comandos no terminal, sem janelas. O "Supabase CLI" é a do Supabase (`npx supabase ...`).

**Hospedagem** — o serviço que deixa o site no ar, num endereço público. Recebe os arquivos gerados pelo build.

**Variável de ambiente** — valor configurado fora do código e lido pelo programa quando ele roda (ex.: a URL do banco, no `.env.local`). Permite usar o mesmo código com bancos diferentes.

## Estrutura do roteiro

**Scaffold** — estrutura inicial de um projeto gerada automaticamente por uma ferramenta (ex.: `npm create vite@latest`), com pastas, arquivos de configuração e uma página de exemplo prontos. É o ponto de partida antes de qualquer código próprio.

**Resumo do projeto (`.scratch/projeto.md`)** — o que o projeto é, para quem, quais as funcionalidades principais em ordem, se envolve dados pessoais e se depende de outros sistemas. Criado pelo `/projeto` e lido pelas etapas seguintes.

**Identidade visual (`.scratch/identidade-visual.md`)** — a proposta de cores, fontes, espaçamentos, layout e textos aprovada na concepção. Fica em arquivo para sobreviver à troca de sessão, e o `/implementar-identidade` lê dele.

**CONTEXT.md** — arquivo do projeto que guarda o contexto de domínio: termos, entidades, atores e regras de negócio fixas. Criado e atualizado pelo `grill-with-docs` durante as sabatinas do `/planejar`; fora delas, o Claude propõe a redação e grava depois que você confirma. É a fonte única desse tipo de informação; o `CLAUDE.md` só aponta para ele.

**Spec (especificação)** — documento que descreve o que uma funcionalidade faz: regras, comportamentos, casos-limite. Fica em `.scratch/<funcionalidade>/spec.md`. No modo completo é gerada pelo `to-spec`; no modo curto, escrita pelo Claude. É mantida atualizada: descreve o sistema como ele é hoje. Versões anteriores ficam no histórico do Git.

**Estados de tela** — o que uma tela que busca dados mostra enquanto os dados chegam (carregando), quando não há nada a mostrar (vazio) e quando algo falha (erro). Sem isso, a pessoa vê uma tela em branco e não sabe se travou, se não há dados ou se quebrou.

**Funcionalidade pequena** — algo novo que cabe numa entrega, mexe numa tela só, não cria regra de negócio e não muda a estrutura dos dados. Segue o modo curto do `/planejar`, com poucas perguntas e spec enxuta.

**ADR (Architecture Decision Record)** — registro de uma decisão e do seu porquê, criado pelo `grill-with-docs` durante a sabatina (ou pelo Claude, no modo curto e quando entra uma dependência de produção nova). Nunca é editado depois: quando a decisão muda, cria-se um ADR novo que substitui o anterior, e os dois permanecem, contando a história das decisões.

**Backlog** — lista de ideias e necessidades registradas para depois (`.scratch/backlog.md`). Serve para que algo descoberto no meio de um ticket não se perca nem faça o ticket atual crescer.

**Changelog** — registro das mudanças de cada versão de algo, com o que mudou e por quê. No protocolo, é o `CHANGELOG.md`.

**Task** — passo individual dentro de um plano maior (gerado por `writing-plans`). Cada task tem seu próprio ciclo vermelho → código → verde.

**Sabatina** — a conversa do `/planejar` em que o `grill-with-docs` faz perguntas ponto a ponto sobre a funcionalidade (casos-limite, riscos, decisões), sempre com uma resposta recomendada, e registra o que foi decidido.

**Ticket** — unidade de trabalho gerada pelo `to-tickets`, maior que uma task. Algo que, sozinho, entrega algo demonstrável. Pode ser simples (uma task, via `/executar-simples`) ou complexo (várias tasks, via `/executar-complexo`).

## Princípios de código

**YAGNI (You Aren't Gonna Need It)** — não construir solução genérica ou complicada pensando num futuro que talvez nunca chegue. Base do princípio Ponytail.

**DI (Dependency Injection / Injeção de Dependência)** — em vez de um componente já vir com algo fixo "por dentro" (ex.: um jeito específico de enviar e-mail), esse "algo" entra de fora, como parâmetro. Facilita trocar ou simular esse algo em teste, sem reescrever o componente inteiro. Recomendado quando o valor muda com o tempo ou é reutilizado — não é regra dura para tudo.

**SRP (princípio da responsabilidade única)** — cada função, componente ou arquivo faz uma coisa só. Quando um arquivo cresce porque faz várias coisas, a saída é dividi-lo.

**API / endpoint** — ponto de acesso por onde um sistema conversa com outro. A interface do projeto fala com o Supabase pela API dele; endpoint é o endereço de cada ponto de acesso.

**CVE** — identificador padrão de uma vulnerabilidade de segurança conhecida (ex.: CVE-2026-1234). Aparece nos relatórios do `security-auditor`.
