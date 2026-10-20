# 04: Editar revisões e aprovação

**Como resolve a sua parte.** Um engano no comentário ou no escopo de uma revisão, ou um número do E-protocolo que só chega depois da conclusão, hoje não teria onde entrar. Este ticket põe [Editar] em cada registro da gaveta: na revisão, o comentário e o escopo (só na "corrigida"); na aprovação, o número, o link e a data. Tudo fica no histórico com o antes e o depois.

**What to build:** gatilhos de alterar nas duas tabelas (processo em andamento; escopo só na "corrigida"; link e datas conferidos também na edição); eventos de edição com antes e depois; editar no módulo de revisões; [Editar] em cada registro da gaveta, para Administrador e Integrante, com o processo em andamento, abrindo uma janela no padrão da `JanelaComCampo` com os campos preenchidos; frases das recusas. Spec: histórias 21 a 23.

**Blocked by:** 02, 03.

**Status:** ready-for-agent

## Critérios de aceite

- [x] Banco: testes antes da migração: editar comentário e escopo da revisão "corrigida" e número, link e data da aprovação aceitos; escopo na revisão "sem alteração" recusado; editar versão, resultado, revisor, data da revisão ou quem registrou recusado; link fora do formato e data futura ou anterior à última revisão interna recusados na edição; processo parado recusado; consulta, inativo e visitante recusados; cada edição gera um evento com antes e depois.
- [x] [Editar] em cada registro da gaveta, para Administrador e Integrante, com o processo em andamento; some com a Consulta e com o processo suspenso, cancelado ou concluído. *(Feito para suspenso e cancelado; com o processo concluído o botão aparece, para o critério 3 poder acontecer: ver `desvios.md`, 2026-10-19, ticket 04. Aparência presumida, sem conferência na tela.)*
- [x] Acrescentar o número do E-protocolo a uma aprovação concluída sem ele funciona e aparece na gaveta.
- [x] Recusas e falhas ao gravar aparecem em vermelho sem perder o preenchido.
- [x] Edições aparecem no histórico do processo com o antes e o depois.
- [x] Testes do módulo real e da tela inteira com a falsa cobrindo os itens acima.
