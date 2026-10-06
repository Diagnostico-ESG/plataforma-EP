# DevFlow — v1.9 (2026-10-05)

*Antigo Protocolo Alex Macedo. O nome mudou na v1.2; o histórico anterior está no `CHANGELOG.md`.*

Funil de desenvolvimento para Claude Code, com skills e plugins de terceiros orquestrados por comandos próprios. Este README é para você: o Claude Code não o lê automaticamente. O que o agente precisa seguir está no `CLAUDE.md`, nos comandos e em `.claude/regras/`. Este README vai junto para cada projeto porque o `/setup` manda o Claude consultar a seção 9 (rede corporativa) quando a instalação falha.

## 1. Arquivos deste pacote

- `CLAUDE.md` — regras que valem em qualquer momento e a tabela do funil, com o modelo de cada etapa. Lido pelo Claude Code em toda mensagem. Vai na raiz do projeto. Desde a v1.9 traz só as regras curtas; o detalhe fica nos comandos e em `.claude/regras/`.
- `.claude/regras/banco.md` — regras de banco de dados (ambientes, migrações, chaves, views e funções, login e perfis, Storage, Edge Functions). O Claude lê a seção certa antes de mexer no banco.
- `.claude/regras/nao-testados.md` — lista do que ainda não foi testado num projeto real. Na primeira execução de cada item, o Claude registra o resultado em `.scratch/melhorias-protocolo.md`.
- `.claude/modelos/testar-banco.mjs` — script que roda os testes de banco sem Docker. O `/setup` o copia para `scripts/` quando o banco de desenvolvimento é remoto e a máquina não tem Docker.
- `.claude/commands/*.md` — os treze comandos do protocolo. Funil: `projeto`, `setup`, `concepcao-livre`, `concepcao-premium`, `implementar-identidade`, `planejar`, `executar-simples`, `executar-complexo`, `polir`, `ship`. Apoio: `demanda` (bugs, ajustes e mudanças depois da primeira versão), `voltar` (desfazer algo já feito) e `status` (em que ponto o projeto está).
- `.claude/settings.json` e `.claude/hooks/` — a trava contra comandos git destrutivos: o hook `bloquear-git-destrutivo.mjs` e o teste dele. O `/setup` confere que estão no projeto e roda o teste.
- `FLUXO.md` — o que acontece, passo a passo, dentro de cada etapa. Referência para consultar durante o desenvolvimento.
- `GLOSSARIO.md` — termos técnicos em linguagem simples.
- `CHANGELOG.md` — o que mudou em cada versão do protocolo, e por quê.
- `README.md` — este arquivo.

## 2. Quando usar e quando não usar

**Serve para:** aplicações web novas em React + TypeScript, com ou sem banco de dados no Supabase, construídas do zero com o protocolo, e para a evolução delas depois da primeira versão (via `/demanda`).

**Não serve para:** scripts e análises em Python ou R, backend sem interface (APIs, rotinas de processamento, servidores próprios), projetos de Power BI, e aplicativos nativos de celular. Nesses casos, o funil força etapas visuais e ferramentas do ecossistema JavaScript que não se aplicam.

**Sistema que já existia antes do DevFlow:** as partes aproveitáveis são as Convenções de Código, o pre-commit e o caminho de bug do `/demanda`, mas ainda não há um caminho definido para adotá-las. O comando `/adotar` está registrado em "Implementações futuras" (seção 11). Um sistema criado com o DevFlow não precisa disso: tudo que vier depois da primeira versão entra pelo `/demanda`.

## 3. Skills e plugins necessários

Instale todos uma vez, na sua conta; valem para qualquer projeto depois. Onde há dois métodos, o primeiro é o oficial (via marketplace); o segundo é a alternativa quando a rede bloqueia acesso direto ao GitHub/npm (ver seção 9).

**Nota de confiabilidade:** os comandos `/plugin marketplace add` do Ponytail e do Impeccable vêm da documentação oficial de cada projeto. Os do Matt Pocock Skills e do Apple Design Skill seguem o mesmo padrão, mas neste protocolo só foram testados pela via alternativa (ZIP manual). Se o comando oficial falhar, use a alternativa.

### Matt Pocock Skills
Skills de engenharia (`grill-with-docs`, `to-spec`, `to-tickets`, `implement`, `code-review`, `wayfinder`, `handoff`, `setup-matt-pocock-skills`, entre outras). Namespace: `/mattpocock-skills:`.

- **Repositório:** https://github.com/mattpocock/skills
- **Instalação:**
  ```
  /plugin marketplace add mattpocock/skills
  /plugin install mattpocock-skills@mattpocock-skills
  ```
- O ZIP gerado pelo GitHub deste repositório contém um link simbólico (`AGENTS.md` → `CLAUDE.md`). Na via alternativa, substitua pelo arquivo real antes de subir.
- As skills `setup-pre-commit` e `git-guardrails-claude-code` não existem na instalação testada. Desde a v1.6, o DevFlow não depende delas: o `/setup` monta o pre-commit à mão e a trava de git vem pronta no pacote.

### Superpowers
Skills de processo (`brainstorming`, `writing-plans`, `executing-plans`, `test-driven-development`, `systematic-debugging`, entre outras). Namespace: `/superpowers:`, com o nome completo da skill (ex.: `/superpowers:writing-plans`, não `/superpowers:write-plan`).

- **Repositório (marketplace):** https://github.com/obra/superpowers-marketplace
- **Repositório (plugin):** https://github.com/obra/superpowers
- **Instalação:**
  ```
  /plugin marketplace add obra/superpowers-marketplace
  /plugin install superpowers@superpowers-marketplace
  ```

### Ponytail
Disciplina de simplicidade (YAGNI), ativa em toda resposta de código.

- **Repositório:** https://github.com/DietrichGebert/ponytail
- **Instalação:**
  ```
  /plugin marketplace add DietrichGebert/ponytail
  /plugin install ponytail@ponytail
  ```
- **Requisito:** `node` precisa estar no PATH da sessão (os hooks são scripts Node.js). Sem isso, a skill fica inativa sem avisar. A trava de git do DevFlow também roda em Node. O projeto pede Node 22.22.2 ou mais novo na linha 22, ou 24.15 ou mais novo: o Vitest, o jsdom e o lint-staged não rodam em versão anterior, e o passo 0 do `/setup` confere isso antes de instalar qualquer coisa.
- **Como reconhecer que agiu:** nesta instalação, o marcador de atalho deliberado aparece como `skipped: [X] → add when [Y]` ao final da resposta do Claude, e não como comentário `ponytail:` no código (formato da documentação pública), que não aparece nesta instalação.

