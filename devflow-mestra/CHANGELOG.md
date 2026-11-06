# Changelog — DevFlow

Uma entrada por versão, da mais recente para a mais antiga. Entradas antigas nunca são editadas. O histórico das versões 1.x (até a v1.9) está em `CHANGELOG-v1.md`.

## v3.3 — 2026-11-06 (/situação mais leve)

**Motivo.** No projeto de origem, o `/situação` passou a demorar: a bateria tinha 3.793 testes em 283 arquivos (cerca de 2 minutos em 4 processadores, mais no Windows), e ele ainda lia o backlog inteiro (72 KB) só para dizer quantos itens havia.

**Mudou**
- `/situação`, passo 3: `npm test` só quando há mudança não comitada. Sem mudança, o último commit já passou pelo pre-commit e a bateria inteira roda no `/ship` e no CI.
- `/situação`, passo 1: o backlog não é lido; conta-se só o número de itens. A leitura fica a pedido do usuário.
- `nao-testados.md`: item das duas mudanças.

## v3.2 — 2026-11-06 (comando pronto para copiar)

**Motivo.** O fim de sessão dizia o próximo comando pelo nome, e o usuário tinha de montar o texto sozinho na sessão nova.

**Novo**
- `CLAUDE.md`, Funil de Trabalho: regra "Comando pronto para copiar". Ao pedir uma sessão nova, o Claude traz o texto completo de cada comando, na ordem e um por bloco de código (`/situação` primeiro, depois o da etapa, com o ticket ou a funcionalidade), diz o modelo e grava o mesmo texto em `.scratch/proximo-passo.md`.
- `nao-testados.md`: item da regra nova.

## v3.1 — 2026-11-06 (spec, tickets, implementação e revisão de segurança como regras próprias)

**Motivo.** Quatro peças faziam o funil parar para o usuário digitar um comando: `to-spec` e `to-tickets` no `/planejar` (66 paradas no projeto de origem), `implement` no `/executar-simples` (34) e `/security-review` no `/ship` (34). Nas três skills do Matt Pocock, o protocolo já acrescentava quase tudo à mão (seções exigidas na spec, pedido de menos tickets, regras de banco e vitrine no resumo do `implement`), e o texto colado no lugar do comando muitas vezes não disparava a skill. O `/security-review` chegava com diff vazio em quase toda entrega, porque o trabalho já estava na principal, e a revisão de reserva acabava fazendo o serviço. A sabatina (`grill-with-docs`) continua como skill e como parada: é a parte em que o usuário decide.

**Novo**
- `.claude/regras/spec-e-tickets.md`: como o Claude escreve a spec depois da sabatina (sem entrevista nova, ponto de teste confirmado antes, modelo de nove seções com as exigidas pelo protocolo, numeração continuada numa spec existente, decisões novas listadas para confirmação) e os tickets (fatias verticais, refatoração larga em três tempos, primeira proposta enxuta, lista mostrada antes de gravar, numeração depois dos concluídos, conferência final).
- `.claude/regras/revisao-seguranca.md`: revisão de segurança própria, sobre o diff desde o marco de início (ou o código inteiro, na revisão para produção), por subagente de leitura, com lista de foco, filtro de confiança 8 feito pelo Claude, correção com teste e relatório em português. O `/security-review` fica como segunda opinião opcional.

**Mudou**
- `/planejar`, modo completo: passos 3, 5 e 6 escrevem a spec e os tickets pela regra nova; a única parada para digitar comando é a sabatina.
- `/executar-simples`: executa o ticket na mesma sessão (banco primeiro, TDD por `tdd.md`, uma revisão de código, registro de conclusão), sem devolver o `implement`.
- `/ship`, passo 4, e `producao.md`, passo 7: revisão por `revisao-seguranca.md`, sem parar para o `/security-review`.
- `CLAUDE.md`, parágrafo "Skills": as de invocação direta usadas pelo funil passam a ser `grill-with-docs` e `wayfinder`, e o trabalho das quatro peças retiradas é do Claude.
- README (tabela de skills, notas, lista de regras, seção 6 com o caminho a partir da v3.0, exemplos de numeração), `GLOSSARIO.md` (PR, Skill, Spec, Ticket), `implementar-identidade.md` e `nao-testados.md`.

