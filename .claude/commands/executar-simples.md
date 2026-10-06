---
description: Prepara o resumo da tarefa e devolve o comando pronto para você rodar /mattpocock-skills:implement — essa skill não pode ser disparada nos bastidores.
---

A skill `/mattpocock-skills:implement` é de invocação direta pelo usuário — não pode ser acionada por este comando "nos bastidores", nem seu fluxo deve ser simulado manualmente.

O ticket atual é o de menor número sem a linha `Concluído em` em `.scratch/<funcionalidade>/issues/`; sem essa pasta, é a spec. Se não houver spec nem descrição de ajuste vinda do `/demanda`, pare e aponte o `/planejar`. Resuma o ticket em uma frase objetiva e me devolva o comando pronto para eu copiar e rodar. Se o ticket mexe no banco, acrescente ao resumo: "seguir `.claude/regras/banco.md`; migração nova com RLS e políticas da seção Modelo de dados, teste de banco antes da migração, depois db:reset (local) ou supabase db push (remoto de desenvolvimento, com o vínculo conferido), test:db e db:types".

`/mattpocock-skills:implement <resumo objetivo da tarefa>`

Não tente resolver a tarefa você mesmo, nem recriar o que o `/implement` faria (TDD + revisão) fora dele. Isso vale mesmo que a tarefa pareça trivial demais para justificar TDD — essa decisão é minha.

**Quando o `/mattpocock-skills:implement` terminar de rodar:** se o ticket mexeu no banco, confira que a migração, o teste de banco e os tipos atualizados estão no commit e que `npm run test:db` passa; se faltar algo, me diga o quê antes de seguir. Depois, se a tarefa era um ticket, acrescente ao fim do arquivo dele a linha `Concluído em AAAA-MM-DD (commit <hash>)`; se era a spec inteira, acrescente ao fim dela `Implementado em AAAA-MM-DD (commit <hash>)`. Comite. Veja se há tickets pendentes (os sem essa linha) em `.scratch/<funcionalidade>/issues/` (se a pasta não existir, a spec é o único ticket). Se houver, aponte o próximo. Se este era o último, lembre explicitamente o próximo passo: `/polir` se a funcionalidade mexeu na interface, ou `/ship` se não mexeu. Se a tarefa veio do `/demanda` como bug ou ajuste pequeno, o `/ship` só roda nas condições que o `/demanda` lista (dependência, migração, função, login, permissão ou validação de entrada). Peça também o `/cost`, como manda o `CLAUDE.md`. Não deixe a conclusão terminar só no commit, sem essa lembrança.
