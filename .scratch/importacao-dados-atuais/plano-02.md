# Plano do ticket 02: Arquivos das versões da pasta

> **Para quem executa:** use superpowers:executing-plans, tarefa por tarefa. As caixas (`- [ ]`) são o registro da execução.

**Objetivo:** a seção "2. Arquivos das versões" da Importação lê a pasta DOCUMENTOS MAPEAMENTO, mostra a prévia por processo e envia os arquivos do computador ao Drive, ligados às versões (ticket 02, histórias 41 a 59 da spec).

**Arquitetura:** o banco ganha três funções só do Administrador (`importar_versao`, `importar_anexo`, `anotar_subpasta_da_importacao`). Elas ligam a marca de sessão `ep.importando_versao`, como o `importar_processo` liga `ep.importando_etapa`, e os gatilhos que já existem afrouxam as travas de etapa e de "em andamento" só com essa marca. A função `arquivos-no-drive` aceita a marca `importacao: true` nos pedidos `iniciar_envio` e `registrar`: só o Administrador, processo em andamento ou concluído, gravação pelas funções novas. No navegador, um módulo puro lê a lista de arquivos da pasta e monta o plano de envio; outro envia versão a versão, por `ModuloDeImportacao`, com o falso de sempre nos testes de tela.

**Tecnologia:** Vite + React + TypeScript, Vitest + Testing Library, Supabase (pgTAP, PL/pgSQL), Edge Function em Deno com decisões em arquivo puro.

**Spec:** `.scratch/importacao-dados-atuais/spec.md` (histórias 41 a 59, decisões de implementação), ticket `issues/02-arquivos-das-versoes-da-pasta.md` e desenho da pasta `amostra/pasta.md`.

## Restrições gerais

- Regras de banco que valem (`.claude/regras/banco.md`): teste antes da migração; migração não destrutiva e por último na pasta; função nova sem `security definer` (a RLS decide), com a conferência explícita do perfil dando 42501; recusas em P0001 `motivo:valor`; Edge Function confere quem chamou antes de tudo, com a decisão em arquivo puro testado no Vitest; resposta e log sem dado pessoal; nada de nome real.
- Ciclo de banco deste projeto (Ajustes do `CLAUDE.md`, 2026-10-24): teste pgTAP no Docker local (`npx supabase start` com a saída descartada, `npx supabase test db`, contar `ok` e `not ok`); depois o workflow "Migrar banco de desenvolvimento" e o "Testes de banco" na branch; tipos com `npm run db:types` (remoto) ou `npx supabase gen types --local`.
- Nenhum arquivo da pasta entra no git: testes usam `File` inventado (setores XYZ e ABC, processos "Exemplo Alfa").
- Sem dependência nova. Seletor de pasta nativo (`<input type="file" webkitdirectory>`).
- Limites do ESLint: função até 20 linhas, arquivo até 300, complexidade 10. `supabase/functions/_shared/decisao.ts` já tem 299 linhas: nada se acrescenta nele.
- **O jsdom não faz:** o atributo `webkitdirectory` não abre seletor de pasta, e o `File` do jsdom não tem `webkitRelativePath` preenchido. Os testes criam o `File` e definem `webkitRelativePath` com `Object.defineProperty`, depois disparam `change` no campo.

## Interpretações registradas (vão para o `desvios.md` na Tarefa 8)

- A versão histórica importada fica sem etapa, como toda histórica da plataforma (`etapa_id` nulo); a piloto e a em sequência levam a etapa atual do processo (história 49).
- A unidade de repetição é a versão: se um arquivo dela falha, a versão não é registrada e a próxima rodada a envia inteira. Arquivos que já subiram ficam soltos na pasta do Drive, como em qualquer envio que falha hoje (`ponytail:` no código).
- O relatório `.docx` da versão que não é histórica recebe o próximo número de relatório do processo (ADR 0026). A prévia calcula esse número a partir do maior que já existe, e o banco confere.

---

### Tarefa 1: Banco: importar versão, anexo e linha da subpasta

**Arquivos:**
- Criar: `supabase/tests/75_importar_versao.test.sql`
- Criar: `supabase/migrations/<horário>_importar_versao.sql` (com `npx supabase migration new importar_versao`)
- Alterar: `src/types/database.ts` (gerado)

