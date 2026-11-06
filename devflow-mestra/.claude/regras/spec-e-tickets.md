# Spec e tickets — DevFlow v3.5

Usada pelo `/planejar` no modo completo, depois da sabatina. Substitui as skills `to-spec` e `to-tickets`, que paravam para eu digitar o comando: você escreve a spec e os tickets sem parar, seguindo esta regra. Foi feita a partir das duas skills mais o que um mês de uso acrescentou (seções exigidas, menos tickets, numeração depois dos concluídos).

## A spec

**Sem entrevista nova.** A spec sintetiza o que já foi decidido na sabatina, no `CONTEXT.md` e nos ADRs. Use o vocabulário do `CONTEXT.md` e respeite os ADRs da área. Se ao escrever aparecer uma decisão que a sabatina não cobriu, decida pelo mais conservador e reversível e liste a decisão na seção "Decisões novas" para eu confirmar. Decisão que muda o que outra funcionalidade faz vira pergunta antes de seguir.

**Ponto de teste.** Antes de escrever, diga em uma frase em que fronteira os testes vão ficar e espere meu "ok". O padrão é "a tela inteira (testes pela interface, como a pessoa usa)". Sem tela, proponha a fronteira mais alta que existir (a função de acesso, a função de banco). Prefira uma fronteira que já existe a uma nova, e quanto menos fronteiras, melhor.

**Onde fica.** `.scratch/<funcionalidade>/spec.md`. Se a funcionalidade já tem spec, atualize o mesmo arquivo. As histórias e os critérios novos continuam a numeração existente (os tickets concluídos citam os números antigos), e o porquê da mudança fica no ADR da sabatina.

**Modelo** (nesta ordem; seção sem conteúdo sai):

1. **Como resolve.** Um parágrafo, do ponto de vista de quem usa: o problema e como a funcionalidade o resolve.
2. **Telas.** Para cada tela: a pergunta principal que ela responde, o que fica atrás de "ver mais" (`interface.md`) e, se ela carrega dados, o que aparece enquanto carrega, quando não há dados e quando dá erro (com banco, o erro inclui falha de conexão).
3. **Histórias.** Lista numerada, "Como <ator>, quero <ação>, para <benefício>". Cubra cada ator e cada caminho (inclusive o de erro e o de quem não tem permissão), sem inflar com variações da mesma história.
4. **Modelo de dados.** Só em projeto com banco e se a funcionalidade cria ou altera dados: o que o passo 4 do `/planejar` lista (tabelas e colunas, a tabela "quem pode o quê", arquivos, regras que o banco impõe, regras de estado, edição simultânea e índices, migração destrutiva, testes de banco antigos que quebram).
5. **Decisões de implementação.** Módulos criados ou alterados e a interface deles, contratos, decisões de arquitetura. Sem caminho de arquivo nem trecho de código, que envelhecem rápido. A exceção é um trecho vindo de um protótipo que diz a decisão melhor que a prosa (tipo, esquema, máquina de estados), cortado ao essencial e marcado como vindo do protótipo.
6. **Decisões de teste.** O ponto de teste combinado, quais módulos ganham teste, testes parecidos que já existem no projeto e servem de modelo. Bom teste confere o comportamento visível, não o jeito como o código faz (`tdd.md`).
7. **Critérios de aceite.** Numerados, cada um conferível por um teste ou por uma execução. Os que só se conferem olhando a tela levam `[visual]`; critério de lugar ("na linha", "ao lado") diz o lugar.
8. **Fora do escopo.** O que foi discutido e fica de fora, com uma linha de motivo.
9. **Decisões novas.** As que você tomou ao escrever e a sabatina não cobriu. Mostre-as junto com a spec e espere minha confirmação; seguir para o próximo passo sem resposta não conta como aceite.

Se o projeto tem `.scratch/especificacao.md`, confira que a spec não a contradiz e diga o que divergiu.

## Os tickets

Só quando a funcionalidade tem mais de uma entrega (passo 5 do `/planejar`).

**Fatias verticais.** Cada ticket atravessa todas as camadas que a parte dele precisa (banco, função de acesso, tela, testes) e, pronto, pode ser conferido sozinho. Nunca um ticket por camada ("primeiro o banco, depois as telas"). Cada um cabe numa sessão nova. Preparação do código que facilita o resto (renomear, extrair, mover) vem primeiro, num ticket próprio, se for grande; item do backlog só vira ticket de preparação com o meu "ok".

**Refatoração larga** (uma mudança mecânica que quebra o projeto inteiro de uma vez, como renomear uma coluna usada em toda parte) é a exceção: em três tempos. Primeiro acrescenta a forma nova ao lado da antiga, depois troca os usos em lotes, um ticket por lote, e por fim apaga a forma antiga num ticket que depende de todos os lotes.

**Primeira proposta enxuta.** Cada ticket passa por executar, polir e entregar, e cada ciclo custa tempo meu. Proponha o menor número de tickets que ainda deixa cada um caber numa sessão e ser fácil de desfazer; juntar fatias que mexem na mesma área da tela costuma ser o certo. Em um mês de uso, a primeira proposta foi reduzida quatro vezes (8 para 5, 5 para 3, 7 para 3, 5 para 4).

**Mostre antes de gravar**, numa lista numerada. Para cada ticket: título, de quais depende ("Depende de") e o que ele entrega, do ponto de vista de quem usa. Diga o efeito prático de juntar ou separar (menos paradas e tickets maiores, mais difíceis de desfazer; ou o contrário). Pergunte se a divisão está boa, se as dependências estão certas e se algum ticket deve ser juntado ou dividido. Ajuste até eu aprovar.

**Grave** um arquivo por ticket em `.scratch/<funcionalidade>/issues/<NN>-<nome-curto>.md`, em ordem de dependência. Se já há tickets na pasta, a numeração continua depois do último (com `01` a `04` concluídos, os novos são `05` em diante). Modelo:

```
# <NN>: <título>

Status: ready-for-agent
Depende de: <números>, ou "nenhum (pode começar já)"

<Parágrafo: como este ticket resolve a sua parte, do ponto de vista de quem usa.>

- [ ] Critério 1 (cite o critério da spec quando for o mesmo: "critério 3 da spec")
- [ ] Critério 2
```

Sem caminho de arquivo nem trecho de código, pelo mesmo motivo da spec.

**Confira antes de comitar:** cada ticket abre com o parágrafo; tickets da mesma tela entregam todos os campos que o seguinte usa; critérios de estado ("some quando…") combinam com os de uso ("funciona depois de…"); todo critério de aceite da spec está em algum ticket.
