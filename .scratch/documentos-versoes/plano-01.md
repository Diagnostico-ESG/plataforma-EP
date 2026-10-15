# Ticket 01 de documentos-versoes (Ligação com o Drive) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** provar que a plataforma guarda e traz de volta um arquivo do Drive compartilhado do CED por uma conta de serviço, pela primeira Edge Function do projeto (`arquivos-no-drive`, ações `iniciar_envio` e `baixar`), com a tabela `pastas_no_drive` e sem mudar nenhuma tela.

**Architecture:** a decisão (quem pode, qual entrada vale, nome padrão, consulta de pasta, erro de cota) vive em arquivos puros em `supabase/functions/_shared/`, testados no Vitest. A função (Deno) só liga esses arquivos ao mundo: lê os segredos num único ponto, confere o chamador com o login dele no Supabase, fala com o Drive por `fetch` e grava `pastas_no_drive` com o login do chamador. Os bytes vão do navegador direto ao Google pela sessão de envio resumível.

**Tech Stack:** Deno (Edge Function) + `npm:@supabase/supabase-js@2`, TypeScript, Vitest, pgTAP pelo GitHub Actions, Drive API v3 (REST por `fetch`, sem biblioteca do Google).

**Spec:** `.scratch/documentos-versoes/spec.md` (seções "Função do servidor", "Pastas no Drive", "Modelo de dados", tabela `pastas_no_drive`; histórias 36, 37, 40, 43) · **Ticket:** `.scratch/documentos-versoes/issues/01-ligacao-com-o-drive.md` (critérios citados como "critério N", na ordem: 1 documentação, 2 roteiro, 3 segredos, 4 arquivo puro, 5 conferência do chamador, 6 `iniciar_envio`, 7 nome padrão, 8 `pastas_no_drive`, 9 resposta e logs, 10 prova).

## Global Constraints

- `npm` para tudo; **nenhuma dependência nova no `package.json`** (a função importa `@supabase/supabase-js` por `npm:` no Deno, que não entra no navegador). Regras de `.claude/regras/banco.md` lidas nesta sessão (seções "Ambientes e migrações", "Chaves", "Views e funções", "Edge Functions").
- Alvo do banco: "vínculo atual" de `supabase/AMBIENTES.md` e `supabase/.temp/project-ref` são `yclkzyoebpsxmgpbcbus` (desenvolvimento); conferir antes de `functions deploy`/`secrets set`. Produção não existe e nada aqui vai a ela.
- **A chave secreta do Supabase não é usada.** Única credencial secreta: a chave da conta de serviço do Google, só como segredo da função, nunca no código, no `.env.example`, no git nem na conversa. `npx supabase login`, `link`, `secrets set` e `functions deploy` são do usuário, no terminal dele.
- Funções de lógica de 4 a 20 linhas, arquivos até 300 linhas, complexidade até 10, tipos explícitos, nenhum `any`, early return, até 2 níveis de indentação. Mensagem de erro com o valor recebido e o formato esperado (sem dado pessoal). Dados de teste só inventados. Falha e recusa com código e mensagem genérica.
- Teste vem antes do código; teste que falha por erro de digitação não conta como o "vermelho". Migração, teste de banco e tipos no mesmo commit (tipos regenerados depois da migração aplicada, em commit seguinte).

## Decisões do plano

