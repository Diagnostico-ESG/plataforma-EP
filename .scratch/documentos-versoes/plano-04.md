# Ticket 04 de documentos-versoes (Versões históricas) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Administrador e Integrante registram à mão as versões históricas (V5F) de um processo em andamento, com o número digitado e os arquivos que existirem (basta o .bpm), enquanto o processo não tem versão nova; a primeira versão nova continua a numeração (V5F → V6).

**Architecture:** o banco impõe as regras da histórica (tabelas e gatilhos do ticket 02 ganham o ramo `historica`; função nova `registrar_versao_historica`, sem `security definer`). A função do servidor reaproveita `iniciar_envio` (que já recebe `historica`) e faz `registrar` chamar a função certa do banco. A interface ganha `registrarVersaoHistorica` no módulo (real e falso), o botão na seção Versões e o mesmo formulário de envio com o campo do número.

**Tech Stack:** React + Vitest + Testing Library; Edge Function Deno (`arquivos-no-drive`); Postgres/pgTAP pelo GitHub Actions; Drive API v3 por `fetch`.

**Spec:** `.scratch/documentos-versoes/spec.md` (histórias 14 a 21 e 45; regras do banco "Número da versão nova…", "Versão histórica só enquanto…", "Versão nova registra a etapa…", "Versão nova tem .bpmn e .png; histórica tem…", "Versão histórica é somente leitura") · **Ticket:** `.scratch/documentos-versoes/issues/04-versoes-historicas.md` (critérios citados como "critério N", na ordem em que aparecem: 1 banco, 2 botão e formulário, 3 como a histórica aparece, 4 recusas e testes de interface).

## Global Constraints

- Regras de `.claude/regras/banco.md` lidas nesta sessão. Valem aqui: teste de banco antes da migração; RLS e privilégios mínimos (`revoke all` e concessão só do necessário; o teste `10_privilegios_padrao` continua passando); regra de negócio em gatilho ou função; função de gravação sem `security definer` (a RLS decide); função `security definer` só em `private`, com `search_path` vazio e nomes qualificados; nenhuma view nova; nenhum bucket; a Edge Function confere o chamador antes de tocar o Drive, decisão em arquivo puro testado no Vitest; a chave secreta do Supabase não é usada.
- Banco só pelos workflows do GitHub (porta 5432 fechada): "Testes de banco" e "Migrar banco de desenvolvimento" na branch `documentos-versoes-04`, disparados pelo navegador do app. Alvo conferido antes de `db:types`: "vínculo atual" de `supabase/AMBIENTES.md` = `supabase/.temp/project-ref` = `yclkzyoebpsxmgpbcbus`. Migração aplicada no dev não se edita: ensaiar antes (Tarefa 1).
- Nenhuma dependência nova. Funções de lógica de 4 a 20 linhas (hooks até 40), arquivos até 300, complexidade até 10, sem `any`, mensagens de erro com o recebido e o esperado, dados de teste inventados.
- Cada commit roda a bateria inteira no pré-commit (cerca de 1 minuto): rodar em segundo plano. Nunca `--no-verify`.
- A branch parte de `documentos-versoes-01` (pedido do usuário); a `main` só recebe os tickets 01 a 04 depois da prova do Drive.

## Decisões do plano

