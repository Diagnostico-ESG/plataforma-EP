# DevFlow — v3.3 (2026-11-06)

*Antigo Protocolo Alex Macedo. O histórico das versões 1.x está em `CHANGELOG-v1.md`; o desta versão, em `CHANGELOG.md`.*

Funil de desenvolvimento para Claude Code, com skills e plugins de terceiros orquestrados por comandos próprios, para aplicações web com interface. Este README é para você: o Claude Code não o lê automaticamente. O que o agente precisa seguir está no `CLAUDE.md`, nos comandos e em `.claude/regras/`.

## 1. Arquivos deste pacote

- `CLAUDE.md` — regras que valem em qualquer momento e a tabela do funil, com o modelo de cada etapa. Lido pelo Claude Code em toda mensagem. Vai na raiz do projeto.
- `.claude/commands/*.md` — os treze comandos. Funil: `projeto`, `setup`, `concepcao-livre`, `implementar-identidade`, `planejar`, `executar-simples`, `executar-complexo`, `polir`, `ship`. Apoio: `demanda`, `rapido`, `voltar`, `situação`.
- `.claude/regras/` — regras consultadas sob demanda, para o `CLAUDE.md` e os comandos ficarem curtos:
  - `interface.md`: princípios de interface e a vitrine (app com dados falsos);
  - `execucao.md`: receitas de execução no Windows (scripts, git, workflows do GitHub, ciclo do banco);
  - `banco.md`: regras de banco Supabase (ambientes, ciclos de teste, chaves, login, Storage, Edge Functions, conferências do `/ship`);
  - `producao.md`: roteiros de produção (banco, site, backup e restauração, revisão de segurança);
  - `tdd.md`: regra de TDD própria (usada pelo `/rapido` e pelo `/executar-simples`);
  - `spec-e-tickets.md`: como o Claude escreve a spec e os tickets depois da sabatina (usada pelo `/planejar`);
  - `revisao-seguranca.md`: revisão de segurança do código (usada pelo `/ship` e pela revisão para produção);
  - `auditoria-prontidao.md`: **rascunho** de auditoria antes de pôr o sistema na frente de usuários de verdade, a pedido; ainda não ligado a nenhum comando;
  - `nao-testados.md`: o que ainda não foi testado num projeto real.
- `.claude/modelos/` — arquivos que o `/setup` copia para o projeto: scripts de teste e migração do banco de desenvolvimento (com ensaio da migração) e workflows do GitHub Actions (`github-workflows/`).
- `.claude/settings.json`, `.claude/hooks/` — a trava contra comandos git destrutivos e o teste dela. `.claude/launch.json` — entradas `dev` e `vitrine` para a pré-visualização.
- `docs/agents/` — configuração das skills do Matt Pocock (tickets em arquivos, rótulos, domínio), já pronta.
- `GLOSSARIO.md` — termos técnicos em linguagem simples. `.gitattributes` — fim de linha em LF.
- `.scratch/melhorias-protocolo.md` — registro de melhorias (começa vazio em cada projeto).

## 2. Quando usar e quando não usar

**Serve para:** aplicações web com interface, em **Vite + React + TypeScript**, com ou sem banco Supabase, construídas do zero com o protocolo, e para a evolução delas (via `/demanda`). Ambiente: Windows.

**Não serve para:** scripts e análises em Python ou R, backend sem interface, Power BI, aplicativos nativos de celular, outras pilhas de front-end (Next.js, Vue, Angular) e outros sistemas operacionais sem revisão. Sistema que já existia antes do DevFlow: as Convenções de Código, o pre-commit e o caminho de bug do `/demanda` são aproveitáveis, mas ainda não há comando para adotá-los.

## 3. Skills e plugins necessários

Instale uma vez, na sua conta; valem para qualquer projeto. O `/setup` confere que estão disponíveis.

