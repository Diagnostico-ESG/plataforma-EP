# Plano — mudança do .bpm (documentos-versoes, 2026-10-20)

> **Para quem executa:** use `superpowers:executing-plans`, tarefa por tarefa. Marque as caixas (`- [x]`) ao terminar cada passo.

**Objetivo:** a versão nova exige .bpm e .png (o .bpmn fica opcional), e a versão completa passa a ser .bpm, .png e relatório.

**Spec:** `.scratch/documentos-versoes/spec.md`, seção "Mudança de 2026-10-20" (histórias 51 a 62, Decisões de implementação, Modelo de dados, Decisões de teste). ADR 0016.

**Branch:** `documentos-versoes-bpm`, criada a partir da `main` na pasta principal (sem worktree).

## Regras que valem (de `.claude/regras/banco.md` e do CLAUDE.md)

- Estrutura muda só por migração nova (`npx supabase migration new`); migração já enviada não se edita. Esta só recria duas funções (`create or replace`, que mantém dono e concessões), sem `security definer`.
- O teste vem antes da migração: pgTAP vermelho no "Testes de banco", migração pelo "Migrar banco de desenvolvimento", pgTAP verde. Os dois workflows podem ser disparados sem pedir autorização (Ajustes deste Projeto), só na branch de trabalho ou na `main`.
- Conferir o alvo antes: `supabase/AMBIENTES.md` (vínculo atual `yclkzyoebpsxmgpbcbus`, o dev) — o workflow já recusa outro projeto.
- `db:types` não roda: nenhuma tabela, coluna, tipo ou função pública muda.
- A função do servidor `arquivos-no-drive` não muda nem é publicada (spec, "Função do servidor").
- O pre-commit roda typecheck, lint e a bateria inteira; por isso cada tarefa da tela fecha com a bateria verde, incluindo os testes antigos ajustados.
- Edição em lote com Node ou com a ferramenta Edit; sem heredoc longo e sem Python (melhorias-protocolo, 2026-10-19). Caminhos absolutos no Bash.

---

### Tarefa 1: Banco — pgTAP antes, depois a migração

**Arquivos:**
- Testes: `supabase/tests/27_versoes.test.sql`, `28_versoes_historicas.test.sql`, `29_relatorio_depois.test.sql`, `30_substituir_arquivo.test.sql`, `36_trava_do_autor.test.sql`, `37_cartao_do_quadro.test.sql`, `38_etapas_protegidas_e_revisao_do_setor.test.sql`, `39_revisao_interna.test.sql`, `40_aprovacao.test.sql`, `41_editar_registros.test.sql`
- Criar: `supabase/migrations/<data>_versao_exige_bpm_e_png.sql`
- Registro: `supabase/AMBIENTES.md`

- [x] **1.1 Branch e marco.** `git switch -c documentos-versoes-bpm`; marco `marco/2026-10-20-inicio-mudanca-bpm` e envio do marco.
- [x] **1.2 Testes pgTAP (vermelhos com o banco atual).**
  - Em todos os arquivos da lista com `pg_temp.par()`: o par passa a `jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'), pg_temp.arquivo('png', 'png'))`, e os comentários "par .bpmn + .png" passam a ".bpm + .png". **Exceção, 28:** o `par()` fica .bpmn + .png (prova a histórica com o par); só a linha 130 (versão nova depois da V5F) passa a `jsonb_build_array(pg_temp.arquivo('bpm', 'bpm'), pg_temp.arquivo('png', 'png'))`.
  - **27:** a primeira descrição vira "administrador registra uma versão com .bpm e .png, sem .bpmn"; os dois `throws_ok` de `versao_sem_bpmn_e_png` viram três com `versao_sem_bpm_e_png`: só `.bpm` ("versão sem .png é recusada"), só `.png` ("versão sem .bpm é recusada") e `.bpmn` + `.png` ("versão com .bpmn e .png, sem .bpm, é recusada"). O "segundo arquivo do mesmo papel" usa `pg_temp.par() || pg_temp.arquivo('bpm', 'bpm')`. `plan(52)` → `plan(53)`. Comentário do cabeçalho: "par .bpm e .png".
  - **29, linha 155:** `arquivo_da(..., 3, 'bpmn')` → `'png'` (continua um arquivo que não é relatório).
  - **30:** as V1 (f1 a f4, f6) e a histórica V1F de f5 passam a `pg_temp.par() || pg_temp.arquivo('bpmn', 'bpmn') || pg_temp.relatorio()`; os casos de `'bpmn'` ficam como estão e passam a provar a história 60 (substituir o .bpmn opcional). Comentário: "V1 com .bpm, .png, .bpmn e relatório".
  - **38:** caso novo "Sem Bpm", logo depois do "Sem Png", no mesmo molde (o dono do banco apaga o `bpm` da V1): `throws_ok(..., 'P0001', 'versao_incompleta:1:bpm,relatorio', 'concluir com a versão sem .bpm e sem relatório é recusado, com os dois')`. `plan(26)` → `plan(27)`. O caso "Completa" já sem .bpmn prova a história 59; comentários "(.bpmn, .png e relatório)" → "(.bpm, .png e relatório)".
  - **36, 37, 39, 40, 41:** só o `par()` e os comentários (o 40 e o 41 com a versão completa sem .bpmn provam a Aprovação da história 59).
