# Fase do Regimento no catálogo — plano de execução (ticket 01)

> **Para quem executa:** use `superpowers:executing-plans`. Marque as caixas (`- [x]`) ao terminar cada passo.

**Meta:** cada etapa do catálogo ganha a Fase do Regimento (IV a IX), obrigatória, escolhida pelo Administrador.

**Ticket:** `.scratch/exportacao-e-manutencao/issues/01-fase-do-regimento-no-catalogo.md` (critérios citados como "critério N"). **Spec:** `.scratch/exportacao-e-manutencao/spec.md`, histórias 1 a 8 e seção "Modelo de dados".

**Branch:** `exportacao-e-manutencao-01` (já criada; isolamento feito, sem worktree). Marco: `marco/2026-10-20-inicio-exportacao-e-manutencao-01`.

## Regras de `.claude/regras/banco.md` que valem

- Teste de banco antes da migração; migração com `npx supabase migration new`; migração, teste e tipos no mesmo ciclo.
- Vínculo conferido antes de `db:types` (linha "vínculo atual" de `supabase/AMBIENTES.md` = `yclkzyoebpsxmgpbcbus`, desenvolvimento).
- Função sem `security definer` (a RLS de `etapas` decide); privilégios de coluna: `insert` e `update` da coluna nova só a `authenticated`, políticas de hoje (só Administrador ativo).
- A rede do escritório só abre a porta 443: o teste de banco roda no GitHub Actions ("Testes de banco") e a migração no dev vai pelo workflow "Migrar banco de desenvolvimento" (ambos autorizados na branch, ver "Ajustes deste Projeto" do `CLAUDE.md`). Não há `gh`: disparar pelo navegador do app.

## Decisões deste plano (do ticket e da spec, sem novidade)

- Parâmetro novo de `acrescentar_etapa`: `p_fase public.fase_do_regimento`, entre `p_obrigatoria` e `p_antes_de` → assinatura `(text, text, boolean, public.fase_do_regimento, uuid)`.
- Etapa existente que não é uma das seis conhecidas (o dev pode ter etapa criada à mão) recebe, na migração, a fase da etapa anterior na ordem (ou IV, se não houver). Registrar no `desvios.md`.
- A mudança de fase vira evento `editar` pelo gatilho que já existe, porque `estado_da_etapa` passa a levar `fase` (`acao_da_etapa` já trata o que não é só ordem como `editar`).

## Arquivos

- Banco: `supabase/migrations/<timestamp>_fase_do_regimento.sql` (novo), `supabase/tests/42_fase_do_regimento.test.sql` (novo), ajuste das chamadas de `acrescentar_etapa` em `22_catalogo_de_etapas`, `34_sem_etapas_do_setor` (assinatura no `has_function`) e `35_avancar_etapa`.
- Tipos: `src/types/database.ts` (gerado), `src/processos/tipos.ts`.
- Módulo: `src/processos/catalogoSupabase.ts` (+ `.test.ts`), `src/processos/CatalogoFalso.ts` (+ `.test.ts`).
- Tela: `src/components/administracao/FormularioDaEtapa.tsx`, `TabelaDoCatalogo.tsx`, `CatalogoEditavel.tsx`; `src/processos/validacaoDaEtapa.ts` (+ teste); `src/cadastros/historicoDosCadastros.ts` (+ teste).
- Fixtures: `src/testes/catalogoDeTeste.tsx` e o que o `tsc` apontar.
- Fase compartilhada: `src/processos/fasesDoRegimento.ts` (novo: lista IV a IX e o tipo).

## Tarefas

### Tarefa 1 — Teste de banco que falha (critério 1)

- [ ] Criar `supabase/tests/42_fase_do_regimento.test.sql` no formato do teste 22 (tabela `_tap`, usuários inventados a1 a4, exceção final com o relatório). Casos: etapa sem fase recusada (23502); fase fora de IV a IX recusada (22P02); as seis etapas atuais com a fase da sabatina (modelagem IV; relatorio_modelagem_tecnica V; revisao_interna, revisao_setor, aprovacao_setor VI; publicacao VII); `acrescentar_etapa` grava a fase; mudar a fase gera evento `editar` com `fase` no antes e no depois; Integrante, Consulta, administrador desativado e visitante não mudam a fase (a linha segue igual); o Administrador muda a fase de uma etapa protegida (`revisao_interna`).
- [ ] Trocar as chamadas de `acrescentar_etapa` nos testes 22, 34 (`has_function`) e 35 pela assinatura nova, com a fase (ex.: `'VI'`).
- [ ] Commit só dos testes e `git push -u origin exportacao-e-manutencao-01`. Disparar "Testes de banco" na branch: esperado falhar no 42 e nos três ajustados (função com assinatura antiga). Anotar o número da execução.

### Tarefa 2 — Migração e tipos (critério 1)