### Impeccable
Design fluency (`audit`, `polish`, `shape`). Namespace confirmado: `/impeccable:impeccable <comando>`.

- **Repositório:** https://github.com/pbakaus/impeccable (o plugin instalável fica na subpasta `/plugin`, não no repositório inteiro)
- **Instalação:**
  ```
  /plugin marketplace add pbakaus/impeccable
  /plugin install impeccable@impeccable
  ```
- O `shape` só faz perguntas e devolve um resumo do escopo; ele não escreve código. A implementação vem depois da sua confirmação, pelo fluxo normal do Impeccable.

### Apple Design Skill
HIG (Human Interface Guidelines), adaptado para web neste protocolo. Namespace: `/apple-design-skill:apple-design-skill`.

- **Repositório:** https://github.com/NutshellEngineering/apple-design-skill
- **Instalação:**
  ```
  /plugin marketplace add NutshellEngineering/apple-design-skill
  /plugin install apple-design-skill@apple-design-skill
  ```

### security-auditor
Auditoria de dependências via `npm audit`. Namespace: `/anthropic-skills:security-auditor`.

- **Origem:** repositório `claude-skill-security-auditor` (a URL completa não foi registrada; o pacote foi recebido como `claude-skill-security-auditor-main.zip`). O `SKILL.md` original não tinha cabeçalho YAML (`name`/`description`); foi acrescentado manualmente antes do upload.
- **Instalação:** upload avulso em claude.ai → Configurações → Capabilities → Skills → Meus → Fazer upload de habilidade.
- **Problema conhecido no Windows:** o script da skill usa `2>/dev/null`, que o `cmd.exe` não reconhece. O `ship.md` já instrui o agente a rodar `npm audit --json` direto nesse caso. Correção definitiva: editar `scripts/index.ts` da skill trocando o redirecionamento por um compatível com Windows.

### claude-mem (opcional — memória persistente entre sessões)
Não faz parte do funil, mas foi usado durante o desenvolvimento deste protocolo.

- **Repositório:** https://github.com/thedotmack/claude-mem
- **Instalação:** `npx claude-mem install --provider claude` (usa sua assinatura Claude, sem login no serviço de nuvem do claude-mem). Escolha o runtime "Worker" e o modelo Haiku para compressão.
- **Atenção:** ele grava observações de tudo que passa pela sessão num banco local, por tempo indeterminado, e envia essas observações ao modelo para compressão. Não use em projetos com dados pessoais ou sensíveis, salvo liberação de quem responde por esses dados.
- **Limite:** depende de cota de inferência do provedor externo, que pode se esgotar sem aviso prévio. Quando isso acontece, o plugin para de gravar. Reiniciar não resolve: é preciso esperar a cota renovar. O que fica entre sessões são os registros do projeto: as specs e o `desvios.md` em `.scratch/`, e os ADRs.

### Plugins oficiais da Anthropic (já disponíveis no Claude Code Desktop)
`frontend-design` e `code-review` (`@claude-plugins-official`). Não precisam de instalação manual. O `code-review` oficial é diferente do `/mattpocock-skills:code-review` usado no funil.

### Ferramentas de verificação (instaladas pelo `/setup` em cada projeto)

São programas comuns de desenvolvimento, gratuitos e de código aberto, instalados dentro de cada projeto como pacotes do npm. Não exigem nada na sua conta nem na sua máquina.

- **ESLint** — o `/setup` cria o projeto com a opção `--eslint` (o padrão atual do template é o Oxlint). O DevFlow acrescenta três regras: complexidade de no máximo 10 caminhos por função, arquivos de até 300 linhas e funções de lógica de até 20 linhas (40 nos hooks de `src/hooks/`). Roda no pre-commit.
- **Typecheck (`tsc -b`)** — confere os tipos do TypeScript. Roda no pre-commit.
- **Husky e lint-staged** — fazem o git rodar lint (só nos arquivos alterados), typecheck e testes a cada commit.
- **`@vitest/coverage-v8`** — gera o relatório de cobertura dos testes, com piso de 70%. Roda no `/ship`.
- **`madge`** — procura dependências circulares entre arquivos. Roda no `/ship`. Pede TypeScript 5, e por isso o `/setup` cria um `.npmrc` com `legacy-peer-deps=true`.

### Trava contra comandos git destrutivos (vem no pacote)

Um hook do Claude Code (`.claude/hooks/bloquear-git-destrutivo.mjs`, ligado por `.claude/settings.json`) lê cada comando que o Claude vai rodar no terminal e cancela os que a seção "Segurança e Recuperação" do `CLAUDE.md` proíbe. O que você digita no seu próprio terminal não passa por ele. Precisa do Node no PATH.

**O que bloqueia**
- Comandos que apagam histórico ou descartam trabalho não salvo: `reset --hard`, `clean`, `push --force`, `branch -D`, `checkout` de arquivo, `restore`.
- Apagar ou mover um marco (`tag -d`), apagar ramo ou tag no repositório remoto, apagar trabalho guardado (`stash drop`), remover uma pasta de trabalho à força.
- Apagar, mover ou escrever dentro da pasta `.git`, que guarda todo o histórico.
- Commit que pula o pre-commit (`--no-verify`).
- Alias do git, que é um apelido capaz de esconder um desses comandos.

**As formas que reconhece**
- Opção abreviada (o git aceita `--har` no lugar de `--hard`).
- O comando dentro de PowerShell, `cmd`, `wsl`, ou entregue a um shell por pipe.
- O comando atrás de outro (`timeout`, `find -exec`, `xargs`) ou depois de um redirecionamento.
- Caminho do Windows com barra invertida.

**O que não enxerga**
- Script gravado em arquivo (`node script.js`, `bash arquivo.sh`).
- Variável ou função que monta o comando.
- Texto codificado.
- Alias que você já tenha na sua configuração do git.
- `rebase` e `commit --amend`, que reescrevem commits e ficaram fora da lista.

Texto entre aspas e mensagem de commit são ignorados, para a trava não barrar quem só cita um comando. Se o Node não estiver no PATH, o hook não roda e nada é bloqueado: por isso o `/setup` faz um teste ao vivo. A trava reduz acidentes; a regra do `CLAUDE.md` continua valendo quando ela deixa passar.

