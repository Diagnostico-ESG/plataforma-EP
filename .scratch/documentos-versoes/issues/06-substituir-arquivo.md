# 06: Substituir arquivo

**Como resolve a sua parte.** Anexar o arquivo errado é um erro de envio, não uma mudança no trabalho, então não deve gerar versão nova (ADR 0007). Este ticket dá a cada arquivo de versão nova o botão [Substituir]: depois de uma confirmação que avisa que o anterior não fica guardado, o arquivo novo, do mesmo tipo e com as mesmas conferências do envio, é gravado no mesmo arquivo do Drive, mantém o nome da versão, e o histórico registra quem trocou, quando, qual arquivo e o nome e o hash do que saiu.

**What to build:** função do banco de substituição (só tamanho, hash, autor e data mudam, pelo privilégio de coluna), gatilhos das regras (versão nova, processo em andamento) e o evento com o "antes"; ação `iniciar_envio` em modo de atualização do mesmo arquivo do Drive e `registrar` para substituição; botão, confirmação e formulário na seção Versões. Spec: histórias 28 a 32 e 45 (substituição).

**Blocked by:** 02.

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Banco: testes antes da migração: substituir em versão nova aceito para Administrador e Integrante, recusado para Consulta, inativo e visitante; em versão histórica recusado; com processo fora de andamento recusado; alterar `nome`, `papel` ou `drive_id` recusado; o evento traz no "antes" o nome e o hash do que saiu.
- [ ] A substituição grava no mesmo identificador do Drive (nenhum arquivo novo na pasta, nada apagado).
- [ ] [Substituir] em cada arquivo de versão nova, para Administrador e Integrante com o processo em andamento; a confirmação avisa que o anterior não fica guardado; o arquivo novo precisa ser do mesmo papel e passa pelas conferências do envio.
- [ ] O histórico do processo mostra a troca com o texto próprio.
- [ ] Testes de interface com a falsa: substituir com sucesso, cancelar na confirmação, tipo errado, falha no envio e recusas.