**Interfaces:**
- Produz: `public.importar_versao(p_processo uuid, p_numero integer, p_tipo text, p_arquivos jsonb, p_numero_do_relatorio integer default null) returns text`, que devolve `'criada'` ou `'ja_existia'` (`p_tipo` vale `historica`, `piloto` ou `sequencia`).
- Produz: `public.importar_anexo(p_processo uuid, p_arquivo jsonb) returns text`, que devolve `'criado'` ou `'ja_existia'` (mesmo nome no processo).
- Produz: `public.anotar_subpasta_da_importacao(p_processo uuid, p_subpasta text) returns void`.
- Produz: o evento `acao = 'importar'`, `entidade = 'versao'`, com `estado_da_versao` no `depois`.

- [ ] **Passo 1: conferir o Docker.** `docker info` responde; senão, pedir ao usuário que abra o Docker Desktop. `npx supabase start > /dev/null 2>&1`.
- [ ] **Passo 2: procurar o que a migração muda nos testes antigos.** `grep -ln "conferir_processo_que_recebe_versao\|conferir_onde_cabe_a_versao\|preparar_versao\|numerar_relatorio_novo\|registrar_evento_da_versao" supabase/tests/` (os testes 27, 28, 56, 58, 61 e 65 precisam continuar passando).
- [ ] **Passo 3: escrever o teste 75**, no formato do 74 (tabela `_tap`, usuários a1 administrador, a2 integrante, a3 consulta, a4 administrador inativo, `pg_temp.claims`). Casos, um `ok`/`is`/`throws_ok` cada:
  - O administrador importa a V2 em sequência num processo em Revisão interna, com `.bpm` e relatório: devolve `criada`, número 2 (não o "maior + 1"), etapa da versão = etapa atual, relatório com `numero_do_relatorio` = o dado.
  - A V1F histórica num processo em Aprovação pelo setor: `criada`, histórica, sem etapa.
  - A V3P piloto depois de uma em sequência e com número menor que o maior: `criada` (as travas de etapa e de ordem saem, ADR 0025 e 0028).
  - Processo em Concluídos recebe a versão (`criada`).
  - O mesmo número de novo: `ja_existia`, sem linha nova em `versoes` nem em `arquivos_da_versao`.
  - Sem `.bpm`: `throws_ok` com `versao_sem_bpm` (ou `historica_sem_arquivo_de_fluxograma` na histórica).
  - Um único evento `importar` de versão, com `autor_id` = a1.
  - Integrante, consulta, inativo: 42501 nas três funções. Visitante (`set local role anon`): sem permissão de execução.
  - Depois da importação, o envio comum continua travado: `registrar_versao_historica` num processo fora de Não iniciados ainda recusa `historica_fora_de_nao_iniciados` (a marca não vaza).
  - `importar_anexo` grava o `.pdf` num processo concluído; a segunda chamada com o mesmo nome devolve `ja_existia`.
  - `anotar_subpasta_da_importacao` acrescenta "Arquivos da subpasta Grupo X." ao fim das Anotações; a segunda chamada não repete.
  - Contar as asserções (`grep -c`) e acertar o `plan(N)`.
- [ ] **Passo 4: rodar e ver falhar.** `npx supabase test db` → as linhas do 75 com `not ok` (função inexistente).
- [ ] **Passo 5: escrever a migração.** Esqueleto:

