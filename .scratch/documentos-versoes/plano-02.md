# Ticket 02 de documentos-versoes (Enviar versão e ver a lista) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** no painel do processo, a seção Versões lista as versões e Administrador e Integrante enviam uma versão nova (.bpmn e .png obrigatórios; .bpm e relatório opcionais), com os bytes indo direto ao Drive e o registro só depois que todos chegaram.

**Architecture:** o banco impõe as regras (tabelas `versoes` e `arquivos_da_versao`, gatilhos, a função `registrar_versao` sem `security definer`). A função do servidor ganha a ação `registrar`, que lê no Drive tamanho, nome e MD5 de cada arquivo, confere tudo num arquivo puro e grava pela função do banco com o login de quem chamou. A interface ganha o módulo de versões (real e falso) e a seção no painel.

**Tech Stack:** React + Vitest + Testing Library; Edge Function Deno (`arquivos-no-drive`); Postgres/pgTAP pelo GitHub Actions; Drive API v3 por `fetch`.

**Spec:** `.scratch/documentos-versoes/spec.md` · **Ticket:** `.scratch/documentos-versoes/issues/02-enviar-versao-e-ver-a-lista.md` (critérios citados como "critério N", na ordem em que aparecem: 1 quem pode o quê, 2 regras, 3 testes gerais e migração, 4 `registrar`, 5 seção, 6 [Enviar versão], 7 conferências, 8 progresso e falha, 9 recusas, 10 estados, 11 Consulta e processo parado, 12 histórico, 13 testes de interface).

## Global Constraints

- Regras de `.claude/regras/banco.md` lidas nesta sessão. Valem aqui: toda tabela com RLS e políticas na mesma migração, o teste antes; `revoke all` de `anon` e `authenticated` e concessão só do necessário (teste `10_privilegios_padrao`); regra de negócio em gatilho ou função; a função de gravação sem `security definer` (a RLS decide); função `security definer` só em `private`, com `search_path` vazio e nomes qualificados; nenhuma view nova; nenhum bucket (`01_buckets_privados`); políticas testadas com cada perfil, inativo e visitante; a Edge Function confere o chamador antes de tocar o Drive, decisão em arquivo puro testado no Vitest, resposta e log sem dado pessoal; a chave secreta do Supabase não é usada.
- Banco só pelos workflows do GitHub (porta 5432 fechada): "Testes de banco" e "Migrar banco de desenvolvimento" na branch `documentos-versoes-02`, disparados pelo navegador do app. Alvo conferido antes: "vínculo atual" de `supabase/AMBIENTES.md` = `supabase/.temp/project-ref` = `yclkzyoebpsxmgpbcbus`.
- Nenhuma dependência nova. Funções de 4 a 20 linhas, arquivos até 300, complexidade até 10, sem `any`, mensagens de erro com o recebido e o esperado, dados de teste inventados.
- Cada commit roda a bateria inteira no pré-commit (cerca de 1 minuto): rodar em segundo plano.

## Decisões do plano

