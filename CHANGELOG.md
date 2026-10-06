# Changelog — DevFlow (antigo Protocolo Alex Macedo)

Uma entrada por versão ou, quando a versão foi feita em etapas no mesmo dia, uma por etapa, da mais recente para a mais antiga. Entradas antigas nunca são editadas: quando uma etapa corrige a anterior, a correção está na entrada mais nova.

## v1.9 — 2026-10-05 (testes de banco sem Docker)

**Motivo.** O projeto da Plataforma EP não vai ter Docker, e o comando de testes de banco do Supabase roda dentro de um contêiner mesmo com o banco remoto. Sem ele, não haveria como testar as permissões por perfil.

- Novo `.claude/modelos/testar-banco.mjs`: roda os mesmos arquivos de `supabase/tests/`, conectando direto ao banco de desenvolvimento. Só roda se a cadeia de conexão citar o ref do projeto de desenvolvimento.
- `/setup`, passo 7: o remoto de desenvolvimento pergunta pelo Docker; sem ele, o item j novo instala o `pg`, copia o script e pede que você crie o `.env.banco.local`.
- Testado contra um PostgreSQL 16 com pgTAP, sem Docker: os dois testes do `/setup`, um teste de políticas com administrador, consulta, usuário desativado e visitante, política furada, erro de SQL, plano que não fecha, cadeia de outro projeto, e a conferência de que nada fica no banco depois.
- Não testado: a conexão com um projeto Supabase de verdade (pooler, SSL, criação da extensão pgTAP) e a geração de tipos por `--project-id` sem Docker. Está na lista de `nao-testados.md`.

## v1.9 — 2026-10-02 (segunda revisão final)

**Motivo.** Mais uma rodada de quatro revisores independentes, com os achados conferidos um a um antes de qualquer correção. Números atuais, que substituem os das entradas abaixo: a trava tem 317 testes, o `CLAUDE.md` tem cerca de 2.600 palavras (eram 3.600 na v1.8) e o Node mínimo é 22.22.2.

**Trava de git (achados reproduzidos antes de corrigir)**
- A trava se desligava sem aviso quando a pasta do projeto era acessada por link simbólico. Corrigido.
- Passavam, e passaram a ser bloqueados: comando dentro de `if`, `while` ou `try`; atribuição do PowerShell (`$out = git reset --hard`) e `ForEach-Object { ... }`; mensagem de commit em heredoc com apóstrofo solto seguida de comando destrutivo (é o formato de commit que o Claude Code usa); aninhamento além do limite; `export HUSKY=0`; `.git` apagada por `find | xargs rm`, `rimraf`, `cd .git && rm`, `find . -delete` e programas que escrevem dentro dela.
- Texto longo e repetitivo fazia a busca levar 20 segundos, e hook que estoura o tempo não bloqueia. Agora responde em menos de um décimo de segundo.
- Falsos positivos: de 566 comandos legítimos, 28 eram bloqueados (`rm -rf dist/*`, `mv tmpvite/* .`, `grep` de texto que cita um comando, `git commit -m"texto"`). Ficaram 5, todos por escolha.
- Continuam fora do alcance, e declarados: variável ou função que monta o comando, texto codificado, script em arquivo, `rebase` e `commit --amend`.

**Produção e banco**
- O `db push` aplica todas as migrações pendentes: o roteiro agora para se alguma pertence a funcionalidade que ainda não passou pelo `/ship`. O mesmo vale para o site.
- Publicação interrompida tem roteiro de retomada. O registro "vínculo atual: produção" é gravado antes do `link`.
- A revisão de segurança grava `(com banco)` ou `(sem banco)`; uma revisão feita antes de o projeto ter banco não libera a publicação do banco.
- Migração destrutiva: o backup é restaurado e conferido antes do `db push`.
- A busca em `dist/` passou a procurar o ref do projeto de desenvolvimento; antes, um site apontando para o banco dev remoto passava.
- Remoto de desenvolvimento: migração já enviada não se edita (o conserto é migração nova); os usuários fictícios chegam por `db push --include-seed`; Edge Function se confere com `functions deploy --use-api` no projeto dev.
- Pela documentação do Supabase, os testes de banco e o `db dump` pedem Docker mesmo no remoto. O `/setup` agora diz isso e mostra as opções para máquina sem Docker. Não testado.
- O e-mail do primeiro administrador sai da conversa: o comando SQL vai com um marcador.

**Funil**
- `/voltar`: o `git revert` desfazia também os registros de `.scratch/` (spec, tickets, `desvios.md`). Agora eles são restaurados depois do revert. Entraram o revert de commit de merge, as linhas `Volta iniciada em` e `Volta concluída em`, e o passo a passo para desfazer migração já publicada.
- `/executar-complexo`: retomada quando a branch e o plano já existem; antes, rodar de novo apagava o plano e falhava ao criar a branch.
- `/setup`: grava `setup concluído em`; reconhece quando já rodou; confere Node 22.22.2 e a identidade do git; põe `supabase/.temp/` no `.gitignore` (antes ia para o git).
- `/planejar`: confere setup e identidade, anota o nome curto da funcionalidade em `projeto.md` e comita o que produz. `Em revisão desde` só entra quando a spec muda.
- Funcionalidade sem tickets ganha `Implementado em` na spec; o `/implementar-identidade` cria o marco `identidade`.
- `/polir` roda os testes, comita e registra os achados em `desvios.md`.
- `/demanda`: ordem de rigor dos tipos; aviso de que a produção continua com o defeito; demanda que traz login ou banco passa antes pelo `/projeto`.
- `/ship`: o que fazer com critério não atendido; marca recusada e marca com ressalva com critérios separados.
- `CLAUDE.md`: a regra "toda mudança passa pelo funil" voltou a ter parágrafo próprio; frases que tinham virado descrição voltaram a ser ordem; `banco.md` é lido inteiro, uma vez por sessão.
- `nao-testados.md` reorganizado por comando, lido ao terminar cada comando.

**Documentos**
- README: roteiro da v1.8 para a v1.9 com os itens que faltavam (linhas do `inicio-projeto.md`, refazer o backup de produção, marco de identidade); a linha do `/ship` na tabela de validação deixou de dizer "versão atual"; "único banco com roteiro testado" virou "com roteiro escrito".
- FLUXO e GLOSSARIO alinhados; seis termos novos no glossário.

**Não corrigido, por escolha**
- `git branch -M` e `reset` ou `checkout` com variável continuam bloqueados.
- A tabela de validação do README não ganhou uma linha para cada item novo; a lista completa do que falta testar é a de `.claude/regras/nao-testados.md`.
- Critérios que dependem de julgamento, quando há confirmação sua no passo seguinte.

## v1.9 — 2026-10-01 (revisão final)

