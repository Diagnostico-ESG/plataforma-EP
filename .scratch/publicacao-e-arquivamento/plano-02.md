# Plano do ticket 02 — Desistir, registrar publicação e arquivar

> Execução com `superpowers:executing-plans`, na branch `publicacao-e-arquivamento-02`. Marque `- [x]` ao fim de cada passo.

**Ticket:** `.scratch/publicacao-e-arquivamento/issues/02-desistir-registrar-publicacao-e-arquivar.md` (o "o que construir" e os critérios de aceite estão lá; este plano só ordena a execução).
**Spec:** `.scratch/publicacao-e-arquivamento/spec.md` (Modelo de dados, Quem pode o quê, Regras que o banco impõe, Regras de estado, Decisões de teste).

## Regras de `.claude/regras/banco.md` que valem aqui

- Alvo conferido antes de qualquer comando no banco: `supabase/AMBIENTES.md` (vínculo atual `yclkzyoebpsxmgpbcbus`) e `supabase/.temp/project-ref` (mesmo ref, desenvolvimento). Produção não existe.
- Estrutura só por migração criada com `npx supabase migration new`; teste antes da migração.
- Regra de negócio em função ou gatilho, cada função pequena, com nome específico; funções de `public` sem `security definer` (a RLS decide); `security definer` só em `private` (gatilhos de evento), com `search_path` vazio e nomes qualificados.
- Dado derivado não se guarda: "não publicado" e `publicado_em` continuam vindo da view; `arquivado_em` é marca guardada (spec, Regras de estado), com gatilho testado.
- A view mantém `security_invoker = true` (teste 46).
- Migração, teste de banco e tipos no mesmo commit.
- Testes de banco e migração pelos workflows do GitHub ("Testes de banco" e "Migrar banco de desenvolvimento"), disparados pelo navegador do app na branch (autorizados em "Ajustes deste Projeto"); `git push` da branch sem `--force`.

## Desenho (decisões de execução)

**Marcas da transação** (como `ep.escolhendo_publicacao` do ticket 01; só as funções as ligam e desligam):

- `ep.escolhendo_publicacao` (já existe) passa a valer também dentro de `nao_vai_mais_para_publicacao` e `registrar_publicacao`. Com ela ligada, `private.preparar_andamento` sai cedo, como na volta (a transição em andamento → pendente e pendente → concluída da Publicação), e `private.registrar_evento_do_andamento` não grava evento (o evento do processo conta o que houve).
- `ep.liberando_arquivado` (nova, lida por `private.liberando_arquivado()`): ligada em `arquivar_processo`, `desarquivar_processo` e `registrar_publicacao`. Libera a coluna `arquivado_em` e a trava do arquivado.
- `ep.evento_da_publicacao` (nova): jsonb em texto com `acao`, `motivo` e, no registro, `publicado_em`. O gatilho `registrar_evento_da_escolha_de_publicacao` usa a ação dela (senão, a do ticket 01), acrescenta o motivo e põe `publicado_em` no antes (nulo) e no depois.

**Recusas** (P0001 "motivo:valor"): `publicacao_nao_se_dispensa`, `publicacao_fora_de_andamento`, `publicacao_so_no_concluido:<situação>`, `publicacao_ja_registrada`, `sem_publicacao_pendente`, `data_da_publicacao_obrigatoria`, `publicacao_antes_da_aprovacao:<data>:<aprovada_em>`, `arquivar_so_concluido:<situação>`, `ja_arquivado`, `nao_arquivado`, `processo_arquivado`, `arquivamento_so_pela_funcao`; reaproveitadas: `motivo_obrigatorio`, `data_no_futuro:<data>`, `registro_inexistente`, 42501.

**Funções novas** (sem `security definer`; zero linhas no `update` = RLS recusando, 42501):

