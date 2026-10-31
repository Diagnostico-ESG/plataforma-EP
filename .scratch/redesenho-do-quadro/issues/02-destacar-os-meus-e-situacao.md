# 02: "Destacar os meus" e o controle Situação

**Como resolve a sua parte:** "Só os meus" esconde o resto da equipe, e na Lista a pergunta "quais processos aparecem?" está dividida entre "Todos | Concluídos" no topo e "Mostrar cancelados (N)" no pé. Este ticket troca o filtro por um destaque que esmaece os cartões dos outros sem tirá-los da tela (ADR 0037) e junta tudo num controle só, Situação, na Lista e no Quadro por setor.

**What to build:** o botão [Destacar os meus] na faixa, no lugar de "Só os meus", e "Situação: Todos | Em andamento | Suspensos | Concluídos | Cancelados" na Lista e no Quadro por setor. Spec: seção "Redesenho do Quadro" de `.scratch/processos-etapas/spec.md`, histórias 34 a 48 e 81.

**Blocked by:** 01 (os dois controles moram na faixa).

**Status:** ready-for-agent

- [ ] [Destacar os meus] esmaece os cartões em que a pessoa não é a responsável do processo, sem escondê-los; os esmaecidos continuam abrindo o verso e, quando permitido, sendo arrastados; ligado, aparece em azul-claro e é anunciado como pressionado.
- [ ] O destaque é independente do filtro Responsável (o botão "Só os meus" e a ligação dele com o filtro saem).
- [ ] Sem processo da pessoa entre os que aparecem, todos ficam esmaecidos e aparece o aviso "Nenhum processo com você agora." acima do quadro.
- [ ] Vale no Quadro por etapa, por responsável e por setor; fica no endereço; não aparece para Consulta (o parâmetro é ignorado para ela).
- [ ] O leitor de tela não depende só da cor para saber que o cartão é de outra pessoa.
- [ ] A Lista e o Quadro por setor têm o controle Situação; Todos é o padrão e não inclui os cancelados; cada opção mostra só a sua situação, também na árvore por macroprocesso e por setor; "Mostrar cancelados (N)" sai.
- [ ] A escolha fica no endereço, e o endereço antigo com "Concluídos" abre os concluídos.
- [ ] Situação vazia mostra a sua frase ("Nenhum processo cancelado.", "Nenhum processo suspenso." etc.) com [Mostrar todos].
- [ ] Testes de tela para cada item acima; os testes de "Só os meus" (histórias 169 a 171), "Todos | Concluídos" e "Mostrar cancelados" passam para os controles novos; testes de unidade para ler `destacar` e a Situação do endereço e para o filtro por situação.
- [ ] `[visual]` O cartão esmaecido se distingue do destacado sem depender só da cor.
