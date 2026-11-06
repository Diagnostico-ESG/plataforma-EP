# Importação dos dados atuais, ticket 01 (cadastros e etapas pela planilha): plano de execução

> Para execução: `superpowers:executing-plans`, tarefa a tarefa, marcando as caixas. Requisitos: spec `importacao-dados-atuais` (histórias 1 a 40), ticket `issues/01-cadastros-e-etapas-pela-planilha.md`, `amostra/cabecalho.md`, ADR 0044. O plano só traz ordem, arquivos e o teste de cada tarefa.

**Objetivo:** o Administrador importa a aba PRODUTO 33 (.csv) por Administração → Importação, vê a prévia, confirma e os processos entram nos setores e etapas certos.
**Arquitetura:** operação de banco `public.importar_processo` (por processo, inteiro ou nada) → contrato `importacao` (Supabase e Falso) → módulo puro de leitura do .csv → tela (nova aba).
**Regras de banco que valem (`.claude/regras/banco.md`):** teste pgTAP antes da migração; migração não destrutiva com tipos no mesmo commit; função `security definer` só em `private`, `search_path` vazio, execução só a `authenticated`; segurança na RLS/função, não na tela; alvo do banco conferido antes de comando que altere o remoto (este ticket usa o Docker local; remoto só pelo workflow "Migrar banco de desenvolvimento").
**Restrições globais:** TypeScript sem `any`; funções 4–20 linhas; arquivos ≤300 linhas; sem dependência nova (leitura do .csv na mão); dados de teste inventados (setores XYZ e ABC, "Exemplo Alfa"); termos da tela seguem o `CONTEXT.md` (nada de "prévia/falso" como termo de domínio além do nome do botão); sem texto redundante na tela.

## Decisões de execução (dependem do que já existe no banco)

- Setor: sigla em maiúsculas (gatilho já faz), nome = sigla; reaproveita por `upper(sigla)`. Macroprocesso é global (sem `setor_id`): reaproveita por `lower(nome)`; o vínculo setor–macroprocesso nasce pelo gatilho `preparar_processo`. "A definir" é um macroprocesso comum.
- Processo existente = mesmo setor e `lower(btrim(nome))` (índice `processos_nome_unico`).
- **Marca de sessão `ep.importando_etapa`** (código da etapa, ligada só dentro da função, em `set_config(..., true)`): `abrir_primeira_passagem` abre a passagem já na etapa certa (etiqueta `a_fazer` em `nao_iniciados`; `concluido` = "Finalizado" nas demais, inclusive `concluidos`); `dar_responsavel_inicial_ao_cadastrar` usa o responsável inicial dessa etapa (nulo em Concluídos); `registrar_evento_do_processo` não grava o evento "criar" enquanto a marca estiver ligada. A função grava ela mesma o único evento `importar` (autor = quem importou; `depois` = estado do processo + etapa). Sem `mover_processo`: não há movimento no histórico.
- `publicado_em`, `data_da_modelagem_piloto` e `anotacoes` entram no próprio insert (a função roda como dono). Concluídos: depois da passagem, `private.gravar_tirada_do_quadro(id, clock_timestamp())` (a view só considera tirado se a marca for posterior à entrada).
- Falha no meio: a tela grava processo por processo, para na primeira falha e diz quantos entraram; rodar de novo pula o que existe.
- Códigos das etapas: Modelagem Piloto → `modelagem`; Modelagem Técnica e V - Relatório Piloto → `relatorio_modelagem_tecnica`; Revisão Interna → `revisao_interna`; VI → `aprovacao_setor`; VII concluída → `concluidos` (sem data: `publicacao`, aviso); sem nenhum "Concluído" nessas colunas → `nao_iniciados`.

## Mapa de arquivos

- Banco: `supabase/tests/74_importar_processo.test.sql` (novo), `supabase/migrations/<ts>_importar_processo.sql` (via `npx supabase migration new`), `src/types/database.ts` (gerado).
- Leitura: `src/importacao/csv.ts` (texto → linhas de células), `src/importacao/lerPlanilha.ts` (regras → `PlanilhaLida`), `src/importacao/colunasDaPlanilha.ts` (cabeçalho e mapa de etapas), `src/importacao/datasDaPlanilha.ts` (datas), `src/importacao/tipos.ts` (tipos e `ModuloDeImportacao`).
- Contrato: `src/importacao/importacaoSupabase.ts`, `src/importacao/ImportacaoFalso.ts`, `src/main.tsx` e `src/App.tsx` (ligação).
- Tela: `src/components/administracao/AreaDaImportacao.tsx`, `PreviaDaImportacao.tsx`, `ResumoDaImportacao.tsx`, `src/hooks/useImportacaoDaPlanilha.ts`, `src/importacao/frasesDaImportacao.ts`, `AreaDeAdministracao.tsx` (aba), `Administracao.css`.
- Histórico: `src/cadastros/historicoDosCadastros.ts` (frase da ação `importar`).

## Tarefas