- `nao_vai_mais_para_publicacao(p_processo, p_motivo)`: motivo aparado obrigatório; processo inexistente → `registro_inexistente`; sem andamento da `publicacao` em andamento → `publicacao_fora_de_andamento`; com as marcas, `vai_para_publicacao = false` e a Publicação pendente, sem responsável, datas e nota. Processo suspenso cai no `processo_parado` do andamento.
- `registrar_publicacao(p_processo, p_data, p_nota)`: lê a linha da view; ordem das recusas: inexistente, não concluído, já publicado (`publicado_em` não nulo), sem Publicação pendente, data nula, data > `private.hoje()`, data < `aprovacoes.aprovada_em`; com as marcas, Publicação concluída com início e fim na data e `vai_para_publicacao = true`; nota aparada (vazia = nula) no evento. O arquivado continua arquivado.
- `arquivar_processo(p_processo)`: pela view; já arquivado → `ja_arquivado`; fora de concluído → `arquivar_so_concluido`; `arquivado_em = now()`.
- `desarquivar_processo(p_processo)`: não arquivado → `nao_arquivado`; `arquivado_em = null`.

**Trava do arquivado:**

- `private.conferir_processo_em_andamento` (recriada): também recusa `processo_arquivado` fora de `ep.liberando_arquivado`. Cobre andamentos (voltar, datas, responsável, avançar), revisões internas e aprovações (incluir e editar).
- Gatilho novo `conferir_processo_arquivado` (antes de update ou delete em `processos`): arquivado fora da marca → `processo_arquivado` (editar, suspender, cancelar, reclassificar, excluir, data da reunião). Exceção: a mudança só do `macroprocesso_id` vinda do gatilho do pai (`pg_trigger_depth() > 1`), para o subprocesso arquivado não travar a edição do pai (spec: "sem depender do pai").
- Versões e arquivos: nada novo. `private.conferir_processo_que_recebe_versao` já recusa processo concluído (`processo_fora_de_andamento:concluido`), e o arquivado é concluído; o teste prova.
- Gatilho `conferir_arquivamento` (antes de update de `arquivado_em`): fora da marca → `arquivamento_so_pela_funcao`. `grant update (arquivado_em)` a logado.
- Gatilho `registrar_evento_do_arquivamento` (depois de update de `arquivado_em`, `security definer`): entidade `processo`, ação `arquivar` ou `desarquivar`, antes/depois com `nome` e `setor_sigla`.

**Dispensar:** `private.conferir_dispensa` (recriada) recusa `publicacao_nao_se_dispensa` para a `publicacao`; "realizada anteriormente" segue.

**View:** `processos_com_andamento` recriada igual à do ticket 01, com `p.arquivado_em` no fim.

**Tela:**

- `ProcessoDaLista` ganha `arquivadoEm?: string | null`. `ModuloDeProcessos` ganha `naoVaiMaisParaPublicacao(id, motivo)`, `registrarPublicacao(id, data, nota)`, `arquivar(id)` e `desarquivar(id)`; a real num módulo novo `src/processos/publicacaoSupabase.ts`, com as recusas pelo `falhaDoAndamento`.
- Frases em `src/processos/frasesDePublicacao.ts` (`porExtenso` passa a ser exportado de `frasesDeSituacao.ts`).
- `acoesDaEtapa` não oferece `dispensar` na Publicação.
- "Não vai mais para publicação": item do "⋯" da etapa no `EtapaDoAgora` (Publicação em andamento), que abre a janela de motivo do padrão de suspender (pedido `nao_publicar` em `pedidosDeSituacao.ts` e `AcoesDeSituacao.tsx`).
- Agora do concluído e do arquivado num componente novo `AgoraDoConcluido.tsx` (sai o `SituacaoConcluida` do `AgoraDoProcesso`). Arquivar e Desarquivar gravam pelo `executar`, sem janela.
- Janela nova `JanelaDaPublicacao.tsx` no molde da `JanelaDaAprovacao` (`JanelaDeEdicao` + `useGravacaoNaJanela`): Data da publicação (`type="date"`, hoje, `max` hoje, `min` na `aprovadaEm` lida pelo `CaminhoDoProcesso`) e Nota (até 2.000 caracteres, com a orientação de não anotar dado pessoal).
- No arquivado, `VersoDoCartao` passa `podeAlterar && !arquivadoEm` às ações do "⋯", às versões, à reunião e às gavetas; o Agora recebe o `podeAlterar` real.
- Coluna Concluídos sem os arquivados. Lista com o selo "Arquivado" (pílula) e o filtro `arquivados` (`'esconder' | null`, só na Lista, no endereço).
- Falsa: regras num módulo novo `src/processos/arquivamentoFalso.ts`; `ProcessosFalso` ganha os quatro métodos e `dataDaAprovacao: ((processoId) => string | null) | null`, ligado pela `RevisoesFalso` como o `aoVoltar`.

