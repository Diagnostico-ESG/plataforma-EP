# 05: Relatório depois e "sem alteração de conteúdo"

**Como resolve a sua parte.** Muitas vezes o fluxograma de uma versão fica pronto antes do relatório, ou o relatório não muda de uma versão para a outra. Este ticket marca "relatório pendente" nas versões novas sem relatório, deixa acrescentar o relatório depois (a versão mais recente pendente vem escolhida) e, quando o relatório não mudou, oferece "sem alteração de conteúdo": a função copia no Drive o relatório da versão anterior com o nome da versão nova, e o histórico registra a cópia.

**What to build:** funções do banco para acrescentar relatório e para "sem alteração", com os gatilhos das regras (só em versão nova sem relatório; cópia só da versão imediatamente anterior, que precisa ter relatório; coluna `copiado_de`); ações `registrar` (relatório) e `sem_alteracao` da função do servidor; marca, botões e formulário na seção Versões. Spec: histórias 22 a 27 e 45 (relatório e sem alteração).

**Blocked by:** 02.

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Banco: testes antes da migração: relatório acrescentado a versão nova sem relatório aceito; a versão que já tem, recusado; a versão histórica, recusado; "sem alteração" copiando da versão anterior com relatório aceito; de versão sem relatório ou que não é a anterior, recusado; cada operação gera um evento.
- [ ] `sem_alteracao` copia o arquivo no Drive (sem passar pelo navegador) para a pasta do processo com o nome da versão nova e registra o arquivo com `copiado_de`.
- [ ] A marca "relatório pendente" (pílula com texto) aparece em toda versão nova sem relatório, calculada na tela.
- [ ] [Acrescentar relatório] abre o formulário com a versão mais recente pendente escolhida e permite escolher outra; aceita só .docx ou .pdf até 20 MB.
- [ ] [Sem alteração de conteúdo] só aparece na versão nova pendente cuja anterior tem relatório; pede confirmação; a versão mostra de qual versão o relatório veio.
- [ ] Recusas viram mensagens; testes de interface com a falsa cobrindo os itens acima, inclusive falhas.
