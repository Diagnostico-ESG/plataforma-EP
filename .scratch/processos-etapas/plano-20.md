# Plano do ticket 20: A barra de progresso e os selos do cartão do Quadro

> **Para quem executa:** use `superpowers:executing-plans`, tarefa por tarefa, marcando as caixas (`- [x]`). Branch comum `processos-etapas-20`, sem worktree (o isolamento já está feito).

**Objetivo:** a view `processos_com_andamento` traz os campos novos; o cartão do Quadro mostra a barra de progresso e os selos (dias parado, Relatório pendente, Sem responsável, Reunião, versão, subprocessos) calculados na tela a partir deles.

**Arquitetura:** migração não destrutiva recria a view com os campos no fim. A tradução (`processoDaLinha`) põe os campos num objeto opcional `cartao` de `ProcessoDaLista` (opcional para os testes e as telas que montam processo à mão não mudarem; as funções puras tratam a falta como "nada a mostrar"). Duas funções puras (`barraDoCartao`, `selosDoCartao`) decidem o que aparece; dois componentes pequenos (`BarraDeProgresso`, `SelosDoCartao`) desenham.

**Requisitos:** `.scratch/processos-etapas/issues/20-barra-e-selos-do-cartao.md` (critérios citados como "critério N do ticket 20", de cima para baixo, 1 a 10) e a spec (histórias 141 a 154; "Interface", Quadro, itens Barra de progresso e Selos; "Modelo de dados", campos novos da view e "Migração da parte 4"; "Decisões de teste", cartão do Quadro, e "Parte 4" do banco; "Observações", parte 4).

## Regras de banco que valem aqui (`.claude/regras/banco.md`)

- Estrutura só por migração criada com `npx supabase migration new`; teste pgTAP escrito **antes** da migração.
- View com `security_invoker = true` e o mesmo `revoke`/`grant` da anterior; nada guardado que se calcula (tudo vem de `andamentos`, `versoes`, `arquivos_da_versao`, `processos`).
- Alvo conferido antes de qualquer comando que toque o banco: "vínculo atual" de `supabase/AMBIENTES.md` = `yclkzyoebpsxmgpbcbus` (desenvolvimento). Os testes de banco e a migração rodam pelo GitHub Actions (CLAUDE.md, "Ajustes deste Projeto"); nada vai a produção.
- Sem `security definer`, sem função nova, sem tabela nova: a view roda com a permissão de quem lê.

## Restrições gerais

- Sem dependência nova. Limites do ESLint: função até 20 linhas, arquivo até 300, complexidade até 10.
- Toda tarefa de código termina com `npm test`, `npm run lint` e `npm run typecheck` verdes. Testes de tela instáveis sob carga (backlog): repita o arquivo isolado antes de concluir que falhou de verdade.
- Textos da tela exatamente como na spec, com acentos. Dados de teste inventados.
- Arquivos com CRLF: trocas pela ferramenta de edição. Arquivos novos pela ferramenta de arquivo, nunca por heredoc.
- Para o shell não travar com texto longo, scripts de troca vão num `.mjs` gravado pela ferramenta de arquivo.

## Decisões deste plano (vão para o `desvios.md` na Tarefa 5)

1. **O objeto `cartao` é opcional em `ProcessoDaLista`**, e `dataDaReuniao` sobe como opcional para `ProcessoDaLista` (hoje só o `ProcessoLido` a tem, e a view já a devolve). Motivo: ~10 arquivos de teste montam `ProcessoDaLista` à mão.
2. **"Relatório pendente" também aparece no cartão suspenso.** A spec lista os selos que o suspenso mantém como "os que não são de tempo (versão, reunião, subprocessos, Sem responsável)" e não cita o Relatório pendente; como ele também não é de tempo, ficou junto. Só o selo de dias some no suspenso.
3. **A posição "Revisão interna ou posterior" é medida pela ordem do `caminho`** (que já vem na ordem do catálogo): índice da etapa atual ≥ índice de `revisao_interna`. Sem `revisao_interna` no caminho, o selo não aparece.
4. **O selo "Sem responsável" aparece sempre neste ticket**; o ticket 22 o esconde quando o Quadro estiver agrupado por responsável (spec, "Observações", parte 4).
5. **A barra usa só `codigo` e `status` do caminho**; o `etapa_id` do JSON da view fica de fora da tradução (nada na tela o usa).