**Motivo.** Antes de fechar a v1.9, quatro revisores independentes olharam o pacote por ângulos diferentes: simulação do funil inteiro num projeto com login, arquivos e produção; execução real do `/setup` e ataque à trava de git; coerência dos documentos; e comparação regra a regra com a v1.8. Esta entrada registra o que eles acharam e o que mudou. Também corrige dois números das entradas abaixo: o `CLAUDE.md` foi de 3.600 para 2.400 palavras, e a trava tem 258 testes.

**O que foi executado**
- `/setup`, passos 3 a 6, 8, 9, 12 e 13, num projeto de teste (Node 22, Linux): funcionaram como descrito. Sem Docker, o banco ligado não foi testado.
- Trava: um lote de 507 comandos escritos pelo revisor. Dos 320 destrutivos, 131 passavam; 52 deles foram executados num repositório de teste e causaram dano. Depois das correções, passam 52, todos fora do alcance declarado (variável ou função que monta o comando, texto codificado, `rebase`, `commit --amend`) ou sem dano real. Dos 187 legítimos, 1 é bloqueado (`rm -rf tmpvite/.git`, que o `/setup` não usa).
- Fatos do Supabase citados nas regras: conferidos na documentação oficial.

**Trava de git**
- Passou a bloquear: redirecionamento antes do comando (`>/dev/null git reset --hard`), abreviação de uma letra (`--h`), texto entregue a um shell por pipe ou here-string, `xargs`, `env -S`, `trap`, `Start-Process`, apagar ou escrever dentro de `.git` por qualquer caminho, `checkout -B`, `switch -C`, `update-ref`, `git rm -f`, `fetch --prune-tags`, e o commit que pula o pre-commit (`--no-verify`, `HUSKY=0`, `core.hooksPath`).
- Evento ilegível agora bloqueia; antes, liberava.
- Os textos (`CLAUDE.md`, README) deixaram de prometer que a trava pega qualquer disfarce: ela reduz acidentes, e a regra vale mesmo quando ela deixa passar.
- `settings.json` com `timeout` de 10 segundos.

**Produção (`/ship`)**
- O painel da produção (cadastro aberto, SMTP, redirecionamentos, plano, região, membros) é conferido logo depois de criar o projeto e antes do primeiro `db push`. Antes, a revisão pedia para conferir um painel que ainda não existia, e o projeto novo recebia as tabelas com o cadastro aberto.
- `supabase login` e `link` são seus, no seu terminal: o `link` pode pedir a senha do banco.
- Com o vínculo em produção, o Claude só roda o `db push` e a publicação das funções. Antes, o teste de restauração mandava rodar os testes de banco, que na variante remota iriam contra a produção.
- Backup em três comandos (estrutura, dados e papéis); o comando antigo guardava só a estrutura. O teste de restauração é seu, num projeto Supabase separado, com contagem de linhas.
- Passo do primeiro administrador no roteiro de publicação.
- O `/ship` descarta a saída do `supabase start`, como o `/setup` já fazia.

**Banco**
- Remoto de desenvolvimento: a migração chega ao banco com `supabase db push`; antes não havia instrução, e os testes rodariam sem a migração.
- O `/planejar` manda ler as seções "Login e perfis", "Chaves" e "Edge Functions" de `banco.md`. O resumo de banco do `CLAUDE.md` ganhou as regras que só estavam lá: migração publicada não se edita, usuário novo com o menor perfil, testes com usuário desativado e visitante, URL assinada, conferência do chamador na Edge Function.
- Carga de dados reais em produção: o importador entra como administrador, sem chave secreta.
- A Edge Function de convite não cria a linha de perfil de novo (o gatilho já cria).

**Funil**
- Precedência: em segredos, dado pessoal, banco e comandos destrutivos vale sempre a instrução mais cautelosa.
- Ticket concluído ganha a linha `Concluído em`; antes, nada dizia como saber se um ticket estava pendente.
- Plano por ticket (`plano-<número>.md`); pasta dos ADRs definida.
- `/voltar`: a conferência de migração já publicada subiu para antes do `git revert`.
- Bug pelo `/demanda`: marco antes, `code-review` depois, e `/ship` também quando a correção toca função, login, permissão ou validação de entrada. Bug difícil é o que não tem causa na primeira investigação.
- `/setup`: confere a versão do Node, usa `git init -b main`, comita ao final; o script de tipos cria a pasta e aceita a saída da CLI em modo agente.
- `/implementar-identidade` manda reescrever o teste-fumaça, que quebrava quando o contador do template saía.
- Marca de entrega com ressalva quando um critério visual ficou presumido ou a cobertura foi aceita abaixo do piso.
- Regras que tinham enfraquecido na mudança de lugar voltaram: handoff (a frase estava truncada), "nunca correção automática", "sem reiniciar o plugin".

**Documentos**
- FLUXO com a mesma numeração do `/setup` (0 a 13) e os roteiros de produção reescritos; README com a seção da trava em listas e o roteiro de atualização mais claro; GLOSSARIO com os dois sentidos de "hook" e mais oito termos.

**Não corrigido, por escolha**
- A trava não tenta pegar `rebase`, `commit --amend`, variável ou função que monta o comando, nem texto codificado.
- Critérios que dependem de julgamento ("mais de uma abordagem razoável", "relatório extenso") ficaram como estão.
- Testes do banco em `supabase/tests/*.test.sql`: a ferramenta do Supabase cria `*_test.sql`, e não foi possível confirmar sem Docker que ela recolhe os dois nomes. Conferir no primeiro projeto com banco.

## v1.9 — 2026-10-01 (segunda leva)

**Motivo.** Fecha os achados restantes da revisão de 01/10/2026 e enxuga o `CLAUDE.md`. Nada desta leva foi testado num projeto real; o formato do `settings.json` foi conferido na documentação de hooks.

**`CLAUDE.md` enxuto (de cerca de 3.900 para 2.000 palavras)**
- Ficaram as regras que valem fora do funil: segredos, dado pessoal, regras curtas de banco, precedência, convenções, registros, a tabela do funil e a trava.
- O detalhe de banco (ambientes, migrações, chaves, views e funções, login e perfis, Storage, Edge Functions) foi para `.claude/regras/banco.md`. O `CLAUDE.md` manda ler a seção certa antes de mexer no banco.
- A lista de itens não testados foi para `.claude/regras/nao-testados.md`, organizada por assunto. Quem registra a primeira execução é o comando que a executou; o `/status` só lê.
- O procedimento do importador de dados reais foi para o `/planejar`.
- Risco aceito: se o Claude deixar de ler `banco.md`, uma regra de banco pode ser esquecida. As regras de segurança (RLS, chaves, views, cadastro fechado, bucket privado) continuam resumidas no `CLAUDE.md`.