- **Número da versão:** o banco dá o número (gatilho, ignora o que vier). A prévia da tela calcula o mesmo (maior + 1) e é esse número que nomeia os arquivos em `iniciar_envio` (que continua recebendo `numero` e `historica`). `registrar_versao` recebe o número esperado e recusa com `numero_da_versao_mudou:<n>` se o banco der outro (outra pessoa enviou no meio). Assim o nome do arquivo nunca diverge do número. Vai para o `desvios.md`, porque o desvio do ticket 01 previa "ignorar o da tela".
- **Só a versão nova neste ticket.** A coluna `historica` nasce com padrão falso e **sem** privilégio de inclusão. As regras e a concessão da histórica entram no ticket 04. Relatório depois, sem alteração e substituição ficam nos tickets 05 e 06. O privilégio e a política de alterar `tamanho`, `hash_md5`, `enviado_por` e `enviado_em` já nascem aqui, porque são células da tabela "quem pode o quê" (critério 1). O evento da substituição fica no 06.
- **Processo "concluído"** é calculado pela view. O gatilho lê `situacao` em `processos_com_andamento` (com o login de quem grava) e recusa com `processo_fora_de_andamento:<situação>`. Se a linha não aparece (inativo), não recusa: a RLS recusa com 42501.
- **Evento:** entidade `versao`, ação `enviar`, `entidade_ref` = id do processo, `depois` = `{ rotulo, processo_nome, setor_sigla, etapa, observacao, arquivos: [{ papel, nome }] }`. Gravado por gatilho adiado em `versoes` (fim da gravação, já com os arquivos). O histórico do processo passa a ler `entidade in ('processo','andamento','versao')`.
- **Exclusão de processo com versão:** gatilho `conferir_processo_sem_versoes` (antes de apagar) recusa com `processo_com_versoes:<n>`, além da referência `on delete restrict`. A frase entra onde já estão as de `processo_com_reunioes` (`src/processos/andamentosSupabase.ts`). O "caso com versão" do critério 3 fica em `27_versoes.test.sql`, ao lado do caso de exclusão que o 23 tem para reuniões. Anotar no `desvios.md`.
- **Chamada da função na interface:** `cliente.functions.invoke('arquivos-no-drive', { body })`; na recusa, o corpo `{ codigo, mensagem }` vem de `error.context` (Response). O `PUT` ao Google usa um `fetch` injetado (`enviarBytes`), para o teste do módulo real simulá-lo.
- **Recusa do banco na função:** `registrar` devolve 409 `{ codigo: <motivo>, mensagem: <valor> }` para `P0001 motivo:valor`, 403 `sem_permissao` para 42501 e `erro_interno` no resto. A tela traduz o código em frase (`recusasDeVersoes.ts`).
- **Passagem do módulo:** `App` ganha a prop obrigatória `versoes: ModuloDeVersoes`, levada por `AreaDeProcessos` até `PainelDoProcesso`. Os 44 testes que montam `<App>` ganham `versoes={new VersoesFalso()}` por um script de troca de texto em node, rodado uma vez e não guardado (a trava bloqueia `sed -i` em `src/`).
- **Seção no painel:** dentro de Detalhes, depois de Reuniões e antes das ações do processo (a aba Histórico vem depois).

## Estrutura de arquivos

Criar:
- `supabase/tests/27_versoes.test.sql`
- `supabase/migrations/<data>_versoes.sql`
- `supabase/functions/_shared/registro.ts` (+ `registro.test.ts`)
- `supabase/functions/arquivos-no-drive/registrar.ts`
- `src/versoes/tipos.ts`, `rotulos.ts` (+ teste), `conferenciaDosArquivos.ts` (+ teste), `recusasDeVersoes.ts` (+ teste), `versaoDaLinha.ts`, `versoesSupabase.ts` (+ teste), `VersoesFalso.ts` (+ teste)
- `src/components/versoes/SecaoDeVersoes.tsx`, `ListaDeVersoes.tsx`, `FormularioDeVersao.tsx`, `CampoDeArquivo.tsx`, `Versoes.css`
- `src/App.versoesNoProcesso.test.tsx`, `src/App.enviarVersao.test.tsx`, `src/testes/versoesDeTeste.ts`

Modificar: `supabase/functions/_shared/decisao.ts` (+ teste), `arquivos-no-drive/index.ts`, `src/types/database.ts` (gerado), `src/App.tsx`, `src/main.tsx`, `src/components/processos/AreaDeProcessos.tsx`, `PainelDoProcesso.tsx`, `src/processos/lerProcessoSupabase.ts` (+ teste), `src/processos/andamentosSupabase.ts` (+ teste), `src/cadastros/historicoDosCadastros.ts` (+ teste), `src/testes/ClienteSupabaseFalso.ts`, `src/testes/reunioesNosCadastros.tsx`, os testes que montam `<App>`, `scripts/prova-do-drive.mjs` (registrar depois do envio), `supabase/AMBIENTES.md`, `.scratch/documentos-versoes/desvios.md`.

## Tarefas

### Tarefa 1 — Banco: teste, migração, aplicação e tipos (critérios 1, 2 e 3)

**Arquivos:** `supabase/tests/27_versoes.test.sql`, `supabase/migrations/<data>_versoes.sql` (criada com `npx supabase migration new versoes`), `src/types/database.ts`, `supabase/AMBIENTES.md`.

**Produz:** tipo `public.papel_do_arquivo`; tabelas `public.versoes` e `public.arquivos_da_versao` (colunas da spec, "Modelo de dados"); `public.registrar_versao(p_processo uuid, p_numero integer, p_observacao text, p_arquivos jsonb) returns uuid` (`p_arquivos` = `[{ papel, nome, formato, tamanho, hash_md5, drive_id }]`); códigos de recusa `processo_fora_de_andamento:<situação>`, `versao_sem_bpmn_e_png`, `numero_da_versao_mudou:<n>`, `processo_com_versoes:<n>`; eventos `entidade = 'versao'`, `acao = 'enviar'`.

