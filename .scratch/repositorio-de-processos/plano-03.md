# Tirar do Quadro — Plano do ticket 03

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans para executar este plano tarefa por tarefa. Os passos usam caixas (`- [ ]`); marque `- [x]` ao concluir cada um.

**Goal:** A coluna Concluídos do Quadro por etapa mostra só o que está no Quadro; quem altera tira o cartão da coluna (no cartão ou no verso), com aviso "Tirado do Quadro · Desfazer"; o pé da coluna diz quantos ficaram de fora e leva à Lista em Concluídos; o Quadro por responsável não mostra concluídos.

**Architecture:** Duas funções novas no banco (`tirar_do_quadro`, `voltar_ao_quadro`), sem `security definer` (a RLS de `processos` decide), que ligam a liberação de sessão `ep.liberando_tirada` já criada no ticket 01 e gravam `tirado_do_quadro_em`; nenhuma grava evento. No código: dois métodos em `ModuloDeProcessos` (real por `rpc`, falso em memória), um hook `useTirarDoQuadro` com contexto (a tela do Quadro e o verso o usam; o aviso vive na área de Processos), o botão fora do `<a>` do cartão, o pé da coluna e o corte dos concluídos no Quadro por responsável.

**Tech Stack:** React + Vite + TypeScript, Vitest, Supabase (Postgres, pgTAP).

**Spec:** `.scratch/repositorio-de-processos/spec.md` ("Coluna Concluídos do Quadro por etapa", "Quadro por responsável", "Modelo de dados"). **Ticket:** `issues/03-tirar-do-quadro.md`. ADR 0034.

## Global Constraints

- **Regras de `.claude/regras/banco.md` que valem aqui:** teste de banco antes da migração; migração, teste e tipos no mesmo commit; função sem `security definer` (a RLS decide, como `registrar_publicacao`), `search_path` vazio, `execute` só para `authenticated`; nada de chave secreta; migração enviada ao remoto nunca se edita (a correção é migração nova); o alvo do banco é conferido antes de qualquer comando contra o remoto (vínculo atual = desenvolvimento `yclkzyoebpsxmgpbcbus`).
- **Banco local:** testes de banco no Docker (`npx supabase db reset --local`, `npx supabase test db`; contar `ok`/`not ok`; o "FAIL" do runner é do formato; o 53 só roda com um segundo administrador fictício no banco local — `insert` em `autorizacoes` e `auth.users` com id fora dos usados pelos testes, ex.: `…0e09`). Nada vai ao remoto de desenvolvimento por mim, exceto o que os Ajustes do Projeto autorizam: o workflow "Testes de banco" e o "Migrar banco de desenvolvimento" na branch. Saída de `supabase start` e `status` traz chaves: não repetir.
- **Código:** funções de lógica de 4 a 20 linhas, arquivos até 300 linhas, complexidade até 10, sem `any`, mensagens de erro com o valor e o formato esperado, early return. Dados de teste só inventados. Sem dependência nova.
- **Mensagens de commit** terminam com a linha de co-autoria. O pre-commit roda ESLint, typecheck e a suíte inteira (cerca de 200 s): migração, tipos e código vão num commit só.
- Testes de data usam o relógio local de Brasília (fragilidade de fuso já no backlog).

## Decisões deste plano (rulings)

- As funções gravam `clock_timestamp()` (não `now()`): `now()` é o início da transação e ficaria antes de `entrou_em` (que usa `clock_timestamp()`) se mover e tirar acontecessem na mesma transação, deixando `no_quadro` verdadeiro.
- Códigos de recusa: `tirar_do_quadro_so_concluido`, `ja_fora_do_quadro` (spec) e, para o Desfazer fora de Concluídos, `voltar_ao_quadro_so_concluido` (a spec pede a recusa e não nomeia o código). Desfazer num processo que já está no Quadro não é recusado (grava nulo, sem efeito).
- Ordem das recusas, como em `registrar_publicacao`: processo inexistente ou invisível (`registro_inexistente`); sem poder de alterar (42501); regra do processo.
- O botão do cartão fica **fora** do `<a>` (um botão dentro de um link não é válido): o cartão da coluna Concluídos vai num envoltório com o botão logo abaixo dele.
- Aviso e falha ficam na área de Processos, no fluxo normal acima da visão (não cobrem cartão nem coluna). O aviso serve ao cartão e ao verso por um contexto.
- O pé da coluna só existe no Quadro por etapa; "Ver na Lista" leva os filtros do Quadro (sem situação nem busca, que só existem na Lista) e `mostrar=concluidos`.

