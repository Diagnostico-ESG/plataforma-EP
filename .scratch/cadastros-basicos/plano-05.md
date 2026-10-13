# Ticket 05 (Histórico dos cadastros): plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** abrir a leitura dos eventos dos cadastros a todos os perfis ativos (migração só de política) e mostrar a aba Histórico: lista das alterações de setores, macroprocessos e setores envolvidos, com filtro por item (inclusive excluído).

**Architecture:** o banco ganha uma política de leitura em `eventos`, limitada às três entidades; a regra de apresentação (texto da ação, nome do item, antes e depois, itens do filtro) vive em funções puras testadas à parte, em `src/cadastros/historicoDosCadastros.ts`; o módulo de cadastros ganha `listarHistoricoDosCadastros` (real e falso); a aba Histórico reaproveita as classes `historico-*` e os helpers `formatarMomento` e `AUTOR_DIRETO_NO_BANCO` do histórico de usuários.

**Tech Stack:** Postgres/Supabase (pgTAP pelo GitHub Actions), React + TypeScript, Vitest + Testing Library.

**Spec:** `.scratch/cadastros-basicos/spec.md` (histórias 35 a 40, 42, 44 e 45; seção "Histórico dos cadastros"; nota dos eventos em "Modelo de dados") · **Ticket:** `.scratch/cadastros-basicos/issues/05-historico-dos-cadastros.md` (critérios citados como "critério N", na ordem do ticket) · **Planos de referência:** `plano-04.md`.

## Restrições globais

