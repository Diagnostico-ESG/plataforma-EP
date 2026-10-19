# 13: Resolver a etapa já inicia a próxima (avanço)

**Como resolve a sua parte.** Hoje, passar um processo adiante custa vários cliques: concluir a etapa, depois iniciar a seguinte e depois escolher o responsável dela, e no meio disso o processo pode ficar sem etapa em andamento. Este ticket junta tudo num gesto só: quem conclui, dispensa ou registra como realizada anteriormente escolhe, na mesma janela, quem fica com a próxima etapa, e ela já entra em andamento.

**What to build:** [Concluir] abre a janela "Quem fica com a próxima etapa?" (título "Concluir {etapa} e iniciar {próxima}", rádios com os usuários ativos Administrador e Integrante e "Ninguém por enquanto" por último, marcado o responsável que a próxima já tem ou, sem ele, quem está na tela). As janelas de Dispensar e de Realizada anteriormente ganham a mesma escolha abaixo da nota. Ao confirmar, uma função do banco resolve a etapa e põe em andamento a primeira pendente depois dela, com início hoje e o responsável escolhido (ou nenhum), tudo ou nada. Sem etapa pendente depois, não há janela de responsável e o processo fica concluído se as obrigatórias estiverem resolvidas. O histórico mostra os dois registros (resolveu e "Iniciou a etapa"). [Iniciar] continua um clique sem janela. Ainda sem a trava do autor da versão (ticket 14): a janela mostra todos os integrantes. Spec: `.scratch/processos-etapas/spec.md` (histórias 30, 34, 35, 37, 89 a 100 e 107; "Interface", "Janela de avanço"; "Modelo de dados", "Avanço"; "Regras que o banco impõe", linha do avanço; "Regras de estado"; "Migração da parte 2"). Porquê: ADR 0014.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Banco: migração nova cria a função de avanço (sem `security definer`, com a permissão de quem chama), que recebe o andamento, a ação (concluir, dispensar ou realizada anteriormente), a nota e o responsável da próxima (ou nenhum), resolve a etapa e inicia a primeira pendente depois dela na ordem do catálogo, numa transação só.
- [ ] Banco (pgTAP, antes da migração): concluir a 2 com a 3 pendente deixa a 2 concluída e a 3 em andamento com início hoje e o responsável; "nenhum" deixa a 3 em andamento sem responsável; com a 3 já resolvida (etapa acrescentada ao catálogo antes dela), inicia a 4; concluir a última não inicia nada e o processo fica concluído; dispensar e realizada anteriormente avançam igual; dispensar sem nota, dispensar etapa obrigatória e responsável Consulta ou inativo recusados sem mudar nenhuma etapa; processo suspenso recusado; Consulta, inativo e visitante recusados; dois eventos de andamento com o mesmo autor.
- [ ] Módulo de processos (falsa e Supabase): concluir, dispensar e realizada anteriormente levam o responsável da próxima numa chamada só; a falsa imita o avanço e as recusas; a tradução das recusas da função para as mensagens da spec tem teste.
- [ ] Janela de avanço em [Concluir]: título com as duas etapas; rádios com os nomes e "Ninguém por enquanto" por último; marcado o responsável que a próxima já tem, senão quem está na tela; botão "Concluir e iniciar {próxima}".
- [ ] Dispensar e Realizada anteriormente: nota e escolha na mesma janela; confirmar desabilitado com a nota vazia; botões "Dispensar e iniciar {próxima}" e "Registrar e iniciar {próxima}".
- [ ] Sem etapa pendente depois: Concluir grava direto; Dispensar e Realizada anteriormente mostram só a nota; o processo aparece como concluído quando cabe.
- [ ] Teclado e leitor de tela: o grupo de rádios tem a pergunta como nome; foco na opção marcada (na nota, quando há); setas trocam; Enter confirma; Esc e [Cancelar] fecham sem gravar e a etapa fica como estava.
- [ ] Falha na gravação: mensagem de erro de gravação, etapas como estavam.
- [ ] Histórico do processo mostra os dois registros do avanço; [Iniciar] continua sem janela; a Consulta não vê a janela.
- [ ] Testes de interface com o aplicativo inteiro cobrindo os itens acima.
- [ ] `supabase/AMBIENTES.md` registra a migração.
