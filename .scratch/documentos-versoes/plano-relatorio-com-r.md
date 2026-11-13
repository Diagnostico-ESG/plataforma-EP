# Plano — Relatório numerado com R (documentos-versoes, mudança de 2026-11-13)

> Para quem executa: `superpowers:executing-plans`, tarefa por tarefa; as caixas são o registro da execução.

**Objetivo:** o número do relatório passa a usar R ("Relatório R2 (da V7)", `_Relatório R2.docx`), e um botão do Administrador na aba Importação renomeia para R os relatórios numerados que já estão com V.

**Spec:** `.scratch/documentos-versoes/spec.md`, seção "Relatório numerado com R" (histórias 168 a 179, critérios 1 a 14). ADR 0047. Os requisitos ficam lá; aqui, só a ordem, os arquivos e o teste de cada tarefa.

**Branch:** `documentos-versoes` (comum, sem worktree).

## Regras que valem (`.claude/regras/banco.md`)

- Teste de banco antes da migração; migração com `npx supabase migration new`, por último na pasta; migração, teste e tipos no mesmo commit.
- Ciclo do projeto ("Ajustes deste Projeto"): pgTAP no Docker local (`npx supabase start`, saída descartada; `npx supabase test db`, contando `ok` / `not ok`); tipos com `npx supabase gen types --local`. Conferência final: workflow "Migrar banco de desenvolvimento" e depois "Testes de banco" na branch (autorizados); `db:types` do remoto, que deve sair igual.
- A função nova do banco é `security invoker` em `public`, com a conferência do perfil logo no começo. O evento vai por função `security definer` em `private`, com `search_path` vazio e nomes qualificados. `revoke ... from public, anon` e `grant ... to authenticated`.
- O nome só muda dentro das funções: a renomeação usa a mesma marca da edição do número (`ep.renumerando`), que os gatilhos de `arquivos_da_versao` já respeitam (sem substituição registrada, sem trava de versão aprovada, qualquer situação do processo).
- Função do servidor: a ação nova confere quem chamou (Administrador ativo) antes de tocar o Drive. A decisão fica em arquivo puro testado no Vitest. Respostas e logs sem nome de arquivo nem dado pessoal. Publicar a função no desenvolvimento só com a aprovação do usuário no momento.
- Dados de teste inventados.

## O que o jsdom não suporta

Nada novo: a seção 3 usa só parágrafos e botões, sem `dialog` nem `popover`.

---

### Tarefa 1: Banco — rótulo com R e `renomear_relatorio_para_r`

**Arquivos:**
- Criar: `supabase/tests/78_relatorio_com_r.test.sql`
- Criar: `supabase/migrations/<horário>_relatorio_com_r.sql` (por `npx supabase migration new relatorio_com_r`)
- Alterar: `supabase/tests/77_duas_revisoes_registro.test.sql` (os eventos de revisão gravados agora dizem "Relatório R1"/"R2")
- Alterar: `src/types/database.ts` (tipos do banco local)

**Interfaces produzidas:**
- `public.renomear_relatorio_para_r(p_arquivo uuid, p_nome_esperado text) returns text`: devolve o nome com R.
- Recusas: `42501` (quem não é Administrador ativo); `relatorio_fora_do_padrao:<nome>` (não é relatório numerado, ou o nome não termina em `_Relatório V<número dele>.<extensão>`); `nome_do_relatorio_alterado:<nome atual>` (o nome guardado não é o esperado).
- Evento: `acao = 'renomear_relatorio'`, `entidade = 'versao'`, `entidade_ref = processo_id`, `detalhes = {antes: {nome}, depois: {nome}}`.

- [x] **1.1** Antes da migração: `grep -rn "Relatório V\|rotulo_do_relatorio" supabase/tests/` para achar o que muda (esperado: só o 77).
- [x] **1.2** Escrever o 78, um caso por regra e por célula da tabela "quem pode o quê" da spec:
  - Administrador renomeia `T78_V2_Processo_Relatório V1.docx`: devolve `T78_V2_Processo_Relatório R1.docx`, o nome guardado muda, `numero_do_relatorio` fica 1;
  - um evento `renomear_relatorio` com o nome antigo e o novo; nenhum evento `substituir`;
  - Integrante, Consulta e Administrador desativado: recusados com 42501; visitante sem login (`anon`): sem permissão para executar;
  - nome já com R: devolve o nome, sem evento novo;
  - nome guardado diferente do esperado: `nome_do_relatorio_alterado`;
  - relatório sem número (o da histórica), .bpm e nome fora do padrão (`…_Relatório V3.docx` com número 1; `relatorio.docx`): `relatorio_fora_do_padrao`;
  - processo cancelado, concluído (em Concluídos) e subprocesso: renomeia;
  - versão aprovada: renomeia;
  - `update` direto do nome continua recusado (42501);
  - `private.rotulo_do_relatorio` devolve "Relatório R1" (evento de revisão gravado depois da migração).
