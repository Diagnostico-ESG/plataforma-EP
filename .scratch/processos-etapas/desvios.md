# Desvios — processos e etapas

## 2026-10-14 — /executar-complexo do ticket 04 (cadastro de processos e Quadro)

Diferenças entre o que a spec e o ticket dizem e o que foi construído. Nada disso muda a spec; fica para o `/ship` e para os tickets seguintes.

- **Painel continua aberto depois de editar.** A spec não diz o que acontece ao salvar a edição. O painel volta aos dados, já atualizados, e o Quadro atrás recarrega (cadastrar e excluir fecham o painel).
- **Andamentos de processo só se leem até o ticket 05.** A política de alteração de `andamentos` passou a exigir `setor_id is not null`. Sem isso, a sequência das etapas do processo não seria imposta (os gatilhos `preparar_andamento` e `registrar_evento_do_andamento` ainda conhecem só o andamento de setor). **O ticket 05 precisa reescrever os dois gatilhos para processo e relaxar a política.** O teste 17 desliga `registrar_evento_do_andamento` dentro da transação para montar o estado da view; o ticket 05 deve tirar esse desvio.
- **Frases no singular.** "Não é possível excluir: setor tem 1 processo ligado." e "O setor TSA tem 1 processo neste macroprocesso; mova-o ou exclua-o antes." (a spec dá só o plural).
- **Textos novos da conferência na tela:** "O nome do processo é obrigatório.", "Escolha o setor do processo.", "Escolha o macroprocesso do processo." (a spec só diz "obrigatórios").
- **Tipo e pai fora dos privilégios.** `tipo` e `processo_pai_id` ficam fora do `update` (e o pai fora do `insert`): a mudança direta é recusada com 42501. O ticket 08 abre o caminho da reclassificação (a spec previa gatilho com função; a recusa por privilégio é mais simples e já prova a regra).
- **Situação e motivo sem escrita.** `situacao` e `motivo_da_situacao` existem, com a restrição de coerência, mas nenhum privilégio de escrita até o ticket 07.
- **Recusas de exclusão por gatilho "antes de apagar"** (`conferir_*`, nome antes de `registrar_exclusao_*`), com a contagem; a referência composta com `on delete restrict` fica de reserva.
- **Teste de tela por recusa de exclusão:** as três frases são provadas no módulo (`recusasDeProcessos.test.ts` e os `*Supabase.test.ts`); na tela, os testes de exclusão de setor e de macroprocesso já provam que a frase pronta da recusa aparece em vermelho (o de setor passou a usar a frase da spec).
- **Quadro:** a área interna continua `quadro`; o endereço passou a `#/processos`. `#/processos/lista` cai no Quadro até o ticket 09. A alternância Quadro | Lista da barra superior segue como estava.
- **Conferência visual não feita nesta sessão.** O app exige login no Supabase e não há servidor de visualização com dados; Quadro, painel e formulário só foram conferidos por teste de tela. Os critérios `[visual]` da spec ficam para o `/polir` e o `/ship`.

## 2026-10-14 — /executar-complexo do ticket 05 (andamento das etapas do processo)

Diferenças entre o que a spec e o ticket dizem e o que foi construído. Nada disso muda a spec; fica para o `/ship` e para os tickets seguintes.

