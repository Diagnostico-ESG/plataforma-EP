# Ticket 05 — Origem, Contexto e Observações saem de vez: plano de execução

> **Para quem executa:** `superpowers:executing-plans`; marque as caixas (`- [ ]`) conforme cada tarefa termina.

**Objetivo:** a plataforma fica com um só texto livre por processo (as Anotações): a migração junta Contexto e Observações nelas e apaga `origem`, `contexto`, `observacoes` e o tipo `origem_do_processo`; a tela, os tipos, os módulos e a planilha interna acompanham.

**Referências (não repetidas aqui):** ticket `issues/05-origem-contexto-e-observacoes-saem.md` (9 critérios); `spec.md`, histórias 1, 8, 11 a 15, 41 e 47 a 49, decisões "Formulário do processo", "Tipos do processo", "'Sobre' do verso", "Planilha interna" e "Histórico", e itens 1 e 7 do "Modelo de dados".

**Regras de `.claude/regras/banco.md` que valem:** teste antes da migração; migração só por `npx supabase migration new`; view recriada com `security_invoker = true`; função nova em `private`, `search_path` vazio, sem execução para `anon`/`authenticated`; cada célula de "quem pode o quê" testada com Administrador, Integrante, Consulta, desativado e visitante; migração, testes e tipos no mesmo commit; `npm test` nunca depende do banco; remoto de desenvolvimento só pelo workflow "Migrar banco de desenvolvimento"; nada de produção.

**Fora deste ticket:** apagar a coluna "Observações" da planilha (backlog); `.scratch/especificacao.md`; o `CONTEXT.md`/glossário (se citarem Origem, proponho a redação ao fim e aplico após a confirmação do usuário).

## Decisões do plano

- **Junção testável.** O texto da junção sai de uma função pura `private.juntar_textos_antigos(p_contexto, p_observacoes, p_anotacoes)`, usada pelo `update` da migração e **mantida** depois (pequena, sem privilégio), porque o teste pgTAP roda com o banco já migrado e a coluna `contexto` não existe mais: sem a função, a regra da junção ficaria sem prova.
- **Recusa em vez de corte.** Se a junção passar de 8.000 caracteres, o `check` das Anotações faz a migração falhar (dado inventado do desenvolvimento): nunca truncar.
- **Gatilho das Anotações** já cobre o `update` (quem fica nulo, quando = hora da migração); nada a mudar nele.
- **Histórico legível.** `historicoDosCadastros.ts` continua com os nomes `origem`, `contexto`, `observacoes` e com os valores "Novo"/"Retomado" da Origem; o mapa de valores passa a viver nesse arquivo (`ROTULO_DA_ORIGEM_ANTIGA`), porque o resto da plataforma deixa de ter Origem.
- **Docker.** Se `npx supabase start` não subir (sem WSL, como nos tickets 03 e 04), a prova de pgTAP fica no workflow "Testes de banco" e os tipos saem do remoto depois que o workflow "Migrar banco de desenvolvimento" aplicar a migração (`npm run db:types`, vínculo conferido). Até lá, `src/types/database.ts` se edita à mão só para o `tsc` fechar, e o regerado substitui.
- Colunas dentro de testes antigos que só serviam de "campo editável qualquer" (`contexto`, `observacoes`) passam a usar `nome`.

---

### Tarefa 0: Branch

- [ ] **0.1** `git status` limpo para arquivos rastreados (os soltos em `.scratch/` já estavam fora do git); `git switch -c enxugar-cartao-e-cadastro-05` a partir da `main`. (A branch remota `enxugar-cartao-e-cadastro` já existe; usar nome novo evita conflito.)
- [ ] **0.2** Confirmar o vínculo: linha "vínculo atual" de `supabase/AMBIENTES.md` e `supabase/.temp/project-ref` (desenvolvimento).

### Tarefa 1: Banco (testes, migração, tipos)

