---
description: Planeja uma funcionalidade — confere as entregas anteriores, avalia o tamanho e então, no modo completo, faz sabatina com documentação, spec e, quando há mais de uma entrega, tickets, parando em cada skill de invocação direta do Matt Pocock; no modo curto, poucas perguntas e uma spec enxuta.
---

Antes de começar, leia `.scratch/projeto.md` (o que o projeto é e quais são as funcionalidades principais) e, se existir, o `CONTEXT.md`. Se `.scratch/inicio-projeto.md` não tem a linha `setup concluído em`, pare e aponte o `/setup`. Se não existe o marco que o `/implementar-identidade` cria ao terminar (`git tag -l "marco/*-identidade"` devolve algum nome que não termina em `antes-identidade`), avise que a identidade visual ainda não foi implementada e pergunte se sigo assim mesmo.

**Nome da funcionalidade.** Escolha o nome curto (`<funcionalidade>`, minúsculas com hífens) e anote-o ao lado do item na lista de `.scratch/projeto.md`, entre parênteses. É por ele que este comando, o `/ship` e o `/status` ligam cada item à pasta `.scratch/<funcionalidade>/`.

**Entregas anteriores.** Para cada funcionalidade da lista que vem antes desta e já tem spec em `.scratch/`, confira a linha `Entregue em` no fim da spec (com `Em revisão desde` abaixo, conta como não entregue). Se alguma não tiver, avise em linguagem simples qual é e ofereça dois caminhos, recomendando o primeiro: rodar o `/ship` dela antes de planejar esta (a próxima fica em cima de uma base revisada) ou seguir e registrar a pendência em `.scratch/backlog.md`. Aguarde minha resposta antes de criar o marco.

**Funcionalidade já entregue que volta a mudar.** Se a funcionalidade a planejar já tem a linha `Entregue em`, a linha `Em revisão desde AAAA-MM-DD` entra logo abaixo dela no momento em que a spec for alterada (passo 3 do modo completo, passo 4 do curto), no mesmo commit. Se eu desistir da mudança antes disso, nada fica marcado. O próximo `/ship` grava a marca nova.

**Banco que ainda não existe.** Se esta funcionalidade precisa de banco, login ou arquivos enviados e o `.scratch/inicio-projeto.md` registra "sem banco" (ou não traz a linha "banco: login preparado" ou "banco: arquivos preparados" de que esta funcionalidade precisa), pare: o caminho é rodar antes o passo 7 do `/setup`, que pode ser executado sozinho.

**Nada a planejar.** Se todas as funcionalidades da lista já foram entregues e não recebi uma demanda nova, não crie marco. Explique e ofereça três caminhos: `/projeto` (a ideia mudou), `/demanda` (algo novo ou um ajuste) ou encerrar o ciclo.

**Login primeiro.** Se `.scratch/projeto.md` indica login e o login e os perfis ainda não têm a linha `Entregue em`, a funcionalidade a planejar é essa, mesmo que eu peça outra. Explique em uma frase o porquê (as demais dependem de saber quem é quem) e confirme comigo. Esta funcionalidade nunca cabe no modo curto.

**Tamanho.** Antes de escolher o modo, avalie a funcionalidade, mesmo quando ela vem do `.scratch/projeto.md`. É **pequena** se cabe numa entrega, mexe numa tela só, não cria regra de negócio e não muda a estrutura dos dados. Se for, proponha o modo curto em uma frase com o motivo e aguarde minha confirmação. A demanda que chegou pelo `/demanda` como funcionalidade pequena, ou o modo curto pedido por mim, dispensa a proposta. Nos demais casos, siga o modo completo. Modelo recomendado: Sonnet no modo curto, Opus no completo.

**Iniciativa grande.** Se a funcionalidade não cabe numa sessão (várias telas e várias tabelas, mais de cinco entregas prováveis, ou partes que dependem de decisões ainda não tomadas), proponha antes o `/mattpocock-skills:wayfinder`, que divide a iniciativa num mapa de partes. Se eu tiver anexado uma especificação com a ordem de construção (`.scratch/especificacao.md`), ela cumpre esse papel e o `wayfinder` fica dispensado. Se ele recusar ser acionado, devolva o comando pronto. Peça que salve o mapa em `.scratch/<funcionalidade>/mapa.md`; com minha confirmação, as partes do mapa entram na lista de `.scratch/projeto.md`, e cada uma passa por este comando como uma funcionalidade.