### Tarefa 0 — Branch
- [x] `git status` limpo (só `devflow-mestra/` fora, decisão do usuário); `git switch -c importacao-dados-atuais` a partir da `main`. Marco `marco/2026-11-05-inicio-importacao-dados-atuais` já existe e cobre o início da funcionalidade.
- [x] Docker no ar e banco local alvo: conferir `supabase/AMBIENTES.md` (vínculo atual = desenvolvimento remoto, não tocado) e `npx supabase start` (descartar a saída, traz chaves).

### Tarefa 1 — Banco (teste primeiro)
Arquivos: `supabase/tests/74_importar_processo.test.sql`, migração nova, `src/types/database.ts`.
- [x] Ler `supabase/tests/69_tirar_do_quadro.test.sql` como molde (usuários a1 administrador, a2 integrante, a3 consulta, a4 administrador inativo; `_tap`; `claims`).
- [x] Escrever o teste 74, que falha por a função não existir: recusa a2, a3, a4 e visitante (42501, nada criado); a1 cria setor XYZ (nome = sigla) e macroprocesso só se faltam e reaproveita os existentes (setor com sigla em outra caixa, macroprocesso por nome sem caixa); processo existente (outra caixa, espaços) devolve `ja_existia` e nada muda; etapa e etiqueta certas por código (`nao_iniciados` A fazer, `modelagem`/`aprovacao_setor` Finalizado, uma passagem só, `entrou_em` = agora); responsável = inicial válido da etapa e nulo em Concluídos; Concluídos com `publicado_em`, `no_quadro = false` na view e `tirado_do_quadro_em` posterior à entrada; `data_da_modelagem_piloto`, `anotacoes` gravadas; exatamente um evento `importar` (autor = a1, com etapa) e nenhum `criar`/`mover` do processo; etapa inexistente ou inativa recusa e não deixa setor/macroprocesso criado; futuro no `data_da_modelagem_piloto` recusa inteiro; marca de sessão desligada depois (um cadastro comum seguinte volta a gerar `criar` e a passagem em Não iniciados); `anon` e `public` sem execução; `00_rls_ligada` e `46_funcoes_e_views_seguras` seguem passando.
- [x] `npx supabase test db`: ver o teste novo falhar (contar `ok`/`not ok`; "FAIL" do comando é o formato).
- [x] `npx supabase migration new importar_processo` e escrever: `create or replace` de `private.abrir_primeira_passagem`, `private.dar_responsavel_inicial_ao_cadastrar` e `private.registrar_evento_do_processo` (cada uma igual à vigente, mais a marca); `private.importar_processo(...)` (definer, `search_path` vazio, confere Administrador ativo, cria o que falta, grava, evento, devolve `'criado'`/`'ja_existia'`); `public.importar_processo(p_setor text, p_macroprocesso text, p_nome text, p_etapa text, p_data_da_publicacao date, p_data_da_modelagem_piloto date, p_anotacoes text) returns text` (invoker, só chama a privada); `revoke ... from public, anon` e `grant ... to authenticated`. Recusas como `motivo:valor` em P0001 (`etapa_invalida:<codigo>`) e 42501 para perfil.
- [x] `npx supabase db reset` (local), `npx supabase test db`: todos os `ok`, nenhum `not ok`, incluindo 00, 01 e 46.
- [x] `npx supabase gen types --local` para `src/types/database.ts` (conferir que só a função nova entrou).
- [x] Commit: teste, migração e tipos juntos.

### Tarefa 2 — Leitura do .csv (módulo puro)
Arquivos: `src/importacao/csv.ts`, `colunasDaPlanilha.ts`, `datasDaPlanilha.ts`, `lerPlanilha.ts`, `tipos.ts` (+ um `.test.ts` ao lado de cada módulo de regra: `csv.test.ts`, `lerPlanilha.test.ts`).
- [x] Testes que falham, com .csv inventado em texto (`;` e `,`, BOM, campo entre aspas com quebra de linha): cabeçalho achado na linha que contém "Área" e "Processos" (linhas de título antes ignoradas); colunas faltando recusadas com a lista dos nomes que faltam (`ColunasFaltando`); coluna D ignorada; etapa pela última coluna "Concluído" ("Não realizada" conta; I, II e III não decidem); sem nenhum → Não iniciados; VII concluída → Concluídos com a data; sem data → `publicacao` + aviso; macroprocesso sem numeral romano e sem " - "; "Subprocesso Geral", "Subprocesso de eventos", "DL - DIRETOR LEGISLATIVO" e vazio → "A definir" (testar "DL" antes de tirar o numeral); data "16 10 2026" e "01/09/2026" aceitas, outras ignoradas com aviso, data futura do piloto ignorada com aviso; data do piloto em Não iniciados ignorada com aviso; "Concluído" depois de coluna vazia vale como última e avisa; nome com " - " segue como processo; linha repetida (mesmo setor e nome sem caixa/espaços) vale a primeira e a segunda vai para `repetidos`; Observações viram `anotacoes` (acima de 8000 caracteres: corta e avisa); linha totalmente vazia ignorada.
- [x] Implementar o mínimo (funções de 4–20 linhas; `lerPlanilha(texto, hoje)` devolve `{ processos, repetidos, avisos }`); `decodificarArquivo(buffer)` (UTF-8; se inválido, windows-1252) em `csv.ts` com teste de acento.
- [x] `npx vitest run src/importacao`, `npm run lint`, `npm run typecheck`; commit.

