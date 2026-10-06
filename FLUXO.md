# Fluxo detalhado — DevFlow v1.9

Referência do que acontece em cada etapa do funil, para acompanhar durante o desenvolvimento. Para as regras que o Claude Code segue, ver `CLAUDE.md` e `.claude/regras/`. Para termos técnicos, ver `GLOSSARIO.md`.

A ideia do projeto, o setup e as etapas 1 e 2 acontecem uma vez por projeto; cada funcionalidade nova começa na etapa 3. Demandas depois da primeira versão seguem a seção 7.

## Em qualquer etapa

- **Decisões** chegam com as opções em linguagem simples, o efeito de cada uma, uma recomendação e o que é mais fácil de desfazer. Se você responder "não sei", o Claude segue a opção mais conservadora e registra que foi escolha padrão.
- **Registro entre etapas:** o que uma etapa produz e a seguinte usa (a proposta visual aprovada, o resumo do projeto, o plano, as decisões) vai para um arquivo em `.scratch/` antes de a etapa terminar. A conversa não conta como registro.
- **Próximo passo:** ao fim de cada etapa, o Claude diz qual é o próximo comando e o modelo da tabela do Funil de Trabalho (no `CLAUDE.md`) e pede que você rode `/cost`, que só vale na conversa aberta. Cada sessão vira uma linha em `.scratch/custos.md` (data, funcionalidade, etapa, valor). Para trocar de modelo, abra uma sessão nova (no app desktop, um chat novo) e comece pelo `/status`. O handoff só entra quando há algo que os arquivos não guardam, numa pausa de dias ou troca de máquina, se o claude-mem estiver fora do ar ou se você pedir.
- **Marcos:** antes de cada passo grande e em cada entrega, o Claude cria um marco no git (`marco/data-descricao`), para onde o `/voltar` consegue retornar.
- **Registros por funcionalidade:** tudo de uma funcionalidade fica em `.scratch/<funcionalidade>/`: `spec.md`, `issues/` (tickets), `plano.md` (ou um `plano-<número>.md` por ticket), `desvios.md` e, numa iniciativa grande, `mapa.md`. O `<funcionalidade>` é um nome curto com hífens (`login-perfis`).
- **Regra de parada:** depois de três tentativas sem resolver o mesmo problema, o Claude para e oferece opções.
- **Skill ausente ou que recusa:** se uma skill recusar ser acionada pelo Claude, ele devolve o comando pronto para você rodar. Se ela não existir na sessão, ele pede que você rode `/reload-skills` uma vez e, se continuar ausente, para e mostra as opções. Trocar por outra skill, ou fazer o trabalho dela à mão, só com sua aprovação.
- **Conflitos:** quando duas instruções se chocam, o Claude diz qual conflito viu e qual regra seguiu. Em segredos, dado pessoal, banco e comandos destrutivos, vale sempre a mais cautelosa.
- **Itens não testados:** na primeira vez que executa algo da lista de `.claude/regras/nao-testados.md`, o Claude anota em `.scratch/melhorias-protocolo.md` o que era esperado e o que aconteceu. Quem avalia é você.
- **Dados pessoais:** se aparecerem, o Claude para de trabalhar com eles, avisa e pergunta sobre o claude-mem. Dado pessoal real só existe em produção: testes e desenvolvimento usam dados inventados, e a carga real é feita por você, fora da sessão (a pasta `dados-reais/` fica fora do git e o Claude não a lê).
- **Necessidade nova no meio de um ticket** vai para um ticket separado ou para `.scratch/backlog.md`; o ticket atual não cresce.
- **Commits** passam sempre pelo pre-commit (lint, typecheck, testes). O Claude nunca contorna esse bloqueio.
- **Trava de git:** um hook bloqueia, antes de rodarem, os comandos que apagam histórico ou descartam mudanças não comitadas. Ele olha só o comando em si (texto entre aspas e mensagem de commit são ignorados) e reconhece as formas comuns de disfarçar o comando: opção abreviada, `git checkout <arquivo>`, alias, PowerShell, `cmd`, `wsl` e caminho do Windows. Bloqueia também o commit que pula o pre-commit. Ela reduz acidentes e não enxerga tudo: script gravado em arquivo e variável que monta o comando escapam, e nesses casos vale a regra do `CLAUDE.md`. Se bloquear algo, o Claude explica o que queria fazer e você roda o comando no seu terminal, se concordar.
- **Banco de dados** (projetos com Supabase): o Claude lê `.claude/regras/banco.md` antes de mexer no banco, trabalha só no ambiente de desenvolvimento e confere o alvo (linha "vínculo atual" de `supabase/AMBIENTES.md`) antes de alterar o banco. Estrutura muda por migração, toda tabela tem RLS com teste, e produção só recebe mudanças com sua aprovação. Com login, o cadastro aberto fica desligado, você cria os usuários no painel do Supabase e cada política é testada com um usuário de cada perfil. Com arquivos, o bucket é privado e abre por URL assinada.