### Revisão de segurança embutida no Claude Code

`/security-review` já vem com o Claude Code, sem instalação. Procura falhas de segurança no código escrito no projeto (permissão não conferida, dado de fora usado sem validação, chave no meio do código). O `security-auditor` só olha os pacotes de terceiros; os dois se complementam. O `/ship` pede que você o rode quando a funcionalidade envolve login ou permissões, dados pessoais ou dados que chegam de fora (inclusive o que é lido do armazenamento do navegador). Para olhar o projeto inteiro antes de a produção existir, o `/ship` traz o roteiro "Revisão de segurança para produção" (v1.8), que também grava o inventário de dados pessoais em `.scratch/lgpd-inventario.md` para você levar ao encarregado de dados. A primeira publicação, do banco ou do site, não segue sem essa revisão, a não ser por decisão sua registrada.

### Banco de dados: Supabase CLI e Docker (só em projetos com banco)

O `/setup` instala o Supabase CLI dentro do projeto, como pacote do npm. O ambiente de desenvolvimento recomendado é o **Supabase local**, que precisa do **Docker Desktop** instalado e ligado no computador; o Docker é instalado uma vez, fora do projeto. Quando o Docker não roda na máquina, a alternativa é um **projeto remoto só para desenvolvimento**, criado no painel do Supabase. Nos dois casos, o banco de produção é outro projeto, separado, e o Claude só publica nele pelo roteiro do fim do `/ship`, com sua aprovação.

**Sem Docker.** O banco de desenvolvimento fica num projeto remoto, e os testes de banco rodam pelo script do DevFlow (`scripts/testar-banco.mjs`), que se conecta direto a esse projeto. Você cria o arquivo `.env.banco.local` com a cadeia de conexão do projeto de desenvolvimento, que tem a senha do banco; o Claude não lê esse arquivo. O script só roda se a cadeia for do projeto de desenvolvimento. O que muda nesta variante: o backup de produção sai pelo painel (planos pagos) ou pelo `pg_dump`, e a Edge Function é conferida publicando no projeto de desenvolvimento.

A chave usada pela interface é a publicável (`sb_publishable_...`). As chaves antigas `anon` e `service_role` estão sendo descontinuadas pelo Supabase até o fim de 2026; projetos que ainda usam a `anon` precisam trocar.

**Regras de banco.** Ficam em `.claude/regras/banco.md` (desde a v1.9; antes, no `CLAUDE.md`). As principais:
- **Login e perfis:** cadastro aberto desligado, usuários criados por você no painel do Supabase (sem código e sem chave secreta), perfis numa tabela própria, com a linha de cada usuário criada por um gatilho e o primeiro administrador promovido por você com um SQL no painel, políticas testadas com um usuário de cada perfil, um desativado e um visitante. O login é sempre a primeira funcionalidade.
- **Arquivos no Storage:** bucket privado, URL assinada de curta duração, nome de arquivo por identificador, versões que não se apagam e um teste que falha se algum bucket for público.
- **Views e funções:** toda view nasce com `security_invoker = true` (senão ela ignora a RLS e deixa passar dado que a tabela esconderia), e função `security definer` fica só em schema que a API não expõe. O `/ship` procura os dois nas migrações novas.
- **E-mail em produção:** o serviço padrão do Supabase só entrega a membros da equipe do projeto e serve para teste. A recuperação de senha em produção exige SMTP próprio.

A chave secreta continua fora. Se uma funcionalidade a exigir (por exemplo, convidar usuários pela própria plataforma), o Claude para, mostra as opções e, aprovada uma delas, a chave fica só numa Edge Function, pelas regras da seção "Edge Functions" de `.claude/regras/banco.md`: a função confere por conta própria quem a chamou, a decisão dela tem teste, e a publicação passa pelo roteiro de produção do `/ship`. Esse caminho foi escrito sem teste num projeto real e a documentação do Supabase sobre autenticação de função está mudando; o Claude confere a versão atual na primeira função.

## 4. Como começar um projeto novo

1. Instalar os plugins da seção 3, se ainda não estiverem instalados na sua conta.
2. Criar a pasta do projeto e copiar para ela, a partir da cópia mestra (seção 10): `CLAUDE.md`, `README.md`, `FLUXO.md`, `GLOSSARIO.md`, `CHANGELOG.md` e a pasta `.claude/` inteira (`commands/`, `regras/`, `hooks/` e `settings.json`). Conferir a versão do Node (`node --version`): 22.22.2 ou mais novo na linha 22, ou 24.15 ou mais novo.
3. Abrir o Claude Code nessa pasta e rodar `/projeto`. É a conversa sobre a ideia do projeto inteiro: o que é, para quem, funcionalidades principais, dados pessoais, dependência de outros sistemas. O resultado fica em `.scratch/projeto.md`. Se você começar descrevendo a ideia sem rodar o comando, o Claude propõe o `/projeto` e aproveita o que foi dito. Se você já tem uma especificação escrita, anexe-a: o Claude a copia para `.scratch/especificacao.md`, pergunta só o que ela deixa em aberto e leva o modelo de dados e as regras dela para o `CONTEXT.md` na sabatina do `/planejar`.
4. Rodar `/setup`. Ele só segue se o resumo do projeto existir, e conduz: auditoria dos pacotes (opcional), scaffold do Vite com ESLint, ambiente de teste com cobertura e typecheck, regras de lint, `.npmrc` e checagem de dependência circular, banco de dados (se o projeto precisar), git, `setup-matt-pocock-skills`, `impeccable init`, pre-commit e conferência da trava de git.
5. Confirmar os nomes de comando reais digitando `/` no Claude Code. Plugins de terceiros mudam de versão, e o namespace pode variar. Se algum nome não bater, ajuste na cópia mestra.
6. Seguir o funil, a partir de `/concepcao-livre` ou `/concepcao-premium`.

## 5. Uso em projeto oficial

Antes de usar o protocolo em trabalho institucional ou com dados de terceiros:

- Verificar a legislação aplicável sobre uso de inteligência artificial na administração pública e sobre proteção de dados pessoais, incluindo normas internas do órgão sobre ferramentas de IA.
- Consultar a área de TI e o encarregado de dados sobre o uso de ferramentas de terceiros e sobre o envio do conteúdo do projeto para a API da Anthropic.
- Confirmar se o trabalho pode rodar numa conta pessoal do Claude ou se exige conta institucional. Os termos de uso de dados variam conforme o tipo de conta.
- Confirmar quais plugins são aceitos. A auditoria dos pacotes, oferecida no início de cada projeto, ajuda a responder isso.
- Decidir se o claude-mem pode ser usado.
- Em projeto com banco, confirmar onde os dados podem ficar: conta do Supabase (pessoal ou institucional), região dos servidores e se dados pessoais reais podem ir para lá. O contrato ou termo de tratamento de dados com o provedor, e a validação do jurídico e da TI, ficam fora do DevFlow: são decisões suas. Duas perguntas costumam surgir e são suas com o jurídico: se a instituição exige registrar também **quem leu** cada dado (o Supabase só registra o que muda; o `/projeto` pergunta isso), e como conciliar um histórico que nunca se altera com um pedido de **eliminação** de dados de uma pessoa.
- Em projeto com dados pessoais reais para importar (planilhas, e-mails, bases de outros sistemas): o Claude constrói e testa o importador com arquivo fictício, e a carga real é feita por você, fora da sessão, só no banco de produção. O melhor é manter os arquivos com dados reais fora da pasta do projeto. Se precisar deixá-los nela, use a pasta `dados-reais/`, que o git ignora e o Claude nunca lê. Lembre que o claude-mem grava o que o Claude lê.

## 6. Custo e escolha de modelo

- **Medir primeiro.** O Claude pede que você rode `/cost` antes de trocar de sessão e ao final de cada `/ship`, e anota uma linha por sessão em `.scratch/custos.md`, no formato `data | funcionalidade | etapa | valor`. O `/cost` só vale na conversa aberta: depois que ela fecha, o valor se perde. Se o seu plano não mostrar valor, o `/usage` dá o percentual. A soma das linhas dá o custo de cada funcionalidade. Vale conferir, depois de algumas entregas, se a medição compensa o atrito.
- **Planejamento proporcional.** Funcionalidade que cabe numa entrega não passa pelo `to-tickets`, e o plano dos tickets complexos não repete requisitos. Funcionalidade pequena usa o modo curto do `/planejar`, sem sabatina completa, e o `brainstorming` só roda quando a ideia ainda está aberta. O `/planejar` avalia o tamanho antes de escolher o modo.
- **Modelo por etapa.** A tabela do Funil de Trabalho, no `CLAUDE.md`, diz o modelo de cada comando: Opus para conversa e decisão (`/projeto`, concepção, `/planejar` completo, classificar demandas, bug difícil, revisão para produção), Sonnet para o resto. O Claude indica o modelo a cada lembrete de próximo passo. A troca é feita por você.
- **Trocar de modelo abre uma sessão nova** (no app desktop, um chat novo), com o modelo escolhido nela. Tudo que a etapa produziu já está em arquivo, e a sessão nova começa pelo `/status`, que lê os arquivos. O handoff (`/mattpocock-skills:handoff`, salvando em `.scratch/`) só entra quando há algo que os arquivos não guardam, ou numa pausa de dias ou troca de máquina. `/clear` + `/model` na mesma sessão fica para quando você pedir.
- **Plugins especializados só onde são usados.** Toda skill instalada carrega sua descrição em toda sessão. Hoje, desativar plugins por projeto não é confiável no Claude Code. O caminho mais seguro é instalar plugins de uso pontual (Supabase, Bright Data, GitHub) com escopo de projeto, só nos projetos que precisam deles, e conferir com `/context` se as descrições deixaram de aparecer nos demais. Skills enviadas pelo claude.ai só podem ser ligadas e desligadas no geral, em Configurações → Capabilities.
- **`CLAUDE.md` estável.** Ele entra no cache; cada edição no meio de uma sessão torna a resposta seguinte mais lenta e cara.

## 7. Status de validação

O protocolo foi validado em dois projetos de teste (sandbox): o ateliê de violões (v1.0) e a caixa de sugestões de simplificação (v1.2 a v1.5, de 25 a 30/09/2026, com três funcionalidades entregues e sem banco de dados). Nem tudo rodou na prática; `.claude/regras/nao-testados.md` lista os itens não testados, e o Claude relata o resultado na primeira execução de cada um.