## Mapa de arquivos

- Banco: criar `supabase/tests/69_tirar_do_quadro.test.sql` e `supabase/migrations/<ts>_tirar_e_voltar_ao_quadro.sql`; alterar `src/types/database.ts`.
- Acesso: `src/processos/{tipos,ProcessosFalso,processosSupabase,recusasDoBanco,frasesDoQuadro}.ts` (+ testes); criar `src/processos/tirarDoQuadroSupabase.ts` (+ teste).
- Lógica: `src/processos/colunasDoQuadro.ts` (+ teste: por responsável sem concluídos; contagem dos fora do Quadro).
- Tela: criar `src/hooks/useTirarDoQuadro.tsx` (+ teste), `src/components/processos/{AvisoDoQuadro,PeDaColunaDosConcluidos}.tsx`; alterar `AreaDeProcessos`, `VisaoDosProcessos`, `QuadroDeProcessos`, `ColunaDoQuadro`, `AgoraDoConcluido`, `Quadro.css`; criar `src/App.tirarDoQuadro.test.tsx`; ajustar `App.concluidos.test.tsx`.

---

### Tarefa 1: Banco — testes, migração e tipos

**Files:** `supabase/tests/69_tirar_do_quadro.test.sql`, `supabase/migrations/<ts>_tirar_e_voltar_ao_quadro.sql`, `src/types/database.ts`.

- [ ] **1.1** Conferir o ponto de partida: árvore limpa, Docker no ar (`npx supabase start`, saída descartada), `npx supabase db reset --local` e linha de base (`npx supabase test db`, com o administrador fictício extra para o 53): contar `ok` e `not ok` (esperado 0).
- [ ] **1.2** (teste primeiro) `69_tirar_do_quadro.test.sql`, no molde do 68 (cabeçalho, `_tap`, quatro usuários a1 administrador, a2 integrante, a3 consulta, a4 inativo, setor/macro próprios `…0069`, auxiliares `claims`, `processo`, `etapa`, `mover`, `linha`, `enviar_completa`; copiar do 68 e trocar o nome do setor). Processos: `Recente` (concluído há 29 dias), `Antigo` (31 dias), `Andamento` (em Publicação), `Parado` (suspenso em Publicação), `Volta`, `Perfis`, `Evento`. Asserções (um `insert into _tap … select` cada; `plan(N)` = total):
  1. a1 e a2 tiram `Recente` e `Evento`; `no_quadro` falso e `tirado_do_quadro_em` preenchido na view;
  2. segunda chamada: `ja_fora_do_quadro` (P0001); `Antigo` (31 dias): `ja_fora_do_quadro`;
  3. `Andamento` e `Parado`: `tirar_do_quadro_so_concluido`; `voltar_ao_quadro` neles: `voltar_ao_quadro_so_concluido`;
  4. Desfazer: `voltar_ao_quadro` devolve `no_quadro` verdadeiro e `tirado_do_quadro_em` nulo; chamar de novo no que já está no Quadro não recusa;
  5. `Volta`: tirar, mover para a Publicação, mover de volta para Concluídos → `no_quadro` verdadeiro; tirar de novo funciona;
  6. nenhum evento novo do processo depois de tirar e depois de desfazer (contar `eventos` antes e depois, por `entidade_ref`);
  7. perfis, para as duas funções: consulta (a3) 42501; inativo (a4) `registro_inexistente`; visitante (anon) 42501; processo inexistente (a1) `registro_inexistente`;
  8. a gravação direta de `tirado_do_quadro_em` continua recusada (`tirado_do_quadro_so_pela_funcao`), mesmo depois de tirar;
  9. estrutura: as duas funções não são `security definer`; anon e public não têm `execute`.
  Rodar só o 69: **falha** (funções inexistentes). Anotar o resultado no plano.
