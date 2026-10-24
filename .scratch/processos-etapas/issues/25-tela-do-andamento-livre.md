# 25: Tela do andamento livre

**Como resolve a sua parte.** Com o banco do ticket 24, a equipe precisa usar o andamento livre na tela, como no Planner:

- levar o processo a qualquer etapa pela lista do Agora ou arrastando o cartão no Quadro;
- marcar a etiqueta;
- trocar ou assumir o responsável;
- ver de relance o processo parado.

O Administrador mantém o catálogo com Não iniciados e Concluídos fixos. Saem da tela todos os botões e janelas do modelo anterior.

**What to build:** o andamento livre de ponta a ponta na tela: módulo de processos (o real e o falso), verso, Lista, Quadro e catálogo.

- **Módulo de processos:**
  - saem iniciar, concluir, dispensar, voltar, corrigir datas, o responsável da etapa e "não vai mais para publicação";
  - entram mover o processo (com os dados da chegada a Concluídos), mudar a etiqueta e mudar o responsável do processo;
  - a leitura traz a etapa atual com a posição, a etiqueta, a entrada na etapa, o responsável e as passagens;
  - a falsa troca os andamentos pelas passagens e imita as regras e recusas do banco.
- **Agora:**
  - "Agora · etapa {n} de {total}";
  - a lista Etapa (move ao escolher) e a lista Etiqueta (fixa em Concluídos);
  - o responsável com "Trocar" e [Assumir] para quem não é o responsável;
  - "há {n} dias nesta etapa", com o selo âmbar a partir de 8 dias, fora de Não iniciados e de Concluídos;
  - o aviso amarelo do revisor na Revisão interna;
  - suspenso e cancelado sem as listas, com a explicação;
  - a Consulta com a frase em texto;
  - a falha ao gravar em vermelho, com tudo como estava.
- **Etapas do verso:** as etapas ativas, com a atual, as visitadas com a data da última saída e a gaveta das entradas e saídas.
- **Lista:** as colunas etapa atual, etiqueta e responsável, e o filtro de etapa com as duas fixas.
- **Histórico:** "Moveu de … para …", "Mudou a etiqueta" e "Mudou o responsável". Saem os textos de andamento de etapa.
- **Quadro:**
  - colunas de Não iniciados a Concluídos;
  - cartões dos processos em andamento, suspensos e concluídos não arquivados;
  - cartão com a etiqueta (pílula neutra), o avatar do responsável do processo, a barra com um pedaço por etapa ativa e os selos novos ("{n} dias nesta etapa" a partir de 8 dias, "Sem publicação");
  - arrastar para qualquer coluna, com o realce da coluna sob o cartão; a própria coluna não grava; a falha devolve o cartão; soltar em Concluídos sem a data da publicação abre a janela de chegada, que é entregue no ticket 04 de publicacao-e-arquivamento (até lá, a tela mostra que a chegada pede a data ou a explicação e devolve o cartão);
  - Agrupar por responsável e Só os meus pelo responsável do processo, incluindo as duas fixas.
- **Catálogo** (Administração):
  - selo "Fixa" e sem botões nas duas fixas;
  - fase "—" nelas;
  - sem o campo obrigatória;
  - etapa nova entre as fixas;
  - Subir e Descer sem atravessá-las;
  - as recusas novas com a frase.
- **O que sai:** a janela de avanço, as janelas de nota, [Corrigir datas], [Voltar a esta etapa] e os blocos de revisão e aprovação da janela de concluir. Os registros de revisão e aprovação voltam pelo Agora no ticket 05 de revisoes-aprovacao.

Spec: `.scratch/processos-etapas/spec.md`, seção "Andamento livre (mudança de 2026-10-23)" (histórias 200 a 254, Interface, Decisões de teste, critérios `[visual]`).

**Branch:** `quadro-livre-parte-1`.

**Blocked by:** 24 (Banco das passagens).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Testes de interface com o aplicativo inteiro, escritos antes e vistos falhar, cobrindo:
  - cadastro em Não iniciados;
  - mover pela lista para a frente e para trás, com a etiqueta e o responsável;
  - arrastar para qualquer coluna, a própria coluna, a falha e quem não arrasta (Consulta, suspenso, arquivado, agrupado);
  - a etiqueta, inclusive fixa em Concluídos;
  - Trocar e Assumir;
  - o aviso do revisor aparecendo e sumindo;
  - processo parado com 7 e 8 dias, nas fixas e no suspenso;
  - colunas, barra e selos;
  - agrupar e Só os meus;
  - Lista e filtro;
  - Etapas do verso e gaveta;
  - catálogo com as fixas e as recusas;
  - histórico novo;
  - Consulta só lendo.
- [ ] Os testes de tela do modelo anterior foram reescritos para o modelo novo ou apagados quando o comportamento saiu, com a lista anotada no plano.
- [ ] Os testes do módulo real com o cliente simulado provam as chamadas de mover, etiqueta e responsável, as linhas da view com os campos novos e cada recusa nova virando a frase.
- [ ] As funções puras (barra, selos com o limite de 7 dias, colunas com as fixas, destino do arrastar) têm testes unitários.
- [ ] `npm test`, `tsc` e o ESLint passam no pre-commit.