**Arquivos:** criar `supabase/tests/72_origem_contexto_e_observacoes_saem.test.sql`; alterar `supabase/tests/17_processos.test.sql`, `44_pacote_das_planilhas.test.sql`, `50_anotacoes_do_processo.test.sql`, `53_etiqueta_e_responsavel.test.sql`; criar `supabase/migrations/<ts>_origem_contexto_e_observacoes_saem.sql` (via `npx supabase migration new origem_contexto_e_observacoes_saem`); `src/types/database.ts`.

- [ ] **1.1** Descobrir a última definição de cada objeto que cita as três colunas: `grep -n "function private.estado_do_processo\|function private.montar_pacote_das_planilhas\|function private.preparar_processo" supabase/migrations/*.sql` (esperado: `estado_do_processo` e `montar_pacote_das_planilhas` em `20261025194034_data_da_modelagem_piloto.sql`, a view em `20261029001211_fim_do_arquivado.sql`, `preparar_processo` só em `20261014130147_processos.sql`). Se `20261026205450_anexos.sql` ou outra redefinir algum, a cópia sai da mais nova.
- [ ] **1.2** Ajustar os testes antigos para o mundo sem as colunas (devem falhar contra o banco atual só onde o comportamento muda; o resto segue verde):
  - `17`: linhas ~91 e ~147 e ~230 trocam `contexto` por `nome` (`set nome = nome` onde só se quer "atualiza"; `set nome = 'Trocado'` na do visitante); o evento `criar` (~210) perde `origem`, `contexto`, `observacoes` do `jsonb_build_object`.
  - `44`: tira `observacoes` do `update` (~76), tira a asserção "as observações vão no pacote" (~148), troca por `ok(not (pg_temp.do_processo('T44 Normal') ? 'observacoes'), 'o pacote não leva mais observações')`, e tira `'observacoes'` da lista de chaves (~153). Se a contagem do `plan(N)` muda, ajustar.
  - `50` (~163-165): "editar o contexto" vira "editar o nome continua permitido" / "gera um evento", com `set nome = 'Nome novo'`.
  - `53` (~160): `set observacoes = 'Outra'` vira `set nome = 'Outra'`.
- [ ] **1.3** Criar o `72` (cabeçalho/rodapé do `71`: `_tap`, usuários a1 administrador, a2 integrante, a3 consulta, a4 administrador inativo, exceção final, `plan(N)` com N = número de asserções). Cobrir:
  1. **Junção** (função chamada direto, `is(...)`): só Contexto → `'Contexto: C'`; só Observações → `'Observações: O'`; os dois → `E'Contexto: C\n\nObservações: O'`; os dois com Anotações já existentes → `E'Contexto: C\n\nObservações: O\n\nTexto antigo'`; só Anotações (contexto e observações nulos ou `''`) → o texto inalterado; nenhum → `null`; contexto `''` ou só espaços não gera rótulo `Contexto:`.
  2. **View:** `array_agg(attname)` das colunas de `public.processos_com_andamento` (por `pg_attribute`, ordem de `attnum`) **igual** à lista atual de `20261029001211` sem `origem`, `contexto`, `observacoes` (escrever a lista inteira no teste); `reloptions` contém `security_invoker=true`.
  3. **Colunas e tipo:** `hasnt_column('public','processos','origem')`, idem `contexto` e `observacoes`; `hasnt_type('public','origem_do_processo')`.
  4. **Estado do histórico:** criar um processo como administrador e conferir que as chaves do `detalhes -> 'depois'` do evento `criar` não incluem as três.
  5. **Leitura das Anotações juntadas por perfil:** como superusuário, `update public.processos set anotacoes = private.juntar_textos_antigos('C', 'O', 'T') where id = …`; depois, `set local role authenticated` com `request.jwt.claims` de cada usuário: administrador, integrante e consulta leem `anotacoes` igual ao texto juntado; desativado lê 0 linhas; visitante (`set local role anon`) recebe `42501` (como o `71` faz hoje — copiar o padrão dele). Consulta tenta `update … set anotacoes = 'x'` e é recusada (`42501`).
