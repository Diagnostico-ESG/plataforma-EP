---
description: Roda o Impeccable para revisar e polir o design da interface recém-implementada.
---

Antes de começar, leia `.claude/regras/interface.md` e suba a vitrine (`npm run vitrine`): é nela que o Impeccable e eu vemos as telas, sem banco nem login. Sem a vitrine (projeto que ainda não a tem), use o app com os dados falsos dos testes ou peça uma captura de tela minha, e diga o que foi usado.

Rode, nesta ordem, como comandos dentro desta conversa (não são comandos de terminal):

1. `/impeccable:impeccable audit` — identifica problemas de design na interface implementada (acessibilidade, consistência, responsividade).
2. `/impeccable:impeccable polish` — aplica o polimento final, alinhando ao sistema de design do projeto.

Se o comando acima não for reconhecido, tente a forma curta `/impeccable audit` / `/impeccable polish` — o nome exato pode variar conforme a versão instalada.

Achado do `audit` que muda comportamento (não só estilo) não se corrige no polimento: vai para um ticket ou para `.scratch/backlog.md`, e eu decido. Defeito só de estilo se corrige aqui.

Depois do `polish`, rode `npm test` e o typecheck, encerre o servidor da vitrine e comite. Relate o que foi encontrado e o que foi corrigido em cada etapa, e acrescente os achados corrigidos (e os deixados de fora, com o motivo) numa entrada datada de `.scratch/<funcionalidade>/desvios.md`: o `/ship` lê de lá. Depois de um redesenho (sem funcionalidade específica), a entrada vai para `.scratch/backlog.md`.

**Quando terminar:** veja se há tickets pendentes (sem a linha `Concluído em`) em `.scratch/<funcionalidade>/issues/` (se a pasta não existir, a spec é o único ticket). Se houver, lembre que o próximo passo é rodar `/executar-simples` ou `/executar-complexo` para o próximo ticket — não pule para `/ship` com trabalho pendente. Se este era o último ticket, lembre explicitamente que o próximo passo do funil é `/ship`. Exceção: se a tarefa veio do `/demanda` como bug ou ajuste pequeno, o `/ship` só roda nas condições que o `/demanda` lista (dependência, migração, função, login, permissão ou validação de entrada). Grave o próximo passo em `.scratch/proximo-passo.md` e comite. Com "Custo ligado" no `CLAUDE.md`, peça também o `/cost`.