- [ ] **1.3** `npx supabase migration new tirar_e_voltar_ao_quadro` e escrever: `public.tirar_do_quadro(p_processo uuid)` e `public.voltar_ao_quadro(p_processo uuid)`, `language plpgsql set search_path = ''`, sem `security definer`. Cada uma lê `situacao` e `no_quadro` da view (`registro_inexistente` se não achar), confere `private.pode_alterar_cadastros()` (42501 com a frase de `registrar_publicacao`), confere a regra (`tirar_do_quadro_so_concluido`, `ja_fora_do_quadro`, `voltar_ao_quadro_so_concluido`), liga `ep.liberando_tirada`, grava `clock_timestamp()` ou nulo em `tirado_do_quadro_em` com `update … where id = p_processo`, desliga a liberação e, se `row_count = 0`, levanta 42501. `revoke execute … from public, anon; grant execute … to authenticated`. Comentário no topo com a data, o ticket e "Não destrutiva".
- [ ] **1.4** `npx supabase db reset --local` e rodar o 69: **todas as linhas `ok`**. Se alguma falhar, corrigir a migração (ainda não foi para o remoto).
- [ ] **1.5** Suíte inteira de banco no Docker: `npx supabase test db` (com o administrador fictício extra): 0 `not ok`.
- [ ] **1.6** Tipos: acrescentar em `src/types/database.ts`, em ordem alfabética, `tirar_do_quadro: { Args: { p_processo: string }; Returns: undefined }` e `voltar_ao_quadro: { … }` (a CLI local devolve o arquivo sem formatação; o `db:types` do remoto, na Tarefa 9, confirma).

### Tarefa 2: Acesso — métodos do módulo, versão real e versão falsa

**Files:** `src/processos/tipos.ts`, `tirarDoQuadroSupabase.ts` (+ teste), `processosSupabase.ts`, `recusasDoBanco.ts`, `frasesDoQuadro.ts` (novo), `ProcessosFalso.ts` (+ teste).

- [ ] **2.1** (teste primeiro) `tirarDoQuadroSupabase.test.ts` (padrão de `publicacaoSupabase.test.ts`): `tirarDoQuadro('p1')` chama `rpc('tirar_do_quadro', { p_processo: 'p1' })`; `voltarAoQuadro` chama `voltar_ao_quadro`; as recusas `tirar_do_quadro_so_concluido`, `ja_fora_do_quadro` e `voltar_ao_quadro_so_concluido` viram `TravaDoBanco` com as frases ("Só se tira do Quadro o processo concluído.", "Este processo já está fora do Quadro.", "Só se volta ao Quadro o processo concluído."); 42501 vira a frase de perfil. Em `ProcessosFalso.tirarDoQuadro.test.ts`: tirar marca `tiradoDoQuadroEm` e `noQuadro: false` no concluído; recusa o que não é concluído (mesmas frases) e o que já está fora; voltar zera e põe `noQuadro: true`; processo inexistente é `CadastroInexistente`; mover para Concluídos de novo devolve `noQuadro: true`; a falha programada chega como erro. Rodar: falha.
- [ ] **2.2** Implementar: `ModuloDeProcessos` ganha `tirarDoQuadro(id)` e `voltarAoQuadro(id)` (comentário: sem evento, a RLS decide); `tirarDoQuadroSupabase.ts` (`criarTirarDoQuadroSupabase(cliente, recusas)`), ligado em `processosSupabase.ts`; as três frases em `frasesDoQuadro.ts` e os três códigos na lista e no mapa de `recusasDoBanco.ts`; `ProcessosFalso` com os dois métodos e `noQuadro: true` em `movido` quando o destino é Concluídos. Rodar: passa.

### Tarefa 3: Lógica das colunas

**Files:** `src/processos/colunasDoQuadro.ts`, `colunasDoQuadro.test.ts`.