- **Código compartilhado em `supabase/functions/_shared/`** (convenção do Supabase para código comum às funções, empacotada junto na publicação). Os arquivos puros ficam lá, sem `Deno.` nem `npm:`, importam uns aos outros com extensão `.ts`, e o ticket 02 também os importa da interface (prévia do nome). O ESLint já alcança (`**/*.{ts,tsx}`); falta incluí-los no limite de 20 linhas por função (`eslint.config.js`) e no `tsc` (`tsconfig.app.json`, `include`).
- **Autenticação confirmada na documentação atual** (critério 1, registrar no ticket): `verify_jwt` vem ligado por padrão (a plataforma recusa pedido sem JWT válido antes do código); variáveis injetadas: `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEYS` (JSON com chaves nomeadas), `SUPABASE_SECRET_KEYS`, `SUPABASE_JWKS`, e, no desenvolvimento local, `SUPABASE_PUBLISHABLE_KEY`; legadas `SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY`. Segredos próprios não podem começar por `SUPABASE_`. A função cria o cliente com a chave publicável (`SUPABASE_PUBLISHABLE_KEYS.default`, com queda para `SUPABASE_PUBLISHABLE_KEY` e `SUPABASE_ANON_KEY`) e o cabeçalho `Authorization` do pedido, e confere o usuário com `auth.getUser()`; o perfil e o `ativo` vêm de `usuarios` lido com esse mesmo cliente (a RLS vale). A chave secreta nunca é lida.
- **Segredos próprios** (nomes fixos, lidos só em `configuracao.ts`): `EP_DRIVE_CONTA_EMAIL`, `EP_DRIVE_CONTA_CHAVE` (a chave privada PEM), `EP_DRIVE_RAIZ_ID` (identificador do Drive compartilhado ou da pasta raiz do ambiente), `EP_ORIGENS_ACEITAS` (endereços do site separados por vírgula).
- **`iniciar_envio` recebe o número da versão e se é histórica** (`numero`, `historica`) neste ticket, porque a tabela `versoes` só nasce no ticket 02. O ticket 02 passa a calcular o número no banco e ignora o que a tela mandar. Vai para o `desvios.md`.
- **`baixar` neste ticket confere a pasta, não a RLS de `arquivos_da_versao`** (que nasce no 02): recebe o `drive_id` e só entrega se o arquivo estiver numa pasta registrada em `pastas_no_drive` que o chamador consegue ler (impede ler qualquer arquivo do Drive só pelo identificador). O 02 troca por `arquivos_da_versao`.
- **Escopo do Drive:** `https://www.googleapis.com/auth/drive` (conta de serviço não passa por tela de consentimento). Todas as chamadas levam `supportsAllDrives=true` (e `includeItemsFromAllDrives=true`, `corpora=allDrives` nas buscas). Conta de serviço não tem cota própria: por isso o destino precisa ser Drive compartilhado; erro `storageQuotaExceeded` vira o código `sem_espaco_no_drive`.
- **CORS:** a função responde `OPTIONS` e só devolve `Access-Control-Allow-Origin` para origem de `EP_ORIGENS_ACEITAS`; a sessão de envio resumível é aberta com o cabeçalho `Origin` do navegador, para o `PUT` direto ao Google ser aceito.
- **Pasta de teste e arquivo órfão:** a função nunca apaga nada no Drive. O arquivo de teste da prova fica na pasta de desenvolvimento e o usuário o apaga à mão.
- **Prova de ponta a ponta** por script `scripts/prova-do-drive.mjs`, rodado **pelo usuário** no terminal dele: pede e-mail e senha de cada usuário inventado na hora (nunca grava), entra com o cliente publicável, e chama a função. Os usuários inventados (um Integrante, uma Consulta) o usuário cria no painel/SQL do desenvolvimento seguindo o roteiro, e apaga ao fim.

## Estrutura de arquivos

Criar: `supabase/functions/_shared/nomePadrao.ts` (+ teste), `decisao.ts` (+ teste), `drive.ts` (+ teste); `supabase/functions/arquivos-no-drive/index.ts`, `configuracao.ts`, `chamador.ts`, `google.ts`, `pastas.ts`, `acoes.ts`; `supabase/tests/26_pastas_no_drive.test.sql`; `supabase/migrations/<data>_pastas_no_drive.sql`; `docs/drive-conta-de-servico.md` (roteiro); `scripts/prova-do-drive.mjs`.

Modificar: `eslint.config.js`, `tsconfig.app.json`, `src/types/database.ts` (gerado), `supabase/AMBIENTES.md`, `.scratch/documentos-versoes/issues/01-ligacao-com-o-drive.md` (registros), `.scratch/documentos-versoes/desvios.md` (novo), `supabase/config.toml` (bloco da função, só se preciso).