- **Recusas do banco em P0001 `motivo:valor`**, como as do ticket 02 (a função do servidor já repassa qualquer `motivo` como código, 409): `historica_depois_de_versao_nova`, `numero_historico_repetido:<n>`, `historica_sem_arquivo_de_fluxograma`, `versao_historica_somente_leitura`. O número repetido é conferido no gatilho (antes da restrição `versoes_numero_unico`, que fica como rede de segurança), para a tela receber uma frase e não um erro 23505.
- **Gatilho `preparar_versao` ganha o ramo da histórica** (`create or replace`, em migração nova): o número digitado vale (ao contrário da nova, em que é ignorado), a etapa fica nula, e a inclusão só passa se o processo não tem versão nova. Para a função ficar pequena, as conferências da histórica vão para `private.conferir_versao_historica(processo, numero)`.
- **`conferir_arquivos_da_versao` (adiado) ganha o ramo da histórica:** `.bpm`, ou o par `.bpmn` e `.png`; relatório opcional junto. Só `.png`, só `.bpmn` ou só relatório é recusado com `historica_sem_arquivo_de_fluxograma`.
- **Somente leitura (spec, regra da histórica):** `preparar_arquivo_da_versao` recusa com `versao_historica_somente_leitura` qualquer `update` num arquivo de histórica e qualquer `insert` depois da criação. "Depois da criação" = `versoes.enviada_em <> now()` (o gatilho grava `enviada_em := now()`, que é o início da transação; a mesma transação do registro vê igual). O teste pgTAP roda tudo numa transação só, então ele recua `enviada_em` como superusuário (`reset role; update public.versoes …; set local role authenticated`) para simular outra chamada. Isso antecipa a base das recusas dos tickets 05 e 06 sem criar as ações deles.
- **Evento próprio:** `registrar_evento_da_versao` (`create or replace`) grava `acao = 'registrar_historica'` quando `new.historica`, senão `'enviar'`. O histórico mostra "Registrou a versão histórica". O histórico do processo já lê a entidade `versao`.
- **Função do banco nova `public.registrar_versao_historica(p_processo uuid, p_numero integer, p_observacao text, p_arquivos jsonb) returns uuid`.** O corpo repete a gravação dos arquivos e a cobrança das conferências adiadas do `registrar_versao`; por isso as duas passam a usar `private.gravar_arquivos_da_versao(versao uuid, arquivos jsonb)` (sem `security definer`, com `grant execute` a `authenticated`, como `conferir_processo_que_recebe_versao`) e `registrar_versao` é refeita com `create or replace` (mesma assinatura e mesmo comportamento; o teste 27 continua a prová-la). `historica` ganha `grant insert (historica) on public.versoes`.
- **Observação na histórica:** o formulário é o mesmo, então a observação continua opcional.
- **Módulo:** `ModuloDeVersoes` ganha `registrarVersaoHistorica(pedido, aoProgredir)`; `PedidoDeVersao.numero` é o digitado. A implementação real e a falsa dividem o fluxo com `enviarVersao` por um parâmetro `historica`. A chamada `registrar` passa a levar `historica` (booleano) sempre; a `iniciar_envio` leva o mesmo valor, e o nome do arquivo no Drive sai com o F.
- **Formulário único:** `FormularioDeVersao` recebe `modo: { tipo: 'nova'; numero: number } | { tipo: 'historica' }`. Na histórica há o campo "Número da versão" (inteiro maior que zero, texto livre validado por `lerNumeroHistorico`), a prévia diz "Esta versão será a V5F", os quatro campos de arquivo ficam opcionais e o botão só habilita com `.bpm` ou o par `.bpmn` + `.png`. Rótulo do formulário: "Registrar versão histórica"; botão: "Registrar". O de versão nova não muda.
- **A histórica na lista:** o rótulo `V5F` já existe (`rotuloDaVersao`); sem etapa já some (etapa nula); ganha o texto "Histórica · somente leitura" (nunca só cor, história 21). [Substituir] e a marca "relatório pendente" ainda não existem (tickets 05 e 06): este ticket só deixa a regra anotada no `desvios.md`, e os testes deles é que provam a ausência na histórica.
- **Botão [Registrar versão histórica]:** aparece para Administrador e Integrante, com o processo em andamento e `!haVersaoNova(versoes)` (nenhuma versão com `historica` falso). É conveniência; quem recusa é o banco.
- **Prova do Drive (`scripts/prova-do-drive.mjs`)** ganha um passo: registra uma histórica só com `.bpm` num processo em andamento sem versão nova. Roda no roteiro do usuário, junto com a dos tickets 01 a 03.
- **Concluído em:** este ticket segue a regra dos tickets 01 a 03 (sem a linha `Concluído em` até a prova do Drive, decisão do usuário em 2026-10-15). O comando `/executar-complexo` manda gravar a linha; na dúvida entre as duas instruções, a Tarefa 6 pergunta ao usuário antes de gravar.

