# Plano do ticket 06 de revisoes-aprovacao: data da validação e .pdf da aprovação

> Executar com `superpowers:executing-plans`. Marcar `- [x]` ao fim de cada tarefa.

**Ticket:** `.scratch/revisoes-aprovacao/issues/06-data-da-validacao-e-pdf-da-aprovacao.md` (requisitos e critérios estão lá; aqui só a execução).
**Spec:** `.scratch/revisoes-aprovacao/spec.md`, seção "Data da validação e .pdf da aprovação (mudança de 2026-10-26)" (histórias 49 a 62, "Modelo de dados", "Quem pode o quê", "Regras que o banco impõe", "Decisões de teste"). Termos em `CONTEXT.md`.
**Branch:** `quadro-livre-parte-3` (de integração, já em uso; sem worktree). É o último ticket da parte 3: ao terminar, pedir a aprovação do usuário para juntar à `main`.
**Regras de `.claude/regras/banco.md` que valem:** teste de banco antes da migração; migração por `npx supabase migration new`; tabela nova com RLS e políticas na mesma migração, `revoke all` e só os privilégios da spec; função sem `security definer`, exceto as que gravam evento ou preenchem coluna sem privilégio (`security definer`, `search_path` vazio, execução revogada de todos); view com `security_invoker`; Edge Function confere quem chamou antes de usar a conta de serviço, decisão em arquivo puro testado no Vitest; arquivo no Drive sem Storage, nada se apaga; a interface só fala com o banco por `src/lib/supabase.ts` e pelos módulos; o `npm test` nunca depende do banco ligado.
**Banco de teste:** tentar `npx supabase start` (Docker) e `npx supabase test db` (contar `ok` e `not ok`; o "FAIL" do comando é do formato dos testes). Se o Docker estiver desligado, os testes de banco rodam só no workflow "Testes de banco" (push da branch) e a migração vai ao desenvolvimento pelo workflow "Migrar banco de desenvolvimento"; as duas coisas estão autorizadas no `CLAUDE.md`. Tipos: `npx supabase gen types --local` (Docker) ou `npm run db:types` (remoto, depois da migração aplicada), conferindo o vínculo antes.

## Decisões de execução