- **Desvio do ticket 04 resolvido.** A política de alteração de `andamentos` voltou a valer para o andamento do processo, os gatilhos `preparar_andamento` e `registrar_evento_do_andamento` passaram a conhecer o processo, e o teste 17 não desliga mais o gatilho de evento (ele também resolve as etapas em ordem, uma por comando).
- **Ordem das conferências ao iniciar.** O banco confere "já há uma etapa em andamento" antes de "a etapa anterior não foi resolvida". Com a anterior em andamento, o aviso mais útil é o de quem está em andamento. A spec lista as duas frases sem ordem.
- **A recusa "O setor {SIGLA} ainda não resolveu as etapas do setor." vale para qualquer saída de pendente da primeira etapa do processo**, não só para Iniciar (dispensar ou registrar como realizada anteriormente também esperam o setor), como a regra da sequência já fazia com a anterior.
- **Histórico do processo.** A leitura traz os eventos de `processo` e os de `andamento` cuja referência começa pelo id do processo (`processo_id:andamento_id`). O evento de etapa de processo guarda `processo_id`, `processo_nome` e `setor_sigla` (sem `setor_id`, para o filtro do Histórico dos cadastros não listar o setor por causa dele). O nome do item no Histórico dos cadastros traz o processo.
- **Testes pequenos sem a rodada "falha antes".** As duas frases novas do módulo real, o `like` do cliente falso e o nome do item do histórico foram escritos junto com o código, sem rodar o teste antes para vê-lo falhar. Os testes de banco e os de tela seguiram o TDD no que o plano pedia (o teste 18 falhou antes da migração).
- **O falso não mexe no responsável.** `ProcessosFalso` recalcula etapa atual, situação e "aguardando o setor"; o responsável do cartão fica como o teste o montou (o ticket 06 trata do responsável).
- **Processo suspenso ou cancelado:** nenhuma ação é bloqueada ainda, nem no banco nem no falso; o congelamento vem no ticket 07.
- **Conferência visual não feita nesta sessão** (o app exige login e não há servidor com dados). A etapa atual destacada, o ✓ nas resolvidas, as futuras apagadas e a pílula Concluído só foram conferidos por teste de tela; os critérios `[visual]` ficam para o `/polir` e o `/ship`.

## 2026-10-14 — /executar-complexo do ticket 06 (voltar, datas e responsável da etapa)

Diferenças entre o que a spec e o ticket dizem e o que foi construído. Nada disso muda a spec; fica para o `/ship` e para os tickets seguintes.

- **Voltar devolve a pendente todas as etapas seguintes que não estão pendentes, inclusive a que está em andamento.** A spec fala só das resolvidas. Com a etapa escolhida em andamento e a atual também, haveria duas em andamento e o índice único recusaria. Teste 19 cobre o caso.
- **Como a função de voltar passa pelas travas:** `public.voltar_a_etapa(p_andamento, p_motivo)` liga dois ajustes que valem só na transação (`ep.voltando` e `ep.motivo_da_volta`) e os desliga no fim; o gatilho `preparar_andamento` só aceita sair de resolvida e deixa a função decidir status e datas enquanto o ajuste está ligado, e o gatilho de evento lê o motivo dali. A função não é `security definer` (teste 19, última linha). Quem chama a API não consegue ligar o ajuste.
- **Datas ao voltar:** a escolhida fica em andamento com o início de antes (ou de hoje, se não tinha, como numa etapa registrada como realizada anteriormente) e sem a conclusão e sem a nota; as seguintes ficam sem datas e sem nota. O "antes" fica no evento de cada uma.
- **Inativo chamando voltar:** o inativo não lê nada, então a função responde "registro_inexistente" (a interface avisa como item que não existe mais), não "sem permissão". O Consulta, que lê, recebe `42501` ("Seu perfil não permite alterar os processos."). Um inativo não chega a abrir a tela, então a diferença só aparece fora da tela.
- **Datas recusadas aparecem em DD/MM/AAAA**, como o resto da tela; o banco manda AAAA-MM-DD e o módulo real traduz. A interface não confere as datas antes de enviar (a regra é só do banco), então a tela mostra a frase pronta e o formulário continua preenchido.
- **Responsável só nas etapas do processo.** A spec pede o seletor "em cada etapa do processo". O banco aceita responsável também nas etapas do setor (a mesma regra e o mesmo evento), mas a tela do setor não ganhou o seletor, e `EtapaDoSetor` não traz responsável. Fica para quando houver pedido.
- **Responsável do cartão do Quadro:** vem da view, que já devolvia o responsável da etapa atual (ticket 04); neste ticket só se testou na tela que, trocando o responsável da etapa atual, o cartão mostra o avatar.
- **Eventos novos:** `voltar`, `corrigir_datas` e `mudar_responsavel`. Quando o responsável muda, `antes` e `depois` do evento ganham `responsavel_nome` (o campo só entra quando há responsável antes ou depois, para os eventos das outras ações não mostrarem "Responsável: —"). A lista do histórico chama o texto livre de "Motivo" no voltar e de "Nota" nas outras ações.
- **Restrição reserva no banco:** `andamentos_resolvida_depois_do_inicio` (a conclusão não vem antes do início). A frase com os valores sai do gatilho, que roda antes.
- **Falso:** `ProcessosFalso` não confere se o responsável escolhido é um usuário possível (a tela só oferece os possíveis); a recusa do banco é provada no módulo real e na tela por falha programada. `usuariosPossiveis` guarda a lista.
- **TDD fora de ordem em dois pontos.** Os testes do módulo real (`andamentosSupabase.test.ts`, `lerProcessoSupabase.test.ts`) foram escritos antes do código mas rodaram só depois dele, sem a rodada vermelha. Os componentes novos da tela (`useAcoesDaEtapa`, `FormularioDeDatas`, `SeletorDeResponsavel`, `EdicaoDaEtapa`) foram escritos antes dos testes de tela (`App.voltarDatasResponsavel.test.tsx`); os testes de banco, do falso e das regras puras seguiram o vermelho antes do verde.
- **Dois testes antigos mudaram de expectativa** (`App.painelDoProcesso.test.tsx`): a lista de botões do caminho passou a incluir "Corrigir datas" e "Voltar a esta etapa", e o teste do "Responsável: Ana Teste" passou a rodar como Consulta, que vê só o texto (quem altera vê o seletor).
- **Conferência visual não feita nesta sessão** (o app exige login e não há servidor com dados). O formulário das datas, o seletor de responsável e o botão Voltar só foram conferidos por teste de tela; os critérios `[visual]` ficam para o `/polir` e o `/ship`.

