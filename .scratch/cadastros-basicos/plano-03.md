# Ticket 03 (Macroprocessos: ver, cadastrar, editar, desativar, reativar e excluir): plano de implementação

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** aba Macroprocessos da área Setores com o ciclo de vida completo (lista, criar, abrir, editar, desativar, reativar, excluir), sobre a tabela `macroprocessos` com RLS por perfil e eventos no histórico.

**Architecture:** o banco impõe tudo (nome e código únicos, "" vira nulo, perfil, eventos) numa migração nova, no mesmo desenho de `20261013123327_setores.sql`, reaproveitando `private.pode_alterar_cadastros()` e `private.acao_do_cadastro()`. A interface ganha as operações de macroprocesso no módulo de cadastros (real e falso) e componentes novos em `src/components/cadastros/`, depois de um prefactor que torna genéricas as peças que o setor e o macroprocesso repetem (segunda repetição real, regra do `CLAUDE.md`).

**Tech Stack:** Postgres/Supabase (pgTAP pelo GitHub Actions), React + TypeScript, Vitest + Testing Library.

**Spec:** `.scratch/cadastros-basicos/spec.md` (histórias 20 a 25, 32, 33, 41 a 44) · **Ticket:** `.scratch/cadastros-basicos/issues/03-macroprocessos.md` (critérios citados como "critério N", na ordem do ticket) · **Plano de referência:** `plano-01.md` e `plano-02.md`.

## Restrições globais