1. **O .pdf passa pelas quatro ações que a função já tem, com um papel novo.** `PapelDoArquivo` ganha `'pdf_da_aprovacao'` (só no código da função e da tela; o enum `papel_do_arquivo` do banco não muda, o .pdf não é de `arquivos_da_versao`). Extensão `pdf`, nome `{sigla do setor}_V8_{Nome do processo}_Aprovação.pdf`, o mesmo padrão dos outros arquivos com o sufixo `_Aprovação` (o `CEE` da spec é a sigla de um setor de exemplo, não um texto fixo). `iniciar_envio` cria o arquivo (ou atualiza o do `arquivo_id`), `registrar` chama as funções novas do banco, `baixar` e `conferir` leem também `pdfs_da_aprovacao`.
2. **Funções novas do banco** (todas sem `security definer`, como `registrar_versao`/`substituir_arquivo`, migração `20261016035341_substituir_arquivo`; copiar o desenho de privilégios dali): `registrar_data_da_validacao(p_processo uuid, p_data date)`, `registrar_pdf_da_aprovacao(p_processo uuid, p_arquivo jsonb) returns uuid` e `substituir_pdf_da_aprovacao(p_pdf uuid, p_novo jsonb) returns void`. `registrar_aprovacao` é recriada (mesma assinatura). Recusas como `motivo:valor` em P0001: `data_so_na_validacao`, `data_no_futuro` (já existe, reaproveitar), `sem_aprovacao_para_o_pdf`, `pdf_ja_enviado`, `pdf_nome_sem_versao` (o nome do Drive precisa ter `_V{n}_` da versão aprovada).
3. **`guardado_em` pelo gatilho, sem privilégio.** Um gatilho `security definer` (em `private`, execução revogada) depois do `update` de `aprovacoes` com a marca `ep.registrando_aprovacao` ligada (a que `registrar_aprovacao` já liga) preenche `guardado_em = now()` do .pdf atual da aprovação. Assim a coluna segue sem privilégio de alteração para o usuário, como a spec manda, sem acrescentar marca nova. O evento "Substituiu a aprovação" passa a levar no `antes` o `.pdf` guardado (`pdf_id`, `pdf_nome`), que a tela usa para o link do histórico.
4. **Ordem do registro com .pdf** (spec: "falha no envio: nada registrado"): os bytes sobem ao Drive primeiro (`iniciar_envio` + PUT); depois `registrar_aprovacao`; depois a ação `registrar` do .pdf. Se a última falhar, a aprovação já está registrada: a janela fecha e a frase diz "A aprovação foi registrada, mas o .pdf não foi guardado. Envie-o na gaveta da Aprovação pelo setor." O arquivo que subiu fica na pasta (como nas versões). O número do nome é o da versão mais recente (a que a aprovação cobre); na gaveta, o da versão da aprovação atual.
5. **Eventos da data** em `entidade = 'processo'`, `acao = 'registrar_data_da_validacao'` (era vazia) ou `'alterar_data_da_validacao'` (inclusive para vazia), `detalhes` com `antes` e `depois` (`nome`, `setor_sigla`, `data_da_validacao`); do .pdf em `entidade = 'aprovacao'`, `acao = 'enviar_pdf'` ou `'substituir_pdf'`. Os textos do histórico vão em `src/cadastros/historicoDosCadastros.ts`. Conferir antes se a coluna `eventos.acao` não tem restrição (nas migrações lidas não há).
6. **A data fora das planilhas** (spec): nada muda em `private.montar_pacote_das_planilhas` nem na função `planilhas-dos-dashboards`.
7. **Leitura:** `data_da_validacao` entra no fim da view `processos_com_andamento` (recriada, igual à de `20261026154356_trava_de_arquivos` mais a coluna) e em `ProcessoLido.dataDaValidacao`; o .pdf atual e os guardados vêm do módulo de revisões (`lerAprovacao` passa a trazer `pdf`; `listarPdfsGuardados` não é preciso, o histórico lê o link do evento).
8. **Etapa da validação:** `CODIGO_DA_VALIDACAO = 'revisao_setor'` em `src/processos/codigosDasEtapas.ts` (o código antigo ficou; o nome visível é "Validação com o setor").

## Tarefas

### Tarefa 0: marco

- [x] `git tag marco/2026-10-26-inicio-ticket-06-revisoes-aprovacao` e `git push origin "refs/tags/marco/*:refs/tags/marco/*"`.

### Tarefa 1: testes de banco (falham primeiro)

**Arquivos:** `supabase/tests/60_data_da_validacao_e_pdf_da_aprovacao.test.sql` (novo), `40_aprovacao.test.sql` (casos do .pdf guardado), `10_privilegios_padrao.test.sql` (confere que a tabela nova não deixa truncate, references, trigger ou maintain: a consulta já varre todas as tabelas, então só se confirma que ela passa depois da migração; se faltar algum caso específico da tabela nova, acrescentar).

- [x] 60, data: `registrar_data_da_validacao` na Validação com o setor aceita, altera e apaga (nulo); amanhã recusado e hoje aceito; na Aprovação pelo setor e em outras etapas recusado; processo suspenso, cancelado, concluído e arquivado recusados; perfis (administrador e integrante gravam, consulta recebe 42501, inativo e visitante recusados); a leitura da coluna na view por todo perfil ativo e não pelo inativo e pelo visitante; gravar a coluna direto (`update processos set data_da_validacao`) sem privilégio; eventos: registrada (de vazia a data), alterada, apagada, sem evento quando nada muda; subprocesso com a sua data.
- [x] 60, .pdf: `registrar_pdf_da_aprovacao` com aprovação existente aceita em andamento e concluído e recusa em suspenso, cancelado e arquivado; sem aprovação recusado; segundo .pdf atual recusado (`pdf_ja_enviado`); `versao_id` preenchida pelo banco (a da aprovação), `enviado_por` e `enviado_em` pelo banco; nome sem `_V{n}_` da versão recusado; `substituir_pdf_da_aprovacao` troca só `tamanho`, `hash_md5`, `enviado_por`, `enviado_em` e deixa nome, versão e `drive_id`; alterar `nome`, `versao_id`, `drive_id`, `guardado_em` e apagar recusados a todo perfil; perfis da tabela (ler: administrador, integrante e consulta sim, inativo e visitante não; criar e substituir: só administrador e integrante); `drive_id` fora do formato recusado; tamanho acima de 20 MB e abaixo de 1 recusados; eventos `enviar_pdf` e `substituir_pdf`, um cada.
- [x] 40: `registrar_aprovacao` pela segunda vez deixa o .pdf antigo com `guardado_em` e a aprovação sem .pdf atual; um .pdf novo entra depois; o evento "substituir" leva `pdf_nome` do antigo; a edição (Editar) da aprovação não guarda o .pdf.
- [x] Rodar: os testes novos falham (função e tabela inexistentes) e os demais passam.