- [x] Teste `27_versoes.test.sql`, no molde do `26_pastas_no_drive` (usuários a1 a a4, `_tap`, exceção final). Um teste por célula de "quem pode o quê" para `versoes`, `arquivos_da_versao` e os eventos de versão: ler, criar, alterar (`versoes` ninguém; `arquivos_da_versao` só `tamanho`/`hash_md5`), apagar (ninguém), cada perfil, inativo e visitante. Regras: V1 no processo sem versão e V2 em seguida; número enviado (99) ignorado; etapa atual gravada; suspenso, cancelado e concluído recusados; sem .png e sem .bpmn recusados no fim da gravação; segundo arquivo do mesmo papel recusado (23505); relatório `.png` e 20 MB + 1 byte recusados (23514); alterar `nome` ou `drive_id` recusado (42501); `registrar_versao` com número esperado diferente recusada; excluir processo com 2 versões recusado com `processo_com_versoes:2`; um evento por envio, com autor e `entidade_ref` = processo, e a Consulta lê o evento.
- [x] Commit do teste, push da branch, disparar "Testes de banco": o 27 falha (tabelas não existem). Esse é o vermelho.
- [x] Migração: tipo, tabelas com restrições (`unique (processo_id, numero)`, `unique (versao_id, papel)`, formato coerente com o papel, tamanho de 1 a 20.971.520, nome até 300, MD5 com 32 hexadecimais, observação até 2.000), RLS e políticas (`private.usuario_ativo()` lê, `private.pode_alterar_cadastros()` cria e altera), `revoke all` e concessões (versoes: `select`, `insert (processo_id, numero, observacao)`; arquivos: `select`, `insert (versao_id, papel, nome, formato, tamanho, hash_md5, drive_id)`, `update (tamanho, hash_md5, enviado_por, enviado_em)`). Gatilhos: `preparar_versao` (antes de incluir: situação, número, etapa, autor, observação aparada); `preparar_arquivo_da_versao` (antes de incluir e alterar: situação, autor e data); `conferir_arquivos_da_versao` (restrição adiada: .bpmn e .png); `registrar_evento_da_versao` (adiado, `security definer` em `private`); `conferir_processo_sem_versoes` (antes de apagar processo). Política de leitura dos eventos `entidade = 'versao'`. `registrar_versao` com `set constraints public.… immediate` e depois `deferred` (nomes qualificados, lição da migração `reunioes_salvar_com_nomes_qualificados`). `revoke execute` nas funções de `private`.
- [x] Commit, push, "Migrar banco de desenvolvimento" com o nome da migração; depois "Testes de banco": tudo verde, inclusive `00_rls_ligada`, `01_buckets_privados` e `10_privilegios_padrao`. Se falhar, a correção é uma migração nova, porque a aplicada no dev não se edita.
- [x] `npm run db:types` (alvo conferido), `npm run typecheck`; registrar a migração em `supabase/AMBIENTES.md` (números das execuções). Commit.

### Tarefa 2 — Função do servidor: ação `registrar` (critério 4)

**Arquivos:** `supabase/functions/_shared/registro.ts` (+ teste), `_shared/decisao.ts` (+ teste), `arquivos-no-drive/registrar.ts`, `arquivos-no-drive/index.ts`, `scripts/prova-do-drive.mjs`.

**Consome:** `registrar_versao` (Tarefa 1); `recusar`, `extensaoDoNome`, `LIMITE_DE_TAMANHO`, `EXTENSOES_POR_PAPEL` (exportar) de `decisao.ts`; `lerJsonDoDrive`, `API_DE_ARQUIVOS`, `garantirPastaDoProcesso` (ou a leitura da pasta registrada) do ticket 01.
**Produz:** `Acao` com `'registrar'` (perfis: Administrador e Integrante); `validarRegistrar(corpo): Validacao<EntradaRegistrar>` com `EntradaRegistrar = { processoId, numero, observacao: string | null, arquivos: { papel, driveId }[] }` (papéis sem repetir, 1 a 4 arquivos, observação até 2.000); `conferirArquivosNoDrive(pedidos, lidos: ArquivoNoDrive[], pastaId): Validacao<ArquivoParaGravar[]>` com `ArquivoNoDrive = { id, name, size: string, md5Checksum?: string, parents?: string[] }`; `recusaDoBanco(erro: { message, code? }): Recusa`. Novos códigos: `arquivo_nao_chegou`, `arquivo_fora_da_pasta`, `recusa_do_banco` (com o motivo do banco como código na resposta).