```sql
-- Importação dos dados atuais, ticket 02 (ADR 0044; ADR 0025 e 0028 afrouxadas só aqui). Não destrutiva.
create function private.importando_versao() returns boolean
language sql stable set search_path = ''
as $$ select coalesce(current_setting('ep.importando_versao', true), '') = 'sim' $$;

create function private.conferir_administrador_da_importacao() returns void
language plpgsql stable set search_path = ''
as $$
begin
  if not (private.perfil_atual() = 'administrador' and private.usuario_ativo()) then
    raise exception 'sem permissão para importar' using errcode = '42501';
  end if;
end $$;

-- Na importação, o processo concluído também recebe versão e anexo.
create or replace function private.conferir_processo_que_recebe_versao(processo uuid) returns void ...
  -- igual à de 20261015224928_versoes.sql, aceitando 'concluido' quando private.importando_versao()

-- Na importação, nenhuma trava de etapa (histórica, piloto, sequência, relatório).
create or replace function private.conferir_onde_cabe_a_versao(processo uuid, tipo text) returns void ...
  -- igual à de 20261026140000_relatorio_numerado.sql, com "if private.importando_versao() then return; end if;" no começo

-- Na importação, o número é o do nome do arquivo (a ordem entre os tipos não se confere; a unicidade fica com versoes_numero_unico).
create or replace function private.preparar_versao() returns trigger ...
  -- igual à de 20261026103000_versoes_por_etapa.sql; com a marca: pula conferir_versao_historica e conferir_numero_da_piloto
  -- e não recalcula new.numero; a etapa continua (nula na histórica)

-- Na importação, o relatório numerado não precisa ser da versão mais recente.
create or replace function private.numerar_relatorio_novo(versao uuid, formato_novo text) returns integer ...

-- O evento da versão importada é "importar".
create or replace function private.registrar_evento_da_versao() returns trigger ...

create function public.importar_versao(p_processo uuid, p_numero integer, p_tipo text, p_arquivos jsonb,
  p_numero_do_relatorio integer default null) returns text
language plpgsql set search_path = ''
as $$
declare
  versao uuid;
begin
  perform private.conferir_administrador_da_importacao();
  if exists (select 1 from public.versoes where processo_id = p_processo and numero = p_numero) then
    return 'ja_existia';
  end if;
  perform set_config('ep.importando_versao', 'sim', true);
  insert into public.versoes (processo_id, numero, historica, piloto)
  values (p_processo, p_numero, p_tipo = 'historica', p_tipo = 'piloto') returning id into versao;
  perform private.gravar_arquivos_da_versao(versao, p_arquivos);
  perform private.conferir_relatorio_importado(versao, p_numero_do_relatorio);
  perform private.cobrar_conferencias_da_versao();
  perform set_config('ep.importando_versao', '', true);
  return 'criada';
end $$;
-- importar_anexo e anotar_subpasta_da_importacao no mesmo molde; grants a authenticated, revoke de public e anon.
```

  `conferir_relatorio_importado` recusa `numero_do_relatorio_mudou:<dado>` quando o número dado difere do pedido (mesma regra do `registrar_versao`). O `insert (numero, historica, piloto)` em `versoes` já tem privilégio de coluna? Conferir com `grep -n "grant insert" supabase/migrations/*versoes*.sql`; se faltar `numero` para a em sequência, a marca resolve no gatilho, que mantém o número dado.
- [ ] **Passo 6: rodar e ver passar.** `npx supabase db reset > /dev/null 2>&1` e `npx supabase test db`: o 75 inteiro com `ok`, e zero `not ok` nos outros arquivos.
- [ ] **Passo 7: commit e push da branch** (migração + teste): `git add <os dois arquivos>`, `git commit`, `git push -u origin importacao-dados-atuais`.
- [ ] **Passo 8: aplicar no desenvolvimento.** `gh workflow run "Migrar banco de desenvolvimento" --ref importacao-dados-atuais -f migracao=<arquivo>` (conferir o nome do campo no `.github/workflows/`), `gh run watch`. Depois, `gh workflow run "Testes de banco" --ref importacao-dados-atuais` e conferir o 75 com todos `ok`.
- [ ] **Passo 9: tipos.** `npm run db:types`; conferir que só entraram as três funções; commit de `src/types/database.ts`.

### Tarefa 2: Função `arquivos-no-drive` aceita a importação

**Arquivos:**
- Criar: `supabase/functions/_shared/importacaoDeArquivos.ts` e `supabase/functions/_shared/importacaoDeArquivos.test.ts`
- Alterar: `supabase/functions/arquivos-no-drive/index.ts`, `acoes.ts` (`recusaDoProcesso`, `iniciarEnvio`), `registrar.ts` (`gravar`), `anexos.ts` (`iniciarEnvioDoAnexo`, `registrarAnexo`)

**Interfaces:**
- Produz (arquivo puro):

```ts
/** O pedido traz `importacao: true`? Ausente vale falso; de outro tipo, recusa. */
export function lerImportacao(corpo: unknown): Validacao<boolean>
/** Só o Administrador ativo importa. */
export function conferirChamadorDaImportacao(chamador: Chamador | null): Recusa | null
/** Na importação, o processo concluído também recebe arquivo. */
export function conferirProcessoDaImportacao(situacao: string): Recusa | null
/** A função do banco e os parâmetros na importação: importar_versao ou importar_anexo. */
export function gravacaoDaImportacao(entrada: EntradaRegistrar, arquivos: ArquivoParaGravar[]): { funcao: 'importar_versao'; parametros: Record<string, unknown> }
```

- Consome: `importar_versao` e `importar_anexo` (Tarefa 1). A resposta do `registrar` na importação é `{ resultado: 'criada' | 'ja_existia' }` (anexo: `'criado' | 'ja_existia'`).