- `.claude/regras/banco.md` (lido): teste antes da migração; migração com `npx supabase migration new`; cada política com teste de Administrador, Integrante, Consulta, inativo e visitante; interface só pela chave publicável (`src/lib/supabase.ts`); conferir o vínculo (`supabase/AMBIENTES.md`: dev `yclkzyoebpsxmgpbcbus`) antes de qualquer comando de banco.
- Rede do escritório: pgTAP e migração rodam **no GitHub Actions** ("Ajustes deste Projeto" do `CLAUDE.md`): `git push` da branch (sem `--force`), disparo de "Testes de banco" e de "Migrar banco de desenvolvimento" na branch e leitura do resultado dispensam autorização. Sem `gh`: o disparo é pelo navegador do app. Produção e `migration repair` só pelo `/ship`.
- A migração só cria política: sem tabela nova, sem mudança em `src/types/database.ts` (não há `db:types` neste ticket). Migração e teste de banco no mesmo commit.
- `npm test` nunca depende do banco: telas com `CadastrosFalso` e `AcessoFalso`.
- Limites do ESLint: arquivo ≤ 300 linhas; função em `.ts` ≤ 20 linhas (hooks ≤ 40); complexidade ≤ 10; nada de `any`; no máximo 2 níveis de indentação.
- Dados de teste inventados (siglas e nomes fictícios).
- Commits terminam com `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. O pre-commit nunca é contornado.
- Falhas de carregamento no padrão do histórico de usuários (aviso com [Tentar de novo]).

## Formato dos eventos (já gravado pelos tickets 01 a 04)

`eventos.acao` ∈ `criar | editar | desativar | reativar | excluir`; `entidade` ∈ `setor | macroprocesso | setor_envolvido`; `entidade_ref` é o id (setor, macroprocesso) ou `'<macroprocesso_id>:<setor_id>'` (vínculo); `detalhes` = `{antes, depois}`.

- `setor`: `{sigla, nome, observacoes, ativo}`; na exclusão o `antes` traz também `macroprocessos: [{macroprocesso_id, codigo, nome, observacao}]`.
- `macroprocesso`: `{codigo, nome, descricao, categoria, ativo}`; na exclusão o `antes` traz também `setores: [{setor_id, sigla, nome, observacao}]`.
- `setor_envolvido`: `{setor_id, setor_sigla, macroprocesso_id, macroprocesso_nome, observacao}`; pôr = `criar`, mudar a observação = `editar`, tirar = `excluir`.

## Decisões de execução (tomadas aqui, sem mudar a spec)

- **Texto da ação** depende da entidade só no vínculo: `criar` → "Pôs o setor no macroprocesso", `excluir` → "Tirou o setor do macroprocesso", `editar` → "Mudou a observação do setor no macroprocesso". Nos demais: "Criou", "Editou", "Desativou", "Reativou", "Excluiu". Ação desconhecida aparece pelo código (como no histórico de usuários).
- **Nome do item** (coluna "Item"), lido de `depois ?? antes`: setor `SIGLA — Nome`; macroprocesso `CÓDIGO — Nome` (só `Nome` se sem código); vínculo `SIGLA em Nome do macroprocesso`.
- **Filtro "Item":** opções "Todos os itens" + um por setor e por macroprocesso, ordenadas por nome em `pt-BR`; o nome vem do evento mais recente (a lista chega da mais nova para a mais antiga; vale a primeira ocorrência). Setor ou macroprocesso que só aparece em eventos de vínculo entra pelo `setor_sigla` / `macroprocesso_nome` do evento (só se nenhum evento próprio o nomeou). Um evento de vínculo pertence ao filtro dos dois itens (setor e macroprocesso).
- **Antes e depois:** `Rótulo: valor; …` como `descreverEstado`; rótulos Sigla, Nome, Observações, Código, Descrição, Categoria (`rotuloDaCategoria`), Situação (Ativo/Inativo), Observação, Setor, Macroprocesso; as listas da exclusão viram `Macroprocessos: 01 — Nome (obs); …` e `Setores: SIGLA — Nome (obs); …`, e lista vazia, "nenhum". Valor nulo, "—".
- **Sem limite de linhas** na leitura (a base tem poucas dezenas de eventos por dia); paginação fica para quando o volume pedir.
- Aba recarrega ao ser aberta (a seção remonta ao trocar de aba), então não há atualização em tempo real.

## Mapa de arquivos

| Arquivo | Papel |
|---|---|
| `supabase/tests/14_historico_dos_cadastros.test.sql` (novo) | pgTAP: quem lê o quê em `eventos`; ninguém grava |
| `supabase/migrations/<data>_historico_dos_cadastros.sql` (novo) | política de leitura para perfis ativos, só nas três entidades |
| `supabase/AMBIENTES.md` | registro da migração |
| `src/cadastros/tipos.ts` | `EventoDoCadastro` e `listarHistoricoDosCadastros` |
| `src/cadastros/historicoDosCadastros.ts` (+ `.test.ts`) (novo) | texto da ação, nome do item, antes/depois, itens do filtro |
| `src/cadastros/historicoSupabase.ts` (+ `.test.ts`) (novo) | leitura real; `cadastrosSupabase.ts` junta |
| `src/cadastros/CadastrosFalso.ts` | `historico`, `falharHistorico`, `segurarHistorico` |
| `src/components/cadastros/AreaDeHistorico.tsx`, `ListaDoHistorico.tsx` (novos) | carregamento + filtro; lista e estados |
| `src/components/cadastros/AreaDeCadastros.tsx` | aba Histórico passa a abrir a área |
| `src/components/cadastros/Cadastros.css` | filtro |
| `src/App.historicoDosCadastros.test.tsx` (novo) | telas com o aplicativo inteiro |

---

### Tarefa 1: Banco: leitura do histórico dos cadastros (critérios 1 e 2)

**Files:** `supabase/tests/14_historico_dos_cadastros.test.sql`, `supabase/migrations/<data>_historico_dos_cadastros.sql`, `supabase/AMBIENTES.md`.

**Produz:** política `"eventos: perfil ativo lê os cadastros"` em `public.eventos`, `for select to authenticated using ((select private.usuario_ativo()) and entidade in ('setor', 'macroprocesso', 'setor_envolvido'))`. A política do Administrador (leitura de tudo) continua; as duas somam.

- [x] **Passo 1: conferir o alvo.** Linha "vínculo atual" de `supabase/AMBIENTES.md` = dev `yclkzyoebpsxmgpbcbus`.
- [x] **Passo 2: teste que falha.** `14_historico_dos_cadastros.test.sql` no molde de `06_historico.test.sql` (usuários inventados a1 administrador, a2 integrante, a3 consulta, a4 administrador inativo; função temporária que conta, por papel, os eventos visíveis de uma lista de `entidade_ref` inventada). Eventos inseridos pelo dono do teste (um de cada: `setor`, `macroprocesso`, `setor_envolvido`, `usuario`, `autorizacao`, com `entidade_ref` e `acao` próprios do teste). Conferências:
  - Administrador, Integrante e Consulta leem os 3 eventos de cadastros; Administrador lê também o de `usuario` e o de `autorizacao`;
  - Integrante e Consulta **não** leem `usuario` nem `autorizacao`;
  - inativo (administrador desativado) lê 0; visitante recebe `42501` ao ler;
  - Integrante, Consulta e Administrador recusam (`42501`) incluir, alterar, apagar e `truncate` em `eventos` com `entidade = 'setor'` (mesma função `conferir_que_nao_grava` do 06, copiada).
- [x] **Passo 3: ver falhar.** Commit só do teste, `git push -u origin cadastros-basicos-05`, disparar "Testes de banco" na branch pelo navegador do app e ler o resultado: o teste 14 vermelho (Integrante e Consulta leem 0 dos cadastros).
- [x] **Passo 4: migração.** `npx supabase migration new historico_dos_cadastros`, com a política acima e um comentário do porquê (eventos de usuário trazem e-mails, ficam só com o Administrador). Registrar a migração em `supabase/AMBIENTES.md` (lista das aplicadas pelo workflow).
- [x] **Passo 5: aplicar e conferir.** Commit, push; disparar "Migrar banco de desenvolvimento" na branch com o nome do arquivo e ler o resultado; disparar "Testes de banco" de novo: todos os arquivos verdes, o 14 inteiro. Commit de ajuste se algo falhar (regra de parada: três tentativas).

---

### Tarefa 2: Regras de apresentação do histórico (critério 3, função pura)

**Files:** `src/cadastros/tipos.ts`, `src/cadastros/historicoDosCadastros.ts` (+ `.test.ts`, novos).

**Produz**, em `tipos.ts`:

```ts
export type EstadoDoCadastro = Record<string, unknown> | null
export type EventoDoCadastro = {
  id: number; ocorridoEm: string; autor: string | null; acao: string; entidade: string; entidadeRef: string
  antes: EstadoDoCadastro; depois: EstadoDoCadastro
}
export type ItemDoFiltro = { id: string; nome: string }
```

e, em `historicoDosCadastros.ts`: `textoDaAcaoDoCadastro(acao: string, entidade: string): string`, `nomeDoItem(evento: EventoDoCadastro): string`, `descreverEstadoDoCadastro(estado: EstadoDoCadastro): string`, `itensDoFiltro(eventos: EventoDoCadastro[]): ItemDoFiltro[]`, `eventosDoItem(eventos: EventoDoCadastro[], itemId: string | null): EventoDoCadastro[]` (`null` = todos).

- [x] **Passo 1: testes que falham** (`historicoDosCadastros.test.ts`):
  - `textoDaAcaoDoCadastro`: as 5 ações de setor/macroprocesso ("Criou", "Editou", "Desativou", "Reativou", "Excluiu"); as 3 do vínculo com os textos do ticket; ação desconhecida devolve o código.
  - `nomeDoItem`: setor `CEE — Escola Fictícia`; excluído usa o `antes`; macroprocesso com e sem código; vínculo `CEE em Planejamento Fictício`.
  - `descreverEstadoDoCadastro`: `null` → `—`; setor `Sigla: CEE; Nome: …; Observações: —; Situação: Ativo`; categoria `apoio` → `Categoria: Apoio`; exclusão de setor com `macroprocessos` de 2 itens e de 0 (`Macroprocessos: nenhum`); exclusão de macroprocesso com `setores`; vínculo `Setor: CEE; Macroprocesso: …; Observação: …`.
  - `itensDoFiltro`: nome pelo evento mais recente (setor renomeado aparece uma vez, com o nome novo); setor excluído continua na lista; setor só citado em evento de vínculo entra pela sigla; ordem por nome.
  - `eventosDoItem`: `null` devolve todos; id de setor devolve os eventos do setor e os vínculos dele; id de macroprocesso idem; id sem eventos devolve `[]`.
- [x] **Passo 2: ver falharem.** `npx vitest run src/cadastros/historicoDosCadastros.test.ts`.
- [x] **Passo 3: implementar** (funções de até 20 linhas; tabelas de rótulos como constantes, no estilo de `src/acesso/historico.ts`; reaproveitar `rotuloDaCategoria`).
- [x] **Passo 4: verificar** (`npx vitest run src/cadastros`, `npx tsc -b`, `npm run lint`). Commit.

---

### Tarefa 3: Módulo de cadastros: listar o histórico, real e falso (critério 3)

**Files:** `src/cadastros/tipos.ts`, `src/cadastros/historicoSupabase.ts` (+ `.test.ts`, novos), `cadastrosSupabase.ts`, `CadastrosFalso.ts`, `src/testes/ClienteSupabaseFalso.ts` (só se faltar o filtro `in`).

**Consome:** `EventoDoCadastro` (Tarefa 2). **Produz:** `ModuloDeCadastros.listarHistoricoDosCadastros(): Promise<EventoDoCadastro[]>` (mais recente primeiro; atualizar o comentário do módulo: o histórico chegou); `criarHistoricoSupabase(cliente)` devolvendo `{ listarHistoricoDosCadastros }`; no falso: `historico: EventoDoCadastro[] = []`, `falharHistorico = false`, `segurarHistorico = false`.

- [x] **Passo 1: testes que falham** (`historicoSupabase.test.ts`, molde de `macroprocessosSupabase.test.ts`): pede a `eventos` as colunas `'id, ocorrido_em, acao, entidade, entidade_ref, detalhes, autor:usuarios(nome)'`, filtro `entidade in ('setor','macroprocesso','setor_envolvido')`, ordem `ocorrido_em` e `id` decrescentes; converte cada linha em `EventoDoCadastro` (autor nulo vira `null`; `detalhes.antes/depois` viram `antes/depois`); falha vira `Error('Falha ao ler o histórico dos cadastros: <motivo>')`. Se o `ClienteSupabaseFalso` não registrar `in`, ajustar primeiro (guardar em `pedidos[n].dentro`) e conferir os testes existentes.
- [x] **Passo 2: ver falhar.** `npx vitest run src/cadastros/historicoSupabase.test.ts`.
- [x] **Passo 3: implementar** `historicoSupabase.ts` (uma função de leitura e uma de conversão, ≤ 20 linhas cada); juntar em `criarCadastrosSupabase`; no `CadastrosFalso`, `listarHistoricoDosCadastros` devolve cópia de `historico`, lança `Error('falha de conexão simulada')` com `falharHistorico` e nunca resolve com `segurarHistorico` (mesmo padrão de `listarSetores`).
- [x] **Passo 4: verificar** (`npm test`, `npx tsc -b`, `npm run lint`). Commit.

---

### Tarefa 4: Aba Histórico na tela (critérios 4 a 7)

**Files:** `AreaDeHistorico.tsx`, `ListaDoHistorico.tsx` (novos), `AreaDeCadastros.tsx`, `Cadastros.css`, `src/App.historicoDosCadastros.test.tsx` (novo).

**Consome:** `ModuloDeCadastros.listarHistoricoDosCadastros`, as 5 funções da Tarefa 2, `useCarregamento`, `formatarMomento` e `AUTOR_DIRETO_NO_BANCO` (`src/acesso/historico`), `ErroAoCarregar` (ver como `AreaDeSetores` o usa; se o texto de erro dele não servir para "histórico", reaproveitar a mensagem de `HistoricoDeUsuarios`: "Não foi possível carregar o histórico. Verifique a conexão e tente de novo."). **Produz:** `AreaDeHistorico({ cadastros })`.

- [x] **Passo 1: testes que falham** (`App.historicoDosCadastros.test.tsx`, aplicativo inteiro, `CadastrosFalso.historico` com eventos inventados, hash `#/setores/historico`, login falso como nos outros `App.*.test.tsx`):
  - lista: um item por evento, na ordem recebida, com data e hora, autor, texto da ação, nome do item e "Antes: …" / "Depois: …";
  - autor nulo mostra `AUTOR_DIRETO_NO_BANCO`;
  - exclusão de setor mostra no "Antes" todos os campos e `Macroprocessos: …` com a observação; exclusão de macroprocesso mostra `Setores: …`;
  - vínculo: pôr, anotar e tirar aparecem com os três textos do ticket e sigla + macroprocesso;
  - filtro "Item": opções "Todos os itens" e os itens do histórico (inclusive um setor excluído); escolher um setor mostra só os eventos dele e os vínculos dele; escolher o excluído mostra o que aconteceu com ele; voltar a "Todos os itens" mostra tudo;
  - estados: "Carregando histórico…" (com `segurarHistorico`); "Nenhuma alteração registrada ainda." (lista vazia); erro com [Tentar de novo] que, após consertar o falso, mostra a lista;
  - Consulta e Integrante abrem a aba e leem; a aba não tem nenhum botão de alteração; a aba "Histórico" é a corrente (`aria-current="page"`).