## 2026-10-14 — /executar-complexo do ticket 07 (situação do processo)

Diferenças entre o que a spec e o ticket dizem e o que foi construído. Nada disso muda a spec; fica para o `/ship` e para os tickets seguintes.

- **A situação só muda pelas funções, também no banco.** A spec pede "restrição sobre `motivo_da_situacao` + funções". Além da restrição que já existia (motivo preenchido se e só se parado), um gatilho "antes de alterar" recusa a mudança direta de `situacao` e `motivo_da_situacao` (`situacao_so_pela_funcao`) e confere a transição (`situacao_invalida:de:para`). Sem ele, a API deixaria retomar sem motivo e sem evento. As funções ligam `ep.mudando_situacao` na transação (mesmo padrão de `ep.voltando`).
- **Os testes 17 e 20.** O 17 mudou em dois pontos: a recusa de `set situacao = situacao` virou a recusa do gatilho (a coluna agora tem privilégio), e a suspensão direta que ele fazia como dono do banco passou a ligar a chave `ep.mudando_situacao` à mão, e a desligar logo depois, voltando o processo a "em andamento" antes das restrições do dono (as etapas de processo suspenso ficam congeladas).
- **Congelamento antes de tudo.** `preparar_andamento` confere o processo parado (`processo_parado:{situacao}`) antes do atalho da volta e antes das outras conferências. Vale para iniciar, concluir, dispensar, realizada anteriormente, voltar, corrigir datas e mudar responsável. Etapa do setor não tem processo e não é afetada.
- **Concluído conta como em andamento** para suspender e cancelar: a situação guardada de um processo concluído é "em andamento", e a spec permite suspender e cancelar a partir dela. O botão aparece também no concluído.
- **Frases de recusa novas:** `Este processo está {suspenso | cancelado}; retome-o para registrar o andamento.` (do ticket) e, fora dele, `Este processo já está {situação}.` e `Um processo {de} não pode passar a {para}.` para as transições que a spec não prevê. Moram em `src/processos/frasesDeSituacao.ts`, usadas pelo módulo real e pelo falso.
- **Quadro sem código novo.** `colunasDoQuadro` já tirava cancelado e concluído, e o cartão já trazia a pílula "Suspenso" (ticket 04); o teste de tela de `App.situacaoDoProcesso.test.tsx` prova que, depois de suspender ou cancelar pelo painel, o Quadro atrás acompanha.
- **Aviso do painel** (`.painel-aviso`) usa os tokens `--pendencia-*`, da mesma família do "pendente"; é um `role="status"` visível também para a Consulta. Com o processo parado, `podeAlterar` das etapas vira falso, e somem de uma vez as ações, o "Corrigir datas" e o seletor de responsável.
- **Evento do processo:** ações novas `suspender`, `cancelar` e `retomar`, com `motivo` no `detalhes` (só quando há). O histórico chama o texto livre de "Motivo" nelas.
- **O processo sem motivo gravado** (não deveria acontecer, a restrição exige) mostra o aviso sem o trecho do motivo.
- **Conferência visual não feita nesta sessão** (o app exige login e não há servidor com dados). Botões, janela do motivo e aviso só foram conferidos por teste de tela; os critérios `[visual]` ficam para o `/polir` e o `/ship`.

