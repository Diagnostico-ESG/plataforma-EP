# Ticket 01 de reunioes (Registrar e ver reuniões) — Plano de execução

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** criar o registro de reuniões no banco (regras, RLS, evento no histórico) e a área Reuniões: lista com próximas no topo, filtros no endereço, formulário de registro (sem participantes) e painel da reunião.

**Architecture:** uma migração cria o tipo `tipo_de_reuniao`, as tabelas `reunioes` e `reunioes_processos`, a RLS, os gatilhos das regras e do evento (entidade `reuniao`) e a função `salvar_reuniao` (sem `security definer`, grava a reunião e a lista de processos de uma vez). A interface ganha o módulo `ModuloDeReunioes` (real em `reunioesSupabase.ts`, falso em `ReunioesFalso.ts`), passado ao `App` como quarto módulo, e a área `reunioes` (`AreaDeReunioes`) no padrão da Lista de processos: tabela, filtros em `#/reunioes?...`, painel à direita com o id no endereço.

**Tech Stack:** Postgres/Supabase (pgTAP pelo GitHub Actions), React + TypeScript, Vitest + Testing Library.

**Spec:** `.scratch/reunioes/spec.md` (histórias 1 a 8, 12 a 28, 40 e 41; "Interface", "Modelo de dados", "Quem pode o quê", "Regras que o banco impõe") · **Ticket:** `.scratch/reunioes/issues/01-registrar-e-ver-reunioes.md` (critérios citados como "critério N", na ordem do ticket: 1 testes de células, 2 testes de regras, 3 testes gerais e migração aplicada, 4 lista, 5 filtros, 6 formulário, 7 falhas, 8 painel, 9 estados, 10 Consulta, 11 funções puras e módulo Supabase, 12 testes de interface).

## Global Constraints

- `npm` para tudo; nenhuma dependência nova. Campos de data e hora nativos (`date`, `time`).
- Regras de `.claude/regras/banco.md` lidas nesta sessão: teste antes da migração; estrutura só por migração; migração, teste e tipos no mesmo commit (exceto o commit do teste que prova a falha); toda tabela com RLS ligada e privilégios mínimos (`revoke all` de `anon` e `authenticated`, concede de volta o necessário); função pública sem `security definer`, com `revoke ... from public, anon` e `grant execute ... to authenticated`; função só de gatilho com `revoke` de todos; `search_path` vazio e nomes qualificados; alvo conferido antes de qualquer comando de banco (vínculo atual `yclkzyoebpsxmgpbcbus`, igual a `supabase/.temp/project-ref`).
- Banco só pelo GitHub Actions, na branch `reunioes-01`: "Testes de banco" e "Migrar banco de desenvolvimento" (autorizados no CLAUDE.md, "Ajustes deste Projeto"). Na primeira migração que precisa do workflow de migração, ele já existe? Conferir `.github/workflows/`; se não existir, criar (manual, aplica a migração indicada no banco de desenvolvimento com a trava do `scripts/testar-banco.mjs`, para com aviso se já aplicada). Produção fica fora do ticket.
- Recusas do banco chegam como `P0001` "motivo:valor" e viram `TravaDoBanco` com a frase pronta.
- Funções de lógica 4 a 20 linhas (hooks até 40), arquivos até 300 linhas, complexidade até 10, tipos explícitos, nenhum `any`, early return, até 2 níveis de indentação. Componentes divididos por responsabilidade.
- Mensagem de erro inclui o valor recebido e o formato esperado.
- Dados de teste só inventados. Nenhum `dados-reais/`, `.env`.
- Texto da tela em português com acentuação correta.

## Decisões do plano

