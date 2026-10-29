# Ticket 03 — Data da modelagem piloto só como realização: plano de execução

> **Para quem executa:** use `superpowers:executing-plans`; marque as caixas (`- [ ]`) conforme cada tarefa termina.

**Objetivo:** a data da modelagem piloto sai do cadastro e do lado direito do verso e passa a viver na linha da etapa Modelagem piloto, nas Etapas, sem data futura (tela e banco).

**Referências (não repetidas aqui):** ticket `issues/03-data-da-modelagem-piloto-nas-etapas.md` (critérios 1 a 10); `spec.md`, seção "Data da modelagem piloto" (histórias 16 a 28), decisão "Data da modelagem piloto no verso", itens 3, 4 e 6 do "Modelo de dados"; ADR 0035.

**Regras de `.claude/regras/banco.md` que valem:** teste de banco antes da migração; migração só por `npx supabase migration new`; confirmar o alvo (vínculo atual = local, sem `supabase/.temp/project-ref` de produção) antes de `db reset`; função de gatilho em `private`, `search_path` vazio; cada célula de "quem pode o quê" testada com Administrador, Integrante, Consulta, usuário desativado e visitante; migração, teste e tipos no mesmo commit; `npm test` nunca depende do banco ligado; nada de produção.

**Fora deste ticket (tickets 04 e 05):** Anotações no cadastro, Origem, Contexto, Observações, limite de 8.000, view sem as três colunas.

**Decisões deste plano**
- Recusa do banco: `raise exception 'modelagem_no_futuro:<recebida>:<limite>'` (padrão `motivo:valor` de `src/processos/recusasDoBanco.ts`); a tela traduz para "A data da modelagem piloto não pode ser depois de hoje: recebido dd/mm/aaaa, limite dd/mm/aaaa." Uma só função `fraseDaModelagemNoFuturo(recebida, limite)` em `src/processos/frasesDaModelagemPiloto.ts` serve ao banco, ao módulo falso e ao campo.
- Com `revoke insert (data_da_modelagem_piloto)`, qualquer `insert` que cite a coluna (até com `null`) dá 42501: o cliente deixa de enviá-la no cadastro.
- Regra de edição numa função pura `podeRegistrarDataDaModelagem(processo, podeAlterar)` em `src/processos/dataDaModelagemPiloto.ts`.

---

### Tarefa 1: Banco (teste, migração, tipos)

**Arquivos:**
- Criar: `supabase/tests/70_data_da_modelagem_so_realizada.test.sql`
- Alterar: `supabase/tests/32_data_da_modelagem_piloto.test.sql` (datas futuras viram passadas; ver passo 1), `supabase/tests/63_criar_processo_com_data_da_modelagem.test.sql` (cadastro sem a data)
- Criar: `supabase/migrations/<timestamp>_data_da_modelagem_so_realizada.sql` (via `npx supabase migration new data_da_modelagem_so_realizada`)
- Alterar: `src/types/database.ts` (só se `gen types` mudar algo)

- [x] **Passo 1: testes que falham.** No `32`: trocar `'2027-01-15'` (cancelado) por `'2026-10-05'`, `'2026-11-05'` por `'2026-10-06'` (três ocorrências, inclusive o `is(...)`) e os `'2030-01-01'` de Consulta, inativo e visitante por `'2026-10-02'`; ajustar descrição "data futura em processo cancelado é aceita" para "data passada em processo cancelado é aceita". No `63`: `criar()` passa a não citar a coluna `data_da_modelagem_piloto`; o caso "com data" vira `throws_ok(insert citando a coluna, '42501')` para o administrador; manter o restante e acertar `plan(n)`. Criar o `70` com o mesmo cabeçalho/rodapé do `32` (`_tap`, usuários a1 a4, exceção final), cobrindo:
  1. `update ... set data_da_modelagem_piloto = '2999-01-01'` recusado para administrador e integrante, com `throws_ok(sql, 'P0001', format('modelagem_no_futuro:2999-01-01:%s', private.hoje()), ...)`;
  2. data de `private.hoje()` aceita (administrador) e a de amanhã (`private.hoje() + 1`) recusada;
  3. `insert` com data futura como dono do banco (`reset role`) recusado pelo gatilho (a mesma mensagem);
  4. Consulta e usuário desativado: update com data passada não altera (valor igual ao de antes); visitante: `throws_ok(..., '42501')`;
  5. `has_column_privilege('authenticated','public.processos','data_da_modelagem_piloto','INSERT')` é `false` e `'UPDATE'` é `true`;
  6. `pg_temp.edicoes`: a recusa não gera evento.