- [x] **Passo 1: teste que falha** em `importacaoDeArquivos.test.ts`: integrante, consulta e inativo recusados; administrador passa; `concluido` e `em_andamento` aceitos, `suspenso` recusado; `importacao: 'sim'` recusado como entrada inválida; parâmetros da histórica (`p_tipo: 'historica'`, sem `p_numero_do_relatorio`), da piloto e da em sequência com relatório.
- [x] **Passo 2:** `npx vitest run supabase/functions/_shared/importacaoDeArquivos.test.ts` → FAIL (módulo inexistente).
- [x] **Passo 3: implementar o arquivo puro** e ligar: `index.ts` lê a marca depois de `conferirChamador` e, com ela, aplica `conferirChamadorDaImportacao`; `recusaDoProcesso` recebe a marca e usa `conferirProcessoDaImportacao`; `registrar.ts` e `anexos.ts` chamam `importar_versao` / `importar_anexo` com a marca. Sem a marca, nada muda.
- [x] **Passo 4:** a mesma linha do Passo 2 passa, e `npx vitest run supabase/functions` inteiro verde; `npx tsc --noEmit -p .` sem erro.
- [x] **Passo 5: commit.** Anotar para o usuário: publicar de novo `arquivos-no-drive` no desenvolvimento (`npx supabase functions deploy arquivos-no-drive --use-api --project-ref yclkzyoebpsxmgpbcbus`, comando dele).

### Tarefa 3: Leitura da pasta

**Arquivos:**
- Criar: `src/importacao/nomeDoArquivoDaPasta.ts`, `src/importacao/lerPasta.ts`, `src/importacao/lerPasta.test.ts`

**Interfaces:**

```ts
export type TipoDaVersao = 'historica' | 'piloto' | 'sequencia'
export type ArquivoDaPasta = { arquivo: File; caminho: string } // caminho = webkitRelativePath
export type VersaoDaPasta = {
  chave: string            // chaveDoProcesso(sigla, nome)
  sigla: string; nomeDoProcesso: string
  numero: number; tipo: TipoDaVersao
  bpm: File; png: File | null; relatorio: File | null; pdfDoRelatorio: File | null
  letraCorrigida: boolean   // algum arquivo veio com letra diferente da do .bpm (43a)
}
export type PastaLida = {
  versoes: VersaoDaPasta[]
  semBpm: { chave: string; rotulo: string }[]                   // 45
  relatoriosDuplicados: { chave: string; rotulo: string }[]      // 48a
  foraDoPadrao: string[]                                         // 47, caminhos
  subpastas: { chave: string; subpasta: string }[]               // 48b
}
export function lerNomeDoArquivo(nome: string): NomeLido | null  // SIGLA_V<n><F|P|>_<Nome>[_Relatório].<ext>
export function lerPasta(arquivos: ArquivoDaPasta[]): PastaLida
```

- [x] **Passo 1: teste que falha**, com `File` inventado e `caminho` montado à mão, um `test` por regra do quarto item do ticket: as três letras; `V1F.bpm` com `V1_Relatório.docx` vira uma versão histórica com `letraCorrigida`; versão sem `.bpm` em `semBpm`; `.png` e relatório ausentes sem aviso; nome fora do padrão e arquivos da raiz em `foraDoPadrao`; `.pdf` de relatório em `pdfDoRelatorio`; dois `.docx` na mesma versão: `relatorio` nulo e a versão em `relatoriosDuplicados`; arquivo em `XYZ/Grupo/` entra no processo e aparece em `subpastas`; nome com acento, vírgula e " - ".
- [x] **Passo 2:** `npx vitest run src/importacao/lerPasta.test.ts` → FAIL.
- [x] **Passo 3: implementar** (expressão do nome: `/^([^_]+)_V(\d+)([FP]?)_(.+?)(_Relatório)?\.([a-z0-9]+)$/i`; a extensão em minúsculas decide o papel).
- [x] **Passo 4:** a mesma linha passa.
- [x] **Passo 5: commit.**

### Tarefa 4: Comparação com V1 a V8 e relatório das lacunas

**Arquivos:**
- Alterar: `src/importacao/colunasDaPlanilha.ts` (ler as colunas V1 a V8 à parte, sem entrar em `COLUNAS`, que exige todas), `src/importacao/lerPlanilha.ts` (cada `ProcessoLido` ganha `versoesNaPlanilha: number[]`, do "x")
- Criar: `src/importacao/lacunasDaPasta.ts`, `src/importacao/lacunasDaPasta.test.ts`