---

### Tarefa 0: Branch e marco

- [x] `git status` limpo; `git switch -c publicacao-e-arquivamento-02`; `git tag marco/2026-10-22-inicio-publicacao-e-arquivamento-02`; `git push origin "refs/tags/marco/*:refs/tags/marco/*"`.

### Tarefa 1: Teste de banco que falha

**Arquivo:** criar `supabase/tests/49_arquivar_e_registrar_publicacao.test.sql` (molde do 48: a1 administrador, a2 integrante, a3 consulta, a4 inativo; setor `T49`; auxiliares `processo`, `andamento`, `agir`, `status`, `linha`, `escolha`, `enviar_completa`, `ate_a_aprovacao`, `aprovar(nome, vai)`, e `arquivado(nome)`; dois macroprocessos, para o caso do pai).

Casos (critério de aceite 1 do ticket, cada item uma asserção):
- dispensar a Publicação recusado (`publicacao_nao_se_dispensa`), por `avancar_etapa` e por `update` direto; "realizada anteriormente" na Publicação aceita;
- desistir: sem motivo recusado; com a Publicação pendente recusado (`publicacao_fora_de_andamento`); aceito: escolha `false`, Publicação pendente sem responsável, datas e nota, processo concluído, evento `nao_vai_mais_para_publicacao` com o motivo e o antes/depois da escolha, sem evento de andamento;
- registrar publicação: em andamento recusado; já publicado recusado; data de amanhã recusada; data antes de `aprovada_em` recusada; sem `aprovada_em`, data antiga aceita; aceito: escolha `true`, Publicação concluída com início e fim na data, `publicado_em` na view, situação concluído, evento `registrar_publicacao` com a nota e a data; aceito no arquivado, que continua arquivado;
- arquivar: em andamento, suspenso e cancelado recusados (`arquivar_so_concluido`); aceito no concluído, que sai de concluído não arquivado (`arquivado_em` preenchido, situação ainda `concluido`); duas vezes recusado (`ja_arquivado`); desarquivar não arquivado recusado (`nao_arquivado`); desarquivar aceito; eventos `arquivar` e `desarquivar` com autor;
- no arquivado, recusados com `processo_arquivado`: voltar etapa, corrigir datas, trocar responsável, editar a aprovação, editar o processo, suspender, cancelar, reclassificar, excluir; enviar versão e substituir arquivo recusados (`processo_fora_de_andamento`);
- `update processos set arquivado_em` direto recusado (`arquivamento_so_pela_funcao`) para a1;
- subprocesso arquivado sem mexer no pai; editar o macroprocesso do pai com o filho arquivado aceito, e o filho acompanha;
- quem pode o quê: desistir, registrar, arquivar e desarquivar aceitos para a1 e a2, recusados para a3 (42501), a4 (`registro_inexistente`) e visitante (42501); ler `arquivado_em` (a1, a2, a3 sim; a4 e visitante não); eventos novos lidos por a3 e não por a4.

- [x] Escrever o teste.
- [x] Commit, `git push -u origin publicacao-e-arquivamento-02`, disparar "Testes de banco" na branch: o 49 falha (função ou coluna inexistente), os demais passam.

### Tarefa 2: Migração e ensaio

**Arquivos:** `npx supabase migration new arquivar_e_registrar_publicacao`; ensaio temporário `supabase/tests/98_ensaio_49.test.sql` (o 49 com a migração colada logo depois do cabeçalho).

Conteúdo da migração, na ordem: coluna `arquivado_em` e privilégio; `liberando_arquivado`; `conferir_arquivamento` e gatilho; `registrar_evento_do_arquivamento` e gatilho; `conferir_processo_em_andamento` recriada; `conferir_processo_arquivado` e gatilho; `conferir_dispensa` recriada; `preparar_andamento` e `registrar_evento_do_andamento` recriadas com a saída pela `escolhendo_publicacao`; `registrar_evento_da_escolha_de_publicacao` recriada com `ep.evento_da_publicacao`; as quatro funções públicas; `revoke`/`grant`; a view.