**Funil**
- Tabela com o modelo de cada comando no `CLAUDE.md`. Os comandos remetem a ela.
- Caminhos fixos: spec em `.scratch/<funcionalidade>/spec.md`, tickets em `issues/`, mapa da iniciativa grande em `mapa.md`. O `setup-matt-pocock-skills` é configurado com arquivos locais em `.scratch/`.
- `/planejar`: passo "Iniciativa grande" (critério e destino do `wayfinder`), passo do importador, aviso de banco que ainda não existe (o passo 7 do `/setup` pode rodar sozinho) e linha `Em revisão desde` quando uma funcionalidade entregue volta a mudar. O `grill-me` deixou de ser alternativa automática: vale a regra de skill ausente, e, se você escolher o `grill-me`, o Claude grava `CONTEXT.md` e ADR depois.
- Regra única para skill que recusa ser acionada: devolve o comando pronto.
- `/ship`: entrada por bug ou ajuste, conferência do ADR de dependência de produção, `custos.md` com coluna de funcionalidade, hash da marca de entrega tirado do commit anterior, "Conferir a tela" definido (pré-visualização da sessão, ou você olha, ou fica presumido) e busca de chaves restrita a código, funções, seed e histórico, com triagem.
- Publicação no banco de produção: vincula primeiro, faz o backup depois (na primeira publicação não há o que guardar), anota o "vínculo atual" em `AMBIENTES.md` e o desfaz no fim (`unlink` no local). O `/status` avisa se o vínculo ficou em produção.
- `/demanda`, `/executar-*` e `/polir` passaram a dizer a mesma coisa sobre o `/ship` depois de bug ou ajuste.
- `/projeto`: o escopo do DevFlow é conferido antes das perguntas.
- Marcos com o mesmo nome no mesmo dia ganham `-2`, `-3`.
- `/implementar-identidade` aponta o `/polir` como próximo passo num redesenho.

**Pacote**
- `settings.json` na forma `command` + `args`, com `${CLAUDE_PROJECT_DIR}`, que a documentação recomenda para caminhos e evita a dependência do shell no Windows.
- O `README.md` passa a ir para cada projeto (o `/setup` consulta a seção sobre rede corporativa). README, FLUXO e GLOSSARIO alinhados com os comandos; roteiro de atualização diz para aplicar as versões em ordem.
- Node mínimo documentado: 22.12.
- Glossário com os termos que faltavam (diff, merge, repositório, PR, Vitest, pre-commit, skill, plugin, Ponytail, schema, security definer, vínculo atual, sabatina, SRP, API, CVE) e sem os que ninguém usava.
- Correções: "registrada na v1.2" no bloqueio de segredos; handoff validado só em 28/09; Ponytail e recomendação de modelo marcados como observados, sem registro datado.

## v1.9 — 2026-10-01 (primeira leva)

**Motivo.** Uma revisão minuciosa da v1.8, feita por três revisores independentes e conferida por mim, achou 5 problemas que travam o uso e furos na trava de git. Esta leva corrige esses e alguns que ficavam nas mesmas linhas. A segunda leva (enxugar o `CLAUDE.md` e os achados de documentação) ainda não foi feita. Os testes da trava e do `scripts/gerar-tipos.mjs` rodaram; o resto não foi testado num projeto real.

**Bloqueantes corrigidos**
- `/setup`, scaffold: o assistente do Vite cancelava numa pasta não vazia sem terminal interativo, e `--overwrite` apagaria o DevFlow. O scaffold agora é criado numa subpasta (`tmpvite`) e copiado sem sobrescrever; `--overwrite` fica proibido.
- Primeiro administrador: a regra "Login e perfis" agora diz como a linha de perfil nasce (gatilho em `auth.users`, função em schema não exposto, teste pgTAP) e como o primeiro administrador surge (promovido por você uma vez, com SQL no painel, fora de migração e do git).
- `/ship`, publicar o site: o roteiro mandava procurar o conteúdo do `.env.local` em `dist/`, o que viola a regra de segredos e dava sempre positivo. Agora procura só `sb_secret_`, `service_role` e o endereço do banco local; define como fazer o build com as variáveis de produção (`.env.production.local`, ignorado pelo git).
- `/voltar`, dependência: pedia restaurar `package.json` do marco, o que a trava bloqueia. Agora usa `git revert` ou `git show <marco>:arquivo > arquivo`.
- `/ship`, projeto sem banco: a publicação do site e a revisão para produção passaram a pular o que depende de `supabase/`.

**Trava de git**
- Passou a bloquear: opção abreviada (`--har`), `git checkout <arquivo>` (confere no git se o nome é ramo, tag ou commit), alias do git (`-c alias.*`, `git config alias.*`, variáveis `GIT_CONFIG_*`), PowerShell (`-Command` e `-EncodedCommand`), `cmd /c`, `wsl`, `iex`, `python -c` e `node -e`, os comandos `timeout`, `stdbuf`, `find -exec` e semelhantes, caminho do Windows com barra invertida, `tag -d` e `-f`, `push --delete` e `push origin :ramo`, `stash drop` e `clear`, `worktree remove --force`, `branch -f` e `-M`, `filter-branch`, `reflog expire`, `gc --prune`, `update-ref -d` e `rm` da pasta `.git`.
- Deixou de bloquear, por engano: `--help` e `-h`, e comando dentro de comentário (`# ...`).
- Os testes passaram de 91 para 176. Fora do alcance, e agora declarado no arquivo e no README: script em arquivo, variável que monta o comando e alias já gravado no `~/.gitconfig`.
- Motivo: o `CLAUDE.md` manda o Claude aceitar o bloqueio sem procurar contorno, e vários contornos funcionavam sem ninguém procurar.

**Também corrigido nas mesmas linhas do `/setup`**
- `supabase start` imprimia a chave secreta local no contexto do agente: agora roda com a saída descartada, e você copia a URL e a chave publicável com `npx supabase status`.
- Cadastro fechado: `enable_signup` também em `[auth.email]`, e um comando de teste que você roda para confirmar que o cadastro é recusado.
- `db:types` gravava o erro da CLI dentro de `src/types/database.ts` quando o Docker estava desligado: agora o `scripts/gerar-tipos.mjs` grava num temporário e só troca se o comando tiver sucesso. O arquivo de tipos sai da cobertura.
- Login ou arquivos enviados agora também pedem banco (antes só "vários computadores" pedia).

**Fica para a segunda leva**
- Enxugar o `CLAUDE.md` (Banco, Itens Não Testados, Dados reais, Troca de sessão, Edge Functions).
- Os demais achados da revisão: `README.md` fora da lista de cópia, `custos.md` sem coluna de funcionalidade, `wayfinder` sem procedimento, `grill-me` como alternativa, modelo recomendado indefinido, backup antes do `link` de produção, alvo do banco em `AMBIENTES.md`, deriva entre FLUXO/README/GLOSSARIO e os comandos, glossário incompleto e as frases de contraste que o estilo pede para evitar.

## v1.8 — 2026-10-01