## Estrutura de arquivos

Criar:
- `supabase/tests/28_versoes_historicas.test.sql`
- `supabase/migrations/<data>_versoes_historicas.sql` (criada com `npx supabase migration new versoes_historicas`)
- `src/components/versoes/CampoDoNumeroHistorico.tsx`
- `src/App.registrarVersaoHistorica.test.tsx`

Modificar: `supabase/functions/_shared/registro.ts` (+ teste), `supabase/functions/arquivos-no-drive/registrar.ts`, `scripts/prova-do-drive.mjs`, `src/versoes/tipos.ts`, `rotulos.ts` (+ teste), `formularioDeVersao.ts` (+ teste), `recusasDeVersoes.ts` (+ teste), `versoesSupabase.ts` (+ teste), `VersoesFalso.ts` (+ teste), `src/cadastros/historicoDosCadastros.ts` (+ teste), `src/components/versoes/SecaoDeVersoes.tsx`, `FormularioDeVersao.tsx`, `ListaDeVersoes.tsx`, `Versoes.css`, `src/App.versoesNoHistorico.test.tsx`, `src/types/database.ts` (gerado), `supabase/AMBIENTES.md`, `.scratch/documentos-versoes/desvios.md`, `.scratch/documentos-versoes/issues/04-versoes-historicas.md`, `.scratch/melhorias-protocolo.md`.

## Tarefas

### Tarefa 1 — Banco: teste, ensaio, migração, aplicação e tipos (critério 1)

**Arquivos:** `supabase/tests/28_versoes_historicas.test.sql`, `supabase/migrations/<data>_versoes_historicas.sql`, `src/types/database.ts`, `supabase/AMBIENTES.md`.

**Consome:** tabelas `versoes` e `arquivos_da_versao`, gatilhos `preparar_versao`, `preparar_arquivo_da_versao`, `conferir_arquivos_da_versao`, `registrar_evento_da_versao`, função `registrar_versao` (migração `20261015224928_versoes`); `private.pode_alterar_cadastros()`.
**Produz:** `public.registrar_versao_historica(uuid, integer, text, jsonb) returns uuid`; `private.conferir_versao_historica(uuid, integer)`; `private.gravar_arquivos_da_versao(uuid, jsonb)`; códigos `historica_depois_de_versao_nova`, `numero_historico_repetido:<n>`, `historica_sem_arquivo_de_fluxograma`, `versao_historica_somente_leitura`; evento `entidade = 'versao'`, `acao = 'registrar_historica'`.