| Item | Status |
|---|---|
| `/concepcao-livre` e `/concepcao-premium` | Validado |
| `/implementar-identidade` (brief e implementação pelo `shape`) | Validado (o `shape` só pergunta e resume; a implementação vem depois) |
| `/implementar-identidade` (verificação e `code-review` ao final) | Validado (28/09/2026) |
| Proposta visual guardada em arquivo entre a concepção e a implementação (v1.6) | Não testado (antes, a troca de modelo apagava a proposta) |
| `/planejar` com paradas nas skills de invocação direta (usando `grill-me`) | Validado |
| `/planejar` com `grill-with-docs` e `CONTEXT.md` | Validado (28 e 30/09/2026) |
| Parágrafo de "como resolve" e estados de tela na spec (v1.2) | Validado (28 e 30/09/2026) |
| Planejamento proporcional (spec sem tickets, plano sem repetir requisitos) | Validado (spec como ticket único, em duas funcionalidades) |
| Classificação de tamanho no `/planejar` e conferência de entregas anteriores (v1.6) | Não testado |
| Modo curto do `/planejar` e tipo "funcionalidade pequena" do `/demanda` (v1.2) | Não testado |
| Brainstorming só com ideia aberta (v1.2) | Validado (25/09/2026) |
| `/executar-simples` | Validado |
| `/executar-complexo` | Validado (três funcionalidades, com worktree) |
| Branch comum no lugar da worktree (v1.6) | Não testado |
| Lembretes de próximo passo dentro dos comandos | Testado com falha em parte (`/polir` e `/executar-*` não diziam onde procurar tickets pendentes; corrigido na v1.6) |
| `/polir`, com lembrete de próximo passo | Validado (30/09/2026) |
| `/ship` como era na v1.5 (revisão condicional, `security.md`, `desvios.md`, spec viva) | Validado (30/09/2026). Uma funcionalidade ficou sem `/ship`; a marca de entrega da v1.6 cobre isso. O que entrou depois (passo 0, marca de entrega, passo 7 de banco, ADR de dependência, entrada por bug, ressalva, roteiros de produção) não foi testado |
| Cobertura, dependência circular e relatório verificado/presumido no `/ship` (v1.2) | Validado |
| `/security-review` no `/ship` (v1.3) | Falhou sem repositório remoto, como previsto |
| Revisão de segurança de reserva (v1.3) | Validado |
| Marca de entrega no `/ship` (v1.6) | Não testado |
| Convenções de Código aplicadas pelo `code-review` | Validado (28 e 30/09/2026) |
| Ponytail | Observado nos testes (marcador `skipped:` nas respostas); sem registro datado |
| `security-auditor`, com o contorno do Windows | Validado |
| `/setup`: perguntas, scaffold, ambiente de teste, regras de lint, `madge` (v1.2) | Validado, com contorno do conflito do `madge` (`.npmrc` na v1.6) |
| `/setup`: passos de pre-commit e trava (v1.0 a v1.5) | Testado com falha (as skills citadas não existem na instalação) |
| `/setup` da v1.6: `--eslint`, `.npmrc`, typecheck, pre-commit e trava no pacote | Rodado num projeto Vite de teste; não testado num projeto real |
| Trava de git (versão do sandbox) | Validada; deu falso positivo em texto citado e bloqueou `git checkout --` três vezes |
| Trava de git da v1.6 (ignora aspas e heredoc) | 91 testes passam; ainda não vista ativa dentro do Claude Code |
| Trava de git da v1.9 (opção abreviada, checkout de arquivo, alias, PowerShell, cmd, wsl, tag, stash, worktree, `.git`, redirecionamento, texto entregue a um shell, commit sem pre-commit) | 317 testes passam. Em dois lotes adversariais escritos por revisores (609 comandos destrutivos), os que ainda passam são construções deliberadas: variável ou função que monta o comando, texto codificado, `rebase`, `commit --amend`, escrita em `.git` por programas incomuns. De 566 comandos legítimos, 5 são bloqueados, todos por escolha (`branch -M`, `reset` e `checkout` com variável, `commit -uno`, o `branch -D` do teste ao vivo). Ainda não vista ativa dentro do Claude Code |
| `/setup` da v1.9, passos 3 a 6, 8, 9, 12 e 13 | Rodados num projeto de teste em 01/10/2026 (Node 22, Linux): funcionaram como descrito; não testado no Windows nem num projeto real |
| Testes de banco sem Docker (`scripts/testar-banco.mjs`) | Testado em 05/10/2026 contra um PostgreSQL 16 com pgTAP, sem Docker: testes que passam, tabela sem RLS, bucket público, política furada, erro de SQL, plano que não fecha, cadeia de outro projeto e nada deixado no banco. Não testado contra um projeto Supabase de verdade (conexão pelo pooler, criação da extensão) |
| `/setup` passo 7 sem Docker | Conferido: `db:types` falha sem estragar o arquivo de tipos, `supabase unlink` existe, `enable_signup` está em `[auth]` e `[auth.email]`. O banco ligado (`start`, `test:db`, os dois SQL) não foi testado |
| `scripts/gerar-tipos.mjs` (v1.9) | Testado com uma CLI simulada: erro com código 1, saída inválida e sucesso; não testado com a CLI real do Supabase |
| Gatilho de perfil, primeiro administrador, teste do cadastro fechado e build de produção do site (v1.9) | Não testado |
| `CLAUDE.md` enxuto com `.claude/regras/banco.md` e `nao-testados.md` (v1.9) | Não testado; o risco é o Claude deixar de ler `banco.md` antes de mexer no banco |
| Linha "vínculo atual" em `AMBIENTES.md`, backup depois do `link` e `unlink` ao voltar (v1.9) | Não testado |
| Spec em `.scratch/<funcionalidade>/spec.md`, linha "Em revisão desde", passo "Iniciativa grande" e `custos.md` com funcionalidade (v1.9) | Não testado |
| `settings.json` na forma `command` + `args` (v1.9) | Formato conferido na documentação de hooks em 01/10/2026; não testado no Windows |
| Limite de 40 linhas por função em hooks (v1.6) | Conferido no ESLint de teste; não testado num projeto real |
| `/demanda`, `/voltar`, `/status` | Não testado |
| Retomada pelo `/status` e handoff mínimo (v1.6) | Não testado |
| Marcos e regra de parada | Validado |
| Regra do `--no-verify` | Não testado |
| Recomendação de modelo | Observado nos testes; sem registro datado. Tabela por comando na v1.9, não testada |
| Anotação de custo por funcionalidade | Testado com falha (o `/cost` só vale na conversa aberta; v1.6 pede uma linha por sessão) |
| Aviso de dado pessoal | Validado (avisou e não repetiu os dados) |
| Pergunta sobre desativar o claude-mem, junto do aviso de dado pessoal | Testado com falha (avisou sobre o dado, mas não perguntou sobre o claude-mem) — observar de novo |
| `wayfinder` | Não testado |
| `handoff`, com destino explícito em `.scratch/` | Validado (28/09/2026); em 25/09 o destino falhou |
| `/projeto` e a proposta de rodá-lo quando você descreve a ideia (v1.2) | Validado (25/09/2026) |
| Etapa de banco do `/setup`, local e remoto de desenvolvimento, `AMBIENTES.md` (v1.4) | Não testado |
| Seção Modelo de dados na spec e TDD de políticas de RLS (v1.4) | Não testado |
| Checagens de banco e roteiro de publicação no `/ship`; migrações no `/voltar` (v1.4) | Não testado |
| `/clear` + `/model` como caminho padrão de troca de modelo (v1.5) | Retirado na v1.6 (adotado por engano) |
| Resumo técnico restrito a relatórios de verdade, sem repetir o corpo da resposta (v1.5) | Não testado |
| Login e perfis: cadastro fechado, usuários criados no painel, tabela de perfis, função auxiliar e testes por perfil (v1.7) | Não testado; escrito a partir da análise da especificação da Plataforma EP, sem projeto com login |
| Arquivos no Storage: bucket privado, teste `01_buckets_privados`, URL assinada, checagem no `/ship` (v1.7) | Não testado |
| Regra de dados reais e pasta `dados-reais/` (v1.7) | Não testado |
| Views com `security_invoker`, função auxiliar em schema não exposto e SMTP próprio (v1.7) | Não testado; conferido na documentação do Supabase em 01/10/2026 |
| `/projeto` partindo de uma especificação pronta (v1.7) | Não testado |
| Tabela "quem pode o quê" na spec e regras no banco por trigger (v1.7) | Não testado |
| Roteiros "Publicar o site" e "Backup e restauração" no `/ship` (v1.7) | Não testado |
| Roteiro de Edge Function: chamador conferido dentro da função, decisão testada no Vitest, publicação no `/ship` (v1.8) | Não testado; a documentação do Supabase sobre autenticação de função está mudando |
| Revisão de segurança para produção, trava da primeira publicação e inventário de dados pessoais (v1.8) | Não testado |
| Critério `[visual]` na spec e "verificado manualmente" no `/ship` (v1.8) | Não testado |
| Regra de fixtures, amostra anonimizada antes do importador e fases da especificação no backlog (v1.8) | Não testado |
| Regra "Não guarde o que se calcula" e regras de estado na spec (v1.8) | Não testado |