**Fica para depois.** As skills de plano e execução do Superpowers no `/executar-complexo`, o `finishing-a-development-branch`, o `handoff` como regra e a decisão sobre o Ponytail.

## v3.0 — 2026-11-06 (retirada do claude-mem, da Apple Design Skill e do security-auditor)

**Motivo.** A análise de skills e plugins do projeto de origem (228 sessões, cerca de 200 registros de melhoria) apontou três peças que custavam mais do que entregavam. O claude-mem teve 25 avisos de cota esgotada desde meados de outubro, o projeto seguiu sem ele porque os arquivos de `.scratch/` já guardavam o andamento, e ele gravou capturas com dado pessoal. A Apple Design Skill nunca foi usada: o `/concepcao-premium`, único comando que dependia dela, não rodou nenhuma vez. O `security-auditor` rodou uma vez, e o script dele falha no Windows; o `/ship` já mandava rodar `npm audit --json` direto. A versão é inteira porque o funil perde um comando.

**Saiu**
- Comando `/concepcao-premium` e a Apple Design Skill da lista de instalação. A etapa 1 do funil passa a ser só o `/concepcao-livre`.
- claude-mem: a regra de cota esgotada, a pergunta sobre desativá-lo ao achar dado pessoal, o caso "claude-mem indisponível" do handoff (agora são três casos), a sugestão de desativá-lo no passo 2 do `/setup`, o parágrafo de instalação e o verbete do glossário.
- Skill `security-auditor` da lista de instalação.

**Mudou**
- `/ship`, passo 3: a auditoria de pacotes vira regra própria. Roda `npm audit --json` e `npm audit --omit=dev --json`, monta o relatório por severidade, separa produção de desenvolvimento, lê `fixAvailable` e `isSemVerMajor`, define achado real (crítica ou alta em dependência de produção) e proíbe `npm audit fix --force`. Passos 8 e 10 e o passo 7 da revisão de segurança para produção (`producao.md`) passam a falar em "auditoria de pacotes".
- `CLAUDE.md`, Ordem de Precedência: a memória de sessões passadas citada é a memória automática do Claude Code.
- `/setup`, passo 2: com dado pessoal no projeto, lembra a regra de "Dados e Segredos" em vez de sugerir desativar o claude-mem.
- README: seção 6 com o caminho a partir da v2.0.x (apagar o comando, desinstalar os plugins, apagar a pasta `.claude-mem`); exemplos de numeração da seção 9 atualizados; seção 10 sem número de versão no título.
- `nao-testados.md`: bloco novo para a auditoria de pacotes sem skill e para o projeto sem claude-mem.

**Fica para depois.** As outras propostas da análise (`implement`, `writing-plans`, `executing-plans`, `finishing-a-development-branch`, `handoff` e `/security-review` como regras próprias; `to-spec` e `to-tickets` numa segunda rodada; a decisão sobre o Ponytail) não entraram nesta versão.

## v2.0.2 — 2026-11-06 (lacunas apontadas pelo material "111 conceitos de engenharia")

**Motivo.** Comparação do DevFlow com uma lista de 111 conceitos de engenharia e o "top 15" do que mais derruba app em produção. Em segurança de dados o DevFlow já ia além; as lacunas estavam no que acontece depois de estar no ar e no desempenho. Entrou só o que serve a um sistema pequeno em Vite, React e Supabase. A lista dos 111 não foi copiada: cerca de 60 itens são de sistema distribuído e em escala.