**Interfaces:**

```ts
export type Lacunas = {
  buracos: { chave: string; faltam: number[] }[]
  soNaPasta: { chave: string; numero: number }[]
  soNaPlanilha: { chave: string; numero: number }[]
}
export function lacunasDaPasta(pasta: PastaLida, planilha: PlanilhaLida): Lacunas
```

- [ ] **Passo 1: teste que falha:** V1 e V3 sem V2 dá buraco [2]; V4 na pasta sem "x" na planilha; "x" em V2 sem arquivo; a planilha sem as colunas V continua lida (V1 a V8 opcionais). Acrescentar em `lerPlanilha.test.ts` o caso do "x".
- [ ] **Passo 2:** `npx vitest run src/importacao` → FAIL nos casos novos.
- [ ] **Passo 3: implementar.**
- [ ] **Passo 4:** `npx vitest run src/importacao` verde (inclusive os testes antigos da planilha).
- [ ] **Passo 5: commit.**

### Tarefa 5: Contrato, versão real e falsos

**Arquivos:**
- Alterar: `src/importacao/tipos.ts`, `src/importacao/importacaoSupabase.ts`, `src/importacao/importacaoSupabase.test.ts`, `src/importacao/ImportacaoFalso.ts`, `src/importacao/ImportacaoFalso.test.ts`
- Alterar: a vitrine (`grep -rn "ImportacaoFalso\|importacao" src/vitrine src/lib/acesso.ts`) para a versão falsa ter processos e versões inventados, inclusive o estado vazio e o de erro
- Alterar: `src/cadastros/historicoDosCadastros.ts` (`importar: 'Importou a versão'` em `TEXTO_DA_ACAO_DA_VERSAO`) e o teste `historicoDaImportacao.test.ts`

**Interfaces:**

```ts
export type ProcessoDaPasta = {
  id: string; chave: string; situacao: string
  versoes: number[]               // números que já existem
  maiorRelatorio: number          // 0 se nenhum
}
export type PedidoDeImportacaoDeVersao = {
  processoId: string; numero: number; tipo: TipoDaVersao
  numeroDoRelatorio: number | null
  arquivos: ArquivoEscolhido[]    // bpm, png?, relatorio?
}
// novos métodos em ModuloDeImportacao:
listarProcessosDaPasta(): Promise<{ processos: ProcessoDaPasta[]; haImportado: boolean }>
importarVersao(pedido: PedidoDeImportacaoDeVersao, aoProgredir: (enviados: number, total: number) => void): Promise<'criada' | 'ja_existia'>
importarAnexo(processoId: string, arquivo: File): Promise<'criado' | 'ja_existia'>
anotarSubpasta(processoId: string, subpasta: string): Promise<void>
```

  `importacaoSupabase` usa `chamarFuncao` e o envio dos bytes de `src/versoes/funcaoDoDrive.ts`, com `importacao: true` em cada pedido; `listarProcessosDaPasta` faz três leituras ao todo, sem uma por processo (`processos_com_andamento`, `versoes(processo_id, numero)`, `arquivos_da_versao(numero_do_relatorio, versoes(processo_id))`), e `haImportado` lê um evento `importar` de processo (`limit 1`). O `ImportacaoFalso` recebe um `VersoesFalso` e grava nele, para a versão importada aparecer no painel do processo (história 55), com falha programável por nome de arquivo (`falharNoArquivo`).

- [ ] **Passo 1: testes que falham:** `importacaoSupabase.test.ts` (cliente simulado: o corpo do `iniciar_envio` e do `registrar` leva `importacao: true`, os parâmetros do relatório, a tradução da recusa) e `ImportacaoFalso.test.ts` (versão existente devolve `ja_existia`; a falha programada lança).
- [ ] **Passo 2:** `npx vitest run src/importacao src/cadastros/historicoDaImportacao.test.ts` → FAIL.
- [ ] **Passo 3: implementar.**
- [ ] **Passo 4:** a mesma linha passa; `npx tsc --noEmit -p .` sem erro.
- [ ] **Passo 5: commit.**

### Tarefa 6: Plano de envio e envio versão a versão

**Arquivos:**
- Criar: `src/importacao/previaDaPasta.ts`, `src/importacao/enviarPasta.ts`, `src/importacao/frasesDaPasta.ts`

**Interfaces:**