- [x] Escrever a migração e o ensaio; push; "Testes de banco" na branch: o ensaio passa.
- [x] Apagar o ensaio; commit.
- [x] Disparar "Migrar banco de desenvolvimento" na branch com o nome do arquivo.
- [x] "Testes de banco" na branch: o 49 passa; ajustar os testes antigos que falharem pela regra nova (o 18 dispensa a Publicação por `update` direto: passa a esperar a recusa ou a usar a "realizada anteriormente") até todos ficarem verdes.
- [x] `npm run db:types` (ou ajuste à mão de `src/types/database.ts`, se a rede barrar); commit único da migração, testes e tipos; registrar a migração em `supabase/AMBIENTES.md`. (Desvio: a migração entrou no commit do ensaio, antes dos tipos, porque o pre-commit roda o typecheck no projeto inteiro e o trabalho da tarefa 3 estava pela metade.)

### Tarefa 3: Módulo real e frases

**Arquivos:** `src/processos/tipos.ts`, `src/processos/processoDaLinha.ts` (+ teste; e a seleção em `listaDeProcessosSupabase.ts`/`lerProcessoSupabase.ts`, se listar colunas), `src/processos/publicacaoSupabase.ts` (novo, + teste), `src/processos/processosSupabase.ts`, `src/processos/andamentosSupabase.ts` (+ teste: padrão e frases), `src/processos/frasesDePublicacao.ts`, `src/processos/frasesDeSituacao.ts`.

- [x] Testes: `processoDaLinha` lê `arquivado_em`; cada método novo chama a função do banco com `p_processo` (e `p_motivo`, `p_data`, `p_nota`, nota vazia como null); cada código de recusa da lista do Desenho vira a frase (inclusive "A Publicação não se dispensa: use \"Não vai mais para publicação\"." e a data antes da aprovação com as duas datas); 42501 vira "Seu perfil não permite alterar os processos.".
- [x] Implementar; `npm test` dos arquivos verde; commit.

### Tarefa 4: Funções puras

**Arquivos:** `src/processos/caminhoDeEtapas.ts` (+ teste), `src/processos/colunasDoQuadro.ts` (+ teste), `src/processos/enderecoDosProcessos.ts` (+ teste), `src/processos/filtrosDosProcessos.ts` (+ teste), `src/processos/publicacao.ts` (+ teste), `src/cadastros/historicoDosCadastros.ts` (+ teste).

- [x] `acoesDaEtapa`: Publicação em andamento sem `dispensar`. (Os códigos das etapas foram para `src/processos/codigosDasEtapas.ts`, sem dependências, para `caminhoDeEtapas` e `publicacao` não se importarem em círculo.)
- [x] Coluna Concluídos sem os arquivados.
- [x] Filtro `arquivados`: lido e escrito só na Lista (`arquivados=esconder`), fora de `SEM_FILTROS`, conta em `temFiltro`; `filtrarProcessos` esconde os arquivados com `'esconder'`.
- [x] `publicacao.ts`: dispensado; o `naoPublicado` que já existe serve ao [Registrar publicação], e "Arquivado" fica no componente do Agora.
- [x] Histórico: ações `nao_vai_mais_para_publicacao` ("Registrou que o processo não vai mais para publicação", com Motivo), `registrar_publicacao` ("Registrou a publicação", com Nota), `arquivar` ("Arquivou o processo"), `desarquivar` ("Desarquivou o processo"); campo `publicado_em` ("Data da publicação", em dd/mm/aaaa).
- [x] Testes verdes; commit.


### Tarefa 5: Implementação falsa

**Arquivos:** `src/processos/arquivamentoFalso.ts` (novo), `src/processos/situacaoFalso.ts` (trava do arquivado em `conferirProcessoEmAndamento` e `mudarSituacao`), `src/processos/ProcessosFalso.ts`, `src/revisoes/RevisoesFalso.ts` (liga `dataDaAprovacao`); teste novo `src/processos/ProcessosFalso.arquivamento.test.ts`.

- [x] Testes: desistir sem motivo ou fora de andamento recusado, aceito deixa concluído e "não"; registrar com data futura, antes da aprovação, em andamento e já publicado recusados, aceito deixa publicado na data e onde estava; arquivar fora de concluído e duas vezes recusado; desarquivar não arquivado recusado; etapa, situação, edição e exclusão do arquivado recusadas; `falhaDeGravacao` vale nos quatro.
- [x] Implementar; testes verdes; commit. (A trava do arquivado ficou na `ProcessosFalso`, com `conferirNaoArquivado` de `arquivamentoFalso.ts`; `situacaoFalso.ts` não mudou.)