- [ ] **3.1** (teste primeiro) `colunasPorResponsavel`: o concluído não aparece em nenhuma coluna, nem cria coluna para a pessoa que só tem concluídos (o teste atual "o concluído fora do Quadro e o cancelado ficam de fora" vira "o concluído e o cancelado ficam de fora"); `colunasDoQuadro` segue mostrando só os `noQuadro` em Concluídos; nova função `quantosForaDoQuadro(processos)` conta os concluídos com `noQuadro === false` (0 se nenhum; ausente conta como no Quadro). Rodar: falha.
- [ ] **3.2** Implementar: `colunasPorResponsavel` filtra `situacao !== 'concluido'` (comentário: Quadro por responsável é trabalho em curso, S6); `quantosForaDoQuadro` exportada. Rodar: passa.

### Tarefa 4: Hook, contexto e aviso

**Files:** `src/hooks/useTirarDoQuadro.tsx` (+ teste), `src/components/processos/AvisoDoQuadro.tsx`.

- [ ] **4.1** (teste primeiro) `useTirarDoQuadro.test.tsx` com `renderHook` e relógio falso: `tirar({ id, nome }, depois)` chama `processos.tirarDoQuadro`, depois o `depois` e o `aoMudar`, e guarda o aviso `{ id, nome }`; o aviso some sozinho após `SEGUNDOS_DO_AVISO` (8) e ao `fechar()`; `desfazer()` chama `voltarAoQuadro`, `aoMudar` e limpa o aviso; falha na gravação guarda a mensagem (`falha`) e não cria aviso; o item que sumiu (`CadastroInexistente`) chama `aoSumir`; um aviso novo substitui o anterior e reinicia o relógio. Rodar: falha.
- [ ] **4.2** Implementar o hook (função de até 40 linhas, em `src/hooks/`) usando `useGravacaoComFalha`; `ContextoDoQuadro` (valor: `{ tirar(processo, depois?) }`), `useTirarDoQuadroDaTela()` para ler o contexto (sem provedor, `tirar` é nulo: o verso e o cartão não mostram o botão). `AvisoDoQuadro`: `<div role="status">Tirado do Quadro · [Desfazer] [Fechar]</div>` e, com falha, `<p className="cadastros-falha" role="alert">`. Rodar: passa.

### Tarefa 5: Tela do Quadro — botão, pé e ligação

**Files:** `AreaDeProcessos`, `VisaoDosProcessos`, `QuadroDeProcessos`, `ColunaDoQuadro`, `PeDaColunaDosConcluidos.tsx`, `AgoraDoConcluido`, `Quadro.css`; `src/App.tirarDoQuadro.test.tsx` (novo); `App.concluidos.test.tsx`.

- [ ] **5.1** (teste primeiro, pela tela inteira com `ProcessosFalso`) `App.tirarDoQuadro.test.tsx`:
  1. a coluna Concluídos lista só os `noQuadro`; o botão "Tirar do Quadro" aparece para Integrante e Administrador e não para Consulta;
  2. clicar tira o cartão da coluna (ele sai), o aviso (`role="status"`) diz "Tirado do Quadro" com [Desfazer]; Desfazer devolve o cartão e o aviso some; fechar esconde o aviso;
  3. o botão é um `button` focável pelo teclado (`Tab` o alcança; Enter ou Espaço aciona) e fica fora do link do cartão;
  4. falha ao tirar (`falhaDeGravacao`): o cartão fica, com a mensagem em `role="alert"`; falha ao desfazer: o cartão continua fora, com a mensagem;
  5. o pé: "2 concluídos fora do Quadro · Ver na Lista" (singular com 1; some com 0), N respeita os filtros do Quadro (filtro de setor muda N), o link aponta para `#/processos/lista?<filtros>&mostrar=concluidos` e abrir o link mostra a Lista em Concluídos com os mesmos filtros;
  6. o verso do concluído que está no Quadro traz "Tirar do Quadro" (só para quem altera); depois de clicar, o botão some do verso, o cartão sai do Quadro atrás e o aviso aparece; o verso do concluído fora do Quadro não traz o botão;
  7. mover o processo para trás e para Concluídos de novo traz o cartão de volta;
  8. Quadro por responsável: nenhum cartão de concluído, mesmo com responsável.
  Ajustar `App.concluidos.test.tsx` (o teste "Só os meus e o agrupamento por responsável incluem os concluídos…" passa a provar que o concluído **não** entra no por responsável; a Lista e o por setor seguem mostrando). Rodar: falha.