- Regras de `.claude/regras/banco.md` que valem: teste antes da migração; migração criada com `npx supabase migration new`; RLS ligada e políticas na mesma migração; funções de gatilho `security definer` só em `private`, com `search_path` vazio, execução tirada de `public`, `anon` e `authenticated`; cada célula de "quem pode o quê" de `macroprocessos` com teste (Administrador, Integrante, Consulta, inativo, visitante); interface só pela chave publicável (`src/lib/supabase.ts`); conferir o vínculo (`supabase/AMBIENTES.md`: dev `yclkzyoebpsxmgpbcbus`; `supabase/.temp/project-ref`) antes de `db:types`.
- Rede do escritório: porta 5432 fechada. A migração é aplicada **pelo usuário** no SQL Editor do dev; a bateria pgTAP roda no GitHub Actions ("Testes de banco", disparado na branch `cadastros-basicos`; push da branch e disparo dispensam autorização, `CLAUDE.md` "Ajustes deste Projeto"). Sem `gh`: o disparo é pelo navegador.
- Migração, teste de banco e tipos (`src/types/database.ts`) no mesmo commit.
- `npm test` nunca depende do banco: telas com `CadastrosFalso` e `AcessoFalso`.
- Limites do ESLint: arquivo ≤ 300 linhas; função em `.ts` ≤ 20 linhas (hooks ≤ 40); complexidade ≤ 10; nada de `any`.
- Dados de teste inventados.
- Commits terminam com `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. O pre-commit nunca é contornado.
- Mensagens de falha e recusa em vermelho (`cadastros-falha` / `cadastros-erro`, ADR 0003).

## Decisões de execução (tomadas aqui, sem mudar a spec)

- **Fora deste ticket (vêm no 04):** setores envolvidos, a contagem de setores na lista e o texto "{n} setores deixam de estar envolvidos nele" da janela de exclusão. Aqui a lista tem código, nome, categoria e situação, e a janela usa só "O histórico guarda o que ele tinha, mas não é possível desfazer." (zero setores, como o ticket diz). O gatilho de evento do macroprocesso grava só os campos do próprio macroprocesso; o 04 o amplia com a lista de setores no "antes" da exclusão.
- **Recusas com frase pronta** como `TravaDoBanco`, pelo código do Postgres e pelo nome da restrição: `23505` + `macroprocessos_nome_unico` → "Já existe um macroprocesso com o nome {nome}."; `23505` + `macroprocessos_codigo_key` → "Já existe um macroprocesso com o código {código}."; `42501` → "Seu perfil não permite alterar os cadastros.".
- **Nome vazio na tela:** "O nome do macroprocesso é obrigatório." (a spec não tem texto). Código e descrição vão como nulo quando vazios na tela; o banco também troca "" do código por nulo.
- **Categoria:** valor do banco `finalistico | apoio | gerencial | null`; rótulos "Sem categoria", "Finalístico", "Apoio", "Gerencial" ficam num ponto só (`src/cadastros/categorias.ts`).
- **Ordem da lista:** o módulo real pede ao banco `order('codigo', { nullsFirst: false })` e depois `order('nome')`; a tela mostra na ordem recebida e filtra os ativos. O `CadastrosFalso` aplica a mesma regra (código, sem código depois, nome) para os testes de tela provarem a ordem.
- **Código "MP01" etc. na ordem:** comparação de texto simples, como o banco faz.
- **Prefactor (tarefa 2):** `AcoesDoSetor` → `AcoesDoCadastro`, `SetorInexistente` → `ItemInexistente`, e `LinhaFantasma`/caixa "Mostrar inativos" extraídas para `PecasDaLista.tsx`. Só renomeia e parametriza; os testes existentes (565) continuam passando sem mudança de comportamento.

## Mapa de arquivos

| Arquivo | Papel |
|---|---|
| `supabase/tests/12_macroprocessos.test.sql` (novo) | pgTAP: quem pode o quê, regras de nome e código, eventos |
| `supabase/migrations/<data>_macroprocessos.sql` (novo) | tipo, tabela, restrições, gatilhos, RLS, privilégios |
| `supabase/AMBIENTES.md` | registro da migração aplicada à mão |
| `src/types/database.ts` | tipos gerados por `npm run db:types` |
| `src/cadastros/tipos.ts` | `Macroprocesso`, `CategoriaDoMacroprocesso`, `DadosDoMacroprocesso`; `ModuloDeCadastros` ganha 7 operações |
| `src/cadastros/categorias.ts` (novo) | rótulos das categorias |
| `src/cadastros/validacaoDoMacroprocesso.ts` (+ `.test.ts`) (novo) | nome obrigatório, normalização do código |
| `src/cadastros/macroprocessosSupabase.ts` (novo) | operações reais de macroprocesso e tradução das recusas |
| `src/cadastros/cadastrosSupabase.ts` | compõe setores + macroprocessos |
| `src/cadastros/macroprocessosSupabase.test.ts` (novo) | teste do módulo real |
| `src/cadastros/CadastrosFalso.ts` | operações falsas de macroprocesso |
| `src/components/cadastros/PecasDaLista.tsx` (novo, prefactor) | `CaixaMostrarInativos`, `LinhaFantasma` |
| `src/components/cadastros/AcoesDoCadastro.tsx` (renomeia `AcoesDoSetor`) | Desativar/Reativar/Excluir genérico |
| `src/components/cadastros/ItemInexistente.tsx` (renomeia `SetorInexistente`) | aviso + [Voltar à lista] |
| `src/components/cadastros/AreaDeMacroprocessos.tsx` (novo) | carrega, [Novo macroprocesso], formulário e lista |
| `src/components/cadastros/ListaDeMacroprocessos.tsx` (novo) | tabela e estados |
| `src/components/cadastros/FormularioDeMacroprocesso.tsx` (novo) | código, nome, descrição, categoria |
| `src/components/cadastros/MacroprocessoAberto.tsx`, `MacroprocessoEditavel.tsx`, `MacroprocessoSomenteLeitura.tsx` (novos) | item aberto |
| `src/components/cadastros/AreaDeCadastros.tsx` | aba Macroprocessos deixa de ser "em breve" |
| `src/components/cadastros/Cadastros.css` | pequenos ajustes (categoria na tabela) |
| `src/App.macroprocessos.test.tsx`, `src/App.novoMacroprocesso.test.tsx`, `src/App.editarMacroprocesso.test.tsx`, `src/App.excluirMacroprocesso.test.tsx` (novos) | testes de tela |

---

### Tarefa 1: Banco: tabela `macroprocessos`, RLS, regras e eventos (critérios 1, 2 e 3)

**Files:** criar `supabase/tests/12_macroprocessos.test.sql` e a migração (`npx supabase migration new macroprocessos`); modificar `supabase/AMBIENTES.md` e `src/types/database.ts` (gerado).

**Interfaces:** Produz o tipo `public.categoria_macroprocesso`, a tabela `public.macroprocessos (id, codigo, nome, descricao, categoria, ativo, criado_em)` e as restrições `macroprocessos_nome_unico` (índice sobre `lower(nome)`), `macroprocessos_codigo_key`; eventos com `entidade = 'macroprocesso'`, `entidade_ref = id`, `detalhes = {antes, depois}` com `codigo, nome, descricao, categoria, ativo`. Consome `private.pode_alterar_cadastros()` e `private.acao_do_cadastro(text, jsonb, jsonb)`.

- [x] **Passo 1: criar a branch** `git switch -c cadastros-basicos` e criar o marco `marco/2026-10-13-inicio-macroprocessos` (tag; segue o padrão de início de ticket do projeto).
- [x] **Passo 2: escrever o teste pgTAP** `12_macroprocessos.test.sql`, copiando a estrutura de `11_setores.test.sql` (mesmos quatro usuários `a1` a `a4`, funções `pg_temp.conferir_quem_altera` e `conferir_quem_nao_altera`, visitante, retorno em `_tap`, `plan(N)` com N contado). Casos:
  - Administrador e Integrante: leem, criam, alteram código/nome/descrição/categoria/ativo, recusam alterar `id` e `criado_em` (`42501`), apagam.
  - Consulta e Inativo (administrador desativado): Consulta lê, Inativo não; nenhum cria (`42501`), altera (0 linhas), altera `id`/`criado_em` (`42501`) ou apaga (0 linhas).
  - Visitante: `42501` em ler, criar, alterar, alterar `id`, alterar `criado_em`, apagar.
  - Regras (rodando como dono do banco): nome " Planejamento Inventado " guardado sem espaços; nome repetido com outras maiúsculas e espaço na ponta recusado (`23505`); nome vazio/só espaços recusado (`23514`); código " MP01 " guardado como "MP01" (o código não é convertido para maiúsculas: a spec só pede sem espaços nas pontas); código repetido "MP01" recusado (`23505`); código "" guardado como nulo; dois macroprocessos sem código aceitos; código com 21 caracteres recusado (`23514`); descrição com 2001 caracteres recusada (`23514`); categoria fora da lista recusada (`22P02`); categoria nula aceita.
  - Eventos (administrador cria, edita, desativa, reativa, exclui um macroprocesso `HIST`; gravação sem mudança não gera evento): `criar` grava o `depois` legível e o autor; `editar` grava o `antes`; `desativar` e `reativar` viram ação própria; `excluir` grava no `antes` todos os campos.
- [x] **Passo 3: ver o teste falhar.** `git push -u origin cadastros-basicos` e disparar "Testes de banco" na branch pelo navegador. Esperado: vermelho (tabela não existe).
- [x] **Passo 4: escrever a migração** no desenho da de setores: `create type`, `create table` com `constraint ..._tamanho` nas colunas de texto, `macroprocessos_codigo_key unique (codigo)` e `create unique index macroprocessos_nome_unico on public.macroprocessos (lower(nome))`; `enable row level security`; `revoke all ... from anon, authenticated`, `grant select, delete`, `grant insert (codigo, nome, descricao, categoria)`, `grant update (codigo, nome, descricao, categoria, ativo)`; quatro políticas (`"macroprocessos: ativo lê"` com `private.usuario_ativo()`; criar, alterar e apagar com `private.pode_alterar_cadastros()`); função `private.preparar_macroprocesso()` (`nome := btrim(nome)`, `codigo := nullif(btrim(codigo), '')`) em gatilho `before insert or update`; função `private.registrar_evento_do_macroprocesso()` (`security definer`, `search_path` vazio, mesmo molde de `registrar_evento_do_setor`, `entidade = 'macroprocesso'`, ignorando gravação sem mudança) em gatilho `after insert or update or delete`; `revoke execute` das duas funções de `public, anon, authenticated`. Comentário de topo como o da migração de setores.
- [x] **Passo 5: pedir ao usuário que aplique a migração** no SQL Editor do dev (colar o conteúdo do arquivo) e confirmar. Registrar em `supabase/AMBIENTES.md` a migração aplicada à mão (mesma forma das anteriores).
- [x] **Passo 6: ver o teste passar.** Push e disparo do "Testes de banco" na branch. Esperado: verde, com `00_rls_ligada` e `10_privilegios_padrao` intactos (critério 2).
- [x] **Passo 7: tipos.** Conferir o vínculo (`AMBIENTES.md` e `supabase/.temp/project-ref`), `npm run db:types`, `npx tsc -b` limpo.
- [x] **Passo 8: commit** da migração, do teste, dos tipos e do `AMBIENTES.md`.

---

### Tarefa 2: Prefactor: peças genéricas do cadastro (sem mudar comportamento)

**Files:** renomear `AcoesDoSetor.tsx` → `AcoesDoCadastro.tsx` e `SetorInexistente.tsx` → `ItemInexistente.tsx` (com `git mv`); criar `PecasDaLista.tsx`; ajustar `SetorEditavel.tsx`, `SetorAberto.tsx`, `ListaDeSetores.tsx`.

**Interfaces:** Produz `AcoesDoCadastro` com props `{ ativo: boolean; tituloDaJanela: string; textoDaJanela: string; rotuloDaExclusao: string; desativar: () => Promise<void>; reativar: () => Promise<void>; excluir: () => Promise<void>; aoMudar; aoSumir; aoVoltar }`; `ItemInexistente({ aoVoltar })`; `CaixaMostrarInativos({ marcada, aoMudar })` e `LinhaFantasma({ colunas })`.

- [x] **Passo 1: linha de base.** `npm test` passa (565).
- [x] **Passo 2: renomear e parametrizar** como acima; `SetorEditavel` passa as funções do setor e os textos "Excluir o setor {SIGLA}?" / "Excluir setor" a `AcoesDoCadastro`.
- [x] **Passo 3: extrair** a caixa "Mostrar inativos" e a linha-fantasma de `ListaDeSetores` para `PecasDaLista.tsx` (fantasma com número de colunas).
- [x] **Passo 4: verificar.** `npm test` (565 passando, nenhum teste mudou), `npx tsc -b`, `npm run lint`. Commit.

---

### Tarefa 3: Módulo de cadastros: operações de macroprocesso, real e falso (critério 4)

**Files:** `src/cadastros/tipos.ts`, `categorias.ts` (novo), `validacaoDoMacroprocesso.ts` (+ teste), `macroprocessosSupabase.ts` (novo), `macroprocessosSupabase.test.ts` (novo), `cadastrosSupabase.ts`, `CadastrosFalso.ts`.

**Interfaces:** Produz, em `ModuloDeCadastros`: `listarMacroprocessos(): Promise<Macroprocesso[]>`, `criarMacroprocesso(dados: DadosDoMacroprocesso): Promise<void>`, `lerMacroprocesso(id): Promise<Macroprocesso | null>`, `editarMacroprocesso(id, dados): Promise<void>`, `desativarMacroprocesso(id)`, `reativarMacroprocesso(id)`, `excluirMacroprocesso(id)`; tipos `Macroprocesso = { id; codigo: string | null; nome; descricao: string | null; categoria: CategoriaDoMacroprocesso | null; ativo }` e `DadosDoMacroprocesso = { codigo; nome; descricao; categoria }`. `CadastrosFalso` ganha `macroprocessos: Macroprocesso[]`, `falharListaDeMacroprocessos`, `segurarListaDeMacroprocessos`; `falhaDeGravacao` vale para as duas famílias.

- [x] **Passo 1: testes que falham.**
  - `validacaoDoMacroprocesso.test.ts`: nome só com espaços → "O nome do macroprocesso é obrigatório."; nome preenchido → `null`; `normalizarCodigo("  ")` → `null` e `normalizarCodigo(" MP01 ")` → "MP01".
  - `macroprocessosSupabase.test.ts` (molde de `cadastrosSupabase.test.ts`, com `ClienteSupabaseFalso`): lista pede as colunas `id, codigo, nome, descricao, categoria, ativo` com a ordem por código (sem código depois) e por nome; falha ao listar vira erro com o motivo; criar envia os dados à tabela `macroprocessos`; cada recusa (`23505` nome, `23505` código, `42501`) vira `TravaDoBanco` com a frase pronta; outra falha vira "erro inesperado do banco (…)"; ler pelo id e `null` quando não existe; editar/desativar/reativar gravam só o que muda filtrando pelo id; excluir apaga pelo id; zero linhas afetadas com o item sumido → `CadastroInexistente`, com o item ainda lá → `TravaDoBanco('Seu perfil não permite alterar os cadastros.')`.
  - Estender `ClienteSupabaseFalso` só se a ordem por duas colunas ou `nullsFirst` exigir (guardar `nullsFirst` no pedido).
- [x] **Passo 2: ver falharem.** `npx vitest run src/cadastros`.
- [x] **Passo 3: implementar.** Tipos e `categorias.ts` (`ROTULOS_DAS_CATEGORIAS`, lista das opções com "Sem categoria"); validação; `macroprocessosSupabase.ts` com `criarMacroprocessosSupabase(cliente)` (mesmo molde de `cadastrosSupabase.ts`: `listar`, `ler`, `criar`, `alterar`, `excluir`, `porQueNadaMudou`, `falhaDoMacroprocesso`); `cadastrosSupabase.ts` passa a devolver `{ ...setores, ...macroprocessos }` (a parte dos setores sai para uma função própria se o arquivo passar de 100 linhas); `CadastrosFalso` com as sete operações (ordem código/nome como o banco).
- [x] **Passo 4: verificar.** Testes do módulo passam; `npm test`, `npx tsc -b`, `npm run lint`. Commit.

---

### Tarefa 4: Aba Macroprocessos: lista, estados e "Mostrar inativos" (critério 5)

**Files:** `AreaDeMacroprocessos.tsx`, `ListaDeMacroprocessos.tsx` (novos); `AreaDeCadastros.tsx`; `src/App.macroprocessos.test.tsx` (novo).

**Interfaces:** Consome `useCarregamento`, `ErroAoCarregar`, `PecasDaLista`, `Pilula`, `ModuloDeCadastros.listarMacroprocessos`. Produz `AreaDeMacroprocessos({ cadastros, podeAlterar })` e `ListaDeMacroprocessos({ estado, aoTentarDeNovo, aoAbrir })`.

- [x] **Passo 1: testes de tela que falham** (molde `App.setores.test.tsx` e `App.setoresInativos.test.tsx`, hash `#/setores/macroprocessos`, macroprocessos inventados): colunas Código, Nome, Categoria, Situação; ordem pelo código com os sem código depois em ordem alfabética; só ativos ao abrir; "Mostrar inativos" mostra os inativos com a pílula "Inativo"; "Carregando macroprocessos…"; "Nenhum macroprocesso cadastrado ainda."; "Nenhum macroprocesso ativo para mostrar." quando só há inativos; erro de carregamento em vermelho com [Tentar de novo] que recupera; a aba atual fica destacada; [Novo macroprocesso] aparece para Administrador e Integrante e não para a Consulta.
- [x] **Passo 2: ver falharem.** `npx vitest run src/App.macroprocessos.test.tsx`.
- [x] **Passo 3: implementar** os dois componentes e ligar a aba em `AreaDeCadastros` (a aba Histórico segue com o aviso "chega numa próxima entrega").
- [x] **Passo 4: verificar** (`npm test`, `tsc`, `lint`). Commit.