### Tarefa 6: Desistir da publicação no verso

**Arquivos:** `src/components/processos/EtapaDoAgora.tsx`, `AgoraDoProcesso.tsx`, `AcoesDeSituacao.tsx`, `src/processos/pedidosDeSituacao.ts`; teste de tela `src/App.naoVaiMaisParaPublicacao.test.tsx` (arte: `App.agoraDoVerso`, `App.situacaoDoProcesso`, `App.escolhaDePublicacao`).

- [x] Teste de tela: o "⋯" da Publicação não tem Dispensar; tem "Não vai mais para publicação", que pede motivo e leva o processo a Concluídos com o selo "Não publicado"; recusa vinda de fora ("A Publicação não se dispensa…") e falha ao gravar em vermelho sem perder o motivo; Consulta sem o item. (Desvio: como Suspender, a janela de motivo fecha ao confirmar, e a recusa ou falha aparece em vermelho no verso; o motivo não fica guardado.)
- [x] Implementar; testes verdes (e os antigos que dispensavam a Publicação, ajustados para outra etapa opcional); commit.

### Tarefa 7: Agora do concluído e do arquivado, Registrar publicação

**Arquivos:** `src/components/processos/AgoraDoConcluido.tsx` (novo), `JanelaDaPublicacao.tsx` (novo), `AgoraDoProcesso.tsx`, `CaminhoDoProcesso.tsx` (passa `aprovadaEm` e trava as gavetas no arquivado), `VersoDoCartao.tsx`, `src/processos/gravarAcoes.ts` (`gravarPublicacao`), `Agora.css` se preciso; testes de tela `src/App.arquivamento.test.tsx` e `src/App.registrarPublicacao.test.tsx` (arte: `App.concluidos`, `App.agoraDoVerso`, `App.editarRegistros`, `App.historico`).

- [x] Teste de tela (arquivamento): concluído com [Arquivar] principal e [Registrar publicação] só quando não publicado; arquivar tira de Concluídos; o verso do arquivado mostra "Arquivado", [Desarquivar] e, se não publicado, [Registrar publicação], sem "⋯" de alteração, gavetas, versões ou reunião editáveis; desarquivar devolve a Concluídos; eventos no histórico; falha ao gravar em vermelho; Consulta sem botões.
- [x] Teste de tela (registrar): data vem com hoje, `max` hoje e `min` na aprovação; recusa de data futura e anterior à aprovação sem perder o preenchido; "Salvando…"; depois, "Publicado em dd/mm/aaaa" e o processo onde estava (Concluídos ou arquivado); botão ausente no publicado; histórico com a nota. ("Salvando…" é da `JanelaDeEdicao`, já testada; não ganhou caso próprio.)
- [x] Implementar; testes verdes; commit.

### Tarefa 8: Lista com selo e filtro

**Arquivos:** `src/components/processos/TabelaDeProcessos.tsx`, `FiltrosDosProcessos.tsx` (e quem monta os filtros da Lista); teste de tela `src/App.listaDosArquivados.test.tsx` (arte: `App.lista`, `App.filtrosDosProcessos`).

- [ ] Teste de tela: selo "Arquivado" ao lado da situação; "Arquivados: Esconder" some com ele e põe `arquivados=esconder` no endereço; o endereço com o filtro abre a Lista filtrada; [Limpar filtros] volta a "Mostrar"; o filtro não aparece no Quadro; Consulta vê selo e filtro.
- [ ] Implementar; testes verdes; commit.

### Tarefa 9: Conferência final

- [ ] `npm test`, `npm run lint`, `npm run typecheck`, `npm run check:circular` verdes.
- [ ] [visual] na vitrine local (falsas), a 1366×768: Agora do concluído e do arquivado alinhados no verso; selo "Arquivado" no estilo das pílulas; janela de Registrar publicação.
- [ ] Backlog: o que surgir fora do escopo.
- [ ] Merge na `main` (`git switch main`, `git merge publicacao-e-arquivamento-02`), `git branch -d`, push da `main` e conferência do "Testes de banco" na `main`.
