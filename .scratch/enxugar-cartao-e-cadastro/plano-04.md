# Ticket 04 — Anotações no cadastro e recusa que some: plano de execução

> **Para quem executa:** `superpowers:executing-plans`; marque as caixas (`- [ ]`) conforme cada tarefa termina.

**Objetivo:** o cadastro de Novo processo ganha o campo Anotações (limite 8.000, banco e telas); a recusa do formulário some em qualquer mudança de campo.

**Referências (não repetidas aqui):** ticket `issues/04-anotacoes-no-cadastro-e-recusa-que-some.md` (critérios 1 a 6); `spec.md`, histórias 3 a 7, 9 e 10, decisões "Formulário do processo" (parte das Anotações) e "Bug do setor", itens 2 e 5 do "Modelo de dados".

**Regras de `.claude/regras/banco.md` que valem:** teste antes da migração; migração só por `npx supabase migration new`; gatilho em `private` com `search_path` vazio; cada célula de "quem pode o quê" testada com Administrador, Integrante, Consulta, desativado e visitante; migração, teste e tipos no mesmo commit; `npm test` nunca depende do banco; nada de produção.

**Fora deste ticket (05):** Origem, Contexto, Observações, junção dos textos antigos, view sem as colunas.

**Decisões do plano**
- `DadosDoProcesso` ganha `anotacoes?: string | null` (opcional: só o cadastro envia; a edição não, e os testes antigos seguem compilando). `valoresDoCadastro` leva `anotacoes`; `valoresDaEdicao` não.
- Em branco/só espaços vira nulo no cliente por `textoParaGravar` (já existe em `src/processos/anotacoes.ts`).
- Gatilho `registrar_ultima_alteracao_das_anotacoes` passa a `before insert or update`; no insert, com texto não nulo, preenche quem e quando.
- Contagem do bloco passa a aparecer a partir de 7.800 (200 antes do limite, como era 1.800 de 2.000).

---

### Tarefa 1: Banco (teste, migração, tipos)

**Arquivos:** criar `supabase/tests/71_anotacoes_no_cadastro.test.sql`; alterar `supabase/tests/50_anotacoes_do_processo.test.sql` (limite 2.000→8.000); criar `supabase/migrations/<ts>_anotacoes_no_cadastro.sql` (via `npx supabase migration new anotacoes_no_cadastro`); `src/types/database.ts` só se `gen types --local` mudar algo.

- [x] **1.1** No `50`: trocar `2001`→`8001` e `2000`→`8000` nas linhas do limite (e nas descrições), e `anotacoes_longas:2001`→`anotacoes_longas:8001`.
- [x] **1.2** Criar o `71` (mesmo cabeçalho/rodapé do `63`: `_tap`, usuários a1–a4, exceção final), cobrindo: administrador e integrante inserem com Anotações e o banco registra autor (`anotacoes_alteradas_por`) e hora; inserir sem Anotações deixa autor e hora nulos; 8.000 caracteres aceitos no insert e 8.001 recusados (`23514`); Consulta e desativado recusados (`42501`) e sem linha; visitante `42501`; ler as Anotações: administrador, integrante e consulta leem, desativado e visitante não.
- [ ] **1.3** (NÃO FEITO: Docker não sobe nesta máquina, sem WSL; a prova fica com o workflow) Ver falhar: `npx supabase start` (descartar a saída: traz chaves), `npx supabase test db`; contar `ok` e `not ok`.
- [x] **1.4** Migração: `alter table ... drop constraint processos_anotacoes_limite, add constraint ... check (char_length(anotacoes) <= 8000)`; `grant insert (anotacoes) on public.processos to authenticated`; `create or replace` do gatilho com ramo `TG_OP = 'INSERT'` e recriação como `before insert or update`; `create or replace` de `gravar_anotacoes_do_processo` com 8000 (mesmo corpo).
- [ ] **1.5** (NÃO FEITO pelo mesmo motivo; os tipos não mudam: só limite, privilégio e corpo de função) `npm run db:reset` (local), `npx supabase test db`: todas as linhas `ok`; `npx supabase gen types --local` e conferir `src/types/database.ts`.
- [x] **1.6** Commit (migração, testes e tipos juntos).

### Tarefa 2: Limite 8.000 no bloco do verso

**Arquivos:** `src/processos/anotacoes.ts`, `src/processos/anotacoes.test.ts`, `src/App.anotacoesDoProcesso.test.tsx`, `src/processos/anotacoesSupabase.test.ts`, `src/processos/GravadorDeAnotacoes.test.ts` (se falhar).

- [x] **2.1** Atualizar os testes para 8.000 / "7.800 de 8.000" / `anotacoes_longas:8001` (ver falhar).
- [x] **2.2** `LIMITE_DAS_ANOTACOES = 8000`, `CONTAGEM_A_PARTIR_DE = 7800`; `npx vitest run` nesses arquivos verde.

### Tarefa 3: Campo Anotações no cadastro

**Arquivos:** `src/processos/tipos.ts`, `src/processos/validacaoDoProcesso.ts`, `src/components/processos/CamposDoProcesso.tsx`, `src/components/processos/FormularioPronto.tsx`, `src/processos/gravarProcessoSupabase.ts`, `src/processos/ProcessosFalso.ts`; testes em `src/App.cadastrarProcesso.test.tsx` (e o do gravador, se houver).

- [x] **3.1** Testes que falham em `App.cadastrarProcesso.test.tsx`: cadastro tem "Anotações" (textarea, `maxlength` 8000); a edição não tem; cadastrar com texto grava e o verso mostra o texto com "Alterado por … em …"; cadastrar com só espaços grava nulo; sem Anotações segue funcionando. Teste do gravador: `insert` leva `anotacoes`, `update` não.
- [x] **3.2** Implementar: `CamposDoProcesso.anotacoes: string` (vazio por padrão), `dadosDoProcesso` devolve `anotacoes: textoParaGravar(campos.anotacoes)`; campo só com `cadastrando`; `valoresDoCadastro` com `anotacoes`; `ProcessosFalso.criarProcesso` tira `anotacoes` dos dados (não vão ao `ProcessoLido`) e registra em `this.anotacoes.porProcesso[id]` com `alteradoPor = this.anotacoes.autor` e hora fixa quando não nulo; `editarProcesso` ignora `anotacoes`.
- [x] **3.3** Testes verdes.

### Tarefa 4: Recusa que some (bug do setor)

**Arquivos:** `src/components/processos/FormularioPronto.tsx`; teste em `src/App.cadastrarProcesso.test.tsx` (regressão: linha ~159).

- [x] **4.1** Teste de regressão: enviar sem setor → "Escolha o setor do processo."; escolher o setor → alerta some; enviar de novo sem macroprocesso → volta outra recusa. Mesma coisa na edição com recusa do banco (`falhaDeGravacao`): mudar um campo apaga; reenviar traz de volta. Ver falhar.
- [x] **4.2** `aoMudar` passa a chamar `setAviso(null)`. Verde.

### Tarefa 5: Fechamento

- [x] **5.1** `npm test`, `npm run lint`, `npx tsc --noEmit` (ou o script de typecheck do projeto) verdes.
- [ ] **5.2** Push da branch, disparar "Testes de banco" e ler o resultado (autorizado em "Ajustes deste Projeto"). Migração no remoto de desenvolvimento: pelo workflow "Migrar banco de desenvolvimento", conforme os Ajustes.