### Tarefa 2: migração

**Arquivo:** `supabase/migrations/<data>_data_da_validacao_e_pdf_da_aprovacao.sql` (criada com `npx supabase migration new data_da_validacao_e_pdf_da_aprovacao`) e `supabase/AMBIENTES.md` (linha de registro, no padrão das anteriores).

- [x] `processos.data_da_validacao date` (sem privilégio de alterar; gravada só pela função), gatilho de evento (security definer, `when old is distinct from new`), view `processos_com_andamento` recriada com a coluna no fim, `registrar_data_da_validacao` com as recusas da decisão 2.
- [x] Tabela `pdfs_da_aprovacao` (colunas da spec; `aprovacao_id` com `on delete restrict`; check de tamanho 1 a 20 MB; check do formato do `drive_id` igual aos outros), índice único parcial em `aprovacao_id where guardado_em is null`, RLS ligada, `revoke all` e `grant select, insert (aprovacao_id, nome, tamanho, hash_md5, drive_id), update (tamanho, hash_md5, enviado_por, enviado_em)`, políticas de leitura (perfil ativo), inclusão e alteração (administrador e integrante ativos), nenhuma de apagar; gatilhos de inclusão (perfil, processo em andamento ou concluído e não arquivado, `versao_id` da aprovação, `enviado_por`, `enviado_em`, nome com a versão) e de alteração (mesma regra; só o conteúdo muda; `enviado_por` e `enviado_em` renovados); gatilhos de evento; `registrar_pdf_da_aprovacao` e `substituir_pdf_da_aprovacao`; gatilho `security definer` que preenche `guardado_em` (decisão 3); `registrar_aprovacao` e `private.registrar_evento_da_aprovacao_substituida` recriadas com o `pdf` no `antes`.
- [x] `revoke execute ... from public, anon` e `grant ... to authenticated` nas funções novas; `revoke` de todos nas dos gatilhos.
- [x] Rodar o teste no Docker local até 0 `not ok` (todas as baterias, em especial 40, 41, 44, 46, 49, 55 e 59); sem Docker, empurrar a branch e ler o "Testes de banco".

### Tarefa 3: tipos do banco

- [x] Regenerar `src/types/database.ts` (local, ou `npm run db:types` depois de aplicar a migração no desenvolvimento) e conferir o diff: `data_da_validacao` em `processos` e na view, `pdfs_da_aprovacao` em `Tables` e as três funções novas em `Functions`.

### Tarefa 4: função do servidor, arquivos puros (testes primeiro)

**Arquivos:** `supabase/functions/_shared/nomePadrao.ts`, `decisao.ts`, `registro.ts`, `substituicao.ts`, `conferencia.ts` e os `.test.ts` ao lado (`nomePadrao.test.ts`, `decisao.test.ts`, `registro.test.ts`, `substituicao.test.ts`, `conferencia.test.ts`).

- [x] Testes que falham: `nomePadrao({ papel: 'pdf_da_aprovacao', ... })` devolve `CEE_V8_Nome do processo_Aprovação.pdf` (e limpa caracteres inválidos); `EXTENSOES_POR_PAPEL.pdf_da_aprovacao` só `pdf` e `.docx` recusado; `lerPapel` aceita o papel novo e a mensagem de recusa o cita; o papel novo nunca com `historica` nem `piloto` (campo inválido); `arquivo_grande` acima de 20 MB; `funcaoDoBancoPara` escolhe `registrar_pdf_da_aprovacao` (sem `arquivoId`) e `substituir_pdf_da_aprovacao` (com `arquivoId`); `parametrosDoBanco` devolve `{ p_processo, p_arquivo }` e `{ p_pdf, p_novo }`; `conferirArquivosNoDrive` aceita o nome com o rótulo `_V8_` e o formato `pdf`; a substituição do .pdf: alvo de outro processo e arquivo de outro papel recusados, `versao_aprovada` e `versao_historica_somente_leitura` não valem para o .pdf (ele se substitui mesmo com a versão aprovada); a conferência devolve a mesma situação para o .pdf.
- [x] Implementar o mínimo; `npm test -- supabase/functions` verde.

