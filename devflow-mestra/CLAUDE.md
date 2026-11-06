# DevFlow — v3.0 (2026-11-06)

Igual em todos os projetos; exceções de cada projeto ficam na última seção. O detalhe de cada etapa está no comando dela (`.claude/commands/`); este arquivo traz as regras que valem em qualquer momento, inclusive fora do funil. Serve a aplicações web com interface, em Vite + React + TypeScript, com ou sem banco Supabase, em Windows.

## Como falar comigo

* Não sou desenvolvedor. Explique em uma frase cada termo técnico que usar; se ele não estiver no `GLOSSARIO.md`, sugira incluí-lo.
* Toda decisão que você me pedir vem com: as opções em linguagem simples, o efeito prático de cada uma, a sua recomendação com o porquê e qual é mais fácil de desfazer.
* Se eu responder "não sei", siga a opção mais conservadora e reversível e registre que foi escolha padrão: no ADR ou no `desvios.md`, se a etapa tiver um; senão, em `.scratch/backlog.md`.
* Relatório técnico extenso (auditoria, bug corrigido, decisão técnica longa) fecha com duas ou três linhas: o que foi encontrado, o que foi corrigido e o que depende de mim, sem repetir o que já foi dito; sem nada novo a condensar, o parágrafo não é escrito. Resposta curta, pergunta de decisão e etapa de conversa terminam sem esse fechamento. O `/ship` e o caminho de bug do `/demanda` têm formato próprio, que prevalece.
* Aviso de dado pessoal vai numa mensagem só dele, sem outra decisão junto.

## Diretrizes Gerais

* Use `npm` para instalar e gerenciar pacotes.
* Siga o Ponytail: nenhuma dependência desnecessária (YAGNI); prefira recursos nativos da web.
* **Nunca use `git commit --no-verify`** nem contorne o pre-commit de outro jeito. Se o hook bloquear, corrija a causa.
* **Ambiente: Windows.** Scripts de apoio e edições em lote usam `node` (o projeto já o tem), nunca Python nem heredoc grande; arquivos se gravam com a ferramenta de arquivo. As receitas de execução estão em `.claude/regras/execucao.md`.
* **Projeto novo:** se `.scratch/projeto.md` não existir, antes de qualquer outra coisa lembre-me de rodar `/projeto`. Se eu começar a descrever o que quero construir, não construa nada (nem scaffold, nem configuração): proponha o `/projeto` e aproveite o que eu já disse como ponto de partida. Se o resumo existir e `.scratch/inicio-projeto.md` não tiver a linha `setup concluído em`, lembre do `/setup`.

## Contexto do Projeto

O resumo do projeto inteiro (o que é, para quem, funcionalidades principais em ordem) vive em `.scratch/projeto.md`, mantido pelo `/projeto`. O domínio (termos, entidades, atores, regras de negócio fixas) vive em `CONTEXT.md`, mantido pela sabatina do `/planejar`. Se o `CONTEXT.md` existir, leia antes de propor abordagens ou escrever código com regra de negócio. Ao notar um fato durável do domínio que ainda não está lá (ou se o arquivo ainda não existir), proponha a redação e aplique depois que eu confirmar.

## Dados e Segredos

* Testes, exemplos, fixtures e `seed.sql` usam só dados inventados. Dado pessoal real só existe em produção.
* Nunca leia nem exiba segredos (`.env`, `.env.local`, `.env.*.local`, chaves, senhas, tokens) nem o conteúdo da pasta `dados-reais/`. Para saber quais variáveis existem, use o `.env.example`, sem valores. Se a saída de um comando trouxer uma chave, não repita o valor.
* Ao encontrar dado pessoal ou sensível (nome completo de pessoa real, CPF, e-mail ou telefone real, dado de saúde): pare de trabalhar com ele e informe o que encontrou sem repetir os dados.
* **Dados reais** (planilhas, e-mails `.eml`, documentos, bases de outros sistemas) ficam fora da sessão. A pasta `dados-reais/` (ignorada pelo git) é minha. Um importador se escreve e se testa com arquivo fictício no mesmo formato, e a carga real eu rodo no meu computador. Se eu quiser que você veja um exemplo com nome ou e-mail de pessoa, peça que eu o anonimize antes.
* Arquivo de exemplo que entra no git (diagrama, planilha) vai sem nome de pessoa, e-mail, número de documento ou informação sigilosa da instituição. Na dúvida, pergunte antes de copiá-lo para o projeto.

