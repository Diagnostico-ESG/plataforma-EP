# Enviar, ver e baixar anexos (ticket 12) — plano de execução

> **Para quem executa:** use `superpowers:executing-plans` (a pedido do `/executar-complexo`). Marque as caixas (`- [x]`) à medida que cada passo termina.

**Objetivo:** o anexo de ponta a ponta, sem retirada: tabela `anexos` com RLS e regras no banco, o papel `anexo` na função `arquivos-no-drive` (enviar, registrar, baixar, conferir), o módulo de anexos, a seção "Outros anexos" no verso e o evento no histórico.

**Ticket:** `.scratch/documentos-versoes/issues/12-enviar-ver-e-baixar-anexos.md`. **Spec:** `.scratch/documentos-versoes/spec.md`, seção "Outros anexos (mudança de 2026-10-26)" (histórias 112 a 124 e 130 a 134; decisões 3 a 5). **ADRs:** 0027 (o anexo se retira; a retirada é o ticket 13), 0008 (Drive por conta de serviço), 0022. **Sabatina:** `.scratch/quadro-livre/sabatina-parte-4.md`. **Branch:** `quadro-livre-parte-4` (a criar; o ticket 13 usa a mesma). Marco do ticket: `marco/2026-10-26-inicio-ticket-12-documentos-versoes`.

**Regras do banco que valem aqui** (`.claude/regras/banco.md`, lido em 2026-10-26): teste de banco antes da migração; tabela nasce com RLS e políticas na mesma migração; função `security definer` só em `private`, com `search_path` vazio e `revoke`/`grant` só a `authenticated`; função de gravação (`registrar_anexo`) sem `security definer`, a RLS decide; dado que se calcula não se guarda; migração, teste de banco e tipos no mesmo commit; migração já aplicada não se edita; alvo conferido antes de comando de banco (vínculo atual = `yclkzyoebpsxmgpbcbus`, desenvolvimento, igual a `supabase/.temp/project-ref`); dados de teste inventados (inclusive os .eml); a função do servidor confere quem chamou antes de usar a conta de serviço; logs e mensagens de erro sem o nome do anexo (só o identificador); a chave secreta do Google fica só na função.

## Fora deste ticket (não fazer)

- Retirar anexo (ação `retirar`, botão [Retirar], confirmação, lixeira do Drive, evento "Retirou o anexo"): ticket 13. A política de apagar de `anexos` também é do 13: aqui ninguém apaga.
- Publicar a função `arquivos-no-drive` no desenvolvimento e provar no Drive real (passo do usuário); `scripts/prova-do-drive.mjs` não muda.
- Anexos nas planilhas dos dashboards e na exportação em CSV; substituir anexo; descrição; vários arquivos por envio (spec, "Fora do escopo").

## Decisões de execução (as que o ticket deixa abertas)