## 0a. Ideia do projeto — uma vez por projeto

**Comando:** `/projeto`. **Skill:** `superpowers:brainstorming`. Você copia os arquivos do DevFlow para a pasta nova, abre o Claude Code e roda `/projeto`. Se começar descrevendo a ideia sem rodar o comando, o Claude propõe o `/projeto` e aproveita o que você já disse. Antes de qualquer pergunta, ele confere se o projeto está no escopo do DevFlow (aplicação web com interface); se não estiver, avisa e pergunta como seguir.

0. Se você já tem uma especificação escrita, o Claude a lê inteira antes de perguntar, guarda uma cópia em `.scratch/especificacao.md`, pergunta só o que ela deixa em aberto e leva as decisões em aberto dela para o `.scratch/backlog.md`. Se a especificação divide o trabalho em fases, só a primeira vira a lista de funcionalidades, e as demais vão para o backlog com o prefixo do projeto (por exemplo "EP v2"). Uma especificação com a ordem de construção dispensa o `wayfinder`.
1. Conversa sobre o projeto inteiro, uma pergunta de cada vez: o que faz, para quem, funcionalidades principais em ordem de prioridade, por quanto tempo vai existir e quem vai mantê-lo, se envolve dados pessoais, se os dados precisam ser vistos por mais de uma pessoa ou em mais de um computador (o que decide se haverá banco), se terá login e perfis e quem cria os usuários, se guarda arquivos enviados, se a instituição exige registrar também quem consultou cada dado e se depende de outros sistemas ou tem dados atuais para importar.
2. Grava o resumo em `.scratch/projeto.md`, que o setup, a concepção, o `/planejar` e o `/status` leem depois. Com login, a primeira funcionalidade da lista é sempre o login.
3. Se a ideia mudar muito mais adiante, o `/projeto` roda de novo e atualiza o mesmo arquivo, dizendo o que pode ter sido afetado.

## 0b. Setup inicial — uma vez por projeto

**Comando:** `/setup`. Só roda se `.scratch/projeto.md` existir; se não existir, o Claude pede o `/projeto` antes. Os números abaixo são os mesmos do comando.

