# 04: Histórico de usuários

**Como resolve a sua parte.** Os tickets 01 a 03 já gravam um evento para cada mudança de usuário e de autorização. Este ticket mostra esses eventos ao administrador, para responder a uma auditoria, e garante no banco que nenhum evento possa ser alterado ou apagado pela plataforma e que só o Administrador os leia (eles trazem e-mails).

**What to build:** lista do histórico de usuários na área Administração, do mais recente para o mais antigo, com data e hora, quem fez, a ação e o antes e depois. Spec: `.scratch/login-perfis/spec.md` (histórias 38 a 41).

**Blocked by:** 02 (Autorizar e-mails). Pode correr em paralelo com o 03: mostra os eventos que já existirem.

**Status:** ready-for-agent

## Critérios de aceite

- [x] `eventos`: leitura só para Administrador ativo; ninguém inclui, altera ou apaga pela plataforma (só os gatilhos incluem). Cada célula com teste pgTAP para cada perfil, inativo e visitante.
- [x] Módulo de acesso ganha listar histórico (real e falso).
- [x] Lista na área Administração com data e hora, autor (nome; "Configuração inicial (direto no banco)" quando o autor é nulo, como na autorização do primeiro administrador), ação em texto legível e o antes e depois.
- [x] Estados: "Carregando histórico…", "Nenhuma alteração registrada ainda." e erro com [Tentar de novo].
- [x] Testes de interface com o aplicativo inteiro e o módulo falso, cobrindo lista, vazio, erro e a ausência do histórico para quem não é administrador.