### Tarefa 5: função do servidor, ligação com o Deno e o banco

**Arquivos:** `supabase/functions/arquivos-no-drive/acoes.ts`, `registrar.ts`, `conferir.ts` (e `index.ts` só se a mensagem de ação mudar). Sem teste automático da camada Deno (como nas anteriores; fica registrado em `melhorias-protocolo`).

- [x] `acoes.ts`: `lerAlvoDaSubstituicao` lê `pdfs_da_aprovacao` quando o papel pedido é o do .pdf (`select drive_id, nome, aprovacoes(processo_id)`), com o `AlvoDaSubstituicao` do .pdf (`aprovada` sempre falso, `historica` falso); `baixar` e `lerArquivoDaVersao` tentam `arquivos_da_versao` e, sem linha, `pdfs_da_aprovacao`; recusa igual à de "sem permissão" quando nenhuma aparece.
- [x] `registrar.ts`: o papel novo segue o mesmo caminho (situação do processo, pasta registrada, leitura no Drive, conferência pelo arquivo puro) e grava pela função do banco da decisão 2 (`responderResultadoDoBanco` com o campo `pdf_id`).
- [x] `conferir.ts`: `lerArquivosDoProcesso` também lê `pdfs_da_aprovacao` (`select id, drive_id, hash_md5, aprovacoes!inner(processo_id)`), atuais e guardados.
- [x] `npm run typecheck` e `npm run lint` verdes. No fim do ticket, o roteiro para o usuário publicar a função: `npx supabase functions deploy arquivos-no-drive --use-api`, no terminal dele, com o vínculo do desenvolvimento conferido (a publicação não é minha).

### Tarefa 6: módulos da interface e falsas (testes primeiro)

**Arquivos:** `src/revisoes/tipos.ts`, `revisoesSupabase.ts`, `RevisoesFalso.ts`, `frasesDeAprovacao.ts`, `frasesDeData.ts` (novo, a frase "A data da validação não pode ser futura." e as outras), `src/versoes/tipos.ts`, `versoesSupabase.ts`, `VersoesFalso.ts`, `regrasDoFalso.ts`, `rotulos.ts` (os três `Record<PapelDoArquivo, ...>`), `recusasDeVersoes.ts`, `src/processos/recusasDoBanco.ts`, `lerProcessoSupabase.ts`, `processoDaLinha.ts`, `tipos.ts` (processos), `ProcessosFalso.ts` e os testes ao lado.

- [x] Testes que falham: `registrarDataDaValidacao(processoId, data | null)` no módulo real chama `registrar_data_da_validacao` com `p_processo` e `p_data` e traduz as recusas novas (frases da spec, com a do arquivado); `lerAprovacao` traz o `pdf` atual (`id`, `nome`, `formato: 'pdf'`, `tamanho`, `enviadoPor`) ou null; `enviarPdfDaAprovacao` e `substituirPdfDaAprovacao` no módulo de versões: enviam os bytes ao Drive e só então chamam `registrar` (campos do pedido, papel `pdf_da_aprovacao`, `numero` da versão, `arquivo_id` na troca); falha do envio não chama `registrar`; as falsas recusam como o banco (fora da Validação, futura, sem aprovação, segundo .pdf, processo arquivado) e a falsa de revisões guarda o .pdf da aprovação trocada para o histórico; `ProcessoLido.dataDaValidacao` lido da view e da falsa.
- [x] Implementar; `npm test -- src/revisoes src/versoes src/processos` verde.

### Tarefa 7: funções puras e textos (testes primeiro)

