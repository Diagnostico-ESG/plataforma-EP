# 03: Aprovação na janela de concluir

**Como resolve a sua parte.** Hoje nada registra qual versão o setor aprovou, e um arquivo dela pode ser trocado depois. Este ticket faz a janela de concluir a Aprovação pelo setor mostrar a versão aprovada e aceitar, se já houver, o número, o link e a data do E-protocolo (os três opcionais); grava a aprovação e a conclusão juntas; mostra a aprovação na gaveta e o selo "Aprovada" em Arquivos; impede substituir arquivo da versão aprovada; e faz a volta para a Aprovação ou antes dela desfazer a aprovação, com aviso.

**What to build:** tabela `aprovacoes` com RLS, privilégios de coluna, gatilhos (processo e etapa em andamento; versão mais recente e completa preenchida pelo banco; uma por processo; link `http(s)`; data não futura e no dia da última revisão interna ou depois; apagar só durante a volta) e eventos (registrada e desfeita, com o antes); função `concluir_aprovacao`; o gatilho de conclusão passa a exigir aprovação na `aprovacao_setor`; `voltar_a_etapa` apaga a aprovação quando volta para a `aprovacao_setor` ou antes; recusa de substituir arquivo de versão aprovada (gatilho e `substituir_arquivo`); recusa de excluir processo com aprovação; listar e concluir a aprovação no módulo de revisões; na `JanelaDeAvanco` da `aprovacao_setor`, "Versão aprovada: V8", os três campos, a versão incompleta impedindo, e a janela mesmo sem etapa pendente depois; na gaveta da Aprovação, o registro com o link em aba nova; selo "Aprovada" e [Substituir] sumindo na versão aprovada; na janela de voltar, o aviso "A aprovação da V8 será desfeita."; frases das recusas; eventos no histórico. A edição fica no ticket 04. Spec: histórias 13 a 20, 24, 25, 27 a 31 (para a aprovação).

**Blocked by:** 02 (módulo de revisões e a data da última revisão interna).

**Status:** ready-for-agent

## Critérios de aceite

- [x] Banco: testes antes da migração, uma célula de "quem pode o quê" por caso para `aprovacoes` e os eventos dela, e um caso por regra: aprovação fora da etapa ou com processo parado recusada; versão incompleta, link `ftp://`, data futura ou anterior à última revisão interna e segunda aprovação recusadas; sem número, link e data aceita; `avancar_etapa` direto sem aprovação recusado; `concluir_aprovacao` aceito, iniciando a próxima etapa quando há; voltar à Revisão pelo setor com aprovação apaga a aprovação e gera o evento "desfeita" com o antes; apagar a aprovação direto recusado; substituir arquivo da versão aprovada recusado, de versão não aprovada aceito, e aceito depois da volta que desfaz a aprovação; excluir processo com aprovação recusado; vale num subprocesso. Os testes antigos que concluem a etapa 5 passam a usar a função nova ou a montar a aprovação antes.
- [x] A janela de concluir a Aprovação mostra a versão aprovada e os três campos opcionais; conclui sem eles; com versão incompleta, diz o que falta e não deixa concluir; sem etapa pendente depois, aparece sem a pergunta do responsável; o mesmo pelo arrastar no Quadro.
- [x] A gaveta da Aprovação mostra "V8 aprovada", o número (link em aba nova, se houver), a data e quem registrou, ou "Sem número do E-protocolo"; "Sem aprovação registrada." quando não há.
- [x] A versão aprovada tem o selo "Aprovada" e não mostra [Substituir]; a recusa da substituição aparece como "A versão V8 foi aprovada e seus arquivos não podem ser substituídos.".
- [x] A janela de voltar avisa que a aprovação será desfeita quando a volta é para a Aprovação ou antes dela; depois da volta, o selo some.
- [x] Os eventos de aprovação registrada e desfeita aparecem no histórico do processo.
- [x] Testes do módulo real, das funções puras e da tela inteira com as falsas (a de processos e a de versões passam a consultar a aprovação), cobrindo os itens acima, inclusive falhas.
- [ ] [visual] A janela mostra claramente qual versão é aprovada e cabe na tela do notebook (1366×768); o selo segue o estilo das pílulas de Arquivos.