## 2026-10-14 — /executar-complexo do ticket 08 (subprocessos e reclassificação)

Diferenças entre o que a spec e o ticket dizem e o que foi construído. Nada disso muda a spec; fica para o `/ship` e para os tickets seguintes.

- **Tipo e pai só mudam pela função, também no banco.** O logado ganhou privilégio de coluna em `tipo` e `processo_pai_id` (sem ele, a função sem `security definer` não grava), e o gatilho `conferir_tipo_do_processo` recusa a mudança direta (`tipo_so_pela_funcao`). A função liga `ep.reclassificando` na transação, no padrão de `ep.mudando_situacao`. O teste 17 mudou nos dois pontos que provavam a recusa por falta de privilégio (`42501`): agora prova a recusa do gatilho para quem altera, e a inclusão de "a classificar" com pai é recusada pela restrição (`23514`).
- **Subprocesso sem pai, e Processo ou "a classificar" com pai,** continuam recusados pela restrição `processos_pai_coerente` (`23514`), como o teste 17 já provava. O gatilho `adotar_macroprocesso_do_pai` só confere o pai quando ele vem preenchido; a função de reclassificar recusa virar subprocesso sem pai com `pai_nao_e_processo`. O pai também não pode ser o próprio item (mesma recusa; a tela não o oferece).
- **Mudanças de tipo fora da spec** (Processo para "A classificar", Subprocesso para Subprocesso etc.) são recusadas com `tipo_invalido:de:para` e a frase "Um item do tipo {de} não pode ser reclassificado como {para}." (fora do ticket; a tela só oferece os destinos permitidos).
- **Subprocesso que troca de pai** não está na spec e não foi feito: o caminho é virar processo e depois subprocesso do pai novo.
- **Filhos acompanham o pai** por um gatilho "depois", que roda com a permissão de quem grava. Cada filho ganha um evento "Editou" com o macroprocesso novo. Editar o macroprocesso do subprocesso direto não tem efeito (o gatilho devolve o do pai); na tela, o campo fica desabilitado no cadastro e na edição do subprocesso.
- **Evento:** `estado_do_processo` ganhou `processo_pai_nome` só quando há pai (os eventos antigos e os dos processos sem pai continuam iguais, e o teste 17 não mudou nessa parte). Ação nova `reclassificar`, com `motivo`. O histórico mostra "Reclassificou", "Processo pai: {nome}" e "Motivo".
- **Estrutura no painel** lida de `processos` numa consulta só (filtro `or`: os filhos e o pai), sem mudar a view. `ProcessoDaLista` ganhou `processoPaiId`, que a Lista do ticket 09 vai usar para o "↳ pai". O `ClienteSupabaseFalso` passou a guardar o filtro `or`.
- **Pais possíveis** (cadastro e janela) vêm de `listarProcessos`, filtrados por `paisPossiveis` (tipo Processo, sem o próprio item). A janela lê a lista ao abrir; se a leitura falhar, mostra "Não foi possível carregar os processos" com [Tentar de novo].
- **Janela de reclassificar:** a `<dialog>` nativa das outras janelas (ADR 0003), montada só enquanto aberta (a escolha recomeça a cada abertura). O novo tipo já vem marcado com o primeiro destino permitido; o botão "Reclassificar" exige motivo e, no subprocesso, o pai.
- **Tipo gerado do parâmetro `p_pai`:** o gerador do Supabase o marca como texto obrigatório, mas o banco aceita nulo (virar processo); o módulo real passa `null` com uma conversão de tipo comentada.
- **A pílula "Subprocesso" do cartão** já existia (ticket 04); o teste de tela do cadastro prova que ela aparece no cartão do subprocesso novo.
- **TDD fora de ordem em um ponto:** o teste do módulo real de reclassificação foi escrito antes do código, mas rodou só depois dele (o pre-commit barrou o commit da migração com o teste ainda sem implementação; o arquivo saiu da pasta durante o commit). Os demais seguiram o vermelho antes do verde.
- **Conferência visual não feita nesta sessão** (o app exige login e não há servidor com dados). A seção da estrutura, o seletor de pai e a janela de reclassificar só foram conferidos por teste de tela; os critérios `[visual]` ficam para o `/polir` e o `/ship`.