- [x] **Passo 2: ver falhar.** Conferir o alvo (`supabase/AMBIENTES.md`: vínculo atual local), `npx supabase start` (descartar a saída, traz chaves) e `npx supabase test db`; contar `ok` e `not ok` (o "FAIL" do comando é do formato dos testes). Esperado: `not ok` no 70, no 63 e nada no 32 além do já verde.
- [x] **Passo 3: prova da limpeza (antes da migração).** Com o banco local nas migrações atuais, inserir como dono do banco, por `docker exec <contêiner do banco local> psql -U postgres -c "..."` (nome do contêiner: `docker ps`), um processo inventado com `data_da_modelagem_piloto = '2999-01-01'` e outro com `'2026-10-01'`.
- [x] **Passo 4: migração.** `npx supabase migration new data_da_modelagem_so_realizada` e escrever, nesta ordem:

```sql
-- Data da modelagem piloto só como realização (ADR 0035, enxugar-cartao-e-cadastro, ticket 03). Destrutiva só para dados
-- inventados do desenvolvimento: as datas futuras eram agenda, não registro.
-- Antes de o gatilho existir: apaga as datas futuras (o gatilho de eventos do processo registra cada mudança no histórico).
update public.processos set data_da_modelagem_piloto = null where data_da_modelagem_piloto > private.hoje();

-- Gatilho, e não check: o limite (hoje em Brasília) muda todo dia. A mensagem traz a data recebida e o limite.
create function private.conferir_data_da_modelagem_piloto() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.data_da_modelagem_piloto > private.hoje() then
    raise exception 'modelagem_no_futuro:%:%', new.data_da_modelagem_piloto, private.hoje();
  end if;
  return new;
end $$;

create trigger conferir_data_da_modelagem_piloto before insert or update of data_da_modelagem_piloto on public.processos
  for each row execute function private.conferir_data_da_modelagem_piloto();

-- O cadastro deixa de gravar a data (ela se registra na linha da etapa, por update).
revoke insert (data_da_modelagem_piloto) on public.processos from authenticated;
```

  Se `private.hoje()` recusar chamada do dono da migração ou a trigger function exigir `grant`, seguir o padrão de `20261020143000_datas_no_fuso_do_escritorio.sql`.
- [x] **Passo 5: aplicar e conferir.** `npx supabase migration up --local` (não `db reset`: preserva as duas linhas do passo 3), conferir por `psql` que a data de 2999 virou nula, a de 2026-10-01 ficou, e que existe um evento `editar` do processo da data apagada em `public.eventos`. Depois `npm run db:reset` (local) e `npx supabase test db`: todas as linhas `ok`, nenhuma `not ok`.
- [x] **Passo 6: tipos.** `npx supabase gen types typescript --local` conforme `scripts/gerar-tipos.mjs` (ver o script; não usar o remoto); a diferença esperada é nenhuma ou mínima.
- [x] **Passo 7: comitar** (`enxugar-cartao-e-cadastro ticket 03: banco recusa data futura e cadastro sem a data`), com testes, migração e tipos.

---

### Tarefa 2: Frase da recusa, módulo falso e função de regra (lógica pura)

**Arquivos:**
- Criar: `src/processos/frasesDaModelagemPiloto.ts` + `frasesDaModelagemPiloto.test.ts`
- Criar: `src/processos/dataDaModelagemPiloto.ts` + `dataDaModelagemPiloto.test.ts`
- Alterar: `src/processos/recusasDoBanco.ts` (código `modelagem_no_futuro`), `src/processos/ProcessosFalso.ts` (`marcarDataDaModelagemPiloto` recusa futura), `src/processos/textoDaModelagemPiloto.ts` (+ teste: sai `textoDaModelagemPiloto` e `momentoDaModelagemPiloto`, que ninguém mais usa; `hojeLocal` fica)

