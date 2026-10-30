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
- **Teste instável corrigido depois da integração:** "Quadro: … o fechar mantêm os filtros" falhou em cerca de 2 de 5 rodadas da bateria inteira na `main`. Causa: o painel troca o botão de fechar do "Carregando processo…" pelo do cabeçalho, e o teste às vezes clicava no que já tinha saído da tela. Os dois testes novos que fecham o painel passaram a esperar o título do processo antes de clicar; 4 rodadas seguidas verdes depois.

## 2026-10-14 — /executar-complexo do ticket 10 (catálogo de etapas na Administração)

Diferenças entre o que a spec e o ticket dizem e o que foi construído. Nada disso muda a spec; fica para o `/ship` e para o `/polir`.

- **Frases que a spec não trazia:** "O nome da etapa é obrigatório."; "O código deve ter de 2 a 40 caracteres: letras minúsculas sem acento, números e sublinhado. Recebido: "{valor}"."; "Já existe uma etapa com o nome {nome}."; "Já existe uma etapa com o código {código}.". As duas últimas vêm do módulo, não do formulário.
- **Exclusão direta de andamento:** nos testes 15 e 17, apagar um andamento fora do catálogo deixou de dar `42501` e passou a "nada apagado" (a RLS filtra sem acusar erro). Os testes agora conferem que a linha continua lá.
- **Etapa usada não se exclui:** a recusa passou de `23503` (referência) a `etapa_usada:{nome}`, levantada pelo gatilho "antes de apagar". A tela mostra "A etapa {nome} já foi usada; desative-a em vez de excluir."
- **Evento de ordem:** subir ou descer gera evento só para a etapa movida (não para a vizinha); o espaço aberto por uma etapa nova não gera nenhum.
- **Histórico:** os eventos do catálogo aparecem no Histórico dos cadastros (área Setores), com o item do filtro "{código} — {nome}", visíveis a todo perfil ativo.
- **Evento por gatilho `security definer`**, como todos os eventos do projeto. Criar e reordenar passam pelas funções `acrescentar_etapa` e `mover_etapa`.
- **Abas da Administração:** estado local, sem endereço (recarregar a página volta a "Usuários"). Esconder a aba é conveniência; quem protege é a RLS.
- **Posição da etapa nova:** seletor com "Antes de {nome}" para cada etapa, inclusive as inativas, e "No fim" como padrão.
- **Conferência visual não feita nesta sessão** (o app exige login e não há servidor com dados). As abas, a tabela do catálogo e os formulários só foram conferidos por teste de tela; os critérios `[visual]` ficam para o `/polir` e o `/ship`.
- **Resultado do "Testes de banco" na branch não lido por mim:** o `gh` não existe nesta máquina; a rodada depois do ajuste do teste 15 (commit 5cd437a) precisa ser conferida no GitHub.

## 2026-10-14 — /polir dos tickets 07 a 10 (situação, subprocessos e reclassificação, lista e filtros, catálogo)

Auditoria feita só no código (detector do Impeccable em `src/`, CSS e componentes novos); o app exige login Google e não há servidor com dados, então **nenhuma conferência visual foi feita**. Detector: nenhum achado.

- **Corrigido (P1, acessibilidade): contraste das etapas futuras no painel.** `.etapa-pendente` tinha `opacity: 0.75` sobre o texto secundário: 3,4:1, abaixo dos 4,5:1 da WCAG AA. Tirei a opacidade; o texto fica a 5,8:1 e a etapa futura se distingue da resolvida pela falta do ✓. Sem teste de regressão: o jsdom não calcula contraste e um teste que lesse o CSS seria frágil.
- **Deixado de fora (P2): abas incompletas no padrão ARIA.** Painel do processo e Administração usam `role="tab"` sem `aria-controls`, sem `aria-labelledby` no painel da aba, sem setas do teclado e sem foco por aba; na Administração nem há `tabpanel`. Todas as abas continuam acessíveis por Tab e Enter. Motivo: o conserto certo é um componente de abas único, que é refatoração com testes, não polimento. Foi para o backlog.
- **Deixado de fora (P3): foco ao abrir o painel.** O Quadro fica `inert` e o foco volta ao cartão ao fechar, mas ao abrir o foco não vai para dentro do painel. Sem conferir no leitor de tela, não sei se atrapalha; registrado no backlog.
- **Já registrado, não tratado aqui:** ícone "Filtrar" da barra superior sem ação (backlog, ticket 09). Decisão minha pendente.
- **Pontos bons:** tokens de cor e espaço usados em todo o CSS novo, sem cor solta; `prefers-reduced-motion` respeitado; contorno de foco global; `inert` no Quadro atrás do painel; janelas nativas `<dialog>` com foco no primeiro campo; tabelas com `th scope`.

## 2026-10-14 — /ship de processos-etapas

Revisão do diff inteiro desde `marco/2026-10-13-inicio-processos-etapas` (por amostragem; revisões de padrões e de spec) e revisão de segurança de reserva (o `/security-review` embutido não achou mudanças, por a branch ser a `main`). Os achados foram aceitos como ressalva e vão ao backlog para uma `/demanda`; nada foi corrigido neste `/ship`.

- **Padrões, sem violação grave.** Juízo: `RespostaDaGravacao` e `conferirGravacao` copiadas em `catalogoSupabase.ts`, `gravarProcessoSupabase.ts` e `responsaveisSupabase.ts` (regra de extrair na repetição); o `useEffect` de `showModal` repetido em `JanelaComCampo` e `JanelaDeConfirmacao`; `formatarData` e `ROTULO_DO_STATUS` em `processos/` usados por `cadastros/`; motivos de recusa em dois lugares de `andamentosSupabase.ts` (regex e mapa); `ProcessosFalso.ts` com 284 linhas.
- **Spec, nenhum requisito grande ausente.** (1) O banco não amarra data e nota ao status: dá para gravar data em etapa pendente e nota fora de dispensada ou realizada anteriormente. (2) Desativar etapa obrigatória pendente apaga o andamento dela e pode fazer processos virarem "Concluído" sozinhos, sem evento no processo; a spec não trata. (3) As datas automáticas usam `current_date` do servidor (UTC), que pode diferir do dia local perto da meia-noite. (4) Reclassificar um processo suspenso ou cancelado é permitido; a spec não proíbe.
- **Segurança (revisão de reserva, estática):** nenhum achado com confiança acima de 8. Ressalva: conferir no painel do Supabase de desenvolvimento que a API publica só `public` e `graphql_public` (só o `config.toml` local foi lido).
- **Banco:** sem migração destrutiva, sem chave secreta, view com `security_invoker`, `security definer` só em `private` com `search_path` vazio, tipos em dia. "Testes de banco" #54 na `main` (commit `dd32b58`) verde, com o teste 22.
- **Critérios `[visual]` da spec em presumido:** o usuário não pôde olhar a tela no `/ship`, e o app exige login sem servidor com dados.

## 2026-10-18 — /executar-complexo do ticket 11 (responsáveis do setor saem)