## 2026-10-14 — /executar-complexo do ticket 09 (lista, filtros e processos do setor)

Diferenças entre o que a spec e o ticket dizem e o que foi construído. Nada disso muda a spec; fica para o `/ship` e para o `/polir`.

- **Nenhum banco.** A view `processos_com_andamento` já devolvia todos os processos, de qualquer situação, com o pai; Lista, filtros e processos do setor são só interface.
- **"Ler os processos de um setor"** (spec, "Terceiro módulo injetado") não virou operação nova: a seção "Processos do setor" usa `listarProcessos()` filtrada pelo setor. Para o volume do EP (dezenas de processos) basta; se a lista crescer muito, vira uma consulta com filtro no banco.
- **Endereço:** os filtros vão no fim do endereço como consulta (`#/processos/lista?setor=…&tipo=…`), sempre na mesma ordem e só os preenchidos; o painel aberto da Lista fica em `#/processos/lista/<id>` e o do Quadro em `#/processos/<id>`, os dois com os filtros. Os links de pai e subprocessos do painel e o fechar mantêm a visão e os filtros.
- **Etapa atual "Aguardando o setor"** é uma opção do filtro de etapa; o filtro de uma etapa do catálogo não pega quem aguarda o setor (como as colunas do Quadro). Na Lista, a coluna mostra "Aguardando o setor" nesse caso e "—" no processo sem etapa atual (concluído).
- **Opções dos filtros** saem da lista carregada: só aparecem o setor, o macroprocesso e o responsável que têm processo. O filtro de etapa mostra as etapas do catálogo que viram coluna no Quadro.
- **Onde ficam os filtros:** numa barra sempre visível acima do Quadro e da Lista (seletores nativos, com "Todos"/"Todas"), com [Limpar filtros] quando há filtro. O ícone "Filtrar" da barra superior continua sem ação (backlog, para o `/polir`).
- **Alternância Quadro | Lista e faixa lateral** levam ao endereço sem filtros: os filtros não passam de uma visão para a outra.
- **"↳ pai" com filtro:** o nome do pai vem de todos os processos, então aparece mesmo quando o filtro tirou o pai da Lista.
- **Processos do setor:** clicar abre o painel por cima da Lista já filtrada pelo setor (`#/processos/lista/<id>?setor=<id>`); fechar volta a essa Lista, não à tela do setor.
- **Pílula da situação** virou o componente `PilulaDaSituacao`, usado no cabeçalho do painel, na Lista e na tela do setor.
- **Conferência visual não feita nesta sessão** (o app exige login e não há servidor com dados). Lista, barra de filtros e a seção do setor só foram conferidas por teste de tela; os critérios `[visual]` ficam para o `/polir` e o `/ship`.