0. Confere a versão do Node (22.22.2 ou mais novo, ou 24.15 ou mais novo) e se o git tem nome e e-mail configurados.
1. Lê o resumo do projeto.
2. **Perguntas iniciais:** usa a resposta sobre dados pessoais do resumo do projeto (se houver, sugere desativar o claude-mem) e pergunta se você quer a auditoria dos pacotes de terceiros (se sim, lê os hooks e scripts de cada plugin e explica o que fazem). As respostas ficam em `.scratch/inicio-projeto.md`, e as perguntas não se repetem.
3. Cria o projeto com o scaffold do Vite (React + TypeScript, com ESLint) numa subpasta e traz os arquivos para a pasta do projeto sem sobrescrever os do DevFlow; depois instala as dependências.
4. Monta o ambiente de teste: Vitest, jsdom e Testing Library (que simulam o navegador nos testes), relatório de cobertura com piso de 70%, scripts `npm test`, `npm run test:coverage` e `npm run typecheck` e um teste-fumaça (um teste mínimo, que só confirma que a tela abre) passando.
5. Acrescenta ao ESLint as regras de complexidade (até 10 caminhos por função), tamanho de arquivo (até 300 linhas) e tamanho de função de lógica (20 linhas, e 40 nos hooks de `src/hooks/`).
6. Cria o `.npmrc` (`legacy-peer-deps=true`) e instala o `madge` com o script `npm run check:circular`, que procura dependências circulares.
7. **Banco de dados**, se o resumo do projeto pede dados compartilhados, login ou arquivos enviados. Este passo também roda sozinho mais tarde, se o projeto passar a precisar de banco.
   - O DevFlow usa o Supabase; se o projeto tiver uma exigência que ele não atende, o Claude diz e pergunta antes de seguir.
   - Você escolhe o ambiente de desenvolvimento: Supabase local, via Docker (recomendado), ou um projeto remoto só para desenvolver. No remoto, `supabase login` e `link` são seus, no seu terminal. Se a máquina não tem Docker, os testes de banco rodam por um script do DevFlow, que se conecta ao projeto de desenvolvimento; você cria o arquivo `.env.banco.local` com a cadeia de conexão desse projeto.
   - O Claude instala o Supabase CLI e cria o `supabase/AMBIENTES.md` (com a linha "vínculo atual"), o ponto único de conexão (`src/lib/supabase.ts`), os scripts `db:types`, `test:db` e, no local, `db:reset`, e um teste que falha se alguma tabela ficar sem RLS.
   - O `supabase start` imprime também a chave secreta, então o Claude o roda com a saída descartada. Você roda `npx supabase status` no seu terminal e copia a URL e a chave publicável para o `.env.local`, que o Claude nunca lê.
   - Com login, o Claude desliga o cadastro aberto (no remoto de desenvolvimento, você desliga no painel) e lhe entrega um comando que confirma que o cadastro é recusado. Com arquivos, cria o teste que falha se algum bucket for público.
8. Confere que `.scratch/` não está no `.gitignore` e acrescenta `.claude/worktrees/` e `dados-reais/` a ele.
9. `git init`, primeiro commit e o marco de início.
10. `setup-matt-pocock-skills`, com specs e tickets em arquivos locais do `.scratch/`.
11. `impeccable init`.
12. **Pre-commit**, montado à mão: Husky e lint-staged. A partir daí, todo `git commit` roda lint (com as regras novas), typecheck e testes, e é bloqueado se algo falhar. Cobertura e dependência circular ficam para o `/ship`, para não deixar cada commit lento.
13. **Trava de git:** os arquivos vêm no pacote do DevFlow. O Claude confere que estão no projeto, roda os testes dela e faz um teste ao vivo com um comando inofensivo.

Ao final, o Claude grava a linha `setup concluído em` no `.scratch/inicio-projeto.md` e comita. É por essa linha que os outros comandos sabem que o setup terminou.

## 1. Concepção visual

**Skills:** `frontend-design`, `apple-design-skill` — via `/concepcao-livre` ou `/concepcao-premium`

1. `frontend-design` lê o resumo do projeto e propõe paleta, tipografia e conceito visual, evitando padrões genéricos de template (fontes padrão, gradientes roxos, cards dentro de cards) — sem gerar código.
2. Se nenhum produto ou sujeito estiver definido na conversa, a skill escolhe um concreto por conta própria, para ancorar decisões específicas em vez de generalizar.
3. Apresenta a proposta e aguarda confirmação antes de seguir.
4. No modo premium, `apple-design-skill` lê a documentação real do HIG (não memória genérica) e reestrutura a mesma proposta em grid de 8px, tipografia fluida, materiais/desfoques restritos à navegação — adaptado para web. Se o `/concepcao-livre` já rodou na conversa e não foi rejeitado, o conceito dele é reaproveitado como primeira etapa.
5. Depois da sua aprovação, a proposta é gravada em `.scratch/identidade-visual.md` (paleta com os códigos, fontes, escala, espaçamentos, layout e textos de cada estado).

## 2. Implementar identidade

**Skills:** `impeccable:impeccable shape`, `mattpocock-skills:code-review` — via `/implementar-identidade`