- **Branch** `reunioes-01` a partir da `main`; marco `marco/2026-10-14-inicio-ticket-01-reunioes`. O `src/types/database.ts` aparece modificado só por quebra de linha (CRLF); conteúdo igual. Ele vai ser regerado/editado na tarefa 2.
- **Restrição adiada (modelagem com ao menos um processo, sensibilização com nenhum):** `constraint trigger ... deferrable initially deferred` em `reunioes` (insert/update) e em `reunioes_processos` (insert/delete), conferindo `(tipo = 'modelagem') = (existe processo ligado)` ao fim da gravação. Recusa: `modelagem_sem_processo` e `sensibilizacao_com_processo`.
- **Setor ativo:** gatilho `before insert or update of setor_id` recusa `setor_inativo:<sigla>` só quando o setor é novo ou foi trocado (a reunião antiga em setor desativado continua válida).
- **Processo do setor da reunião:** gatilho `before insert` em `reunioes_processos` recusa `processo_de_outro_setor:<nome do processo>`; gatilho `after update of setor_id` em `reunioes` recusa a troca de setor se restar processo ligado de outro setor (mesmo motivo).
- **Exclusão com contagem:** `conferir_setor_sem_reunioes` (before delete em `setores`) → `setor_com_reunioes:N`; `conferir_processo_sem_reunioes` (before delete em `processos`) → `processo_com_reunioes:N`. Nomes começam com `conferir_`, como os de processos. FK `on delete restrict` fica como rede de segurança.
- **Textos:** `local` até 300, `anotacoes` até 10.000; trim e vazio vira nulo no gatilho `preparar_reuniao`; `outros_participantes` já existe como coluna `text[] not null default '{}'` (ticket 03 a preenche) com a limpeza no mesmo gatilho (itens aparados, vazios descartados) e a restrição de 200 caracteres por item.
- **Tabelas `reunioes_usuarios` e `reunioes_responsaveis`:** ficam para o ticket 03 (o ticket 01 é "ainda sem participantes"). A coluna `outros_participantes` nasce aqui, porque a spec a põe em `reunioes`.
- **Evento (um por gravação, com o estado completo):** entidade `reuniao`, referência = id da reunião; estado = `{tipo, setor_id, setor_sigla, data, hora, local, anotacoes, outros_participantes, processos: [{id, nome}]}`. Desenho: gatilhos "antes" (por linha) em `reunioes` (update/delete) e `reunioes_processos` (insert/delete) guardam o estado de antes da reunião num ajuste da transação (`ep.reuniao_<uuid com _>`; `null` quando a reunião é nova) na primeira mudança; gatilhos de restrição adiados (`deferrable initially deferred`) "depois" em `reunioes` e `reunioes_processos` comparam com o estado de depois no fim da gravação, gravam o evento se mudou e limpam o ajuste (os disparos seguintes da mesma gravação não fazem nada). A função `salvar_reuniao` termina com `set constraints ... immediate`, para o evento e as regras do tipo valerem na própria chamada; nos testes pgTAP (uma transação só), gravação direta usa `set constraints all immediate` depois.
- **Função de salvar:** `public.salvar_reuniao(p_id uuid, p_tipo, p_setor_id, p_data, p_hora, p_local, p_anotacoes, p_outros text[], p_processos uuid[]) returns uuid`. Com `p_id` nulo cria; senão altera. Grava `reunioes`, troca as ligações de processos (apaga as que saíram, inclui as novas) e termina com `set constraints ... immediate`. Sem `security definer`: a RLS decide.
- **Módulo:** `ModuloDeReunioes` em `src/reunioes/tipos.ts` com `listarReunioes`, `lerReuniao`, `lerOpcoesDoFormulario(setorId | null)`, `salvarReuniao`, `excluirReuniao`. O ticket 01 não precisa de `excluirReuniao` na tela (ticket 02), mas o falso e o real já nascem com ele para o ticket 02 só ligar o botão. **Decisão (Ponytail):** `excluirReuniao` e histórico ficam para o ticket 02; o ticket 01 entrega `listarReunioes`, `lerReuniao`, `lerOpcoesDoFormulario` e `salvarReuniao`.
- **Endereço:** `#/reunioes[/<id> | /nova][?setor=&tipo=&de=&ate=]`, em `src/reunioes/enderecoDasReunioes.ts`, no molde de `enderecoDosProcessos.ts`. `useAreaAtual` passa a devolver `reunioes` quando o primeiro trecho é `reunioes`; `areas.ts` põe `reunioes` em `AreaComTela`.
- **Próxima ou realizada:** função pura `ehProxima(data, hoje)`; "hoje" vem de `new Date()` local no formato `AAAA-MM-DD`, injetável nos testes (parâmetro `hoje`, padrão `hojeLocal()`); no falso e nos testes de tela o dia é fixo (`HOJE_DE_TESTE = '2026-10-14'`, passado por prop de `AreaDeReunioes` com padrão `hojeLocal()`).
- **Perfis:** Administrador e Integrante veem [Registrar reunião] (`usuario.perfil !== 'consulta'`); a RLS protege de verdade.
- **Frases que a spec não traz** (vão para `desvios.md`): "Setor {sigla} está inativo; escolha um setor ativo."; "O processo {nome} não é do setor da reunião."; "A reunião de modelagem precisa de ao menos um processo."; "A reunião de sensibilização não tem processos."; "O local pode ter no máximo 300 caracteres. Recebido: {n}."; "As anotações podem ter no máximo 10.000 caracteres. Recebido: {n}."; "Seu perfil não permite alterar as reuniões.".

