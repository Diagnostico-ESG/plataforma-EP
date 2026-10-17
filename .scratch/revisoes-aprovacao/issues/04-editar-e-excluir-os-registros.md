# 04: Editar e excluir revisões e aprovação

**Como resolve a sua parte.** Um engano no registro (data, comentário, escopo, número do E-protocolo) hoje não teria conserto. Este ticket deixa editar os campos editáveis da revisão e da aprovação e excluir a revisão mais recente ou a aprovação, com confirmação, quando nada depende delas; tudo fica no histórico com o antes e o depois.

**What to build:** gatilhos de alterar e apagar nas duas tabelas (processo em andamento; só a revisão mais recente se exclui; revisão não com `revisao_interna` concluída; aprovação não com `aprovacao_setor` concluída; datas conferidas também na edição); eventos de edição e exclusão com antes e depois; editar e excluir no módulo de revisões; [Editar] em cada registro e [Excluir] no mais recente de cada tipo, com a janela de confirmação que já existe; frases das recusas. Spec: histórias 27 a 31.

**Blocked by:** 02, 03.

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Banco: testes antes da migração: editar data, comentário e escopo da revisão e número, link e data da aprovação aceitos; editar versão, revisor ou quem registrou recusado; edição com data futura ou fora de ordem recusada; excluir a revisão mais antiga recusado; excluir a revisão com a etapa 6 concluída e a aprovação com a etapa 8 concluída recusados; excluir a aprovação com a etapa reaberta aceito; processo parado recusado; consulta, inativo e visitante recusados; cada edição e exclusão gera um evento com antes e depois.
- [ ] [Editar] em cada registro e [Excluir] só no mais recente de cada tipo, para Administrador e Integrante, com o processo em andamento; somem com a Consulta e com o processo parado.
- [ ] [Excluir] pede confirmação; as recusas por dependência aparecem com a frase do que fazer antes; falhas não perdem o preenchido.
- [ ] Edições e exclusões aparecem no histórico do processo com o antes e o depois.
- [ ] Testes do módulo real e da tela inteira com a falsa cobrindo os itens acima.