## Mapa de arquivos

| Arquivo | O que faz |
|-|-|
| `supabase/tests/37_cartao_do_quadro.test.sql` (criar) | prova cada campo novo da view, Consulta e visitante |
| `supabase/migrations/<data>_cartao_do_quadro.sql` (criar) | recria a view com os campos no fim |
| `supabase/AMBIENTES.md` | registro da migração |
| `src/types/database.ts` | regenerado pelo `npm run db:types` |
| `src/processos/tipos.ts` | `DadosDoCartao`, `cartao?` e `dataDaReuniao?` em `ProcessoDaLista` |
| `src/processos/processoDaLinha.ts` + `.test.ts` (criar o teste) | traduz os campos novos, inclusive vazios |
| `src/processos/barraDoCartao.ts` + `.test.ts` (criar) | pedaços da barra e nome acessível |
| `src/processos/selosDoCartao.ts` + `.test.ts` (criar) | quais selos e em que ordem |
| `src/components/processos/BarraDeProgresso.tsx`, `SelosDoCartao.tsx` (criar) | desenho |
| `src/components/processos/CartaoDoProcesso.tsx`, `Quadro.css` | usa os dois |
| `src/App.cartaoDoQuadro.test.tsx` (criar) | critérios 5 a 9 pelo aplicativo inteiro, Integrante e Consulta |

---

### Tarefa 1: Teste de banco da view (falha primeiro)

**Arquivos:** `supabase/tests/37_cartao_do_quadro.test.sql`.

**Modelo:** `36_trava_do_autor.test.sql` (cabeçalho, usuários inventados a1 administrador, a2 integrante, a3 consulta, a4 inativo, `_tap`, `pg_temp.enviar`, `pg_temp.par`, `finish()` e o `raise exception` do fim). Plano: `plan(N)` com N = número de asserções abaixo.

- [x] **Passo 1: escrever o teste.** Cenário (setor `T20`, macroprocesso `Macro Cartao`; processos criados como administrador, depois lidos pela view como integrante, como consulta e como visitante):
  - `Parado`: iniciar a Modelagem piloto e fixar `iniciada_em` em uma data conhecida (`update public.andamentos set iniciada_em = date '2026-09-01' ...`). Asserções: `etapa_atual_status = 'em_andamento'` e `etapa_atual_iniciada_em = '2026-09-01'`.
  - `Pendente`: sem iniciar nada. Asserções: `etapa_atual_status = 'pendente'` e `etapa_atual_iniciada_em is null`.
  - `Caminho`: o `caminho` do `Parado` tem 6 itens (o catálogo atual), o primeiro com `codigo = 'modelagem_piloto'` (confira o código real em `supabase/migrations/20261018141346_sem_etapas_do_setor.sql` antes de escrever) e `status = 'em_andamento'`, na ordem do catálogo (`jsonb_path_query_array(caminho, '$[*].codigo')` igual à lista de `select codigo from etapas order by ordem`); cada item tem `etapa_id`, `codigo` e `status`.
  - `Versoes`: `V1` não histórica só com `.bpmn` e `.png` (via `pg_temp.enviar`) → `ultima_versao_numero = 1`, `ultima_versao_historica = false`, `ultima_versao_tem_relatorio = false`; depois acrescentar o relatório à V1 (use a função de relatório depois que o teste `29_relatorio_depois.test.sql` usa — leia-o e copie a chamada) → `ultima_versao_tem_relatorio = true`; um processo com `V2` mais nova sem relatório → `ultima_versao_numero = 2` e `tem_relatorio = false` (a V1 com relatório não conta).
  - `Historica`: processo só com versão histórica (use a função de `28_versoes_historicas.test.sql`) → `ultima_versao_historica = true`, número igual ao digitado (ex.: 5).
  - `SemVersao`: `ultima_versao_numero is null`, `ultima_versao_historica is null`, `ultima_versao_tem_relatorio is null`.
  - `Pai`: dois subprocessos ativos e um cancelado (`cancelar_processo`) → `subprocessos_quantidade = 2`; um processo sem subprocessos → `0` (não `null`).
  - `Inativo`: etapa atual com responsável a4; depois `update public.usuarios set ativo = false` em a4 → `responsavel_ativo = false`; com responsável a2 → `true`; sem responsável → `null`.
  - Consulta (a3) lê a mesma linha do `Parado` e a mesma `caminho`/`ultima_versao_numero` que o integrante; visitante (`set local role anon`) recusa com `42501` (`throws_ok` em `select ... from public.processos_com_andamento`); usuário inativo (a4, depois de desativado) lê 0 linhas.
  - A view continua `security_invoker`: `select reloptions from pg_class where relname = 'processos_com_andamento'` contém `security_invoker=true`.