## Tarefas

### Tarefa 1 — Branch, marco e teste de banco 23 (falha primeiro)

**Arquivos:** criar `supabase/tests/23_reunioes.test.sql` (molde do 21: usuários a1 a a4, `_tap`, `plan(N)` exato, exceção do fim).

- [ ] `git switch -c reunioes-01`; marco `marco/2026-10-14-inicio-ticket-01-reunioes` (`git tag`); conferir que `.github/workflows/` tem "Testes de banco" e o de migração (criar o de migração na tarefa 2 se faltar).
- [ ] Escrever o teste 23 (critérios 1 e 2). Preparação (dono do banco): setores TR1 (ativo), TR2 (ativo), TR3 (inativo); macroprocesso "Macro Reunião" com TR1, TR2 e TR3 envolvidos; processos "Proc A" (TR1), "Proc B" (TR1, depois cancelado por `cancelar_processo`) e "Proc C" (TR2). Asserções:
  1. Administrador e Integrante: `salvar_reuniao` de sensibilização no TR1 (sem processos) vive; de modelagem no TR1 com "Proc A" e "Proc B" vive; ligação aparece em `reunioes_processos`.
  2. Regras: setor inativo (TR3) → `P0001` `setor_inativo:TR3`; modelagem sem processo → `modelagem_sem_processo`; sensibilização com processo → `sensibilizacao_com_processo`; processo de outro setor ("Proc C" em reunião de TR1) → `processo_de_outro_setor:Proc C`; processo cancelado ("Proc B") aceito.
  3. Trocar o tipo para sensibilização tirando os processos na mesma gravação é aceito; trocar o setor com processo do setor antigo é recusado.
  4. Textos: anotações com 10.001 caracteres recusadas (`23514`); local "  " guardado como nulo; anotações com espaços nas pontas aparadas; `outros_participantes` ao serem gravados via UPDATE direto: item vazio descartado.
  5. Setor desativado depois de ter reunião mantém a reunião; excluir setor com 2 reuniões → `setor_com_reunioes:2`; excluir processo tratado → `processo_com_reunioes:1`.
  6. Eventos: criar gera 1 `criar` com `depois.setor_sigla` e `depois.processos`; alterar gera 1 `alterar` com `antes` e `depois`; salvar sem mudar não gera evento; excluir (direto na tabela, como integrante) gera 1 `excluir` com `antes.processos` preenchido.
  7. Perfis (`reunioes`, `reunioes_processos`): Administrador/Integrante criam e apagam; Consulta lê mas `salvar_reuniao` → `42501` e `delete` apaga 0 linhas; Inativo e Visitante: `select` devolve 0 linhas e `salvar_reuniao` → `42501`; `update` direto de `id` ou `criado_em` → `42501` (sem privilégio de coluna); ligação não se altera (`update` em `reunioes_processos` → `42501`).
  8. Eventos `reuniao` lidos: Consulta lê (>0); Inativo e Visitante 0; ninguém insere/altera/apaga evento (`42501`).
  9. `prosecdef` falso em `salvar_reuniao` e nas funções públicas; verdadeiro só nas que gravam evento.
  10. `00_rls_ligada` e `10_privilegios_padrao` conferem as tabelas novas (não alterar esses arquivos; só confirmar que passam depois da migração).