---

### Tarefa 5: Criar macroprocesso (critério 6, formulário)

**Files:** `FormularioDeMacroprocesso.tsx` (novo); `AreaDeMacroprocessos.tsx`; `src/App.novoMacroprocesso.test.tsx` (novo); `Cadastros.css` se faltar estilo do seletor.

**Interfaces:** Produz `FormularioDeMacroprocesso({ aoSalvar: (dados: DadosDoMacroprocesso) => Promise<void>, aoCancelar, titulo?, inicial?, rotuloDoCancelar? })`, no molde de `FormularioDeSetor` (`noValidate`, falha da gravação mostrada com `textoDaFalhaNoFormulario` e dados mantidos).

- [x] **Passo 1: testes que falham:** [Novo macroprocesso] abre o formulário com Código, Nome, Descrição e Categoria (opções "Sem categoria", Finalístico, Apoio, Gerencial, começando em "Sem categoria"); só o nome é obrigatório (nome vazio → "O nome do macroprocesso é obrigatório." e nada é gravado); salvar só com nome grava, fecha o formulário e o item aparece na lista; salvar com todos os campos grava código, descrição e categoria; recusa de nome repetido mostra "Já existe um macroprocesso com o nome {nome}." em vermelho e mantém os dados; recusa de código repetido mostra "Já existe um macroprocesso com o código {código}."; falha genérica mostra "A alteração não foi salva: {motivo}. Seus dados continuam no formulário."; Cancelar fecha sem gravar.
- [x] **Passo 2: ver falharem.**
- [x] **Passo 3: implementar** o formulário e ligar o [Novo macroprocesso] em `AreaDeMacroprocessos` (grava, fecha, recarrega a lista).
- [x] **Passo 4: verificar. Commit.**