- [ ] **1.4** Ver falhar (se o Docker subir): `npx supabase start` (descartar a saída: traz chaves) e `npx supabase test db`; contar `ok` e `not ok`. Sem Docker: registrar "não visto falhar" e seguir.
- [ ] **1.5** Escrever a migração, nesta ordem (copiar o corpo de cada objeto da migração indicada em 1.1, tirando só as três colunas):
  ```sql
  -- Origem, Contexto e Observações saem (enxugar-cartao-e-cadastro, ticket 05). Destrutiva só para dados inventados do desenvolvimento.

  -- 1. A junção: texto puro, usado pelo update abaixo e mantido para o teste.
  create function private.juntar_textos_antigos(p_contexto text, p_observacoes text, p_anotacoes text) returns text
  language sql immutable set search_path = ''
  as $$
    select nullif(concat_ws(E'\n\n',
      'Contexto: ' || nullif(btrim(p_contexto), ''),
      'Observações: ' || nullif(btrim(p_observacoes), ''),
      case when btrim(coalesce(p_anotacoes, '')) = '' then null else p_anotacoes end), '') $$;
  revoke execute on function private.juntar_textos_antigos(text, text, text) from public, anon, authenticated;

  update public.processos
  set anotacoes = private.juntar_textos_antigos(contexto, observacoes, anotacoes)
  where nullif(btrim(contexto), '') is not null or nullif(btrim(observacoes), '') is not null;
  ```
  Antes de gravar, ler os gatilhos `before update` sem lista de colunas (`preparar_processo`, `registrar_ultima_alteracao_das_anotacoes`, `conferir_situacao_do_processo`, `conferir_tipo_do_processo`) e `registrar_evento_do_processo` e confirmar que nenhum recusa o `update` em processo suspenso, cancelado ou concluído; se algum recusar, parar e me mostrar as opções (não desligar gatilho às escondidas).
  Em seguida, na mesma migração:
  2. `create or replace function private.preparar_processo()` sem as duas linhas de `contexto`/`observacoes` (resto idêntico; `create or replace` mantém o gatilho).
  3. `create or replace function private.estado_do_processo(...)` sem `'origem'`, `'contexto'`, `'observacoes'`.
  4. `drop view public.processos_com_andamento;` e `create view … with (security_invoker = true)` igual à de `20261029001211` sem `p.origem,` e sem `p.contexto, p.observacoes,`; repetir `revoke all … from anon, authenticated; grant select … to authenticated;`.
  5. `create or replace function private.montar_pacote_das_planilhas()` sem `'observacoes', p.observacoes,`; repetir o `revoke execute` da migração de origem.
  6. `alter table public.processos drop column origem, drop column contexto, drop column observacoes;` (leva junto os `check` e os privilégios de coluna) e `drop type public.origem_do_processo;`.
- [ ] **1.6** Rodar de novo (Docker, se subir): `npm run db:reset` e `npx supabase test db`: todas as linhas `ok`, nenhuma `not ok`. Sem Docker: seguir; a prova é o workflow na Tarefa 6.
- [ ] **1.7** Tipos: com Docker, `npx supabase gen types --local` e conferir `src/types/database.ts`. Sem Docker, editar à mão: tirar `origem`, `contexto`, `observacoes` de `processos.Row/Insert/Update` e da view `processos_com_andamento.Row`, e o enum `origem_do_processo` de `Enums`/`Constants` (os de `setores.observacoes` e `atualizacoes.origem` **ficam**).
- [ ] **1.8** Commit: migração, testes e tipos juntos (`enxugar-cartao-e-cadastro ticket 05: migração e testes de banco`).

### Tarefa 2: Cadastro e Editar processo sem os três campos

**Arquivos:** `src/processos/tipos.ts`, `src/processos/rotulos.ts`, `src/processos/validacaoDoProcesso.ts`, `src/components/processos/CamposDoProcesso.tsx`, `FormularioPronto.tsx`, `FormularioCarregando.tsx`, `src/processos/gravarProcessoSupabase.ts`, `src/processos/ProcessosFalso.ts`; testes `src/processos/validacaoDoProcesso.test.ts`, `gravarProcessoSupabase.test.ts`, `src/App.cadastrarProcesso.test.tsx`, `src/testes/cadastroDeProcesso.tsx`.