- [ ] Ajustar o teste de exclusão de setor/processo existentes só se a ordem de gatilhos mudar o resultado (conferir na rodada).
- [ ] Comitar ("Ticket 01 de reunioes: teste de banco (falha antes da migração)"), `git push -u origin reunioes-01`, disparar "Testes de banco" na branch, ler o resultado: o 23 deve falhar por tabela/função inexistente.

### Tarefa 2 — Migração (banco), tipos e registro

**Arquivos:** criar com `npx supabase migration new reunioes`; `src/types/database.ts`; `supabase/AMBIENTES.md`; `.github/workflows/` se faltar o de migração.

- [ ] Escrever a migração (modelo: `20261014232135_catalogo_de_etapas.sql` e `20261014130147_processos.sql`): tipo, tabelas com RLS e privilégios (`reunioes`: `select, delete` e `insert/update` só das colunas editáveis; `reunioes_processos`: `select, insert, delete`), políticas por `private.pode_alterar_cadastros()` e `private.usuario_ativo()`, gatilhos `preparar_reuniao`, `conferir_setor_da_reuniao`, `conferir_processo_da_reuniao`, `conferir_tipo_da_reuniao` (restrição adiada), `conferir_setor_sem_reunioes`, `conferir_processo_sem_reunioes`, evento (`estado_da_reuniao`, `registrar_exclusao_da_reuniao`), função `salvar_reuniao`, política de leitura em `eventos` para `entidade = 'reuniao'`, `revoke`/`grant` das funções.
- [ ] Atualizar `src/types/database.ts` à mão (ou por `npm run db:types` se a rede permitir; senão, editar o arquivo com as tabelas, o enum e a função) para as tabelas novas.
- [ ] Comitar migração + tipos; push; disparar "Testes de banco": o 23 e os demais passam. Disparar o workflow de migração; registrar a migração em `supabase/AMBIENTES.md`.

### Tarefa 3 — Funções puras: período, ordem, endereço e filtros

**Arquivos:** criar `src/reunioes/tipos.ts` (tipos), `src/reunioes/quandoAcontece.ts` (+ teste), `src/reunioes/enderecoDasReunioes.ts` (+ teste), `src/reunioes/filtrosDasReunioes.ts` (+ teste).

- [ ] Testes que falham: `ehProxima('2026-10-15', '2026-10-14')` verdadeiro, `ehProxima('2026-10-14', '2026-10-14')` falso; `ordenarReunioes` põe as próximas primeiro (da mais próxima à mais distante, depois por hora) e as realizadas depois (da mais recente à mais antiga); `semAnotacoes(reuniao, hoje)` só para realizada sem anotações; endereço ida e volta (`#/reunioes/abc?setor=s1&tipo=modelagem&de=2026-10-01&ate=2026-10-31`), tipo inválido ignorado, `nova` como `aberto`; `filtrarReunioes` por setor, tipo, de e até (inclusivos), cada um opcional.
- [ ] Implementar o mínimo até passar.

### Tarefa 4 — Módulo de reuniões (falso e Supabase)

**Arquivos:** `src/reunioes/tipos.ts` (acrescentar `ModuloDeReunioes`), criar `src/reunioes/ReunioesFalso.ts` (+ teste), `src/reunioes/recusasDeReunioes.ts` (+ teste), `src/reunioes/reunioesSupabase.ts` (+ teste), `src/cadastros/recusasDeProcessos.ts` (acrescentar `setor_com_reunioes` e `processo_com_reunioes`, com teste), `src/main.tsx`, `src/App.tsx`.

- [ ] Testes que falham do módulo Supabase (cliente falso): `listarReunioes` junta setor e processos e devolve `Reuniao[]`; `lerReuniao` devolve null quando não existe; `lerOpcoesDoFormulario(setorId)` devolve setores ativos e processos do setor (todos os estados); `salvarReuniao` chama `rpc('salvar_reuniao', ...)` com os parâmetros em snake_case e traduz cada recusa em `TravaDoBanco` com a frase; `42501` vira "Seu perfil não permite alterar as reuniões."; erro desconhecido vira `Error` com o motivo.
- [ ] Implementar o módulo real e o falso (o falso guarda reuniões e imita as recusas: setor inativo, modelagem sem processo, sensibilização com processo, processo de outro setor, `falhaDeGravacao`, `falharLeitura`, `segurarLeitura`).
- [ ] `App` recebe `reunioes: ModuloDeReunioes`; `main.tsx` cria `criarReunioesSupabase(supabase)`; atualizar os `render(<App .../>)` dos testes existentes (todos passam a receber o falso) — fazer por um assistente `src/testes/` ou ajustar o `App` com o prop opcional? **Decisão:** prop obrigatória no `App`, e os ~40 testes de `App.*.test.tsx` passam a incluir `reunioes={new ReunioesFalso()}` (substituição mecânica com `sed`).

