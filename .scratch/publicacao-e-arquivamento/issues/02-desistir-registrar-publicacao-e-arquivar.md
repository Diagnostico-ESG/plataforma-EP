# 02: Desistir, registrar publicação e arquivar

**Como resolve a sua parte.** Depois do ticket 01, o processo tem destino na Aprovação, mas ainda faltam três coisas:

- **Desistir da publicação no meio**, sem dispensar a etapa: a Publicação não se dispensa mais, e a ação "Não vai mais para publicação", com motivo, leva o processo a Concluídos como não publicado.
- **Registrar publicação:** registrar, num processo não publicado, concluído ou arquivado, que a publicação aconteceu depois, com a data. O processo fica onde está.
- **Arquivar e desarquivar:** tirar de vista os concluídos, que saem do Quadro e ficam só na Lista com o selo "Arquivado" e um filtro. O banco recusa qualquer alteração no arquivado, menos Registrar publicação e Desarquivar.

**What to build:**

- **Banco:**
  - migração com a coluna `processos.arquivado_em` (nula = não arquivado), com o privilégio de coluna e o mesmo gatilho do ticket 01;
  - recusa de dispensar a Publicação no gatilho de andamento;
  - as funções `nao_vai_mais_para_publicacao`, `registrar_publicacao` (data nem futura nem antes de `aprovada_em`, quando houver; a nota vai para o evento), `arquivar_processo` e `desarquivar_processo`;
  - a trava do arquivado em `conferir_processo_em_andamento` e nos gatilhos de `processos`, `andamentos`, `versoes`, `arquivos_da_versao`, `revisoes_internas` e `aprovacoes`, liberada só dentro de `registrar_publicacao` e `desarquivar_processo`;
  - o campo `arquivado_em` na view;
  - eventos de desistência (com motivo), publicação registrada (com data e nota), arquivar e desarquivar.
- **Tela:**
  - a [Dispensar] some da gaveta da Publicação;
  - "Não vai mais para publicação" no Agora da Publicação em andamento, com a janela de motivo;
  - no Agora do concluído, [Arquivar] como principal e [Registrar publicação] quando não publicado;
  - no Agora do arquivado, "Arquivado" com [Desarquivar] e [Registrar publicação] quando não publicado, e nenhuma outra alteração no verso;
  - a janela de Registrar publicação, com a data (hoje por padrão, `max` hoje, `min` na data da aprovação) e a nota;
  - na Lista, o selo "Arquivado" e o filtro "Arquivados: Mostrar | Esconder", no endereço e limpo pelo [Limpar filtros];
  - os métodos novos no módulo de processos, real e falso;
  - as frases das recusas e os textos do histórico.

Spec: histórias 13 a 15, 23 a 34, 41 a 43 e 45 (no que toca a esta parte).

**Blocked by:** 01 (escolha de publicação, regra do concluído, coluna Concluídos e Agora do concluído).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Banco: testes antes da migração, um caso por célula de "quem pode o quê" para desistir, registrar publicação, arquivar, desarquivar, alterar `arquivado_em` direto e ler os eventos novos, e um caso por regra:
  - dispensar a Publicação recusado e "realizada anteriormente" aceito;
  - desistir sem motivo ou com a Publicação pendente recusado; aceito: escolha "não", etapa pendente sem responsável e datas, evento com motivo;
  - registrar publicação recusado em processo em andamento ou já publicado e com data de amanhã ou antes de `aprovada_em`; sem data de aprovação, qualquer data passada aceita; aceito no arquivado, que continua arquivado;
  - arquivar recusado em processo em andamento, suspenso ou cancelado e no já arquivado; desarquivar recusado no não arquivado;
  - no arquivado, recusados: voltar etapa, corrigir datas, trocar responsável, enviar versão, substituir arquivo, editar a aprovação, editar o processo, suspender, cancelar, reclassificar e excluir;
  - vale num subprocesso sem mexer no pai.
- [ ] A Publicação não oferece [Dispensar]. A recusa, se vier de fora da tela, aparece como "A Publicação não se dispensa: use \"Não vai mais para publicação\".".
- [ ] "Não vai mais para publicação" pede motivo e leva o processo a Concluídos com o selo "Não publicado".
- [ ] Registrar publicação traz hoje como data, recusa data futura ou anterior à aprovação sem perder o preenchido, e deixa o processo onde estava, com "Publicado em dd/mm/aaaa". O botão não aparece no processo já publicado.
- [ ] Arquivar tira o processo de Concluídos. Na Lista, ele aparece com o selo e some com "Esconder". Desarquivar o devolve a Concluídos. O verso do arquivado só oferece Desarquivar e, quando não publicado, Registrar publicação.
- [ ] O filtro "Arquivados" fica no endereço da página, e [Limpar filtros] o devolve a "Mostrar".
- [ ] Desistência, publicação registrada, arquivar e desarquivar aparecem no histórico do processo.
- [ ] A Consulta vê o selo, o filtro e os registros sem botões.
- [ ] Testes do módulo real, das funções puras e da tela inteira com as falsas, cobrindo os itens acima, inclusive recusas e falhas ao gravar.
- [ ] [visual] O Agora do concluído e do arquivado não quebra o alinhamento do verso. O selo "Arquivado" segue o estilo das pílulas.