## Tarefas

### Tarefa 1 — Branch, marco e alcance das ferramentas

**Arquivos:** `eslint.config.js`, `tsconfig.app.json`.

- [x] `git switch -c documentos-versoes-01`; `git tag marco/2026-10-15-inicio-ticket-01-documentos-versoes`; conferir `supabase/.temp/project-ref` = `yclkzyoebpsxmgpbcbus` (só o arquivo, sem rodar a CLI).
- [x] `tsconfig.app.json`: `"include": ["src", "supabase/functions/_shared"]`. `eslint.config.js`: no bloco do limite de 20 linhas por função, `files: ['src/**/*.ts', 'supabase/functions/**/*.ts']` (os `*.test.ts` continuam de fora).
- [x] Comitar junto com este plano ("Ticket 01 de documentos-versoes: plano de execução e alcance do lint e do tsc"). `npm run typecheck` e `npm run lint` verdes (ainda sem arquivos novos).

### Tarefa 2 — Nome padrão (critério 7)

**Arquivos:** `supabase/functions/_shared/nomePadrao.ts`, `nomePadrao.test.ts`.

**Interfaces — Produz:**
```ts
export type PapelDoArquivo = 'bpmn' | 'png' | 'bpm' | 'relatorio'
export interface DadosDoNome {
  sigla: string; numero: number; historica: boolean
  nomeDoProcesso: string; papel: PapelDoArquivo; extensao: string
}
export function limparParaNomeDeArquivo(texto: string): string
export function nomePadrao(dados: DadosDoNome): string
```

- [x] Teste que falha (`nomePadrao.test.ts`), cobrindo: `CEE_V6_Nome do processo.bpmn`; histórica `CEE_V5F_Nome do processo.png`; relatório `CEE_V6_Nome do processo_Relatório.pdf`; acentos mantidos (`Concessão de Licença`); `\ / : * ? " < > |` e caractere de controle (`\u0007`) viram `-`; espaços repetidos e pontas viram um espaço só; extensão em maiúsculas sai em minúsculas; `numero` 0, negativo ou fracionário lança erro com o valor recebido e o formato esperado ("número inteiro maior que zero").
- [x] Rodar `npx vitest run supabase/functions/_shared/nomePadrao.test.ts`: falha por função inexistente.
- [x] Implementar: `limparParaNomeDeArquivo` troca `/[\\/:*?"<>|\u0000-\u001f]/g` por `-`, reduz `\s+` a um espaço e apara; `nomePadrao` monta `${sigla}_V${numero}${historica ? 'F' : ''}_${nome}${papel === 'relatorio' ? '_Relatório' : ''}.${extensao.toLowerCase()}`, limpando sigla e nome. Rodar o teste e comitar.

### Tarefa 3 — Decisão pura (critérios 4, 5, 9)

**Arquivos:** `supabase/functions/_shared/decisao.ts`, `decisao.test.ts`.

**Interfaces — Consome:** `PapelDoArquivo` de `nomePadrao.ts`. **Produz:**
```ts
export type Perfil = 'administrador' | 'integrante_ep' | 'consulta'
export type Acao = 'iniciar_envio' | 'baixar'
export interface Chamador { perfil: Perfil; ativo: boolean }   // null = sem login
export type CodigoDeRecusa =
  | 'sem_login' | 'usuario_inativo' | 'sem_permissao' | 'entrada_invalida'
  | 'processo_fora_de_andamento' | 'extensao_nao_aceita' | 'arquivo_grande'
export interface Recusa { codigo: CodigoDeRecusa; mensagem: string }
export const LIMITE_DE_TAMANHO = 20 * 1024 * 1024
export function conferirChamador(chamador: Chamador | null, acao: Acao): Recusa | null
export function conferirProcessoEmAndamento(situacao: string): Recusa | null
export interface EntradaIniciarEnvio {
  processoId: string; papel: PapelDoArquivo; nomeOriginal: string
  tamanho: number; numero: number; historica: boolean
}
export interface EntradaBaixar { driveId: string }
export type Validacao<T> = { ok: true; valor: T } | { ok: false; recusa: Recusa }
export function validarIniciarEnvio(entrada: unknown): Validacao<EntradaIniciarEnvio>
export function validarBaixar(entrada: unknown): Validacao<EntradaBaixar>
export function extensaoDoNome(nome: string): string   // minúscula, sem ponto, '' se não houver
```
Entrada de fora: `{ processo_id, papel, nome_original, tamanho, numero, historica }` e `{ drive_id }` (campos em snake_case, como a tela vai mandar).

