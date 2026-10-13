# 06: Voltar, datas e responsável da etapa

**Como resolve a sua parte.** O trabalho real tem idas e vindas: uma etapa precisa ser refeita, alguém registra hoje o que aconteceu semana passada, a etapa muda de mãos. Este ticket permite voltar a uma etapa anterior com motivo (no processo e no setor), corrigir as datas de início e de conclusão e escolher o responsável de cada etapa, sempre com o histórico guardando como estava antes. O painel e o tempo médio por etapa passam a refletir quando o trabalho de fato aconteceu e quem cuida dele.

**What to build:** função do banco de voltar a uma etapa (a escolhida volta a em andamento, as seguintes resolvidas voltam a pendente, um evento por andamento); [Voltar a esta etapa] com a janela de motivo, no painel do processo e na tela do setor; correção das datas (nunca no futuro, conclusão nunca antes do início); seletor de responsável da etapa (usuários ativos Administrador ou Integrante; inativo marcado); avatar do responsável da etapa atual no cartão. Spec: `.scratch/processos-etapas/spec.md` (histórias 20 (responsável), 38 a 43, 46, 58; seções "Interface", "Regras que o banco impõe" e "Regras de estado").

**Blocked by:** 05 (Andamento das etapas do processo).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Testes pgTAP antes da migração: voltar à 4 com a 5 e a 6 resolvidas deixa a 4 em andamento e as seguintes pendentes, com um evento por andamento e o motivo; voltar sem motivo recusado; voltar no setor não mexe nos andamentos dos processos; data no futuro recusada; conclusão antes do início recusada; responsável de perfil Consulta ou inativo recusado; o processo concluído deixa de ser concluído ao voltar.
- [ ] A função de voltar não é `security definer` e a RLS decide quem pode chamá-la.
- [ ] Módulo de processos (real e falso) ganha voltar, corrigir datas e mudar responsável; recusas: "A data {valor} está no futuro.", "A conclusão ({valor}) não pode ser antes do início ({valor}).", "{Usuário} não pode ser responsável: só usuários ativos de perfil Administrador ou Integrante do EP.".
- [ ] Painel e tela do setor: [Voltar a esta etapa] nas etapas resolvidas anteriores à atual, com a janela de motivo; datas editáveis para quem pode; seletor de responsável sem inativos e sem Consulta; responsável inativo aparece marcado "Inativo".
- [ ] Cartão do Quadro mostra o avatar do responsável da etapa atual.
- [ ] Histórico: "Voltou à etapa", "Corrigiu as datas da etapa", "Mudou o responsável da etapa", com o motivo.
- [ ] A Consulta não vê as ações nem os campos editáveis.
- [ ] Testes de interface com o aplicativo inteiro: voltar (processo e setor) com sucesso e com falha, a janela de motivo, as datas recusadas com o valor recebido, o seletor de responsável e o avatar no cartão.