- [ ] **5.2** Implementar: `AreaDeProcessos` usa o hook (com `aoMudar={recarregar}`), provê o contexto, mostra `AvisoDoQuadro` acima da visão e passa `enderecoDosConcluidosNaLista` (montado com `montarEnderecoDosProcessos`, `situacao` e `busca` nulas, `mostrar: 'concluidos'`); `VisaoDosProcessos` e `QuadroDeProcessos` repassam; `QuadroDeProcessos` calcula `quantosForaDoQuadro(lista.processos)` só no Quadro por etapa; `ColunaDoQuadro`, na coluna Concluídos por etapa e para quem altera, embrulha cada cartão num `div` com o botão "Tirar do Quadro" abaixo, e põe o `PeDaColunaDosConcluidos` no fim da coluna; `AgoraDoConcluido` mostra "Tirar do Quadro" com `processo.noQuadro !== false` e o contexto disponível (`tirar(processo, aoMudar)`). `Quadro.css`: botão discreto abaixo do cartão, pé pequeno e legível (`--texto-2`), sem tirar espaço do nome nem da faixa do setor. Rodar `npx vitest run src/App.tirarDoQuadro.test.tsx src/App.concluidos.test.tsx`: passa.
- [ ] **5.3** `npx vitest run src` (toda a tela e a lógica) e ajustar o que o corte do Quadro por responsável quebrar (ex.: `App.processosDoSetor`, `App.cartaoDoQuadro`, `App.agruparPorResponsavel*`). Passa.

### Tarefa 6: Conferência e commit

- [ ] **6.1** `npm run typecheck`, `npx eslint .` e `npm test` completo, tudo verde (relógio local de Brasília); `npx supabase test db` (0 `not ok`).
- [ ] **6.2** Ver no navegador (vitrine local com módulos falsos, itens temporários restaurados depois): botão no cartão, aviso, pé e verso; Consulta sem botão. O que não for visto fica registrado como presumido.
- [ ] **6.3** Um commit `repositorio-de-processos 03: Tirar do Quadro` (banco, tipos e código juntos, sem `--no-verify`), `git push -u origin repositorio-de-processos`.

### Tarefa 7: Remoto de desenvolvimento

- [ ] **7.1** Disparar o workflow "Testes de banco" na branch (autorizado) e ler o resultado (esperado 56 de 56 arquivos; ele ensaia a migração nova).
- [ ] **7.2** Disparar o workflow "Migrar banco de desenvolvimento" na branch com a migração `<ts>_tirar_e_voltar_ao_quadro.sql` (autorizado) e ler o resultado; depois `npm run db:types` (alvo: `--project-id yclkzyoebpsxmgpbcbus`, conferido no `AMBIENTES.md`); se o arquivo diferir do que foi escrito à mão, usar o do remoto e comitar. Registrar a migração em `supabase/AMBIENTES.md`.

### Tarefa 8: Fechar o ticket

- [ ] **8.1** Seguir o `/executar-complexo`: juntar à `main` (`git switch main`, merge, `git branch -d repositorio-de-processos`), `Concluído em AAAA-MM-DD (commit <hash>)` no ticket 03 (critérios marcados), `.scratch/proximo-passo.md` (próximo: ticket 04; pendência do usuário: publicar `arquivos-no-drive`), `.scratch/melhorias-protocolo.md` se algo novo, comitar e enviar a `main` (o "Testes de banco" da `main` roda: conferir e avisar se falhar).

## Auto-revisão contra o ticket

- Funções e perfis (critério 1) → T1.2 (1 a 4, 7, 9); sem evento (2) → T1.2 (6); coluna só `no_quadro`, 30 dias e volta (3) → T1.2 (5), T3, T5.1 (1, 7); botão no cartão e no verso, teclado (4) → T5.1 (1, 3, 6); aviso e Desfazer (5) → T4, T5.1 (2); pé e "Ver na Lista" (6) → T5.1 (5); por responsável (7) → T3, T5.1 (8); falha (8) → T4, T5.1 (4); testes (9) → T6.1.
- Fora do ticket: cabeçalhos com filtro e ordenação (ticket 04); árvore (ticket 05).
