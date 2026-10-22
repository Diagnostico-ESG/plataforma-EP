# 01: Escolha de publicação e coluna Concluídos

**Como resolve a sua parte.** Hoje o processo sai do Quadro assim que a Aprovação pelo setor se conclui, mesmo com a Publicação em andamento, e não há onde ver os recém-concluídos. Este ticket:

- renomeia a "Revisão pelo setor" para "Validação com o setor";
- faz a janela de concluir a Aprovação perguntar "Vai para publicação?", também como "realizada anteriormente" e pelo arrastar. Com "Sim", a Publicação entra em andamento com o responsável escolhido. Com "Não", o processo vai para Concluídos;
- muda a regra do concluído (obrigatórias resolvidas e, ainda, escolha "não" ou Publicação resolvida), de modo que o processo com a Publicação em andamento continua no Quadro;
- acrescenta ao Quadro a coluna Concluídos, a última, sempre visível;
- dá a escolha certa, pela migração, aos processos que já existem.

**What to build:**

- **Banco:**
  - migração com a coluna `processos.vai_para_publicacao` (nula = sem resposta), o privilégio de coluna e o gatilho que só aceita a mudança dentro das funções;
  - `avancar_etapa` recriada com `p_vai_para_publicacao` (obrigatória ao resolver a `aprovacao_setor` com a Publicação pendente depois; "não" inicia a primeira pendente depois da Publicação, se houver), e `concluir_aprovacao` repassando a escolha;
  - `voltar_a_etapa` apagando a escolha na volta até a Aprovação ou antes;
  - view `processos_com_andamento` com a regra nova do concluído, o concluído sem etapa atual nem responsável, e os campos novos `vai_para_publicacao` e `publicado_em`;
  - nome da `revisao_setor` trocado só se ainda for "Revisão pelo setor";
  - evento da escolha no histórico;
  - dados existentes convertidos pela tabela da spec, com os gatilhos de evento desligados.
- **Tela:**
  - "Validação com o setor" nos textos;
  - a pergunta na `JanelaDeAvanco` da Aprovação e na de "realizada anteriormente", com o responsável só em "Sim";
  - a coluna Concluídos ("Nenhum processo concluído." quando vazia), em ordem de nome, com os filtros do Quadro, fora do "Só os meus" e do agrupamento por responsável, e sem arrastar para fora;
  - o arrastar da Publicação para Concluídos abrindo a janela de concluir a Publicação;
  - o selo "Não publicado" no cartão;
  - o Agora do concluído com "Concluído" e "Publicado em dd/mm/aaaa" ou "Não publicado", ainda sem botões novos;
  - o aviso "A escolha de publicação será apagada." na janela de voltar;
  - as frases das recusas e os textos do histórico.

Spec: histórias 1 a 12, 16 a 22, 35 a 37 e 41 a 45 (no que toca a esta parte).

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Banco: testes antes da migração, um caso por célula de "quem pode o quê" para responder a escolha, ler os campos novos e alterar a coluna direto, e um caso por regra:
  - concluir e "realizada anteriormente" da Aprovação sem escolha recusados;
  - "sim" inicia a Publicação com o responsável; "não" a deixa pendente e inicia a etapa de teste posterior, quando há;
  - concluído com "não" e com a Publicação resolvida; não concluído com "sim" e a Publicação em andamento;
  - com a Publicação desativada, a Aprovação conclui sem escolha e o processo fica concluído;
  - voltar até a Aprovação apaga a escolha; voltar à Publicação a mantém;
  - `update` direto da coluna recusado;
  - nome trocado só quando ainda é o antigo;
  - os quatro estados antigos convertidos (ensaiado num teste temporário antes de aplicar);
  - vale num subprocesso;
  - os testes antigos que concluem a Aprovação, dispensam a Publicação ou esperam o concluído antigo foram ajustados.
- [ ] "Validação com o setor" aparece no Quadro, no verso, no catálogo, nas janelas e nas mensagens.
- [ ] A janela de concluir a Aprovação não conclui sem resposta. "Sim" pede o responsável e deixa a Publicação em andamento. "Não" esconde o responsável e leva o processo a Concluídos. O mesmo vale pelo arrastar e pela "realizada anteriormente". Sem a Publicação no catálogo, não há pergunta.
- [ ] A coluna Concluídos aparece sempre no fim, com a frase quando vazia, em ordem de nome, respeitando setor, macroprocesso e tipo. Não aparece no agrupamento por responsável, não traz concluídos no "Só os meus" e não deixa arrastar para fora.
- [ ] Arrastar o cartão da Publicação para Concluídos abre a janela de concluir a Publicação, e o processo termina em Concluídos.
- [ ] O cartão concluído com "não" tem o selo "Não publicado". O Agora mostra "Concluído" com a linha da publicação.
- [ ] A janela de voltar avisa que a escolha será apagada, quando é o caso.
- [ ] A escolha aparece no histórico do processo.
- [ ] A Consulta vê tudo sem botões nem arrastar.
- [ ] Testes do módulo real, das funções puras e da tela inteira com as falsas, cobrindo os itens acima, inclusive recusas e falhas ao gravar sem perder o preenchido.
- [ ] [visual] A coluna Concluídos segue o estilo das demais. A pergunta fica clara na janela, que cabe na tela do notebook (1366×768). O Agora do concluído não quebra o alinhamento do verso. O selo "Não publicado" segue o estilo das pílulas.

Concluído em 2026-10-22 (commit 3a17a0f)