1. Lê a proposta em `.scratch/identidade-visual.md` e cria o marco `antes-identidade`.
2. Compara o `PRODUCT.md` com o resumo do projeto; se divergirem em algo que muda a tela, pergunta qual vale.
3. `shape` lê o contexto do projeto e devolve um resumo de escopo, com perguntas quando a decisão não está clara (ex.: se seções já implementadas herdam os novos tokens, se conteúdo de boilerplate deve ser substituído). Ele não escreve código.
4. Aguarda a sua confirmação do resumo.
5. Aplica o código real — tokens CSS, tipografia, estrutura — substituindo o boilerplate, mantendo comportamento e testes existentes intactos.
6. Roda a suíte de testes, typecheck e build, e confere a tela aberta no computador e no celular (por uma ferramenta de pré-visualização, ou pedindo que você olhe).
7. Comita e roda `code-review` sobre o diff antes de liberar o próximo passo.

## 3. Planejar

**Skills (modo completo):** `superpowers:brainstorming` (só com a ideia em aberto) → `mattpocock-skills:grill-with-docs` (você roda) → `mattpocock-skills:to-spec` (você roda) → `mattpocock-skills:to-tickets` (você roda, só se houver mais de uma entrega) — via `/planejar`

**Antes de escolher o modo**

1. O Claude lê o resumo do projeto e o `CONTEXT.md`.
2. Confere se as funcionalidades anteriores têm a marca de entrega na spec. Se alguma não tem, avisa e oferece rodar o `/ship` dela antes (recomendado) ou seguir, registrando a pendência no backlog.
3. Se todas as funcionalidades da lista já foram entregues e não há demanda nova, para sem criar marco e oferece `/projeto`, `/demanda` ou encerrar o ciclo.
4. Em projeto com login, se o login e os perfis ainda não foram entregues, essa é a funcionalidade a planejar, e nunca no modo curto. As demais dependem de saber quem é quem.
5. Se a funcionalidade já foi entregue e volta a mudar, a spec ganha a linha `Em revisão desde`.
6. Se ela precisa de banco, login ou arquivos e o projeto ainda não tem, o caminho é o passo de banco do `/setup` antes.
7. Iniciativa que não cabe numa sessão passa antes pelo `wayfinder`, que a divide num mapa de partes; uma especificação anexada com a ordem de construção cumpre esse papel.
8. Importador de dados reais só é planejado depois que você entrega uma amostra com nomes inventados no formato da fonte.
9. Avalia o tamanho da funcionalidade, mesmo quando ela vem do resumo do projeto. Se cabe numa entrega, mexe numa tela só, não cria regra de negócio e não muda os dados, propõe o modo curto.

**Modo completo**

1. Cria o marco de início da funcionalidade.
2. `brainstorming` entra só quando a ideia ainda está aberta: você diz que não sabe como resolver, ou há mais de uma abordagem razoável. Nesse caso, propõe 2 ou 3 abordagens técnicas, baseadas nos componentes visuais já implementados. Se você chegou com a solução definida, o Claude pula esta etapa e diz que pulou.
3. `grill-with-docs` sabatina casos-limite, decisões de arquitetura e riscos, ponto a ponto, trazendo a resposta recomendada em cada pergunta, e atualiza `CONTEXT.md` e registros de decisão (ADRs) como efeito colateral da própria sabatina. Se ela não existir na sessão, o Claude mostra as opções; com o `grill-me`, que não grava esses arquivos, ele os grava depois.
4. `to-spec` formaliza a especificação técnica; o comando que o Claude devolve já traz o ponto de teste padrão (a tela inteira). A spec fica em `.scratch/<funcionalidade>/spec.md`. Se a funcionalidade já tinha spec (mudança em algo existente), o mesmo arquivo é atualizado.
5. O Claude confere a spec: ela abre com um parágrafo explicando como a funcionalidade resolve o problema e, para cada tela que carrega dados, descreve o que aparece enquanto carrega, quando não há dados e quando dá erro (no projeto com banco, inclusive falha de conexão). Se a funcionalidade mexe no banco, a spec ganha a seção Modelo de dados: tabelas e colunas, quem pode ler, criar, alterar e apagar (cada linha vira uma política de RLS; com login, uma tabela "quem pode o quê" por perfil, e quais perfis veem cada dado pessoal), os arquivos e buckets, as regras que o banco impõe por gatilho, as regras de estado (transições permitidas, o que acontece ao voltar, o que é derivado em vez de guardado) e se a migração pode apagar dados. Os critérios que só se conferem olhando a tela levam a marca `[visual]`. Se há especificação em `.scratch/especificacao.md`, a spec é conferida contra ela. Se faltar algo, ele acrescenta e avisa.
6. O Claude avalia quantas entregas a funcionalidade tem. Se ela cabe numa entrega só, propõe pular os tickets e tratar a spec como o único ticket. Se tem várias entregas, `to-tickets` fatia a especificação em tickets, declarando a dependência entre eles, e cada ticket abre com o seu parágrafo de como resolve.
7. Para cada ticket (ou para a spec), o Claude sugere `/executar-simples` ou `/executar-complexo`, o modelo recomendado e a troca de sessão.

