# Ticket 06 de documentos-versoes (Substituir arquivo) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** dar a cada arquivo de versão nova o botão [Substituir]: depois de uma confirmação que avisa que o anterior não fica guardado, o arquivo novo (mesmo papel e mesmo formato, mesmas conferências do envio) é gravado no **mesmo arquivo do Drive**, o nome padrão e a versão ficam, e o histórico registra quem trocou, quando, qual arquivo e o nome e o hash do que saiu.

**Architecture:** o banco ganha só a função `substituir_arquivo` e o gatilho do evento (o privilégio de coluna `update (tamanho, hash_md5, enviado_por, enviado_em)`, a RLS de alterar e os gatilhos "processo em andamento" e "histórica somente leitura" já nasceram nos tickets 02 e 04). A função do servidor reaproveita `iniciar_envio` (com `arquivo_id`: abre uma sessão de **atualização** do arquivo existente, sem criar nada) e `registrar` (com `arquivo_id`: chama `substituir_arquivo`). A interface ganha o método `substituirArquivo` no módulo (real e falso), o botão, o formulário e a confirmação.

**Tech Stack:** React + Vitest + Testing Library; Edge Function Deno (`arquivos-no-drive`); Postgres/pgTAP pelo GitHub Actions; Drive API v3 por `fetch` (`PATCH upload/drive/v3/files/{id}?uploadType=resumable`).

**Spec:** `.scratch/documentos-versoes/spec.md` (histórias 28 a 32, 42 e 45; regras "Versão histórica é somente leitura", "Substituir só troca o conteúdo", "Toda mudança vira um evento"; seção "Substituir sem guardar o anterior") · **ADR:** `docs/adr/0007` · **Ticket:** `.scratch/documentos-versoes/issues/06-substituir-arquivo.md` (critérios citados como "critério N", na ordem: 1 banco, 2 mesmo identificador do Drive, 3 botão e confirmação, 4 histórico, 5 testes de interface).

## Global Constraints

- Regras de `.claude/regras/banco.md` lidas nesta sessão. Valem aqui: teste de banco antes da migração; RLS e privilégios mínimos (nada novo é concedido: `nome`, `papel`, `drive_id` seguem sem privilégio de `update`; o teste `10_privilegios_padrao` continua passando); regra de negócio em gatilho ou função; função de gravação sem `security definer` (a RLS decide); só a função que grava o evento é `security definer`, com `search_path` vazio e nomes qualificados; nenhuma view, nenhum bucket; a Edge Function confere o chamador antes de tocar o Drive (decisão em arquivo puro testado no Vitest); a chave secreta do Supabase não é usada; nenhum arquivo é apagado.
- Banco só pelos workflows do GitHub (porta 5432 fechada): "Testes de banco" e "Migrar banco de desenvolvimento" na branch `documentos-versoes-06`, disparados pelo navegador do app (autorizado no CLAUDE.md, seção "Ajustes deste Projeto"). Alvo conferido antes de `db:types`: "vínculo atual" de `supabase/AMBIENTES.md` = `supabase/.temp/project-ref` = `yclkzyoebpsxmgpbcbus`. Migração aplicada no dev não se edita: ensaiar antes (Tarefa 1).
- Nenhuma dependência nova. Funções de lógica de 4 a 20 linhas (hooks até 40), arquivos até 300, complexidade até 10, sem `any`, mensagens de erro com o recebido e o esperado, dados de teste inventados.
- Cada commit roda a bateria inteira no pré-commit (cerca de 1 minuto): rodar em segundo plano. Nunca `--no-verify`.
- A branch `documentos-versoes-06` parte de `documentos-versoes-01` (pedido do usuário); a `main` só recebe os tickets 01 a 06 depois da prova do Drive. Marco: `marco/2026-10-16-inicio-ticket-06-documentos-versoes`.

## Decisões do plano