## Banco de Dados (Supabase)

Vale quando o projeto tem a pasta `supabase/`; sem ela, nada desta seção se aplica. **Antes de planejar, criar ou alterar migração, política, view, função, gatilho, `seed.sql`, bucket, login, Edge Function ou código de interface que envia ou abre arquivos, leia `.claude/regras/banco.md` inteiro, uma vez por sessão.** As regras que valem sempre:

* Você trabalha no desenvolvimento. Antes de qualquer comando que altere o banco ou rode contra o projeto vinculado (inclusive `npm run test:db` e `db:types` no remoto), confira o alvo (linha "vínculo atual" de `supabase/AMBIENTES.md` e, no remoto, o arquivo `supabase/.temp/project-ref`); se for produção fora de um roteiro de `.claude/regras/producao.md`, pare e pergunte.
* Estrutura muda só por migração; migração já publicada em produção fica como está, e a correção é uma migração nova. Toda tabela nasce com RLS ligada e políticas testadas na mesma migração; o teste vem antes.
* A interface usa só a chave publicável, por `src/lib/supabase.ts`. A chave secreta fica fora do projeto; se uma tarefa parecer exigi-la, pare e me mostre as opções.
* Dado que se calcula vira view ou função. Toda view tem `security_invoker = true`; função `security definer` só em schema não exposto, com `search_path` vazio.
* Com login: cadastro aberto desligado, usuários criados por mim no painel, usuário novo com o menor perfil, segurança na RLS (botão escondido não protege), e toda política testada com cada perfil, um usuário desativado e um visitante sem login. Com arquivos: bucket privado, URL assinada gerada na hora e nunca guardada, versão nunca se apaga.
* Edge Function confere por conta própria quem a chamou (logado, ativo, com o perfil exigido) antes de usar a chave secreta.
* `npx supabase login`, `link` e `unlink` são sempre meus, no meu terminal; a senha do banco nunca vem para a conversa. A saída de `supabase start` e `status` traz chaves: descarte a do `start` e deixe o `status` comigo.
* Publicar no banco de produção, publicar o site e fazer backup só pelos roteiros de `.claude/regras/producao.md`, com minha aprovação no momento.

## Interface

Vale para todo projeto, que sempre tem tela. **Antes de propor identidade, planejar ou executar tela e polir, leia `.claude/regras/interface.md`:** princípios de interface (revelação progressiva, uma ação principal por tela, ações raras e destrutivas num menu, a pergunta principal respondida primeiro) e a vitrine, a versão do app com dados falsos que serve para ver e conferir telas sem banco nem login.

## Ordem de Precedência

Em conflito entre instruções, vale esta ordem:

1. Minha instrução explícita no momento, incluindo o caminho que confirmei no `/demanda`.
2. O comando da etapa atual.
3. Este `CLAUDE.md` e os arquivos de `.claude/regras/` (entre os dois, vale a regra mais específica).
4. Regras das skills, dentro da etapa. **Vale a mais cautelosa:** skill mais rigorosa que o protocolo prevalece; skill que afrouxaria o protocolo (pular teste, revisão ou etapa) cede.
5. Memória de sessões passadas, inclusive a memória automática do Claude Code, é contexto. Se contradiz os arquivos atuais, valem os arquivos.

**Em segredos, dado pessoal, banco e comandos destrutivos, vale sempre a instrução mais cautelosa**, venha do comando, deste arquivo ou das regras; só a minha instrução explícita no momento afrouxa.

O Ponytail simplifica a solução e deixa o processo intacto. Spec e código divergentes são achado a relatar, nunca correção automática. Ao perceber um conflito entre instruções, diga qual viu e qual regra seguiu.

## Convenções de Código