### Tarefa 5 — Área Reuniões: lista, filtros e roteamento

**Arquivos:** `src/components/moldura/areas.ts`, `src/components/moldura/FaixaLateral.tsx` (comentário), `src/hooks/useAreaAtual.ts`, `src/App.tsx`; criar `src/components/reunioes/AreaDeReunioes.tsx`, `TabelaDeReunioes.tsx`, `FiltrosDasReunioes.tsx`, `Reunioes.css`; criar `src/App.reunioes.test.tsx`.

- [ ] Testes de tela que falham (critérios 4, 5, 9, 10, 12): botão Reuniões da faixa abre a área; tabela com colunas Data e hora, Tipo, Setor, Processos, Local; próximas no topo, realizadas abaixo; marca "sem anotações" só na realizada sem anotações; filtros por setor, tipo, de, até; filtros no endereço e restaurados ao recarregar; [Limpar filtros]; "Nenhuma reunião com esses filtros."; "Nenhuma reunião registrada." com [Registrar reunião] para Integrante e sem para Consulta; carregando; erro com [Tentar de novo].
- [ ] Implementar `AreaDeReunioes` reaproveitando `useCarregamento`, `useEndereco`, `ErroAoCarregar`; `hoje` por prop com padrão local.

### Tarefa 6 — Formulário de registro

**Arquivos:** criar `src/components/reunioes/PainelDeNovaReuniao.tsx`, `FormularioDaReuniao.tsx`, `CamposDaReuniao.tsx`, `validacaoDaReuniao.ts` (+ teste), `useFormularioDaReuniao.ts`; testes em `src/App.registrarReuniao.test.tsx`.

- [ ] Testes que falham (critérios 6 e 7): [Registrar reunião] abre o formulário; salvar desabilitado sem tipo, setor, data ou (modelagem) processo; só setores ativos; processos do setor (todos os estados) só na modelagem; trocar setor ou passar para sensibilização desmarca processos; salvar manda os dados ao falso e volta à lista com a reunião nova; falha genérica e cada recusa (setor inativo, processo de outro setor, modelagem sem processo, sensibilização com processo, texto longo) em vermelho sem perder o preenchido.
- [ ] Implementar no padrão de `PainelDeNovoProcesso`/`FormularioDoProcesso`.

### Tarefa 7 — Painel da reunião

**Arquivos:** criar `src/components/reunioes/PainelDaReuniao.tsx`, `DadosDaReuniao.tsx`; teste `src/App.painelDaReuniao.test.tsx`.

- [ ] Testes que falham (critério 8 e 10): clicar na linha abre o painel com id no endereço e todos os dados; setor e processo inativos com pílula; clicar num processo abre o painel dele (`#/processos/<id>`); reunião inexistente avisa "excluída" (padrão `ItemInexistente`); estados de carregando e erro; Consulta sem botões.
- [ ] Implementar.

### Tarefa 8 — Portões de qualidade, registros e fecho

- [ ] `npm test` (cobertura ≥ 70%), `npx tsc -b` (ou `npm run build`), `npm run lint`, arquivos ≤ 300 linhas.
- [ ] Marcar as caixas deste plano; acrescentar a `.scratch/reunioes/desvios.md` as frases novas e decisões; anotar em `.scratch/melhorias-protocolo.md` os itens não testados do `/executar-complexo`.
- [ ] Merge na `main` (`git switch main`, `git merge`, `git branch -d reunioes-01`), `git push origin main`, conferir o "Testes de banco" da `main`.
- [ ] Linha `Concluído em AAAA-MM-DD (commit <hash>)` no ticket 01; comitar; apontar o próximo ticket.
