# 01: Fase do Regimento no catálogo

**Como resolve a sua parte.** Os dashboards contam o andamento pelas fases I a IX do Regimento, e o catálogo só conhece etapas. Este ticket liga cada etapa a uma fase, escolhida pelo Administrador, para que a montagem das planilhas (ticket 03) saiba em que fase está cada processo, e para que uma etapa nova nunca fique fora do dashboard sem aviso.

**What to build:** tipo `fase_do_regimento` (IV a IX) e coluna obrigatória `etapas.fase`, preenchida na própria migração para as seis etapas atuais (Modelagem piloto → IV; Relatório e modelagem técnica → V; Revisão interna, Revisão pelo setor e Aprovação pelo setor → VI; Publicação → VII; códigos conferidos no banco); `acrescentar_etapa` com o parâmetro da fase; o histórico do catálogo levando a fase no antes e no depois; no módulo do catálogo (real e falso), a fase lida e gravada; no formulário da etapa (criar e editar), o campo "Fase do Regimento", sem valor na criação, com a recusa "Escolha a fase do Regimento."; na tabela do catálogo, a coluna Fase; no histórico do catálogo, "Fase: V → VI". Spec: histórias 1 a 8.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Critérios de aceite

- [x] Banco: testes antes da migração: etapa sem fase recusada; valor fora de IV a IX recusado; as seis etapas atuais com a fase da sabatina; `acrescentar_etapa` grava a fase; mudar a fase gera evento no histórico do catálogo com o antes e o depois; Integrante, Consulta, desativado e visitante sem poder mudar a fase; a fase de uma etapa protegida pode ser mudada pelo Administrador. Os testes antigos que criam etapas passam a informar a fase.
- [x] O Administrador escolhe a fase ao criar uma etapa; sem fase, o formulário recusa com "Escolha a fase do Regimento." sem perder o preenchido.
- [x] O Administrador troca a fase pelo [Editar]; a tabela do catálogo mostra a coluna Fase.
- [x] O histórico do catálogo mostra a mudança de fase.
- [x] Testes do módulo real com o cliente simulado e da tela inteira com as falsas, cobrindo os itens acima, inclusive falha ao gravar.
- [x] [visual] O campo e a coluna cabem no formulário e na tabela do catálogo sem quebrar o alinhamento, no notebook (1366×768).

Concluído em 2026-10-20 (commit 1aa7e58)
