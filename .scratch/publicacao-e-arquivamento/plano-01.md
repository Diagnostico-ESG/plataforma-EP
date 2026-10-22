# Plano do ticket 01 — Escolha de publicação e coluna Concluídos

> Execução com `superpowers:executing-plans`, na branch `publicacao-e-arquivamento-01`. Marque `- [x]` ao fim de cada passo.

**Ticket:** `.scratch/publicacao-e-arquivamento/issues/01-escolha-de-publicacao-e-concluidos.md` (o "o que construir" e os critérios de aceite estão lá; este plano só ordena a execução).
**Spec:** `.scratch/publicacao-e-arquivamento/spec.md` (Modelo de dados, Quem pode o quê, Regras que o banco impõe, Migração, Decisões de teste).

## Regras de `.claude/regras/banco.md` que valem aqui

- Alvo conferido antes de qualquer comando no banco: `supabase/AMBIENTES.md` (vínculo atual `yclkzyoebpsxmgpbcbus`) e `supabase/.temp/project-ref` (mesmo ref, desenvolvimento). Produção não existe.
- Estrutura só por migração criada com `npx supabase migration new`; teste antes da migração.
- Regra de negócio em função ou gatilho, cada função pequena, com nome específico; funções de `public` sem `security definer` (a RLS decide); `security definer` só em `private`, com `search_path` vazio e nomes qualificados.
- Dado derivado não se guarda: concluído e `publicado_em` vêm da view; a escolha é guardada por decisão do ADR 0020, com gatilho testado.
- A view mantém `security_invoker = true` (teste 46).
- Migração, teste de banco e tipos no mesmo commit.
- Testes de banco e migração rodam pelos workflows do GitHub ("Testes de banco" e "Migrar banco de desenvolvimento"), disparados pelo navegador do app na branch (autorizados em "Ajustes deste Projeto"); `git push` da branch sem `--force`.

## Desenho (decisões de execução)

- **Marca da transação:** `private.escolhendo_publicacao()` lê `ep.escolhendo_publicacao`, como `private.mudando_situacao()`. O gatilho `conferir_escolha_de_publicacao` (antes de update em `processos`) recusa `publicacao_so_pela_funcao` quando a coluna muda fora da marca e fora de `private.voltando()`.
- **Evento:** gatilho próprio `registrar_evento_da_escolha_de_publicacao` (depois de update de `vai_para_publicacao`), entidade `processo`, ação `escolher_publicacao` (ou `apagar_escolha_de_publicacao` quando o depois é nulo), `antes`/`depois` com `nome`, `setor_sigla` e `vai_para_publicacao`, e o motivo da volta quando há. `estado_do_processo` não muda (o teste 17 e o pacote das planilhas continuam iguais; o pacote é do ticket 03).
- **`avancar_etapa`:** apagada e recriada com `p_vai_para_publicacao boolean default null`; ordem: conferir nota → resolver → `private.gravar_escolha_de_publicacao(escolhida, p_vai_para_publicacao)` → iniciar a próxima. A escolha só vale ao resolver a `aprovacao_setor` com andamento da `publicacao` pendente depois; sem resposta, `escolha_de_publicacao_obrigatoria`. Fora disso o parâmetro é ignorado.
- **Pular a Publicação no "não":** `private.iniciar_proxima_do_avanco` e `private.conferir_sequencia_do_processo` ignoram o andamento da `publicacao` quando `vai_para_publicacao` é `false`.
- **Volta:** `voltar_a_etapa` ganha `private.apagar_escolha_da_volta(escolhido)` (a escolhida na ordem da `aprovacao_setor` ou antes).
- **View:** um `lateral` calcula `concluido`; a situação usa ele e o `lateral` da etapa atual só procura quando não está concluído. Campos novos no fim: `vai_para_publicacao`, `publicado_em`.
- **Tela:** `ProcessoDaLista` ganha `vaiParaPublicacao?: boolean | null` e `publicadoEm?: string | null`. `concluirEtapa` e `registrarRealizadaAnteriormente` ganham o parâmetro opcional `vaiParaPublicacao`; `ModuloDeRevisoes.concluirAprovacao` também. A pergunta aparece quando a etapa é a `aprovacao_setor`, a ação é concluir ou realizada anteriormente e a próxima pendente é a `publicacao`. Código de etapa e chave da coluna num só lugar: `src/processos/publicacao.ts`.
- **Agora do concluído:** sem corpo de etapa (concluído não tem etapa atual); "Concluído" e, abaixo, "Publicado em dd/mm/aaaa" ou "Não publicado".
- **Concluir a Publicação** (verso ou arrastar) passa a abrir a janela de avanço mesmo sem pendente depois.