- [x] Testes que falham, um por célula da tabela "Função do servidor" da spec: `conferirChamador` para (`iniciar_envio`) Administrador e Integrante `null`, Consulta `sem_permissao`, inativo `usuario_inativo`, sem login `sem_login`; (`baixar`) Administrador, Integrante e Consulta `null`, inativo e sem login recusados. Mais: `conferirProcessoEmAndamento` aceita `em_andamento` e recusa `suspenso`, `cancelado` e `concluido`; `validarIniciarEnvio` aceita a entrada válida de cada papel (`relatorio` com `.docx` e `.pdf`), recusa extensão errada para o papel (`relatorio` `.png`, `bpmn` `.xml`), `.bpmn` maiúsculo aceito, tamanho `LIMITE_DE_TAMANHO + 1` (`arquivo_grande`), tamanho 0, negativo, fracionário ou texto (`entrada_invalida`), `processo_id` que não é uuid, campo faltando, `papel` desconhecido, `numero` 0, `historica` que não é booleano, corpo que não é objeto (`null`, texto, lista); a mensagem de cada recusa traz o nome do campo e o tipo recebido, nunca o valor; `validarBaixar` aceita texto não vazio (até 200 caracteres, só letras, números, `_` e `-`, o formato dos identificadores do Drive) e recusa o resto.
- [x] Rodar: falha por módulo inexistente.
- [x] Implementar com funções pequenas por campo (`lerUuid`, `lerPapel`, `lerTamanho`…) para ficar nos limites de complexidade. Rodar e comitar.

### Tarefa 4 — Auxiliares puros do Drive (critérios 6, 9)

**Arquivos:** `supabase/functions/_shared/drive.ts`, `drive.test.ts`.

**Interfaces — Produz:**
```ts
export function consultaDePastaPorNome(nome: string, paiId: string): string
export function eErroDeCota(corpo: unknown): boolean
export function origemAceita(origem: string | null, aceitas: string): boolean
export function cabecalhosDeOrigem(origem: string | null, aceitas: string): Record<string, string>
```

- [ ] Testes que falham: `consultaDePastaPorNome("A'B\\C", 'pai1')` devolve `name = 'A\'B\\\\C' and 'pai1' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false` (aspas e barras escapadas); `eErroDeCota` verdadeiro para `{error:{errors:[{reason:'storageQuotaExceeded'}]}}` e `teamDriveFileLimitExceeded`, falso para outro motivo, `null`, texto e objeto sem `error`; `origemAceita` com lista `"https://a.x, https://b.y"`: aceita `https://b.y`, recusa `https://c.z`, recusa `null` e lista vazia; `cabecalhosDeOrigem` devolve `Access-Control-Allow-Origin` só para origem aceita, sempre `Vary: Origin`, `Access-Control-Allow-Headers: authorization, content-type, apikey, x-client-info` e `Access-Control-Allow-Methods: POST, OPTIONS`.
- [ ] Rodar (falha), implementar, rodar e comitar.

### Tarefa 5 — Banco: `pastas_no_drive` (critério 8)

**Arquivos:** `supabase/tests/26_pastas_no_drive.test.sql`, `supabase/migrations/<AAAAMMDDHHMMSS>_pastas_no_drive.sql`, `src/types/database.ts`, `supabase/AMBIENTES.md`. Regras de `banco.md` que valem: toda tabela com RLS e políticas testadas na mesma migração, teste antes; revoke dos privilégios padrão (teste `10_privilegios_padrao`); alvo conferido; migração só pelo workflow "Migrar banco de desenvolvimento" e testes pelo "Testes de banco".