| Pacote | Para quê | Instalação |
|-|-|-|
| Matt Pocock Skills (`/mattpocock-skills:`) | sabatina, revisão de código, handoff, `wayfinder` | `/plugin marketplace add mattpocock/skills` e `/plugin install mattpocock-skills@mattpocock-skills` |
| Superpowers (`/superpowers:`) | brainstorming, planos, execução, depuração | `/plugin marketplace add obra/superpowers-marketplace` e `/plugin install superpowers@superpowers-marketplace` |
| Ponytail | disciplina de simplicidade (precisa de `node` no PATH) | `/plugin marketplace add DietrichGebert/ponytail` e `/plugin install ponytail@ponytail` |
| Impeccable (`/impeccable:impeccable`) | `init`, `shape`, `audit`, `polish` | `/plugin marketplace add pbakaus/impeccable` e `/plugin install impeccable@impeccable` |
| `frontend-design`, `code-review` | já vêm com o Claude Code | nada a instalar |

Notas: as skills de invocação direta que o funil ainda usa (`grill-with-docs` e `wayfinder`) só rodam digitadas por você e podem nem aparecer na lista do Claude; o comando delas volta pronto para você rodar. Spec, tickets, implementação do `/executar-simples` e revisão de segurança do `/ship` são regras do próprio DevFlow, e o Claude as segue sem parar; as skills `to-spec`, `to-tickets` e `implement` podem continuar instaladas, sem uso pelo funil. A auditoria de pacotes de terceiros não precisa de skill: o passo 3 do `/ship` roda `npm audit --json` e monta o relatório. Se a instalação oficial falhar por rede, use a seção 8.

**Memória entre sessões.** O DevFlow não usa plugin de memória. A continuidade fica nos arquivos de `.scratch/` (spec, tickets, `proximo-passo.md`, handoff), lidos pelo `/situação`.

**`gh`** (linha de comando do GitHub, recomendada): dispara workflows e lê o resultado sem navegador. Instale e rode `gh auth login` no seu terminal.

### O que o `/setup` instala em cada projeto

ESLint (com complexidade máxima 10, arquivos de até 300 linhas, funções de até 20 linhas, 40 nos hooks de `src/hooks/`), typecheck (`tsc -b`), Vitest com piso de 70% de cobertura, `madge` (dependência circular, com `.npmrc` de `legacy-peer-deps=true`), Husky e lint-staged (lint e **só os testes ligados aos arquivos do commit**, mais typecheck, a cada commit), a vitrine, `.nvmrc`, `.gitattributes` e, se houver GitHub, o workflow de verificação. Com banco: Supabase CLI, o ciclo de teste escolhido (Docker local, script no seu computador ou GitHub Actions) e, com login e arquivos, os testes de RLS e de buckets.

### Trava contra comandos git destrutivos

O hook `bloquear-git-destrutivo.mjs` lê cada comando que o Claude vai rodar e cancela `reset --hard`, `clean`, `push --force`, `branch -D`, `checkout` de arquivo, `restore`, `tag -d`, `stash drop`, escrita na pasta `.git` e `commit --no-verify`, incluindo formas abreviadas e dentro de PowerShell, `cmd` ou pipe. Não enxerga script gravado em arquivo, variável que monta o comando, texto codificado e `rebase`/`commit --amend`. Ela reduz acidentes; a regra do `CLAUDE.md` vale mesmo quando ela deixa passar. **Falsos positivos conhecidos:** alguns comandos compostos com `sed -i` ou com `.git` citado dentro de um script são barrados; use as ferramentas de leitura e edição do Claude em vez do shell, ou rode você mesmo no seu terminal.

## 4. Como começar um projeto novo

1. Instale os plugins da seção 3 e confira o Node (`node --version`: 22.22.2 ou mais novo na linha 22, ou 24.15 ou mais novo).
2. Crie a pasta do projeto e copie para ela, desta pasta: `CLAUDE.md`, `README.md`, `GLOSSARIO.md`, `.gitattributes`, `.claude/` inteira, `docs/agents/` e `.scratch/melhorias-protocolo.md`.
3. Abra o Claude Code nela e rode `/projeto`. O resultado fica em `.scratch/projeto.md`. Se você já tem uma especificação, anexe-a.
4. Rode `/setup`. Ele conduz o scaffold, as ferramentas, o banco (se o projeto precisar), o git, o pre-commit e a trava.
5. Siga o funil: `/concepcao-livre`, `/implementar-identidade`, e então `/planejar`, `/executar-*`, `/polir`, `/ship`, funcionalidade por funcionalidade. O que chega depois entra pelo `/demanda`. Para retomar numa sessão nova: `/situação`.