## 8. Skills instaladas que o funil não usa de propósito

- **`superpowers:subagent-driven-development`** — para tasks independentes e paralelas. O `/executar-complexo` lida com tasks sequenciais (uma dependendo da anterior), que é o caso do `writing-plans`/`executing-plans`. Se um ticket tiver tarefas paralelas de verdade, ela dispara sozinha (é model-invoked). Quando ativa, gera arquivos em `.superpowers/sdd/`, pasta ignorada pelo git e descartável; por isso o registro permanente fica no `desvios.md` do `/ship`.

## 9. Se a rede bloquear a instalação

Em rede corporativa com proxy, `npm`, `git` e o login do Claude Code falham com erro de TLS/socket mesmo com o navegador funcionando. Causa: o navegador usa o proxy do Windows; as ferramentas de linha de comando não.

**Corrigir a causa (recomendado):**

1. Descobrir o proxy: `reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyServer`
2. Configurar npm e git (substitua pelo endereço encontrado):
   ```
   npm config set proxy http://ENDERECO:PORTA
   npm config set https-proxy http://ENDERECO:PORTA
   git config --global http.proxy http://ENDERECO:PORTA
   git config --global https.proxy http://ENDERECO:PORTA
   ```
3. Variáveis de ambiente permanentes (depois, abrir um terminal novo):
   ```
   setx HTTP_PROXY "http://ENDERECO:PORTA"
   setx HTTPS_PROXY "http://ENDERECO:PORTA"
   setx NO_PROXY "localhost,127.0.0.1"
   setx NODE_USE_ENV_PROXY 1
   ```
   `NODE_USE_ENV_PROXY` é necessária no Node 22.21+ e no 24+: sem ela, o `fetch` do Node ignora `HTTP_PROXY`/`HTTPS_PROXY`, e o `/login` do Claude Code falha.
4. Testar com `npm ping`.

**Contorno, se não der para corrigir a rede:**

1. Baixar o repositório como ZIP pelo navegador: `https://github.com/<usuário>/<repo>/archive/refs/heads/main.zip`
2. Verificar se o ZIP contém link simbólico; se tiver, substituir pelo arquivo real antes de reempacotar, ou o upload falha com "Zip file contains a symbolic link".
3. Subir em claude.ai → Configurações → Capabilities → Skills → Meus → Enviar plugin (para pacotes com `.claude-plugin/plugin.json`) ou Fazer upload de habilidade (para skill avulsa com `SKILL.md` na raiz).

Instalar por ZIP tem um efeito colateral útil: fixa a versão do pacote, que só muda quando você envia um ZIP novo.

## 10. Versionamento e manutenção

- **Cópia mestra.** O protocolo tem uma pasta própria no seu computador, com git. É de lá que cada projeto copia os arquivos, e é lá que as mudanças são feitas.
- **Versões.** Versão nova inteira (v2.0) quando o funil muda; v1.1 quando entra uma regra nova; v1.0.1 para correção de texto. O número fica no topo do `CLAUDE.md`, deste README, do `FLUXO.md`, do `GLOSSARIO.md` e dos arquivos de `.claude/regras/`, e cada versão ganha uma entrada no `CHANGELOG.md`.
- **Melhorias descobertas num projeto.** O Claude não edita o protocolo dentro de um projeto: registra em `.scratch/melhorias-protocolo.md` e avisa você. Periodicamente, leve esses registros para a cópia mestra, decida o que muda e gere uma versão nova.
- **Atualizar um projeto.** Substitua os arquivos do protocolo pelos da versão nova. Exceções do projeto ficam na seção "Ajustes deste projeto", no fim do `CLAUDE.md`; copie essa seção para o arquivo novo. O contexto de domínio fica no `CONTEXT.md`, que o protocolo não toca.
- **Projeto em versão antiga.** Troque os arquivos uma vez só, pelos da versão atual (todos os do passo 2 da seção 4), preservando a seção "Ajustes deste projeto". Depois aplique, em ordem, os itens de cada roteiro abaixo, da versão do projeto até a atual (de uma v1.6: os itens da v1.7, depois os da v1.8, depois os da v1.9).
- **Levar um projeto da v1.8 para a v1.9.** Troque os arquivos, incluindo a pasta nova `.claude/regras/`, o `.claude/settings.json` (agora na forma `command` + `args`; se o projeto tiver um próprio, troque só o bloco `hooks`), o hook da trava e o teste dele, e o `README.md`. Em seguida:
  - rode `npm test` (o teste da trava tem casos novos) e o teste ao vivo do passo 13 do `/setup`;
  - projeto com banco: troque o script `db:types` por `node scripts/gerar-tipos.mjs --local` (no remoto de desenvolvimento, `--project-id <ref-dev>`), crie o `scripts/gerar-tipos.mjs` (o código está no passo 7, item f, do `/setup`) e ponha `src/types/database.ts` na exclusão de cobertura;
  - tickets já concluídos: acrescente a linha `Concluído em AAAA-MM-DD (commit <hash>)` no fim de cada um;
  - projeto com login: confira o `enable_signup` também em `[auth.email]` do `config.toml`, e que existe o gatilho que cria a linha de perfil de cada usuário novo, como na seção "Login e perfis" de `.claude/regras/banco.md`;
  - projeto que publica o site: o roteiro agora pede o build com as variáveis de produção e procura o endereço do banco local em `dist/`;
  - projeto com banco: acrescente ao `supabase/AMBIENTES.md` a linha "vínculo atual" (o projeto a que a CLI está ligada agora) e, ao `.gitignore`, `supabase/.temp/` e `supabase/.branches/`;
  - em `.scratch/inicio-projeto.md`, acrescente a linha `setup concluído em AAAA-MM-DD` e, se há banco, "banco: local" ou "banco: remoto de desenvolvimento", mais "banco: login preparado" e "banco: arquivos preparados" quando for o caso; sem essas linhas, o `/planejar` para;
  - crie o marco `marco/AAAA-MM-DD-identidade` se a identidade visual já está no código, e anote o nome curto de cada funcionalidade ao lado do item em `.scratch/projeto.md`;
  - funcionalidade sem tickets já implementada: acrescente `Implementado em AAAA-MM-DD (commit <hash>)` no fim da spec;
  - projeto com produção: **refaça o backup** pelo roteiro novo (o comando das versões anteriores guardava só a estrutura, sem os dados) e acrescente `(com banco)` à linha `Revisão de pré-produção em` de `.scratch/pre-producao.md`;
  - confira a versão do Node (22.22.2 ou mais novo, ou 24.15 ou mais novo);
  - specs fora de `.scratch/<funcionalidade>/spec.md`: mova cada uma para esse caminho num commit só de mudança de lugar;
  - `.scratch/custos.md`: as linhas antigas ficam como estão; as novas ganham a coluna de funcionalidade;
  - funcionalidade entregue que está sendo alterada: acrescente `Em revisão desde AAAA-MM-DD` abaixo da linha `Entregue em`.