`grill-with-docs`, `to-spec` e `to-tickets` são skills de invocação direta — nunca acionadas "nos bastidores". O comando para em cada uma e devolve o comando pronto para você rodar.

**Modo curto** — para funcionalidade pequena (cabe numa entrega, mexe numa tela só, sem regra de negócio nova nem mudança nos dados)

1. Marco de início. O modo curto é proposto pelo Claude e só começa com a sua confirmação (ou quando você mesmo pede, ou quando a demanda veio do `/demanda` como funcionalidade pequena).
2. O Claude faz de três a cinco perguntas diretas, sem brainstorming nem sabatina.
3. Se aparecer regra de negócio, outra tela ou mudança nos dados, ele para e avisa que a demanda virou funcionalidade nova, com modo completo.
4. Escreve uma spec curta: parágrafo de como resolve, estados de tela (se carrega dados) e critérios de pronto. ADR só se surgiu decisão que valha lembrar.
5. Depois da sua aprovação, sugere `/executar-simples`.

## 4. Executar (por ticket)

**Skills:** `mattpocock-skills:implement` (ticket simples) ou `superpowers:writing-plans` + `superpowers:executing-plans` (ticket complexo) — via `/executar-simples` ou `/executar-complexo`

**Ticket simples:** o Claude resume o ticket numa frase e devolve o comando `implement` pronto; quem roda é você. A skill então:
1. escreve o teste primeiro e confirma que falha (vermelho);
2. implementa até o teste passar (verde);
3. roda typecheck e a suíte completa, revisa o próprio código, resolve os achados reais da revisão e só então comita.

**Ticket complexo:**
1. `writing-plans` quebra o ticket num plano com várias tasks sequenciais, cada uma com seu ciclo vermelho→verde e critério de verificação. O plano contém só a execução (ordem, arquivos, testes) e cita os requisitos da spec ou do ticket pela referência, sem reescrevê-los. Fica salvo em `.scratch/<funcionalidade>/plano.md` (com tickets, `plano-<número do ticket>.md`).
2. O trabalho roda numa branch comum, criada na pasta principal (`git switch -c <funcionalidade>`), sem worktree. A branch protege a principal e mantém uma pasta só, o que evita pré-visualização com código antigo, testes contados em dobro e falhas de instalação. Worktree só quando você pedir trabalho em paralelo.
3. `executing-plans` executa task por task — testa, implementa, verifica, comita — e o Claude marca as caixas do plano. Se uma task revela que uma decisão de uma task anterior precisa mudar, corrige as tasks seguintes do plano antes de continuar.
4. Ao final de todas as tasks, costuma rodar `code-review` sobre o diff acumulado do ticket inteiro.
5. A branch é integrada à principal e apagada com `git branch -d`.

**Ticket que mexe no banco:** primeiro o teste de banco que falha (ex.: usuário anônimo tentando apagar uma linha), depois a migração com a tabela, a RLS e as políticas, e então `db:reset` (no remoto de desenvolvimento, `supabase db push`), `test:db` e `db:types`. A interface acessa o banco por funções de acesso, um módulo por tabela. Migração, teste e tipos vão no mesmo commit.

Os tickets ficam em `.scratch/<funcionalidade>/issues/`; sem essa pasta, a spec é o único ticket. Ticket concluído ganha a linha `Concluído em` no fim do arquivo. Se a sessão cair no meio, a sessão seguinte começa pelo `/status`, que lê o plano salvo, os commits e os testes, e continua da próxima task incompleta.

## 5. Polir

**Skills:** `impeccable:impeccable audit` e `polish` — via `/polir`. Roda a cada ciclo de execução. Depois do polimento, o Claude roda os testes, comita e registra os achados no `desvios.md`.