**Custo.** Desligado por padrão. Para medir, escreva "Custo ligado." na seção "Ajustes deste Projeto" do `CLAUDE.md` do projeto: os comandos passam a pedir o `/cost` e a gravar `.scratch/custos.md`.

**Modelo por etapa.** A tabela do Funil de Trabalho, no `CLAUDE.md`, diz o modelo de cada comando (Opus para conversa e decisão, Sonnet para o resto). Trocar de modelo abre uma sessão nova; o que a etapa produziu já está em arquivo, e a sessão nova começa pelo `/situação`.

## 5. Uso em projeto institucional

Antes de usar o protocolo com dados de terceiros ou em trabalho oficial: verifique as normas sobre uso de IA e sobre proteção de dados pessoais (incluindo as internas do órgão); consulte a TI e o encarregado de dados sobre o envio do conteúdo do projeto à API da Anthropic e sobre plugins aceitos; confirme se a conta pode ser pessoal. Em projeto com banco, confirme onde os dados podem ficar (conta, região, dado pessoal real) e decida com o jurídico se é preciso registrar quem **leu** cada dado e como conciliar um histórico que não se altera com um pedido de eliminação de dados. A carga de dados reais é sempre sua, fora da sessão, com arquivos fora da pasta do projeto ou em `dados-reais/` (ignorada pelo git e nunca lida pelo Claude).

## 6. Atualizar um projeto antigo para a v3.3

Troque os arquivos do protocolo pelos desta versão, preservando a seção "Ajustes deste Projeto" do `CLAUDE.md` (copie-a para o arquivo novo). Depois:

**Vindo da v3.2**

- Só o `/situação` mudou (testes só com mudança não comitada; backlog contado, sem leitura).

**Vindo da v3.1, além do que está acima**

- Só o `CLAUDE.md` mudou (regra "Comando pronto para copiar", em Funil de Trabalho).

**Vindo da v3.0, além do que está acima**

- Copie os arquivos novos de `.claude/regras/` (`spec-e-tickets.md`, `revisao-seguranca.md`) e os comandos alterados. Spec, tickets e implementação já em andamento continuam valendo; só muda quem escreve os próximos.

**Vindo da v2.0.x, além do que está acima**

- **`/concepcao-premium`:** apague `.claude/commands/concepcao-premium.md` do projeto e desinstale a Apple Design Skill (`/plugin`), se ela não serve a outro projeto.
- **claude-mem:** desinstale o plugin (`/plugin`) e apague a pasta de dados dele na sua pasta de usuário (`.claude-mem`). Ela guarda as capturas antigas, inclusive as que tiverem dado pessoal; apagar a pasta é com você, no seu terminal.
- **security-auditor:** a skill pode ser retirada em claude.ai, Configurações, Capabilities, Skills. O `/ship` faz a auditoria de pacotes sozinho; o `.scratch/security.md` que já existe continua valendo como linha de base.

**Vindo da v1.x, além do que está acima**

- **Pre-commit:** troque o `npm test` do `.husky/pre-commit` pelo `vitest related` dentro do lint-staged (passo 12 do `/setup`).
- **Vitrine:** crie o script `vitrine`, `src/vitrine/` e `src/lib/acesso.ts` (passo 6a do `/setup`) e acrescente a entrada `vitrine` ao `.claude/launch.json`.
- **Custo:** quem usava `.scratch/custos.md` e quer continuar escreve "Custo ligado." em "Ajustes deste Projeto".
- **Banco:** copie para `scripts/` os modelos novos de `.claude/modelos/` (a bateria passa a ensaiar migrações e a recusar banco de outro projeto) e escolha o ciclo A, B ou C (`banco.md`).
- **`.gitattributes`:** acrescente e deixe o Git normalizar (um commit só para isso).
- **Skills do Matt Pocock:** o bloco "Agent skills" e `docs/agents/` já vêm no pacote; se o projeto tinha o bloco em "Ajustes deste Projeto", mantenha o dele.
- **`FLUXO.md`:** foi retirado do pacote (repetia os comandos e envelhecia); apague-o do projeto. Os comandos são a fonte.
- **`/status`:** o comando se chama `/situação` desde a v1.9 (o nome antigo colidia com o comando nativo do Claude Code).

## 7. Skills instaladas que o funil não usa de propósito