- [x] **Passo 2:** commit só do teste (`Ticket 20 de processos-etapas: teste de banco da view do cartão`), `git push -u origin processos-etapas-20` e disparar o workflow "Testes de banco" na branch (sem `gh` nesta máquina: pelo navegador do app, em Actions → Testes de banco → Run workflow → branch `processos-etapas-20`; o usuário já autorizou isto no CLAUDE.md). **Esperado: o arquivo 37 falha** (colunas inexistentes) e os outros 36 passam. Guarde o número da rodada para o registro.

### Tarefa 2: Migração, aplicação e tipos

**Arquivos:** migração nova, `supabase/AMBIENTES.md`, `src/types/database.ts`.

**Produz:** colunas novas no fim da view: `etapa_atual_status`, `etapa_atual_iniciada_em`, `responsavel_ativo`, `caminho`, `ultima_versao_numero`, `ultima_versao_historica`, `ultima_versao_tem_relatorio`, `subprocessos_quantidade` (tipos da tabela "Modelo de dados" da spec).

- [x] **Passo 1:** `npx supabase migration new cartao_do_quadro`.
- [x] **Passo 2: escrever a migração.** `create or replace view public.processos_com_andamento with (security_invoker = true) as` com **o mesmo corpo** da view de `20261018141346_sem_etapas_do_setor.sql` (linhas 162-184: copie, não reescreva) e os campos acrescentados **depois de `p.data_da_reuniao`**, na ordem acima. Mudanças no corpo:
  - no `lateral`, acrescente `a.status as status_da_atual`, `a.iniciada_em`, e no `select` externo `atual.status_da_atual as etapa_atual_status, atual.iniciada_em as etapa_atual_iniciada_em, u.ativo as responsavel_ativo`;
  - `caminho`: `coalesce((select jsonb_agg(jsonb_build_object('etapa_id', e.id, 'codigo', e.codigo, 'status', a.status) order by e.ordem) from public.andamentos a join public.etapas e on e.id = a.etapa_id where a.processo_id = p.id), '[]'::jsonb) as caminho`;
  - última versão: `left join lateral (select v.numero, v.historica, exists (select 1 from public.arquivos_da_versao f where f.versao_id = v.id and f.papel = 'relatorio') as tem_relatorio from public.versoes v where v.processo_id = p.id order by v.numero desc limit 1) ultima on true`, com `ultima.numero as ultima_versao_numero, ultima.historica as ultima_versao_historica, ultima.tem_relatorio as ultima_versao_tem_relatorio`;
  - `(select count(*)::int from public.processos f where f.processo_pai_id = p.id and f.situacao <> 'cancelado') as subprocessos_quantidade`.
  Como a coluna `status` do `andamentos` é do tipo `status_da_etapa`, a view já sai com esse tipo. Termine com o mesmo `revoke all ... from anon, authenticated; grant select ... to authenticated;` (um `create or replace` mantém os privilégios, mas repita para a migração se bastar sozinha). Se o Postgres recusar o `create or replace` por mudança de tipo de coluna existente, não force: pare e me avise (a alternativa, `drop` e `create`, apaga a dependência de outras views/chaves e precisa de decisão).
- [x] **Passo 3:** commit e `git push`. Disparar o workflow "Migrar banco de desenvolvimento" na branch `processos-etapas-20` com o nome do arquivo da migração (mesma forma: pelo navegador do app). Conferir no log que o alvo foi `yclkzyoebpsxmgpbcbus` e que não houve o aviso de "já aplicada".
- [x] **Passo 4:** disparar de novo "Testes de banco" na branch. **Esperado: os 37 arquivos verdes** (o 37 e o `10_privilegios_padrao` incluídos). Se o 37 falhar por erro do próprio teste, corrija o teste (não a migração) e repita; se falhar por causa da view, nova migração (a anterior já está no banco).
- [x] **Passo 5:** `npm run db:types` (alvo conferido: vínculo = ref de desenvolvimento). Confira que só `processos_com_andamento.Row` ganhou os 8 campos e que o `git diff` de `database.ts` não traz mais nada.
- [x] **Passo 6:** em `supabase/AMBIENTES.md`, acrescentar ao fim da lista de migrações aplicadas: `- <versão>_cartao_do_quadro (2026-10-19; processos-etapas, ticket 20; teste 37 falhou antes (colunas inexistentes) e passou depois, com os 37 arquivos verdes; aplicada pelo workflow "Migrar banco de desenvolvimento" na branch; tipos regenerados com db:types: a view ganhou 8 campos)` com os números reais das rodadas.
- [x] **Passo 7: commit** `Ticket 20 de processos-etapas: migração da view do cartão, tipos e registro` (migração, AMBIENTES e tipos no mesmo commit; o pré-commit roda `npm test`).

