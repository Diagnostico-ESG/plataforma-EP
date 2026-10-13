# 01: Peças comuns de acesso ao banco

**Como resolve a sua parte.** O módulo de processos vai ser o terceiro a conversar com o banco, e os módulos de cadastros já repetem as mesmas peças: a declaração do cliente Supabase e do erro do banco, a tradução da recusa por perfil e a explicação de quando uma gravação não muda nenhuma linha. Este ticket junta essas peças num lugar só, sem mudar nada do que a pessoa vê, para o módulo novo nascer usando-as em vez de copiá-las pela terceira vez.

**What to build:** refatoração sem mudança de comportamento: as peças repetidas dos módulos de cadastros (tipos do cliente e do erro do banco, tradução do código de recusa por perfil, explicação de "nada mudou") passam a vir de um ponto compartilhado, com nomes específicos do domínio. Cobre a parte (2) do item "Refatoração em cadastros-basicos" do `.scratch/backlog.md`; as demais partes daquele item continuam no backlog. Spec: `.scratch/processos-etapas/spec.md` (seção "Interface", "Terceiro módulo injetado").

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Os tipos do cliente Supabase e do erro do banco são declarados uma vez só e usados por todos os módulos de cadastros.
- [ ] A tradução da recusa por perfil e a explicação de gravação sem efeito existem uma vez só, com o texto de cada módulo passado como parâmetro (o de cadastros continua "Seu perfil não permite alterar os cadastros.").
- [ ] Os testes existentes passam sem mudança de comportamento, mesma quantidade antes e depois; testes das peças compartilhadas onde ainda não houver.
- [ ] O item do backlog é atualizado dizendo que a parte (2) foi feita neste ticket.

Concluído em 2026-10-13 (commit 8cce4e8)