- [ ] Teste 26 no molde do 25 (`_tap`, usuários a1 administrador, a2 integrante, a3 consulta, a4 inativo; visitante com `set local role anon`). Uma pasta de setor e uma de processo preparadas como dono; casos: **ler** (a1, a2, a3 veem as duas linhas; a4 e visitante 0 ou recusa); **criar** pasta de setor e de processo (a1 e a2 conseguem; a3, a4 e visitante recusados); **alterar `drive_id`** (a1 e a2 conseguem; a3, a4 e visitante 0 linhas); **alterar `setor_id` ou `processo_id`** recusado até para a1 (sem privilégio de coluna); **apagar** recusado para os cinco; regras da tabela: uma linha com os dois donos preenchidos recusada, uma sem nenhum recusada, segunda pasta para o mesmo setor e para o mesmo processo recusadas, `drive_id` vazio recusado; **apagar o processo** (como dono) remove a pasta dele em cascata. Plano com a contagem real.
- [ ] Migração (`npx supabase migration new pastas_no_drive`):
  ```sql
  create table public.pastas_no_drive (
    id uuid primary key default gen_random_uuid(),
    setor_id uuid unique references public.setores (id) on delete cascade,
    processo_id uuid unique references public.processos (id) on delete cascade,
    drive_id text not null check (btrim(drive_id) <> ''),
    constraint pasta_de_um_so_dono check ((setor_id is null) <> (processo_id is null))
  );
  alter table public.pastas_no_drive enable row level security;
  revoke all on public.pastas_no_drive from anon, authenticated;
  grant select on public.pastas_no_drive to authenticated;
  grant insert (setor_id, processo_id, drive_id) on public.pastas_no_drive to authenticated;
  grant update (drive_id) on public.pastas_no_drive to authenticated;
  create policy "pastas_no_drive: ativo lê" on public.pastas_no_drive
    for select to authenticated using ((select private.usuario_ativo()));
  create policy "pastas_no_drive: administrador e integrante ativos criam" on public.pastas_no_drive
    for insert to authenticated with check ((select private.pode_alterar_cadastros()));
  create policy "pastas_no_drive: administrador e integrante ativos alteram" on public.pastas_no_drive
    for update to authenticated
    using ((select private.pode_alterar_cadastros())) with check ((select private.pode_alterar_cadastros()));
  ```
  Comentário na migração: o `on delete cascade` apaga só a linha; a pasta no Drive fica (a função não apaga nada).
- [ ] Comitar o teste 26 **sem** a migração (o "vermelho"), `git push -u origin documentos-versoes-01`, disparar "Testes de banco" na branch e ler: o 26 falha (tabela inexistente) e os demais passam. Depois comitar a migração, push, disparar "Migrar banco de desenvolvimento" (`migracao` = nome do arquivo) e "Testes de banco" de novo: todos verdes.
- [ ] `npm run db:types` (alvo conferido); `tsc` verde. Registrar a migração em `supabase/AMBIENTES.md` (com o que falhou antes e o que passou depois). Comitar.

### Tarefa 6 — Função `arquivos-no-drive` (critérios 3, 5, 6, 9)

**Arquivos:** `supabase/functions/arquivos-no-drive/{index,configuracao,chamador,google,pastas,acoes}.ts` (criar a pasta com `npx supabase functions new arquivos-no-drive`, que também cria o `index.ts` inicial; apagar o exemplo). Sem teste automático do Deno (a decisão e os auxiliares já têm); o comportamento se prova na Tarefa 8.