---

### Tarefa 6: Macroprocesso aberto: editar, desativar, reativar, excluir e Consulta (critérios 6, 7, 8 e 9)

**Files:** `MacroprocessoAberto.tsx`, `MacroprocessoEditavel.tsx`, `MacroprocessoSomenteLeitura.tsx` (novos); `AreaDeMacroprocessos.tsx`; `src/App.editarMacroprocesso.test.tsx`, `src/App.excluirMacroprocesso.test.tsx` (novos).

**Interfaces:** Consome `AcoesDoCadastro`, `ItemInexistente`, `FormularioDeMacroprocesso` e as operações de ler, editar, desativar, reativar e excluir. Produz `MacroprocessoAberto({ cadastros, podeAlterar, id, aoVoltar })`.

- [x] **Passo 1: testes que falham.**
  - Editar (`App.editarMacroprocesso.test.tsx`): clicar na linha abre o macroprocesso com código, nome, descrição e categoria preenchidos; editar qualquer campo, inclusive o nome, e Salvar grava e volta à lista; as duas recusas de unicidade e a falha genérica mostram a mensagem em vermelho e mantêm os dados; macroprocesso excluído por outra pessoa durante a edição mostra "Este cadastro não existe mais. Ele pode ter sido excluído; veja o Histórico." com [Voltar à lista]; item que já não existe ao abrir mostra o mesmo aviso; erro ao ler mostra "Não foi possível carregar o macroprocesso…" com [Tentar de novo]; "Carregando macroprocesso…".
  - Ciclo e exclusão (`App.excluirMacroprocesso.test.tsx`): Desativar grava na hora, sem janela, e o botão vira Reativar (e o inverso); a lista deixa de mostrar o desativado; falha ao desativar mostra o motivo em vermelho e o estado não muda; Excluir abre a janela "Excluir o macroprocesso {nome}?" com o texto "O histórico guarda o que ele tinha, mas não é possível desfazer.", botões [Excluir macroprocesso] e [Cancelar], foco no Cancelar; Cancelar e Esc fecham sem gravar; confirmar apaga e volta à lista; falha ao excluir mostra o motivo e o item continua; excluir um item já excluído por outra pessoa mostra o aviso de inexistente.
  - Consulta: abre o macroprocesso com os dados em leitura, sem campos editáveis e sem botões de alteração, só [Voltar à lista].