### Tarefa 3: Tipos e tradução da view

**Arquivos:** `src/processos/tipos.ts`, `processoDaLinha.ts`, `processoDaLinha.test.ts` (criar).

**Produz:**

```ts
export type PedacoDoCaminho = { codigo: string; status: StatusDaEtapa }

/** O que o cartão do Quadro mostra além do resto do processo (parte 4); a view o traz pronto. */
export type DadosDoCartao = {
  etapaAtualStatus: 'pendente' | 'em_andamento' | null
  /** AAAA-MM-DD; null com a etapa atual pendente ou sem etapa atual. */
  etapaAtualIniciadaEm: string | null
  /** null sem responsável. */
  responsavelAtivo: boolean | null
  /** Na ordem do catálogo; vazio sem andamentos. */
  caminho: PedacoDoCaminho[]
  /** A versão de maior número, histórica ou não; null sem versão. */
  ultimaVersao: { numero: number; historica: boolean; temRelatorio: boolean } | null
  subprocessos: number
}
```

em `ProcessoDaLista`: `cartao?: DadosDoCartao` e `dataDaReuniao?: string | null`.

- [x] **Passo 1: teste que falha** (critério 3 do ticket 20) em `processoDaLinha.test.ts`, com uma linha completa de `LinhaDoProcesso` inventada: (a) etapa em andamento com início, responsável ativo, caminho de 3 itens (o JSON com `etapa_id` vira `{codigo, status}`), versão 3 histórica sem relatório, 2 subprocessos e `data_da_reuniao` → `cartao` e `dataDaReuniao` esperados; (b) linha "vazia" (sem etapa atual, sem responsável, `caminho` `[]`, versão `null`, `subprocessos_quantidade` 0) → `etapaAtualStatus` `null`, `ultimaVersao` `null`, `caminho` `[]`, `subprocessos` 0; (c) `caminho` que não é lista (valor inesperado do banco) → `[]`, sem quebrar.
- [x] **Passo 2:** `npx vitest run src/processos/processoDaLinha.test.ts` falha.
- [x] **Passo 3: implementar** `cartaoDaLinha(linha)` em `processoDaLinha.ts` (função de até 20 linhas; `caminho` lido com um guarda de tipo pequeno `ehCaminho(valor: unknown): valor is PedacoDoCaminho[]` ou uma função `caminhoDaLinha` — a tradução de `Json` do `database.ts` é o único ponto onde a coerção é permitida, com comentário do porquê) e chamá-la em `processoDaLinha` (`cartao: cartaoDaLinha(linha)`, `dataDaReuniao: linha.data_da_reuniao`).
- [x] **Passo 4:** os testes de `processoDaLinha`, `listaDeProcessosSupabase` e `lerProcessoSupabase` passam (os dois últimos podem precisar de um campo a mais nas linhas simuladas; ajuste só o mínimo); `npm run lint` e `npm run typecheck`.
- [x] **Passo 5: commit** `Ticket 20 de processos-etapas: a tradução da view traz os campos do cartão`.

### Tarefa 4: Funções puras da barra e dos selos

**Arquivos:** `src/processos/barraDoCartao.ts`, `selosDoCartao.ts` e os testes.

**Consome:** `PedacoDoCaminho`, `DadosDoCartao`, `ProcessoDaLista` (Tarefa 3), `diasNaEtapa` e `passouDoLimite` (`diasNaEtapa.ts`), `rotuloDaVersao(numero, historica)` (`src/versoes/rotulos.ts`; confirme a assinatura antes de usar), `formatarData` (`caminhoDeEtapas.ts`).

**Produz:**