- **Recusas do banco em P0001 `motivo:valor`**, como nos tickets 02, 04 e 05. Novo: `tipo_de_arquivo_diferente:<formato do arquivo que fica>` (o formato novo difere do formato guardado). Já existem e valem: `versao_historica_somente_leitura`, `processo_fora_de_andamento:<situação>`. Perfil sem permissão: 42501 (a função do banco levanta quando a RLS não deixa nenhuma linha mudar).
- **"Mesmo tipo" = mesmo papel e mesmo formato** (o `formato` do arquivo não muda; trocar .docx por .pdf recusa). O papel do pedido tem de ser o do arquivo; o formato do arquivo novo, o do que sai. O nome (e a extensão dele) fica, então só assim o nome continua verdadeiro.
- **Função do banco:** `public.substituir_arquivo(p_arquivo uuid, p_novo jsonb) returns uuid` (sem `security definer`): confere o formato, faz `update arquivos_da_versao set tamanho, hash_md5 where id = p_arquivo` (os gatilhos antes do ticket 04 e 05 cuidam de andamento, histórica, autor e data) e, se nenhuma linha mudou (RLS), levanta 42501. Devolve o id.
- **Evento:** gatilho `after update` em `arquivos_da_versao`, função `private.registrar_evento_da_substituicao()` (`security definer`): `acao = 'substituir'`, `entidade = 'versao'`, `entidade_ref` = id do processo; `antes = {nome, hash_md5}` do que saiu; `depois = {rotulo, processo_nome, setor_sigla, nome, hash_md5}` do que entrou. O `nome` é o mesmo (o nome padrão é fixo, regra 18); o hash é que muda, e é ele que prova a troca.
- **Função do servidor, `iniciar_envio` com `arquivo_id`** (uuid, opcional; `numero` e `historica` seguem obrigatórios no pedido e o cliente manda os da versão; o servidor os ignora na substituição): confere processo em andamento; lê o arquivo pela RLS (`arquivos_da_versao` + `versoes(processo_id, historica)`); decide no arquivo puro novo `_shared/substituicao.ts` (arquivo do processo certo, versão nova, mesmo papel, mesma extensão); abre a sessão por `PATCH …/files/{drive_id}?uploadType=resumable` **sem `name` nem `parents`** (o nome e a pasta ficam) e devolve `{upload_url, nome}` com o nome guardado. Nada é criado no Drive.
- **Função do servidor, `registrar` com `arquivo_id`:** um único arquivo; `historica` falso; sem `versao_id`. Antes de gravar, lê o arquivo pela RLS e exige que o `drive_id` do pedido seja o do arquivo (senão o hash de outro arquivo da pasta poderia ser gravado). O resto (tamanho, MD5, pasta, formato) já vem de `conferirArquivosNoDrive`. Chama `substituir_arquivo`.
- **Códigos novos em `decisao.ts`:** `tipo_de_arquivo_diferente` e `versao_historica_somente_leitura` entram em `CodigoDeRecusa` (status 409), para a decisão pura devolver recusa pronta antes de tocar o Drive.
- **Tela:** o [Substituir] fica ao lado do nome de cada arquivo da versão nova, para Administrador e Integrante com o processo em andamento (a mesma condição do restante da seção). Ele abre um formulário pequeno no próprio item (campo do mesmo papel, conferências do envio, prévia "Continuará gravado como: <nome>"); [Substituir] do formulário abre a janela de confirmação, que avisa que o arquivo anterior não fica guardado; só a confirmação envia. Falha: mensagem em vermelho, arquivo escolhido preservado.
- **Falso (`VersoesFalso`):** `substituirArquivo` imita o banco: histórica recusa, formato diferente recusa, troca o tamanho no mesmo id, guarda um hash sintético por arquivo e chama `aoRegistrar` com o evento `substituir`. Falhas programáveis já existentes (`falharNoArquivo`, `falhaNoRegistro`, `segurarDepoisDe`) valem também aqui.
- **Prova do Drive (`scripts/prova-do-drive.mjs`)** ganha o passo da substituição (mesmo `drive_id`, hash novo, nenhum arquivo novo na pasta); roda no roteiro do usuário, junto com a dos tickets 01 a 05.
- **Concluído em:** este ticket segue a regra dos tickets 01 a 05 (sem a linha `Concluído em` até a prova do Drive, decisão do usuário em 2026-10-15). O comando manda gravar a linha; a Tarefa 6 pergunta ao usuário antes.

## Estrutura de arquivos

Criar:
- `supabase/tests/30_substituir_arquivo.test.sql`
- `supabase/migrations/<data>_substituir_arquivo.sql` (criada com `npx supabase migration new substituir_arquivo`)
- `supabase/functions/_shared/substituicao.ts` (+ `substituicao.test.ts`)
- `supabase/functions/arquivos-no-drive/substituicao.ts`
- `src/components/versoes/FormularioDeSubstituicao.tsx`
- `src/App.substituirArquivo.test.tsx`