1. **O módulo de anexos é um tipo e uma falsa próprios (`src/anexos/`), mas chega à tela como `versoes.anexos`.** Escolha minha, a registrar em `desvios.md`: passá-lo como prop nova (`App` → `AreaDeProcessos` → `VisaoDosProcessos` → `VersoDoCartao`) obrigaria a editar cerca de 45 arquivos de teste que montam `<App versoes={new VersoesFalso()} …>`; pendurar no módulo de versões (`ModuloDeVersoes.anexos: ModuloDeAnexos`; `VersoesFalso.anexos`) muda só `versoesSupabase.ts`, `VersoesFalso.ts`, `main.tsx` e os helpers de teste que montam a falsa. Fácil de desfazer (promover a prop depois).
2. **O anexo é lido como `ArquivoDaVersao`.** `PapelDoArquivo` ganha `'anexo'` (em `supabase/functions/_shared/nomePadrao.ts`); `Anexo = ArquivoDaVersao & { etapa; autor; enviadoEm }`. Assim `LinkDoArquivo`, `MarcaNoDrive` e `versoes.baixarArquivo` servem sem mudança: o download do anexo é a ação `baixar` da função, que passa a procurar também na tabela `anexos`. O typecheck aponta os `Record<PapelDoArquivo, …>` que precisam de entrada nova.
3. **A conferência reaproveita `versoes.conferirArquivos(processoId)`**: a ação `conferir` passa a devolver também os anexos do processo (mesmo mapa por id). A seção de anexos chama de novo (uma segunda ida ao Drive por abertura do verso). `// ponytail: segunda chamada de conferir por verso; subir a conferência para o verso (uma só) se o custo pesar.` O hook `useConferenciaNoDrive` ganha o 3º parâmetro genérico (`readonly unknown[]`) em vez de `Versao[]`.
4. **Entrada do papel `anexo` na função:** em `iniciar_envio` e `registrar`, `numero`, `historica`, `piloto` e `numero_do_relatorio` não são exigidos (o anexo não tem número); mandados, são ignorados. O nome no Drive é o original: `limparParaNomeDeArquivo(nomeOriginal)`, nome com mais de 300 caracteres **recusado** (mudou na execução: cortar alteraria o nome original; ver `desvios.md`); dois anexos com o mesmo nome convivem (o Drive aceita nomes repetidos; o `id` é o que distingue).
5. **Subpasta "Anexos":** `garantirPastaDosAnexos` (em `pastas.ts` ou arquivo novo, por causa do limite de 300 linhas) lê `processos.drive_pasta_dos_anexos`; se vazio, procura/cria "Anexos" dentro da pasta do processo (`garantirPastaDoProcesso`) e grava o identificador com o login de quem chamou. Acompanha a pasta do processo sozinha (é filha dela). No `registrar`, a pasta esperada do arquivo é a subpasta, não a do processo.
6. **Recusas do banco** (P0001, `motivo:valor`): `processo_arquivado` (já existe a frase), `processo_fora_de_andamento:{situação}` (já existe) e `anexo_formato` / `anexo_tamanho` só pelas restrições (a função e a tela recusam antes). A ordem do gatilho: arquivado primeiro, depois situação.
7. **Tamanho dos arquivos:** `supabase/functions/_shared/decisao.ts` está em 296 linhas e `registro.ts` em 306. O que for específico do anexo vai para arquivos novos (`_shared/anexo.ts`, `_shared/registroAnexo.ts`); se mais de 4 linhas tiverem de entrar em `decisao.ts`, extrair antes os leitores `ler*` para `_shared/leitores.ts` (movimento puro, com reexport; os testes de `decisao.test.ts` seguem verdes).
8. **Merge:** o ticket e a parte 3 mantiveram a branch aberta até o `/ship` (ticket 13 na mesma). No fim, **perguntar** ao usuário se junta à `main` agora (o comando manda juntar) ou deixa para o `/ship` da parte.

## Arquivos

- Banco: `supabase/tests/61_anexos.test.sql` (novo); `supabase/migrations/<AAAAMMDDHHMMSS>_anexos.sql` (nova, depois de `20261026164641`); tipos em `src/types/database.ts`; `supabase/AMBIENTES.md`; `docs/manutencao/04-modelo-de-dados.md`.
- Função (puros, com teste no Vitest): `supabase/functions/_shared/anexo.ts` (+ `anexo.test.ts`), `_shared/registroAnexo.ts` (+ teste), `decisao.ts`, `registro.ts`, `nomePadrao.ts` (o papel). Camada Deno (sem teste automático, como as anteriores): `arquivos-no-drive/acoes.ts`, `registrar.ts`, `conferir.ts`, `pastas.ts`.
- Cliente: `src/versoes/chamarFuncao.ts` (extraído de `versoesSupabase.ts`, para não criar dependência circular), `src/anexos/` (`tipos.ts`, `regrasDoAnexo.ts`, `recusasDeAnexos.ts`, `anexosSupabase.ts`, `AnexosFalso.ts`, com testes), `src/versoes/tipos.ts`, `versoesSupabase.ts`, `VersoesFalso.ts`, `rotulos.ts` e o que o typecheck apontar, `src/main.tsx`, `src/cadastros/historicoDosCadastros.ts`, `src/processos/lerProcessoSupabase.ts` (a lista de entidades do histórico), `src/hooks/useConferenciaNoDrive.ts`.
- Tela: `src/components/anexos/SecaoDeAnexos.tsx`, `FormularioDeAnexo.tsx`, `ListaDeAnexos.tsx` (+ `Anexos.css` se faltar), `src/components/processos/VersoDoCartao.tsx`.
- Testes de tela: `src/App.anexos.test.tsx` e `src/App.anexosPerfis.test.tsx` (novos, divididos pelo limite de 300 linhas), `src/testes/anexosDeTeste.ts`, `src/testes/processosNosCadastros.tsx` (liga a falsa ao histórico).

