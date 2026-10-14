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
