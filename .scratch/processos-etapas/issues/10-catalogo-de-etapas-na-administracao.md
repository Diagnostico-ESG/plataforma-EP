# 10: Catálogo de etapas na Administração

**Como resolve a sua parte.** O caminho de etapas precisa mudar sem mexer no código: acrescentar uma etapa, renomear, mudar a ordem, tornar uma etapa opcional. Este ticket dá ao administrador a aba "Catálogo de etapas" na Administração, e o banco aplica cada mudança aos processos conforme o ADR 0004: uma etapa nova entra como pendente nos processos em andamento e suspensos, e uma etapa desativada some de onde estava pendente e continua onde já foi usada.

**What to build:** aba do catálogo na Administração (só administrador); [Nova etapa] (nome, código, nível, obrigatória, posição), [Editar] (nome, obrigatória), [Subir], [Descer], [Desativar] ou [Reativar] e [Excluir] com confirmação; funções do catálogo que acrescentam ou apagam andamentos; eventos de catálogo. Spec: `.scratch/processos-etapas/spec.md` (histórias 68, 70 a 77, 81, 82; ADR 0004; seções "Interface", "Modelo de dados" e "Regras que o banco impõe").

**Blocked by:** 05 (Andamento das etapas do processo).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Testes pgTAP antes da migração (se houver migração): etapa nova entra como pendente nos processos em andamento e suspensos e em todos os setores (inclusive inativos), e não entra em processo concluído nem cancelado; desativar apaga os pendentes e mantém os resolvidos; reativar recria os pendentes onde faltam; excluir etapa já usada recusado; excluir etapa nunca usada apaga os pendentes; etapa do setor depois de uma do processo recusada; Integrante, Consulta, inativo e visitante recusados; cada mudança gera o evento.
- [ ] As funções do catálogo não são `security definer`; a RLS limita ao administrador.
- [ ] Módulo de processos (real e falso) ganha as operações do catálogo; recusas: "A etapa {nome} já foi usada; desative-a em vez de excluir.", "As etapas do setor precisam vir antes das etapas do processo.".
- [ ] Aba "Catálogo de etapas": lista em ordem com nome, nível, obrigatória ou opcional e pílula "Inativa"; código validado na tela (minúsculas sem acento, números e sublinhado) com o valor recebido; "Carregando catálogo…"; erro com [Tentar de novo]; janela "Excluir a etapa {nome} do catálogo?" [Excluir etapa] [Cancelar].
- [ ] A aba não aparece para Integrante nem Consulta.
- [ ] Quadro: coluna de etapa desativada aparece enquanto houver processo nela; etapa nova vira coluna.
- [ ] Histórico: "Acrescentou a etapa ao catálogo", "Mudou a ordem do catálogo", "Desativou a etapa", "Reativou a etapa", "Editou", "Excluiu".
- [ ] Testes de interface com o aplicativo inteiro: cada ação com sucesso e com falha, cada recusa, a etapa nova aparecendo no caminho de um processo em andamento e não num concluído, e a aba escondida para os outros perfis.

Concluído em 2026-10-14 (commit bdff546)