- [x] **1.3 Comitar os testes, enviar a branch e disparar "Testes de banco".** Esperado: vermelho (o banco atual recusa a versão sem .bpmn com `versao_sem_bpmn_e_png` e não conhece `versao_sem_bpm_e_png`). Anotar o número da execução.
- [x] **1.4 Migração.** `npx supabase migration new versao_exige_bpm_e_png`, com:

```sql
-- documentos-versoes, mudança de 2026-10-20 (ADR 0016): a versão nova exige o .bpm e o .png; o .bpmn fica opcional, e a
-- versão completa (trava da Revisão pelo setor e da Aprovação, ADR 0009) passa a ser .bpm, .png e relatório.
-- Não destrutiva: recria duas funções (create or replace mantém dono e concessões). O gatilho só age na inclusão, então
-- nenhuma versão já gravada é revista.

-- A nova tem .bpm e .png; a histórica, o .bpm ou o par .bpmn e .png (o relatório é opcional nas duas). Conferido no
-- fim da gravação (restrição adiada), porque a versão entra antes dos arquivos.
create or replace function private.conferir_arquivos_da_versao() returns trigger
language plpgsql set search_path = ''
as $$
declare
  papeis public.papel_do_arquivo[] := array(select papel from public.arquivos_da_versao where versao_id = new.id);
begin
  if new.historica then
    if not (papeis @> array['bpm']::public.papel_do_arquivo[] or papeis @> array['bpmn', 'png']::public.papel_do_arquivo[]) then
      raise exception 'historica_sem_arquivo_de_fluxograma';
    end if;
  elsif not papeis @> array['bpm', 'png']::public.papel_do_arquivo[] then
    raise exception 'versao_sem_bpm_e_png';
  end if;
  return null; -- gatilho "depois": o retorno é ignorado
end $$;

-- Os papéis que a versão completa exige e ela ainda não tem, na ordem em que a frase os lista.
create or replace function private.papeis_que_faltam(p_versao uuid) returns text[]
language sql stable set search_path = ''
as $$
  select coalesce(array_agg(exigido.papel order by exigido.ordem), '{}')
  from (values ('bpm', 1), ('png', 2), ('relatorio', 3)) as exigido (papel, ordem)
  where not exists (
    select 1 from public.arquivos_da_versao a where a.versao_id = p_versao and a.papel::text = exigido.papel) $$;
```

- [x] **1.5 Comitar a migração, enviar, disparar "Migrar banco de desenvolvimento"** (campo da migração = nome do arquivo) e depois "Testes de banco". Esperado: verde. Registrar a migração em `supabase/AMBIENTES.md` no molde das anteriores (data, motivo, testes vermelho/verde com os números, workflow, sem `db:types`) e comitar.

### Tarefa 2: Funções puras e frases (TDD)

**Arquivos:** `src/versoes/rotulos.ts` (+ `.test.ts`), `src/versoes/formularioDeVersao.ts` (+ `.test.ts`), `src/processos/frasesDaVersaoCompleta.ts` (+ `.test.ts`), `src/versoes/recusasDeVersoes.ts` (+ `.test.ts`), `src/versoes/versaoDaLinha.ts`, `supabase/functions/_shared/registro.test.ts` (só o código de exemplo).

**Produz:** `PAPEIS` (ordem do formulário) = `['bpm', 'png', 'bpmn', 'relatorio']`; `ORDEM_DOS_ARQUIVOS` = `['png', 'bpm', 'relatorio', 'bpmn']` e `emOrdemDeExibicao(arquivos: ArquivoDaVersao[]): ArquivoDaVersao[]` em `rotulos.ts`; `PAPEIS_OBRIGATORIOS = ['bpm', 'png']`.

- [x] **2.1 Testes vermelhos:**
  - `rotulos.test.ts`: `PAPEIS` igual a `['bpm', 'png', 'bpmn', 'relatorio']`; `emOrdemDeExibicao` de [bpmn, relatorio, bpm, png] devolve [png, bpm, relatorio, bpmn]; `ROTULO_DO_PAPEL` traz "Fluxograma Bizagi (.bpm)", "Imagem do fluxo (.png)" e ".bpmn"; `rotuloCurtoDoArquivo` dá "Fluxograma .bpm", "Imagem .png", "BPMN .bpmn".
  - `formularioDeVersao.test.ts`: `podeEnviar` verdadeiro com .bpm e .png sem .bpmn; falso só com .bpmn e .png; falso sem .png; `arquivosDoPedido` na ordem .bpm, .png, .bpmn, relatório.
  - `frasesDaVersaoCompleta.test.ts`: `faltasDaVersao(['png', 'bpmn', 'relatorio'])` = `['bpm']`; `fraseDaVersaoIncompleta(8, ['bpm', 'relatorio'])` = "A V8 está sem .bpm e relatório."; `fraseDoBloqueioDaConclusao` nulo com bpm, png e relatório sem bpmn.
  - `recusasDeVersoes.test.ts`: `versao_sem_bpm_e_png` → "A versão precisa do .bpm e do .png." (sai a linha do código antigo).