Modificar: `supabase/functions/_shared/decisao.ts`, `registro.ts` (+ testes), `arquivos-no-drive/acoes.ts`, `registrar.ts`, `scripts/prova-do-drive.mjs`, `src/versoes/tipos.ts`, `recusasDeVersoes.ts`, `versoesSupabase.ts`, `VersoesFalso.ts` (+ testes), `src/cadastros/historicoDosCadastros.ts` (+ `historicoDasVersoes.test.ts`), `src/components/versoes/ListaDeVersoes.tsx`, `Versoes.css`, `src/App.versoesNoHistorico.test.tsx`, `src/types/database.ts` (gerado), `supabase/AMBIENTES.md`, `.scratch/documentos-versoes/desvios.md`, `issues/06-substituir-arquivo.md`, `.scratch/melhorias-protocolo.md`.

## Tarefas

### Tarefa 1 — Banco: teste, ensaio, migração, aplicação e tipos (critérios 1 e 4)

**Arquivos:** `supabase/tests/30_substituir_arquivo.test.sql`, a migração, `src/types/database.ts`, `supabase/AMBIENTES.md`.

- [ ] Teste `30_substituir_arquivo.test.sql`, no molde do 29 (usuários a1 a a4, `_tap`, exceção final, funções `pg_temp`; setor `SB1`; processos e1 a e6; e2 suspenso, e3 cancelado, e4 concluído, e5 com histórica, e6 do integrante; versões criadas por `registrar_versao` antes das mudanças de situação; depois `enviada_em` recuado). Casos: administrador substitui o .png da V1 (tamanho e hash mudam, `drive_id` e `nome` não, `enviado_por` e `enviado_em` de quem trocou); integrante substitui o relatório; a substituição não cria linha (`count` igual); formato diferente (relatório .pdf por .docx) → `tipo_de_arquivo_diferente:pdf`; em versão histórica → `versao_historica_somente_leitura`; processo suspenso, cancelado e concluído → `processo_fora_de_andamento:<situação>`; consulta, inativo e visitante → 42501; `update … set nome`, `set papel`, `set drive_id` e `set versao_id` pelo cliente → 42501; `delete` → 42501; um evento `substituir` por troca, ligado ao processo (`entidade_ref`), com autor, e `antes` com o `nome` e o `hash_md5` de quem saiu e `depois` com o hash novo; consulta lê o evento, inativo e visitante não. Total de casos: contar ao escrever e ajustar o `plan(N)`.
- [ ] Commit do teste, push da branch, "Testes de banco" na branch: o 30 falha (função inexistente); o 29 continua passando. Esse é o vermelho.
- [ ] Migração (`npx supabase migration new substituir_arquivo`): `public.substituir_arquivo`, `private.registrar_evento_da_substituicao` + gatilho `after update`, `revoke … from public, anon` / `grant … to authenticated` na função pública e `revoke … from public, anon, authenticated` na do gatilho. Comentário de cabeçalho no padrão das migrações 02, 04 e 05.
- [ ] **Ensaio antes de aplicar:** teste temporário com a migração dentro do teste (transação desfeita) e os testes 28, 29 e 30 na sequência; "Testes de banco" tudo verde; apagar o ensaio em commit à parte. Usar a forma com função no `replace` ao colar SQL com `$$`.
- [ ] Commit da migração, push, "Migrar banco de desenvolvimento" com o nome da migração (escolher a branch antes de preencher o campo). Depois "Testes de banco": tudo verde, inclusive `00_rls_ligada`, `01_buckets_privados`, `10_privilegios_padrao`, 28, 29 e 30. Se falhar, a correção é uma migração nova.
- [ ] `npm run db:types` (alvo conferido), `npm run typecheck`; registrar a migração e os números das execuções em `supabase/AMBIENTES.md`. Commit.

### Tarefa 2 — Função do servidor (critérios 1 e 2)

**Arquivos:** `_shared/decisao.ts`, `_shared/registro.ts`, `_shared/substituicao.ts` (+ testes), `arquivos-no-drive/{acoes,registrar,substituicao}.ts`, `scripts/prova-do-drive.mjs`.

- [ ] Testes do Vitest primeiro (vermelho): `validarIniciarEnvio` aceita `arquivo_id` (uuid) e devolve `arquivoId` (ausente → `null`; não-uuid → recusa citando o tipo); `validarRegistrar` com `arquivo_id` (um único arquivo, `historica` verdadeiro recusado, `versao_id` junto recusado), `funcaoDoBancoPara` → `substituir_arquivo` e `parametrosDoBanco` → `{ p_arquivo, p_novo }`; `conferirAlvoDaSubstituicao` (`substituicao.test.ts`): alvo de outro processo, versão histórica (`versao_historica_somente_leitura`), papel diferente e extensão diferente (`tipo_de_arquivo_diferente`, citando o esperado e o recebido), caminho feliz; `driveIdConfere`; `recusaDoBanco` para `tipo_de_arquivo_diferente` → 409.
- [ ] Implementar. Verde. `acoes.ts`: `iniciarEnvio` chama `iniciarSubstituicao` (arquivo `substituicao.ts`) quando `entrada.arquivoId` existe; ele lê o alvo, decide pelo arquivo puro e abre a sessão por `PATCH` sem `name` nem `parents`. `registrar.ts`: com `arquivoId`, confere o `drive_id` antes de ler o Drive. Os arquivos Deno não passam pelo `tsc` (desvio do ticket 01): conferir à mão contra a documentação do Drive (atualização resumível por `PATCH`).
- [ ] `prova-do-drive.mjs`: passo novo no fim (substitui o .png da última versão nova: mesmo `drive_id`, hash novo, contagem de arquivos da pasta igual). Sem versão assim, relata e segue.
- [ ] `npm run lint`, `npm run typecheck`, `npm test`. Commit.

