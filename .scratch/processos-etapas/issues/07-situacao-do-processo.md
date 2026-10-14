# 07: Situação do processo

**Como resolve a sua parte.** Nem todo processo segue até o fim: alguns param por um tempo, outros deixam de ser mapeados. Este ticket permite suspender, cancelar e retomar um processo, sempre com motivo, congelando o andamento enquanto ele estiver parado. O Quadro mostra os suspensos com a pílula "Suspenso" para que o trabalho parado não seja esquecido, e os cancelados saem dele; o motivo fica visível no painel e no histórico.

**What to build:** funções de suspender, cancelar e retomar (motivo obrigatório; `motivo_da_situacao` preenchido ou limpo); congelamento dos andamentos com o processo suspenso ou cancelado; ações no painel com a janela de motivo; aviso no painel com o motivo; pílula "Suspenso" no cartão; cancelados fora do Quadro. Spec: `.scratch/processos-etapas/spec.md` (histórias 21, 22 (cancelados), 53 a 56, 59; seções "Interface", "Regras que o banco impõe" e "Regras de estado").

**Blocked by:** 05 (Andamento das etapas do processo).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Testes pgTAP antes da migração: suspender, cancelar e retomar sem motivo recusados; transições da spec aceitas e as demais recusadas; iniciar, concluir ou dispensar etapa de processo suspenso ou cancelado recusado; cada ação gera o evento com o motivo; retomar limpa `motivo_da_situacao`.
- [ ] As funções não são `security definer`; Consulta, inativo e visitante recusados.
- [ ] Módulo de processos (real e falso) ganha suspender, cancelar e retomar; recusa: "Este processo está {suspenso | cancelado}; retome-o para registrar o andamento.".
- [ ] Painel: [Suspender], [Cancelar] e [Retomar] conforme a situação, com a janela de motivo; com o processo parado, as ações das etapas somem e aparece "Este processo está {suspenso | cancelado}: {motivo}. Retome-o para registrar o andamento."; pílulas "Suspenso" e "Cancelado".
- [ ] Quadro: suspensos com a pílula "Suspenso"; cancelados saem.
- [ ] Histórico: "Suspendeu", "Cancelou", "Retomou", com o motivo.
- [ ] A Consulta não vê as ações.
- [ ] Testes de interface com o aplicativo inteiro: cada ação com sucesso e com falha, a janela de motivo (vazia, Esc), o congelamento, a pílula no cartão e o cancelado saindo do Quadro.

Concluído em 2026-10-14 (commit a39b33a)