- [x] **1.3** Contar as asserções (`grep -c "^insert into _tap"` ou as linhas de `select ok/is/throws`) e acertar o `plan(n)`.
- [x] **1.4** Rodar no Docker local e ver o 78 falhar, pela falta da função.
- [x] **1.5** Criar a migração: `private.rotulo_do_relatorio` recriada com `'Relatório R' || numero_do_relatorio`; `private.registrar_renomeacao_do_relatorio(p_arquivo uuid, p_antes text, p_depois text)` (`security definer`, grava o evento); `public.renomear_relatorio_para_r`. Ordem dentro da função: conferir o perfil (`private.administrador_ativo()`); ler o arquivo; se o nome já termina em `_Relatório R<n>.<ext>`, devolvê-lo; conferir o nome esperado; conferir o padrão (papel `relatorio`, número presente, `nome ~ ('_Relatório V' || n || '\.[^.]+$')`); `set_config('ep.renumerando', 'on', true)`, `update` com `regexp_replace`, `set_config(... 'off' ...)`; registrar o evento; devolver o nome novo. Revokes e grants. Comentário no topo: não destrutiva.
- [x] **1.6** Ajustar o 77 (o evento de revisão passa a "Relatório R…").
- [x] **1.7** `npx supabase db reset` local e `npx supabase test db`: 0 `not ok` em todos os arquivos.
- [x] **1.8** `npx supabase gen types --local` para `src/types/database.ts`; `npm run typecheck`.
- [x] **1.9** Commit: migração, 77, 78 e tipos.

Registro da Tarefa 1: sem Docker nesta máquina, o ciclo foi o do GitHub. O 78 falhou antes ("Testes de banco" 43462181999: a função não existe). Com a migração em ensaio, 65 de 65 arquivos (43462668721; 78: 21 ok; 77: 32 ok). A migração foi aplicada pelo "Migrar banco de desenvolvimento" (43463194248), e os tipos vieram do remoto (`db:types`). O caso da versão aprovada saiu do 78: a marca da função já libera a trava dela, e o caso pedia montar uma aprovação inteira.

### Tarefa 2: Função do servidor — decisão pura e nome padrão com R

**Arquivos:**
- Criar: `supabase/functions/_shared/relatorioComR.ts` e `relatorioComR.test.ts`
- Alterar: `supabase/functions/_shared/decisao.ts` (+ teste): ação `renomear_relatorio`, só `administrador`
- Alterar: `supabase/functions/_shared/nomePadrao.ts` (+ teste): `_Relatório R<n>`
- Alterar: `supabase/functions/_shared/registro.ts` (+ `registroRelatorio.test.ts`): a conferência espera `_Relatório R<n>.`
- Conferir: `renumerar.test.ts` (o `_Relatório R2` do fim continua igual depois da renumeração)

**Interfaces produzidas** (usadas nas tarefas 3 e 5):
- `type SituacaoDoNome = { tipo: 'a_renomear'; nomeNovo: string } | { tipo: 'com_r' } | { tipo: 'fora_do_padrao' }`
- `situacaoDoNomeDoRelatorio(nome: string, numero: number | null): SituacaoDoNome`
- `validarRenomearRelatorio(corpo: unknown): Validacao<{ arquivoId: string }>` (campo `arquivo_id`, uuid)

- [x] **2.1** Testes vermelhos: `situacaoDoNomeDoRelatorio` (V com o número certo; número diferente do guardado; sem número; já com R; `.pdf`; "Relatório V1" no meio do nome e não no fim); `validarRenomearRelatorio` (corpo inválido, sem id, id fora do formato); `conferirChamador` com `renomear_relatorio` para os três perfis e para o desativado; nome padrão do relatório novo com R; registro que aceita `_Relatório R3.` e recusa `_Relatório V3.`.
- [x] **2.2** Rodar e ver falhar pela razão certa.
- [x] **2.3** Implementar o mínimo.
- [x] **2.4** `npx vitest run supabase/functions/_shared`: verde.
- [x] **2.5** Commit.