---

### Tarefa 0: Branch e marco

- [ ] `git status` limpo; `git switch -c publicacao-e-arquivamento-01`; `git tag marco/2026-10-22-inicio-publicacao-e-arquivamento-01`; `git push origin "refs/tags/marco/*:refs/tags/marco/*"`.

### Tarefa 1: Teste de banco que falha

**Arquivo:** criar `supabase/tests/48_escolha_de_publicacao.test.sql` (molde do `40_aprovacao`: usuários a1 administrador, a2 integrante, a3 consulta, a4 inativo; setor `T48`; auxiliares `andamento`, `agir`, `status`, `processo`, `claims`, `ate_a_aprovacao`, `aprovar(nome, vai)`).

Casos (cada um uma asserção):
- quem pode o quê: ler `vai_para_publicacao` e `publicado_em` (a1, a2, a3 sim; a4 e visitante não); responder a escolha (a1, a2 aceitos; a3, a4 recusados `42501`; visitante recusado); `update processos set vai_para_publicacao` direto recusado (`publicacao_so_pela_funcao`) para a1; eventos da escolha lidos por a3 e não por a4;
- concluir a Aprovação sem escolha recusado (`escolha_de_publicacao_obrigatoria`); "realizada anteriormente" sem escolha recusado;
- "sim": Publicação em andamento com o responsável; processo não concluído, etapa atual `publicacao`;
- "não": Publicação pendente; processo concluído, sem etapa atual nem responsável; `vai_para_publicacao = false`;
- Publicação concluída depois do "sim": concluído e `publicado_em` com a data;
- etapa de teste depois da Publicação (acrescentada por a1 antes de criar o processo): no "não" ela entra em andamento;
- voltar até a Aprovação apaga a escolha (e gera evento `apagar_escolha_de_publicacao` com o motivo); voltar à Publicação mantém "sim";
- nome da `revisao_setor` é "Validação com o setor";
- subprocesso: escolha própria, o pai não muda;
- evento `escolher_publicacao` com antes nulo e depois `true`/`false`, autor;
- por último, Publicação desativada (`update etapas set ativa = false` por a1): Aprovação conclui sem escolha e o processo fica concluído.

- [ ] Escrever o teste.
- [ ] Commit, `git push -u origin publicacao-e-arquivamento-01`, disparar "Testes de banco" na branch: o 48 falha (função/coluna inexistente), os demais passam.

### Tarefa 2: Migração e ensaio

**Arquivos:** `npx supabase migration new escolha_de_publicacao`; ensaios temporários `supabase/tests/98_ensaio_48.test.sql` (o 48 com a migração colada logo depois do cabeçalho) e `supabase/tests/99_ensaio_conversao.test.sql` (monta processos nos quatro estados antigos da tabela "Dados existentes" da spec, cola a migração e confere a escolha e a Publicação dispensada de volta a pendente sem nota).

