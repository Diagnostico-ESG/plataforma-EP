# 04: Reuniões no setor e no processo

**Como resolve a sua parte.** A equipe procura as reuniões onde está trabalhando: no setor, para saber se a sensibilização já aconteceu, e no processo, para saber quando ele foi modelado. Este ticket mostra as reuniões do setor no setor aberto e as reuniões de modelagem no painel do processo, com atalho para registrar uma nova já preenchida, leva os eventos dessas reuniões ao histórico do processo e explica, com a contagem, por que um setor ou processo com reunião não pode ser excluído.

**What to build:** seção Reuniões no setor aberto (área Setores) e no painel do processo, com [Registrar reunião] preenchido; eventos de reunião no histórico do processo; mensagens de recusa ao excluir setor e processo com reunião; leituras do setor e do processo com as reuniões ligadas. Spec: `.scratch/reunioes/spec.md` (histórias 32 a 36, 42, 43, 45; seção "Interface").

**Blocked by:** 01 (Registrar e ver reuniões) e 02 (Editar, excluir e histórico da reunião).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Banco: excluir setor com 2 reuniões recusado com a contagem; excluir processo com 1 reunião recusado com a contagem; reclassificar processo com reunião mantém a reunião; testes antigos de exclusão de setor e de processo conferidos.
- [ ] Setor aberto: seção Reuniões com data, tipo e processos; "Nenhuma reunião."; carregando e erro; clicar abre a reunião na área Reuniões; [Registrar reunião] (Administrador e Integrante) abre o formulário com o setor preenchido.
- [ ] Painel do processo: seção Reuniões com as reuniões de modelagem que trataram o processo; "Nenhuma reunião."; [Registrar reunião] abre o formulário com tipo modelagem, setor e processo preenchidos.
- [ ] Histórico do processo mostra os eventos de reunião em que o processo aparece antes ou depois da mudança.
- [ ] Excluir setor ou processo com reunião mostra em vermelho a recusa com a contagem de reuniões e o caminho (desativar o setor, cancelar o processo).
- [ ] Consulta vê as seções sem [Registrar reunião].
- [ ] Testes de interface com o aplicativo inteiro cobrindo os itens acima.