---

## Tarefa 0: Marco, branch e ponto de partida

- [x] Árvore limpa (o commit `a257cd0` já tratou `database.ts` e `launch.json`). `git tag marco/2026-10-26-inicio-ticket-12-documentos-versoes`; `git switch -c quadro-livre-parte-4`.
- [x] `git push origin "refs/tags/marco/*:refs/tags/marco/*"` e `git push -u origin quadro-livre-parte-4` (autorizados no `CLAUDE.md`, sem `--force`).
- [x] Confirmar se o Docker está de pé (`docker info`). Se estiver, os testes de banco rodam local (`npx supabase start`, saída descartada porque traz chaves; depois `npx supabase test db`, contando as linhas `ok` e `not ok`); senão, pelo workflow "Testes de banco" na branch.

## Tarefa 1: Testes de banco antes da migração (critério 1 do ticket)

- [x] Ler `supabase/tests/57_acrescentar_arquivo.test.sql` (padrão: `plan(N)`, `_tap`, usuários a1 a4, limpeza `session_replication_role`, `pg_temp.mover_sem_trava`) e `26_pastas_no_drive.test.sql`.
- [x] `supabase/tests/61_anexos.test.sql` (novo), uma asserção por regra da tabela "Regras que o banco impõe" e por célula de "quem pode o quê" da spec:
  - **Ler** `anexos`: Administrador, Integrante e Consulta leem; inativo e visitante não.
  - **Criar** (via `public.registrar_anexo(p_processo, p_arquivo jsonb)`, com o login de cada perfil): Administrador e Integrante criam; Consulta, inativo e visitante recusados (`42501`). **Alterar:** nenhum perfil (o nome, por exemplo). **Apagar:** nenhum perfil (a retirada é do 13).
  - **Situação:** processo suspenso, cancelado, concluído e arquivado recusados (`processo_fora_de_andamento:…` e `processo_arquivado`); em andamento aceito em Não iniciados, na Modelagem piloto e na Validação com o setor.
  - **Restrições:** `.exe` recusado; 0 byte recusado; 20 MB + 1 byte recusado; nome de 301 caracteres recusado; `drive_id` fora do formato recusado; os sete formatos aceitos.
  - **Preenchido pelo banco:** a etapa enviada pelo cliente é ignorada (vale a etapa atual do processo); autor e data são os de quem grava; depois de mover o processo, a etapa do anexo não muda.
  - **Evento:** um evento `enviar`/`anexo` por envio, `entidade_ref` = id do processo, com o nome e a etapa em `depois`; todo perfil ativo lê (Consulta lê, visitante não).
  - **Exclusão do processo** com anexo recusada, com a contagem na mensagem (`processo_com_anexos:{n}`); processo sem anexo continua excluível. Dois anexos com o mesmo nome aceitos.
  - **`processos.drive_pasta_dos_anexos`:** Integrante grava; Consulta não; valor fora do formato recusado; gravar não gera evento do processo (o `estado_do_processo` não a inclui).