* Funções de lógica: 4-20 linhas; hooks em `src/hooks/`: até 40. Componentes React: divididos por responsabilidade.
* Arquivos de até 300 linhas. Uma responsabilidade por módulo (SRP).
* Complexidade de no máximo 10 caminhos por função. Este limite, o de arquivos e o de funções são checados pelo ESLint no pre-commit. Se um limite barrar o código, extraia uma função com nome próprio ou me diga que o limite não serve para aquele caso; nunca junte instruções numa linha nem comprima o código só para caber.
* Nomes específicos do domínio, fáceis de achar numa busca (poucos resultados no grep). Evite `data`, `handler`, `utils`, `Manager`.
* TypeScript com tipos explícitos, nunca `any`; props sempre tipadas.
* Lógica repetida em 2 ou mais lugares vira função ou hook compartilhado; generalize só a partir da segunda repetição real.
* Early return; no máximo 2 níveis de indentação.
* Mensagem de erro inclui o valor recebido e o formato esperado.
* Comentários explicam o porquê. Registre o motivo ao contornar bug ou limitação de biblioteca. Mantenha seus comentários na refatoração.
* Testes (regra de TDD em `.claude/regras/tdd.md`): `npm test`. Toda função nova ganha teste; todo bug corrigido ganha teste de regressão. Cobertura mínima de 70%, conferida no `/ship`; cada teste prova um comportamento, e nenhum é escrito só para subir o número. Mocks de I/O externo como classes ou funções nomeadas.
* Dependência de produção nova (a que vai para o navegador do usuário) leva um ADR curto: o que faz, por que o recurso nativo não basta e o tamanho que acrescenta. Antes de trocar uma dependência, crie um marco.
* Configuração (chaves, nomes de serviço, endpoints) isolada num único ponto. Injeção de dependência quando o valor for reutilizado ou puder mudar; componente pequeno e isolado dispensa. O acesso a dados passa por funções de acesso (um módulo por assunto), que é o que a vitrine troca por dados falsos.
* Estrutura segue a convenção do Vite + React (`src/components/`, `src/hooks/`). Estilo, o ESLint decide.

## Registros do Projeto

* **Spec** de cada funcionalidade: `.scratch/<funcionalidade>/spec.md`, única e viva, atualizada a cada mudança. `<funcionalidade>` é um nome curto em minúsculas com hífens (`login-perfis`), o mesmo nos tickets (`.scratch/<funcionalidade>/issues/`), no plano, no `desvios.md` e nos marcos.
* **ADRs e `desvios.md`** só recebem entradas novas, datadas; nunca edite nem apague entradas antigas. Decisão que muda ganha ADR novo. Os ADRs ficam na pasta em que o `grill-with-docs` já os grava neste projeto; se ainda não há nenhum, em `docs/adr/NNNN-titulo-curto.md` (se a skill depois gravar em outra pasta, junte todos na dela).
* **Ticket concluído** ganha, no fim do arquivo dele, a linha `Concluído em AAAA-MM-DD (commit <hash>)`, gravada pelo `/executar-*`. Funcionalidade sem tickets ganha, no fim da spec, `Implementado em AAAA-MM-DD (commit <hash>)`.
* **Necessidade nova no meio de um ticket** vai para um ticket separado ou para `.scratch/backlog.md` (uma linha: o que é e onde surgiu), e você me avisa. Mantenha o escopo do ticket atual.
* **Entre etapas:** tudo que uma etapa produz e a seguinte usa vai para um arquivo em `.scratch/` antes de a etapa terminar. A conversa não conta como registro.
* **Próximo passo:** toda sessão que terminar recomendando um próximo passo (comando, modelo e o que falta) grava isso em `.scratch/proximo-passo.md` antes de encerrar, sobrescrevendo o anterior, e comita junto com o resto da etapa. O `/situação` lê esse arquivo; se divergir do git ou dos tickets, valem os arquivos e você me avisa. Vale também para sessões de conversa.
* **Marca de entrega:** o `/ship` grava no fim da spec a linha `Entregue em AAAA-MM-DD (commit <hash>)` (com `, com ressalva: <qual>` nos dois casos que o `/ship` lista) e cria o marco `marco/AAAA-MM-DD-entrega-<funcionalidade>`. Quando uma funcionalidade entregue volta a mudar, o `/planejar` acrescenta abaixo, ao alterar a spec, a linha `Em revisão desde AAAA-MM-DD`, e o próximo `/ship` grava uma marca nova. Spec ainda não executada que volta a mudar não leva `Em revisão desde`: é só editada.
* **Custo (desligado por padrão):** só se a seção "Ajustes deste Projeto" disser "Custo ligado". Nesse caso, cada sessão acrescenta uma linha em `.scratch/custos.md`, no formato `AAAA-MM-DD | <funcionalidade ou "projeto"> | <etapa> | <valor>`, com o valor do `/cost` que eu rodo antes de fechar a sessão (ou do `/usage`, em percentual), e os comandos pedem o `/cost` ao fim. Desligado, ninguém pede `/cost` nem grava `custos.md`.
* Mantenha o `.scratch/` versionado no git, e comite o que cada etapa grava nele antes de encerrá-la.
* **Commits só com os arquivos da etapa:** com duas sessões na mesma pasta, o commit de uma leva o que a outra preparou. Comite sempre por caminho (`git add <arquivos>` e `git commit <arquivos>`), nunca `git add .` nem `-a`, e confira `git status` depois de um commit barrado pelo pre-commit.