**Motivo.** Uma segunda análise da especificação da Plataforma do Escritório de Processos (EP) contra a v1.7 achou lacunas do protocolo, e não da especificação. Esta versão fecha as que são do DevFlow. Como a v1.7, nada foi testado num projeto real; a documentação do Supabase foi conferida para o que mudou.

**Edge Functions (seção nova no `CLAUDE.md`)**
- Antes só existia a regra de parar e perguntar. Agora há o roteiro: pasta `supabase/functions/<nome>/`, chave só como variável de ambiente da função, a função confere por conta própria quem a chamou (usuário logado, ativo, com o perfil exigido), a decisão fica num arquivo puro testado no Vitest (incluindo o chamador sem permissão), entrada validada, logs sem dado pessoal, e publicação só pelo roteiro de produção do `/ship`. O exemplo é o convite de usuário pela plataforma.
- Motivo: o painel do Supabase dá acesso aos dados a quem o usa, e a criação de usuários por ele só serve a uma pessoa. A especificação do EP também prevê alertas, checagem de arquivo e cópia ao Drive. A regra manda conferir na documentação atual como a função autentica o usuário, porque a documentação mudou com as chaves novas (modo de autenticação da plataforma, novas variáveis injetadas).
- `/ship`: o passo 7 cobre `supabase/functions/` e confere cada função; o roteiro de produção lista as funções, pede os segredos e publica cada uma com aprovação e uma chamada de teste recusada.
- Fora desta versão: funções agendadas e integrações com sistema externo (README, seção 11).

**Revisão de segurança para produção (seção nova no `/ship`)**
- Cobre o projeto inteiro: banco (tabelas, views, funções, buckets contra as specs), chaves no repositório e no histórico do git, painel do Supabase de produção (cadastro fechado, SMTP, redirecionamentos, plano e backup, membros da equipe, segredos), hospedagem, ações proibidas repetidas pela API, `/security-review` do código inteiro (com revisão de reserva por pasta), `security-auditor` e inventário de dados pessoais em `.scratch/lgpd-inventario.md`. Achados e a linha final `Revisão de pré-produção em ...` ficam em `.scratch/pre-producao.md`.
- Os roteiros de publicação do banco e do site agora param na primeira vez se essa linha não existir. O `/status` avisa quando há produção ou site publicado sem ela.
- Motivo: o `/ship` revisa o diff de uma funcionalidade e nada olhava o projeto inteiro antes de a produção existir.

**Verificação do que o teste não alcança**
- O passo 1 do `/ship` manda conferir abrindo a tela o que os testes automáticos não alcançam (diagramas, aparência) e registrar como "verificado manualmente", ou "presumido" se ninguém olhou. O `/planejar` marca esses critérios com `[visual]` na spec. Motivo: o jsdom dos testes não desenha SVG nem diagrama, e o Playwright continua adiado.

**Dados**
- Arquivos de exemplo que entram no git (fixtures) não podem ter dado pessoal nem informação sigilosa.
- Antes de planejar um importador, o Claude pede uma amostra anonimizada no formato real.
- Pergunta nova no `/projeto`: se a instituição exige registrar também quem consultou cada dado (o Supabase só registra o que muda). A decisão e a de eliminação de dados a pedido ficam com você e o jurídico (README, seção 5).
- Regra "Não guarde o que se calcula": dado derivado vira view ou função, e não coluna. O `/planejar` pede, na spec, as regras de estado (transições, o que acontece ao voltar, o que é derivado) e quais perfis veem cada dado pessoal.

**Projeto novo**
- Em especificação dividida em fases, só a primeira vira a lista do `projeto.md`; as demais vão ao backlog com o prefixo do projeto ("EP v2"), para não se confundir com a numeração do DevFlow.
- Uma especificação com ordem de construção dispensa o `wayfinder` (que nunca foi testado).
- O `/setup` aponta a seção 9 do README quando `npm`, `git` ou o Supabase CLI falham por erro de rede ou de certificado.
- O `/projeto` explica por que a criação de usuários por mais de uma pessoa deve passar pela plataforma.

**Documentação**
- README (Edge Functions, revisão para produção e inventário, perguntas de leitura e de eliminação de dados, validação, roteiro para levar da v1.7; o item de Edge Functions de "Implementações futuras" foi substituído por funções agendadas e integrações), FLUXO e glossário (view, SMTP, fixture, revisão para produção, inventário, verificado manualmente). A trava de git, os testes dela e o `settings.json` não mudaram. O `DevFlow-especificacao.docx` não foi atualizado.

**Status de validação:** nada da v1.8 foi testado em projeto real. A única conferência foi de coerência entre os documentos e do fato novo sobre Edge Functions na documentação do Supabase, que a própria regra manda reconferir no primeiro uso.

## v1.7 — 2026-10-01

**Motivo.** Antes de começar a Plataforma do Escritório de Processos (EP), a especificação dela foi cruzada com o DevFlow v1.6. A stack (React, TypeScript e Supabase) cabia, mas a especificação pede login com perfis, arquivos versionados no Storage, importação de dados reais de servidores, regras impostas pelo banco, publicação do site e backup, e o pacote não cobria cinco desses pontos. Esta versão escreve as regras antes do primeiro projeto com esses recursos. Nenhuma delas foi testada num projeto real: o EP será o primeiro, e os resultados vão para `.scratch/melhorias-protocolo.md`.

**Login e perfis (regra nova no `CLAUDE.md`)**
- O login é a primeira funcionalidade do projeto; nenhuma tela de dados antes de login, perfis e RLS por perfil estarem testados. O `/projeto` coloca o login em primeiro na lista e o `/planejar` o exige antes das demais (e nunca no modo curto).
- Cadastro aberto desligado (`enable_signup = false` no `config.toml` e a opção equivalente no painel do remoto), feito no passo 7, item i, do `/setup`. Os usuários são criados por você no painel do Supabase, sem código e sem chave secreta. **Decisão tomada por padrão:** a especificação pedia que o administrador convidasse os usuários pela plataforma, o que exigiria a chave secreta numa Edge Function. Você não escolheu entre as duas opções; adotei a mais simples e mais fácil de desfazer, e a outra continua possível com ADR.
- Perfis em tabela própria ligada ao usuário do login, com a coluna `ativo`; usuário novo nasce com o perfil de menor permissão; usuário desativado perde acesso pela política e mantém o histórico. As políticas usam `(select auth.uid())` e uma função auxiliar `security definer` com `search_path` vazio, para não gerar recursão na RLS.
- A spec traz uma tabela "quem pode o quê" (linha por tabela e ação, coluna por perfil, incluindo visitante e usuário desativado). O `/ship` confere que cada célula tem teste.