- [x] Teste `28_versoes_historicas.test.sql`, no molde do 27 (usuários a1 a a4, `_tap`, exceção final, funções `pg_temp` `arquivo`, `par`, `processo`; setor `VH1`, processos e1 a e5, e2 suspenso, e3 cancelado, e4 concluído com as obrigatórias resolvidas, e5 do integrante). Casos, todos com `throws_ok`/`lives_ok`/`is` contra a função e as tabelas:
  - **Administrador, e1:** registra V5F só com `.bpm` (aceita); `numero` 5, `historica` verdadeiro, `etapa_id` nulo, `enviada_por` = quem chamou; registra V3F e V4F (várias); V5F de novo → `numero_historico_repetido:5`; só `.png` → `historica_sem_arquivo_de_fluxograma`; só `.bpmn` → idem; só relatório → idem; `.bpmn` + `.png` aceita (V2F); par + relatório aceita (V1F, relatório entra na criação); número 0 → 23514.
  - **Somente leitura (histórica criada acima):** recuar `enviada_em` como superusuário, voltar a `authenticated`; `insert` de um relatório na V2F (histórica sem relatório) → `versao_historica_somente_leitura`; `update` do `tamanho` de um arquivo de histórica → mesma recusa.
  - **Numeração:** `registrar_versao(e1, 6, …)` com o par depois de V5F é aceita e `numero` = 6, com a etapa atual gravada (`modelagem`); depois disso, histórica V7F → `historica_depois_de_versao_nova`.
  - **Situação:** histórica em e2 (suspenso), e3 (cancelado), e4 (concluído) → `processo_fora_de_andamento:<situação>`.
  - **Eventos:** um por registro, `acao = 'registrar_historica'`, `entidade_ref` = processo, `detalhes -> 'depois' ->> 'rotulo'` = `V5F`, `etapa` nula no JSON; a Consulta lê; V6 continua com `acao = 'enviar'`.
  - **Perfis:** integrante registra histórica em e5; consulta, inativo e visitante recusados (42501); consulta e inativo não leem os eventos de histórica (inativo vê 0).
  - `plan(n)` com a contagem real.
- [x] Commit do teste, push da branch `documentos-versoes-04`, "Testes de banco" na branch: o 28 falha (função e regras não existem). Esse é o vermelho; o 27 continua passando.
- [x] Migração (`npx supabase migration new versoes_historicas`, sem `security definer` nas funções de gravação):
  - `grant insert (historica) on public.versoes to authenticated`.
  - `private.conferir_versao_historica(processo, numero)`: recusa com `historica_depois_de_versao_nova` se há versão com `historica` falso; com `numero_historico_repetido:<n>` se o número já existe no processo. `grant execute` a `authenticated`.
  - `private.preparar_versao()` (`create or replace`): ramo da histórica (conferência acima, `etapa_id := null`, número digitado preservado); ramo da nova como está; observação, autor e data em comum.
  - `private.conferir_arquivos_da_versao()` (`create or replace`): ramo da histórica (`.bpm` ou par).
  - `private.preparar_arquivo_da_versao()` (`create or replace`): histórica → `update` sempre recusado, `insert` só na transação da criação (`enviada_em = now()`), com `versao_historica_somente_leitura`.
  - `private.registrar_evento_da_versao()` (`create or replace`, `security definer`, `set search_path = ''`): `acao` por `new.historica`.
  - `private.gravar_arquivos_da_versao(versao uuid, arquivos jsonb)`: o `insert … select` de `jsonb_array_elements` que hoje está dentro de `registrar_versao`; `grant execute` a `authenticated`.
  - `public.registrar_versao` (`create or replace`, mesma assinatura) usando a função acima; `public.registrar_versao_historica` (nova) com a mesma cobrança das conferências adiadas, com os nomes qualificados (`set constraints public.conferir_arquivos_da_versao, public.registrar_evento_da_versao immediate` e depois `deferred`; lição da migração `reunioes_salvar_com_nomes_qualificados`); `revoke execute … from public, anon` e `grant execute … to authenticated`.
- [x] **Ensaio antes de aplicar:** teste temporário `supabase/tests/99_ensaio_versoes_historicas.test.sql` = migração dentro do teste (transação desfeita no fim, como o `99_ensaio_versoes` do ticket 02, commit `04da127`) com os testes 27 e 28 na sequência; "Testes de banco" tudo verde. Depois, apagar o ensaio (commit à parte).
- [x] Commit da migração, push, "Migrar banco de desenvolvimento" com o nome da migração (o campo "migracao" esvazia quando a branch muda: escolher a branch antes). Depois "Testes de banco": tudo verde, inclusive `00_rls_ligada`, `01_buckets_privados`, `10_privilegios_padrao`, 27 e 28. Se falhar, a correção é uma migração nova.
- [x] `npm run db:types` (alvo conferido), `npm run typecheck`; registrar a migração e os números das execuções em `supabase/AMBIENTES.md`. Commit.