`superpowers:subagent-driven-development`: serve a tarefas independentes e paralelas; o `/executar-complexo` lida com tarefas sequenciais. Se um ticket tiver tarefas paralelas de verdade, ela dispara sozinha e gera arquivos em `.superpowers/sdd/`, pasta descartável; o registro permanente fica no `desvios.md`.

## 8. Se a rede bloquear a instalação

Em rede corporativa com proxy, `npm`, `git` e o login do Claude Code falham com erro de TLS ou de socket mesmo com o navegador funcionando: o navegador usa o proxy do Windows, e as ferramentas de linha de comando não.

1. Descubra o proxy: `reg query "HKCU\Software\Microsoft\Windows\CurrentVersion\Internet Settings" /v ProxyServer`
2. Configure npm e git com o endereço encontrado:
   ```
   npm config set proxy http://ENDERECO:PORTA
   npm config set https-proxy http://ENDERECO:PORTA
   git config --global http.proxy http://ENDERECO:PORTA
   git config --global https.proxy http://ENDERECO:PORTA
   ```
3. Variáveis de ambiente permanentes (depois, abra um terminal novo): `setx HTTP_PROXY "http://ENDERECO:PORTA"`, `setx HTTPS_PROXY "http://ENDERECO:PORTA"`, `setx NO_PROXY "localhost,127.0.0.1"` e `setx NODE_USE_ENV_PROXY 1` (necessária no Node 22.21+ e no 24+; sem ela o `/login` do Claude Code falha).
4. Teste com `npm ping`.
5. Variável antiga atrapalhando: uma `SUPABASE_ACCESS_TOKEN` esquecida nas variáveis de usuário tem prioridade sobre o `npx supabase login` e faz o `link` falhar com "Unauthorized". Confira se existe (sem mostrar o valor) e apague.
6. **Porta do banco fechada:** se só a 443 abre, o teste de banco usa o ciclo C (GitHub Actions) de `.claude/regras/banco.md`.

**Contorno se não der para corrigir a rede:** baixe o repositório do pacote como ZIP pelo navegador; se o ZIP tiver link simbólico, troque pelo arquivo real; suba em claude.ai, Configurações, Capabilities, Skills (Enviar plugin ou Fazer upload de habilidade). Instalar por ZIP fixa a versão do pacote.

## 9. Versionamento e manutenção

- **Cópia mestra.** Esta pasta, com git, fora de qualquer projeto. É dela que cada projeto copia os arquivos, e é nela que as mudanças são feitas.
- **Versões.** Versão nova inteira (v4.0) quando o funil muda; v3.4 quando entra uma regra nova; v3.3.1 para correção de texto. O número fica no topo do `CLAUDE.md`, deste README, do `GLOSSARIO.md` e dos arquivos de `.claude/regras/`; cada versão ganha uma entrada no `CHANGELOG.md`, e entradas antigas não se editam.
- **Melhorias descobertas num projeto.** O Claude registra em `.scratch/melhorias-protocolo.md` e avisa você. Periodicamente, leve os registros para esta pasta, decida o que muda e gere uma versão nova. Só entra o que valeria para qualquer projeto.
- **Documentos sincronizados.** Quando o funil, um comando ou uma regra mudar, atualize junto o `GLOSSARIO.md` (termos novos), `.claude/regras/nao-testados.md`, este README e o `CHANGELOG.md`.
- **Pacotes de terceiros.** Atualizar um plugin é decisão deliberada, registrada no `CHANGELOG.md`.

## 10. Pendências conhecidas

- **Trava de git:** os falsos positivos descritos na seção 3 ainda não foram corrigidos no hook (tem 31 KB e um arquivo de teste extenso; a correção pede um ciclo próprio, com teste do que ela deixa de bloquear). A lista de padrões problemáticos está no registro de melhorias do projeto de origem.
- **Roteiros de produção automatizados** (workflows de backup e de migração em produção, scripts de produção): existem no projeto de origem, mas não entraram nesta versão porque dependem de segredos de produção e ainda não foram generalizados.
- **Outras pilhas e sistemas:** só Vite, React, TypeScript e Windows.
- **Skills de TDD de terceiros:** o `tdd.md` não desliga o `tdd` do Matt nem o do Superpowers. Bloquear só uma delas com `Skill(superpowers:test-driven-development)` em `permissions.deny` parece possível, mas não foi testado e pode afetar o `executing-plans` que o `/executar-complexo` usa.