**Arquivos no Supabase Storage (regra nova)**
- Bucket privado criado em migração, com as políticas de `storage.objects` na mesma migração, por perfil e com teste. Nome de arquivo por identificador, sem nome de setor, processo ou pessoa no caminho. URL assinada de curta duração, nunca guardada no banco. Tamanho máximo no bucket e formato conferido no envio. Nenhuma política dá permissão de apagar pela interface.
- O `/setup` cria `supabase/tests/01_buckets_privados.test.sql`, que falha se algum bucket for público. O `/ship` confere as políticas do Storage, os caminhos e o tamanho máximo. O `/voltar` avisa que os arquivos já enviados não voltam com o `git revert`.

**Dados reais**
- Dado pessoal real só existe em produção. O Claude escreve e testa o importador com arquivo fictício no mesmo formato; a carga real é feita por você, fora da sessão. A pasta `dados-reais/` entra no `.gitignore` e o Claude nunca lê o que há nela, como faz com o `.env`. Motivo: a regra de parar ao encontrar dado pessoal travaria a importação dos dados atuais, que têm nomes e e-mails de servidores.

**Chave secreta e Edge Functions**
- A regra de pergunta continua, com os casos previstos (convite pela plataforma, e-mail automático, cópia para outro sistema). Se uma delas for aprovada, a chave fica só numa Edge Function, em variável de ambiente da função, com ADR. O `/ship` procura a chave em `src/` e `.env.example`, e permite a leitura por variável de ambiente em `supabase/functions/`. Sem roteiro de criação, teste e publicação da função: o primeiro uso entra em "Itens Não Testados".

**Banco**
- Regras de negócio impostas pelo banco (sequência de etapas, histórico automático, versão que não se apaga) viram trigger ou função em migração, com teste antes, como as políticas. A spec lista cada regra com o gatilho e o caso de teste.
- `AMBIENTES.md` ganha as linhas "último backup de produção" e "último teste de restauração".

**Publicação e backup (seções novas do `/ship`)**
- "Publicar o site": registro da hospedagem em `.scratch/publicacao.md`, build, busca de chave secreta em `dist/`, variáveis de ambiente do banco de produção configuradas por você, conferência do cadastro fechado e do envio de e-mail, publicação com aprovação e marco.
- "Backup e restauração": o backup cobre o banco e o Storage (o backup do banco não leva os arquivos), é feito por você, fica fora do repositório, e é restaurado num banco local de teste antes de a produção receber dado real. O `/status` avisa quando falta backup ou teste.
- O comando próprio `/publicar` continua em "Implementações futuras".

**Projeto novo**
- `/projeto` parte de uma especificação pronta: lê antes de perguntar, guarda a cópia em `.scratch/especificacao.md`, leva as decisões em aberto dela ao backlog e pergunta só o que falta. O modelo de dados e as regras entram no `CONTEXT.md` pela sabatina do `/planejar`. Ganhou perguntas sobre login, arquivos e dados atuais a importar.

**Convenções**
- Dependência de produção nova (biblioteca de gráficos, visualizador) leva um ADR curto. O ESLint não lê SQL: funções do banco ficam pequenas, com uma responsabilidade e nome específico.

**Documentação**
- README (banco com login e arquivos, uso em projeto oficial, validação, roteiro para levar projetos da v1.6, itens de "Implementações futuras" atualizados; "Regras para login" saiu da lista por ter sido implementada), FLUXO, glossário (perfil, cadastro aberto, tabela "quem pode o quê", gatilho, Storage, URL assinada, Edge Function, dados reais e teste de restauração) e este changelog. A trava de git, os testes dela e o `settings.json` não mudaram. O documento de especificação (`DevFlow-especificacao.docx`) não foi atualizado.

**Fora desta versão.** Contrato e LGPD com o provedor, escolha do plano do Supabase, hospedagem do front-end e quem mantém o sistema são decisões da instituição, não do DevFlow. Sincronização com o Google Drive, alertas por e-mail e checagem de arquivos no envio dependem de Edge Function e ficam para depois do primeiro uso dela.

**Correção no mesmo dia (01/10/2026), depois de conferir a documentação do Supabase.** A primeira redação mandava criar a função auxiliar dos perfis como `security definer` sem dizer onde; em `public` ela ficaria chamável de fora pela API, com os poderes de quem a criou. Agora ela fica num schema não exposto. Entraram também: toda view com `security_invoker = true` (sem isso, a view ignora a RLS; o dashboard da Plataforma EP depende de views), a verificação dos dois no passo 7 do `/ship`, a exigência de SMTP próprio em produção (o serviço padrão só entrega a membros da equipe e a 2 mensagens por hora) e a nota de que backup automático só existe nos planos pagos.

**Status de validação:** nada da v1.7 foi testado em projeto real. A única conferência foi de coerência entre os documentos (versões, referências cruzadas, teste da trava de git, que não mudou). A tabela do README lista cada item como não testado.

## v1.6 — 2026-10-01

**Motivo.** Segundo teste real (sandbox de sugestões de simplificação, de 26 a 30/09/2026): três funcionalidades entregues, 84 testes, 97% de cobertura. O funil se sustentou. Os problemas apareceram nas bordas, onde o protocolo supunha algo que o ambiente não oferecia. Cada mudança abaixo vem de um registro do teste, e as que mexem em regra foram conferidas num projeto Vite de teste antes de entrar.

**Trava de git**
- A trava passa a vir pronta no pacote (`.claude/settings.json`, `.claude/hooks/bloquear-git-destrutivo.mjs` e o teste dela), em vez de depender da skill `git-guardrails-claude-code`, que não existe na instalação testada.
- O hook analisa só o comando que vai rodar. Texto entre aspas simples, mensagem de commit e corpo de heredoc são ignorados; `bash -c`, `eval`, `$(...)` e crases são analisados por dentro. Motivo: a versão do sandbox bloqueou três vezes um registro que só citava o comando proibido.
- Também cobre `git switch -f`, `restore` sem `--staged`, `push --force-with-lease` e `-f` agrupado (`-uf`). `git branch -d` (minúsculo) e `git clean -n` seguem liberados.
- A mensagem de bloqueio diz o que fazer: explicar ao Alex, que roda o comando no próprio terminal; para desfazer edição temporária, guardar uma cópia antes. O `git checkout --` que o agente usava para isso nasceu da worktree (abaixo) e continua bloqueado.
- 91 testes cobrem a lista de bloqueados e de liberados e a entrada e saída do hook.