- [x] **Passo 2: ver falharem.**
- [x] **Passo 3: implementar** os três componentes (molde de `SetorAberto`, `SetorEditavel`, `SetorSomenteLeitura`; `SetorSomenteLeitura` mostra "—" para campo vazio e o rótulo da categoria) e ligar o clique da linha em `AreaDeMacroprocessos`.
- [x] **Passo 4: verificar. Commit.**

---

### Tarefa 7: Fechamento (critérios 1 a 9 conferidos)

- [ ] **Passo 1: gate completo.** `npm test` (todos passando), `npx tsc -b`, `npm run lint`, `npm run test -- --coverage` com cobertura ≥ 70%.
- [ ] **Passo 2: conferir os 9 critérios do ticket** um a um, anotando a evidência (teste ou arquivo) de cada.
- [ ] **Passo 3: revisão visual.** Subir o Vite (`preview_start`) e conferir a aba Macroprocessos na tela (se o login institucional do Google barrar a sessão, registrar que a conferência visual ficou com o usuário, como no ticket 02).
- [ ] **Passo 4: registros.** Atualizar `.scratch/melhorias-protocolo.md` com os itens de `.claude/regras/nao-testados.md` que aconteceram nesta execução.
- [ ] **Passo 5: encerrar.** Junto da branch à `main` (`git switch main`, merge, `git branch -d cadastros-basicos`), linha `Concluído em` no ticket, commit, `git push` da `main` e conferência do "Testes de banco" na `main` (o push mexe em `supabase/`).