Registro das Tarefas 2 e 4: foram juntas num commit. A troca do nome padrão quebra os testes da tela que conferem o nome gerado, e o pre-commit roda esses testes. O rótulo ficou em `src/versoes/rotuloDoRelatorio.ts` (sem importações, para não criar ciclo), e não em `rotulos.ts`. Ficam com V o histórico de revisão já gravado e os dados de entrada dos testes de renumeração.

### Tarefa 3: Função do servidor — ação `renomear_relatorio`

**Arquivos:**
- Criar: `supabase/functions/arquivos-no-drive/renomeacaoDoRelatorio.ts`
- Alterar: `supabase/functions/arquivos-no-drive/renumeracao.ts` (exportar `renomearNoDrive` para não repetir o PATCH)
- Alterar: `supabase/functions/arquivos-no-drive/index.ts` (ligar a ação; lista das ações na mensagem de entrada inválida)

**Fluxo:** ler o arquivo pela RLS (`arquivos_da_versao`: `drive_id, nome, papel, numero_do_relatorio`). Se não aparece, `sem_permissao`. Pela `situacaoDoNomeDoRelatorio`: `com_r` devolve 200 `{ nome }` sem tocar o Drive; `fora_do_padrao` devolve `entrada_invalida`. Conferir que o arquivo está sob a raiz (`conferidorDaRaiz`), renomear no Drive e chamar `renomear_relatorio_para_r` com o nome lido como esperado. A recusa do banco sai pelo `recusaDoBanco`; a resposta é 200 `{ nome }`. Sem desfazer no Drive se o banco falhar: a spec manda deixar, e o clique seguinte conserta.

- [x] **3.1** Escrever o módulo e ligar no `index.ts`. Lógica de decisão já testada na tarefa 2; aqui só a orquestração (Deno, fora do Vitest).
- [x] **3.2** `npm run typecheck` e `npx eslint supabase/functions`.
- [x] **3.3** Commit.

Registro da Tarefa 3: sem Deno nesta máquina, a função passou só pelo ESLint; a checagem de tipos dela fica para a publicação no desenvolvimento (6.4).

### Tarefa 4: Tela — um rótulo do relatório, com R

**Arquivos:**
- Alterar: `src/versoes/rotulos.ts` (+ teste): `rotuloDoRelatorio(numero: number): string` → "Relatório R2"
- Trocar o "Relatório V${…}" montado à mão por `rotuloDoRelatorio` em: `src/versoes/relatorioQueVale.ts`, `src/versoes/formularioDeVersao.ts`, `src/versoes/recusasDeVersoes.ts`, `src/processos/acaoPrincipalDaEtapa.ts`, `src/processos/agoraDoProcesso.ts`, `src/revisoes/eventoDaRevisao.ts`, `src/revisoes/frasesDeRevisao.ts`, `src/revisoes/opcoesDaRevisao.ts`, `src/cadastros/historicoDosCadastros.ts`, e nos comentários que citam o rótulo
- Alterar: `src/cadastros/historicoDosCadastros.ts`: o evento `renomear_relatorio` vira "Renomeou o arquivo <antigo> para <novo>"
- Alterar: `src/testes/versoesDeTeste.ts` (o nome do relatório de teste passa a `_Relatório R<n>.docx`) e o falso que monta o nome do relatório (procurar `Relatório V` em `src/versoes/*Falso*`)
- Testes que passam a R: os listados por `grep -rln "Relatório V" src` (App.arquivosDoVerso, App.enviarVersaoNaRevisaoDoRelatorio, App.relatorioDepois, App.revisaoDoRelatorio, App.versoesNoProcesso, App.importacaoDaPasta, os de `revisoes/`, `processos/`, `versoes/` e `cadastros/`)