**`/setup`**
- Passo 3: escolhe **ESLint** no assistente do Vite. O template atual traz Oxlint por padrão, e as regras do DevFlow são do ESLint.
- Passo 4: `typecheck` entra como script (`tsc -b`) e é confirmado. `defineConfig` vem de `vitest/config`, o que evita o erro da linha `/// <reference types="vitest/config" />` fora do topo, que só apareceu no primeiro pre-commit. O teste-fumaça clica no botão do contador para a cobertura do template fechar o piso. `@testing-library/dom` entra explícito. `.claude/worktrees/**` sai da busca de testes.
- Passo 5: hooks em `src/hooks/` ganham limite de 40 linhas por função. No teste, o limite de 20 barrou um hook aos 21 e levou a uma compactação cosmética (quatro valores numa linha). `.claude/worktrees` sai do ESLint. A regra do CLAUDE.md passa a proibir compactar linhas só para caber.
- Passo 6: cria o `.npmrc` com `legacy-peer-deps=true` antes de instalar o `madge`, que pede TypeScript 5 enquanto o projeto usa a 6. Sem isso, o erro ERESOLVE reaparecia no setup e em cada cópia do projeto. Efeito colateral conferido: o npm deixa de instalar dependências exigidas por outros pacotes, e o `@testing-library/dom` sumia do projeto e derrubava o typecheck.
- Passos 12 e 13: pre-commit (Husky + lint-staged com ESLint, typecheck e testes) e trava escritos no próprio comando, sem skill de terceiros. As duas skills citadas antes não existiam, e a alternativa de outro pacote instalava o Prettier, contra a regra do ESLint. Os comandos do pre-commit foram rodados e funcionam: um erro de lint bloqueia o commit.
- Passo 7: se o projeto tiver exigência que o Supabase não atende, o agente diz em uma frase e pergunta antes de seguir (decisão de 29/09/2026). A escolha de banco livre ficou para depois (README, seção 11).
- Passo 8: `.claude/worktrees/` entra no `.gitignore`.

**Execução**
- `/executar-complexo` passa a usar branch comum na pasta principal, sem worktree. A worktree causou atrito em quase toda execução: a pré-visualização servia a pasta principal e mostrava o código antigo, o Vitest e o ESLint contavam a cópia em dobro (84 testes viravam 168), o `npm install` da cópia dava ERESOLVE e a remoção da pasta falhou com "Permission denied" no Windows. A branch protege a principal do mesmo jeito. Worktree fica para quando o Alex pedir trabalho em paralelo, com os cuidados escritos no comando.
- O plano é salvo em `.scratch/<funcionalidade>/plano.md`, e as caixas dele são marcadas conforme as tarefas terminam.

**Entregas**
- Marca de entrega: o `/ship` grava `Entregue em AAAA-MM-DD (commit ...)` na spec e cria o marco `marco/AAAA-MM-DD-entrega-<funcionalidade>`. Motivo: "Listar sugestões" nunca passou pelo `/ship`, e o `/ship` seguinte revisou só o diff desde o marco da funcionalidade nova. A anterior ficou sem revisão de padrões e de spec, sem `desvios.md` e sem a revisão de segurança de reserva, justo a funcionalidade que passou a validar dado lido do `localStorage`.
- `/ship`, passo 0: confere funcionalidades anteriores sem marca e oferece cobri-las no mesmo `/ship`. `/planejar` e `/status` fazem a mesma conferência.
- `/ship`, passo 1: o DoD se confere contra a spec e os testes, e não contra as caixas do plano, que ficavam sem marcação. Passo 4: dado lido do armazenamento do navegador conta como dado que chega de fora.

**Planejamento**
- `/planejar` avalia o tamanho antes de escolher o modo, também quando a funcionalidade vem do `projeto.md`. Motivo: "Filtrar por setor" cabia na definição de pequena e rodou em modo completo no Opus, com 7 perguntas, todas respondidas com "sigo as recomendações".
- O comando do `to-spec` já leva o ponto de teste padrão (a tela inteira), que teve a mesma resposta em todas as execuções.
- Trata o caso de nenhuma funcionalidade pendente, que o comando não previa: sem criar marco, oferece `/projeto`, `/demanda` ou encerrar o ciclo.

**Registro entre etapas e troca de sessão**
- Regra nova: o que uma etapa produz e a seguinte usa vai para arquivo antes de a etapa terminar. As concepções salvam a proposta aprovada em `.scratch/identidade-visual.md`, e o `/implementar-identidade` lê de lá. Motivo: a troca de modelo com `/clear` apagava a proposta, e o comando supunha encontrá-la na conversa.
- `/implementar-identidade` também confere divergência entre `PRODUCT.md` e `projeto.md`, descreve o `shape` como a skill que só pergunta e resume, e manda comitar antes do `code-review`.
- `/concepcao-premium` reaproveita o conceito do `/concepcao-livre` quando ele já rodou na conversa e não foi rejeitado.
- Retomada pelo `/status`, que lê os arquivos e o handoff mais recente, e em divergência valem os arquivos. O handoff leva só o que os arquivos não guardam, e o novo substitui os anteriores. Motivo: o handoff ficou desatualizado em pelo menos três momentos, duas vezes no mesmo dia, duplicando o que o `/status` já lê.
- Os comandos `/polir` e `/executar-*` dizem onde procurar tickets pendentes (`.scratch/<funcionalidade>/issues/`; sem a pasta, a spec é o único ticket). O usuário precisou perguntar.
- `/cost`: o lembrete pede o comando antes de trocar de sessão, com uma linha por sessão em `.scratch/custos.md`; sem valor no plano, `/usage`.
- Regra de skill ausente no CLAUDE.md: tentar o `/reload-skills` uma vez e, se continuar ausente, parar e mostrar opções, sem simular nem trocar por skill de outro pacote.

**Retirado**
- `/clear` + `/model` como caminho padrão de troca de modelo (v1.5). Foi adotado por engano: a descoberta aconteceu numa situação específica, de sessão remota, e não deveria ter virado regra geral. Ele continua disponível quando o Alex pedir.
- Referências às skills `setup-pre-commit` e `git-guardrails-claude-code` do Matt Pocock (setup, README, glossário).

**Documentação**
- README: arquivos do pacote (inclui `.claude/settings.json` e `.claude/hooks/`), tabela de validação reescrita com o resultado do segundo teste, roteiro para levar projetos da v1.5 e a ideia "Escolha de banco em aberto" em Implementações futuras. FLUXO, glossário (inclui `localStorage`, `.npmrc`, trava de git e marca de entrega) e este changelog atualizados. O `/voltar` ganhou ajustes menores: branch além de worktree, e retirar a marca de entrega quando a funcionalidade inteira sai.
- O documento de especificação (`DevFlow-especificacao.docx`) não foi atualizado.

**Status de validação:** ver a tabela atualizada no `README.md`. Validados no segundo teste: pre-commit, regras de lint, cobertura e `madge` (com contorno), `/concepcao-*`, `/implementar-identidade` completo, `/planejar` completo com `grill-with-docs` e `CONTEXT.md`, spec como ticket único, `desvios.md`, spec viva, revisão de segurança de reserva, relatório verificado/presumido, marcos, regra de parada e handoff em `.scratch/`. Testados com falha: passos 12 e 13 do `/setup`, lembrete de próximo passo e `/cost` por funcionalidade. Sem uso ainda: `/demanda`, `/voltar`, `/status`, modo curto do `/planejar`, `wayfinder`, regra do `--no-verify` e banco de dados. Nada do que é novo na v1.6 foi testado num projeto real; o pre-commit, o `.npmrc`, o typecheck, as regras de lint e a trava foram rodados num projeto Vite de teste, mas a trava ainda não foi vista ativa dentro do Claude Code.