**Interfaces:**
- Produz: `fraseDaModelagemNoFuturo(recebida: string, limite: string): string`; `podeRegistrarDataDaModelagem(processo: Pick<ProcessoLido, 'situacao' | 'etapaAtual' | 'etapasDoVerso'>, podeAlterar: boolean): boolean`.

- [x] **Passo 1: testes que falham.** `fraseDaModelagemNoFuturo('2026-11-03', '2026-10-29')` → `'A data da modelagem piloto não pode ser depois de hoje: recebido 03/11/2026, limite 29/10/2026.'`. `podeRegistrarDataDaModelagem`: verdadeiro para Administrador/Integrante (`podeAlterar` true), situação `em_andamento` ou `concluido`, etapa atual com `ordem` >= a da etapa de código `CODIGO_DA_MODELAGEM_PILOTO` em `etapasDoVerso`; falso em Não iniciados (ordem menor), suspenso, cancelado, `podeAlterar` falso, sem `etapaAtual`, ou sem a etapa Modelagem piloto no verso. Em `recusasDoBanco`, um erro `{ code: 'P0001', message: 'modelagem_no_futuro:2999-01-01:2026-10-29' }` vira `TravaDoBanco` com a frase (teste no arquivo de teste existente de recusas, ou em `gravarProcessoSupabase.test.ts` no estilo do teste da linha ~168). No falso: `marcarDataDaModelagemPiloto('p1', '2999-01-01')` rejeita com `TravaDoBanco` da frase, usando `hojeEmBrasilia()` como limite; a de hoje passa.
- [x] **Passo 2:** `npx vitest run src/processos` e ver falhar.
- [x] **Passo 3: implementar.** `frasesDaModelagemPiloto.ts` usa `formatarData` de `../lib/datas`. `recusasDoBanco.ts`: acrescentar `modelagem_no_futuro` ao `PADRAO_DA_RECUSA` e em `FRASE_DA_RECUSA`: `modelagem_no_futuro: (valor) => { const [recebida, limite] = valor.split(':'); return fraseDaModelagemNoFuturo(recebida, limite) }`. `ProcessosFalso.marcarDataDaModelagemPiloto`: depois de `acharProcesso`, `if (data !== null && data > hojeEmBrasilia()) throw new TravaDoBanco(fraseDaModelagemNoFuturo(data, hojeEmBrasilia()))`. Limpar o que sobrar sem uso em `textoDaModelagemPiloto.ts`.
- [x] **Passo 4:** `npx vitest run src/processos` verde; `npx tsc --noEmit` pode apontar usos a limpar nas tarefas 3 e 4.
- [x] **Passo 5: comitar** (`... ticket 03: frase da recusa e regra de quando a data se registra`).

---

### Tarefa 3: Cadastro sem a data

**Arquivos:**
- Alterar: `src/components/processos/CamposDoProcesso.tsx` (sai o campo da data, o bloco `cadastrando && (...)` da data e a menção no comentário de `cadastrando`), `src/components/processos/FormularioPronto.tsx` (sai `dataDaModelagemPiloto` de `camposEmBranco`/`camposIniciais`, o `hojeEmBrasilia` e o comentário "a data já vem com hoje"), `src/processos/validacaoDoProcesso.ts` (+ teste: sai o campo de `CamposDoProcesso` e de `dadosDoProcesso`), `src/processos/tipos.ts` (sai `dataDaModelagemPiloto` de `DadosDoProcesso`; fica em `ProcessoDaLista`), `src/processos/gravarProcessoSupabase.ts` (`valoresDoCadastro` não envia a coluna; ajustar comentário), `src/processos/ProcessosFalso.ts` (criar não grava a data; sai o `delete campos.dataDaModelagemPiloto`, que deixa de existir)
- Testes: `src/App.cadastrarProcesso.test.tsx`, `src/processos/gravarProcessoSupabase.test.ts`, `src/processos/validacaoDoProcesso.test.ts`, `src/components/processos/FormularioDoProcesso.test.tsx`