Conteúdo da migração, na ordem: coluna e privilégio; `escolhendo_publicacao`; gatilho de conferência; gatilho de evento; `gravar_escolha_de_publicacao`; `conferir_sequencia_do_processo` e `iniciar_proxima_do_avanco` com o pulo; `avancar_etapa` (drop/create, revoke/grant); `concluir_aprovacao` com `p_vai_para_publicacao` (drop/create); `apagar_escolha_da_volta` e `voltar_a_etapa`; view; com `session_replication_role = replica` só no trecho: nome da `revisao_setor` (se ainda for "Revisão pelo setor") e a conversão dos dados.

- [ ] Escrever a migração e os dois ensaios; push; "Testes de banco" na branch: os ensaios passam.
- [ ] Apagar os ensaios; commit.
- [ ] Disparar "Migrar banco de desenvolvimento" na branch com o nome do arquivo.
- [ ] "Testes de banco" na branch: o 48 passa; ajustar os testes antigos que falharem pela regra nova (os que concluem a Aprovação passam a responder a escolha; os que esperam o concluído antigo passam a responder "não" ou a esperar a regra nova) até todos ficarem verdes.
- [ ] `npm run db:types` (ou ajuste à mão de `src/types/database.ts`, se a rede barrar); commit único da migração, testes e tipos; registrar a migração em `supabase/AMBIENTES.md`.

### Tarefa 3: Módulos reais (tradução banco ↔ tela)

**Arquivos:** `src/processos/tipos.ts`, `src/processos/processoDaLinha.ts` (+ teste), `src/processos/andamentosSupabase.ts` (+ teste), `src/revisoes/tipos.ts`, `src/revisoes/revisoesSupabase.ts` (+ teste), `src/processos/frasesDeSituacao.ts` ou módulo novo de frases.

- [ ] Testes: `processoDaLinha` lê `vai_para_publicacao` e `publicado_em`; `registrarRealizadaAnteriormente` e `concluirEtapa` mandam `p_vai_para_publicacao` (null quando não vem); `concluirAprovacao` manda a escolha; `escolha_de_publicacao_obrigatoria` vira "Responda se o processo vai para publicação." e `publicacao_so_pela_funcao` vira frase própria.
- [ ] Implementar; `npm test` dos arquivos verde; commit.

### Tarefa 4: Funções puras

**Arquivos:** `src/processos/publicacao.ts` (novo: `CODIGO_DA_PUBLICACAO`, `CHAVE_DOS_CONCLUIDOS`, `perguntaDaPublicacao(acao, etapa, proxima)`, `linhaDaPublicacao(processo)`), `src/processos/colunasDoQuadro.ts`, `src/processos/destinoDoArrastar.ts`, `src/processos/selosDoCartao.ts`, `src/revisoes/frasesDeAprovacao.ts` (aviso da volta) — cada um com teste.

- [ ] `colunasDoQuadro` acrescenta no fim `{ chave: 'concluidos', titulo: 'Concluídos' }` com os concluídos por nome, também sem processos; `colunasPorResponsavel` sem mudança (já filtra).
- [ ] `colunaDeDestino`: Publicação em andamento sem pendente depois → `'concluidos'`; `avancoDoCartao` aceita próxima nula na Publicação.
- [ ] Selo `nao_publicado` ("Não publicado", neutro) no concluído com `vaiParaPublicacao === false`.
- [ ] `linhaDaPublicacao`: "Publicado em dd/mm/aaaa", "Não publicado" ou null.
- [ ] Aviso da volta: "A escolha de publicação será apagada." junto do aviso da aprovação desfeita.
- [ ] Testes verdes; commit.

### Tarefa 5: Implementações falsas

**Arquivos:** `src/processos/andamentoFalso.ts`, `src/processos/ProcessosFalso.ts` (a regra da escolha num módulo novo `src/processos/publicacaoFalso.ts`, para o arquivo ficar abaixo de 300 linhas), `src/revisoes/RevisoesFalso.ts`; teste novo `src/processos/ProcessosFalso.publicacao.test.ts`.