1. `audit` inspeciona a interface em cinco dimensões — acessibilidade, performance, design responsivo, theming, integridade de implementação — com nota por dimensão e achados classificados por prioridade (P1/P2/P3).
2. Se a integridade de implementação falhar por identidade visual nunca implementada (boilerplate genérico misturado com conteúdo real), a skill recusa disfarçar isso como polimento e recomenda reconstrução separada, em vez de aplicar.
3. `polish` aplica só as correções dentro do escopo (foco de teclado, alvo de toque, autocomplete, links externos) e roda o detector mecânico de novo antes de comitar.

Se houver mais tickets pendentes, o próximo passo é o próximo ticket (voltar à etapa 4) — não `/ship` ainda.

## 6. Entregar

Quando o `/ship` roda depois de um bug ou ajuste (porque mexeu em dependência, migração, função, login, permissão ou validação de entrada), ele parte do commit anterior à correção, pula a conferência de entregas anteriores e grava uma marca nova na funcionalidade onde estava o bug.

**Skills:** `mattpocock-skills:code-review` (condicional), `anthropic-skills:security-auditor` (condicional), `/security-review` (condicional, embutido no Claude Code) — via `/ship`. Ferramentas: cobertura do Vitest e `madge`.

0. Confere se as funcionalidades anteriores têm a marca de entrega. Se alguma não tem, oferece cobri-la neste mesmo `/ship`, com a revisão partindo do marco de início da mais antiga.
1. Valida o checklist de Definition of Done: cada critério de aceite da spec (ou dos tickets) conferido contra um teste ou uma execução, mais testes, typecheck e build. O que o teste automático não alcança (diagramas, aparência; a spec os marca com `[visual]`) é conferido abrindo a tela e entra no relatório como verificado manualmente, ou como presumido se você não puder olhar na hora.
2. Roda `code-review` se ainda não houve revisão sobre o diff final, ou se o código mudou depois da última revisão (ex.: correções do `/polir`). A revisão roda em dois eixos, em subagentes paralelos: Standards (segue as convenções do `CLAUDE.md`?) e Spec (atende ao que o ticket pediu?). As alegações de cada sub-agente são conferidas contra o código real antes do relatório.
3. Confere o ADR de cada dependência de produção nova. Roda `security-auditor` se houve dependência nova ou atualizada no `package.json` ou se ainda não existe `.scratch/security.md` — classifica vulnerabilidades por severidade e CVE. No Windows, o script da skill falha; o agente roda `npm audit --json` direto e produz o mesmo relatório.
4. Se a funcionalidade envolve login ou permissões, dados pessoais, dados que chegam de fora (inclusive o que é lido do armazenamento do navegador) ou mudança em migração ou política de RLS, pede que você rode `/security-review`, comando embutido do Claude Code que procura falhas de segurança no código escrito no projeto (o passo anterior só olha os pacotes de terceiros). Corrige os achados reais com teste e explica os falsos alarmes. Se o comando não achar mudanças para revisar, o Claude faz uma revisão de reserva e avisa.
5. Roda a suíte de testes uma última vez, com o relatório de cobertura. Abaixo do piso de 70%, aponta as partes sem teste e pergunta o que fazer; nunca escreve teste só para bater o número.
6. Procura dependências circulares (`npm run check:circular`). Se achar, explica e registra como achado.
7. **Banco de dados**, se a entrega criou ou alterou migrações, testes de banco ou Edge Functions: recria o banco local e roda os testes de banco, confere se os tipos estão em dia, procura migração que apaga dados (e pede sua confirmação) e procura a chave secreta no código. Procura também view sem `security_invoker` e função `security definer` em schema exposto, e, para cada Edge Function, confere que ela começa conferindo quem chamou e que a decisão dela tem teste. Com login, confere que cada célula da tabela "quem pode o quê" tem teste e que o cadastro aberto continua desligado. Com arquivos, confere que nenhum bucket é público, que as políticas do Storage têm teste e que ninguém apaga arquivo pela interface. O relatório lista as políticas de cada tabela nova em linguagem simples, por perfil quando há login.
8. Se algo divergiu do plano — decisão técnica mudada, achado do `/polir` ou de auditoria, dependência circular, migração destrutiva, tipos desatualizados, alegação de ticket invalidada — acrescenta uma entrada datada em `.scratch/<funcionalidade>/desvios.md`. Entradas antigas nunca são editadas.
9. Se a entrega divergiu do que a spec descreve, atualiza a spec para refletir o sistema como ele ficou. A versão do plano original continua no histórico do git.
10. Se a auditoria de dependências rodou, salva o relatório em `.scratch/security.md` (um só para o projeto inteiro).
11. Pede que você rode `/cost` na conversa aberta (ou `/usage`, se o seu plano não mostrar valor) e anota uma linha em `.scratch/custos.md`, somando as sessões anteriores da funcionalidade.
12. Grava a marca de entrega, a não ser que um passo obrigatório não tenha rodado ou um achado tenha ficado aberto. Critério visual que ninguém olhou e cobertura abaixo do piso aceita por você entram na marca como ressalva. A marca é a linha `Entregue em` no fim da spec, no lugar de `Em revisão desde` se havia, e o marco `entrega-<funcionalidade>`.
13. Termina com um relatório em linguagem simples, em três partes: o que foi entregue e corrigido; o que foi verificado, e como; o que foi presumido sem verificação, com o motivo. Fecha dizendo o que depende de você.