- [x] Testes do Vitest primeiro (vermelho): `registrar` nas células da tabela da função (Consulta, inativo e sem login recusados); entrada inválida (sem arquivos, papel repetido, `drive_id` fora do formato, observação longa ou de outro tipo); arquivo que não chegou; tamanho real acima de 20 MB; extensão do nome no Drive incoerente com o papel; arquivo fora da pasta do processo; MD5 ausente; caso que passa devolvendo `{ papel, nome, formato, tamanho, hash_md5, drive_id }`; `recusaDoBanco` para `P0001 motivo:valor`, 42501 e outro erro.
- [x] Implementar em `registro.ts` e ajustar `decisao.ts` (`lerAcao`, `PERFIS_POR_ACAO`, mensagens). Verde.
- [x] `registrar.ts` (Deno): lê o processo na view (situação), a pasta registrada do processo, cada arquivo no Drive (`fields=id,name,size,md5Checksum,parents`; 404 vira "não chegou"), confere pelo arquivo puro e chama `cliente.rpc('registrar_versao', …)`. Qualquer falha devolve a recusa e não grava nada. A função nunca apaga. `index.ts` encaminha a ação.
- [x] `scripts/prova-do-drive.mjs`: envia .bpmn e .png inventados e chama `registrar`; confere que a versão aparece em `versoes` com o login do Integrante. O resto da prova do 01 não muda.
- [x] `npm run lint`, `npm run typecheck`, `npm test`. Commit.

### Tarefa 3 — Funções puras da tela (critérios 6 e 7)

**Arquivos:** `src/versoes/tipos.ts`, `rotulos.ts` (+ teste), `conferenciaDosArquivos.ts` (+ teste).

**Produz:**
- `tipos.ts`: `PapelDoArquivo` (reexportado de `supabase/functions/_shared/nomePadrao.ts`); `ArquivoDaVersao = { id, papel, nome, formato, tamanho }`; `Versao = { id, numero, historica, enviadaEm, autor: string | null, etapa: string | null, observacao: string | null, arquivos: ArquivoDaVersao[] }`; `ArquivoEscolhido = { papel: PapelDoArquivo; arquivo: File }`; `PedidoDeVersao = { processoId, numero, observacao: string | null, arquivos: ArquivoEscolhido[] }`; `ModuloDeVersoes = { listarVersoes(processoId): Promise<Versao[]>; enviarVersao(pedido, aoProgredir: (enviados: number, total: number) => void): Promise<void> }`.
- `rotulos.ts`: `rotuloDaVersao(v)` ("V7" / "V5F"), `ROTULO_DO_PAPEL`, `proximoNumero(versoes)` (maior + 1, contando as históricas; 1 sem versão), `ordenarVersoes` (mais recente primeiro, pelo número), `ACCEPT_DO_PAPEL`.
- `conferenciaDosArquivos.ts`: `conferirArquivo(papel, arquivo: File): Promise<string | null>` (null = ok; senão a frase da tela): extensão, tamanho até 20 MB, assinatura PNG (8 primeiros bytes), BPMN 2.0 (`DOMParser`, elemento `definitions` no namespace `http://www.omg.org/spec/BPMN/20100524/MODEL`).
- [x] Testes primeiro (vermelho), com `File` inventados no jsdom; implementar; verde; commit.

### Tarefa 4 — Módulo de versões real e falso (critérios 8 e 9)

**Arquivos:** `src/versoes/recusasDeVersoes.ts` (+ teste), `versaoDaLinha.ts`, `versoesSupabase.ts` (+ teste), `VersoesFalso.ts` (+ teste), `src/testes/ClienteSupabaseFalso.ts` (ganha `functions.invoke`, respondendo por `funcao.<acao>` e guardando o pedido).

**Consome:** tipos da Tarefa 3; `TravaDoBanco` e `recusaPorPerfil`.
**Produz:** `criarVersoesSupabase(cliente, enviarBytes: (url: string, arquivo: File) => Promise<Response> = enviarComFetch)`; `fraseDaRecusaDeVersao(codigo, mensagem): string` e `falhaDoEnvio(…)`, que devolve `TravaDoBanco` com a frase; `class VersoesFalso implements ModuloDeVersoes` com `versoes: Record<processoId, Versao[]>`, `falharLeitura`, `segurarLeitura`, `falharNoArquivo: number | null`, `falhaNoRegistro: Error | null`, `segurarEnvio`, `envios: PedidoDeVersao[]` e o evento no histórico do falso de processos (método `aoEnviar` para ligar os dois).
- [x] Testes do módulo real (vermelho): lista do banco (`versoes` com `arquivos_da_versao`, autor e etapa, por número); envio chama `iniciar_envio` por arquivo com `numero`, faz o `PUT` no `upload_url` devolvido, avisa o progresso e só então chama `registrar` com os `drive_id`; falha num `PUT` não chama `registrar`; cada código de recusa vira a frase (perfil, fora de andamento, sem .bpmn ou .png, número mudou, extensão, tamanho, Drive sem espaço, arquivo não chegou, erro genérico). Testes do falso (envio registra, falhas programáveis).
- [x] Implementar; verde; commit.

