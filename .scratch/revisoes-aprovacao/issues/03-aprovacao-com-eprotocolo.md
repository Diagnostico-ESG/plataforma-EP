# 03: Aprovação com E-protocolo

**Como resolve a sua parte.** Hoje nada impede dar o processo como aprovado sem número de E-protocolo, nem mandá-lo ao setor com versão incompleta. Este ticket faz o "Concluir" da revisão pelo setor exigir a versão mais recente completa, acrescenta o bloco Aprovação (número, link, data e "V8 aprovada"), faz o "Concluir" da aprovação exigir o registro, e protege a versão aprovada: não se substitui arquivo dela, e não se volta para antes da aprovação sem excluí-la.

**What to build:** trava na conclusão da `revisao_setor` (versão mais recente com .bpmn, .png e relatório); tabela `aprovacoes` com RLS, privilégios de coluna, gatilhos (processo e etapa em andamento, versão mais recente e completa preenchida pelo banco, uma por processo, número, link `http(s)`, data no dia da última revisão interna ou depois) e eventos; trava na conclusão da `aprovacao_setor`; conferência em `voltar_a_etapa`; recusa de substituir arquivo de versão aprovada (gatilho e `substituir_arquivo`); recusa de excluir processo com aprovação; listar e registrar aprovação no módulo de revisões; bloco Aprovação com formulário e link em aba nova; [Substituir] sumindo na versão aprovada; frases das recusas; eventos no histórico. Editar e excluir ficam no ticket 04. Spec: histórias 18 a 26 e 32, 33, 37 a 39 (para a aprovação).

**Blocked by:** 02 (seção, módulo de revisões e a data da última revisão interna).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Banco: testes antes da migração, uma célula de "quem pode o quê" por caso para `aprovacoes` e os eventos dela, e um caso por regra: concluir a revisão pelo setor com versão sem relatório (ou .bpmn, ou .png) recusado com o que falta, com versão completa aceito, com versão nova completa enviada na própria etapa aceito; aprovação fora da etapa ou com processo parado recusada; sem número, com versão incompleta, com link `ftp://`, com data futura ou anterior à última revisão interna e segunda aprovação recusadas; concluir a aprovação sem registro recusado; voltar à revisão pelo setor com aprovação recusado, voltar à própria aprovação aceito; substituir arquivo da versão aprovada recusado, de versão não aprovada aceito; excluir processo com aprovação recusado; cada registro gera um evento; vale num subprocesso. Os testes antigos que concluem as etapas 7 e 8 passam a montar versão completa e aprovação antes.
- [ ] O bloco Aprovação mostra número (link em aba nova, se houver), data, quem registrou e "V8 aprovada", ou "Sem aprovação registrada.".
- [ ] [Registrar aprovação] só com a etapa de aprovação em andamento, sem aprovação e com o processo em andamento, para Administrador e Integrante; o formulário mostra a versão que vai e avisa, sem deixar gravar, se ela estiver incompleta.
- [ ] As recusas do "Concluir" (etapas 7 e 8), da volta e da substituição aparecem como frases ("A versão V8 foi aprovada e seus arquivos não podem ser substituídos."); [Substituir] some na versão aprovada.
- [ ] Os eventos de aprovação aparecem no histórico do processo.
- [ ] Testes do módulo real, das funções puras e da tela inteira com as falsas (a de processos e a de versões passam a consultar a aprovação e a versão completa), cobrindo os itens acima, inclusive falhas.
- [ ] [visual] O formulário mostra claramente qual versão será aprovada; o bloco segue o estilo da seção.