### Tarefa 2 — Função do servidor: `registrar` da histórica (critério 1)

**Arquivos:** `supabase/functions/_shared/registro.ts` (+ `registro.test.ts`), `supabase/functions/arquivos-no-drive/registrar.ts`, `scripts/prova-do-drive.mjs`.

**Consome:** `registrar_versao_historica` (Tarefa 1); `lerBooleano`-equivalente de `decisao.ts` (hoje privado: exportar `lerBooleano`) ou a leitura de `historica` dentro de `registro.ts`.
**Produz:** `EntradaRegistrar` com `historica: boolean`; `validarRegistrar` lê `historica` (ausente → `false`; não booleano → `entrada_invalida` com o tipo recebido); `funcaoDoBancoPara(entrada: Pick<EntradaRegistrar, 'historica'>): 'registrar_versao' | 'registrar_versao_historica'`.

- [x] Testes do Vitest primeiro (vermelho), em `registro.test.ts`: `historica` ausente → `false`; `true` e `false` valem; `'sim'` e `1` → `entrada_invalida` citando o tipo; `funcaoDoBancoPara` para cada valor; `recusaDoBanco` para `P0001 historica_depois_de_versao_nova`, `P0001 numero_historico_repetido:5` (código e valor) e `P0001 historica_sem_arquivo_de_fluxograma` → `statusDaRecusaDoBanco` = 409.
- [x] Implementar em `registro.ts` (exportar o leitor de booleano de `decisao.ts` se for o caso). Verde.
- [x] `registrar.ts` (Deno): `gravar` usa `funcaoDoBancoPara(entrada)` no `rpc`, com os mesmos parâmetros. Nada mais muda: `iniciar_envio` já recebe `historica`.
- [x] `scripts/prova-do-drive.mjs`: passo novo no fim — escolhe um processo em andamento sem versão nova, envia um `.bpm` inventado com `historica: true` (o nome volta com o `F`) e chama `registrar` com `historica: true` e o número 1; confere em `versoes` a linha com `historica` verdadeiro. Sem processo assim, relata "sem processo livre" e segue.
- [x] `npm run lint`, `npm run typecheck`, `npm test`. Commit.

### Tarefa 3 — Funções puras da tela (critério 2)

**Arquivos:** `src/versoes/rotulos.ts` (+ teste), `formularioDeVersao.ts` (+ teste).

**Produz:**
- `rotulos.ts`: `haVersaoNova(versoes: Pick<Versao, 'historica'>[]): boolean` (alguma com `historica` falso).
- `formularioDeVersao.ts`: `lerNumeroHistorico(texto: string): number | null` (só dígitos, inteiro maior que zero, sem espaços; senão `null`); `podeRegistrarHistorica(escolhidos, recusas, conferindo, numero: number | null): boolean` (`numero` válido, sem recusa nem conferência em andamento, e `.bpm` escolhido ou `.bpmn` + `.png`); `nomeNaPrevia(processo, numero, papel, arquivo, historica = false)` com o F na histórica.
- [x] Testes primeiro (vermelho): `haVersaoNova` (vazia, só históricas, com nova); `lerNumeroHistorico` (`'5'` → 5, `' 5 '`, `'0'`, `'-1'`, `'5.5'`, `'abc'`, `''` → `null`); `podeRegistrarHistorica` (só `.bpm` sim; só `.bpmn`, só `.png`, só relatório não; par sim; par + `.bpm` sim; recusa ou conferência bloqueia; número `null` bloqueia); prévia `TSA_V5F_Emitir Ofício.bpm` e `…_Relatório.pdf`. Implementar; verde; commit.

### Tarefa 4 — Módulo de versões real e falso, recusas e histórico (critérios 3 e 4)