- **Levar um projeto da v1.7 para a v1.8.** Troque os arquivos (`CLAUDE.md` e os comandos). Em seguida:
  - projeto com views ou funções no banco: confira se toda view tem `security_invoker = true` e se toda função `security definer` está num schema não exposto (a v1.7 já pedia isso desde a correção de 01/10/2026);
  - projeto com produção ou site já publicado: rode a "Revisão de segurança para produção" do `/ship` uma vez, para criar `.scratch/pre-producao.md`; sem ele, o `/status` avisa;
  - projeto com Edge Functions feitas antes da v1.8: confira se cada uma começa conferindo quem chamou e se a decisão dela tem teste.
- **Levar um projeto da v1.6 para a v1.7.** Troque os arquivos (`CLAUDE.md` e os comandos; a trava de git não mudou). Em seguida:
  - acrescente `dados-reais/` ao `.gitignore`;
  - projeto com banco: acrescente ao `supabase/AMBIENTES.md` as linhas "último backup de produção" e "último teste de restauração" (valor "nenhum");
  - projeto com login: desligue o cadastro aberto (`enable_signup = false` no `config.toml` e a opção equivalente no painel) e confira se cada política tem teste por perfil, como na seção "Login e perfis" de `.claude/regras/banco.md`;
  - projeto com arquivos: crie `supabase/tests/01_buckets_privados.test.sql` (o SQL está no passo 7, item i, do `/setup`) e confira que nenhum bucket é público;
  - projeto sem login e sem arquivos: nada além dos dois primeiros itens.
- **Levar um projeto da v1.5 para a v1.6.** Além de trocar os arquivos e copiar `.claude/settings.json` e `.claude/hooks/` (se o projeto já tiver um `settings.json` próprio, acrescente só o bloco `hooks`; apague o hook antigo da trava, se existir):
  - acrescente `.claude/worktrees/` ao `.gitignore`, ao `test.exclude` do Vitest e aos `globalIgnores` do ESLint;
  - crie o `.npmrc` com `legacy-peer-deps=true`, instale o `@testing-library/dom` e confirme o script `typecheck` (`tsc -b`) e a linha dele no `.husky/pre-commit`;
  - dê aos hooks de `src/hooks/` o limite de 40 linhas por função, num bloco depois do de 20;
  - rode o teste da trava (`npm test` e o passo 13 do `/setup`);
  - para cada funcionalidade já entregue, acrescente a linha `Entregue em` à spec; as que nunca passaram pelo `/ship` ficam sem a linha, e o `/planejar` avisa na próxima vez.
- **Levar um projeto para a v1.4.** Projetos sem banco só trocam os arquivos. Projetos que já têm Supabase com um banco só precisam, antes, de um projeto de desenvolvimento separado e do `supabase/AMBIENTES.md`; para isso, rode o passo 7 do `/setup` isoladamente.
- **Levar um projeto da v1.1 para a v1.2 ou posterior.** Além de trocar os arquivos: (a) crie `.scratch/projeto.md` rodando `/projeto`, que monta o resumo a partir do que já existe; (b) instale as ferramentas de verificação e acrescente as regras de lint, seguindo os passos 4 a 6 do `/setup`. O pre-commit só verifica os arquivos alterados em cada commit, então código antigo que viola as regras novas só vai aparecer quando for mexido, e precisará ser ajustado nessa hora. Se a cobertura do projeto estiver abaixo de 70%, comece com um piso menor e suba aos poucos.
- **Documentos sincronizados.** Sempre que o funil, um comando ou uma regra mudar, atualize junto `FLUXO.md`, `GLOSSARIO.md` (termos novos), `.claude/regras/nao-testados.md`, este README e o `CHANGELOG.md`.
- **Pacotes de terceiros.** Atualizar um plugin é decisão deliberada, registrada no `CHANGELOG.md`. Se a auditoria dos pacotes tiver sido feita, ela vale até a próxima atualização.
- **Mais adiante:** se o protocolo estabilizar, os comandos podem ser empacotados como plugin, ganhando versão e atualização pelo `/plugin update`. O `CLAUDE.md` continuaria sendo copiado à mão.

## 11. Implementações futuras

Ideias avaliadas como úteis que ficaram de fora desta versão. Cada uma traz o que é, por que ficou para depois e quando vale retomar. Ideias avaliadas e recusadas estão no documento de especificação do DevFlow.

### Escolha de banco em aberto (registrada na v1.6)

**O que é:** o agente apresentar 2 ou 3 opções de backend conforme a aplicação (número de usuários, login, dado pessoal, exigência da empresa sobre onde os dados ficam, uso sem internet e quem faz a manutenção), em vez de assumir o Supabase. "Sem banco" (`localStorage`) entraria como opção, como no sandbox.

