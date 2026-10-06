---
description: Roda o Impeccable para revisar e polir o design da interface recém-implementada.
---

Rode, nesta ordem, como comandos dentro desta conversa (não são comandos de terminal):

1. `/impeccable:impeccable audit` — identifica problemas de design na interface implementada (acessibilidade, consistência, responsividade).
2. `/impeccable:impeccable polish` — aplica o polimento final, alinhando ao sistema de design do projeto.

Se o comando acima não for reconhecido, tente a forma curta `/impeccable audit` / `/impeccable polish` — o nome exato pode variar conforme a versão instalada.

Depois do `polish`, rode `npm test` e o typecheck, e comite. Relate o que foi encontrado e o que foi corrigido em cada etapa, e acrescente os achados corrigidos (e os deixados de fora, com o motivo) numa entrada datada de `.scratch/<funcionalidade>/desvios.md`: o `/ship` lê de lá.

**Quando terminar:** veja se há tickets pendentes (sem a linha `Concluído em`) em `.scratch/<funcionalidade>/issues/` (se a pasta não existir, a spec é o único ticket). Se houver, lembre que o próximo passo é rodar `/executar-simples` ou `/executar-complexo` para o próximo ticket — não pule para `/ship` com trabalho pendente. Se este era o último ticket, lembre explicitamente que o próximo passo do funil é `/ship`. Exceção: se a tarefa veio do `/demanda` como bug ou ajuste pequeno, o `/ship` só roda nas condições que o `/demanda` lista (dependência, migração, função, login, permissão ou validação de entrada). Peça também o `/cost`, como manda o `CLAUDE.md`.