- [x] **Passo 2: ver falharem.** `npx vitest run src/App.historicoDosCadastros.test.tsx`.
- [x] **Passo 3: implementar.** `AreaDeHistorico` carrega com `useCarregamento` (callback estável por `useCallback`), guarda o item escolhido em `useState<string | null>` e entrega à `ListaDoHistorico` os eventos filtrados e os itens; `<label>Item <select>` com "Todos os itens"; lista `<ol className="historico-lista">` com as classes `historico-item` e `historico-mudanca` do histórico de usuários; `SecaoAtual` em `AreaDeCadastros.tsx` passa a devolver a área na aba `historico` (some a frase "Esta seção chega numa próxima entrega."; procurar testes que dependam dela e ajustá-los); CSS do filtro em `Cadastros.css`, usando as variáveis de cor/espaço já existentes. Se um componente passar de 300 linhas ou 10 caminhos, extrair.
- [x] **Passo 4: verificar** (`npm test`, `npx tsc -b`, `npm run lint`). Commit.

---

### Tarefa 5: Fechamento (critérios 1 a 7 conferidos)

- [x] **Passo 1: gate completo.** `npm test`, `npx tsc -b`, `npm run lint`, `npm run check:circular`, `npm run test:coverage` com cobertura ≥ 70%.
- [x] **Passo 2: conferir os 7 critérios do ticket** um a um, com a evidência (teste ou arquivo) de cada, e marcar as caixas do ticket.
- [x] **Passo 3: revisão visual.** Subir o Vite (`preview_start`) e abrir `#/setores/historico`; se o login institucional do Google barrar a sessão, registrar que a conferência visual ficou com o usuário, como nos tickets anteriores. **Feito assim:** não há `.claude/launch.json` (e o `.claude/` não se edita neste projeto) e o login do Google barra a sessão no navegador do app; a conferência da aba Histórico ficou com o usuário.
- [x] **Passo 4: registros.** Spec: nota curta na seção de histórico dizendo que o filtro reconhece eventos de vínculo pelos dois ids. `.scratch/melhorias-protocolo.md`: itens de `.claude/regras/nao-testados.md` que aconteceram nesta execução e o resultado dos dois workflows.
- [ ] **Passo 5: encerrar.** `git switch main`, merge da branch, `git branch -d cadastros-basicos-05`, linha `Concluído em` no ticket, commit, `git push` da `main` (autorizado) e conferência de "Testes de banco" e "Verificação" na `main`.