**Novo**
- `banco.md`, seção "Desempenho e edição simultânea": índice em coluna de filtro, ordenação, junção e política de RLS; sem `select *`; sem consulta por item (N+1); coluna `versao` para tabela editada por mais de uma pessoa, com teste do conflito. Conferência correspondente em "Conferências do /ship".
- `/ship`, passo 4: checagens explícitas da interface antes do `/security-review` (`dangerouslySetInnerHTML`, `innerHTML`, `target="_blank"` sem `rel`, `href` com protocolo de usuário, arquivo enviado exibido como HTML ou SVG, CORS aberto em função).
- `producao.md`, roteiro "Operação depois da publicação": alerta de erro por e-mail, logs sem dado pessoal, quem avisa e quem decide voltar, pós-mortem de uma página.
- `/planejar`: a seção Modelo de dados pergunta sobre edição simultânea e colunas de busca; `/demanda`: bug que chegou à produção grava o pós-mortem.
- `auditoria-prontidao.md` (**rascunho, não ligado a nenhum comando**): 23 pontos para Vite e Supabase, em formato de tabela com evidência por arquivo e linha, sem inventar problema e sem mudar nada antes do plano.

**Fora de propósito:** limite de requisições, idempotência, observabilidade pesada, SLO e plantão. Só entrariam num projeto com pagamento ou integração crítica (os pontos 20 a 23 do rascunho, condicionais).

## v2.0.1 — 2026-11-05 (caminho curto para funcionalidade pequena)

**Motivo.** No projeto de origem, uma funcionalidade pequena (sem tickets, uma tela) levou cerca de 1 hora do `/planejar` à marca de entrega, e a maior parte não era código: seis commits só de registro (cada um com a suíte inteira no pre-commit da v1.9), spec de 6 a 7 KB, duas revisões de código, marca em dois tempos e troca de sessão entre as etapas.

**Novo**
- Comando `/rapido`: condição de entrada rígida (uma tela, sem regra nova, sem migração, sem dependência, sem login nem dado de fora, uns 5 arquivos), ficha de 10 a 15 linhas (única parada), TDD na mesma sessão, tela conferida na vitrine, só o `audit` do Impeccable, uma única revisão de código, conferências de cobertura e dependência circular, dois commits e uma marca `Entregue em` com um marco. Pára e aponta o `/planejar` se a condição falhar na entrada ou no meio do trabalho.
- `.claude/regras/tdd.md`: regra de TDD própria, feita de `/mattpocock-skills:tdd` (fronteira pública, maus testes, ritmo) e `/superpowers:test-driven-development` (ver o teste falhar pela razão certa, código mínimo, apagar o que veio antes do teste) mais as regras do projeto. Usada pelo `/rapido`. Não desliga nenhuma das duas skills.

**Mudou**
- `/demanda`: "funcionalidade pequena" aponta para o `/rapido` (o `/planejar` modo curto continua como alternativa); infraestrutura e ferramentas ganhou caminho próprio.
- `CLAUDE.md`: linha do `/rapido` na tabela do funil e referência ao `tdd.md` nas Convenções de Código.

**Estimativa, não medição:** de cerca de 1 hora para 25 a 35 minutos na feature de referência. Confirmar medindo no primeiro uso (com "Custo ligado.", o `/rapido` anota início e fim).

## v2.0 — 2026-11-05 (cópia mestra generalizada)

**Motivo.** A v1.9 foi usada de ponta a ponta num projeto real durante um mês, e o registro de melhorias acumulou cerca de 200 sugestões. A v2.0 leva à cópia mestra o que valeria para qualquer aplicação web com interface e deixa de fora o que dependia do assunto ou da tecnologia daquele projeto.

**Escopo explícito.** Vite + React + TypeScript, Windows, com ou sem banco Supabase. Outras pilhas e sistemas ficam fora até haver prova de uso.

