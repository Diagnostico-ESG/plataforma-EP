# 03: Gerir usuários que já entraram

**Como resolve a sua parte.** Com a equipe autorizada (ticket 02), o administrador precisa acompanhar as mudanças da equipe: trocar o perfil de alguém, desativar quem saiu, reativar quem voltou e corrigir um nome que veio errado do Google. O banco impede que o administrador se tranque fora ou deixe a plataforma sem administrador ativo, e a tela explica qual regra impediu.

**What to build:** na lista de Administração > Usuários, as ações de mudar perfil, desativar, reativar e corrigir nome, com as travas e as mensagens delas. Spec: `.scratch/login-perfis/spec.md` (histórias 26 a 34 e 37; tabela "Regras que o banco impõe").

**Blocked by:** 02 (Autorizar e-mails).

**Status:** ready-for-agent

## Critérios de aceite

- [x] Política de alteração de `usuarios` só para Administrador ativo, e só nas colunas nome, perfil e ativo; id, foto e data do primeiro acesso não se alteram; ninguém apaga usuário. Cada célula com teste pgTAP para cada perfil, inativo e visitante.
- [x] Travas no banco, cada uma com código de motivo e teste: ninguém desativa a si mesmo; ninguém muda o próprio perfil; com dois administradores, desativar ou rebaixar um passa e o segundo é recusado.
- [x] Nome corrigido pelo administrador não é desfeito no acesso seguinte do usuário.
- [x] Mudar perfil, desativar, reativar e corrigir nome gravam evento com autor, antes e depois.
- [x] Módulo de acesso ganha mudar perfil, desativar, reativar e corrigir nome (real e falso).
- [x] Ações de cada linha conforme a situação; usuário que já entrou não tem opção de excluir (ADR 0002).
- [x] Mensagens das travas: "Você não pode desativar a si mesmo.", "Você não pode mudar o seu próprio perfil.", "Não é possível: {nome} é o último administrador ativo."; tradução coberta por teste unitário.
- [x] Falha de gravação mostra o motivo e mantém o que foi digitado.
- [x] Testes de interface com o aplicativo inteiro e o módulo falso, cobrindo cada ação com sucesso, com falha e com cada trava.
