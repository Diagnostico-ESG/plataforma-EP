# 07: Conferência com o Drive

**Como resolve a sua parte.** A pasta do Drive é aberta à equipe, então alguém pode trocar ou apagar um arquivo lá sem passar pela plataforma, e o registro ficaria afirmando algo que já não é verdade. Este ticket faz a seção Versões, ao abrir, perguntar à função do servidor como está cada arquivo no Drive: a função compara o hash e a existência com o que o banco guarda, e a tela marca "alterado fora da plataforma" ou "não encontrado no Drive". Se a conferência falhar, a lista aparece normalmente, com um aviso discreto.

**What to build:** ação `conferir` da função do servidor (por processo; resultado não é gravado); conferência no módulo de versões (real e falso); marcas e aviso na seção Versões. Spec: histórias 39 e 50; seção "Regras de estado".

**Blocked by:** 02.

**Status:** ready-for-agent

## Critérios de aceite

- [ ] `conferir` devolve, por arquivo do processo, `ok`, `alterado` ou `nao_encontrado`, comparando o MD5 e a existência no Drive; recusa inativo e sem login; coberta pelo arquivo puro de decisão.
- [ ] Ao abrir a seção Versões, a conferência roda uma vez; as marcas aparecem como pílulas com texto no arquivo afetado.
- [ ] Conferência que falha: lista normal, sem marcas, com o aviso "Não foi possível conferir os arquivos no Drive.".
- [ ] Testes de interface com a falsa: cada resultado e a falha; teste do módulo real com `fetch` simulado.
- [ ] Prova no projeto de desenvolvimento: arquivo alterado à mão no Drive de desenvolvimento aparece como "alterado fora da plataforma".