```ts
export type EstadoDoPedaco = 'resolvida' | 'atual' | 'seguinte'
export type PedacoDaBarra = { codigo: string; estado: EstadoDoPedaco }
/** null sem cartão, sem caminho ou sem a etapa atual no caminho: nada a desenhar. */
export function barraDoCartao(processo: ProcessoDaLista): { pedacos: PedacoDaBarra[]; nome: string } | null

export type TomDoSelo = 'alerta' | 'neutro'
export type TipoDeSelo = 'dias' | 'relatorio' | 'sem_responsavel' | 'reuniao' | 'versao' | 'subprocessos'
export type Selo = { tipo: TipoDeSelo; texto: string; tom: TomDoSelo }
/** Na ordem da spec: dias, Relatório pendente, Sem responsável, Reunião, versão, subprocessos. */
export function selosDoCartao(processo: ProcessoDaLista, hoje: string): Selo[]
```

- [x] **Passo 1: testes que falham** (critérios 4 a 8 do ticket 20):
  - `barraDoCartao`: caminho de 6 com 2 concluídas, 1 dispensada e 1 realizada anteriormente antes da atual → 4 `resolvida`, 1 `atual`, o resto `seguinte`; nome `"Etapa 5 de 6: Relatório e modelagem técnica"` (n = posição da atual no caminho, total = tamanho do caminho, nome = `etapaAtual.nome`); suspenso também tem barra; sem `cartao`, caminho vazio ou etapa atual fora do caminho → `null`.
  - `selosDoCartao`: **dias** com 15 dias → ausente, 16 → `"16 dias nesta etapa"` tom `alerta`, suspenso com 40 dias → ausente, etapa atual pendente → ausente, em andamento sem início → ausente; **relatório** na `relatorio_modelagem_tecnica` sem relatório → ausente, na `revisao_interna` sem relatório → presente tom `alerta` com texto `"Relatório pendente"`, com relatório → ausente, última versão histórica sem relatório → ausente, sem versão → ausente, etapa posterior (`aprovacao`...) sem relatório → presente, suspenso → presente (decisão 2); **sem responsável** → `"Sem responsável"` tom `neutro` só quando `responsavel` é `null` e há etapa atual; **reunião** hoje → `"Reunião hoje"`, futura em 25/10/2026 → `"Reunião 25/10"`, passada → ausente, sem data → ausente; **versão** `"V3"`, `"V5F"`, ausente sem versão; **subprocessos** `"1 subprocesso"`, `"3 subprocessos"`, 0 → ausente; **ordem** com todos presentes: dias, relatorio, sem_responsavel, reuniao, versao, subprocessos; processo sem `cartao` → `[]`.
- [x] **Passo 2:** `npx vitest run src/processos/barraDoCartao.test.ts src/processos/selosDoCartao.test.ts` falha.
- [x] **Passo 3: implementar.** `selosDoCartao` monta a lista concatenando uma função pequena por selo (`seloDeDias`, `seloDeRelatorio`, `seloDeResponsavel`, `seloDeReuniao`, `seloDeVersao`, `seloDeSubprocessos`, cada uma devolvendo `Selo[]` vazio ou de um item) para ficar dentro de 20 linhas e complexidade 10. A comparação "Revisão interna ou posterior" usa o índice no `caminho` (decisão 3). "Reunião dd/mm" é `formatarData(data).slice(0, 5)`.
- [x] **Passo 4:** os testes passam; `npm run lint`, `npm run typecheck`.
- [x] **Passo 5: commit** `Ticket 20 de processos-etapas: funções da barra e dos selos do cartão`.

### Tarefa 5: Cartão do Quadro, teste de tela e fecho

**Arquivos:** `BarraDeProgresso.tsx`, `SelosDoCartao.tsx`, `CartaoDoProcesso.tsx`, `Quadro.css`, `src/App.cartaoDoQuadro.test.tsx`, `.scratch/processos-etapas/desvios.md`.

**Consome:** `barraDoCartao`, `selosDoCartao`, `hojeLocal` (`textoDaReuniao.ts`), `Pilula` (`situacao="vencendo"` para âmbar, `"neutra"` para neutro).