**Arquivos:** `src/revisoes/textoDaValidacao.ts` (novo: "Validado pelo setor em {dd/mm/aaaa}" e "Data da validação não registrada."), `src/revisoes/pdfDaAprovacao.ts` (novo: nome previsto do .pdf, conferência no navegador de extensão e 20 MB com a frase "O .pdf da aprovação precisa ser .pdf, até 20 MB."), `src/revisoes/eventoDaAprovacao.ts`, `src/cadastros/historicoDosCadastros.ts` (textos "Registrou a data da validação", "Alterou a data da validação", "Enviou o .pdf da aprovação", "Substituiu o .pdf da aprovação"; `data_da_validacao` em `CAMPOS_DE_DATA` e no rótulo de campo; o `pdf_nome` do evento "Substituiu a aprovação") e os testes ao lado.

- [x] Testes que falham e implementação, `npm test -- src/revisoes src/cadastros` verde.

### Tarefa 8: tela

**Arquivos:** `src/processos/codigosDasEtapas.ts` (`CODIGO_DA_VALIDACAO`), `src/components/processos/DataDaValidacao.tsx` (novo, no padrão de `DataDaModelagemPiloto.tsx`: marcar, alterar e apagar gravam na hora, falha em vermelho com o valor anterior de volta), `RegistrosDoAgora.tsx` (o campo na Validação com o setor, só para quem altera; Consulta lê), `DetalheDaEtapa.tsx` e `DadosDasEtapas` (a linha "Validado pelo setor em ..." na gaveta da Validação), `AprovacaoDaEtapa.tsx` (o .pdf atual: link `LinkDoArquivo`, `MarcaNoDrive`, [Substituir]; ou [Enviar .pdf]; some no arquivado e para a Consulta), `PdfDaAprovacao.tsx` (novo: o bloco do .pdf da gaveta), `JanelaDeRegistroDaAprovacao.tsx` (campo ".pdf protocolado (opcional)" com `CampoDeArquivo`, progresso "Enviando…", ordem da decisão 4), `HistoricoDoProcesso.tsx` (o link do .pdf guardado no evento "Substituiu a aprovação"), `Agora.css` e `Etapas.css` (alinhamento da data e janela até 1366×768) e os testes de tela.

- [x] Testes de tela que falham (aplicativo inteiro): `src/App.dataDaValidacao.test.tsx` e `src/App.pdfDaAprovacao.test.tsx` (novos, no padrão de `App.dataDaModelagemPiloto`, `App.registrarAprovacao`, `App.aprovacaoNaGaveta`, `App.editarRegistros`, `App.substituirArquivo`, `App.conferenciaNoDrive`), cobrindo cada item do segundo critério do ticket; ajustes em `App.registrarAprovacao.test.tsx`, `App.aprovacaoNaGaveta.test.tsx` e `src/testes/aprovacaoNoVerso.tsx` se a falsa mudou de forma.
- [x] Implementar; `npm test` inteiro, `npm run typecheck`, `npm run lint` e `npm run check:circular` verdes. Cada arquivo até 300 linhas e função de 4 a 20 (extrair em vez de comprimir).
- [x] (presumido, ver desvios.md) Os dois critérios `[visual]`: conferir na vitrine local (a de `vitrine.local/`, fora do git, está desatualizada e não compila: se não der para atualizá-la sem custo, registrar como presumido, como nos tickets anteriores).

### Tarefa 9: fecho

- [x] Docs: `desvios.md` de revisoes-aprovacao (decisões de execução 1 a 8 e o que mudou em relação à spec), spec (decisões a confirmar da seção), `docs/` da função e do banco (onde já se descreve `arquivos-no-drive` e a tabela de eventos), ticket (`Concluído em`), backlog (o que surgir), `.scratch/proximo-passo.md`, `.claude/regras/nao-testados.md` → `.scratch/melhorias-protocolo.md`.
- [x] Commits por assunto (o pre-commit roda a bateria), `git push origin quadro-livre-parte-3`; conferir o "Testes de banco" verde na branch.
- [x] Aplicar a migração no desenvolvimento pelo workflow "Migrar banco de desenvolvimento" (autorizado), conferindo o vínculo, se ainda não foi aplicada; `db:types` do remoto igual aos tipos do commit.
- [ ] Juntar `quadro-livre-parte-3` à `main`: **só com a aprovação do usuário**, depois de dizer o que entra (as três partes da iniciativa, a migração e a função a publicar). O passo 4 do comando (merge e `git branch -d`) segue o que ele responder.