- [x] **2.2 Implementar:** `rotulos.ts` (PAPEIS, ORDEM_DOS_ARQUIVOS, `emOrdemDeExibicao`, rótulos: bpm "Fluxograma Bizagi (.bpm)", png "Imagem do fluxo (.png)", bpmn ".bpmn"; nomes curtos bpm "Fluxograma", png "Imagem", bpmn "BPMN"); `formularioDeVersao.ts` (`PAPEIS_OBRIGATORIOS`); `frasesDaVersaoCompleta.ts` (`EXIGIDOS = ['bpm', 'png', 'relatorio']`, `ROTULO` com `bpm: '.bpm'`); `recusasDeVersoes.ts` (chave e texto novos); `versaoDaLinha.ts` ordena por `ORDEM_DOS_ARQUIVOS`. `registro.test.ts` usa `versao_sem_bpm_e_png` como exemplo.
- [x] **2.3** Os testes da 2.1 passam. Seguir para a Tarefa 3 antes de comitar (a bateria inteira ainda tem testes de tela antigos).

### Tarefa 3: Falsa de versões, tela e testes antigos

**Arquivos:** `src/versoes/VersoesFalso.ts` (+ `.test.ts`), `src/components/versoes/VersaoEmDestaque.tsx`, `src/components/versoes/ListaDeVersoes.tsx`, `src/testes/versoesDeTeste.ts`, os `App.*.test.tsx` e testes de módulo que montam versões ou procuram os rótulos antigos, `src/versoes/tipos.ts` e `src/processos/tipos.ts` (comentários).

- [x] **3.1 Teste vermelho da falsa** (`VersoesFalso.test.ts`): a versão nova sem .bpm (só .bpmn e .png) é recusada com o código `versao_sem_bpm_e_png`; com .bpm e .png sem .bpmn é aceita.
- [x] **3.2 Falsa:** `conferirNova(pedido)` no molde de `conferirHistorica`, chamada em `registrar` quando não é histórica: sem `bpm` ou sem `png` → `falhaDaFuncao('versao_sem_bpm_e_png', '')`.
- [x] **3.3 Tela:** `VersaoEmDestaque` troca a `emOrdem` local por `emOrdemDeExibicao` (o comentário diz a ordem nova); `ListaDeVersoes` usa `emOrdemDeExibicao(versao.arquivos)`.
- [x] **3.4 Testes de tela novos** (critérios de "Decisões de teste"): em `App.enviarVersao` — envia com .bpm e .png sem .bpmn; botão desabilitado sem .bpm; habilitado sem .bpmn; ordem dos campos (.bpm, .png, .bpmn, relatório, observação, pelos rótulos). Em `App.versoesNoProcesso` — ordem dos arquivos no destaque e nas anteriores (.png, .bpm, relatório, .bpmn). Em `App.revisaoDoSetor` — janela diz "sem .bpm" quando falta; conclui com .bpm, .png e relatório sem .bpmn. Em `App.aprovacao` — conclui sem .bpmn. `App.registrarVersaoHistorica` — a histórica só com .bpm continua aceita (conferir se já existe; senão, acrescentar).
- [x] **3.5 Testes antigos:** `versaoDeTeste` passa a montar .bpm e .png (comentário junto); onde um teste monta a versão completa ou envia uma versão nova com .bpmn + .png, trocar por .bpm + .png (arquivo `.bpm` inventado, como o que os testes da histórica já usam); onde procura "Fluxograma .bpmn", "Imagem do fluxograma (.png)" ou "Fluxograma (.bpmn)", usar os rótulos novos; `papeis` de `UltimaVersao` completos passam a `['bpm', 'png', 'relatorio']`. Rodar `npm test` até verde, sem afrouxar asserção.
- [x] **3.6 Verificar e comitar:** `npm test`, `npm run typecheck`, `npm run lint` verdes; commit único da Tarefa 2 e 3 (funções, falsa, tela e testes).

### Tarefa 4: Fecho

- [x] **4.1** `desvios.md` de documentos-versoes: entrada datada com o que divergiu da spec (rótulos curtos escolhidos, testes antigos alterados, o que não foi visto na tela). Itens de `nao-testados.md` do `/executar-complexo` em `melhorias-protocolo.md`.
- [ ] **4.2** Juntar à `main` (`git switch main`, `git merge documentos-versoes-bpm`, `git branch -d documentos-versoes-bpm`), enviar a `main` e conferir o "Testes de banco" da `main`. Linha `Implementado em` no fim da seção da mudança na spec; comitar e enviar.