- [ ] **2.1** Testes que falham primeiro, em `App.cadastrarProcesso.test.tsx`: o cadastro e o Editar processo não têm os rótulos "Origem", "Contexto" nem "Observações" (`queryByLabelText` nulo); o que o módulo falso recebe ao cadastrar e ao editar não traz `origem`, `contexto` nem `observacoes`. Em `gravarProcessoSupabase.test.ts`: o `insert` e o `update` não levam as três chaves. Em `validacaoDoProcesso.test.ts`: `dadosDoProcesso` não devolve as três. Rodar `npx vitest run` nesses arquivos e ver falhar.
- [ ] **2.2** Implementar: tirar `origem`, `contexto`, `observacoes` de `DadosDoProcesso`, `ProcessoLido` e `ProcessoDaLista` (`tipos.ts` ~linhas 70-85, 140-142, 167-169), o tipo `OrigemDoProcesso` e `ROTULO_DA_ORIGEM` de `rotulos.ts` (ver Tarefa 5 para o histórico); `CamposDoProcesso` e `dadosDoProcesso` (`validacaoDoProcesso.ts`) sem os três; em `CamposDoProcesso.tsx` sair `ORIGENS`, os dois `textarea` e o `select` da Origem (ficam Nome, Setor, Macroprocesso, Tipo, processo pai e, só no cadastro, Anotações); `FormularioPronto.tsx` (`VAZIO` e `valoresDaEdicao`) sem as três; comentário de `FormularioCarregando.tsx` e o esqueleto, se desenhar os campos, sem eles; `gravarProcessoSupabase.ts` (~41-42) sem as três; `ProcessosFalso.ts` sem os defaults. Ajustar `Contexto.css` (~86, comentário e regra de "contexto e observações ocupam a linha toda") se sobrar regra morta.
- [ ] **2.3** `npx tsc --noEmit` mostra o que mais cita as três; corrigir os módulos de produção (ex.: `lerProcessoSupabase.ts` ~88-89 e `processoDaLinha.ts`) e os ajudantes de teste (`src/testes/cadastroDeProcesso.tsx`, `processoDaLista.ts`). Rodar os testes dos passos 2.1: verdes.
- [ ] **2.4** Commit.

### Tarefa 3: "Sobre" do verso só com Setor, Macroprocesso e Tipo

**Arquivos:** `src/components/processos/SobreDoProcesso.tsx`, `TextoQueSeAbre.tsx` (apagar se ficar sem uso), `Contexto.css`; testes `src/App.versoDoCartao.test.tsx`, `src/App.contextoDoVerso.test.tsx`, `src/App.anotacoesDoProcesso.test.tsx`.

- [ ] **3.1** Teste que falha: o verso mostra Setor, Macroprocesso e Tipo no "Sobre" e **não** mostra "Origem", "Contexto" nem "Observações" como rótulo do "Sobre", mesmo com o processo de teste trazendo texto nas Anotações. Reescrever os testes que esperavam Origem/Contexto/Observações para o comportamento novo (não apagar sem substituto).
- [ ] **3.2** Implementar `SobreDoProcesso.tsx` com as três linhas; apagar `DadoLongo` e o componente `TextoQueSeAbre` se `grep` mostrar que ninguém mais os usa (YAGNI), junto com o CSS só deles.
- [ ] **3.3** Conferir que a Consulta lê as Anotações e não altera (teste já existente em `App.anotacoesDoProcesso.test.tsx`: se não cobrir o texto longo "juntado" — vários parágrafos com "Contexto: …" e "Observações: …" —, acrescentar um caso de leitura para Consulta).
- [ ] **3.4** Verdes e commit.

### Tarefa 4: Planilha interna (Edge Function)

**Arquivos:** `supabase/functions/_shared/planilhasInterna.ts`, `planilhasPacote.ts`, `planilhasCenario.ts`, `planilhasExemplos.ts`; testes `planilhasInterna.test.ts`, `planilhasPacote.test.ts`.