- [ ] Testes: sem escolha recusa com a frase; "sim" inicia a Publicação; "não" pula a Publicação e deixa o processo concluído sem etapa atual nem responsável; concluído pela regra nova em `recalcularProcesso`; voltar até a Aprovação apaga a escolha; Publicação ausente não pede escolha; a falsa de revisões repassa a escolha.
- [ ] Implementar; testes verdes; commit.

### Tarefa 6: Janela de concluir com a pergunta

**Arquivos:** `src/components/processos/PerguntaDaPublicacao.tsx` (novo), `JanelaDeAvanco.tsx`, `JanelasDaEtapa.tsx`, `src/hooks/useAcoesDaEtapa.ts`, `src/hooks/useAprovacaoDaJanela.ts`, `src/processos/gravarAcoes.ts`; teste de tela `src/App.escolhaDePublicacao.test.tsx` (arte: `App.aprovacao`, `App.avancoDaEtapa`, `App.arrastarParaConcluir`).

- [ ] Teste de tela: sem resposta o botão fica desabilitado; "Sim" mostra "Quem fica com a próxima etapa?" e deixa a Publicação em andamento com o responsável; "Não" esconde a escolha e o processo vai a Concluídos; o mesmo na "realizada anteriormente" e pelo arrastar; sem a Publicação no processo, sem pergunta; recusa e falha ao gravar em vermelho sem perder o preenchido; Consulta sem botões.
- [ ] Implementar: rádio Sim | Não sem marcação inicial; título "Concluir Aprovação pelo setor" e botão "Concluir" quando há pergunta; a escolha segue até `concluirAprovacao` e `registrarRealizadaAnteriormente`; concluir a Publicação abre a janela mesmo sem pendente depois.
- [ ] Testes verdes; ajustar os testes de tela antigos que concluem a Aprovação; commit.

### Tarefa 7: Quadro, cartão e verso

**Arquivos:** `ColunaDoQuadro.tsx`, `SelosDoCartao.tsx` (se o tipo novo pedir), `AgoraDoProcesso.tsx`, `VersoDoCartao.tsx` (passa a escolha às janelas), `src/cadastros/historicoDosCadastros.ts` (+ teste); teste de tela `src/App.concluidos.test.tsx` (arte: `App.quadro`, `App.soOsMeus`, `App.agoraDoVerso`, `App.voltarDatasResponsavel`, `App.historico`).

- [ ] Teste de tela: coluna Concluídos no fim, vazia com "Nenhum processo concluído.", por nome, com filtros de setor, macroprocesso e tipo; fora do "Só os meus" e do agrupamento; cartão de lá não arrasta; arrastar a Publicação para Concluídos abre a janela e o processo termina lá; selo "Não publicado"; Agora com "Concluído" e a linha da publicação; aviso da volta; eventos da escolha no histórico ("Respondeu se o processo vai para publicação", "Vai para publicação: Sim").
- [ ] Implementar; testes verdes; commit.

### Tarefa 8: "Validação com o setor" nos textos

- [ ] Trocar "Revisão pelo setor" nas falsas e auxiliares de teste (`src/testes/aprovacaoNoVerso.tsx` e afins), nos comentários de código e no `vitrine.local` quando citar o nome; o nome na tela vem do catálogo. Conferir com `grep -rn "Revisão pelo setor" src`. Commit.

### Tarefa 9: Conferência final

- [ ] `npm test`, `npm run lint`, `npm run typecheck`, `npm run check:circular` verdes.
- [ ] [visual] na vitrine local (falsas), a 1366×768: coluna Concluídos, janela com a pergunta, Agora do concluído, selo "Não publicado".
- [ ] Backlog: o que surgir fora do escopo.
- [ ] Merge na `main` (`git switch main`, `git merge publicacao-e-arquivamento-01`), `git branch -d`, push da `main` e conferência do "Testes de banco" na `main`.