- [x] `grep -rn "pastas_no_drive\|delete from public.eventos" supabase/tests` para ver quais testes limpam tabelas por `delete`: quem apaga `public.processos`/`versoes` por cima pode precisar também limpar `anexos` (anotar, ajustar na Tarefa 2).
- [x] Rodar: **vermelho pelo motivo certo** (`registrar_anexo`/`anexos` inexistentes), os outros arquivos verdes. Commit só dos testes.

## Tarefa 2: Migração (critério 1 do ticket)

- [x] Conferir o alvo (`supabase/AMBIENTES.md` e `supabase/.temp/project-ref`). `npx supabase migration new anexos`; horário depois de `20261026164641`.
- [x] Escrever na migração, nesta ordem (modelo: `20261015224928_versoes.sql`): tabela `public.anexos` (colunas da spec; `processo_id` e `etapa_id` com `on delete restrict`; restrições de formato, tamanho, nome e `drive_id`), RLS ligada; `revoke all` e `grant select` + `grant insert (processo_id, nome, formato, tamanho, hash_md5, drive_id)` a `authenticated`; políticas de ler (`private.usuario_ativo()`) e criar (`private.pode_alterar_cadastros()`); **sem** política nem privilégio de alterar ou apagar. `alter table public.processos add column drive_pasta_dos_anexos text` com restrição de formato e `grant update (drive_pasta_dos_anexos)`. Gatilho `preparar_anexo` (antes de incluir: arquivado, situação, etapa, autor, data); `estado_do_anexo`; gatilho `registrar_evento_do_anexo` (depois de incluir, `security definer`); política de leitura dos eventos `anexo`; gatilho `conferir_processo_sem_anexos` em `processos` (nome que começa com `conferir_`, antes de `registrar_exclusao_…`); função `public.registrar_anexo(p_processo uuid, p_arquivo jsonb) returns uuid` sem `security definer`; `revoke`/`grant` das funções novas.
- [x] Migração não destrutiva: só cria. Registrar isso no cabeçalho. Ajustar, só se a Tarefa 1 apontou, os testes que apagam `processos` ou `eventos` por cima.
- [x] Rodar a bateria inteira: `61_anexos` verde e todos os outros verdes, **inclusive `00_rls_ligada`, `10_privilegios_padrao` e `46_funcoes_e_views_seguras`**. Teste antigo que quebre por causa do anexo: ajustar (mecânico) ou parar e perguntar se o motivo for outro.
- [x] Tipos: `npx supabase gen types --local` (Docker) para `src/types/database.ts`; se o arquivo vier "modificado" só por fim de linha, `git add`. Commit da migração, do teste e dos tipos juntos; `git push`.

## Tarefa 3: Aplicar no desenvolvimento

- [x] Disparar o workflow "Migrar banco de desenvolvimento" na branch com o nome da migração e ler o resultado (se disser "já aplicada", parar e avisar). Depois o "Testes de banco" na branch: todos verdes.
- [x] Linha nova em `supabase/AMBIENTES.md` (padrão das anteriores: ticket, vermelho antes, verde depois, execuções). Commit.

## Tarefa 4: Função do servidor — as decisões puras (critério 3 do ticket)

Teste primeiro, visto falhar, em Vitest (`npx vitest run supabase/functions`).