### Tarefa 3 — Contrato `importacao`, Falso e histórico
Arquivos: `src/importacao/tipos.ts` (`ModuloDeImportacao`: `listarExistentes()` → setores, macroprocessos e processos existentes; `gravarProcesso(item)` → `'criado' | 'ja_existia'`), `importacaoSupabase.ts`, `ImportacaoFalso.ts`, `src/cadastros/historicoDosCadastros.ts`, `src/main.tsx`, `src/App.tsx`.
- [x] Testes que falham: `importacaoSupabase.test.ts` com `ClienteSupabaseFalso` (chama a função `importar_processo` com os 7 parâmetros certos; lê existentes pelas tabelas `setores`, `macroprocessos` e a view `processos_com_andamento`; 42501 vira `TravaDoBanco` com a frase de perfil; `etapa_invalida` vira frase); `ImportacaoFalso.test.ts` (grava, pula existente, falha programada); `historicoDosCadastros.test.ts`: ação `importar` do processo aparece como "Importou da planilha".
- [x] Implementar os três; no `ImportacaoFalso`, receber opcionalmente `CadastrosFalso` e `ProcessosFalso` para o processo importado aparecer nas telas (ler a API deles antes). Ligar o módulo em `main.tsx` e `App.tsx` (prop `importacao`). Comentário `ponytail:` no limite de 1000 linhas por leitura em `listarExistentes`.
- [x] Atualizar todos os `render(<App ...>)` dos testes existentes só se o tipo exigir a prop (tornar obrigatória e passar `new ImportacaoFalso()` pelo helper comum, ou deixar opcional se isso evitar tocar dezenas de arquivos: preferir opcional só enquanto a tarefa 4 não fechar, depois obrigatória com ajuste mínimo).
- [x] `npx vitest run`, lint, typecheck; commit.

### Tarefa 4 — Tela
Arquivos: `AreaDaImportacao.tsx`, `PreviaDaImportacao.tsx`, `ResumoDaImportacao.tsx`, `useImportacaoDaPlanilha.ts`, `frasesDaImportacao.ts`, `AreaDeAdministracao.tsx`, `Administracao.css`.
- [x] Aba "Importação" depois de "Planilhas", só para o Administrador (a trava do perfil já está no componente; o endereço direto cai na mensagem de sem permissão). Estados: escolher → prévia → gravando → resumo; erro de coluna faltando com os nomes; falha no meio com "entraram N". Seção "2. Arquivos das versões" desabilitada (ticket 02). Textos curtos: o que a etapa 1 faz, que nada grava antes de confirmar; sem repetir a contagem em dois lugares.
- [x] Testes (tarefa 5) escritos antes de cada comportamento; implementar até passarem.
- [x] Ver a tela pela vitrine local (`preview_start`) com .csv inventado; capturar para o `[visual]`.
- [x] `npx vitest run`, lint, typecheck, `npm run check:circular`; commit.

### Tarefa 5 — Testes pela tela (`src/App.importacao.test.tsx`, padrão `App.planilhas.test.tsx`)
- [x] Casos (todos pela tela, com `AcessoFalso` administrador, `CadastrosFalso`, `ProcessosFalso`, `ImportacaoFalso`): aba só para administrador (integrante, consulta e endereço direto não abrem nada); prévia com contagens, etapa por processo, pulados ("já existia"), avisos; arquivo com colunas faltando recusado com quais faltam; nada gravado antes de confirmar; [Confirmar] só habilitado com algo a gravar; resumo com criados, pulados e avisos; falha no meio diz o que já entrou; segunda rodada pula o que existe; os processos importados aparecem na Lista/Quadro/Cadastros nas etapas certas; seção 2 desabilitada.
- [x] Rodar o conjunto inteiro (`npm test`) e conferir cobertura do que é novo.

### Tarefa 6 — Fechamento do ticket
- [x] `npm test`, `npm run lint`, `npm run typecheck`, `npm run check:circular` limpos; `npx supabase test db` limpo.
- [x] Marcar as caixas deste plano e as do ticket; registrar o passo do usuário (backup da produção antes da carga real) no ticket.
- [x] `git push` da branch (autorizado) e conferir o workflow "Testes de banco" na branch; disparar o workflow "Migrar banco de desenvolvimento" na branch (autorizado) e ler o resultado, se ele existir; senão, avisar o usuário.
- [x] Merge na `main` (`git switch main`, `git merge`), `git branch -d importacao-dados-atuais`, linha `Concluído em` no ticket, `.scratch/proximo-passo.md`, `.scratch/melhorias-protocolo.md` (itens não testados do `/executar-complexo`), commit e `git push` da `main`.