- [ ] `npx supabase migration new fase_do_regimento`. Conteúdo, nesta ordem: `create type public.fase_do_regimento as enum ('IV','V','VI','VII','VIII','IX')`; `alter table public.etapas add column fase public.fase_do_regimento`; `update` das seis por código; `update` do restante pela fase da etapa anterior na ordem (senão IV); `alter column fase set not null`; `grant insert (fase)` e `grant update (fase)` a `authenticated`; `create or replace private.estado_da_etapa` com `'fase', etapa.fase`; `drop function public.acrescentar_etapa(text, text, boolean, uuid)` e recriar com `p_fase`, gravando a fase, com `revoke ... from public, anon` e `grant execute ... to authenticated`.
- [ ] Conferir o alvo (vínculo atual e `supabase/.temp/project-ref` se existir), commit e push. Disparar "Migrar banco de desenvolvimento" na branch com o nome do arquivo; depois "Testes de banco": esperado os 43 arquivos verdes, o 42 com todos os casos.
- [ ] `npm run db:types` (vínculo conferido) e conferir que `etapas` ganhou `fase`, `fase_do_regimento` entrou em `Enums` e `acrescentar_etapa` ganhou `p_fase`. Commit da migração + tipos + ajustes.

### Tarefa 3 — Tipos e lista de fases na interface

- [ ] Criar `src/processos/fasesDoRegimento.ts` com `FASES_DO_REGIMENTO = ['IV','V','VI','VII','VIII','IX'] as const` e `type FaseDoRegimento`.
- [ ] `src/processos/tipos.ts`: `EtapaNoCatalogo` ganha `fase: FaseDoRegimento`; `EtapaNova` e `DadosDaEtapa` ganham `fase: FaseDoRegimento`.
- [ ] Rodar `npx tsc -b` e ajustar fixtures e testes que montam `EtapaNoCatalogo` (`catalogoDeTeste.tsx`: Modelagem IV, Relatório V, Publicação VII, Arquivamento VII). Sem mudar comportamento: `npm test` verde.

### Tarefa 4 — Módulo real (critério 5)

- [ ] Teste em `catalogoSupabase.test.ts`, antes do código: `listarCatalogo` pede a coluna `fase`; `acrescentarEtapa` chama `acrescentar_etapa` com `p_fase`; `editarEtapa` grava `fase` no `update`; falha ao gravar a fase chega como `TravaDoBanco`/erro no padrão dos outros casos. Ver falhar.
- [ ] `catalogoSupabase.ts`: incluir `fase` no `select`, em `p_fase` e no `update`. Ver passar.

### Tarefa 5 — Módulo falso (critério 5)

- [ ] Teste em `CatalogoFalso.test.ts`: acrescentar guarda a fase; editar troca a fase; a lista devolve a fase. Ver falhar.
- [ ] `CatalogoFalso.ts`: `acrescentarEtapa` e `editarEtapa` levam `fase`. Ver passar.

### Tarefa 6 — Validação e formulário (critérios 2 e 3)

- [ ] Teste em `validacaoDaEtapa.test.ts`: fase vazia dá "Escolha a fase do Regimento."; fase escolhida não dá problema. Ver falhar; estender `problemaNaEtapa` com `fase`.
- [ ] Teste de tela (`App.catalogoAcoes.test.tsx`, com as falsas): criar etapa sem fase mostra a frase e não perde o preenchido; com fase grava; [Editar] traz a fase atual e a troca; falha ao gravar a fase aparece no formulário e mantém os dados. Ver falhar.
- [ ] `FormularioDaEtapa.tsx`: campo "Fase do Regimento" (`<select>` com opção vazia "Escolha…" e as seis fases, sem valor na criação, valor atual na edição), enviado em `aoSalvar`. `CatalogoEditavel.tsx`: `dadosDaEdicao` e `etapaNova` levam `fase`. Manter o arquivo do formulário abaixo de 300 linhas e a função de envio dentro dos limites (extrair o campo para `CampoDaFase.tsx` se precisar). Ver passar.

### Tarefa 7 — Tabela e histórico (critérios 3 e 4)

- [ ] Testes: `App.catalogoDeEtapas.test.tsx` — a tabela tem a coluna "Fase" com a fase de cada etapa. `historicoDoCatalogo.test.ts` — evento `editar` com `fase` V → VI mostra "Fase: V → VI". Ver falhar.
- [ ] `TabelaDoCatalogo.tsx`: coluna `Fase`. `historicoDosCadastros.ts`: rótulo do campo `fase` ("Fase") e a forma "antes → depois" para o campo que mudou, no mesmo ponto em que o histórico já descreve a edição (ler antes como o histórico mostra hoje "Obrigatória" mudando; seguir esse padrão). Ver passar.

### Tarefa 8 — Fecho do ticket

- [ ] `npm test`, `npx tsc -b` e lint passando (o pre-commit confere). [visual] critério 6: abrir a vitrine local (módulos falsos) no notebook (1366×768) e conferir o campo e a coluna; se a tela não puder ser conferida, registrar como presumido.
- [ ] `supabase/AMBIENTES.md`: linha da migração aplicada, com os números das execuções (padrão das linhas anteriores). `.scratch/exportacao-e-manutencao/desvios.md` (novo, se houver desvio): a escolha da fase das etapas desconhecidas e qualquer ajuste de teste antigo.
- [ ] Marcar os critérios do ticket e fechar pelo passo 4 do `/executar-complexo` (merge na `main`, `git branch -d`, linha `Concluído em`, push).