**Importador de dados reais.** Se a funcionalidade importa dados de uma fonte real (planilha, e-mails, base de outro sistema), antes de planejar peça-me uma amostra com nomes inventados no mesmo formato da fonte (colunas, abas, codificação); sem ela, o importador não é planejado. O importador recebe o caminho do arquivo como argumento, lê a URL e a chave publicável de produção de um `.env.production.local` que eu crio (você não o lê), entra como um usuário administrador com e-mail e senha pedidos na hora (sem chave secreta: seção "Ambientes e migrações" de `.claude/regras/banco.md`), é testado com a amostra fictícia, e a carga real eu rodo no meu computador, fora da sessão, com o arquivo fora da pasta do projeto ou em `dados-reais/`. Se eu quiser que você veja um exemplo com nome ou e-mail de pessoa, peça que eu o anonimize antes.

## Modo completo

`grill-with-docs`, `to-spec` e `to-tickets` (Matt Pocock) são skills de invocação direta pelo usuário — não podem ser disparadas por este comando nos bastidores. Por isso, este fluxo avança em etapas, parando para eu rodar o comando a cada uma delas.

0. Crie o marco `marco/AAAA-MM-DD-inicio-<funcionalidade>` (ver "Segurança e Recuperação" no `CLAUDE.md`).
1. **Brainstorming, só com a ideia em aberto.** Use `/superpowers:brainstorming` apenas se eu disser que não sei como resolver, ou se houver mais de uma abordagem razoável que o resumo do projeto não decide. Nesse caso, diga em uma frase por que vai usá-lo e peça 2 ou 3 abordagens técnicas. **Regra:** a identidade visual já foi implementada no `/implementar-identidade`; baseie modelagem de dados, esquemas e gestão de estado nos componentes e formulários que já existem no código. Se a skill recusar invocação automática, me devolva o comando pronto. Se o `brainstorming` gravar um documento de design, as decisões dele entram na sabatina do passo 2 e o arquivo é apagado depois dela. Se eu cheguei com a solução definida, diga que vai pular o brainstorming e siga para o passo 2; se a skill disparar sozinha nesse caso, não continue com ela.
2. Com a abordagem definida, **pare** e me devolva o comando pronto:
   `/mattpocock-skills:grill-with-docs <resumo da abordagem>`
   Essa skill já atualiza `CONTEXT.md` e registros de decisão (ADRs) como parte da própria sabatina — não é um passo separado. Se ela não existir na sessão, vale a regra de skill ausente do `CLAUDE.md`: pare e me mostre as opções. O `grill-me` faz a sabatina sem gravar `CONTEXT.md` nem ADR; se eu escolher usá-lo, depois dele você grava os dois com o que foi decidido e me mostra o que gravou.
3. Depois que eu concluir a sabatina, **pare de novo** e me devolva o comando com o ponto de teste já indicado (a skill pergunta isso, e a resposta tem sido a mesma):
   `/mattpocock-skills:to-spec ponto de teste: a tela inteira (testes pela interface, como a pessoa usa)`
   Se a funcionalidade não tem tela, troque pelo ponto de teste que fizer sentido e explique em uma frase. A spec fica em `.scratch/<funcionalidade>/spec.md`: se a skill gravar em outro lugar ou com outro nome, mova para lá.
   Se esta demanda altera uma funcionalidade que já tem spec, o resultado do `to-spec` deve **atualizar a spec existente** dessa funcionalidade, no mesmo arquivo. Se a skill gerar um arquivo novo, incorpore o conteúdo na spec existente e remova o duplicado. O porquê da mudança fica no ADR que a sabatina registrou; a versão anterior da spec fica no histórico do git.