### Tarefa 5 — Seção Versões e formulário de envio no painel (critérios 5, 6, 8, 10, 11 e 13)

**Arquivos:** `src/components/versoes/*`, `PainelDoProcesso.tsx`, `AreaDeProcessos.tsx`, `App.tsx`, `main.tsx`, `src/testes/versoesDeTeste.ts`, `src/testes/reunioesNosCadastros.tsx`, os testes que montam `<App>`, `src/App.versoesNoProcesso.test.tsx`, `src/App.enviarVersao.test.tsx`.

**Consome:** Tarefas 3 e 4; `nomePadrao` de `_shared`; `ErroAoCarregar`, `useCarregamento`, `textoDaFalhaNoFormulario`.
- [x] Passar o módulo: `App` (prop obrigatória `versoes`), `AreaDeProcessos`, `PainelDoProcesso`, `main.tsx` (`criarVersoesSupabase(supabase)`). Script de troca nos testes. `npm test` verde sem mudança de comportamento. Commit.
- [x] Testes de interface (vermelho), com o app inteiro e a `VersoesFalso`: seção no processo e no subprocesso, da mais recente à mais antiga, cada uma com rótulo, data e hora, autor, etapa, observação e os nomes dos arquivos; "Carregando…", "Nenhuma versão enviada.", erro com [Tentar de novo]; Consulta e processo suspenso, cancelado ou concluído sem [Enviar versão]; [Enviar versão] abre o formulário com os quatro campos, a observação e a prévia ("V3" e os nomes padrão); enviar desabilitado sem .bpmn ou .png; cada conferência que falha mostra a mensagem ao lado do campo e desabilita; envio com .bpm e relatório; "Enviando 2 de 3…" com os campos travados; falha num arquivo ou no registro mostra a mensagem em vermelho e mantém o formulário preenchido; cada recusa vira a frase; depois do envio a lista recarrega com a versão nova.
- [x] Componentes: `SecaoDeVersoes` (carrega, estados, botão), `ListaDeVersoes` (blocos de versão), `FormularioDeVersao` (campos, conferências, prévia, progresso, erro) e `CampoDeArquivo` (`input type="file"` com `accept` e a mensagem). Estilo das seções vizinhas (`painel-estrutura`, `painel-subtitulo`, `cadastros-erro`, botões `botao`). Verde; commit.

### Tarefa 6 — Histórico e recusa de excluir (critérios 9 e 12)

**Arquivos:** `src/processos/lerProcessoSupabase.ts` (+ teste), `src/cadastros/historicoDosCadastros.ts` (+ teste), `src/processos/andamentosSupabase.ts` (+ teste), `src/processos/ProcessosFalso.ts` (a recusa e o evento no falso), `src/App.historico.test.tsx` ou novo teste de interface.
- [ ] Testes (vermelho): o histórico do processo lê `versao`; o evento aparece como "Enviou a versão V3 — Nome do processo", com etapa, observação e arquivos; excluir processo com versões mostra "Não é possível excluir: processo tem 2 versões enviadas."
- [ ] Implementar; verde; commit.

### Tarefa 7 — Fecho do ticket

- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run check:circular`; "Testes de banco" na branch.
- [ ] `desvios.md`: número conferido no registro; histórica sem privilégio até o 04; caso de exclusão com versão no 27; o que mais divergir. Marcar as caixas dos critérios no ticket, com a ressalva do `[visual]` (tela não conferida) e da prova real (depende do roteiro do usuário, junto com a do 01).
- [ ] Juntar: o ticket 01 ainda não está na `main`. **Parar e perguntar ao usuário** se junta o 02 à `documentos-versoes-01` (esperando a prova) ou os dois à `main` agora. Depois, linha `Concluído em` no ticket e itens não testados em `.scratch/melhorias-protocolo.md`.