```ts
export type PreviaDaPasta = {
  porProcesso: { chave: string; nome: string; entram: VersaoDaPasta[]; puladas: number[] }[]
  semProcesso: string[]           // arquivos de sigla+nome sem processo na plataforma (47)
  pasta: PastaLida; lacunas: Lacunas
  totalDeArquivos: number
}
export function montarPreviaDaPasta(pasta: PastaLida, existentes: ProcessoDaPasta[], lacunas: Lacunas): PreviaDaPasta
export type ResumoDaPasta = { criadas: number; puladas: number; falhas: string[]; avisos: string[] }
export async function enviarPasta(importacao: ModuloDeImportacao, previa: PreviaDaPasta, existentes: ProcessoDaPasta[],
  aoAndar: (enviados: number, total: number) => void): Promise<ResumoDaPasta>
```

  O número do relatório: por processo, `maiorRelatorio + 1`, somado a cada versão que não é histórica e leva relatório, na ordem crescente do número. A falha de uma versão vai para `falhas` com o rótulo e o motivo, e o envio segue (53); o `.pdf` do relatório vai por `importarAnexo` depois da versão; a linha da subpasta, por `anotarSubpasta`, uma vez por processo.

- [ ] **Passo 1: testes pela tela, na Tarefa 7** (a spec põe o ponto de teste na tela). Nesta tarefa, só `npx tsc --noEmit -p .`.
- [ ] **Passo 2: implementar.**
- [ ] **Passo 3: commit junto com a Tarefa 7** (código sem teste não vai sozinho).

### Tarefa 7: Seção "2. Arquivos das versões"

**Arquivos:**
- Criar: `src/hooks/useImportacaoDaPasta.ts`, `src/components/administracao/SecaoDosArquivos.tsx`, `src/components/administracao/PreviaDaPasta.tsx`, `src/components/administracao/ResumoDaPasta.tsx`
- Alterar: `src/components/administracao/AreaDaImportacao.tsx` (troca o "Ainda não disponível")
- Criar: `src/App.importacaoDaPasta.test.tsx` (montagem igual à de `App.importacao.test.tsx`; ajudante `arquivoDaPasta(caminho)`)

Fases: escolher (a pasta e o .csv da planilha) → prévia → enviando (N de M arquivos) → resumo. A seção fica desabilitada, com uma linha dizendo por quê, enquanto `haImportado` é falso.

- [ ] **Passo 1: testes que falham**, um `test` por comportamento:
  - Seção desabilitada sem processo importado; habilitada com.
  - A prévia por processo: versões que entram, relatório ligado, o que falta (sem `.bpm`) e o que sobra (sem processo, fora do padrão); nada enviado antes de confirmar (o falso sem gravação).
  - Confirmar: andamento "N de M"; o resumo com criadas, puladas, não entradas e avisos (letra corrigida, relatório duplicado, subpasta).
  - Relatório das lacunas: buraco, só na pasta, só na planilha.
  - A falha de um arquivo aparece no resumo e as outras versões entram; a segunda rodada envia só a que faltou e pula as outras.
  - A versão importada aparece no painel do processo, com o nome padrão do arquivo (`VersoesFalso`).
  - Integrante e consulta não veem a aba (já coberto em `App.importacao.test.tsx`; conferir).
- [ ] **Passo 2:** `npx vitest run src/App.importacaoDaPasta.test.tsx` → FAIL.
- [ ] **Passo 3: implementar** (Tarefa 6 + esta).
- [ ] **Passo 4:** a mesma linha passa; `npx eslint src` e `npm test` verdes.
- [ ] **Passo 5: commit** (Tarefas 6 e 7).

### Tarefa 8: Conferência na vitrine e registros

**Arquivos:**
- Alterar: `.scratch/importacao-dados-atuais/desvios.md` (as três interpretações do topo, datadas), `.scratch/importacao-dados-atuais/issues/02-arquivos-das-versoes-da-pasta.md` (caixas)

- [ ] **Passo 1:** `preview_start` com `vitrine`; abrir `#/administracao?perfil=administrador`, aba Importação; conferir a seção 2 no computador e em 375 px (texto curto, uma ação principal, nada repetido; ticket `[visual]`). Encerrar o servidor e fechar a pré-visualização.
- [ ] **Passo 2:** registrar no `desvios.md` e marcar as caixas do ticket.
- [ ] **Passo 3: commit.** O passo do usuário (publicar `arquivos-no-drive` de novo no desenvolvimento e, antes da carga real, o backup da produção e a publicação das migrações e da função) vai para o `proximo-passo.md` no fim do `/executar-complexo`.