- [ ] **4.1** Testes que falham: em `planilhasInterna.test.ts`, "Observações" tem o cabeçalho e a coluna é sempre `''`, mesmo com texto no pacote antigo; "Data da modelagem piloto" segue com o valor e a regra da fase IV de hoje. Em `planilhasPacote.test.ts`, o pacote sem `observacoes` é aceito e as asserções sobre `observacoes` (linhas ~160-168) saem.
- [ ] **4.2** Implementar: `ProcessoDoPacote` e `REGRAS_DO_PROCESSO` sem `observacoes`; `linhaDoProcesso` termina com `''` (comentar o porquê: a coluna fica para os painéis do Data Studio); `planilhasCenario.ts` e `planilhasExemplos.ts` sem o campo. `npx vitest run supabase/functions` verde.
- [ ] **4.3** Commit.

### Tarefa 5: Histórico antigo continua legível

**Arquivos:** `src/cadastros/historicoDosCadastros.ts`, `src/processos/rotulos.ts`; teste `src/cadastros/historicoDosCadastros.test.ts` e `src/App.historicoDosCadastros.test.tsx`.

- [ ] **5.1** Teste (deve passar já antes da mudança dos rótulos e continuar passando depois): um evento de processo com `origem: 'retomado'`, `contexto` e `observacoes` no estado aparece com "Origem: Retomado", "Contexto" e "Observações" legíveis. Se não existir, escrevê-lo antes de tocar no código e vê-lo verde.
- [ ] **5.2** Como `ROTULO_DA_ORIGEM` saiu de `rotulos.ts` na Tarefa 2, declarar em `historicoDosCadastros.ts` `const ROTULO_DA_ORIGEM_ANTIGA = { novo: 'Novo', retomado: 'Retomado' }` com o comentário "eventos antigos guardam a Origem; a plataforma já não a tem", usar no mapa de valores (~237) e manter os nomes das chaves (~77). Teste de 5.1 verde.
- [ ] **5.3** Commit.

### Tarefa 6: Fechamento

- [ ] **6.1** `grep -rnE "origem_do_processo|OrigemDoProcesso|ROTULO_DA_ORIGEM|\.contexto\b|\.observacoes\b" src supabase` só devolve o legado do histórico, `setores.observacoes` e `atualizacoes.origem`.
- [ ] **6.2** `npm test`, `npm run lint`, `npx tsc --noEmit` (ou o script de typecheck do projeto) verdes; cobertura ≥ 70 % conferida pelo `npm test` se o script a incluir.
- [ ] **6.3** Push da branch (sem `--force`) e disparar o workflow "Testes de banco" nela; ler o resultado: contar `ok` e `not ok` do `72` e dos tocados (`17`, `44`, `50`, `53`). Se falhar, corrigir (regra de parada: 3 tentativas).
- [ ] **6.4** Integrar (opção de merge do `finishing-a-development-branch`), `git switch main`, `git branch -d` da branch. Push da `main`; depois da `main` no GitHub, disparar o "Migrar banco de desenvolvimento" com o arquivo da migração, ler o resultado, rodar `npm run db:types` (vínculo conferido) e, se o arquivo mudar, comitar.
- [ ] **6.5** Itens não testados: ler `.claude/regras/nao-testados.md` (blocos do `/executar-complexo` e "Qualquer momento") e registrar em `.scratch/melhorias-protocolo.md` o que aconteceu nesta execução.
- [ ] **6.6** Ticket: acrescentar `Concluído em AAAA-MM-DD (commit <hash>)` ao fim do arquivo do ticket; gravar `.scratch/proximo-passo.md` (próximo: `/polir` — ticket 05 era o último); comitar e enviar a `main`.
- [ ] **6.7** Avisar ao usuário, no relatório final: (a) publicar de novo `planilhas-dos-dashboards` no desenvolvimento (`npx supabase functions deploy planilhas-dos-dashboards --use-api`, vínculo conferido) — sem isso a função antiga quebra, pois o pacote deixou de trazer `observacoes`; (b) propor a redação do `CONTEXT.md` se ele citar Origem/Contexto/Observações.