- [x] **Passo 1: testes que falham.** Em `App.cadastrarProcesso.test.tsx`: o formulário de Novo processo não tem o campo "Data da modelagem piloto" (`queryByLabelText` nulo) e o processo criado no falso tem `dataDaModelagemPiloto` nula (reescrever o teste da linha ~134 que esperava `gravada`). Em `gravarProcessoSupabase.test.ts`: o corpo do `insert` não tem a chave `data_da_modelagem_piloto`. Em `validacaoDoProcesso.test.ts`: `dadosDoProcesso` não devolve a chave.
- [x] **Passo 2:** rodar esses arquivos e ver falhar.
- [x] **Passo 3: implementar** as alterações da lista de arquivos; deixar o compilador (`npx tsc --noEmit`) listar usos esquecidos (`src/testes/*`, outros `App.*.test.tsx` que montam `DadosDoProcesso`).
- [x] **Passo 4:** os arquivos da tarefa verdes; `npx tsc --noEmit` limpo nesses pontos.
- [x] **Passo 5: comitar** (`... ticket 03: cadastro sem a data da modelagem piloto`).

---

### Tarefa 4: Data na linha da Modelagem piloto, fora do lado direito do verso

**Arquivos:**
- Alterar: `src/components/processos/VersoDoCartao.tsx` (sai o import e o uso de `DataDaModelagemPiloto` em `ColunasDoVerso`; ajustar o comentário "Data da modelagem piloto, dados e estrutura")
- Alterar: `src/components/processos/DataDaModelagemPiloto.tsx` (vira o bloco da linha, ver abaixo; sem `<section>` nem `<h3>`)
- Alterar: `src/components/processos/CampoDeDataDoProcesso.tsx` (textos configuráveis e recusa do futuro antes de enviar)
- Alterar: `src/components/processos/EtapasDoProcesso.tsx` (renderiza o bloco na linha de `CODIGO_DA_MODELAGEM_PILOTO`; recebe `processos` e `podeAlterar` — `CaminhoDoProcesso` passa `processos={processos}` e `podeAlterar={podeAlterar}`; `podeEditar` já existe e mistura parado, por isso a regra nova vem de `podeRegistrarDataDaModelagem`), `src/components/processos/Etapas.css` (+ `Contexto.css` só se alguma classe `modelagem-*` ficar sem uso)
- Alterar: `src/components/processos/CaminhoDoProcesso.tsx`

**Interfaces:**
- Consome: `podeRegistrarDataDaModelagem`, `fraseDaModelagemNoFuturo` (tarefa 2), `hojeEmBrasilia` (`src/lib/datas`).
- `CampoDeDataDoProcessoProps` ganha, opcionais e com o comportamento de hoje por padrão (a Data da validação não muda): `textos?: { antes?: string; semData: string | null; registrar: string; alterar: string }` (padrão: sem `antes`, `semData: 'Ainda não marcada'`, `registrar: 'Marcar data'`, `alterar: 'Alterar data'`) e `textoDaDataAlemDoMaximo?: (data: string, maximo: string) => string`.

- [x] **Passo 1: testes que falham.** Reescrever `src/App.dataDaModelagemPiloto.test.tsx` (mesmo ponto de entrada: `App` com módulos falsos, "hoje" simulado em 2026-10-14; montar `etapasDoVerso` com Não iniciados, Modelagem piloto (`codigo: 'modelagem'`), Revisão interna e Concluídos, com `ordem` crescente, como em `src/testes/processoNoVerso.tsx`) cobrindo:
  1. com data e processo na Modelagem piloto: a linha da etapa diz "Realizada em 10/10/2026" e oferece "Alterar data"; sem data, só "Registrar data" (sem "Ainda não marcada" nem "· próxima");
  2. registrar, alterar (campo abre com a data gravada), cancelar sem gravar, apagar sem confirmação, foco volta ao botão, Salvar desabilitado com campo vazio ou data igual (comportamentos hoje cobertos, agora na linha);
  3. processo em Revisão interna e em Concluídos (`situacao: 'concluido'`): registra;
  4. em Não iniciados: sem data, a linha não oferece nada; com data (voltou para Não iniciados), mostra "Realizada em ..." sem botão;
  5. Consulta, suspenso e cancelado: só leitura, sem botões, e sem data não aparece nada;
  6. data futura digitada (2026-10-20 com hoje 14/10/2026): não chama o módulo (`falso.chamadas` vazio) e mostra, abaixo do campo, "A data da modelagem piloto não pode ser depois de hoje: recebido 20/10/2026, limite 14/10/2026."; a de hoje grava;
  7. gravando: botões desabilitados; falha de gravação mostra a mensagem abaixo do campo e a data anterior permanece na linha (texto atual: "A Data da modelagem piloto não foi salva: ..."); recusa por perfil (`TravaDoBanco`) mostra a frase;
  8. o lado direito do verso não tem a região "Data da modelagem piloto";
  9. histórico mostra a troca da data com o autor, e processo com data se exclui (manter os dois testes atuais);
  10. registrar a data não muda a etapa nem a etiqueta (`falso.processos[0].etapaAtual` igual antes/depois).