- [x] `nomePadrao.ts`: `PapelDoArquivo` ganha `'anexo'`; `sufixoDoPapel` e `nomePadrao` não são usados para o anexo (a decisão 4 tem o nome); ajustar o que o typecheck apontar nos `Record<PapelDoArquivo, …>` (`EXTENSOES_POR_PAPEL` ganha `anexo: ['pdf','docx','xlsx','png','jpg','jpeg','eml']`, e a mensagem de `lerPapel` cita o papel novo).
- [x] `_shared/anexo.ts` + `anexo.test.ts` (novos): `NOME_DA_SUBPASTA_DOS_ANEXOS = 'Anexos'`; `nomeDoAnexoNoDrive(nomeOriginal)` (decisão 4: limpa os caracteres do Drive, corta em 300 mantendo a extensão; nome vazio depois de limpo é recusa); casos: nome comum, caracteres `\ / : * ? " < > |`, nome de 400 caracteres com extensão, dois nomes iguais devolvem o mesmo nome, extensão maiúscula.
- [x] `decisao.ts` (+ `decisao.test.ts`, ou `decisaoAnexo.test.ts` pelo limite de linhas): `validarIniciarEnvio` com `papel: 'anexo'` aceita sem `numero`/`historica`/`piloto`; recusa `.exe` (`extensao_nao_aceita`), 20 MB + 1 byte (`arquivo_grande`) e nome com mais de 300 caracteres; `conferirChamador` por perfil e `iniciar_envio`/`registrar`/`baixar`/`conferir` (Consulta só baixa e confere; inativo e sem login nada); a regra do processo para o papel (em andamento e não arquivado) em função pura nova (`conferirProcessoDoAnexo(situacao, arquivado)`, em `anexo.ts`).
- [x] `_shared/registroAnexo.ts` (+ teste): `validarRegistrar` aceita o papel `anexo` sem `numero`, só sozinho (um arquivo, sem `versao_id`, `arquivo_id`, `historica`, `piloto` nem `numero_do_relatorio`); `funcaoDoBancoPara` devolve `'registrar_anexo'` e `parametrosDoBanco` `{ p_processo, p_arquivo }`; `conferirArquivosNoDrive` do anexo: chegou, tem MD5, está na **subpasta**, tamanho de 1 byte a 20 MB, formato pela extensão do nome, **sem** rótulo de versão no nome; recusa do banco com o código do anexo volta pela `recusaDoBanco` de sempre. Ligar `registro.ts` a esse arquivo com o mínimo de linhas (decisão 7).
- [x] `npx vitest run supabase/functions` verde; `npm run lint` e `npm run typecheck`; commit.

## Tarefa 5: Função do servidor — a camada Deno (sem teste automático, como nos tickets 07 a 11)

- [x] `pastas.ts` (ou arquivo novo ao lado): `garantirPastaDosAnexos` (decisão 5), com o `// ponytail:` da corrida de dois primeiros anexos simultâneos, como o das pastas.
- [x] `acoes.ts`: `recusaDoProcesso` cobre o papel `anexo` (`conferirProcessoDoAnexo`); `iniciarEnvio` do anexo cria a sessão com o nome original e a subpasta; `baixar` procura o arquivo também na tabela `anexos` (mesma regra: pela RLS com o login de quem chamou, `itemSobARaiz`, a mesma recusa `sem_permissao` quando não há linha); mensagens de erro só com o identificador.
- [x] `registrar.ts`: para o anexo, a pasta esperada é `processos.drive_pasta_dos_anexos`; sem ela, `arquivo_fora_da_pasta`; `campoDoResultado` devolve `anexo_id`. `conferir.ts`: lê também os anexos do processo (pela RLS) e acrescenta ao mapa.
- [x] `index.ts`: nenhum caminho novo (as quatro ações já existem); conferir só a mensagem de ação desconhecida.
- [x] `npm run lint`, `npm run typecheck`, `npx vitest run supabase/functions` verdes. **Presumido e dito no fecho:** a camada Deno só se prova publicando a função (passo do usuário). Commit.

## Tarefa 6: O módulo de anexos no cliente (critério 3 do ticket)

Teste primeiro, visto falhar.