**Novo**
- `.claude/regras/interface.md`: princípios de interface (revelação progressiva, uma ação principal por tela, ações raras num menu, a pergunta principal respondida primeiro, estilo dos controles, estados) e a **vitrine** (app com dados falsos e login falso, `npm run vitrine`), usada pelo `/executar-*`, `/polir` e critérios `[visual]` do `/ship`. O `/setup` a cria (passo 6a).
- `.claude/regras/execucao.md`: receitas de execução no Windows (scripts em Node, gravação de arquivos, fim de linha, envio da branch antes do `-d`, disparo de workflows com e sem `gh`, ordem do ciclo de banco, ensaio da migração).
- `.claude/regras/producao.md`: os roteiros de produção (banco, site, backup e restauração, revisão de segurança), tirados do `/ship`, que passou de 30 KB para cerca de 13 KB.
- `.claude/modelos/`: scripts de teste de banco com ensaio de migração, trava do projeto e relatório TAP (com os testes deles), `aplicar-migracao.mjs` e três workflows do GitHub Actions (testes de banco, migração do desenvolvimento, verificação).
- Três ciclos de teste e migração do banco de desenvolvimento (A: Docker local; B: remoto com a porta aberta; C: remoto com a porta fechada, pelo GitHub Actions), escolhidos no `/setup` depois de testar a porta.
- `.scratch/proximo-passo.md` como regra geral (antes era ajuste de um projeto): toda sessão que recomenda um próximo passo o grava, e o `/situação` o lê.
- `.gitattributes` com `eol=lf`, `.nvmrc`, `launch.json` com a entrada `vitrine`, bloco "Agent skills" pronto no `CLAUDE.md` e `docs/agents/`.

**Mudou**
- **Custo desligado por padrão**, ligado por "Custo ligado." na seção de ajustes do projeto.
- **Pre-commit:** lint e só os testes ligados aos arquivos do commit (`vitest related`), mais typecheck. A suíte inteira roda no `/ship` e no CI. Não testado em projeto real (está em `nao-testados.md`).
- `/projeto`: pergunta o que as pessoas usam hoje no lugar e se há dados atuais para trazer; avisa quando a pilha não é a do DevFlow.
- `/planejar`: caminho para spec ainda não executada que volta a mudar, desistir antes da spec, ler `banco.md` e `interface.md` no começo, pergunta principal por tela, decisões novas listadas, busca de testes antigos que a migração quebra, tickets enxutos em fatias verticais, confirmação dos padrões antes do próximo comando. Saiu o parágrafo do importador de dados reais, que era do projeto de origem.
- `/demanda`: lista de itens, exploração livre, pacote misto, bug com mudança maior na mesma tela, infraestrutura e ferramentas, teste instável e bug intermitente, ciclo com teste vermelho passando pela principal no CI.
- `/ship`: regra de retomada, "só bloqueia o que o passo 12 lista", revisão de reserva quando a branch já é a principal, `/security-review` antes de enviar a principal, dispensa da segunda revisão quando só mudou CSS, conferência de que `dist/` não leva a vitrine; roteiros e conferências de banco movidos para `producao.md` e `banco.md`.
- `/executar-*`: envio da branch antes do `-d`, versão falsa na vitrine por ticket de tela, ciclo C de banco, caixas marcadas pela ferramenta de edição, servidor da vitrine encerrado ao fim.
- `/concepcao-*`: imagens de referência, limite de rodadas, modo "consolidar protótipos aprovados", estilo dos controles na identidade.
- `/polir`: parte da vitrine; achado que muda comportamento vai para ticket ou backlog.
- `/setup`: item k do passo 7 (ciclo C), teste da porta, `gh`, `.gitattributes`, workflow de verificação, skills do Matt Pocock já configuradas.
- `/situação` lê `proximo-passo.md`; `/voltar` ignora o que é de banco em projeto sem banco.

**Saiu**
- `FLUXO.md` (repetia os comandos e envelhecia; os comandos são a fonte).
- A lista de itens não testados da v1.x: o que um projeto real já exercitou foi retirado, e a lista recomeçou com o que a v2.0 acrescentou.

**Não feito (ver "Pendências conhecidas" do README)**
- Correção dos falsos positivos da trava de git.
- Roteiros e workflows automatizados de produção.