- [x] **Passo 2:** `npx vitest run src/App.dataDaModelagemPiloto.test.tsx` e ver falhar.
- [x] **Passo 3: implementar.** `CampoDeDataDoProcesso`: `LeituraDaData` usa `textos`; quando `semData` é `null` e não há data, não escreve o parágrafo; com `antes`, escreve `{antes}<time>...</time>`. `EdicaoDaData`: antes de `gravarNaHora(data)`, se `maximo && data > maximo && textoDaDataAlemDoMaximo`, `setFalha(textoDaDataAlemDoMaximo(data, maximo))` e retorna. Bloco da linha:

```tsx
/** A data da modelagem piloto na linha da etapa Modelagem piloto: só a de realização, nunca futura (ADR 0035). */
export function DataDaModelagemPiloto({ processo, processos, podeAlterar, aoMudar, aoSumir }: DataDaModelagemPilotoProps) {
  const editavel = podeRegistrarDataDaModelagem(processo, podeAlterar)
  if (!editavel && !processo.dataDaModelagemPiloto) return null
  return (
    <div className="etapa-modelagem">
      <CampoDeDataDoProcesso data={processo.dataDaModelagemPiloto ?? null} rotulo="Data da modelagem piloto" podeAlterar={editavel}
        gravar={(nova) => processos.marcarDataDaModelagemPiloto(processo.id, nova)} textoDaFalha={textoDaFalhaDaModelagemPiloto}
        maximo={hojeEmBrasilia()} textoDaDataAlemDoMaximo={(data, maximo) => fraseDaModelagemNoFuturo(data, maximo)}
        textos={{ antes: 'Realizada em ', semData: null, registrar: 'Registrar data', alterar: 'Alterar data' }}
        aoMudar={aoMudar} aoSumir={aoSumir} />
    </div>
  )
}
```

  `LinhaDaEtapa` renderiza `{etapa.codigo === CODIGO_DA_MODELAGEM_PILOTO && <DataDaModelagemPiloto .../>}` logo depois do botão e antes da gaveta (a data fica visível sem abrir a gaveta). CSS em `Etapas.css`: recuo alinhado ao nome da etapa, fonte pequena, sem quebrar a linha do tempo (`.etapa-modelagem`).
- [x] **Passo 4:** testes da tarefa verdes. Conferir `src/components/processos/FormularioDoProcesso.test.tsx`, `App.versoDoCartao.test.tsx`, `App.agoraDoVerso.test.tsx`, `App.contextoDoVerso.test.tsx`, `App.dataDaValidacao.test.tsx` (a Validação continua com "Ainda não marcada" e "Marcar data").
- [x] **Passo 5: comitar** (`... ticket 03: data da modelagem piloto na linha da etapa`).

---

### Tarefa 5: Conferência geral

- [x] **Passo 1:** `npm test` (tudo verde), `npx tsc --noEmit`, `npx eslint .` (limites de arquivo, função e complexidade).
- [x] **Passo 2:** `grep -rn "Marcar data\|· próxima\|· realizada" src` sem sobra do desenho antigo (fora da Validação); corrigir nomes de testes e comentários velhos (`reunião`, "marcada para").
- [x] **Passo 3: `[visual]`** abrir o verso na pré-visualização (`preview_start`), se o login institucional deixar; se não deixar, registrar no `.scratch/proximo-passo.md` que o critério visual do ticket 03 ficou para o login real ou o `/polir`.
- [x] **Passo 4:** `git push` da branch do ticket e disparo do workflow "Testes de banco" nela (autorizado em "Ajustes deste Projeto"); ler o resultado. Se a máquina não tiver `gh` autenticado, devolver o comando ao usuário.
- [x] **Passo 5:** comitar o que sobrar; marcar as caixas do plano.