## v1.5 — 2026-09-25

**Motivo.** Primeiro teste real do DevFlow (sandbox de sugestões de simplificação de processos, sem acesso ao desktop da Casa Civil): validou vários itens da v1.2 e revelou três problemas de execução, corrigidos abaixo.

**Sessão e troca de modelo**
- Caminho padrão passa a ser `/clear` + `/model`, na mesma sessão, em vez de sessão nova com `/mattpocock-skills:handoff`. Motivo: o teste mostrou que `/clear` já descarta o histórico que o cache protegeria, então a troca de modelo logo depois não reprocessa nada a preço cheio — e não depende de abrir a sessão em outro dispositivo (o controle remoto pelo celular só oferece ambientes de nuvem para sessão nova, sem acesso ao projeto local).
- `/mattpocock-skills:handoff` e sessão nova ficam reservados para pausa entre dias, troca de máquina ou de dispositivo. Nesse caso, o comando que chama o handoff passa a instruir explicitamente salvar em `.scratch/handoff-AAAA-MM-DD.md`. Motivo: a skill, por padrão, salva numa pasta temporária do sistema operacional, fora do projeto e sem git — achado do teste, não uma instrução dada por engano.
- Nova regra: ao encerrar uma sessão (pausa longa, fim do dia, claude-mem indisponível ou por pedido), rodar o handoff salvando em `.scratch/`. Motivo: memória de sessão não substitui os registros escritos do projeto.

**claude-mem**
- Registrado o limite: depende de cota de inferência do provedor externo, pode parar de gravar sem aviso, e reiniciar o plugin não resolve.

**Comunicação**
- O fechamento de resumo de duas ou três linhas passa a valer só para relatórios técnicos de verdade, nunca para uma resposta curta ou uma etapa de conversa, e nunca repetindo o que o corpo da resposta já disse. Motivo: nos dois primeiros testes, esse parágrafo repetiu a resposta de forma redundante.
- "Itens Não Testados" esclarece que o Claude registra o esperado e o observado, sem concluir se a regra "funcionou" — essa validação é do Alex, feita depois. Motivo: o teste mostrou o agente se auto-avaliando ao seguir essa regra ao pé da letra; a regra em si (registrar em `.scratch/melhorias-protocolo.md`) estava correta e não muda.

**Status de validação:** ver a tabela atualizada no `README.md`. Validados neste teste: `/projeto` propor a si mesmo quando a ideia é descrita direto, `brainstorming` disparando só com ideia em aberto, e `/clear` + `/model` como troca de modelo. Testado com falha, e observado de novo: pergunta sobre desativar o claude-mem junto do aviso de dado pessoal (fez o aviso, pulou a pergunta) e o destino do handoff (corrigido acima, ainda não testado de novo).

## v1.4 — 2026-09-25

**Banco de dados com Supabase.** Motivo: o segundo sandbox (registro de sugestões para uma equipe) mostrou que uma lista compartilhada exige banco, e os projetos reais, como o Diagnóstico ESG, usam Supabase. Até aqui o DevFlow só previa dados guardados no navegador.

**Dois ambientes**
- Desenvolvimento e produção sempre separados, registrados em `supabase/AMBIENTES.md`. O Claude trabalha só no desenvolvimento e confere o alvo antes de alterar o banco. Motivo: com um banco só, uma migração errada do agente apaga dados reais, e o `git revert` não desfaz isso.
- Desenvolvimento recomendado: Supabase local, via Docker. Alternativa: projeto remoto só para desenvolver, quando o Docker não roda na máquina.
- Publicação em produção pelo roteiro do fim do `/ship`, só a pedido, com backup e aprovação no momento.

**Comandos**
- `/projeto`: pergunta se os dados precisam ser vistos por mais de uma pessoa ou em mais de um computador.
- `/setup`: passo 7 novo (banco de dados), com Supabase CLI, `.env.example`, `AMBIENTES.md`, ponto único de conexão em `src/lib/supabase.ts`, scripts `db:types`, `test:db` e `db:reset` (local), tipos gerados fora do lint e teste `00_rls_ligada`. Os passos seguintes foram renumerados (8 a 13).
- `/planejar`: seção Modelo de dados na spec, com tabelas, permissões (que viram políticas de RLS) e aviso de migração destrutiva.
- `/executar-simples` e `/executar-complexo`: banco primeiro, com teste de política antes da migração; funções de acesso por tabela; migração, teste e tipos no mesmo commit.
- `/ship`: passo 7 novo (banco de dados) com testes de banco, tipos em dia, alerta de migração destrutiva e busca por chave secreta; `/security-review` também para mudança de migração ou política; seção de publicação em produção. Passos seguintes renumerados (8 a 11).
- `/demanda`: funcionalidade que precisa de migração deixa de ser pequena; bug no banco se corrige com migração nova e teste de banco.
- `/voltar`: trata migrações desfeitas no banco local e nas já publicadas.
- `/status`: aponta migrações ainda não publicadas em produção.

**Regras e documentação**
- `CLAUDE.md`: seção Banco de Dados.
- Chave publicável (`sb_publishable_...`) no lugar da `anon`, que o Supabase descontinua até o fim de 2026.
- README: escopo, Supabase CLI e Docker, uso em projeto oficial, status de validação, migração de projetos e três implementações futuras (`/publicar`, regras para login, Edge Functions). FLUXO e glossário atualizados.

**Status de validação:** nada desta versão foi testado ainda.

## v1.3 — 2026-09-25

**Segurança do próprio código**
- O `/ship` passa a pedir o `/security-review`, comando embutido do Claude Code, quando a funcionalidade envolve login ou permissões, dados pessoais ou dados que chegam de fora. Motivo: o `security-auditor` só confere os pacotes de terceiros; falhas escritas no código do projeto ficavam só com o `code-review`, que não foi feito para isso.
- Achados reais são corrigidos com teste; falsos alarmes são explicados. Se o comando não achar mudanças para revisar (ele compara a branch atual com a principal), o Claude faz uma revisão de reserva e avisa.

**Revisão geral**
- `/executar-simples` e `/executar-complexo` indicam `/polir` só se a funcionalidade mexeu na interface; senão, `/ship`. Ajuste pequeno segue o caminho do `/demanda`.
- `/polir` não manda para o `/ship` quando veio de ajuste pequeno ou bug.
- `/implementar-identidade` aponta a primeira funcionalidade do resumo do projeto e o modelo recomendado.
- Referências a `master` trocadas por "branch principal", porque o git pode criar a branch como `main`.

