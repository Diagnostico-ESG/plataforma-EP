# 02: Revisão interna

**Como resolve a sua parte.** Hoje não fica registrado quem conferiu a versão do autor nem se mudou algo. Este ticket cria a seção Revisão e aprovação no painel do processo, com o bloco Revisão interna: o revisor registra "sem alteração" ou "corrigida" (depois de enviar a versão nova pela seção Versões), e o banco recusa concluir a revisão interna sem uma revisão que cubra a versão mais recente.

**What to build:** tipos `resultado_da_revisao` e `escopo_da_correcao`; tabela `revisoes_internas` com RLS, privilégios de coluna, gatilhos (processo e etapa em andamento, revisor e versões preenchidos pelo banco, revisor nunca autor, regra do "corrigida", datas) e eventos; trava na conclusão da `revisao_interna`; recusa de excluir processo com revisão; módulo de revisões (interface, implementação real e falsa nomeada) com listar e registrar; seção abaixo de Versões com o bloco Revisão interna, formulário com a prévia das versões, estados de carregando, vazio e erro; frases das recusas; eventos no histórico do processo. Editar e excluir ficam no ticket 04. Spec: histórias 8 a 17, 32, 33, 35 a 39 (para a revisão).

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Banco: testes antes da migração, uma célula de "quem pode o quê" por caso (administrador, integrante, consulta, inativo, visitante) para `revisoes_internas` e os eventos dela, e um caso por regra: processo fora de andamento e etapa fora de andamento recusados; autor recusado; "corrigida" com a mais recente de outra pessoa recusada; "sem alteração" com escopo recusada; processo sem versão recusado; data futura recusada; concluir sem revisão, com revisão de versão antiga e depois de voltar com versão nova recusados; "corrigida" que gerou a mais recente aceita; excluir processo com revisão recusado com a contagem; cada registro gera um evento; vale num subprocesso e continua no item depois de reclassificar. Os testes antigos que concluem a etapa 6 sem revisão passam a montá-la antes.
- [ ] A seção Revisão e aprovação aparece abaixo de Versões no painel de qualquer item, com o bloco Revisão interna (da mais recente para a mais antiga: versão, revisor, data, resultado, escopo, comentário) e "Nenhuma revisão registrada." quando vazio.
- [ ] [Registrar revisão] só com a etapa de revisão interna em andamento e o processo em andamento, para Administrador e Integrante; o formulário traz hoje preenchido (sem data futura), mostra qual versão será a revisada e qual a nova conforme o resultado, e pede o escopo só em "corrigida".
- [ ] Recusas e falhas ao gravar aparecem em vermelho sem perder o preenchido; "Carregando…" e o erro com [Tentar de novo] na leitura; a recusa do "Concluir" aparece como "Registre a revisão da versão V9 antes de concluir.".
- [ ] Os eventos de revisão registrada aparecem no histórico do processo.
- [ ] Testes do módulo real com o cliente simulado (chamadas e tradução das recusas), das funções puras e da tela inteira com a falsa, cobrindo os itens acima.
- [ ] [visual] A seção segue o estilo das seções Versões e Reuniões; o formulário mostra claramente qual versão será revisada.