- [x] `src/versoes/chamarFuncao.ts`: mover `chamarFuncao`, `falhaDaChamada` e os tipos auxiliares de `versoesSupabase.ts` (sem mudar o comportamento; os testes de `versoesSupabase*.test.ts` seguem verdes). Evita o ciclo `versoesSupabase` ↔ `anexosSupabase`.
- [x] `src/anexos/tipos.ts`: `Anexo` (decisão 2), `PedidoDeAnexo = { processoId; arquivo: File }`, `ModuloDeAnexos = { listarAnexos(processoId); enviarAnexo(pedido, aoProgredir) }`; `ModuloDeVersoes.anexos: ModuloDeAnexos` (decisão 1).
- [x] `src/anexos/regrasDoAnexo.ts` + teste: `recusaDoArquivoDoAnexo(arquivo): string | null` com as frases do ticket ("O anexo precisa ser .pdf, .docx, .xlsx, .png, .jpg, .jpeg ou .eml; recebido: {extensão}." e "O anexo pode ter até 20 MB; recebido: {tamanho}."), arquivo vazio, sem extensão ("recebido: nenhuma"); `ordenarAnexos` (mais recente primeiro, desempate por id); `tamanhoLegivel` (reaproveitar o que já existir em `src/versoes` antes de escrever outro).
- [x] `src/anexos/recusasDeAnexos.ts` + teste: o `FRASE_DO_CODIGO` do anexo (perfil, usuário inativo, sessão, processo fora de andamento, `processo_arquivado`, formato, tamanho, arquivo que não chegou, fora da pasta, Drive indisponível, sem espaço, `entrada_invalida`), todas dizendo "anexo" e nunca "versão"; código desconhecido vira erro genérico.
- [x] `src/anexos/anexosSupabase.ts` + teste (cliente falso e `fetch` simulado, como `versoesSupabase.test.ts`): `listarAnexos` (colunas, ordem, nome da etapa e do autor, erro de leitura com o motivo); `enviarAnexo` (a ordem: `iniciar_envio` com `papel: 'anexo'` e sem número, PUT dos bytes, `registrar`; progresso 1 de 1; falha do PUT = "o arquivo … não chegou ao Drive"; recusa da função vira `TravaDoBanco` com a frase de `recusasDeAnexos`; falha de conexão). `versoesSupabase.ts` passa a devolver `anexos: criarAnexosSupabase(cliente, enviarBytes)`.
- [x] `src/anexos/AnexosFalso.ts` + teste: a falsa nomeada, com `anexos` por processo, `falharLeitura`, `segurarLeitura`, `falhaNoEnvio` (`string | Error`), `envios` registrados, `segurarDepoisDe` para o progresso, e o evento "Enviou o anexo" entregue ao histórico pela mesma ponte da `VersoesFalso` (`aoRegistrar`); a etapa do anexo é a etapa atual do processo no envio (lida de `VersoesFalso.processos`), não muda depois. `VersoesFalso` ganha `anexos` (declarado depois de `processos`, para dividir o mapa). Se `VersoesFalso.ts` passar de 300 linhas, o que for novo vai para arquivo à parte.
- [x] `src/cadastros/historicoDosCadastros.ts` (+ teste): `textoDoEvento` para `entidade: 'anexo'`, `acao: 'enviar'` → `Enviou o anexo '{nome}' ({etapa})`; título do item do histórico pelo nome do processo; `lerProcessoSupabase.ts` acrescenta `'anexo'` na lista de entidades do histórico do processo (e o teste dele).
- [x] `npx vitest run src/anexos src/versoes src/cadastros src/processos`, lint, typecheck e a checagem de circulares limpos; commit.

## Tarefa 7: A tela (critério 2 do ticket)

Teste de tela primeiro, com o aplicativo inteiro, visto falhar (janela/seção inexistente).