**Documentação**
- README: `/security-review` entre as ferramentas; `/adotar` registrado em "Implementações futuras"; a seção 2 deixa claro que ainda não há caminho definido para sistemas antigos.
- Decidido não criar variante do DevFlow para backend sem interface, nem como implementação futura.

**Status de validação:** nada desta versão foi testado ainda.

## v1.2 — 2026-09-25

**Nome novo:** o Protocolo Alex Macedo passa a se chamar DevFlow. Um nome neutro facilita compartilhar com colegas. As entradas abaixo mantêm o nome antigo.

**Começo do projeto**
- Comando novo `/projeto` (treze comandos no total), antes do `/setup`: conversa sobre a ideia do projeto inteiro com o `brainstorming` e grava o resumo em `.scratch/projeto.md`. Motivo: o setup escolhe a tecnologia e a concepção define o visual sem saber o que o projeto é; o `brainstorming` só aparecia no `/planejar`, no nível de cada funcionalidade.
- O `/setup` só segue se o resumo existir. As concepções, o `/planejar` e o `/status` passam a lê-lo.
- Se você começar descrevendo a ideia sem rodar o comando, o Claude propõe o `/projeto` e aproveita o que foi dito.

**Métricas de qualidade**
- Regras de complexidade (10 caminhos por função), tamanho de arquivo (300 linhas) e tamanho de função de lógica (20 linhas) no ESLint, que já rodava no pre-commit. Motivo: convenções que eram só texto passam a bloquear o commit, quase sem custo de tokens.
- Relatório de cobertura com piso de 70%, conferido no `/ship`. Piso baixo de propósito: serve de mapa de esquecimentos; perseguir 100% leva a testes feitos só para bater o número.
- Checagem de dependência circular com `madge` no `/ship`.

**Planejamento**
- Modo curto do `/planejar` para funcionalidade pequena: três a cinco perguntas, spec enxuta, sem sabatina completa. Sobe para o modo completo se aparecer regra de negócio, outra tela ou mudança nos dados.
- `brainstorming` só quando a ideia ainda está aberta. Motivo: com a ideia definida, as perguntas dele antecipavam as da sabatina.
- Toda spec e todo ticket abrem com um parágrafo de como resolvem o problema. Motivo: se não cabe num parágrafo, a tarefa está grande ou confusa.
- Spec de tela que carrega dados descreve os estados de carregando, vazio e erro. Motivo: painéis, o tipo de projeto mais comum no uso previsto, quebram sem isso.

**Demandas e entrega**
- `/demanda` ganha o tipo "funcionalidade pequena", faz até duas perguntas quando a descrição não basta e, na dúvida entre funcionalidade pequena e nova, pergunta em vez de escolher o mais rigoroso.
- Relatório final do `/ship` e do caminho de bug separa o que foi verificado do que foi presumido. O Superpowers já exige evidência; faltava tornar visíveis as suposições.

**Documentação**
- README com a seção "Implementações futuras": bloqueio de segredos, testes E2E, modo mock, testes de mutação e regras de camada, cada um com o que é, por que ficou para depois e quando retomar. Também ganhou as ferramentas de verificação e o roteiro para levar projetos da v1.1 para a v1.2.
- Glossário com cobertura, complexidade, dependência circular, estados de tela, funcionalidade pequena, resumo do projeto, E2E e teste de mutação.

**Status de validação:** nada desta versão foi testado ainda. Os itens estão no `CLAUDE.md` e na tabela do `README.md`.

## v1.1 — 2026-09-23

**Planejamento proporcional**
- Funcionalidade que cabe numa entrega só não passa pelo `to-tickets`: a spec funciona como o único ticket, depois da sua confirmação.
- O plano do `writing-plans`, nos tickets complexos, contém só a execução e cita os requisitos pela referência, sem reescrevê-los. Motivo: no teste, a mesma funcionalidade foi descrita três vezes (spec, ticket e um plano de 694 linhas).

**`CLAUDE.md` enxuto (~5.700 → ~2.300 tokens)**
- O Setup Inicial virou o comando `/setup` (doze comandos no total). O `CLAUDE.md` só lembra de rodá-lo quando o projeto é novo.
- Os lembretes de próximo passo foram para dentro de cada comando; no `CLAUDE.md` ficou uma regra geral de reserva. Motivo: no teste, lembretes escritos nos comandos funcionaram melhor que os escritos só no `CLAUDE.md`.
- A regra de worktree foi para o `/executar-complexo`, e a nota do `grill-with-docs` ficou só no `/planejar`.
- Convenções, precedência, registros e itens não testados foram reescritos de forma mais curta, sem remover regra.
- A manutenção da cópia mestra ficou só no `README.md`.

## v1.0 — 2026-09-23

Primeira versão, construída e validada num projeto de teste (sandbox: página de um ateliê de violões com formulário de contato).

**O que o protocolo tem**
- Funil em seis etapas: concepção visual, implementação da identidade, planejamento, execução (simples ou complexa), polimento e entrega.
- Setup inicial conduzido pelo Claude: perguntas sobre dados pessoais e auditoria dos pacotes, scaffold, ambiente de teste, pre-commit e proteção contra comandos git destrutivos.
- Comandos de apoio: `/demanda` (bugs, ajustes e mudanças depois da primeira versão), `/voltar` (desfazer sem apagar histórico) e `/status` (onde o projeto está).
- Regras de comunicação para quem não é desenvolvedor, ordem de precedência entre instruções, regras de dados e segredos, convenções de código, marcos e regra de parada.
- Registros do projeto: spec viva, ADRs e `desvios.md` nunca editados, backlog, custos e melhorias do protocolo.

**Lições do teste que viraram regra**
- Algumas skills do Matt Pocock recusam ser acionadas de dentro de outro comando; os comandos passaram a parar e devolver o comando pronto.
- O agente pulou TDD numa tarefa que julgou trivial, citando o Ponytail; entraram as regras "nunca pule o funil" e "Ponytail simplifica a solução, nunca o processo".
- A lembrança de próximo passo escrita só no `CLAUDE.md` falhou duas vezes; passou a ser repetida em cada comando.
- A identidade visual proposta na concepção nunca virou código; nasceu o `/implementar-identidade`.
- Um problema de acessibilidade não corrigido se espalhou de dois para quatro botões entre dois tickets; o `/polir` passou a rodar a cada ciclo.
- A skill `security-auditor` falha no Windows; o `/ship` registra o contorno.
- O modelo de spec imutável deixaria a descrição do sistema espalhada e desatualizada; adotou-se spec viva, com o plano original preservado no git.

**Removido nesta versão**
- `/documentar-funcional` (documento de aprovação com RF/RNF): rodava cedo demais para ter os achados de auditoria. Pode ser pedido avulso, quando necessário.

**Status de validação:** ver a tabela no `README.md`. Os itens não testados estão listados no `CLAUDE.md`, que pede relato na primeira execução de cada um.