- [ ] `configuracao.ts`: `lerConfiguracao(env): Configuracao` com `contaEmail`, `contaChave` (aceita `\n` literais e troca por quebra de linha), `raizId`, `origensAceitas`; falta de segredo lança erro que nomeia a variável (nunca o valor). É o único arquivo que lê `Deno.env`.
- [ ] `chamador.ts`: `identificarChamador(req, config): Promise<{ cliente, usuarioId, chamador: Chamador | null }>` — cria `createClient(SUPABASE_URL, chavePublicavel, { global: { headers: { Authorization } }, auth: { persistSession: false } })`, `auth.getUser()` (sem usuário → `chamador: null`), lê `usuarios` (`perfil`, `ativo`) do próprio usuário com o mesmo cliente. Ordem exigida: `conferirChamador` roda **antes** de qualquer chamada ao Drive.
- [ ] `google.ts`: `obterToken(config)` (JWT RS256 de 1 h com `crypto.subtle`, escopo `drive`, troca em `https://oauth2.googleapis.com/token`, guardado em memória até 5 min antes de vencer); `chamarDrive(token, caminho, opcoes)` que acrescenta `supportsAllDrives=true`, repassa o corpo de erro a `eErroDeCota` e lança `ErroDoDrive` com código `sem_espaco_no_drive` ou `drive_indisponivel` (mensagem genérica; o corpo do Google não vai para a resposta nem para o log).
- [ ] `pastas.ts`: `garantirPasta(cliente, token, config, dono, nome, paiId)` — procura a linha em `pastas_no_drive` (RLS, login do chamador); se não houver, procura no Drive por nome e pai com `consultaDePastaPorNome` e, não achando, cria; grava a linha. Se houver e o nome ou o pai no Drive não baterem com o atual, renomeia/move (`PATCH` com `name`, `addParents`, `removeParents`). `garantirPastaDoProcesso(...)`: raiz → pasta do setor (sigla) → pasta do processo (nome limpo por `limparParaNomeDeArquivo`).
- [ ] `acoes.ts`: `iniciarEnvio(ctx, entrada)` lê o processo em `processos_com_andamento` (`id`, `nome`, `setor_id`, `setor_sigla`, `situacao`) com o login do chamador (inexistente ou invisível → `entrada_invalida`), confere `conferirProcessoEmAndamento`, garante as pastas, calcula `nomePadrao` e abre a sessão resumível (`POST https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable&supportsAllDrives=true&fields=id` com `X-Upload-Content-Type`, `X-Upload-Content-Length`, corpo `{ name, parents }` e `Origin` do pedido), devolvendo `{ upload_url, nome }` (o `Location`); `baixar(ctx, entrada)` busca `parents` do arquivo (`fields=id,name,parents`), confere que o pai está em `pastas_no_drive` (lido com o login do chamador; senão `sem_permissao`), lê `alt=media` e devolve os bytes com `Content-Disposition` do nome do arquivo no Drive.
- [ ] `index.ts`: `Deno.serve`; `OPTIONS` responde 204 com os cabeçalhos de `cabecalhosDeOrigem`; método diferente de `POST` → 405; corpo `{ acao, ...campos }` lido com `req.json()` num `try` (JSON inválido → `entrada_invalida`); sequência: configuração → `identificarChamador` → `conferirChamador` → validar a entrada → ação. Recusa devolve `{ codigo, mensagem }` com status 401 (`sem_login`), 403 (`usuario_inativo`, `sem_permissao`) ou 400 (as demais); erro inesperado devolve 500 `{ codigo: 'erro_interno', mensagem: 'Não foi possível concluir o pedido.' }` e o log registra só o nome do erro e a ação, nunca e-mail, nome de processo ou corpo.
- [ ] `npm run lint`, `npm run typecheck` e `npm test` verdes (os `.ts` da função fora de `_shared` não entram no `tsc`; conferir que o ESLint os lê sem erro). Comitar.

### Tarefa 7 — Roteiro do usuário (critério 2)

**Arquivos:** `docs/drive-conta-de-servico.md`.