- [x] **Passo 1: teste de tela que falha** (critérios 5 a 9) em `src/App.cartaoDoQuadro.test.tsx`, no molde de `src/App.quadro.test.tsx` (função `montar`, `processo(nome, mudancas)` com `cartao` nas mudanças, etapas `E1..E6` do catálogo; datas relativas a `hojeLocal()` para não depender do dia em que rodam). Casos, todos pelo aplicativo inteiro, para `integrante_ep` e um para `consulta` (barra e selos iguais):
  - barra: `getByRole('img'... )` — dê à barra `role="img"` e `aria-label`; teste por `getByLabelText('Etapa 3 de 6: Reunião de modelagem')`, com dispensada e realizada anteriormente contadas como resolvidas (confira pelas classes `pedaco-resolvida`/`pedaco-atual`/`pedaco-seguinte`) e também em cartão suspenso;
  - dias: processo com início há 15 dias → sem "dias nesta etapa"; há 16 → `"16 dias nesta etapa"`; suspenso e pendente → sem;
  - Relatório pendente: na etapa de relatório sem relatório → ausente; na `revisao_interna` sem relatório → presente; com relatório → ausente; última versão `V5F` → ausente;
  - Sem responsável presente e com responsável ausente; Reunião hoje, futura e passada; versão `V3` e `V5F` e nenhuma; `2 subprocessos` com o cancelado fora da contagem (o dado já vem em `cartao.subprocessos`, o teste só prova a tela);
  - ordem: um processo com todos os selos, `textContent` do cartão com os textos na ordem esperada;
  - cartão normal (sem nada a dizer) não tem nenhum selo (`.cartao-selos` ausente).
- [x] **Passo 2:** `npx vitest run src/App.cartaoDoQuadro.test.tsx` falha.
- [x] **Passo 3: implementar.**
  - `BarraDeProgresso.tsx`: `<span className="cartao-barra" role="img" aria-label={nome}>` com um `<span className="pedaco pedaco-{estado}" />` por pedaço; devolve `null` sem barra.
  - `SelosDoCartao.tsx`: `<span className="cartao-selos">` com, por selo, `Pilula` para `tom 'alerta'` (`vencendo`) e para `relatorio`/`sem_responsavel`/`reuniao` neutros (`neutra`), e texto simples (`<span className="selo-texto">`) para `versao` e `subprocessos` (sem fundo, mono em versão). Nada renderizado sem selos.
  - `CartaoDoProcesso.tsx`: a barra entre o nome e o rodapé; os selos antes das pílulas de tipo/situação; `hojeLocal()` chamado uma vez por render. O `<a>` continua o mesmo (clicar ou Enter abre o verso).
  - `Quadro.css`: barra fina (altura ~4px, pedaços iguais com `gap` 2px, `resolvida` em cinza-escuro, `atual` em `--azul`, `seguinte` em cinza-claro, todos com tokens já existentes — confira os nomes em `src/index.css` ou equivalente antes de usar); `.cartao-selos` com `display: flex; flex-wrap: wrap; gap` para quebrar de linha sem estourar a coluna; `overflow-wrap: anywhere` no texto dos selos.
- [x] **Passo 4:** o teste de tela passa; `npm test` inteiro, `npm run lint`, `npm run typecheck` verdes. Repetir isolado qualquer teste de tela instável.
- [x] **Passo 5: conferência visual (critério 10, `[visual]`).** Vitrine local (`vitrine.local/`, fora do git; recrie se não existir, como no ticket 17) com cartões de todos os casos; conferir no navegador do app: cartão normal limpo (barra fina, no máximo versão e subprocessos em texto neutro), só "dias" e "Relatório pendente" em âmbar, selos quebrando de linha sem estourar os 310px da coluna. Se não der para conferir, o critério fica "presumido" no relatório do `/ship`.
- [x] **Passo 6: `desvios.md`.** Acrescentar entrada datada em `.scratch/processos-etapas/desvios.md` com as decisões 1 a 5 deste plano, e o que tiver divergido da spec na execução.
- [x] **Passo 7: commit** `Ticket 20 de processos-etapas: barra de progresso e selos no cartão do Quadro` (inclui desvios). Marcar as caixas do plano e comitar junto.

### Fecho (feito pelo comando, depois do merge)

Merge da branch na `main` (`git switch main`, `git merge`, `git branch -d`), linha `Concluído em` no ticket 20, `git push` da `main` (autorizado no CLAUDE.md; o envio mexe em `supabase/`, então conferir o "Testes de banco" da `main`), envio do marco, e custo no `.scratch/custos.md`.
