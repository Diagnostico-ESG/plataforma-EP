# Sabatina de processos-etapas (2026-10-13)

Decisões do usuário, para o `to-spec`. Termos no `CONTEXT.md` (seções "Setores" e "Processos").

## Rodada 1 (todas conforme a recomendação)

- **Escopo.** Entra: processos e subprocessos, catálogo de etapas, andamento (status, nota, responsável, datas de início e conclusão), situação do processo, reclassificação, responsáveis do setor e histórico. Fica para depois: reuniões (funcionalidade 4), envio de documentos (5), revisão interna, rodadas com o setor, E-protocolo, captura de etapa e a configuração "capturada ou usuário fixo" (6), prazo padrão e atraso (8).
- **Andamento manual.** O integrante registra cada etapa à mão (iniciar, concluir, dispensar etc.). Quando as funcionalidades 5 e 6 chegarem, algumas etapas passam a andar sozinhas.
- **Etapas do setor.** Processo pode ser cadastrado a qualquer momento. A primeira etapa do processo (4) só começa com a etapa 3 do setor resolvida (concluída, realizada anteriormente ou dispensada). Na tela do processo, as etapas 1 a 3 aparecem como as do setor, sem edição; são alteradas na tela do setor.
- **Responsáveis do setor.** Do setor, nenhum ou vários; nome obrigatório, e-mail e cargo opcionais; e-mail de qualquer domínio. Todos os perfis veem. Glossário corrigido ("responde pelo setor junto ao EP").
- **Catálogo.** Nasce com as 9 etapas da fase 1. O administrador acrescenta, renomeia, muda a ordem, marca obrigatória ou opcional e desativa (some dos processos novos, continua onde foi usada). Não exclui etapa em uso nem troca o nível depois de criada. Sem o campo "fase" até existir a fase 2.
- **Campos do processo.** Nome, setor e macroprocesso obrigatórios; tipo (processo | subprocesso | a classificar, padrão "a classificar"); origem (novo | retomado, padrão "novo"); contexto e observações opcionais. Nome único dentro do setor, sem diferenciar maiúsculas. Vigência e próxima revisão adiadas para a funcionalidade 6.
- **Permissões.** Administrador e Integrante criam, editam, registram andamento, reclassificam e excluem processos (com a janela de confirmação; o histórico guarda o conteúdo). Só o Administrador mexe no catálogo. Consulta só lê, inclusive o histórico. Visitante e inativo: nada. Com documentos (funcionalidade 5), o banco passará a recusar excluir processo com documento.
- **Mudar de macroprocesso.** Permitido na edição; se o setor não for setor envolvido no novo, entra na hora (com evento). Subprocessos acompanham o pai. Sem motivo obrigatório; o histórico guarda o "de → para".
- **Tirar setor de macroprocesso com processos.** O banco recusa e explica quantos processos o setor tem ali (fecha o item do backlog de cadastros-basicos).

## Divergências com `.scratch/especificacao.md`
- Responsável do setor: vários por setor, em cadastro próprio (a especificação tinha um responsável no setor).
- Campo "fase" do catálogo e "prazo padrão" adiados; vigência e próxima revisão adiadas.

## Rodada 2 (todas conforme a recomendação)

- **Etapa nova no catálogo.** Entra como "pendente" em todos os processos em andamento (concluídos e cancelados não recebem); etapas seguintes já iniciadas continuam como estão, e a nova fica como pendência para o integrante dispensar ou registrar. Desativar: some de onde estava pendente e continua onde já foi usada.
- **Dispensar.** "Dispensada" (com nota) só em etapa opcional; "realizada anteriormente" (com nota) em qualquer etapa. Catálogo inicial: 1, 2 e 9 opcionais; 3 a 8 obrigatórias. O administrador muda a marcação.
- **Ordem e voltar.** No máximo uma etapa em andamento por processo. Etapa atual calculada: a em andamento ou, sem ela, a primeira pendente. Etapa só começa com a anterior resolvida. Voltar: escolhe uma etapa anterior, com motivo; ela volta a "em andamento" e as posteriores concluídas voltam a "pendente"; o histórico guarda o estado anterior. Etapas do setor se reabrem do mesmo jeito, na tela do setor, sem desfazer o andamento dos processos dele.
- **Situação.** Guardadas: em andamento, suspenso, cancelado (suspender e cancelar com motivo). Concluído é calculado: todas as etapas obrigatórias resolvidas. Suspenso ou cancelado congela o andamento; administrador ou integrante retoma, com motivo. Voltar uma etapa de um concluído o tira de concluído.
- **Reclassificação.** Regras 10 a 13, 15 e 19 da especificação: motivo obrigatório, mesma identidade; virar subprocesso adota o macroprocesso do pai (setor entra como envolvido se faltar; aviso antes quando o macroprocesso muda); processo com subprocessos não vira subprocesso; o pai é sempre do tipo "processo"; subprocesso pode ser cadastrado já com o pai. Regra 14 (aviso de estrutura alterada após aprovação) vai para a funcionalidade 6.
- **Telas.** Área Processos com Quadro (colunas por etapa atual, mais "Aguardando o setor") e Lista (filtros: setor, macroprocesso, etapa, situação, tipo, responsável; atraso na funcionalidade 8). Painel do processo: dados, caminho de etapas com as ações, subprocessos, suspender/cancelar/retomar, reclassificar e só a aba Histórico. Tela do setor ganha responsáveis, etapas do setor e processos. Catálogo de etapas em Administração, só administrador. A Lista pode virar ticket posterior se a funcionalidade ficar grande.
- **Responsável da etapa.** Usuário ativo Administrador ou Integrante, opcional, trocável a qualquer momento por administrador ou integrante, com histórico. Responsável desativado depois continua aparecendo, marcado como inativo. Captura na funcionalidade 6.

## Rodada 3 (todas conforme a recomendação)

- **Datas das etapas.** Início e conclusão vêm preenchidos com hoje e podem ser corrigidos na hora ou depois; nunca no futuro, conclusão nunca antes do início; a correção entra no histórico.
- **Excluir processo com subprocessos.** O banco recusa e explica quantos subprocessos há ("reclassifique-os ou exclua-os antes").
- **Quadro.** Por padrão, só processos em andamento, na coluna da etapa atual; suspensos aparecem com a pílula "Suspenso". Concluídos e cancelados ficam só na Lista (filtro de situação).
- **Histórico fora do processo.** Etapas do setor e responsáveis do setor aparecem na aba Histórico da área Setores, com o filtro por item que já existe.

## ADR
- 0004: mudar o catálogo muda o caminho dos processos em andamento (decisão da rodada 2).

## Lembrete técnico
- Toda tabela ou view nova em `public` reprova o teste `10_privilegios_padrao` até receber o seu `revoke`.
