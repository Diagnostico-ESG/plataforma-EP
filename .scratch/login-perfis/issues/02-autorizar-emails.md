# 02: Autorizar e-mails (Administração > Usuários)

**Como resolve a sua parte.** Depois do ticket 01, só o primeiro administrador (criado por SQL) consegue entrar. Este ticket dá ao administrador a área Administração > Usuários, onde ele vê quem tem acesso e autoriza os e-mails da equipe, que passam a conseguir entrar. Quem não é administrador não vê o item na navegação e, se chegar à área, recebe uma mensagem clara em vez de uma tela quebrada.

**What to build:** item Administração visível só ao Administrador; lista de usuários e autorizações com situação em pílula; formulário "Autorizar e-mail"; mudar o perfil e excluir uma autorização ainda não usada. Spec: `.scratch/login-perfis/spec.md` (histórias 14 a 16, 19 a 25, 35 a 37).

**Blocked by:** 01 (Entrar e sair com a conta institucional).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Políticas de `autorizacoes` (ler, criar, alterar perfil, apagar só para Administrador ativo), cada célula da tabela "quem pode o quê" com teste pgTAP para cada perfil, inativo e visitante.
- [ ] E-mail guardado em minúsculas e sem espaços; e-mail fora do domínio recusado; e-mail já autorizado ou já pertencente a um usuário recusado, com teste de cada regra.
- [ ] Autorizar, mudar perfil de autorização e excluir autorização gravam evento com autor, antes e depois.
- [ ] Módulo de acesso ganha listar usuários e autorizações, autorizar, mudar perfil de autorização e excluir autorização (real e falso).
- [ ] Faixa lateral mostra Administração só para o Administrador; outros perfis que chegam à área veem "Seu perfil ({perfil}) não permite administrar usuários. Peça a um administrador para mudar seu perfil."
- [ ] Tabela compacta com avatar, nome, e-mail, perfil e situação em pílula (Ativo, Inativo, Aguardando primeiro acesso), com cor e texto.
- [ ] Formulário "Autorizar e-mail" (e-mail + perfil, padrão Consulta) com validação do e-mail na interface (teste unitário) mostrando o valor digitado e o formato esperado.
- [ ] Estados: "Carregando usuários…" com linhas-fantasma; erro com [Tentar de novo]; erro de gravação com o motivo, mantendo o que foi digitado.
- [ ] Testes de interface com o aplicativo inteiro e o módulo falso, cobrindo cada ação com sucesso e com falha e a visibilidade por perfil.
