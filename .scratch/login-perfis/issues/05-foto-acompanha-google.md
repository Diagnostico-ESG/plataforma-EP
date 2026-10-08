# 05: Foto do avatar acompanha a conta Google

**Como resolve a sua parte.** Hoje a foto é copiada do Google só no primeiro acesso, e quem troca a foto depois continua com a antiga na plataforma. Este ticket faz o banco atualizar a foto a cada entrada, sem mexer no nome que o administrador corrigiu e sem encher o histórico (ADR 0003).

**What to build:** quem troca a foto da conta Google vê a foto nova na plataforma a partir da próxima entrada; quem tira a foto passa a aparecer com as iniciais. Vale também para o usuário inativo. Spec: `.scratch/login-perfis/spec.md` (histórias 44 a 46; regra "A foto acompanha o Google a cada entrada").

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Conferido na documentação atual do Supabase que os dados do Google na conta do Auth são atualizados a cada entrada; se não forem, parar e mostrar as opções ao usuário.
- [ ] Migração nova, não destrutiva, com a função (schema não exposto, `search_path` vazio) e o gatilho depois de alterar a conta no Auth; nenhuma tabela ou coluna muda.
- [ ] Teste pgTAP escrito antes da migração, um caso por linha da regra: link novo → `foto_url` atualizado; dados sem foto → `foto_url` nulo; usuário inativo também atualizado; nome corrigido pelo administrador não muda; nenhum evento novo.
- [ ] `foto_url` continua fechada para alteração pela API (o teste de "quem pode o quê" de `usuarios` segue passando).
- [ ] Testes de banco anteriores (02 a 06) seguem passando pelo SQL Editor; migração registrada em `supabase/AMBIENTES.md` na lista das aplicadas à mão.
- [ ] Ponta a ponta manual, pelo usuário: trocar a foto na conta Google, sair, entrar e ver a foto nova no avatar.