- [x] `src/testes/anexosDeTeste.ts` (anexo de teste, arquivo `File` de teste com nome e tamanho) e a ligação em `src/testes/processosNosCadastros.tsx` (`falsoDeVersoes` preenche `anexos.processos`/`aoRegistrar` pelo mesmo caminho das versões).
- [x] `src/App.anexos.test.tsx` — casos do critério 2: a seção "Outros anexos" em Não iniciados, Modelagem piloto, Validação com o setor e Concluídos; "Nenhum anexo."; carregando; erro com [Tentar de novo]; enviar e ver a linha nova com a etapa, o autor e a data; o anexo mantendo a etapa depois de mover o processo; formato e tamanho recusados antes do envio (frases do ticket); falha do envio sem perder o arquivo escolhido; progresso "Enviando…"; dois anexos com o mesmo nome; baixar (o id vai a `versoes.baixados`); falha do download; a marca da conferência num anexo sumido e num alterado; a conferência que falhou não esconde a lista.
- [x] `src/App.anexosPerfis.test.tsx` — Consulta vê e baixa sem [Enviar anexo]; processo suspenso, cancelado, concluído e arquivado sem [Enviar anexo]; subprocesso com os próprios anexos e o pai sem os dos filhos; o evento no histórico do processo ("Enviou o anexo '…' (Modelagem piloto)").
- [x] `useConferenciaNoDrive` com o terceiro parâmetro genérico (decisão 3; o teste do hook segue verde).
- [x] `SecaoDeAnexos.tsx`: `<section aria-labelledby>` "Outros anexos", carrega por `useCarregamento`, mostra `ErroAoCarregar`, lista (`ListaDeAnexos`: nome com `LinkDoArquivo`, etapa, autor, data em mono, `MarcaNoDrive`) do mais recente ao mais antigo, [Enviar anexo] no topo só para `podeAlterar` com o processo em andamento. `FormularioDeAnexo.tsx`: o mesmo botão abre e fecha (`aria-expanded`), `useRolarAteAparecer`, campo nativo com `accept=".pdf,.docx,.xlsx,.png,.jpg,.jpeg,.eml"`, aviso de formato e tamanho antes do envio (`recusaDoArquivoDoAnexo`), "Será gravado como: {nome}", progresso, falha em vermelho sem perder o arquivo, [Cancelar]. Estilo no padrão da lista de versões (o nome longo se corta com reticências sem quebrar a linha); classes novas só se as de `Versoes.css`/`Painel.css` não servirem.
- [x] `VersoDoCartao.tsx`: a seção entra logo abaixo de `SecaoDeVersoes`, na coluna esquerda, para todos os perfis e etapas; `podeAlterar` = o mesmo `alteravel` das versões. `src/main.tsx` não muda (o módulo vem dentro de `versoes`); conferir.
- [x] `npm test`, `npm run lint`, `npm run typecheck` e a checagem de circulares limpos; commit.

## Tarefa 8: Fechamento

- [x] `[visual]` dos dois critérios do ticket: tentar subir a vitrine local (`preview_start`, 1366×768) com módulos falsos e ver a seção (abaixo das versões, linhas no padrão, nome longo cortado) e o formulário (rola até aparecer inteiro, fecha pelo mesmo botão). Se a captura não funcionar, só medir e **dizer que ficou presumido** (a tela com o login real nunca foi vista).
- [x] `docs/manutencao/04-modelo-de-dados.md`: tabela `anexos`, coluna `drive_pasta_dos_anexos`, as regras e o evento; documento da função/Drive em `docs/manutencao/` (papel `anexo`, subpasta, conferência). `CONTEXT.md` conferido (os termos **Anexo** e **Retirar anexo** já estão).
- [x] `desvios.md` do documentos-versoes (entrada de 2026-10-26, ticket 12): números das execuções do "Testes de banco" e do "Migrar banco", decisões de execução 1 a 8 (a 1 e a 3 em especial), ajustes mecânicos em testes antigos, o que ficou presumido (camada Deno, `[visual]`, função não publicada). `.scratch/melhorias-protocolo.md`: itens de `.claude/regras/nao-testados.md` que aconteceram. `.scratch/backlog.md`: o que surgir (por exemplo, a conferência em duas chamadas).
- [x] Passo do usuário, no `.scratch/proximo-passo.md`: publicar a função `arquivos-no-drive` de novo no desenvolvimento (o papel `anexo` só funciona publicada) e provar um envio no Drive real; o papel de "Gerente de conteúdo" da conta de serviço é do ticket 13.
- [x] Marcar as caixas deste plano, acrescentar `Concluído em AAAA-MM-DD (commit <hash>)` ao fim do ticket 12, sobrescrever `.scratch/proximo-passo.md` (próximo: ticket 13, `/executar-complexo`, Sonnet), commit e `git push` da branch. Decisão 8: perguntar sobre a junção à `main`.