**Arquivos:** `src/versoes/tipos.ts`, `recusasDeVersoes.ts` (+ teste), `versoesSupabase.ts` (+ teste), `VersoesFalso.ts` (+ teste), `src/cadastros/historicoDosCadastros.ts` (+ teste).

**Consome:** Tarefa 3; `falhaDaFuncao` e `TravaDoBanco`.
**Produz:** `ModuloDeVersoes.registrarVersaoHistorica(pedido: PedidoDeVersao, aoProgredir: (enviados: number, total: number) => void): Promise<void>`; frases novas em `FRASE_DO_CODIGO`: `historica_depois_de_versao_nova` ("O processo já tem versão nova; versões históricas só podem ser registradas antes dela."), `numero_historico_repetido` (valor n: "O processo já tem a versão histórica V{n}F. Use outro número."), `historica_sem_arquivo_de_fluxograma` ("A versão histórica precisa do arquivo .bpm, ou do .bpmn com o .png."); texto do histórico `registrar_historica: 'Registrou a versão histórica'`.

- [x] Testes (vermelho). Módulo real: `registrarVersaoHistorica` chama `iniciar_envio` por arquivo com `historica: true` e o número digitado, faz o `PUT`, avisa o progresso e só então chama `registrar` com `historica: true`; falha num `PUT` não chama `registrar`; `enviarVersao` passa a mandar `historica: false` nas duas chamadas (ajustar as expectativas do ticket 02); as três recusas novas viram as frases. Falso: histórica guardada com `historica: true`, etapa nula, nomes com F (`TSA_V5F_…`), número digitado, evento `registrar_historica` pelo `aoRegistrar`; número repetido, histórica depois de versão nova e conjunto de arquivos sem `.bpm` nem par recusados com as mesmas frases do módulo real (`falhaDaFuncao`); `falhaNoRegistro`, `falharNoArquivo` e `segurarDepoisDe` valem também para a histórica; V6 depois de V5F. Histórico: o evento `registrar_historica` da entidade `versao` aparece como "Registrou a versão histórica V5F — Nome" com os arquivos.
- [x] Implementar: `tipos.ts`; `versoesSupabase.ts` (`enviarVersao(cliente, enviarBytes, pedido, aoProgredir, historica)` e `chamarFuncao` levando `historica`; os dois métodos do módulo escolhem o valor); `VersoesFalso.ts` (um `enviar(pedido, aoProgredir, historica)` privado, com `registrar` ramificado; o evento recebe `acao` por `historica`); `recusasDeVersoes.ts`; `historicoDosCadastros.ts`. Verde; commit.

### Tarefa 5 — Botão, formulário e lista (critérios 2, 3 e 4)

**Arquivos:** `src/components/versoes/SecaoDeVersoes.tsx`, `FormularioDeVersao.tsx`, `CampoDoNumeroHistorico.tsx`, `ListaDeVersoes.tsx`, `Versoes.css`, `src/App.registrarVersaoHistorica.test.tsx`, `src/App.versoesNoHistorico.test.tsx`.