**Publicar no banco de produção** (só a pedido, depois de um `/ship` concluído). Na primeira vez, o Claude confere que a revisão de segurança para produção foi feita. Depois:
- você cria o projeto de produção, e o Claude confere com você o painel antes de qualquer mudança: cadastro aberto desligado (o projeto novo nasce com ele ligado), SMTP, endereços de redirecionamento, plano, região e membros;
- ele lista as migrações ainda não publicadas e quais podem apagar dados;
- você vincula a ferramenta à produção no seu terminal, e ele anota em "vínculo atual";
- você faz o backup (na primeira publicação não há o que guardar);
- ele publica com sua aprovação (migrações e, se houver, Edge Functions, depois de você cadastrar os segredos);
- você volta o vínculo para o desenvolvimento, e ele registra a publicação no `AMBIENTES.md`;
- com login, na primeira vez, você cria o seu usuário no painel e roda o comando que o promove a administrador.

**Publicar o site** (só a pedido, depois de um `/ship` concluído; na primeira vez, exige a revisão de segurança para produção): o Claude registra a hospedagem em `.scratch/publicacao.md`, roda o build com as variáveis de produção (quando o build é no seu computador, elas ficam num `.env.production.local` que você cria), procura na pasta publicada chave secreta e o endereço do banco local, lista as variáveis de ambiente que a hospedagem precisa (as do banco de produção, que você configura), confere com você o cadastro fechado e o envio de e-mail no projeto de produção e, com sua aprovação, publica. Você abre o endereço e confere. A publicação ganha um marco.

**Backup e restauração** (a pedido, ou antes de publicar migração em produção): o backup cobre o banco e, se há arquivos, o Storage, que o backup do banco não leva. O Claude confere com você o plano do Supabase (no gratuito não há backup automático) e entrega os comandos prontos, em três arquivos: estrutura, dados e papéis. Quem roda é você, e o Claude não lê os arquivos. Antes de a produção receber dado real, e depois de cada migração que apaga dados, você restaura o backup num projeto Supabase separado, criado só para o teste, compara a contagem de linhas e abre um arquivo restaurado. As datas ficam em `AMBIENTES.md`.

**Revisão de segurança para produção** (a pedido, e exigida antes da primeira publicação): olha o projeto inteiro, do primeiro ao último commit. Num projeto sem banco, ficam só as partes de chaves, hospedagem, código e inventário. O Claude cria um marco e confere o banco (toda tabela com RLS e teste, toda view com `security_invoker`, toda função `security definer` em schema não exposto, todo bucket privado, nada no banco fora das specs), procura chave secreta no código, nas funções, no `seed.sql`, no `.env.example` e no histórico do git, e lista o que você deve olhar nos painéis do Supabase e da hospedagem, se eles já existem; se a produção ainda não foi criada, esses itens são conferidos no roteiro de publicação, antes da primeira mudança (cadastro fechado, SMTP próprio, endereços de redirecionamento, plano e backup, membros da equipe, segredos, variáveis de ambiente). Repete pela API as ações proibidas de cada perfil, pede o `/security-review` do código inteiro (ou faz a revisão de reserva por pasta), roda o `security-auditor` e grava o inventário de dados pessoais em `.scratch/lgpd-inventario.md`, que você leva ao encarregado de dados. Achados e a linha final ficam em `.scratch/pre-producao.md`.

