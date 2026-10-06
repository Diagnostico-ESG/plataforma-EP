---
description: Primeira etapa de um projeto novo — conversa sobre a ideia do projeto inteiro (o que é, para quem, funcionalidades principais) e registra um resumo que as etapas seguintes leem. Roda de novo se a ideia mudar muito.
---

Conduza a conversa sobre a ideia do projeto como um todo. Cada funcionalidade será detalhada depois, no `/planejar`; aqui o nível é o projeto inteiro.

**Escopo do DevFlow, antes de tudo.** Se o que eu descrevi (ou a especificação anexada) for script ou análise em Python ou R, backend sem interface, Power BI ou aplicativo nativo de celular, avise que o DevFlow serve a aplicações web com interface e pergunte como quero seguir, antes de qualquer outra pergunta.

0. **Especificação pronta.** Se eu anexar ou apontar um documento de especificação, leia-o inteiro antes de qualquer pergunta. Copie-o para `.scratch/especificacao.md` (uma cópia só, que não é editada depois) e trate-o como ponto de partida: pergunte apenas o que ele deixa em aberto ou o que conflita com o DevFlow. Se ele tiver decisões em aberto, copie cada uma para `.scratch/backlog.md`, em uma linha. Se ele dividir o trabalho em fases ou versões, só a primeira vai para a lista de funcionalidades do `projeto.md`; as demais vão para o backlog, uma linha cada, com o prefixo do projeto (por exemplo "EP v2") para não se confundir com a numeração do DevFlow. O modelo de dados, os perfis e as regras de negócio dele não vão para o `projeto.md`, que fica curto. Eles viram `CONTEXT.md` na sabatina do `/planejar`, e você me lembra disso ao fechar este comando.
1. Ative `/superpowers:brainstorming` para essa conversa, uma pergunta de cada vez, partindo do que eu já tiver dito nesta conversa, sem me fazer repetir. Se a skill recusar invocação automática, me devolva o comando pronto para eu rodar. Cubra, no mínimo:
   - o que o sistema faz e que problema resolve;
   - quem vai usar (equipe interna ou público, e mais ou menos quantas pessoas);
   - as funcionalidades principais, em ordem de prioridade;
   - por quanto tempo deve existir e quem vai mantê-lo;
   - se a instituição exige que os dados fiquem numa região ou numa nuvem específica;
   - se vai lidar com dados pessoais ou sensíveis;
   - se os dados precisam ser vistos por mais de uma pessoa ou em mais de um computador (é isso que decide se o projeto terá banco de dados);
   - se terá login e perfis de acesso diferentes (quem pode o quê) e quem cria os usuários (o painel do Supabase dá acesso aos dados a quem o usa; se mais de uma pessoa vai administrar usuários, convém a criação passar pela plataforma, numa Edge Function);
   - se a instituição exige registrar também quem consultou cada dado, além de quem o alterou (o Supabase não faz isso sozinho; vira funcionalidade própria, a decidir no `/planejar`);
   - se vai guardar arquivos enviados (documentos, imagens, planilhas) e de que tipos;
   - se depende de outros sistemas (APIs, planilhas, bases de dados de terceiros) e se há dados atuais para importar. Nesse caso, onde estão e se têm dado pessoal: a carga real é feita por mim, fora da sessão (seção "Dados e Segredos" do `CLAUDE.md`).
2. Registre o resultado em `.scratch/projeto.md`, curto (no máximo uma tela e meia): um parágrafo apresentando o projeto e os tópicos acima, com as funcionalidades principais numeradas na ordem em que serão planejadas. Se o projeto tem login, a primeira da lista é sempre o login e os perfis. Se o `brainstorming` gerar um documento de design em outro lugar, traga o conteúdo para `.scratch/projeto.md` e apague o duplicado: o resumo do projeto existe num lugar só.
3. Mostre o resumo e aguarde minha aprovação.
4. Se `.scratch/projeto.md` já existir (a ideia mudou), atualize o arquivo em vez de criar outro. Diga em linguagem simples o que mudou e quais etapas já feitas podem ser afetadas.

Depois da aprovação, lembre que o próximo passo é `/setup` (ou, se o setup já foi feito, o comando que fizer sentido para o que mudou), com o modelo da tabela do Funil de Trabalho. Se a ideia mudou e o projeto passou a ter login, arquivos enviados ou dados compartilhados sem ter banco, o caminho é o passo 7 do `/setup`, que pode rodar sozinho. Se havia especificação pronta, lembre também que o modelo de dados e as regras dela entram no `CONTEXT.md` na sabatina do `/planejar` da primeira funcionalidade.