**Por que ficou para depois:** o Supabase está embutido em `.claude/regras/banco.md`, `CLAUDE.md`, `setup.md`, `ship.md`, `voltar.md` e `status.md`. Trocar só o nome tiraria de outro banco as checagens de RLS, chave secreta e migração destrutiva, e só o Supabase tem roteiro escrito (ainda sem teste num projeto real). O caminho previsto é separar um contrato geral de banco, no `CLAUDE.md` (ambientes separados, estrutura por arquivo versionado, regras de acesso com teste, nenhum segredo no navegador, dados fictícios, produção só com backup e aprovação), de perfis por tecnologia em `.claude/backends/`. A escolha seria feita no `/setup` e registrada num ADR. Um perfil escrito na hora só se valida num projeto real. Opções que exigem servidor próprio ficam fora, porque o DevFlow não cobre backend sem interface.

**Quando retomar:** quando um projeto precisar de outro banco, ou depois de testar o Supabase no DevFlow. Enquanto isso, o `/setup` apenas avisa, em uma frase, quando o projeto tem uma exigência que o Supabase não atende. Falta decidir se o Supabase entra como desempate quando duas opções empatam (a recomendação é que sim, por ser o único com roteiro escrito).

### Bloqueio mecânico de segredos (registrada na v1.2)

**O que é:** um `.claude/settings.json` no pacote bloqueando a leitura de `.env` e arquivos semelhantes. Ao esbarrar no bloqueio, o Claude diria o que tentou ler e por quê, ofereceria alternativa (quase sempre um `.env.example` sem valores basta) e explicaria como você libera, só para aquela vez. Nunca contornaria o bloqueio por outro caminho.

**Por que ficou para depois:** a sintaxe precisa ser confirmada antes de implementar. Desde a v1.6 o pacote já traz um `settings.json` com o hook da trava de git, que mostra o formato; falta a regra de leitura de arquivos.

**Quando retomar:** na próxima rodada de melhorias.

### Testes E2E (ponta a ponta) com Playwright

**O que é:** um robô abre um navegador de verdade, sem janela visível, e usa o sistema como uma pessoa: entra na página, preenche o formulário, clica, confere a mensagem. Os testes atuais verificam peças isoladas; o E2E pega o erro de peças que funcionam sozinhas e não se encaixam. A ideia seria ter de três a cinco testes por projeto, cobrindo os fluxos principais, rodando no `/ship`, com os critérios de E2E definidos em cada ticket no `/planejar`.

**Por que ficou para depois:** é o item mais caro da lista. O Playwright baixa navegadores de um servidor próprio, fora do npm, o que pode travar no proxy da rede corporativa. Os testes são lentos, às vezes falham por lentidão da página, e os logs de falha são longos, o que consome tokens.

**Quando retomar:** quando um projeto tiver um fluxo de usuário crítico, cujo erro custaria caro, e depois de medir no sandbox o consumo das métricas da v1.2.

### Integração com modo mock

**O que é:** quando o sistema conversa com outro sistema externo, o código passa por um adaptador que tem uma versão falsa. Dá para construir e testar tudo sem credencial, trocando para o sistema real com uma variável de ambiente.

**Por que ficou para depois:** nenhum projeto atual integra sistema externo.

**Quando retomar:** no primeiro projeto que dependa de um sistema externo cuja credencial demore a sair. Entraria como convenção condicional, valendo só quando houver integração.

### Testes de mutação com Stryker

**O que é:** a ferramenta faz pequenas sabotagens no código, uma de cada vez (troca `>` por `>=`, apaga uma linha), e roda os testes depois de cada uma. Se nenhum teste falhar, a sabotagem passou despercebida e os testes daquele trecho são fracos. É a métrica que mede a qualidade dos testes; a cobertura só mede quais linhas eles executaram.

**Por que ficou para depois:** é lento, porque roda a suíte muitas vezes. Em projetos grandes, pode passar de uma hora.

**Quando retomar:** quando houver um módulo com regra crítica (validação, cálculo, regra de negócio). Rodaria sob demanda ou no `/ship`, só nos arquivos alterados.

### Regras de camada com dependency-cruiser

**O que é:** regras que dizem quem pode importar quem, como "a tela nunca fala direto com o armazenamento, passa pela camada de serviço". A ferramenta bloqueia o import que quebra a regra. A skill `setup-ts-deep-modules` do Matt Pocock configura isso.

**Por que ficou para depois:** em projetos pequenos, é configuração sem retorno.

**Quando retomar:** quando um projeto passar de 20 ou 30 arquivos de código.

### Comando `/adotar` para sistemas que não nasceram com o DevFlow

**O que é:** um comando para trazer um sistema já existente para dentro do DevFlow sem mexer no que funciona. Leria o projeto e montaria o resumo em `.scratch/projeto.md`, instalaria só lint, pre-commit e ambiente de teste, e gravaria no `CLAUDE.md` (seção "Ajustes deste projeto") quais regras valem ali. Depois disso, as demandas entrariam pelo `/demanda`, como num projeto nascido no DevFlow.

**Por que ficou para depois:** só compensa se houver um sistema antigo para evoluir. Sem isso, seria um comando a mais para manter sem uso. Sistemas criados com o DevFlow não precisam dele.

**Quando retomar:** quando aparecer um sistema existente, feito em React e TypeScript, que precise ser evoluído.

### Comando próprio `/publicar` (registrada na v1.4)

**O que é:** tirar do `/ship` o roteiro de publicação no banco de produção e transformá-lo num comando próprio, o 14º.

**Por que ficou para depois:** por ora a publicação do banco e a do site cabem em seções do `/ship` (a do site entrou na v1.7), acionadas só a pedido. Um comando a mais é mais um arquivo para manter.

**Quando retomar:** a condição já se cumpriu na v1.9: os roteiros de produção ganharam etapas e o `ship.md` é o maior arquivo do pacote. Fica para a próxima versão que mexer no funil.

### Funções agendadas e integrações por Edge Function (registrada na v1.8)

**O que é:** a v1.8 cobre a Edge Function chamada por um usuário logado (convite de usuário, checagem de um arquivo no envio). Ficam de fora as funções que rodam sozinhas em horário marcado, como os alertas por e-mail de prazo vencendo, e as que falam com um sistema externo, como a cópia de arquivos para o Google Drive. As duas precisam de agendamento, de segredo do sistema externo e de tratamento de falha e repetição.

**Por que ficou para depois:** nenhum projeto em andamento chegou a elas, e uma regra escrita sem uso real tende a errar.

**Quando retomar:** na primeira funcionalidade que precise de execução agendada ou de integração com credencial. Entram como parte do roteiro de Edge Function.