## 7. Demandas depois da primeira versão

**Comando:** `/demanda` — você descreve a necessidade em linguagem normal; se a descrição não bastar, o Claude faz até duas perguntas; depois classifica, explica o caminho e devolve o comando para começar, depois da sua confirmação.

| Tipo | Exemplo | Caminho |
|---|---|---|
| Bug | O formulário aceita e-mail inválido | Marco → investiga a causa → teste que reproduz o bug (vermelho) → correção (verde) → `code-review` → `/polir` se mexeu na interface → spec e `desvios.md` atualizados, se a spec estava errada → `/ship` se mexeu em dependência, migração, função, login, permissão ou validação de entrada → relatório com causa, verificado e presumido |
| Ajuste pequeno | Trocar um texto, uma cor, um rótulo | `/executar-simples` direto → `/polir` se visual → `/ship` só se o `package.json` mudou |
| Funcionalidade pequena | Um botão de exportar; um filtro a mais | `/planejar` no modo curto → `/executar-simples` → `/polir` se mexeu na interface → `/ship` |
| Mudança em funcionalidade existente | Tornar um campo obrigatório; mudar uma regra | `/planejar` (a spec existente é atualizada e ganha `Em revisão desde`; o porquê vira ADR novo) → execução → `/polir` → `/ship` |
| Funcionalidade nova | Um módulo que não estava previsto | Entra no resumo do projeto → `/planejar` (com o passo "Iniciativa grande", se não cabe numa sessão) → funil normal |
| Mudança de identidade visual | Redesenho da marca | `/concepcao-*` → `/implementar-identidade` → `/polir` |

Na dúvida entre dois tipos, o Claude escolhe o mais rigoroso e explica. A exceção é a dúvida entre funcionalidade pequena e nova: aí ele pergunta.

O backlog (`.scratch/backlog.md`) pode ser puxado a qualquer momento pelo `/demanda`.

## 8. Voltar atrás

**Comando:** `/voltar` — você diz o que quer desfazer, em linguagem normal.

1. Se houver mudanças não comitadas, o Claude avisa e pergunta o que fazer com elas antes de seguir.
2. Lista os marcos e as entregas recentes em linguagem simples, e explica o que se perde voltando a cada um.
3. Recomenda uma opção e aguarda sua confirmação.
4. Cria um marco do estado atual (para que a própria volta possa ser desfeita) e desfaz com `git revert`, sem apagar o histórico. Se o problema for uma dependência, desfaz o commit que a trouxe (ou recupera os dois arquivos do marco com `git show`, que a trava libera) e reinstala.
5. Se a volta desfaz migrações, recria o banco local e os tipos. Arquivos já enviados ao Storage continuam lá: o Claude avisa e pergunta o que fazer com eles. Migração já publicada em produção não é apagada: desfazer vira migração nova, publicada com sua aprovação.
6. Roda testes, typecheck e build.
7. Se uma funcionalidade inteira saiu, atualiza a spec dela (retirando a marca de entrega) e registra o motivo no `desvios.md`.

## 9. Onde estou

**Comando:** `/status` — não altera nada. Lê o resumo do projeto, tickets, marcas de entrega, backlog, marcos, histórico, o handoff mais recente e o resultado dos testes, e responde em linguagem simples: o que está pronto, o que está em andamento, o que falta, pontos de atenção (incluindo funcionalidade sem `/ship`, handoff desatualizado, migrações ainda não publicadas em produção, backup ou teste de restauração ausente ou antigo, produção ou site publicado sem a revisão de segurança para produção, e "vínculo atual" apontando para produção) e o próximo comando, com o modelo da tabela. É o comando de abertura de toda sessão nova e de retorno ao projeto depois de uma pausa. Quando o handoff e os arquivos divergem, valem os arquivos.