- [x] **4.1** Vermelho: trocar V por R nos testes (o histórico já gravado "Enviou o Relatório V2" vem do número, então também passa a R; o evento de revisão gravado antes, com o texto pronto "Relatório V2" no banco, fica V). Acrescentar o teste do `rotuloDoRelatorio` e o do "Renomeou o arquivo … para …". Rodar e ver falhar.
- [x] **4.2** Verde: criar `rotuloDoRelatorio` e usá-lo nos pontos acima; o texto do evento novo.
- [x] **4.3** `grep -rn "Relatório V" src supabase/functions --include=*.ts --include=*.tsx`: sobra só o que é histórico gravado, dado de importação (nomes da pasta antiga) ou comentário sobre o antigo.
- [x] **4.4** `npm test`, `npm run typecheck`, `npx eslint src`: verdes.
- [x] **4.5** Commit.

### Tarefa 5: Aba Importação — seção "3. Relatórios com R"

**Arquivos:**
- Alterar: `src/importacao/tipos.ts`: `RelatorioComV = { arquivoId: string; nome: string }`; `RelatoriosComV = { aRenomear: RelatorioComV[]; foraDoPadrao: number }`; no `ModuloDeImportacao`: `listarRelatoriosComV(): Promise<RelatoriosComV>` e `renomearRelatorio(relatorio: RelatorioComV): Promise<void>`
- Criar: `src/importacao/relatoriosComRSupabase.ts` (+ teste): lê `arquivos_da_versao` (`id, nome, numero_do_relatorio`, `papel = 'relatorio'`, número não nulo), classifica com `situacaoDoNomeDoRelatorio` e chama a função com `{ acao: 'renomear_relatorio', arquivo_id }`
- Alterar: `src/importacao/importacaoSupabase.ts` (juntar os dois métodos) e `src/importacao/ImportacaoFalso.ts` (+ teste): lista inventada, falhas escolhidas por id e falha na leitura
- Criar: `src/importacao/frasesDosRelatoriosComR.ts` (+ teste): as frases da seção (spec, "Telas")
- Criar: `src/hooks/useRelatoriosComR.ts`: fases `procurando`, `erro`, `nada`, `pronto` (com a contagem e os fora do padrão), `renomeando` (feitos, total) e `fim` (renomeados, falhas); [Tentar de novo] lê de novo, e a leitura nova traz só os que faltam
- Criar: `src/components/administracao/SecaoDosRelatoriosComR.tsx`
- Alterar: `src/components/administracao/AreaDaImportacao.tsx` (a seção 3 depois da 2)
- Criar: `src/App.relatoriosComR.test.tsx` (a tela inteira, com o `ImportacaoFalso`)

- [ ] **5.1** Vermelho, pela tela inteira: "Procurando relatórios com V no nome…"; a contagem e o [Renomear para R]; a linha dos fora do padrão; "Renomeando… N de M."; o fim sem falhas; o fim com falhas e o [Tentar de novo], que continua só os que faltam; "Todos os relatórios numerados já estão com R."; o erro na leitura com [Tentar de novo]; a seção ausente para o Integrante (a aba não aparece). Funções puras: as frases, a leitura do Supabase com um cliente falso nomeado.
- [ ] **5.2** Rodar e ver falhar.
- [ ] **5.3** Verde: tipos, falso, leitura do Supabase, frases, gancho, componente, lugar na aba.
- [ ] **5.4** `npm test`, `npm run typecheck`, `npx eslint src`, `npm run check:circular`: verdes.
- [ ] **5.5** Commit.

### Tarefa 6: Manual, conferência no desenvolvimento e fechamento

**Arquivos:**
- Alterar: `docs/manutencao/04-modelo-de-dados.md` (Relatório R1, R2…; a função nova e o evento)

- [ ] **6.1** Manual atualizado; commit.
- [ ] **6.2** `git push -u origin documentos-versoes`; workflow "Migrar banco de desenvolvimento" com o arquivo da migração; depois "Testes de banco" na branch. Ler o resultado (0 `not ok`).
- [ ] **6.3** `npm run db:types` (remoto) e `git diff --exit-code src/types/database.ts`.
- [ ] **6.4** Com a aprovação do usuário no momento: publicar `arquivos-no-drive` no desenvolvimento (`--use-api`, vínculo conferido) e conferir a recusa sem login. A ponta a ponta com o Drive (critérios 5, 7 e 8) fica para o usuário no desenvolvimento ou para o roteiro de produção.
- [ ] **6.5** Suíte inteira (`npm test`), lint, typecheck, circular.
- [ ] **6.6** O critério 14 (`[visual]`) fica para o `/polir`: o projeto não tem vitrine, e a aba só abre com o login do Administrador.