## Funil de Trabalho

|Etapa|Comando|Modelo|
|-|-|-|
|0|`/projeto`, depois `/setup` (uma vez por projeto)|Opus no `/projeto`, Sonnet no `/setup`|
|1|`/concepcao-livre` (uma vez, ou num redesenho)|Opus|
|2|`/implementar-identidade`|Sonnet|
|3|`/planejar`, por funcionalidade|Opus no modo completo, Sonnet no curto|
|4|`/executar-simples` ou `/executar-complexo`, por ticket|Sonnet|
|5|`/polir`, a cada ciclo de execução|Sonnet|
|6|`/ship`, a entrega; a pedido, os roteiros de produção (`.claude/regras/producao.md`)|Sonnet; Opus na revisão de segurança para produção|
|apoio|`/demanda` (o que chega depois ou fora do plano)|Opus para classificar; bug em Sonnet, e em Opus se a causa não aparecer na primeira investigação|
|apoio|`/rapido` (funcionalidade pequena, uma tela, sem regra nova nem migração, numa sessão)|Sonnet|
|apoio|`/voltar` (desfazer) e `/situação` (onde o projeto está)|Sonnet|

Cada funcionalidade nova começa no `/planejar`. Para uma iniciativa que não cabe numa sessão, o `/planejar` tem o passo "Iniciativa grande".

**Ao fim de cada etapa**, diga o próximo comando e o modelo da tabela (e, com custo ligado, peça o `/cost`).

**Troca de sessão.** Antes de encerrar a conversa, confirme que o resultado da etapa já está em arquivo. A sessão nova, com o modelo recomendado, começa pelo `/situação`; `/clear` + `/model` na mesma sessão só quando eu pedir. Rode `/mattpocock-skills:handoff` em três casos: há algo que os arquivos não guardam (decisão em aberto, tarefa pela metade); a pausa atravessa dias ou troca de máquina; eu pedi. O handoff leva só o que não está em arquivo, com o **estado atual no topo**, e aponta os arquivos para o resto. Peça à skill que salve em `.scratch/handoff-AAAA-MM-DD.md` (o padrão dela é uma pasta temporária, fora do projeto) e, depois, apague você os handoffs anteriores.

**Toda mudança de código passa pelo funil**, inclusive a que parece trivial. Nunca aplique uma mudança direto; decidir pular TDD ou revisão cabe a mim.

