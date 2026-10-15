# 08: A pasta acompanha a renomeação

**Como resolve a sua parte.** As pastas do Drive levam a sigla do setor e o nome do processo, que podem mudar depois (renomear o processo, trocar a sigla, mudar o processo de setor). Este ticket faz a pasta acompanhar: na próxima vez que a plataforma mexe nela (o próximo envio), a função confere se o nome e o lugar da pasta batem com os atuais e renomeia ou move a pasta, achando-a pelo identificador guardado. Os arquivos já enviados mantêm o nome com que foram enviados (regra 18).

**What to build:** conferência de nome e lugar da pasta do setor e da do processo em `iniciar_envio`, com renomear e mover no Drive; a decisão (nada, renomear, mover) numa função pura testada. Spec: história 38; seção "Pastas no Drive".

**Blocked by:** 02.

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Função pura que, dado o nome e o lugar atuais da pasta no Drive e a sigla, o setor e o nome atuais no banco, decide entre nada, renomear e mover; testes unitários dos três casos e do subprocesso.
- [ ] Processo renomeado: no próximo envio a pasta tem o nome novo; os arquivos antigos mantêm o nome antigo, e os novos usam o nome novo.
- [ ] Sigla trocada: a pasta do setor é renomeada.
- [ ] Processo trocado de setor: a pasta do processo é movida para a pasta do novo setor (criada se faltar).
- [ ] Prova no projeto de desenvolvimento com um processo inventado renomeado.