- **Registros antigos de responsável fora do filtro do histórico.** Aparecem com ação, data e autor, e o item é "Registro de responsável do setor (recurso retirado da plataforma)", sem as linhas de antes e depois (que traziam nome, e-mail e cargo). Saíram da lista do filtro "Item", porque todos teriam o mesmo nome; escolhido um setor no filtro, o evento continua aparecendo, porque a referência dele cita o setor. Mesmo tratamento dos registros antigos de reunião (reunioes, ticket 05). O texto dos recursos retirados virou um mapa por entidade, para o ticket 12 acrescentar a etapa do setor.
- **Evento de exclusão do setor sem a chave `responsaveis`.** A função volta a ser a de `setores_envolvidos`. Os eventos antigos que têm a chave continuam mostrando "Responsáveis: …"; o rótulo fica no código para eles. Os testes 11 e 13 perderam a chave na expectativa.
- **Ensaio da migração** dentro de uma cópia temporária do teste 33 (#102), apagada antes de aplicar, como no ticket 05 de reunioes.
- **Tipos regenerados na tarefa da tela**, não no commit da migração: com os tipos novos, o acesso Supabase dos responsáveis não compilava e o pre-commit barraria. Mesmo desvio do ticket 05 de reunioes.
- **A classe `acoes-do-responsavel` ficou no CSS:** a tabela do catálogo da Administração também a usa. O plano mandava apagá-la; a busca final achou o uso.
- **O `git mv` do teste de tela** (`App.reunioesRetiradas` → `App.recursosRetirados`) entrou no commit da migração (`3a30d45`), por ter sido preparado antes dele; o conteúdo novo do arquivo veio no commit seguinte.
- **Critérios de tela conferidos só por teste:** a tela não foi aberta (o app exige login e não há servidor com dados).

## 2026-10-18 — /executar-complexo do ticket 12 (sem etapas do setor; Modelagem piloto)

- **Gatilhos desligados com `session_replication_role = replica`** só no trecho da migração que apaga os andamentos de setor e as etapas de nível setor, renumera e renomeia: nenhum evento de catálogo nasceu. O `set local` vale porque o script aplica a migração numa transação.
- **Renumeração por `row_number()`** na ordem atual, e não por "ordem − 3", para valer mesmo com o catálogo do desenvolvimento mexido pela tela.
- **`andamentos.processo_id` passou a obrigatório**, e a restrição `andamentos_um_dono` saiu antes de apagar `setor_id`. O teste 17 trocou a asserção "andamento de setor e de processo ao mesmo tempo" por "andamento sem processo é recusado" (23502).
- **A view saiu e voltou** (`drop view` e `create view`), porque `create or replace view` não tira coluna.
- **`conferir_processo_em_andamento` ficou com o `if processo is null then return`**, hoje inofensivo; mexer nela seria ruído.
- **Registros antigos de etapa do setor no histórico:** o andamento sem `processo_id` no estado aparece como "Registro de etapa do setor (recurso retirado da plataforma)", sem antes, depois e nota, e continua no filtro do setor pela referência. `ehRecursoRetirado(entidade)` virou `ehRegistroRetirado(evento)`, e a conferência foi para `nomeDoItemComDono`, porque `nomeDoItem` passava do limite de complexidade.
- **O rótulo "Nível" e os valores "Setor"/"Processo" ficaram no histórico** só para os eventos antigos do catálogo; o teste que já existia em `historicoDoCatalogo.test.ts` prova isso, então não ganhou teste novo.
- **O caso "processo novo direto na coluna Modelagem piloto"** já estava coberto em `App.cadastrarProcesso.test.tsx` ("o cartão aparece na coluna da etapa atual"); o plano previa um teste novo no Quadro, e ele não foi escrito para não repetir.
- **O tipo `EtapaDoSetor` virou `EtapaDoCaminho`** (é a base de `EtapaDoProcesso`), e `etapasDoSetorSupabase.ts` virou `andamentoDoBanco.ts`. Os sinalizadores `falharLeitura` e `segurarLeitura` do `ProcessosFalso` saíram, porque só a leitura das etapas do setor os usava.
- **A rota `#/setores/<id>` ficou** sem o link "Ver no setor": ela serve a endereço guardado ou compartilhado e é barata.
- **Catálogo de teste da Administração refeito** sem a etapa do setor: Modelagem piloto, Relatório e modelagem técnica, Publicação e Arquivamento (desativada). O teste "a recusa ao mover aparece em vermelho" passou a usar uma recusa pronta (`TravaDoBanco`), porque a ordem entre níveis não existe mais.
- **No `CatalogoFalso`, entre as tarefas 5 e 6,** a etapa de nível setor ficou sem efeito nos processos, até o nível sair de vez na tarefa 6.
- **Ensaio da migração** dentro de cópias dos testes 34, 19 e 22. A primeira montagem (#106) perdeu os delimitadores `$$`, porque o `String.replace` do Node trata `$$` como `$` no texto de troca (tropeço já registrado antes em `melhorias-protocolo.md`, no teste 23); refeita com função de troca (#107). O 22b falhou 1 de 46 por um erro do próprio teste 22 (a chamada do visitante ainda passava o nível), corrigido antes de aplicar.
- **Tipos regenerados na tarefa 6**, não no commit da migração: com os tipos novos, `catalogoSupabase.ts` (o `p_nivel`) não compilava antes. Mesmo desvio dos tickets 05 e 11.
- **Critérios de tela conferidos só por teste:** a tela não foi aberta (o app exige login e não há servidor com dados).

## 2026-10-18 — /polir da parte 1 (Simplificação; tickets 11 e 12, com o 05 de reunioes)

Auditoria do impeccable: 16/20 (Bom), detector sem achados em `src`. Conferido só pelo código e pelos testes: a tela não foi aberta (o app exige login).

- **Corrigido (P2):** os campos de data do painel (o da reunião e o das datas da etapa) ficavam com a borda e a altura padrão do navegador, desalinhados dos botões de 32px. Ganharam, no `Painel.css`, o mesmo desenho dos outros campos.
- **Corrigido (P3):** a regra `.painel-caminho-titulo`, que sobrou do título "Etapas do setor", foi apagada.
- **Deixado de fora (P3):** o nome antigo "Reunião de modelagem" nos dados inventados de uns 27 arquivos de teste. Não aparece na tela, e trocar seria só mexida sem efeito no comportamento.
- **Deixado de fora (P3):** "Salvando…" no botão enquanto a data grava. Nenhuma tela do projeto usa esse padrão; o botão desligado é o padrão dos vizinhos.
- **Deixado de fora:** datas em fonte mono, como pede a regra do DESIGN.md. Nenhum componente usa a classe `.mono` hoje; é ajuste do projeto todo, não desta parte (vai para o backlog).

## 2026-10-18 — /ship da parte 1 (Simplificação; tickets 11 e 12, com o 05 de reunioes)

- **A revisão de código invalidou o critério "nenhum código morto ligado a eles" do ticket 11:** os rótulos `email` e `cargo` do histórico (`historicoDosCadastros.ts`) só serviam aos eventos de responsável do setor, que agora aparecem na linha simples. Retirados no commit `f10e015`, sem teste novo (não havia comportamento a provar); a suíte inteira passou.
- **Spec divergente do construído, corrigida na spec:** a linha da reunião fica no lugar da antiga seção Reuniões, antes das Versões (a spec dizia "logo acima do caminho"; a de reunioes já dizia o lugar certo), por decisão do usuário, porque a parte 3 redesenha o painel; e saíram três migrações, uma por ticket, em vez de "uma migração nova, numa transação só".
- **Pontos de julgamento da revisão de padrões** (tipos de etapa duplicados, `andamentoDoBanco.ts` com um só usuário, nome de classe CSS, campo `nota` na falsa, texto repetido, dado de teste antigo) foram para o backlog, por decisão do usuário.
- **Migrações destrutivas confirmadas pelo usuário:** `20261018132857_responsaveis_do_setor_saem` (apaga `responsaveis_do_setor`) e `20261018141346_sem_etapas_do_setor` (apaga os andamentos de etapa do setor, `andamentos.setor_id` e `etapas.nivel`). A produção não existe; só dados inventados do desenvolvimento (ADR 0013).
- **Revisão de segurança:** o `/security-review` viu só o último commit (trabalho direto na `main`); feita a revisão de reserva sobre o diff inteiro da parte 1, sem achados.
- **Tela conferida pela vitrine local** (app com módulos falsos, fora do git), não com login no desenvolvimento.

## 2026-10-18 — /executar-complexo do ticket 13 (Resolver a etapa já inicia a próxima)

- **Função de avanço com a ação em texto** (`concluir`, `dispensar`, `realizada_anteriormente`), e não com um `status_da_etapa`, para o valor `em_andamento` não virar um "iniciar" disfarçado; outra ação é recusada com `acao_invalida`. Decisão do plano, registrada aqui.
- **A transição é conferida dentro da função** (`private.resolver_etapa_do_avanco` chama `conferir_transicao`): o gatilho de andamento só confere quando o status muda, e resolver de novo uma etapa já concluída deixaria passar e ainda iniciaria a seguinte.
- **Recusa nova `nota_obrigatoria`** ("A nota é obrigatória."): a de `motivo_obrigatorio` fala em motivo, e aqui é nota.
- **Migração e tipos em commits seguintes**, não no mesmo: a migração precisa estar no GitHub antes de o workflow a aplicar (mesmo desvio dos tickets 05, 11 e 12). O teste vermelho foi o #110 e o verde o #111; o `AMBIENTES.md` conta 31 arquivos de teste, não os "35" que o plano dizia (a numeração dos arquivos tem lacunas).
- **Sem ensaio da migração em cópia de teste**, como o plano decidiu: só cria funções, numa transação.
- **Onde ficaram as coisas, diferente do plano:** o hook `useAcoesDaEtapa` foi para `src/hooks/` (limite de 40 linhas por função; em `components` o limite é 20); `gravarPedidos.ts` virou `src/processos/gravarAcoes.ts`; as recusas do avanço (tradução e módulo) estão em `processosSupabase.test.ts`, onde já viviam os testes das ações, e não em `andamentosSupabase.test.ts`; a janela do avanço ganhou o componente `JanelaDoAvancoDaEtapa` dentro de `CaminhoDeEtapas.tsx` para baixar a complexidade (o ESLint barrou em 12).
- **`ProcessosFalso`:** o avanço atualiza também o responsável do cartão (o da nova etapa atual), porque a view do banco faz o mesmo; as demais operações da falsa continuam sem isso.
- **Esc dentro da janela de avanço também fecha o painel do processo** (visto no navegador: o endereço voltou a `#/processos`). Nada é gravado e a etapa fica como estava, como a spec pede, mas o painel some junto. Pela leitura do código, vale também para a janela da nota e do motivo: o painel fecha com Esc e as janelas ficam dentro dele. Não corrigido (fora do escopo); foi para o backlog.
- **Tela conferida no navegador do app pela vitrine local** (módulos falsos, fora do git), não com login e banco: janela do Concluir modal, foco na opção marcada, setas trocando de opção, Enter confirmando (etapa concluída e a próxima em andamento com a pessoa escolhida), janela com nota (foco no campo, botão desabilitado com a nota vazia) e Esc. **Presumido, não visto:** leitor de tela de verdade (só o nome do grupo pelo `aria-labelledby`, lido no DOM), o aspecto visual das opções (nenhuma captura de tela saiu a tempo) e o caso da Consulta (só por teste).
- **Disparo dos workflows pelo navegador do app:** o seletor de branch do painel "Run workflow" não fixava a escolha no painel estreito; o formulário do botão (`/actions/manual`, com o campo `branch`) foi enviado direto pela página, o que equivale ao clique. Para o `/ship`: o mesmo caminho serve.

## 2026-10-18 — /executar-complexo do ticket 14 (Assumir, trava do autor e voltar com responsável)

- **Uma trava só, no gatilho:** `private.conferir_autor_da_revisao_interna` (antes de alterar `responsavel_id` em `andamentos`) vale para o seletor, o [Assumir], o avanço e o voltar sem repetir a regra em cada função. A etapa é a de código `revisao_interna` e "a versão mais recente não histórica" é a de maior número com `historica = false`. A recusa é `autor_da_versao:<número>:<nome>` (número primeiro, para o nome poder ter dois-pontos).
- **`reabrir_etapa` confere o responsável (ativo, Administrador ou Integrante):** o gatilho de andamento pula as conferências na volta (`private.voltando()`), então, sem essa chamada, voltar aceitaria um inativo ou a Consulta. `voltar_a_etapa` e `private.reabrir_etapa` foram apagadas e recriadas com a assinatura nova, com os mesmos privilégios. As etapas seguintes que voltam a pendente continuam com o responsável que tinham (a função não mexe nelas).
- **Testes antigos de voltar (19 e 20) passam `null` como terceiro argumento:** nenhuma asserção dependia de o responsável ficar na etapa reaberta, então só as chamadas mudaram (10 chamadas, não as 11 que o plano contou: uma delas era o texto de `prosecdef`).
- **Teste 36 falhou duas vezes antes de passar, a primeira por erro do próprio teste:** o auxiliar `enviar` passava o número 1 a `registrar_versao`, que recusa número diferente do próximo (`numero_da_versao_mudou`). O auxiliar passou a calcular o próximo (#113 por esse erro, #114 por função inexistente, #115 verde: 33 de 33 e 32 arquivos verdes).
- **Dado novo no processo lido:** `ProcessoLido.ultimaVersao` (número, id e nome do autor), obrigatório; lido em `lerProcessoSupabase` junto das etapas e da estrutura, numa leitura a mais de `versoes`. 19 arquivos de teste ganharam `ultimaVersao: null` no fixture. O cliente Supabase falso dos testes ganhou `limit` (e `ordenar` saiu do método `from`, para ele caber no limite de 20 linhas).
- **Janela de voltar é a `JanelaDeAvanco`:** `PedidoDeAvanco.acao` ganhou `'voltar'` (com `proxima` = a própria etapa reaberta, para o `responsavelMarcado` servir sem mudança) e `PedidoDeTexto` ficou só com dispensar e realizada. A janela ganhou as props `rotuloDoCampo` e `pergunta`, agora obrigatórias, e a `EscolhaDoResponsavel` recebe a pergunta.
- **Falsa de processos:** `mudarResponsavelDaEtapa` e `voltarParaEtapa` também imitam a trava (mesma frase do banco); o responsável do cartão e da etapa passaram para `porResponsavel`, usado pelas duas.
- **Testes antigos de tela ajustados ao [Assumir]:** três testes que listavam os botões da linha da etapa (`App.andamentoDoProcesso`, `App.painelDoProcesso`, `App.voltarDatasResponsavel`) ganharam o `Assumir` esperado nas etapas pendentes ou em andamento sem responsável.
- **Migração e tipos em commits seguintes, e o teste 36 em dois commits:** o teste vermelho foi o #113 (erro do teste) e #114 (motivo certo); a migração entrou no commit seguinte ao do teste e os tipos no seguinte ao da migração (mesmo desvio dos tickets 05 e 11 a 13).
- **Sem ensaio da migração em cópia de teste**, como o plano decidiu: uma transação só.
- **Tela conferida no navegador do app pela vitrine local** (módulos falsos, fora do git; servidor do Vite na porta 5175, encerrado), não com login e banco. **Visto:** [Assumir] na linha, ao lado do seletor, e um clique grava o responsável e some o botão; janela de avanço da Relatório para a Revisão interna sem o autor da versão (a Ana) e com quem está na tela marcado e o foco nele; janela de voltar com "Motivo", "Quem fica com esta etapa?", o responsável atual marcado, o botão desabilitado com o motivo vazio, Cancelar fechando sem gravar, e a confirmação gravando o responsável (Bia) e deixando a etapa em andamento com ela. **Presumido, não visto:** Esc e setas na janela de voltar (é o mesmo componente da janela de avanço, conferido no ticket 13), leitor de tela de verdade e o caso da Consulta (só por teste). A vitrine tinha os mesmos ids de etapa em todos os processos, o que fez a falsa achar a etapa errada num primeiro teste; corrigido na vitrine (fora do git), não no código.

## 2026-10-18 — /polir do ticket 14 (Assumir, trava do autor e voltar com responsável)

Auditoria (`/impeccable audit`) da parte da tela que o ticket mexeu: o botão [Assumir], a janela de voltar (a `JanelaDeAvanco` com motivo e escolha) e a escolha do responsável. O detector automático não achou nada nos seis arquivos; o resto foi leitura do código e da vitrine local (módulos falsos, fora do git).

- **Corrigido (P2, acessibilidade):** a linha de cada opção de responsável ("Ana Teste", "Ninguém por enquanto") tinha ~21px de altura e é o alvo do clique, abaixo dos 24px que a WCAG 2.2 (critério 2.5.8) pede. Agora tem 28px no mínimo, com cursor de mão. `src/components/JanelaDeConfirmacao.css`.
- **Corrigido (P3, superfície do navegador):** o botão de rádio nativo usava o azul do navegador; passou a usar `--azul` do sistema (`accent-color`), como o resto da interface.
- **Verificado e sem problema:** foco visível global (`:focus-visible`); nome acessível do [Assumir] ("Assumir <etapa>") contém o texto visível (critério 2.5.3); grupo de rádios nomeado pela pergunta; janela com título ligado por `aria-labelledby`; só tokens de cor e espaço, nenhum valor solto; botões de 32px.
- **Deixado de fora, com o motivo:**
  - **Vários [Assumir] empilhados no painel** (um por etapa pendente sem responsável): é o que a spec pede (história 101) e o painel é de uso diário em desktop; reavaliar na parte 3 (Verso do cartão), que redesenha esse painel.
  - **Esc dentro da janela também fecha o painel do processo:** já registrado no ticket 13; é do painel, não desta funcionalidade, e vale para todas as janelas dele.
  - **Layout de celular da janela de voltar:** a plataforma é de uso em computador (layout de celular é opcional no `PRODUCT.md`); nada foi conferido em largura de celular.

## 2026-10-19 — /ship da parte 2 de processos-etapas (tickets 13 e 14, Etapas mais rápidas)

Ponto de partida da revisão: `marco/2026-10-18-inicio-etapas-mais-rapidas` (23 commits, 66 arquivos).

- **Revisão de código (`/mattpocock-skills:code-review`), eixo Spec:** a implementação bate com a spec e os tickets. Achados: (1) a frase "A nota é obrigatória." (`nota_obrigatoria`) não estava na lista de mensagens de recusa da spec: **corrigido na spec**; (2) a janela de avanço sem a lista de usuários oferece só "Ninguém por enquanto", estado que a spec não descrevia: **corrigido na spec**; (3) o teste de banco do avanço cobre o processo suspenso, e o cancelado passa pelo mesmo gatilho (já testado no teste 20): lacuna de cobertura sem efeito no comportamento, deixada como está; (4) `conferir_responsavel` na volta só confere quando o responsável muda (um responsável que ficou inativo e continua na etapa volta com ela): é o que a história 40 e a regra "só no momento da escolha" pedem, sem mudança.
- **Revisão de código, eixo Padrões:** nenhuma violação dura (limites de linhas, de complexidade, `any`, `security definer`, `search_path`, RLS). Pontos de julgamento (nomes iguais para dois tipos `PedidoDeAvanco` em `gravarAcoes.ts` e `andamentoFalso.ts`, casts `as` na falsa e no módulo Supabase com comentário, texto das janelas repetido entre `JANELA_DO_TEXTO` e `JANELA_DO_AVANCO`, `andamentoFalso.ts` com vários assuntos, `(usuarioId, ultimaVersao)` viajando junto) foram para o backlog, como na parte 1. A observação sobre `drop function public.voltar_a_etapa(uuid, text)` não vale: a produção ainda não existe, e a função foi recriada na mesma migração.
- **Banco (passo 7):** vínculo e `project-ref` no desenvolvimento (`yclkzyoebpsxmgpbcbus`); `db push` não cabe (porta 5432 fechada na rede), as duas migrações foram aplicadas pelo workflow "Migrar banco de desenvolvimento" (#25 e #26) e o "Testes de banco" passou na `main` (#116, 32 arquivos); tipos em dia (`db:types` sem diferença); nenhuma chave secreta em `src/`, `.env.example` ou `supabase/functions/`; nenhuma view nova nem `security definer` novo. Migrações **destrutivas** pela busca: nenhuma apaga tabela, coluna ou dado; a `20261019020700` apaga e recria duas funções (`public.voltar_a_etapa` e `private.reabrir_etapa`), sem efeito em dados. `enable_signup = true` em `[auth]` do `config.toml` é a decisão do ADR 0001 (login pelo Google, quem barra é o banco), inalterada nesta parte; `[auth.email]` está desligado.
- **Cobertura:** 98,7% das instruções (piso 70%). Sem dependência circular. `package.json` não mudou desde a última entrega: `security-auditor` pulado (o `.scratch/security.md` existe).
- **Spec atualizada** com as duas correções acima.

- **Revisão de segurança do código (passo 4):** o `/security-review` embutido veio sem diff (a `main` já tem tudo integrado), então valeu a revisão de reserva, por pasta, desde `marco/2026-10-18-inicio-etapas-mais-rapidas`, sobre as duas migrações, as funções novas, os `grant`s de `andamentos` e o código da tela. **Nenhum achado**: as funções não usam `security definer`, a trava é um gatilho que não depende de `ep.voltando`, o `insert` em `andamentos` não inclui `responsavel_id`, e a recusa do autor só mostra o que quem a recebe já lê pela RLS.
- **Cadastro aberto no desenvolvimento (passo 7, Perfis):** o usuário confirmou que o provedor Email do Supabase de desenvolvimento seguia ligado desde a prova do Drive (16/10). A regra do projeto é cadastro aberto desligado; ele foi **desligado pelo usuário em 2026-10-19** antes da marca de entrega. O `config.toml` mantém `enable_signup = true` em `[auth]` por decisão do ADR 0001 (login pelo Google; o banco barra). **Ainda aberto, sem bloqueio:** os usuários inventados `prova.integrante` e `prova.consulta` seguem ativos; sem o provedor Email eles não entram, mas convém desativá-los pela Administração (backlog).
- **Custo:** o usuário não informou o `/cost`; as três linhas desta funcionalidade ficaram "não informado". Soma das linhas de processos-etapas com valor: US$ 128,52 (15 linhas); as de antes da coluna de funcionalidade ficam fora, e as com "não informado" (parte 1 e parte 2) também.

## 2026-10-19 — /executar-complexo do ticket 16 (a janela do verso do cartão)

- **Cor do macroprocesso saída do id:** o banco não guarda cor de macroprocesso e o ticket não muda o banco. O quadradinho do cabeçalho usa uma das seis cores de macroprocesso dos tokens, escolhida pela soma dos caracteres do id (`src/processos/corDoMacroprocesso.ts`): sempre a mesma para o mesmo macroprocesso, mas sem escolha do usuário. Escolher a cor de cada um seria uma coluna nova, num ticket próprio.
- **"Fechar a janela", não "Fechar o processo":** o nome do botão de fechar soaria como encerrar o processo.
- **"Cancelar processo" no "⋯", não "Cancelar":** sozinho, o item se confunde com o Cancelar que fecha as janelas. Suspender e Retomar ficam como na spec.
- **Pílula de Cancelado em cinza no cabeçalho do verso** (a spec pede cinza); na Lista e na tela do setor ela continua vermelha (`PilulaDaSituacao`), como antes. As duas cores convivem até alguém decidir uniformizar.
- **Sem o esmaecido do Quadro por baixo:** o fundo da janela (`::backdrop`) já escurece a visão; somar os dois escurecia demais. A visão continua inerte.
- **O Novo processo entrou junto com o verso (Tarefas 5 e 6 num commit):** o painel do novo processo usava o botão de fechar do cabeçalho apagado. O Novo processo já abre na janela estreita, com o formulário de sempre; o rodapé fixo e abrir o verso do criado são do ticket 19.
- **Histórico e Editar trocam o conteúdo da janela já neste ticket** (um passo além do "como hoje" do ticket): sem as abas do painel, era o jeito de mantê-los usáveis até o ticket 19, que acrescenta o agrupamento por dia, o Esc em dois passos e o rodapé fixo.
- **Esc da janela de dentro já não fecha o processo:** o problema anotado no `/polir` do ticket 14 ("Esc dentro da janela também fecha o painel") some com o `<dialog>` modal, porque só a janela de cima recebe o pedido de fechar. O `<dialog>` simulado dos testes passou a imitar isso (`src/configurarTestes.ts`).
- **Altura mínima da janela (600 px, ou 90% da tela):** conferindo na vitrine, a janela carregando tinha cerca de 370 px e a carregada 530 px; com a altura mínima, a diferença ficou em cerca de 60 px, e a coluna cinza desce até o fim.
- **Foco no nome sem rolar a janela:** conferindo na vitrine, o foco no nome rolava a janela 42 px para baixo ao abrir; agora o foco não rola (`preventScroll`).
- **Testes antigos:** os 20 arquivos que abriam o painel passam a achar o verso pelos ajudantes de `src/testes/versoDoCartao.ts`; o `App.painelDoProcesso.test.tsx` virou o `App.versoDoCartao.test.tsx`, com os casos que continuam valendo; o caso da pílula "Em andamento" no cabeçalho saiu, porque o cabeçalho não a mostra mais.
- **Tela conferida no navegador do app pela vitrine local** (módulos falsos, fora do git; Vite na porta 5179, encerrado). **Visto:** janela de 880 px em duas colunas, com o Quadro escurecido atrás; cabeçalho com sigla, nome, cor do macroprocesso e tipo; menu "⋯" com os três grupos, o Excluir em vermelho e o foco no primeiro item; carregando em blocos cinza; a 375 px, a tela inteira em uma coluna, sem rolagem para o lado. **Presumido, não visto:** o aparecimento suave e o "menos movimento" (só CSS), o Tab preso dentro da janela (é do navegador, com o `<dialog>` modal), o leitor de tela de verdade e a Consulta (só por teste).

## 2026-10-19 — /executar-complexo do ticket 17 (o cartão Agora e o caminho de etapas)

- **Concluído com etapa opcional aberta:** o processo fica "Concluído" com as obrigatórias resolvidas, mas a Publicação (opcional) pode seguir pendente ou em andamento. O Agora verde diz "Concluído em {data}" e, se ainda há etapa atual aberta, mantém logo abaixo o corpo normal dela (nome, responsável, botão principal, "⋯"), separado por uma linha fina. A spec só pede a frase; sem o corpo, Concluir ou Dispensar a Publicação deixaria de existir na tela.
- **[Corrigir datas] também na etapa atual em andamento:** a spec diz que a atual aberta "mostra só datas e nota"; o botão ficou, porque é o único jeito de corrigir o início, de que os dias na etapa dependem. O responsável e as ações da atual ficam só no Agora, como a spec pede.
- **Concordância dos dias:** "hoje" (0 dia) e "há 1 dia"; de 2 a 15, "há {n} dias"; a partir de 16, a pílula "{n} dias nesta etapa" (a pílula do sistema escreve em maiúsculas, como as outras).
- **Iniciais da linha da etapa são as do responsável dela:** o dado lido traz o responsável da etapa, não quem a resolveu; nas etapas resolvidas isso pode diferir de "quem resolveu" da spec.
- **A região das etapas se chama "Etapas"** (o título visível), no lugar de "Caminho de etapas"; o nome acessível de cada linha é "{nome}: {status}" (concluída, atual, pendente, opcional/pendente, dispensada, realizada anteriormente).
- **A trava do autor vale também no "Trocar":** a lista não oferece o autor da versão mais recente na Revisão interna (spec: "a mesma trava do autor"); o teste antigo que escolhia esse autor no seletor para ver a recusa do banco virou dois: a lista sem ele, e a recusa do banco mostrada como alerta quando a gravação falha.
- **Retomar do Agora usa a janela de motivo que já existe** (`JanelaDeSituacao`), com o mesmo `executar` do "⋯" do processo; o aviso antigo do processo parado saiu.
- **O arquivo `Etapas.css` nunca era carregado** (nenhum `import`); o caminho antigo estava sem aquele estilo. Agora é importado pelas Etapas e, de carona, passa a valer também o `.acoes-do-responsavel` da tabela do catálogo da Administração. Ver o catálogo na tela no `/polir`.
- **Testes antigos:** sete arquivos (`andamentoDoProcesso`, `avancoDaEtapa`, `assumirEAutor`, `voltarDatasResponsavel`, `situacaoDoProcesso`, `versoDoCartao`, `catalogoNosProcessos`) passaram a achar as ações da etapa atual no Agora e as das outras etapas na gaveta; os comportamentos conferidos são os mesmos. Ajudantes novos em `src/testes/processoNoVerso.tsx` e `src/testes/versoDoCartao.ts`.
- **Tela conferida no navegador do app pela vitrine local** (módulos falsos, fora do git, porta 5179). **Visto:** Agora do andamento com a borda azul de 2 px, o único botão principal e a pílula âmbar aos 18 dias; "Trocar" abrindo a lista com "(você)" primeiro e "Ninguém por enquanto" no fim, com o foco nela; suspenso em âmbar claro, cancelado em cinza claro, concluído em verde claro (cores lidas do estilo); Consulta com a borda cinza e "Com Bia Teste" sem botões; etapas em linhas quietas (✓ verde, ponto azul na atual, círculos cinza), a gaveta abrindo sob a linha e a janela com rolagem só dela, sem rolagem para o lado; a 375 px, uma coluna, sem estouro, com o Agora e a gaveta inteiros. Contraste do texto cinza sobre os fundos do Agora e da linha atual: de 5,0 a 5,8 para 1 (mínimo 4,5). **Presumido, não visto:** o leitor de tela de verdade, o Enter e o Espaço na linha (são botões nativos), a janela de "Retomar" aberta a partir do Agora (só por teste).

## 2026-10-19 — /executar-complexo do ticket 18 (Arquivos, Reunião, Sobre e Estrutura no verso)

- **Versões anteriores num `<details>` nativo** ("Versões anteriores ({n})"), com a lista que já existia dentro; sem estado em React.
- **Cada versão é um `<article>` com o nome do rótulo** ("V4"), a do destaque e as anteriores; os testes passaram a achá-las pelo papel `article` no lugar de `listitem`.
- **O destaque mantém autor, etapa e observação** numa segunda linha em cinza, abaixo de "V3 · 03/10 · falta relatório" (a spec não os cita; tirá-los perderia o que a lista mostrava). Autor e etapa são textos separados, com o ponto entre eles vindo do CSS. O dia tem a data e a hora completas no `title`.
- **Botão do arquivo:** mostra o rótulo curto ("Fluxograma .bpmn", "Relatório .docx") e tem o nome acessível "Baixar {rótulo} ({nome do arquivo})", que contém o texto visível; o nome completo também vai no `title`. As anteriores continuam com o nome completo como link.
- **"Acrescentar relatório" no "⋯" da seção** quando só uma versão anterior está sem relatório (a mais recente tem): o espaço tracejado só existe na mais recente, e sem isso a anterior ficaria sem caminho.
- **"Sem alteração de conteúdo"** continua no destaque, ao lado do espaço tracejado, mas como link discreto (conferindo na tela, o botão chamava mais atenção que o próprio relatório que falta).
- **Substituir no "⋯" de cada arquivo também nas anteriores**, para o mesmo arquivo não ter dois jeitos de substituir. O "⋯" se chama "Ações de {nome do arquivo}".
- **"Relatório pendente" continua nas anteriores**; no destaque, a pílula é "falta relatório".
- **Texto longo do Sobre:** mais de 240 caracteres ou mais de 3 quebras de linha ganha "Ler mais"; o corte visual em 4 linhas é do CSS. Medir a altura não funciona nos testes (o jsdom não mede).
- **Sobre em grade:** os campos curtos (setor, macroprocesso, tipo, origem) ficam lado a lado, e contexto e observações ocupam a linha toda (conferindo na tela, um por linha gastava muita altura).
- **Reunião de hoje é "· próxima"** (a regra de antes: só a data anterior a hoje foi realizada); a data aparece como DD/MM/AAAA, como antes.
- **Foco na reunião:** ao abrir "Marcar data" ou "Alterar data" o foco vai ao campo, e ao salvar ou cancelar volta ao botão (achado na conferência da tela: o botão sumia e o foco se perdia).
- **Situação do subprocesso:** "Suspenso", "Cancelado" ou "Concluído" depois da etapa atual ("Relatório e modelagem técnica · Suspenso"); concluído sem etapa atual mostra só "Concluído".
- **Estrutura lida pela view `processos_com_andamento`** (que já calcula a etapa atual e a situação), no lugar da tabela `processos`; sem migração. O cliente falso dos testes ganhou uma fila de respostas, para duas leituras da mesma view responderem diferente.
- **Regras de CSS sem uso retiradas** do `Painel.css` (`painel-lista-de-dados`, `painel-estrutura-lista` e a disposição antiga da `reuniao-edicao`); o `DadosDoProcesso.tsx` deu lugar ao `SobreDoProcesso.tsx`.
- **Testes antigos:** os de versões (`baixarArquivo`, `conferenciaNoDrive`, `enviarVersao`, `registrarVersaoHistorica`, `relatorioDepois`, `substituirArquivo`, `versoesNoHistorico`, `versoesNoProcesso`) passaram a achar a região "Arquivos", as versões como `article`, os arquivos do destaque pelo nome dentro do nome acessível e as ações raras pelos "⋯"; os de reunião, subprocessos, verso, reclassificar e recursos retirados, as regiões "Reunião", "Sobre", "Subprocessos ({n})" e "Faz parte de". Os casos da Reunião ficaram no `App.reuniaoDoProcesso.test.tsx` reescrito, e o das marcas do Drive no `App.conferenciaNoDrive`, para não repetir o mesmo comportamento em dois arquivos.
- **Tela conferida no navegador do app pela vitrine local** (módulos falsos, fora do git; recriada, porque a do ticket 17 não existia mais; Vite na porta 5179, encerrado). **Visto:** em 960 px, duas colunas; "V3 · 03/10 · FALTA RELATÓRIO" numa linha; os botões "Fluxograma .bpmn" e "Imagem .png" com a barrinha azul à esquerda e o ícone de baixar; a pílula "ALTERADO FORA DA PLATAFORMA" ao lado do arquivo; o espaço tracejado "+ Acrescentar relatório" no lugar do relatório; "Versões anteriores (2)" abrindo a lista antiga; à direita, "27/10/2026 · próxima" com a barrinha amarela e "Alterar data" virando o campo com Salvar, Remover e Cancelar; o Sobre em grade com o contexto cortado e "Ler mais"; "Subprocessos (2)" com "Relatório e modelagem técnica · Suspenso"; no subprocesso, "Faz parte de"; abaixo de 900 px, uma coluna só. Pela página (DOM): a Consulta só com os links de baixar, sem enviar, sem "⋯" de arquivo, sem o espaço tracejado e sem "Alterar data". **Presumido, não visto:** leitor de tela de verdade; a barrinha roxa do relatório num botão de relatório (só a do espaço tracejado foi vista); a versão histórica em destaque (só por teste).
- **Contorno de ambiente:** o e-mail de autor do git não está na configuração desta máquina (só o nome); os commits passaram o mesmo e-mail dos commits anteriores só no próprio comando (`git -c user.email=…`), sem mudar a configuração.

## 2026-10-19 — /executar-complexo do ticket 19 (Histórico, Novo processo e Editar na janela)

- **Esc no Editar também volta ao verso** (a spec só diz isso do Histórico): Esc é cancelar, e fechar a janela inteira perderia o que foi digitado sem aviso. O Novo processo continua fechando com Esc. Spec ajustada na mesma data.
- **Aviso "Processo cadastrado" no estado da `AreaDeProcessos`** (id do recém-criado), repassado ao verso como `aviso`; some ao fechar a janela e não aparece em outro processo. O Novo processo fecha e o verso abre em outro `<dialog>`, então "a janela se alarga" é o resultado visto, sem animação própria.
- **`criarProcesso` devolve o id** (`.insert(...).select('id')`, como as outras gravações); sem linha de volta, falha com o valor recebido e o formato esperado. Sem migração.
- **Título do formulário passou do `h3` interno para o cabeçalho da janela** (`h2`, que recebe o foco); o `aria-label` do formulário ("Cadastrar processo", "Editar processo") ficou. Botão de envio: [Cadastrar] no cadastro, [Salvar] na edição; o botão da visão continua [Cadastrar processo].
- **Iniciais de quem fez** pelo componente `Avatar` (nome completo no nome acessível); alteração direta no banco (sem autor) aparece como "BD". O nome por extenso deixou de ser texto visível no histórico do processo (o teste de `App.reuniaoDoProcesso` passou a achá-lo pelo nome acessível).
- **O falso de processos repetia ids** (o processo novo podia ficar com `p1`, já usado por um processo carregado no teste): agora pula os ids em uso. Só afetava testes que cadastram com processos já carregados.
- **Tela conferida no navegador do app pela vitrine local** (porta 5180, porque a 5179 ainda tinha o servidor do ticket 18; o da 5180 foi encerrado). **Visto:** Histórico agrupado em Hoje, Ontem e 10/10 com hora em mono e iniciais; Esc volta ao verso; Editar com o título "Editar Emitir Ofício" e o rodapé fixo na janela estreita; Novo processo com rolagem e rodapé fixo; ao cadastrar, o verso do criado com "Processo cadastrado" em verde. O carregando do formulário não ganhou blocos cinza no formato final (o formulário mostra só "Carregando setores e macroprocessos…"): o critério `[visual]` da spec sobre isso fica para o `/polir`.
- **Contorno de ambiente:** o e-mail de autor do git continua fora da configuração da máquina; os commits passaram o e-mail dos commits anteriores só no comando.

## 2026-10-19 — /polir da parte 3 (Verso do cartão; tickets 15 a 19 de processos-etapas)

Impeccable `audit` (detector sem achados; leitura do CSS e dos componentes de `processos` e `versoes`; contraste dos tokens de texto conferido: texto-2 e aprovado-texto acima de 4,5:1) e `polish`. Notas do audit: acessibilidade 3, desempenho 4, tema 3, responsivo 4, integridade 4.

**Corrigido:**
- **[P1] A recusa do formulário ficava abaixo do rodapé fixo** de Novo processo e Editar: com o formulário rolado para cima, a mensagem ("O nome do processo é obrigatório", nome repetido, falha de gravação) ficava fora da vista. Agora aparece dentro do rodapé, acima dos botões (`formulario-do-processo-aviso`), com teste.
- **[P2] Campos obrigatórios sem indicação para leitor de tela:** `aria-required` em Nome, Setor, Macroprocesso e Processo pai (a validação e os textos não mudaram).
- **[P3] Cor solta no tema:** a linha fina do Agora usava `rgb(30 36 51 / 10%)`; passou para `var(--linha)`.

**Deixado de fora:**
- **Blocos cinza no carregando do formulário** (critério `[visual]` da spec): o formulário mostra só "Carregando setores e macroprocessos…" e a janela estreita muda de altura quando os dados chegam. Motivo: é acabamento que pede desenho próprio dos blocos; fica no backlog.
- **Aviso "Processo cadastrado" como `role="status"`** que nasce junto com a janela: leitores de tela podem não o anunciar além do anúncio do próprio diálogo. Motivo: o diálogo já abre anunciando o processo; sem prova com leitor de tela real.
- **Fonte mono em datas, versões e contagens** (regra do DESIGN.md): só a hora do histórico usa; as demais seguem no backlog de 2026-10-18.

## 2026-10-19 — /ship da parte 3 (Verso do cartão; tickets 15 a 19 de processos-etapas)

Ponto de partida da revisão: `8d01ca8` (último commit entregue; a parte 3 não teve marco de início próprio).

**Achados corrigidos nesta entrega:**
- **Busca da Lista não aparava espaços** (revisão de spec): "Emitir " não achava nada e uma busca só de espaços filtrava a lista. Teste novo falhou antes e passou depois; `contemTrecho` e `partesDoNome` passaram a aparar as pontas (commit `2f2c580`). Spec: história 138.
- **Formulário (Novo processo e Editar) sem blocos cinza no carregando** (critério `[visual]` da spec, deixado de fora pelo `/polir`): agora `FormularioCarregando` mostra blocos do tamanho dos campos e do rodapé. Medido na vitrine local, no Novo processo, a janela fica com a mesma altura antes e depois dos dados chegarem (691 px); a primeira tentativa dava 52 px de diferença e foi ajustada às medidas do formulário pronto (commit `145883c`). Editar não foi medido na tela (a tentativa de abri-lo na vitrine falhou); só o teste confere o número de campos.

**Achados de padrões (revisão do `/ship`, só julgamento, nada duro), levados ao backlog:** formatação de datas repetida em cinco pontos (`formatarData`, `diasNaEtapa`, `formatarDiaEMes`, `formatarMomento`, o horário da `LinhaDoTempo`), só uma com fuso fixo; tratamento do Esc em quatro lugares (`MenuDeAcoes`, `MenuDaConta`, `TrocaDoResponsavel`, `configurarTestes`); `papel === 'relatorio'` repetido em `VersaoEmDestaque`, `FormularioDeRelatorio` e `SecaoDeVersoes`; nomes pouco buscáveis (`Agora.css`, `Contexto.css`, `emOrdem`, `aoAlterada` e `aoConcluir`).

**Deixado como está (julgamento):** o foco que volta ao cartão ou à linha usa `setTimeout(0)` e se perde quando o filtro da Lista esconde a linha de origem; o foco cai no corpo da página, que é o comportamento padrão do navegador. Anotado no backlog.

**Segurança:** `/security-review` só viu os dois últimos commits (a `main` local está dois à frente do GitHub) e não achou nada neles. A parte 3 inteira foi revisada pela revisão de reserva (leitura de `src/`, sem `dangerouslySetInnerHTML`, `innerHTML` nem `eval`; a busca e o id vindos do endereço só entram como texto do React ou na consulta com RLS). Sem achado. `security-auditor`: pulado, `package.json` não mudou e `.scratch/security.md` existe. Banco: pulado, nada mudou em `supabase/`.

**Testes instáveis:** `App.macroprocessosDoSetor` falhou nas duas rodadas com cobertura e uma vez na primeira rodada comum, e passou sozinho 3 de 3 e no pré-commit; mesma família do backlog de 2026-10-19. A cobertura foi medida sem esse arquivo: 98,43% das instruções, 94,11% dos ramos, 99,28% das funções, 99,31% das linhas (131 arquivos, 1845 testes).

**Verificado na tela (vitrine local, módulos falsos):** busca da Lista com lupa, "×", trecho marcado em amarelo e `busca` no endereço; o verso como Consulta (borda cinza no Agora, sem botões, "⋯" só com Histórico); o formulário carregando em blocos cinza. **Presumido:** aparecimento suave e "menos movimento" (só CSS), Tab preso na janela, leitor de tela de verdade, e o Editar carregando na tela.

## 2026-10-19 — /executar-complexo do ticket 20 (barra de progresso e selos do cartão do Quadro)

Decisões da execução (as cinco do `plano-20.md`, mais o que apareceu no caminho):

- **`cartao` e `dataDaReuniao` opcionais em `ProcessoDaLista`.** Cerca de dez arquivos de teste montam `ProcessoDaLista` à mão; tornar os campos obrigatórios os quebraria sem ganho. Sem `cartao`, o cartão não tem barra nem os selos que dependem dele (versão, subprocessos, relatório, dias); "Sem responsável" e "Reunião" saem de campos que o processo já tem e continuam aparecendo.
- **"Relatório pendente" também aparece no cartão suspenso.** A spec lista como mantidos no suspenso "os selos que não são de tempo (versão, reunião, subprocessos, Sem responsável)" e não cita o Relatório pendente; como ele também não é de tempo, ficou junto. Só o selo de dias some no suspenso. Se a intenção era outra, é uma linha em `selosDoCartao.ts`.
- **A posição "Revisão interna ou posterior" é medida pela ordem do `caminho`** da view, que já vem na ordem do catálogo: índice da etapa atual ≥ índice de `revisao_interna`. Sem `revisao_interna` no caminho, o selo não aparece.
- **"Sem responsável" aparece sempre neste ticket**; o ticket 22 o esconde quando o Quadro estiver agrupado por responsável (spec, "Observações", parte 4).
- **A barra e a tradução usam só `codigo` e `status` do caminho**; o `etapa_id` do JSON da view fica de fora da tradução, porque nada na tela o usa.
- **O teste de banco `37_cartao_do_quadro` falhou duas vezes por erro do próprio teste antes de falhar pelo motivo certo** (o processo pai de um subprocesso precisa nascer com tipo "processo", e o tipo só muda pela reclassificação: `pai_nao_e_processo`, depois `tipo_so_pela_funcao`). O vermelho certo (`column "etapa_atual_status" not found`) veio na terceira rodada; depois da migração, 33 asserções ok e os 33 arquivos verdes (o plano dizia "37 arquivos", mas são 33).
- **Os testes novos das funções puras e da tela passaram na primeira rodada, sem o vermelho antes**: as funções, os componentes e os testes foram escritos na mesma sequência, sem rodar os testes antes da implementação. Cada teste foi lido contra a regra da spec ao escrever (limites de 15 e 16 dias, ordem dos selos, suspenso, versão histórica); o vermelho de verdade existe só no teste de banco.
- **Um teste antigo mudou**: `listaDeProcessosSupabase.test.ts` compara o processo inteiro e passou a esperar o `cartao` vazio nas linhas que não trazem os campos novos; ganhou também um teste com a linha completa.

**Verificado na tela (vitrine local, módulos falsos):** o cartão normal fica limpo (barra fina em cinza e azul); só "{n} dias nesta etapa" e "Relatório pendente" aparecem em âmbar; "Reunião", "Sem responsável" em neutro, versão e subprocessos em texto neutro; os selos quebram de linha dentro da coluna, inclusive num cartão de nome longo com os seis selos; o suspenso mantém a barra e perde o selo de dias. **Presumido:** a tela com o banco de verdade e com dados reais (a vitrine usa módulos falsos).

## 2026-10-19 — /executar-complexo do ticket 21 (arrastar o cartão para concluir)

Decisões da execução (as cinco do `plano-21.md`, mais o que apareceu no caminho):

- **A janela abre depois de ler o processo (`lerProcesso`)**, porque o cartão do Quadro não traz o id do andamento que a função de avanço recebe. Se a leitura mostra que a etapa atual já não está em andamento ou que já não há pendente depois (Quadro desatualizado), nada abre e o Quadro só recarrega. Custo: uma leitura a mais por soltura; a janela aparece um instante depois.
- **Toda coluna aceita o soltar** (`preventDefault` no `dragover`), para o aviso "Solte o cartão na coluna {etapa}." aparecer ao soltar fora do destino; o realce continua só no destino. Consequência: o cursor não mostra "proibido" nas outras colunas.
- **O cartão que não se arrasta leva `draggable="false"`.** O `<a>` é arrastável por padrão (arrasta o endereço), e a spec diz que o cartão "não é arrastável" nesses casos.
- **Falha ao ler o processo ao soltar** mostra "Não foi possível abrir a conclusão: {motivo}." (a frase de gravação diria "não foi salva", o que seria falso numa leitura). A falha de gravação usa a frase de sempre.
- **Ajuda de teste compartilhada:** o teste novo era a segunda repetição do Quadro montado à mão, então `ETAPAS`, `processo()`, `montar()` e `cartaoDe()` subiram para `src/testes/quadroDeTeste.tsx`, e o `App.cartaoDoQuadro.test.tsx` passou a usá-las. O `processo()` agora preenche `etapasDoProcesso` coerente com o caminho (antes `[]`).
- **O Enter no cartão não tem teste próprio**: o Enter abrir o link é comportamento nativo do navegador (o jsdom não o simula e não há `user-event` no projeto), e o ticket não mexeu nele. O teste confere que o cartão segue sendo um link com `href` e que o clique abre o verso, também depois de um arrastar abortado.
- **Ajuste de CSS depois da conferência na tela:** o contorno da coluna de destino saía da caixa e a rolagem lateral o cortava no topo e à esquerda; passou para dentro (`outline-offset: -2px`), com altura mínima de 160px para a coluna vazia ser um alvo de verdade.
- **Os testes novos de tela falharam primeiro pelo motivo certo** (cartão sem `draggable`, sem realce, sem aviso; janela inexistente). Na Tarefa 3, os seis testes que dependiam da janela falharam uma segunda vez por erro do próprio teste: a janela abre só depois da leitura assíncrona, e o teste a procurava na hora (trocado por `findByRole`).

**Verificado na tela (vitrine local, módulos falsos, eventos de arrastar disparados pelo navegador do app):** só a coluna de destino ("Revisão pelo setor") ganha a borda tracejada azul, inteira e sem corte, com 160px de altura mesmo vazia; o cartão arrastado fica a 50% de opacidade no lugar de origem; o cartão do suspenso tem `draggable="false"`. **Presumido:** o gesto de arrastar com o mouse de verdade (a vitrine só recebeu os eventos, sem o soltar), o cursor nas outras colunas e o aviso na tela com o banco de verdade.

## 2026-10-19 — /executar-complexo do ticket 22 (agrupar por responsável e "Só os meus")

Decisões da execução (as cinco do `plano-22.md`, mais o que apareceu no caminho):

- **`agrupar` fica no endereço, ao lado de `filtros`, não dentro deles.** `temFiltro` e o [Limpar filtros] olham só `filtros`, então "limpar" mantém o agrupamento (spec, "Observações", parte 4). Só vale no Quadro: na Lista o parâmetro é ignorado e não é escrito. O alternador Quadro/Lista da barra de cima já zera o endereço, então o agrupamento não acompanha a troca de visão.
- **"Agrupar por" são dois botões com `aria-pressed`** (Etapa, Responsável), como o "Quadro | Lista" da barra de cima, e não um seletor: a spec escreve "Etapa | Responsável".
- **"Só os meus" só aparece no Quadro** (a spec o põe "na barra do Quadro"). Na Lista, o filtro Responsável faz o mesmo. O botão não tem estado próprio: lê e escreve `filtros.responsavel`, por isso "escolher a si mesmo liga o botão" saiu sem código extra.
- **Cartão sem etapa atual** não entra no Quadro por responsável, como já não entra em nenhuma coluna de etapa.
- **Conhecido e aceito:** com "Só os meus" ligado por quem não tem nenhum processo, o seletor Responsável mostra "Todos" (o id da pessoa não está nas opções, que saem da lista carregada). Só a mensagem "Nenhum processo com você agora." conta a situação. Acrescentar a opção só se alguém estranhar.
- **Complexidade do ESLint:** `CartaoDoProcesso` e `VisaoDosProcessos` passaram de 10 caminhos; extraídos `QuemOuOndeNoRodape` e `ControlesDoQuadroNaBarra` (nomes com função própria, sem comprimir código).
- **Os testes de endereço das Tarefas 1 e 2 passaram na primeira rodada junto com a implementação** (escritos e implementados no mesmo passo, sem o vermelho separado). Nas Tarefas 3 e 4 os testes de tela falharam primeiro pelo motivo certo (sem o grupo "Agrupar por"; sem o botão "Só os meus").
- **Ajuste depois da conferência na tela:** a pílula "Inativo" ficava solta no meio do título da coluna (o título distribui o espaço entre três itens); nome e pílula agora vão num só `<span>`. Os botões da barra quebravam o texto em duas linhas numa janela estreita: `white-space: nowrap` nos botões e `flex-wrap` na barra.

**Verificado na tela (vitrine local, módulos falsos, navegador do app, janela estreita de cerca de 630px):** "Agrupar por" e "Só os meus" ficam na barra, junto dos filtros e do [Cadastrar processo], sem quebrar o texto dos botões; por responsável, colunas "Ana Teste", "Bia Teste", "Duda Desativada" com a pílula "Inativo" ao lado do nome, "Pessoa de Teste" e "Sem responsável" no fim; o cartão mostra o nome da etapa no rodapé, no lugar do avatar; "Só os meus" ligado fica azul, põe o filtro Responsável em quem está na tela e o endereço ganha `responsavel=<id>`. **Presumido, não visto:** a mensagem "Nenhum processo com você agora." na tela (só por teste), a Consulta (só por teste), a barra numa janela larga e a largura real das colunas com nomes compridos.

## 2026-10-19 — /polir da parte 4 (Cartão do Quadro: tickets 20, 21 e 22)

Auditoria dos arquivos mudados desde o commit `8ef4091` (`src/components/processos/`, Quadro.css, hooks e módulos do cartão). O detector do Impeccable não achou nada; o resto foi leitura do código. Telas não reconferidas no navegador nesta rodada (já vistas na vitrine local nos tickets 20 a 22).

- **Corrigido (P2, contraste):** os pedaços "seguinte" da barra de progresso usavam `--linha-tracejada` (cerca de 1,6:1 sobre o cartão branco), abaixo dos 3:1 que o WCAG 2.2 AA pede para gráficos. Passaram a ser ocos, com borda `--icone-inativo` (cerca de 3,1:1). O texto do `aria-label` da barra já dizia o estado, então leitor de tela não mudou.
- **Deixado de fora (por decisão da spec):** o arrastar para concluir é só com mouse (recurso nativo do navegador, sem biblioteca; não funciona por toque). A alternativa de um clique sem arrastar, exigida pelo WCAG 2.2 (2.5.7), é concluir a etapa pelo verso do cartão, que já existe.
- **Sem achado:** foco visível (global em `index.css`), `aria-pressed` nos botões de agrupar e "Só os meus", `role="status"` e `role="alert"` nos avisos do Quadro, cartão sem cor hard-coded (tudo por token), `prefers-reduced-motion` global, quebra de linha da barra em janela estreita.

## 2026-10-19 — /ship da parte 4 (Cartão do Quadro: tickets 20, 21 e 22)

Ponto de partida da revisão: marco `marco/2026-10-19-inicio-ticket-20-processos-etapas` (`b7d06fb`).

- **`/mattpocock-skills:code-review` (padrões):** sem violação grave. Repetições pequenas aceitas e anotadas: duas ordenações de texto em pt-BR em `colunasDoQuadro.ts` (`porNome`, `porTitulo`) e a escolha da classe do botão repetida em `ControlesDoQuadro.tsx`; aviso "Solte o cartão na coluna ." sem nome de coluna num caso raro (coluna não achada); as propriedades `processos`, `usuarioId`, `aoMudar`, `podeAlterar` e `agrupar` descem por quatro componentes seguidos. Nada disso muda comportamento; a limpeza fica no backlog.
- **`/mattpocock-skills:code-review` (spec):** (1) o critério "Enter no cartão abre o verso" (ticket 21) não tem teste próprio: o cartão é um `<a href>`, o Enter é comportamento nativo do navegador e o jsdom não o reproduz; presumido. (2) "Recarregar e voltar mantêm o agrupamento" (ticket 22): testado só a leitura do endereço, não a navegação do navegador; presumido. (3) "Relatório pendente" compara a posição da Revisão interna no caminho do próprio processo (que já vem na ordem do catálogo); só difere da letra da spec num processo sem a Revisão interna no caminho, caso em que o selo não aparece (teste `selosDoCartao.test.ts` fixa isso). (4) Escopo extra aceito: exceção do detector de design para a barrinha do selo Reunião (`.impeccable/config.json`), mensagem "Não foi possível abrir a conclusão" e recarga silenciosa do Quadro desatualizado ao soltar (tem teste).
- **Revisão de segurança:** `/security-review` não achou mudanças (a `main` já inclui tudo); feita a revisão de reserva, menos completa, das mudanças desde `b7d06fb`. Sem achado: a view recriada mantém `security_invoker = true`, `revoke` de visitante e `grant select` só a `authenticated`, lê só tabelas que o perfil já lê pelas próprias políticas (teste 37 prova que a Consulta lê os mesmos valores); o parâmetro `agrupar` do endereço só aceita `responsavel` e cai em `etapa` para qualquer outro valor; sem `innerHTML`, `eval`, armazenamento do navegador, nem chave secreta; o dado do arrastar é só o id do processo, e a gravação passa pelo mesmo caminho de "Concluir" (a regra fica no banco).
- **Segurança de pacotes:** pulada (`package.json` não mudou e `.scratch/security.md` já existe).
- **Banco:** migração `20261019182327_cartao_do_quadro` não destrutiva; sem `security definer`; tipos em dia (`db:types` sem diferença real, só fim de linha).
- **Dependências circulares:** nenhuma. Cobertura: 98,5% das instruções.

## 2026-10-23 — /executar-complexo do ticket 23 (Anotações do processo)

Decisões da execução (as oito do `plano-23.md`, mais o que apareceu no caminho):

- **O salvamento é uma classe, `GravadorDeAnotacoes`, fora do React.** Pausa de 1 segundo, fila de uma gravação por vez, falha e conflito se testam com o relógio simulado, sem montar tela; o hook `useAnotacoesDoProcesso` só a liga ao componente (os limites do ESLint também pediam a divisão).
- **A frase de falha é fixa** ("Não foi possível salvar. Seu texto continua aqui"), qualquer que seja o motivo (conexão, arquivado, perfil), como a spec escreve.
- **Autor e hora vêm do banco**, com `clock_timestamp()` no gatilho (não `now()`), para a hora mudar de verdade dentro de uma transação de teste.
- **A falsa não recusa a Consulta** (a falsa de processos não conhece o perfil, como nas outras gravações); a tela não mostra campo à Consulta e o banco é provado pelo teste pgTAP. A recusa do arquivado a falsa faz.
- **Só os caminhos da spec guardam a saída:** botão de fechar, Esc, abrir o pai ou um subprocesso, Histórico e Editar; aba e recarga pelo aviso nativo (`beforeunload`). O botão Voltar do navegador troca o endereço sem passar pelo verso e **não** é interceptado (conhecido e aceito).
- **A reclassificação mantém as Anotações** por construção (só muda `tipo` e `processo_pai_id`); o teste de banco 50 tem uma asserção para isso.
- **Sem atualização ao vivo** (spec): o texto é lido ao abrir o verso e depois de "Ver o texto atual".
- **Os tipos do banco foram escritos à mão em `src/types/database.ts`**, no formato do gerador, porque o `gh` não está autenticado nesta máquina e o workflow de migração não pôde ser disparado antes de a tela ser escrita. O `db:types` os confere depois da migração aplicada.
- **Ordem diferente da do plano:** as Tarefas 2 a 6 (tela) foram feitas antes de o banco ser aplicado; a migração está commitada na branch e **não foi enviada**, à espera de o "Testes de banco" ser visto vermelho e de a migração ser aplicada pelo workflow.
- **Os testes das Tarefas 2, 3 e 4 foram escritos junto da implementação** (os arquivos de teste e de código foram criados na mesma rodada), sem o vermelho separado; o vermelho de verdade foi visto nos testes de tela (Tarefas 5 e 6) e vem no teste de banco (Tarefa 1).
- **Um teste de tela falhou por erro do próprio teste:** a busca por `/nota/i` na página do Histórico achava o título "As anotações não foram salvas" da janela de confirmação fechada; passou a olhar só a página do Histórico.
- **Ajuste de CSS depois de ver a tela:** o aviso de falha, reaproveitando `cadastros-falha`, virava uma caixa vermelha grande que empurrava o campo para baixo; passou a ser texto vermelho pequeno (`anotacoes-falha`).
- **Prop do ref renomeada** para `guardaRef`: a regra `react-hooks/immutability` do ESLint exige o sufixo `Ref` para poder escrever em `.current`.

**Verificado na tela (vitrine local, módulos falsos, navegador do app; servidor do Vite na porta 5175, encerrado), não com login e banco:** o bloco é o primeiro da coluna direita, acima da Reunião; o campo cresce e passa a rolar por dentro (texto de 16 linhas, altura máxima cerca de 12 linhas); a linha "Alterado por Bia Teste em 12/10, 12:05" discreta abaixo; a falha em vermelho pequeno ao lado do título, com o texto mantido; o conflito em caixa amarela com [Ver o texto atual], que troca o campo pelo texto da outra pessoa; o arquivado visto pela Consulta só com o texto e a linha "Alterado por". **Presumido, não visto:** a gravação e o conflito contra o banco de verdade, o aviso nativo do navegador ao fechar a aba (o jsdom só prova o `preventDefault`), o comportamento do botão Voltar do navegador com texto pendente e a leitura por leitor de tela real.

## 2026-10-23 — /polir do ticket 23 (Anotações do processo)

Auditoria dos arquivos do ticket (`BlocoDasAnotacoes.tsx`, `Anotacoes.css`, `ConfirmarSaidaSemSalvar.tsx`, `JanelaDeConfirmacao.tsx`, `EstruturaDoProcesso.tsx`). O detector do Impeccable não achou nada; o resto foi leitura do código e dos contrastes pelos tokens. Telas já vistas na vitrine local no ticket (campo, falha, conflito, arquivado); não reconferidas depois do polimento, que não mudou o visual.

- **Corrigido (P2, leitor de tela):** a região de status ("Salvando…", "Salvo") era trocada por um alerta quando a gravação falhava; ao voltar a "Salvo", a região nascia já com o texto e vários leitores não anunciam isso. Agora a região de status nunca sai da tela e o alerta de falha é um elemento à parte.
- **Corrigido (P2, teclado):** depois de "Ver o texto atual" o botão sumia e o foco caía no fim da página; agora o foco volta ao campo. Teste novo no conflito.
- **Sem achado:** contraste (texto cinza sobre a coluna ≥ 4,5:1; vermelho da falha e âmbar do conflito ≥ 5:1, por token), foco visível (regra global em `index.css`), nome do campo ("Anotações") e do bloco, uso só de tokens do projeto, janela estreita (o bloco ocupa a coluna inteira e o campo rola por dentro), teclas Esc e Tab da confirmação (janela nativa do ADR 0003).
- **Deixado de fora:** alvos de toque de 44px e gesto por toque (a plataforma é de uso em desktop, spec e PRODUCT.md); realçar o campo com borda própria no tema (o campo usa a borda padrão do navegador, igual aos outros campos de texto do verso).

## 2026-10-23 — /ship do ticket 23 (Anotações do processo)

Ponto de partida da revisão: marco `marco/2026-10-23-inicio-ticket-23-processos-etapas` (`a912a10`).

- **`/mattpocock-skills:code-review` (padrões):** nenhuma violação do `banco.md` (função sem `security definer`, `search_path` vazio, privilégio de coluna só no texto, `revoke` de `public` e `anon`). Só julgamentos: o nome `saida` tem dois sentidos (`SaidaDoGravador` e `SaidaComAnotacoes`); o objeto `saida` desce por quatro componentes; o limite de 2.000 aparece no TypeScript, na restrição e na função SQL (o banco não importa a constante); a regra "só espaços" existe em `textoParaGravar` (`trim`, que também tira o espaço não separável) e na função SQL (`btrim` com espaço, tab e quebras), sem dano hoje porque o cliente já manda nulo. A constante `SEM_ANOTACOES` duplicada foi unificada em `anotacoes.ts`; o resto fica no backlog.
- **`/mattpocock-skills:code-review` (spec):** (1) **defeito corrigido:** depois de uma falha, se a pessoa apagava o que digitou e o texto voltava ao gravado, "Não foi possível salvar" ficava na tela sem nada pendente; teste novo no gravador, que falhou antes, e correção (commit `9e00b6e`). (2) Faltava teste do Editar com texto pendente; acrescentado. O abrir o pai usa o mesmo código do subprocesso, testado. (3) Aceito e registrado: o botão Voltar do navegador não é interceptado; "Alterado em {data}" sem o nome quando o autor não existe (gravação feita direto no banco, sem usuário), fora da spec; os estados "Carregando as anotações…" e de erro de leitura, que a leitura separada exige; o clique comum nos links da Estrutura passa a gravar o endereço pelo verso, para todos os perfis. (4) Aceito: o limite de 2.000 conta unidades do navegador (`maxLength` e `length`), enquanto o banco conta caracteres; texto com emoji é cortado um pouco antes do limite real, nunca perde dado. (5) Cobertura de banco: o teste 50 prova a recusa do arquivado com o Administrador e a de perfil com a Consulta; o Integrante usa o mesmo caminho da política.
- **Revisão de segurança:** `/security-review` só viu o último commit (a `main` já inclui o resto) e não achou nada; feita a revisão de reserva, menos completa, do ticket inteiro. Sem achado: a função grava com a permissão de quem chama, confere o perfil antes (`pode_alterar_cadastros`, 42501) e usa parâmetros, sem montar SQL; autor e hora vêm do gatilho (`auth.uid()` e `clock_timestamp()`), e as duas colunas não têm privilégio de alteração; visitante e inativo não gravam nem leem (teste 50); o texto fica fora da view, do pacote das planilhas e dos eventos (inclusive o "antes" da exclusão); no cliente o texto é renderizado como texto do React (sem `innerHTML`, `eval` nem armazenamento do navegador) e o endereço dos links vem de identificadores do banco e só muda o `#` da página. Observações de baixa gravidade, sem ação: quem pode alterar também consegue um `update` direto na coluna `anotacoes`, sem a conferência do texto esperado (a conferência existe para evitar sobrescrever sem querer, não para separar perfis; o perfil é o mesmo); o texto livre pode trazer nome e e-mail de pessoas dos setores, então entra no inventário de dados pessoais da revisão de pré-produção.
- **Segurança de pacotes:** pulada (`package.json` não mudou e `.scratch/security.md` já existe).
- **Banco:** migração `20261023175017_anotacoes_do_processo` não destrutiva (nenhum `drop`, `rename` nem troca de tipo); sem view nova e sem `security definer`; nenhuma chave secreta em `src/`, `.env.example` ou `supabase/functions/`; tipos em dia (`db:types` sem diferença real); "Testes de banco" na `main` com 46 de 46 arquivos e o 50 com 57 de 57. Políticas: administrador e integrante ativos leem e gravam as Anotações (pela função ou pelo `update` da coluna); a Consulta lê e não grava; inativo e visitante não leem nem gravam; ninguém muda direto o autor e a hora; o arquivado recusa a gravação.
- **Dependências circulares:** nenhuma (o ciclo que apareceu entre `ProcessosFalso` e `AnotacoesFalso`, durante a execução, foi desfeito). Cobertura: 98,5% das instruções (4.642 de 4.711).

## 2026-10-24 — /executar-complexo do ticket 24 (banco das passagens, Andamento livre)

Branch de integração `quadro-livre-parte-1` (marco `marco/2026-10-24-inicio-quadro-livre-parte-1`). **Nada foi aplicado no banco de desenvolvimento:** as três migrações (`20261024040938_andamento_livre_passagens`, `20261024040942_andamento_livre_sai_o_modelo_anterior`, `20261024040945_andamento_livre_mover`) vão no ticket 04 de publicacao-e-arquivamento. A branch **não** foi juntada à `main` ao fim deste ticket, ao contrário do passo 4 do comando, porque o ticket manda manter todo o Andamento livre nela até lá.

- **Ensaio automático das migrações (decisão do usuário, 2026-10-24).** O ticket pedia "ensaiado num teste temporário antes de aplicar" e "Testes de banco passa na branch", o que não cabe com a migração fora do banco. `scripts/testar-banco.mjs` passou a rodar, antes de cada arquivo de teste e na mesma transação que o teste desfaz, as migrações da pasta com versão maior que a última de `supabase_migrations.schema_migrations` (função pura `scripts/migracoesPendentes.mjs`, com teste no Vitest). Teste com a linha `-- ensaio: sem migrações pendentes` fica fora (a conversão monta os dados no modelo antigo e cola as migrações no meio). Depois da aplicação no ticket 04 não sobra pendência e o script volta ao comportamento de antes.
- **Pacote das planilhas, só o mínimo.** Apagar `andamentos` quebraria `private.montar_pacote_das_planilhas`; ele agora lê `passagens` (sem quem moveu) e `publicado_em`. Suspensos fora, validação e o resto ficam no ticket 06 de exportacao-e-manutencao.
- **Revisão e aprovação.** Saem `concluir_revisao_interna`, `concluir_aprovacao` e o apagar da aprovação na volta (o apagar agora é recusado com `aprovacao_nao_se_apaga`). `conferir_revisao_interna_em_andamento` e `conferir_aprovacao_em_andamento` passam a ler a passagem aberta, para as inclusões nas duas tabelas funcionarem até o ticket 05 de revisoes-aprovacao.
- **Tipos à mão.** O usuário preferiu não usar o Docker e o `db:types` remoto leria o banco antigo; `src/types/database.ts` foi ajustado seguindo as migrações (saem `andamentos`, `status_da_etapa`, `obrigatoria`, `vai_para_publicacao`; entram `passagens`, `etiqueta_da_etapa`, `mover_processo`, `responsavel_id`, as colunas de publicação e os campos novos da view). Regenerar com `db:types` depois que a migração for aplicada, no ticket 04.
- **Remendos na tela (só para `tsc`, lint e `npm test`; o ticket 25 reescreve):** `src/processos/clienteSemTipos.ts` (cliente sem tipos) nos módulos que ainda chamam a tabela e as funções que saíram (`andamentosSupabase`, `lerProcessoSupabase`, `publicacaoSupabase`, `revisoesSupabase`); `processoDaLinha` sem status por etapa nem caminho (`etapaAtualStatus: null`, `caminho: []`, entrada na etapa só como data); catálogo sem `obrigatoria` na leitura (fica `false`), no editar e no acrescentar, e `EtapaNoCatalogo.fase` aceitando nulo (as fixas); testes de `processoDaLinha`, `catalogoSupabase` e `listaDeProcessosSupabase` ajustados. **Contra o banco migrado a tela não funciona** (mover, avançar, catálogo) até o ticket 25.
- **Testes de banco.** Sete apagados, dezoito reescritos e quatro novos (lista no `plano-24.md`). `11_setores` usava a sigla `CEE`, que é de um setor real do desenvolvimento, e falhava também na `main`; trocada por `ZQX`.
- **Identidade de git:** a máquina desta sessão não tinha e-mail configurado; os commits foram feitos com `-c user.name` e `-c user.email` do mesmo autor dos anteriores, sem gravar configuração.

**Verificado:** "Testes de banco" verde (44 de 44, execução 40099740221, commit `6368174`), `tsc`, `eslint` e `npm test` (2553) verdes na branch. **Presumido:** o comportamento da tela contra o banco migrado (nada a verificar até o ticket 25); a aplicação real da migração nos dados de desenvolvimento (a conversão foi provada só dentro da transação do ensaio, com dados inventados).

## 2026-10-24 — /executar-complexo do ticket 25 (tela do andamento livre)

Branch de integração `quadro-livre-parte-1`, que **não** foi juntada à `main` (o passo 4 do comando não se aplica enquanto o ticket 04 de publicacao-e-arquivamento não fechar a branch). Nada foi aplicado no banco.

- **Retomada.** O código das tarefas 1 a 8 já estava no commit `9b0f997`, feito numa sessão anterior que não marcou as caixas do `plano-25.md`. Nesta retomada conferi o commit em vez de refazer: `tsc`, ESLint, `check:circular`, `npm test` e cobertura, e marquei o plano.
- **Chegada a Concluídos.** Como a janela é do ticket 04, mover para Concluídos sem a data da publicação não chama o banco e mostra a frase combinada; com a data, move direto (decisão 4 do plano).
- **Revisão e aprovação.** `concluirRevisaoInterna` e `concluirAprovacao` saíram da tela; os registros voltam no ticket 05 de revisoes-aprovacao.
- **`clienteSemTipos.ts`** já foi apagado (nenhum módulo o usa mais). O ticket 04 de publicacao-e-arquivamento só precisa regenerar os tipos.
- **Testes.** Dos modelo anterior, vinte arquivos apagados e quatro novos; a lista está no fim do `plano-25.md`. Total: 2310 testes (eram 2553 antes, pelos testes do modelo anterior que saíram).

**Verificado:** `tsc`, ESLint, circulares (nenhuma), `npm test` (173 arquivos, 2310 testes) e cobertura (97,88% das instruções). Na vitrine local, com módulos falsos: Quadro com as colunas de Não iniciados a Concluídos, selo de 9 dias no processo em Revisão interna, sem selo de dias no suspenso e nos Concluídos, "Sem publicação", avatar e etiqueta no cartão; verso com "Agora · etapa 4 de 8", listas Etapa e Etiqueta, "9 dias nesta etapa", Trocar e Assumir, aviso amarelo do revisor, Etapas com as datas de saída; mover pela lista levou o processo à Modelagem piloto (etapa 2 de 8, quem moveu virou responsável, "desde 24/10/2026").
**Presumido:** o arrastar no Quadro e as janelas de erro vistos só pelos testes (a tela não foi arrastada na vitrine); o comportamento contra o banco migrado (as migrações só vão ao desenvolvimento no ticket 04 de publicacao-e-arquivamento); os critérios `[visual]` de Lista, catálogo e Consulta, que não foram olhados na vitrine; revisão de segurança, de código e `/polir` ainda não rodados nesta iniciativa.

## 2026-10-25 · /ship do Andamento livre (quadro-livre parte 1; cobre processos-etapas, revisoes-aprovacao, exportacao-e-manutencao e publicacao-e-arquivamento)

Ponto de partida da revisão: `marco/2026-10-23-inicio-andamento-livre` (35 commits, 290 arquivos). As entradas das outras três funcionalidades apontam para esta.

- **`/code-review`, eixo Standards (achados corrigidos):**
  - `arquivar` e `desarquivar` do módulo real (`arquivamentoSupabase.ts`) não eram chamados por nenhum teste (33% das linhas). Ganharam `arquivamentoSupabase.test.ts` (as duas chamadas e as recusas viradas em frase). Foi lacuna de cobertura, então o teste passou de primeira.
  - Os outros nove arquivos que o revisor apontou sem teste nominal têm 100% de linhas cobertas pelos testes de integração (cobertura medida), então não eram falta de teste.
- **`/code-review`, eixo Standards (deixado de fora, são julgamentos):** `recusasDoBanco.ts` repete cada motivo em três lugares (regex, mapa e frases) e separa o valor por `split(':')`; `movimentoSupabase.ts` carrega `cliente`, `recusas` e `id` juntos. Ficam para quando o arquivo passar do limite ou ao acrescentar o próximo motivo; o limite de 300 linhas ainda não foi atingido. As duas funções de "hoje" (`hojeLocal` e `hojeEmBrasilia`) são intencionais: a primeira é o dia de quem usa (limite da data digitada e da reunião), a segunda é o dia que o banco usa para contar os dias na etapa.
- **`/code-review`, eixo Spec (corrigido):** a spec manda contar os dias na etapa em dias de calendário no fuso de Brasília, mas o Agora, o corpo do Agora e o cartão usavam o "hoje" do relógio do navegador. Agora usam `hojeEmBrasilia()` (`src/lib/datas.ts`, com teste).
- **`/code-review`, eixo Spec (divergências aceitas, agora registradas):**
  - A frase do Agora da Consulta deixa de repetir os dias depois de 7, porque o selo âmbar já os diz (decisão que estava só em comentário no código); a spec foi ajustada.
  - Registrar a publicação num processo concluído sem publicação grava a data e deixa a explicação antiga no banco até a próxima saída de Concluídos. O invariante "tem data ou explicação" vale; a spec foi ajustada.
  - `bloquear_etapa_protegida` não confere o valor de `ordem` das fixas; a trava é a `conferir_fixas_nas_pontas`, que só olha a primeira e a última. Uma fixa que fique na ponta com outro valor de `ordem` passaria, e o teste 54 não cobre. Sem caminho de uso pela tela (o catálogo só sobe e desce). Fica no backlog.
  - A conversão dos dados do modelo anterior só foi provada pelo teste temporário `99_ensaio_conversao`, apagado depois, como a spec previa.
- **Revisão de segurança do código:** foi a de **reserva** (menos completa): o `/security-review` embutido não achou mudanças porque a branch atual é a `main`. A revisão cobriu o intervalo todo (marcas de sessão que não podem ser forjadas, autorização das funções e políticas novas, `security definer` só em `private`, grants, injeção, dado pessoal no pacote das planilhas, link da publicação). Nenhum achado com confiança de 8/10 ou mais.
- **Banco:** `db reset` e `supabase test db` no Docker local: 1299 `ok`, 0 `not ok`. Workflow "Testes de banco" passa na `quadro-livre-parte-1` (#191, #192) e na `main` (#193, commit `eefa63e`, o último que mexeu em `supabase/`); as seis migrações foram aplicadas no desenvolvimento pelo workflow (#43 a #48). Tipos do remoto em dia (sem diferença). Nenhuma chave secreta no código; toda view nova com `security_invoker`; toda `security definer` em `private` com `search_path` vazio.
- **Migração destrutiva, confirmada pelo usuário em 2026-10-25:** `20261024040942_andamento_livre_sai_o_modelo_anterior` apaga a tabela `andamentos` e as colunas `vai_para_publicacao` (de `processos`) e `obrigatoria` (de `etapas`). O desenvolvimento só tem dado inventado e a produção não existe.
- **Dependência circular:** nenhuma. `package.json` não mudou (auditoria de pacotes e `.scratch/security.md` não rodaram).
- **Tela:** vista na vitrine local (módulos falsos, sem o login real) a 1366×768: Quadro com a coluna Concluídos e o selo "Sem publicação", Agora do concluído (Corrigir publicação e Arquivar), janela de chegada a Concluídos (as duas opções, nenhuma marcada, botão desabilitado, campo de explicação) e janela de registrar publicação. **Não vistas:** as janelas de registrar revisão e aprovação, e qualquer tela com o login real.
- **Conferido por teste e não pela tela:** o arrastar do cartão e a chegada por ele (teste de interface com o aplicativo inteiro).

## 2026-10-25 — /polir do ticket 27 (cara do cartão)

- **Audit (impeccable):** o detector automático não acusou nada nos arquivos do ticket. Revisão de código, sem tela: acessibilidade boa (a barra tem nome acessível "Etapa n de N: nome", a etiqueta e o selo de parado sempre trazem texto ao lado da cor, contraste do texto das etiquetas de 5,2:1 a 7:1, borda do bloco vazio com 3:1). Sem tema escuro no projeto; cores todas por token.
- **Corrigido no `polish` (só CSS, `Quadro.css`):**
  - a faixa vermelha de 4px do cartão parado empurrava o conteúdo 3px para a direita; o padding esquerdo agora encolhe junto;
  - a barra na célula da Lista ganhou largura mínima de 8rem, para os blocos não virarem risco numa coluna estreita;
  - no modo de contraste forçado do sistema (que apaga fundos), os blocos cheio e meio cheio passam a usar `CanvasText`, e o bloco continua distinguível.
- **Deixado de fora:** nenhuma checagem em tela (não há vitrine local pronta e o login real é do usuário), então os cinco critérios `[visual]` do ticket 27 seguem presumidos e a largura mínima de 8rem e a faixa vermelha não foram vistas renderizadas; tema escuro e toque (ferramenta de uso em computador, sem tema escuro previsto).

## 2026-10-25 — /ship da parte 2 do quadro-livre (Cartão e verso: tickets 26 e 27)

Ponto de partida da revisão: `marco/2026-10-25-inicio-quadro-livre-parte-2`.

- **`/code-review`, eixo Spec:** o diff implementa a spec, sem requisito faltando. Parcial, de baixo risco e deixado como está: a "pílula da situação ao lado da barra" do suspenso e do cancelado só existe no cartão do Quadro (pílula Suspenso, que já existia); na Lista a barra fica na coluna Etapa atual e a pílula na coluna Situação.
- **`/code-review`, eixo Spec (escopo extra, aceito):** renomeação cosmética de `--tipo-reuniao` para `--tipo-modelagem`, de `.reuniao-edicao` para `.modelagem-edicao` e de `textoDaReuniao.ts` para `textoDaModelagemPiloto.ts`, coerente com a troca de nome; a largura mínima de 8rem da barra na Lista e o contraste forçado (do `/polir`).
- **`/code-review`, eixo Standards (corrigido):** `diasDoProcessoParado` não tinha teste próprio; ganhou um em `diasNaEtapa.test.ts` (7 dias não, 8 sim, e nunca em Não iniciados nem em suspenso).
- **`/code-review`, eixo Standards (deixado de fora, são julgamentos):** o fallback `—` da etapa repete em `TabelaDeProcessos` e `ProcessosDoSetor`; `hojeLocal()` e `hojeEmBrasilia()` coexistem; `camposIniciais` manda `dataDaModelagemPiloto: ''` no Editar só para satisfazer o tipo (a data fica de fora da gravação do Editar, como a spec manda); a chave antiga `data_da_reuniao` fica em `historicoDosCadastros.ts` de propósito, para ler os eventos gravados antes da troca.
- **Migração com rename, confirmada pelo usuário em 2026-10-25:** `20261025194034_data_da_modelagem_piloto` renomeia `processos.data_da_reuniao` para `data_da_modelagem_piloto`. Preserva os dados (o rename mantém o conteúdo e o privilégio por coluna); recria a view `processos_com_andamento` com `security_invoker = true`, o estado dos eventos e o pacote das planilhas. Já aplicada no desenvolvimento (execução #49); a produção ainda não existe.
- **Tipos:** `db:types` sem diferença real (só final de linha).
- **Revisão de segurança do código:** foi a de **reserva** (menos completa): o `/security-review` embutido não foi rodado, porque a branch atual é a `main` e ele compara com ela. Cobriu a migração e o que chega de fora. Sem achado: a data vai para uma coluna `date` (o banco rejeita valor inválido) e a gravação por `update` passa pela RLS e pelo gatilho que recusa alterar processo arquivado, com testes de banco dos três perfis, do desativado e do visitante; a view e as funções `security definer` mantêm `security_invoker = true` e `search_path` vazio; nenhuma chave secreta em `src/`, `.env.example` ou `supabase/functions/`; as Edge Functions só mudaram nos módulos compartilhados do pacote (a conferência do chamador não mudou).
- **Banco:** `db reset` e `supabase test db` no Docker local: 1299 `ok`, 0 `not ok`. O workflow "Testes de banco" #194 passou na `main` no ticket 26.
- **Cobertura:** 98,25% das linhas, 94,44% dos ramos. **Dependência circular:** nenhuma. `package.json` não mudou (auditoria de pacotes não rodou; o `.scratch/security.md` segue valendo).
- **Tela:** os critérios `[visual]` dos tickets 26 e 27 não foram vistos no aplicativo (sem vitrine local pronta e sem o login real); a Edge Function `planilhas-dos-dashboards` ainda precisa ser republicada no desenvolvimento pelo usuário.

## 2026-10-26 — /polir da Visualização por setores (parte 5 do quadro livre)

Visto na vitrine local (`vitrine.local/setores.html`, fora do git, módulos falsos e dados inventados: cinco setores, um de nome longo, dois inativos, um deles sem processo), em 1280 px de largura.

- **`audit`:** 18/20. Acessibilidade 4 (cada coluna anunciada por sigla, nome e "inativo"; nome do setor em `--texto-2` sobre o fundo com contraste de 5,2:1), desempenho 4, tema 4 (só tokens existentes), responsivo 3 (uso em monitor; colunas rolam na horizontal como nos outros agrupamentos), coerência 3.
- **Corrigido (P2):** a contagem da coluna ficava centralizada no bloco de duas linhas do título por setor, de 9 a 19 px abaixo da sigla e desencontrada entre as colunas. O título passou a alinhar pela linha de base (`align-items: baseline` em `.coluna-titulo`): a contagem fica na linha da sigla em todas as colunas, conferido também nos agrupamentos por etapa e por responsável.
- **Deixado de fora (P3):** a coluna de setor com nome longo tem o título mais alto (61 px contra 42 px), e os cartões dela começam um pouco mais abaixo. Cortar o nome numa linha esconderia o que a escolha "sigla e nome" (pergunta 1 do `/planejar`) quis mostrar.
- **Conferido sem achado:** coluna vazia com "Nenhum processo deste setor no Quadro.", setor inativo sem processo fora, "Só os meus" sem processo com a mensagem de hoje, cartão com barra, etiqueta e avatar e sem sigla, console sem erros.
- **Critérios `[visual]`:** os dois da seção (título em duas linhas sem estourar a coluna com nome longo; marca "inativo" igual à do responsável desativado) vistos na vitrine local, com módulos falsos; não vistos com o login real.

## 2026-10-26 — /ship da Visualização por setores (parte 5 do quadro livre)

Ponto de partida da revisão: `marco/2026-10-26-inicio-quadro-livre-parte-5`.

- **Divergência da spec (esclarecida na spec):** no Quadro por setor o cartão mantém o selo "Sem responsável" junto do avatar, porque a coluna não diz quem cuida; a spec dizia "igual ao do Quadro por responsável", que dispensa o selo. A linha "Cartão" da seção passou a dizer isso.
- **Alinhamento da contagem (do `/polir`):** o `align-items: baseline` vale para o título de todas as colunas (etapa, responsável e setor), não só as por setor; medido na vitrine, a contagem fica na linha do título nos três agrupamentos.
- **`/code-review` do `/implement` (corrigido):** o leitor de tela não ouvia "inativo" na coluna do setor desativado (o `aria-label` encobria a pílula; história 13); a leitura de `agrupar` no endereço usava conversão de tipo à força (trocada por checagem que o compilador acompanha); a fábrica de setor dos testes estava repetida (virou `umSetor`).
- **`/code-review` do `/ship`, eixo Standards (deixado de fora, são julgamentos):** `agrupar` é ramificado em quatro arquivos (cartão, coluna, Quadro, endereço); um mapa único por agrupamento vale a pena se surgir um quarto. `ListaDeProcessos` ganhou `setores` e duas funções passaram a pedir só `etapas` e `processos`; a lista dos setores é lida a cada carga, mesmo fora do Quadro por setor (uma consulta pequena a mais).
- **`/code-review` do `/ship`, eixo Spec:** sem requisito faltando. O filtro Setor com setor inativo sem processo mostra a coluna dele, caso que a lista de filtros não oferece (ela só traz setores com processo).
- **Revisão de segurança do código:** a de **reserva** (o `/security-review` embutido compara a branch atual com a `main`, e a entrega está na `main`). Sem achado: `agrupar` do endereço só vale entre os três valores conhecidos (`Object.hasOwn`, sem cair em nomes do protótipo); `setor` do endereço só é comparado com os ids; a leitura de `setores` passa pela política "setores: ativo lê", que já existia; nenhuma chave nem HTML montado à mão.
- **Sem banco:** nenhuma migração, teste de banco ou função mudou; `package.json` não mudou (o `.scratch/security.md` segue valendo).
- **Cobertura:** 98,97% das linhas, 94,22% dos ramos. **Dependência circular:** nenhuma. **Build:** passa (só o aviso de pacote acima de 500 kB, que já existia).

## 2026-10-27 · Bug: criar processo recusado (permissão da coluna da data da modelagem piloto)

- **O que a spec não dizia:** o ticket 26 renomeou `data_da_reuniao` para `data_da_modelagem_piloto` e fez o cadastro enviar a coluna em toda criação, mas a spec só falava da permissão de alterar. O banco recusava toda criação com 42501 ("permission denied for table processos"), e a tela mostrava "Seu perfil não permite alterar os processos".
- **Correção:** migração `20261027104500_criar_processo_com_data_da_modelagem` (`grant insert` só nessa coluna) e teste de banco 63 (vermelho antes, 11 de 11 depois); spec atualizada na seção Modelo de dados. Aplicada no desenvolvimento pelo workflow "Migrar banco de desenvolvimento".
- **Por que passou:** o teste 32 só marcava a data por alteração, e os testes de tela usam o banco falso, sem permissão por coluna.
- **Julgamentos do code-review (deixados de fora):** o teste 63 não cobre integrante desativado nem subprocesso (caminhos que a correção não toca); `pg_temp.data` repete o nome do teste 32; `pg_temp.criar` recebe a data como literal.
- **`/ship` da correção (2026-10-27), ponto de partida `marco/2026-10-27-antes-correcao-criar-processo`:** sem achado aberto. `code-review` dos dois eixos feito na própria correção. Revisão de segurança do código: a de **reserva** (o `/security-review` embutido compara a branch atual com a `main`, e a correção está na `main`): a migração só dá `insert` em uma coluna de data, sem dado pessoal; a RLS de criação (`pode_alterar_cadastros()`) não mudou; o teste 63 prova a recusa de consulta, administrador inativo e visitante, e que `data_da_validacao` segue sem `insert`. Banco: nenhuma operação destrutiva, view ou função nova, nem chave secreta; tipos em dia (só fim de linha mudava); 52 arquivos de banco verdes no GitHub Actions. Cobertura 98,97% das linhas e 94,27% dos ramos; sem dependência circular; `package.json` não mudou (o `.scratch/security.md` segue valendo).

## 2026-10-27 · Bug: "Não foi possível carregar as anotações" (leitura ambígua)

- **Causa:** a leitura das Anotações pedia `autor:usuarios(nome)`; com `processos.responsavel_id` (migração de 2026-10-24) a tabela passou a ter duas ligações com `usuarios`, e o Supabase recusa o pedido como ambíguo. Nenhum teste pegou, porque o cliente falso não imita a recusa.
- **Correção:** `autor:usuarios!anotacoes_alteradas_por(nome)` em `src/processos/anotacoesSupabase.ts`; teste de regressão no `anotacoesSupabase.test.ts` (confere o pedido). Sem migração. Spec ajustada (seção de dados pessoais das Anotações). As outras leituras com `usuarios(nome)` partem de tabelas com uma ligação só.
- **Limite:** a prova com o Supabase real é abrir as Anotações na tela. **Risco latente:** `movido_por` (passagens) e qualquer tabela que ganhe segunda ligação com `usuarios` pede o mesmo cuidado em embeds.

## 2026-10-27 · Bug: soltar o cartão só em cima do título e barra de rolagem no meio da tela

- **Causa:** `.quadro-colunas` usava `align-items: flex-start`, então cada coluna tinha só a altura dos cartões (29 px numa coluna vazia, medido com o CSS real numa maquete); a `<section>` que recebe o cartão não cobria o resto. A barra de rolagem lateral ficava logo abaixo da coluna mais comprida.
- **Correção (só `Quadro.css`):** a cadeia da área de trabalho até o Quadro ganha altura de 100%; as colunas esticam (680 px de 808 numa coluna vazia), a barra de rolagem lateral encosta na base da tela, e a rolagem vertical passa a ser dentro de cada coluna. Mínimo de 320 px para o Quadro em janela baixa. Spec ajustada (seção do Quadro, "Altura").
- **Achados do code-review tratados:** o respiro dos cartões subiu de 2 px para 4 px (o anel de foco do teclado tem 2 px de contorno e 2 px de afastamento); o mínimo de altura em janela baixa; o respiro de 16 px abaixo da barra de rolagem saiu.
- **Sem teste automático:** o ambiente de teste não calcula layout; a prova foi a medição no navegador com o CSS real. O arrastar de verdade (soltar numa área baixa da coluna) depende de conferência do usuário na tela. Julgamentos deixados de fora: três seletores `:has()` acoplam o CSS à estrutura do DOM (uma classe no wrapper seria mais robusta); é o primeiro `:has()` do projeto (Chrome e Edge 105 ou mais novos).

## 2026-10-27 · Refinamento visual do arrastar o cartão no Quadro

- **Troca:** o realce da coluna de destino deixou de ser `outline: 2px dashed azul` (critério `[visual]` do ticket 21). Agora a coluna sob o cartão (`arrasto.sobre`, qualquer coluna de etapa) ganha fundo `--azul-claro`, borda contínua de 1px em `--azul` e sombra interna suave, com transição de 150 ms; as demais colunas esmaecem (opacidade 0,6). Spec e ticket 21 ajustados.
- **Só `Quadro.css`:** nenhum componente mudou. A borda é `box-shadow: inset`, não `border`, para a coluna não mudar de tamanho; tudo fica para dentro porque a rolagem lateral cortaria o que sai da coluna. `prefers-reduced-motion` já zera transições na regra global de `index.css`; em contraste forçado o destino volta a ter contorno `Highlight`.
- **Julgamento:** o esmaecimento usa `.quadro-colunas:has(.coluna-destino)`, então só acontece quando o cartão está sobre uma coluna (não no instante entre colunas). Segundo `:has()` do projeto, mesma ressalva do desvio anterior. Sem teste automático (jsdom não calcula estilo); depende de conferência na tela.
- **Fora de escopo, como pedido:** espaço "Soltar aqui" e cartão suspenso.

## 2026-10-27 · `/polir` do Quadro (refinamento visual do arrastar)

- **Audit (impeccable):** detector sem achados em `Quadro.css` e `ColunaDoQuadro.tsx`. Nenhum P0, P1 ou P2. Nada foi alterado em código.
- **Deixado de fora (P3, com motivo):**
  - O texto cinza das colunas esmaecidas (opacidade 0,6) cai abaixo de 4,5:1 enquanto o cartão está sobre outra coluna. É um estado de segundos, o conteúdo já era lido antes de arrastar, e o pedido era esmaecer "levemente"; subir a opacidade enfraquece o efeito. Reavaliar se a equipe reclamar.
  - O arrastar usa o arrastar nativo do navegador (HTML5), que não funciona por toque. Já era assim antes; o produto é de uso em desktop (PRODUCT.md), e o celular é opcional.
  - `:has()` acopla o CSS à estrutura do DOM (já registrado nos desvios anteriores).
  - Não há modo escuro no projeto; o realce usa só tokens (`--azul`, `--azul-claro`), então herda um modo escuro futuro. A `color-mix` da sombra interna é o único valor derivado de token.
- **Não conferido na tela:** o arrastar exige login; o resultado visual depende da conferência do usuário.

## 2026-10-27 · `/polir` do macroprocesso fora do cartão (ADR 0029)

- **Audit (impeccable):** detector sem achados em `CartaoDoProcesso.tsx` e `Quadro.css`. Nenhum P0, P1, P2 ou P3 novo. O `polish` não encontrou o que aplicar; nada foi alterado em código.
- **Verificado no código:** o cartão é coluna flex com `gap`, então tirar a linha do topo (no agrupamento por setor) não deixa espaço vazio; a sigla segue com contraste e tokens como antes. Sem cor nem tamanho novos.
- **Não conferido na tela:** o critério `[visual]` 5 (espaçamento regular e cartões alinhados) depende de login; fica para a conferência do usuário.

## 2026-10-28 — /polir de "Ajustes do Quadro e da Lista" (ADR 0032)

- **Audit (impeccable):** detector sem achados novos; o único aviso (`border-radius: 1px` na faixa do cartão, `Quadro.css`) já existia e é o raio de dentro da borda do cartão, intencional. Contraste da etiqueta Em andamento (`#451A03` sobre `#F59E0B`) e da frase da coluna vazia (`texto-2` sobre `fundo`) cobertos por teste. Nenhum P0 ou P1.
- **Corrigido (P2):** comentário de `Quadro.css` ainda dizia que a coluna por setor vai "na altura do Quadro e mesmo vazia"; passou a dizer o que vale desde a ADR 0032.
- **Corrigido (P3):** a contagem de itens do título (posição absoluta, `top: 0`) ficava colada no alto quando o título quebrava em duas linhas; agora é centralizada na altura do título (no Quadro por setor mantém a posição própria).
- **Deixado de fora, com o motivo:** a altura da coluna por setor depende de `align-self: flex-start` com `max-height: 100%`, que só se prova no navegador; não foi vista (a tela exige login). Se não resolver a altura, a coluna cheia deixa de rolar por dentro. Fica para a conferência do usuário, com os critérios `[visual]` 4 a 7.
- **Deixado de fora:** reordenação das colunas ao filtrar e ausência de realce de soltura em coluna de setor vazia (apontadas pelo `/code-review`): a reordenação é a regra da spec e o arrastar só existe no Quadro por etapa.

## 2026-10-28 — /ship de "Ajustes do Quadro e da Lista" (ADR 0032)

- **Revisão de código** (`/code-review` a partir de `01fdafd`, o último commit antes da implementação; o marco `inicio-ajustes-quadro-lista` aponta para um commit mais antigo, que inclui a entrega passada): sem violação dura de padrão e sem requisito faltando. Pontos de julgamento deixados de fora: repetição de seletores no CSS (`.coluna-do-setor, .coluna-inativa`) e da posição da contagem; a definição de "coluna vazia" (`processos.length === 0`) em dois lugares; o teste de contraste da frase da coluna vazia mora em `etiquetasVivas.test.ts`; o `text-align: left` do `.cadastros-abrir` vale para todas as listas de Cadastros, sem efeito visível (nome em célula já é à esquerda).
- **Corrigido na revisão anterior (polimento):** comentário de `Quadro.css` e centralização da contagem do título (ver entrada do `/polir`).
- **Ressalva aberta:** os critérios `[visual]` 4 a 7 e a altura da coluna por setor (`max-height: 100%`) não foram vistos na tela, que exige login; a entrega leva a marca com ressalva.
- **Sem achado:** dependências circulares (nenhuma); `package.json` e banco não mudaram, então o `security-auditor` (relatório de `.scratch/security.md` mantido) e a revisão de segurança do código não se aplicam (mudança só de aparência).

## 2026-10-30 — Bug: o Quadro não rolava ao arrastar o cartão até a borda

- **Causa:** o arrastar é o nativo do navegador, que não rolava o contêiner das colunas na horizontal. A causa provável (não confirmada no navegador) é que a rolagem automática do Chrome pega a lista de cartões da coluna, que só rola na vertical.
- **Correção:** com o cartão levantado, a 60 px de uma borda do Quadro, cada aviso de arrastar rola o Quadro 20 px para aquele lado (`src/processos/rolagemDoArrastar.ts`, ligado em `QuadroDeProcessos`). Teste de regressão em `App.arrastarParaMover.test.tsx`.
- **Spec:** a seção do arrastar não dizia nada sobre rolagem; ganhou a história 215a.
- **Deixado de fora:** rolagem vertical dentro da coluna e da página durante o arrastar (o relato fala da lateral); velocidade proporcional à distância da borda; arrastar por toque (o arrastar nativo não funciona em toque, já era assim).
- **Presumido:** o gesto real no navegador não foi visto (a tela exige login); só o teste em jsdom, com medida e rolagem simuladas.

## 2026-10-30 — /polir do ajuste "Nome do Processo" e seta ▾ nas colunas da Lista

- **Auditoria (CabecalhoDaLista, CamposDoProcesso, Quadro.css):** o detector não achou anti-padrão. Acessibilidade ok: marca `aria-hidden`, nome do botão e `aria-sort` iguais; `--texto-2` sobre branco passa AA; botão do cabeçalho com 24 px de altura (mínimo do WCAG 2.2).
- **Corrigido:** a ▾ e o ▲/▼ tinham a mesma cor, então a coluna que ordena não se destacava. A ▾ ficou em `--icone-inativo` (apagada) e ▲/▼ seguem em `--texto-2` (`data-ordena` no `<span>`).
- **Deixado de fora:** aviso do detector sobre `border-radius: 1px` em `Quadro.css` (linha 262), que é anterior a este ajuste e fora do escopo.
- **Presumido:** o visual não foi visto no navegador (a tela exige login); só typecheck, testes e leitura do CSS.