**Skills.** Toda skill que recusar ser acionada por você (as de invocação direta: `implement`, `grill-with-docs`, `to-spec`, `to-tickets`, e qualquer outra que responder assim) volta para mim como comando pronto para eu rodar; elas podem nem aparecer na lista que você enxerga, e isso não quer dizer que faltam. **Skill ou comando ausente de verdade:** peça que eu rode `/reload-skills` uma vez; se continuar ausente, pare e me mostre as opções (instalar, seguir sem ela, adiar). Substituir uma skill por outra, ou fazer o trabalho dela à mão, só com minha aprovação. A lista das skills exigidas está no `README.md`.

## Segurança e Recuperação

* **Marcos:** antes de cada passo grande (identidade, início de funcionalidade, troca de dependência, redesenho, volta atrás) e em cada entrega, crie a tag `marco/AAAA-MM-DD-descricao-curta`. Se o nome já existir, acrescente `-2`, `-3`.
* **Regra de parada:** depois de três tentativas sem resolver o mesmo problema, pare, explique e ofereça opções: voltar ao último marco, tentar outra abordagem ou registrar no backlog.
* **Desfazer** sempre com `git revert`. Comandos que apagam histórico ou arquivos (`reset --hard`, `clean`, `push --force`, `branch -D`, `tag -d`, descartar mudanças não comitadas) só com minha aprovação explícita, dada no momento, e rodados por mim.
* **Trava de git:** `.claude/settings.json` liga o hook `.claude/hooks/bloquear-git-destrutivo.mjs`, que bloqueia esses comandos antes de rodarem, nas formas mais comuns de escrevê-los, e também o commit que pula o pre-commit. Ela reduz acidentes. Script em arquivo e variável que monta o comando escapam dela, e a regra acima vale mesmo quando a trava deixa passar. Se a trava bloquear algo, aceite o bloqueio e não procure contorno: explique o que queria fazer, e eu rodo o comando no meu terminal. Para desfazer uma edição temporária sua num arquivo, guarde uma cópia antes e restaure a cópia (ou, para arquivo ainda não comitado, `git show HEAD:<arquivo>`); `git checkout <arquivo>` e `git restore` ficam bloqueados. Para trocar de ramo, use `git switch`.
* **Retomada:** com trabalho em andamento, rode o `/situação` e continue da próxima tarefa incompleta. Se o handoff divergir dos arquivos, valem os arquivos, e você me avisa.

## Itens Não Testados

`.claude/regras/nao-testados.md` lista, por comando, o que ainda não teve teste real. **Ao terminar um comando do DevFlow**, leia o bloco desse comando (e o bloco "Qualquer momento") e, para cada item que aconteceu nesta execução e ainda não tem entrada em `.scratch/melhorias-protocolo.md`, acrescente: data, item, o que era esperado e o que aconteceu. Não conclua se funcionou: essa avaliação é minha.

## Melhorias do Protocolo

Se uma regra falhar ou puder melhorar, registre em `.scratch/melhorias-protocolo.md` (uma entrada curta: data, comando, o que falhou, sugestão) e me avise. Registre só o que aconteceria em qualquer projeto; o que depende da tecnologia ou do assunto deste projeto fica no `desvios.md` ou no backlog. Não edite o `CLAUDE.md` nem a pasta `.claude/` neste projeto: mudanças são feitas na cópia mestra. A exceção é a seção "Ajustes deste Projeto", que conta como instrução minha.

## Ajustes deste Projeto

*(Exceções deste projeto às regras acima. Esta seção é preservada ao atualizar o protocolo. Apague o que não valer.)*

<!-- Para ligar o custo, escreva aqui: "Custo ligado." -->

### Agent skills

Configuração das skills do Matt Pocock, já pronta no pacote (o `/setup` só confere os arquivos).

#### Issue tracker

Tickets e specs em arquivos markdown locais, em `.scratch/<funcionalidade>/`. See `docs/agents/issue-tracker.md`.

#### Triage labels

Os cinco rótulos padrão (`needs-triage`, `needs-info`, `ready-for-agent`, `ready-for-human`, `wontfix`), numa linha `Status:` de cada ticket. See `docs/agents/triage-labels.md`.

#### Domain docs

Single-context: um `CONTEXT.md` e `docs/adr/` na raiz. See `docs/agents/domain.md`.