**Consome:** Tarefas 3 e 4; `useArquivosDaVersao`; `versaoDeTeste`, `BPMN_VALIDO`, `PNG_VALIDO` de `src/testes/versoesDeTeste.ts`; `montarNosCadastros`.
- [x] Testes de interface (vermelho), com o aplicativo inteiro e a `VersoesFalso` (`App.registrarVersaoHistorica.test.tsx`):
  - [Registrar versão histórica] aparece para Administrador e Integrante com o processo em andamento e sem versão nova; não aparece para a Consulta, com o processo suspenso, cancelado ou concluído, nem quando há versão nova (semear `versaoDeTeste(1)`); com só históricas aparece.
  - O formulário "Registrar versão histórica" mostra o campo "Número da versão", os quatro campos de arquivo e a observação; [Registrar] desabilitado sem número, com `0`, `5.5` ou `abc` (e a frase "Digite um número inteiro maior que zero."), e sem arquivo; habilita com número e só o `.bpm`; só o `.bpmn` ou só o `.png` não habilita (e uma dica diz "Informe o .bpm, ou o .bpmn com o .png."); `.bpmn` + `.png` habilita; relatório opcional junto.
  - A prévia diz "Esta versão será a V5F" e "Será gravado como: TSA_V5F_Emitir Ofício.bpm".
  - Registrar uma: a lista passa a mostrar `V5F`, sem etapa, com "Histórica · somente leitura" e o nome do arquivo como link; registrar várias (V3F, V4F, V5F), na ordem V5F, V4F, V3F; o botão continua enquanto não há versão nova.
  - Depois de [Enviar versão] (nova V6), o botão [Registrar versão histórica] some; o número da nova continua a partir da histórica (V5F → V6, mostrado na prévia "Esta versão será a V6").
  - Recusas viram mensagem em vermelho (`role="alert"`), com o formulário preenchido: número repetido (falso real), histórica depois de versão nova (`falhaNoRegistro = falhaDaFuncao('historica_depois_de_versao_nova', '')`), falha genérica; progresso "Enviando 1 de 1…" com campos travados.
  - Em `App.versoesNoHistorico.test.tsx`: depois de registrar uma histórica, a aba Histórico mostra "Registrou a versão histórica V5F — Emitir Ofício".
- [x] Componentes: `CampoDoNumeroHistorico` (rótulo "Número da versão", `input` de texto com `inputMode="numeric"`, frase de erro quando o texto não vale); `FormularioDeVersao` recebe `modo` e usa `lerNumeroHistorico`, `podeRegistrarHistorica`, a prévia com o F e `registrarVersaoHistorica` (aria-label "Registrar versão histórica", botão "Registrar", dica dos arquivos); `SecaoDeVersoes` guarda qual formulário está aberto (`null`, `'nova'` ou `'historica'`) e mostra os dois botões pela regra acima; `ListaDeVersoes` ganha o texto "Histórica · somente leitura" no cabeçalho da histórica. CSS no padrão das pílulas. Verde; commit.

### Tarefa 6 — Fecho do ticket

- [x] `npm run lint`, `npm run typecheck`, `npm test`, `npm run check:circular`; "Testes de banco" verde na branch.
- [x] `desvios.md` (entrada "ticket 04"): o que divergir deste plano; que o relatório "só na criação" usa `enviada_em = now()` e como o teste simula outra chamada; que `registrar_versao` foi refeita para dividir a gravação com a histórica; que "sem [Substituir] e sem relatório pendente" na histórica só tem o que provar nos tickets 05 e 06; a prova do Drive da histórica pendente.
- [x] Ticket 04: marcar as caixas dos critérios provados (com a ressalva do `[visual]`: tela não conferida) e deixar a prova real do Drive anotada.
- [x] `.scratch/melhorias-protocolo.md`: os itens de `.claude/regras/nao-testados.md` (blocos "/executar-simples e /executar-complexo" e "Qualquer momento") que aconteceram nesta execução.
- [x] Juntar à `documentos-versoes-01` (fast-forward, como o ticket 03) e apagar a branch com `git branch -d`; enviar a `documentos-versoes-01` ao GitHub (sem `--force`). Se o `-d` recusar, parar e perguntar.
- [x] **Perguntar ao usuário** se grava a linha `Concluído em` do ticket 04 agora (o comando manda) ou só depois da prova do Drive (regra dos tickets 01 a 03). Depois, apontar o ticket 05 e lembrar o `/cost`.

> **Situação em 2026-10-15:** tarefas 1 a 6 feitas. O ticket 04 foi juntado à `documentos-versoes-01` por fast-forward (último commit `983bfbc`), e não à `main`. A linha `Concluído em` não foi gravada (regra dos tickets 01 a 03, prova do Drive pendente); a pergunta ao usuário ficou para o relatório final da sessão.