- [ ] Antes de escrever, conferir na documentação atual do Google qual papel do Drive compartilhado basta para criar, renomear e mover pastas e arquivos (previsto: "Gerente de conteúdo"; "Colaborador" não renomeia/move pastas de outros) e registrar a fonte no ticket.
- [ ] Roteiro em linguagem simples, passo a passo, cada termo técnico explicado em uma frase: (1) no projeto Google Cloud pessoal (o mesmo do login), ativar a API do Google Drive e criar a conta de serviço "ep-drive", gerar a chave JSON e guardá-la fora do projeto (pasta `dados-reais/` ou fora do repositório); (2) no Drive do CED criar os Drives compartilhados "EP – desenvolvimento" e "EP – produção" e adicionar o e-mail da conta de serviço com o papel conferido; anotar o identificador do Drive de desenvolvimento (o trecho final do endereço da pasta); (3) `npx supabase login` e `npx supabase link --project-ref yclkzyoebpsxmgpbcbus` (se ainda não ligado), no terminal do usuário; (4) gravar os quatro segredos com `npx supabase secrets set` lendo a chave do arquivo (comando que nunca imprime a chave), seguido de `npx supabase secrets list` para conferir só os nomes; (5) `npx supabase functions deploy arquivos-no-drive --use-api`; (6) criar no desenvolvimento os dois usuários inventados (autorização + usuário com senha no painel) e depois rodar a prova da Tarefa 8; (7) ao fim, apagar os usuários inventados e o arquivo de teste no Drive; (8) manter no Drive as permissões da equipe (Integrantes como Colaborador; o usuário como Administrador).
- [ ] Comitar. Entregar o roteiro ao usuário e parar para ele executar os passos 1 a 5 (a sessão não toca em login, chave, segredo nem publicação).

### Tarefa 8 — Prova de ponta a ponta (critério 10)

**Arquivos:** `scripts/prova-do-drive.mjs`.

- [ ] Script do usuário, sem dependência nova (`@supabase/supabase-js` já existe): lê `VITE_SUPABASE_URL` e `VITE_SUPABASE_PUBLISHABLE_KEY` de `.env.local` (sem imprimir), pede por `readline` o e-mail e a senha do Integrante inventado (a senha sem eco não é necessária: o terminal é do usuário; nada é gravado nem impresso), entra, escolhe o primeiro processo em andamento do desenvolvimento, chama `iniciar_envio` com um `.bpmn` de teste inventado de poucos bytes, faz o `PUT` ao `upload_url` (com `Origin` do site local), chama `baixar` com o `id` devolvido e compara os bytes (igual → "OK: enviado e baixado de volta, iguais"); repete com o Consulta e espera `403 sem_permissao` no envio e sucesso no download. Imprime só códigos e "OK"/"FALHOU", nunca e-mail, senha, token ou endereço da sessão.
- [ ] Comitar. O usuário roda o script; o resultado (as linhas impressas) volta para a conversa e é registrado no ticket.

### Tarefa 9 — Fecho do ticket

- [ ] Registrar no ticket: o que foi confirmado na documentação (critério 1), a fonte do papel do Drive, o resultado da prova e a ressalva do `[visual]` (nenhuma, ticket sem tela). Marcar as caixas dos critérios.
- [ ] `.scratch/documentos-versoes/desvios.md` (novo, com data): `iniciar_envio` recebe `numero` e `historica` neste ticket; `baixar` confere a pasta e não a RLS de `arquivos_da_versao`; `_shared` como lugar do código compartilhado e do arquivo puro; qualquer outra divergência que apareça.
- [ ] Rodar a bateria completa (`npm run lint`, `npm run typecheck`, `npm test`, `npm run check:circular`) e o "Testes de banco" na branch; juntar à `main` (`git switch main`, merge, `git branch -d documentos-versoes-01`; se o `-d` recusar, parar e perguntar); `git push` da `main`, conferir o "Testes de banco" na `main`.
- [ ] Linha `Concluído em AAAA-MM-DD (commit <hash>)` no fim do ticket, comitar, e registrar em `.scratch/melhorias-protocolo.md` os itens não testados que aconteceram (conforme `.claude/regras/nao-testados.md`).