4. **Confira a spec.** Ela precisa ter: (a) no topo, um parágrafo explicando como a funcionalidade resolve o problema; (b) para cada tela que busca ou carrega dados, o que aparece enquanto carrega, quando não há dados e quando dá erro (no projeto com banco, o erro inclui falha de conexão); (c) se a funcionalidade cria ou altera dados no banco, uma seção **Modelo de dados**; (d) os critérios de aceite que só se conferem olhando a tela (desenho de diagrama, aparência) marcados com `[visual]`, que o `/ship` confere abrindo a tela. Se o projeto tem uma especificação em `.scratch/especificacao.md`, confira que a spec não contradiz o que está lá e diga o que divergiu. Se faltar algo, acrescente e me avise do que acrescentou.

   A seção **Modelo de dados** traz:
   - as tabelas e colunas criadas ou alteradas (nome, tipo, obrigatória ou não);
   - quem pode ler, criar, alterar e apagar em cada tabela. Cada linha vira uma política de RLS. Sem login, diga com todas as letras o que qualquer pessoa com acesso à página pode fazer. Com login, é uma tabela "quem pode o quê": uma linha por tabela e ação, uma coluna por perfil (incluindo o visitante sem login e o usuário desativado). O `/ship` confere que cada célula tem teste. Com login, leia antes as seções "Login e perfis" e "Chaves" de `.claude/regras/banco.md`: a spec do login precisa prever o gatilho que cria a linha de perfil, o primeiro administrador, o usuário desativado e as telas de recuperação e troca de senha. Se a funcionalidade parecer exigir a chave secreta, leia também "Edge Functions". Para cada tabela ou coluna com dado pessoal, diga quais perfis a veem; o princípio é o mínimo necessário;
   - se a funcionalidade guarda arquivos: o bucket, os formatos aceitos, o tamanho máximo, quem pode enviar, ver e substituir, e o que acontece com a versão antiga (seção "Arquivos (Storage)" de `.claude/regras/banco.md`);
   - se há regra de negócio que o banco deve impor (sequência obrigatória, histórico automático, versão que não se apaga): cada regra com o gatilho que a impõe e o caso de teste que a prova;
   - se há **regras de estado** (sequência de etapas, voltar atrás, suspender, cancelar): as transições permitidas, o que acontece com o que veio depois quando se volta, e quais campos são derivados em vez de guardados (seção "Views e funções" de `.claude/regras/banco.md`);
   - se a migração é destrutiva (apaga ou renomeia tabela ou coluna, muda o tipo de uma coluna) e, nesse caso, como os dados existentes serão preservados.

   Exemplo, para uma lista de sugestões sem login: tabela `sugestoes` (id, nome, email, setor, descricao, criada_em). Qualquer pessoa pode ler e criar. Ninguém altera ou apaga pela interface.
5. **Avalie quantas entregas a funcionalidade tem** e me explique em linguagem simples:
   - **Cabe numa entrega só** (todos os tickets seriam, na prática, a spec inteira): proponha pular o `to-tickets` e tratar a spec como o único ticket. Se eu confirmar, siga para o passo 7.
   - **Tem mais de uma entrega** (partes que podem ser feitas e verificadas separadamente, com dependência entre elas): **pare** e me devolva `/mattpocock-skills:to-tickets`. Os tickets ficam em `.scratch/<funcionalidade>/issues/`, um arquivo por ticket, numerados (`01-...md`); se a skill gravar em outro lugar, mova para lá.
6. Depois que o `to-tickets` terminar, confira se cada ticket abre com um parágrafo explicando como resolve a sua parte. Se faltar, acrescente.
7. Para cada ticket (ou para a spec, se ela for o único ticket), sugira `/executar-simples` ou `/executar-complexo`, com o porquê, e o modelo recomendado. Critério: se o "pronto" cabe numa frase, sem decisões interdependentes → simples; se há várias partes que se conectam e a ordem importa → complexo. Confirme que spec, tickets, `CONTEXT.md` e ADRs da sabatina estão em arquivo, comite-os e, se a sessão tiver algo que os arquivos não guardam, sugira o handoff; depois, sessão nova com o modelo recomendado (regra "Troca de sessão" do `CLAUDE.md`).

Nunca tente executar as três skills de invocação direta (`grill-with-docs`/`grill-me`, `to-spec`, `to-tickets`) por conta própria nem simular o resultado delas.

## Modo curto

Para funcionalidade pequena: algo novo que cabe numa entrega, mexe numa tela só, não cria regra de negócio e não muda a estrutura dos dados.

1. Crie o marco de início, como no passo 0 do modo completo.
2. Faça você mesmo de três a cinco perguntas diretas, uma de cada vez, sem acionar `brainstorming` nem `grill-with-docs`.
3. Se alguma resposta revelar regra de negócio nova, outra tela ou mudança na estrutura dos dados, pare: explique que a demanda passou a ser funcionalidade nova e que o caminho é o modo completo. Só continue no modo curto se eu confirmar.
4. Escreva a spec em `.scratch/<funcionalidade>/spec.md` (se a funcionalidade pequena acrescenta algo a uma que já existe, atualize a spec dessa), curta: o parágrafo de como resolve, os estados de tela (se ela carrega dados) e os critérios de pronto. No modo curto, essa spec é escrita por você; isso não conta como simular o `to-spec`, que continua exclusivo do modo completo.
5. Registre um ADR só se alguma resposta gerou uma decisão que muda como outra funcionalidade será feita.
6. Mostre a spec, aguarde minha aprovação, comite a spec (e o ADR, se houver) e sugira `/executar-simples`, com o modelo recomendado.