### Tarefa 3 — Funções puras e módulo (critérios 3, 4 e 5)

**Arquivos:** `src/versoes/{tipos,recusasDeVersoes,versoesSupabase,VersoesFalso}.ts` (+ testes), `src/cadastros/historicoDosCadastros.ts` (+ teste).

- [ ] Testes primeiro (vermelho). `recusasDeVersoes`: frase de `tipo_de_arquivo_diferente` (cita o formato que fica). Módulo real (`versoesSupabase.test.ts`): `substituirArquivo` chama `iniciar_envio` com o papel, `arquivo_id`, o número e `historica: false`, faz o `PUT`, avisa o progresso e só então chama `registrar` com `arquivo_id` e o `drive_id` devolvido; falha no `PUT` não registra; recusa da função vira `TravaDoBanco` com a frase. Falso: substitui no mesmo id sem criar arquivo, histórica recusa, formato diferente recusa, evento `substituir` com `antes` (nome e hash) e `depois`, falhas programáveis. Histórico: o texto da ação (`substituir` → "Substituiu o arquivo da versão") e os rótulos dos campos `hash_md5` ("Impressão digital (MD5)") — o `nome` já tem rótulo.
- [ ] Implementar. `tipos.ts`: `PedidoDeSubstituicao = { processoId; numero; arquivo: ArquivoDaVersao; novo: File }` e o método `substituirArquivo(pedido, aoProgredir)` em `ModuloDeVersoes`. `versoesSupabase.ts`: `enviarUmArquivo` ganha um parâmetro de campos extras (o `arquivo_id`). Verde. Commit.

### Tarefa 4 — Botão, formulário e confirmação (critérios 3 a 5)

**Arquivos:** `src/components/versoes/{ListaDeVersoes,FormularioDeSubstituicao}.tsx`, `Versoes.css`, `src/App.substituirArquivo.test.tsx`, `src/App.versoesNoHistorico.test.tsx`.

- [ ] Testes de interface (vermelho), com o aplicativo inteiro e a `VersoesFalso`: [Substituir] em cada arquivo da versão nova para Administrador e Integrante com o processo em andamento; não aparece para a Consulta, nem na versão histórica, nem com o processo suspenso, cancelado ou concluído; o formulário pede arquivo do mesmo papel (extensão, tamanho, PNG e BPMN conferidos como no envio, recusa ao lado do campo, botão desabilitado); a janela de confirmação avisa que o anterior não fica guardado; cancelar na confirmação não envia nada; confirmar troca o arquivo (mesmo nome na lista, uma só entrada, sem versão nova); tipo errado (relatório .docx onde havia .pdf) mostra a frase da recusa; falha no envio e falha no registro mostram a mensagem em vermelho e preservam o arquivo; a troca aparece no histórico do processo com o texto próprio, o nome e o hash do que saiu.
- [ ] Componentes. Verde. Commit.

### Tarefa 5 — Fecho do ticket

- [ ] `npm run lint`, `npm run typecheck`, `npm test`, `npm run check:circular`; "Testes de banco" verde na branch.
- [ ] `desvios.md` (entrada "ticket 06"), ticket 06 (caixas dos critérios provados, ressalva do `[visual]`, prova do Drive pendente), `.scratch/melhorias-protocolo.md` (itens de `.claude/regras/nao-testados.md` que aconteceram).
- [ ] Juntar à `documentos-versoes-01` (fast-forward) e apagar a branch com `git branch -d`; enviar a `documentos-versoes-01` (sem `--force`). Se o `-d` recusar, parar e perguntar.
- [ ] **Perguntar ao usuário** se grava a linha `Concluído em` do ticket 06 agora ou só depois da prova do Drive. Depois, apontar o ticket 07 e lembrar o `/cost`.
