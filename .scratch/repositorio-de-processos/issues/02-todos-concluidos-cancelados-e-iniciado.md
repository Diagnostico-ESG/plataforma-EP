# 02: Todos | Concluídos, cancelados e etiqueta "Iniciado"

**Como resolve a sua parte.** Com o Arquivado fora, a Lista e a visualização por setor passam a ser o portfólio: mostram os concluídos sempre, com uma escolha à vista entre Todos e Concluídos, e deixam os cancelados de fora até alguém pedir. No mesmo passo, a etiqueta "Em andamento" passa a se chamar "Iniciado", para não se confundir com a situação.

**What to build:** spec, seções "Escolha Todos | Concluídos", "Cancelados", "Etiqueta Iniciado", "Endereço da página" (campo `mostrar`) e "Estados da tela":

- **Par Todos | Concluídos** (botões colados, escolhida em destaque, abre em Todos) acima da Lista e acima das colunas do Quadro por setor. Na Lista: Todos = em andamento, suspensos e concluídos; Concluídos = só concluídos. No Quadro por setor: Todos = em andamento, suspensos e concluídos (os concluídos sempre, sem a regra dos 30 dias); Concluídos = só os concluídos do setor; a regra de quais colunas aparecem não muda. Com Concluídos, o filtro da Situação some do cabeçalho/barra da Lista. Sem concluído algum: "Nenhum processo com estes filtros." e "Limpar filtros".
- **Cancelados:** fora do Quadro por etapa, por responsável, por setor e da Lista padrão. Na Lista, no fim, a linha "Mostrar cancelados (N)" (N depois dos filtros); ao clicar, aparece o bloco "Cancelados" com as mesmas colunas e a linha vira "Esconder cancelados"; com Concluídos a linha não aparece. O filtro da Situação não oferece "Cancelado". O bloco se distingue do resto (critério [visual]).
- **Endereço:** acrescenta `mostrar=concluidos`; o bloco de cancelados não entra no endereço.
- **Etiqueta:** `em_andamento` mostra "Iniciado" no cartão, no verso, na lista de escolha e no histórico (inclusive eventos antigos); só o rótulo muda, o valor no banco e a cor âmbar ficam. A situação continua "Em andamento". Cabe no cartão como cabia "Em andamento" (critério [visual]).
- Testes pela tela inteira com os módulos falsos de hoje, trocando `App.listaDosArquivados.test.tsx` pelos de Todos | Concluídos e dos cancelados.

**Blocked by:** 01

**Status:** ready-for-agent

- [ ] O par Todos | Concluídos aparece na Lista e no Quadro por setor, abre em Todos e a opção escolhida fica destacada
- [ ] Na visualização por setor, Todos mostra os concluídos sempre, mesmo os tirados do Quadro ou com mais de 30 dias; Concluídos mostra só os concluídos do setor
- [ ] Na Lista, Concluídos mostra só os concluídos e o filtro da Situação some
- [ ] Cancelados não aparecem no Quadro por etapa, por responsável, por setor nem na Lista; "Mostrar cancelados (N)" mostra o bloco no fim e "Esconder cancelados" o esconde; com Concluídos a linha some
- [ ] `mostrar=concluidos` fica no endereço e recarregar mostra a mesma visão
- [ ] A etiqueta aparece como "Iniciado" em todo lugar, inclusive no histórico antigo; o valor no banco continua `em_andamento`
- [ ] Consulta vê tudo isso sem alterar nada
- [ ] Testes da tela verdes; `npm test` verde
