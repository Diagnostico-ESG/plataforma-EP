# Plano do ticket 23: Anotações do processo

> **Para quem executa:** use `superpowers:executing-plans`, tarefa por tarefa, marcando as caixas (`- [x]`). Branch comum `processos-etapas-23`, sem worktree (o isolamento já está feito). Marco `marco/2026-10-23-inicio-ticket-23-processos-etapas` antes da Tarefa 1 (passo grande: migração nova).

**Objetivo:** o verso do cartão ganha o bloco "Anotações" no alto da coluna direita, acima da Reunião: um texto livre por processo, compartilhado, que se grava sozinho (1 segundo depois da última tecla e ao sair do campo), recusa gravar por cima de quem alterou antes e não vai para o Histórico (ADR 0021).

**Arquitetura:** três colunas novas em `processos` (texto, hora e autor da última alteração) fora da view, do pacote das planilhas e do estado dos eventos; uma função de gravar que compara o texto esperado com o do banco (sem `security definer`, perfil pela RLS que já existe); um gatilho que preenche autor e hora. Na tela, uma classe `GravadorDeAnotacoes` (fora do React, testável com o relógio simulado) cuida da pausa, da fila de uma gravação por vez, da falha e do conflito; um hook a liga ao componente; o verso guarda a saída (fechar, Esc, pai/subprocesso, Histórico, Editar) com um gancho que grava na hora ou pede confirmação.

**Requisitos:** `.scratch/processos-etapas/issues/23-anotacoes-do-processo.md` (critérios citados como "critério N do ticket 23", de cima para baixo, 1 a 8) e a spec (histórias 173 a 198; "Interface", verso, coluna direita, Anotações; "Modelo de dados"; "Migração das Anotações"; "Decisões de teste", Anotações; "Observações", Anotações), ADR 0021 e o termo "Anotações" no `CONTEXT.md`.

**Regras do `.claude/regras/banco.md` que valem (li o arquivo inteiro):** o teste de banco vem antes da migração e se vê falhar; migração só por `npx supabase migration new`, não destrutiva; a RLS de `processos` já cobre o perfil (nenhuma tabela nova, então nenhuma política nova), e cada célula nova da tabela "quem pode o quê" ganha teste com um usuário de cada perfil, um inativo e um visitante; função nova em `public` sem `security definer`, com `search_path` vazio, `revoke` de `public` e `anon` e `grant` só a `authenticated`; nada novo na view (o `select` de colunas uma a uma já deixa as Anotações de fora; dado que não se calcula, então coluna guardada); a interface fala só pelo cliente de `src/lib/supabase.ts`; a migração vai ao desenvolvimento pelo workflow "Migrar banco de desenvolvimento" e entra em `supabase/AMBIENTES.md`; `db:types` depois, com o vínculo conferido (`yclkzyoebpsxmgpbcbus`). Produção fica para o `/ship`.

## Restrições gerais

- Sem dependência nova. ESLint: função de lógica até 20 linhas (hook até 40; `.tsx` sem limite de função), arquivo até 300, complexidade até 10. `tsconfig` pode ter `erasableSyntaxOnly`: nada de propriedade de parâmetro em construtor (declare o campo e atribua).
- Toda tarefa de código termina com `npm test`, `npm run lint` e `npm run typecheck` verdes. Testes de tela instáveis sob carga (backlog): repita o arquivo isolado antes de concluir que falhou de verdade.
- Textos da tela exatamente como na spec, com acentos. Dados de teste inventados (nada de nome real nem de texto de anotação real).
- Arquivos com CRLF: trocas pela ferramenta de edição. Arquivos novos pela ferramenta de arquivo, nunca por heredoc.
- Cada commit leva cerca de 1 minuto (o pré-commit roda a bateria inteira). Comece cada chamada do Bash com `cd` para a raiz do projeto.
- Os workflows do GitHub rodam na branch de trabalho, autorizados pelo `CLAUDE.md` (Ajustes deste Projeto): `git push` sem `--force`, "Testes de banco" e "Migrar banco de desenvolvimento". Se o `gh` não estiver autenticado, peça ao usuário para apertar o "Run workflow".

## Decisões deste plano (vão para o `desvios.md` na Tarefa 7)

1. **O salvamento é uma classe, `GravadorDeAnotacoes`, fora do React.** Pausa, fila de uma gravação por vez, falha e conflito são a parte difícil do ticket; fora do React ela se testa com o relógio simulado, sem montar tela. O hook só a liga ao componente (os limites do ESLint também pedem a divisão).
2. **A frase de falha é fixa** ("Não foi possível salvar. Seu texto continua aqui"), qualquer que seja o motivo (conexão, arquivado, perfil), como a spec escreve. O motivo técnico não aparece.
3. **Autor e hora vêm do banco** (`clock_timestamp()` no gatilho, não `now()`, para a hora mudar de verdade dentro de uma transação de teste). A leitura traz o nome por `autor:usuarios(nome)`; a função de gravar devolve o nome pronto.
4. **A falsa não recusa a Consulta** (a falsa de processos não conhece o perfil de ninguém, como nas outras gravações dela); a tela já não mostra campo à Consulta, e o banco é provado pelo teste pgTAP. A recusa do arquivado a falsa faz (`conferirNaoArquivado`).
5. **Só os caminhos da spec guardam a saída:** botão de fechar, Esc, abrir o pai ou um subprocesso, Histórico e Editar; aba e recarga pelo aviso nativo (`beforeunload`). O botão Voltar do navegador troca o endereço sem passar pelo verso e **não** é interceptado (conhecido e aceito; Ponytail: só se alguém perder texto assim).
6. **O teste de banco é commitado e enviado antes da migração**, para ver o vermelho no "Testes de banco" (o `/executar-complexo` pede migração, teste e tipos no mesmo commit; o commit do teste vem antes só para o CI poder vê-lo falhar, e a migração e os tipos vão juntos no seguinte).
7. **A reclassificação mantém as Anotações** (história 194) por construção: ela só muda `tipo` e `processo_pai_id`. Uma asserção no teste de banco prova.
8. **Sem atualização ao vivo** (spec): o texto é lido ao abrir o verso e depois de "Ver o texto atual".

## Mapa de arquivos

| Arquivo | O que faz |
|-|-|
| `supabase/tests/50_anotacoes_do_processo.test.sql` (criar) | critério 1 e 2 no banco |
| `supabase/migrations/<data>_anotacoes_do_processo.sql` (criar pela CLI) | colunas, privilégio, gatilho, função |
| `supabase/AMBIENTES.md`, `src/types/database.ts` | registro da migração e tipos |
| `src/processos/anotacoes.ts` + `.test.ts` (criar) | limite, pausa, contagem, linha "Alterado por", `precisaGravar` (critério 3) |
| `src/processos/tipos.ts` | `AnotacoesLidas`, `ResultadoDaGravacaoDasAnotacoes`, `lerAnotacoes`, `gravarAnotacoes` |
| `src/processos/anotacoesSupabase.ts` + `.test.ts` (criar) | o módulo real (leitura, função, recusas) |
| `src/processos/frasesDasAnotacoes.ts` (criar), `andamentosSupabase.ts`, `processosSupabase.ts` | frase do limite e ligação |
| `src/processos/AnotacoesFalso.ts` + `.test.ts` (criar), `ProcessosFalso.ts` | a falsa das Anotações |
| `src/processos/GravadorDeAnotacoes.ts` + `.test.ts` (criar) | pausa, fila, falha, conflito |
| `src/hooks/useAnotacoesDoProcesso.ts`, `src/hooks/useSaidaComAnotacoes.ts` (criar) | liga o gravador à tela; guarda a saída |
| `src/components/processos/BlocoDasAnotacoes.tsx`, `Anotacoes.css` (criar) | o bloco |
| `src/components/processos/ConfirmarSaidaSemSalvar.tsx` (criar), `JanelaDeConfirmacao.tsx` | a confirmação |
| `src/components/processos/VersoDoCartao.tsx`, `EstruturaDoProcesso.tsx` | bloco na coluna, saída guardada, links do pai e dos subprocessos |
| `src/testes/processoNoVerso.tsx`, `src/testes/anotacoesNoVerso.tsx` (criar) | `montarVerso` com preparo; ajudas de teste |
| `src/App.anotacoesDoProcesso.test.tsx`, `src/App.anotacoesAoSair.test.tsx` (criar) | critérios 4 a 6 pelo aplicativo inteiro |

---

### Tarefa 1: Banco (critérios 1, 2 e 7)

**Arquivos:** `supabase/tests/50_anotacoes_do_processo.test.sql`, a migração nova, `supabase/AMBIENTES.md`, `src/types/database.ts`.

**Produz:** colunas `processos.anotacoes`, `anotacoes_alteradas_em`, `anotacoes_alteradas_por`; `public.gravar_anotacoes_do_processo(p_processo uuid, p_esperado text, p_novo text) returns table (texto text, alterado_em timestamptz, alterado_por_nome text)`; recusas P0001 `anotacoes_em_conflito`, `anotacoes_longas:<n>`, `processo_arquivado` (já existente), `registro_inexistente`, e 42501 para perfil.

- [x] **Passo 1: branch e marco.** Na `main` limpa: `git switch -c processos-etapas-23`; conferir "vínculo atual: yclkzyoebpsxmgpbcbus" em `supabase/AMBIENTES.md`; criar a tag `marco/2026-10-23-inicio-ticket-23-processos-etapas` e enviá-la (`git push origin "refs/tags/marco/*:refs/tags/marco/*"`).
- [x] **Passo 2: o teste que falha.** Criar `supabase/tests/50_anotacoes_do_processo.test.sql` com o conteúdo abaixo. As funções `pg_temp.hoje`, `andamento`, `agir`, `arquivo`, `enviar_completa`, `ate_a_aprovacao` e `aprovar` são copiadas sem mudança do `49_arquivar_e_registrar_publicacao.test.sql` (linhas 52 a 117), no ponto marcado.

```sql
-- Anotações do processo (processos-etapas, ticket 23; ADR 0021): gravar só se o texto no banco é o que a pessoa tinha,
-- autor e hora preenchidos pelo banco, sem evento, limite de 2.000 caracteres, só espaços grava nulo, arquivado recusa,
-- subprocesso e pai separados, reclassificação mantém, perfis (inclusive inativo e visitante) e ausência da view e do pacote.
begin;
create extension if not exists pgtap with schema extensions;
-- As linhas do pgTAP vão para _tap e saem na exceção do fim (ver scripts/relatorio-tap.mjs).
create temp table _tap (n serial, linha text);
grant all on _tap to anon, authenticated;
grant all on sequence _tap_n_seq to anon, authenticated;
insert into _tap (linha) select plan(57);

-- Usuários inventados: a1 administrador, a2 integrante, a3 consulta, a4 administrador inativo.
insert into public.autorizacoes (email, perfil) values
  ('admin.teste@ccivil.pr.gov.br', 'administrador'),
  ('integrante.teste@ccivil.pr.gov.br', 'integrante_ep'),
  ('consulta.teste@ccivil.pr.gov.br', 'consulta'),
  ('inativo.teste@ccivil.pr.gov.br', 'administrador');
insert into auth.users (id, email, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'admin.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'integrante.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a3', 'consulta.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a4', 'inativo.teste@ccivil.pr.gov.br', 'authenticated', 'authenticated');
update public.usuarios set ativo = false where id = '00000000-0000-0000-0000-0000000000a4';

create function pg_temp.claims(usuario text) returns void language sql as $$
  select set_config('request.jwt.claims', '{"sub":"00000000-0000-0000-0000-0000000000' || usuario || '","role":"authenticated"}', true) $$;
grant execute on function pg_temp.claims(text) to authenticated;

-- Um setor e os processos; o Filho é subprocesso do Pai; Concluido e Arquivado chegam ao fim do caminho.
insert into public.setores (id, sigla, nome) values ('5f000000-0000-0000-0000-000000000050', 'T50', 'Setor Anotações');
insert into public.macroprocessos (id, codigo, nome) values ('af000000-0000-0000-0000-000000000050', null, 'Macro Anotações');
insert into public.processos (setor_id, macroprocesso_id, nome)
select '5f000000-0000-0000-0000-000000000050', 'af000000-0000-0000-0000-000000000050', nome
from unnest(array['Notas', 'Suspenso', 'Cancelado', 'Concluido', 'Arquivado']) as nome;
insert into public.processos (setor_id, macroprocesso_id, nome, tipo)
values ('5f000000-0000-0000-0000-000000000050', 'af000000-0000-0000-0000-000000000050', 'Pai', 'processo');
insert into public.processos (setor_id, macroprocesso_id, nome, tipo, processo_pai_id)
select '5f000000-0000-0000-0000-000000000050', 'af000000-0000-0000-0000-000000000050', 'Filho', 'subprocesso', id
from public.processos where nome = 'Pai' and setor_id = '5f000000-0000-0000-0000-000000000050';

create function pg_temp.processo(nome_do_processo text) returns uuid
language sql stable as $$
  select id from public.processos where nome = nome_do_processo and setor_id = '5f000000-0000-0000-0000-000000000050' $$;
grant execute on function pg_temp.processo(text) to authenticated;

create function pg_temp.texto(nome_do_processo text) returns text
language sql stable as $$ select anotacoes from public.processos where id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.texto(text) to authenticated;

create function pg_temp.autor(nome_do_processo text) returns uuid
language sql stable as $$ select anotacoes_alteradas_por from public.processos where id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.autor(text) to authenticated;

create function pg_temp.momento(nome_do_processo text) returns timestamptz
language sql stable as $$ select anotacoes_alteradas_em from public.processos where id = pg_temp.processo(nome_do_processo) $$;
grant execute on function pg_temp.momento(text) to authenticated;

create function pg_temp.edicoes(nome_do_processo text) returns bigint
language sql stable as $$
  select count(*) from public.eventos where entidade = 'processo' and acao = 'editar'
    and entidade_ref = pg_temp.processo(nome_do_processo)::text $$;
grant execute on function pg_temp.edicoes(text) to authenticated;

create function pg_temp.ultima_edicao(nome_do_processo text) returns jsonb
language sql stable as $$
  select detalhes from public.eventos where entidade = 'processo' and acao = 'editar'
    and entidade_ref = pg_temp.processo(nome_do_processo)::text order by id desc limit 1 $$;
grant execute on function pg_temp.ultima_edicao(text) to authenticated;

-- >>> Copiar aqui, sem mudança, do teste 49 (linhas 52 a 117): pg_temp.hoje, andamento, agir, arquivo, enviar_completa,
-- >>> ate_a_aprovacao e aprovar.

-- Concluido e Arquivado percorrem o caminho como o "Pendente" do teste 49 (versão completa, etapas realizadas antes e
-- Aprovação sem publicação); depois, cada processo vai ao estado do caso.
set local role authenticated;
select pg_temp.claims('a1');
select pg_temp.enviar_completa(nome) from unnest(array['Concluido', 'Arquivado']) as nome;
select pg_temp.claims('a2');
select pg_temp.ate_a_aprovacao(nome) from unnest(array['Concluido', 'Arquivado']) as nome;
select pg_temp.aprovar(nome, false, pg_temp.hoje() - 10) from unnest(array['Concluido', 'Arquivado']) as nome;
select public.arquivar_processo(pg_temp.processo('Arquivado'));
select public.suspender_processo(pg_temp.processo('Suspenso'), 'Aguardando o setor');
select public.cancelar_processo(pg_temp.processo('Cancelado'), 'Cancelado no teste');
reset role;

-- ===== A estrutura =====
insert into _tap (linha) select has_column('public', 'processos', 'anotacoes', 'processos tem as Anotações');
insert into _tap (linha) select has_column('public', 'processos', 'anotacoes_alteradas_em', 'processos tem a hora da última alteração');
insert into _tap (linha) select has_column('public', 'processos', 'anotacoes_alteradas_por', 'processos tem o autor da última alteração');
insert into _tap (linha) select has_function('public', 'gravar_anotacoes_do_processo', array['uuid', 'text', 'text'],
  'existe a função de gravar as Anotações');

-- ===== Administrador grava a primeira vez (esperado nulo) =====
select pg_temp.claims('a1');
set local role authenticated;
insert into _tap (linha) select is(
  (select texto from public.gravar_anotacoes_do_processo(pg_temp.processo('Notas'), null, 'Combinado com o setor')),
  'Combinado com o setor', 'administrador grava e a função devolve o texto');
insert into _tap (linha) select is(pg_temp.texto('Notas'), 'Combinado com o setor', 'o texto ficou no processo');
insert into _tap (linha) select is(pg_temp.autor('Notas'), '00000000-0000-0000-0000-0000000000a1'::uuid,
  'o banco registrou o administrador como autor');
insert into _tap (linha) select ok(pg_temp.momento('Notas') is not null, 'o banco registrou a hora');

-- ===== Integrante grava sobre o texto do administrador, que é o que ele tinha =====
reset role;
select pg_temp.claims('a2');
set local role authenticated;
insert into _tap (linha) select is(
  (select texto from public.gravar_anotacoes_do_processo(pg_temp.processo('Notas'), 'Combinado com o setor', 'Segundo texto')),
  'Segundo texto', 'integrante grava quando o texto é o que ele tinha');
insert into _tap (linha) select is(pg_temp.autor('Notas'), '00000000-0000-0000-0000-0000000000a2'::uuid,
  'o autor passou a ser o integrante');

-- ===== Conflito: quem escreveu por cima do que já mudou é recusado e nada muda =====
insert into _tap (linha) select throws_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Notas'), 'Combinado com o setor', 'Texto do atrasado')$sql$,
  'P0001', 'anotacoes_em_conflito', 'gravar com o texto antigo é recusado');
insert into _tap (linha) select is(pg_temp.texto('Notas'), 'Segundo texto', 'a recusa não alterou o texto');
insert into _tap (linha) select throws_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Notas'), null, 'Outro texto')$sql$,
  'P0001', 'anotacoes_em_conflito', 'esperar nulo quando já há texto também é conflito');

-- ===== Gravar o mesmo texto não muda autor nem hora; texto novo muda os dois =====
reset role;
create temp table _antes as select pg_temp.momento('Notas') as momento, pg_temp.autor('Notas') as autor;
grant all on _antes to authenticated;
select pg_temp.claims('a1');
set local role authenticated;
insert into _tap (linha) select lives_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Notas'), 'Segundo texto', 'Segundo texto')$sql$,
  'gravar o mesmo texto é aceito');
insert into _tap (linha) select is(pg_temp.autor('Notas'), (select autor from _antes), 'gravar o mesmo texto não muda o autor');
insert into _tap (linha) select is(pg_temp.momento('Notas'), (select momento from _antes), 'nem a hora');
insert into _tap (linha) select lives_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Notas'), 'Segundo texto', 'Terceiro texto')$sql$,
  'gravar um texto novo é aceito');
insert into _tap (linha) select ok(pg_temp.momento('Notas') > (select momento from _antes), 'a hora avançou com o texto novo');
insert into _tap (linha) select is(pg_temp.autor('Notas'), '00000000-0000-0000-0000-0000000000a1'::uuid, 'e o autor mudou');

-- ===== Sem evento no processo; editar outro campo continua gerando, sem as Anotações =====
insert into _tap (linha) select is(pg_temp.edicoes('Notas'), 0::bigint, 'gravar as Anotações não gera evento do processo');
insert into _tap (linha) select lives_ok(
  $sql$update public.processos set contexto = 'Contexto novo' where id = pg_temp.processo('Notas')$sql$,
  'editar o contexto continua permitido');
insert into _tap (linha) select is(pg_temp.edicoes('Notas'), 1::bigint, 'editar o contexto gera um evento');
insert into _tap (linha) select is(jsonb_exists(pg_temp.ultima_edicao('Notas') -> 'depois', 'anotacoes'), false,
  'o evento não traz as Anotações');

-- ===== Limite de 2.000 caracteres =====
insert into _tap (linha) select throws_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Notas'), 'Terceiro texto', repeat('a', 2001))$sql$,
  'P0001', 'anotacoes_longas:2001', '2.001 caracteres são recusados');
insert into _tap (linha) select lives_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Notas'), 'Terceiro texto', repeat('a', 2000))$sql$,
  '2.000 caracteres são aceitos');
insert into _tap (linha) select is(char_length(pg_temp.texto('Notas')), 2000, 'o texto de 2.000 caracteres ficou inteiro');

-- ===== Só espaços e quebras de linha gravam nulo, e o rastro de quem alterou fica =====
insert into _tap (linha) select lives_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Notas'), repeat('a', 2000), E'  \n ')$sql$,
  'só espaços e quebras de linha são aceitos');
insert into _tap (linha) select is(pg_temp.texto('Notas'), null::text, 'e gravam nulo');
insert into _tap (linha) select ok(pg_temp.momento('Notas') is not null, 'a hora da última alteração continua registrada');

-- ===== O texto vale como foi digitado (espaços das pontas ficam) =====
insert into _tap (linha) select lives_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Notas'), null, '  com margem  ')$sql$,
  'texto com espaços nas pontas é aceito');
insert into _tap (linha) select is(pg_temp.texto('Notas'), '  com margem  ', 'e fica como foi digitado');

-- ===== Fora da função: o limite vale, e autor e hora não se mudam =====
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set anotacoes = repeat('a', 2001) where id = pg_temp.processo('Notas')$sql$,
  '23514', null, 'o limite vale também no update direto');
insert into _tap (linha) select lives_ok(
  $sql$update public.processos set anotacoes = 'Direto' where id = pg_temp.processo('Notas')$sql$,
  'o update direto do texto é aceito para quem pode alterar');
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set anotacoes_alteradas_por = '00000000-0000-0000-0000-0000000000a2' where id = pg_temp.processo('Notas')$sql$,
  '42501', null, 'ninguém muda o autor pela API');
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set anotacoes_alteradas_em = now() where id = pg_temp.processo('Notas')$sql$,
  '42501', null, 'ninguém muda a hora pela API');
reset role;
insert into _tap (linha) select throws_ok(
  $sql$update public.processos set anotacoes_alteradas_por = '00000000-0000-0000-0000-0000000000a2' where id = pg_temp.processo('Notas')$sql$,
  'P0001', 'anotacoes_alteradas_so_pelo_banco', 'nem o dono do banco muda o autor sem mudar o texto');

-- ===== Pai e subprocesso têm textos separados; a reclassificação mantém =====
select pg_temp.claims('a1');
set local role authenticated;
insert into _tap (linha) select lives_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Pai'), null, 'Texto do pai')$sql$, 'grava no pai');
insert into _tap (linha) select is(pg_temp.texto('Filho'), null::text, 'o subprocesso não herda o texto do pai');
insert into _tap (linha) select lives_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Filho'), null, 'Texto do filho')$sql$, 'grava no subprocesso');
insert into _tap (linha) select is(pg_temp.texto('Pai'), 'Texto do pai', 'e o texto do subprocesso não muda o do pai');
insert into _tap (linha) select lives_ok(
  $sql$select public.reclassificar_processo(pg_temp.processo('Notas'), 'processo', null, 'Reclassificado no teste')$sql$,
  'reclassificar o processo com Anotações é aceito');
insert into _tap (linha) select is(pg_temp.texto('Notas'), 'Direto', 'a reclassificação mantém as Anotações');

-- ===== Situações: suspenso, cancelado e concluído aceitam; arquivado recusa =====
insert into _tap (linha) select lives_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Suspenso'), null, 'Anotado no suspenso')$sql$, 'suspenso aceita');
insert into _tap (linha) select lives_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Cancelado'), null, 'Anotado no cancelado')$sql$, 'cancelado aceita');
insert into _tap (linha) select lives_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Concluido'), null, 'Anotado no concluído')$sql$, 'concluído aceita');
insert into _tap (linha) select throws_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Arquivado'), null, 'Tentativa no arquivado')$sql$,
  'P0001', 'processo_arquivado', 'arquivado recusa');
insert into _tap (linha) select is(pg_temp.texto('Arquivado'), null::text, 'e o arquivado ficou sem texto');

-- ===== Consulta lê, mas não grava =====
reset role;
select pg_temp.claims('a3');
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$select * from public.gravar_anotacoes_do_processo(pg_temp.processo('Notas'), 'Direto', 'Da consulta')$sql$,
  '42501', null, 'Consulta não grava pela função');
insert into _tap (linha) select is(pg_temp.texto('Notas'), 'Direto', 'Consulta lê as Anotações');
insert into _tap (linha) select lives_ok(
  $sql$update public.processos set anotacoes = 'Da consulta' where id = pg_temp.processo('Notas')$sql$,
  'o update direto da Consulta não dá erro, mas a RLS não deixa linha alguma');
insert into _tap (linha) select is(pg_temp.texto('Notas'), 'Direto', 'Consulta não muda o texto pelo update direto');

-- ===== Inativo não grava nem lê =====
reset role;
select pg_temp.claims('a4');
set local role authenticated;
insert into _tap (linha) select throws_ok(
  $sql$select * from public.gravar_anotacoes_do_processo('00000000-0000-0000-0000-0000000000f0', null, 'Do inativo')$sql$,
  '42501', null, 'inativo não grava');
insert into _tap (linha) select is(
  (select count(*) from public.processos where setor_id = '5f000000-0000-0000-0000-000000000050'), 0::bigint,
  'inativo não lê os processos, e com eles as Anotações');

-- ===== Visitante não grava nem lê =====
reset role;
select set_config('request.jwt.claims', '{"role":"anon"}', true);
set local role anon;
insert into _tap (linha) select throws_ok(
  $sql$select * from public.gravar_anotacoes_do_processo('00000000-0000-0000-0000-0000000000f0', null, 'Do visitante')$sql$,
  '42501', null, 'visitante não grava');
insert into _tap (linha) select throws_ok($sql$select anotacoes from public.processos$sql$, '42501', null,
  'visitante não lê as Anotações');
reset role;

-- ===== Fora da view e do pacote das planilhas =====
insert into _tap (linha) select is_empty(
  $sql$select column_name from information_schema.columns
    where table_schema = 'public' and table_name = 'processos_com_andamento' and column_name like 'anotacoes%'$sql$,
  'a view do Quadro e da Lista não tem coluna de Anotações');
insert into _tap (linha) select unlike((select private.montar_pacote_das_planilhas()::text), '%Texto do pai%',
  'o pacote das planilhas não traz o texto das Anotações');

insert into _tap (linha) select * from finish();
do $$ begin
  raise exception E'RESULTADO DOS TESTES\n%', (select string_agg(linha, E'\n' order by n) from _tap);
end $$;
```

  Conte as linhas `insert into _tap (linha) select` (menos a do `plan` e a do `finish`): devem ser 57; se o pgTAP acusar outra contagem, ajuste o `plan(...)`.
- [ ] **Passo 3: ver o vermelho.** Commit só do teste (`Ticket 23 de processos-etapas: teste de banco das Anotações`), `git push -u origin processos-etapas-23`, depois:

```bash
cd "C:/Users/alexmacedo/Desktop/Projeto Aplicação Escritório de Processos" && gh workflow run "Testes de banco" --ref processos-etapas-23
```

  Ler o resultado (`gh run list --workflow "Testes de banco" --branch processos-etapas-23 --limit 1`, depois `gh run view <id> --log-failed`). Esperado: o teste 50 falha pelo motivo certo (`has_column` e `has_function` falham e a função `gravar_anotacoes_do_processo` não existe); os outros arquivos seguem verdes.
- [x] **Passo 4: a migração.** `npx supabase migration new anotacoes_do_processo` (só cria o arquivo; a CLI não toca no banco) e escrever nele:

```sql
-- Anotações do processo (processos-etapas, ticket 23; ADR 0021). Não destrutiva. Um texto livre por processo, sem
-- histórico: fica fora da view processos_com_andamento, do pacote das planilhas e do estado guardado nos eventos
-- (private.estado_do_processo e as duas leituras listam as colunas uma a uma). A função grava só se o texto no banco
-- ainda é o que a pessoa tinha ao começar a escrever; quem e quando vêm do gatilho, nunca do cliente.

alter table public.processos
  add column anotacoes text,
  add column anotacoes_alteradas_em timestamptz,
  add column anotacoes_alteradas_por uuid references public.usuarios (id),
  add constraint processos_anotacoes_limite check (char_length(anotacoes) <= 2000);

-- Só o texto é gravável pela API (o privilégio de coluna deixa tentar; a RLS de processos decide o perfil). As duas
-- colunas da última alteração não recebem privilégio: o gatilho as preenche.
grant update (anotacoes) on public.processos to authenticated;

-- Preenche quem e quando quando o texto muda e recusa mudar as duas colunas sem mudar o texto. clock_timestamp e não
-- now(): a hora precisa mudar de verdade mesmo dentro de uma transação.
create function private.registrar_ultima_alteracao_das_anotacoes() returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.anotacoes is not distinct from old.anotacoes then
    if (new.anotacoes_alteradas_em, new.anotacoes_alteradas_por)
      is distinct from (old.anotacoes_alteradas_em, old.anotacoes_alteradas_por) then
      raise exception 'anotacoes_alteradas_so_pelo_banco';
    end if;
    return new;
  end if;
  new.anotacoes_alteradas_em := clock_timestamp();
  new.anotacoes_alteradas_por := (select auth.uid());
  return new;
end $$;

create trigger registrar_ultima_alteracao_das_anotacoes before update on public.processos
  for each row execute function private.registrar_ultima_alteracao_das_anotacoes();

-- Grava as Anotações se o texto atual é o esperado (nulo é igual a nulo); senão, recusa com 'anotacoes_em_conflito' sem
-- mudar nada. Só espaços e quebras de linha viram nulo; o resto fica como foi digitado. Sem security definer: a RLS de
-- alteração de processos e a trava do arquivado decidem; o perfil é conferido antes para a recusa ser a de perfil.
create function public.gravar_anotacoes_do_processo(p_processo uuid, p_esperado text, p_novo text)
returns table (texto text, alterado_em timestamptz, alterado_por_nome text)
language plpgsql set search_path = ''
as $$
declare
  novo text := case when btrim(p_novo, E' \t\r\n') = '' then null else p_novo end;
  linhas integer;
begin
  if not (select private.pode_alterar_cadastros()) then
    raise exception 'sem permissão para gravar as anotações' using errcode = '42501';
  end if;
  if char_length(novo) > 2000 then
    raise exception 'anotacoes_longas:%', char_length(novo);
  end if;
  update public.processos p set anotacoes = novo
  where p.id = p_processo and p.anotacoes is not distinct from p_esperado;
  get diagnostics linhas = row_count;
  if linhas = 0 then
    if exists (select 1 from public.processos p where p.id = p_processo) then
      raise exception 'anotacoes_em_conflito';
    end if;
    raise exception 'registro_inexistente';
  end if;
  return query
    select p.anotacoes, p.anotacoes_alteradas_em, u.nome
    from public.processos p left join public.usuarios u on u.id = p.anotacoes_alteradas_por
    where p.id = p_processo;
end $$;

revoke execute on function private.registrar_ultima_alteracao_das_anotacoes(), public.gravar_anotacoes_do_processo(uuid, text, text)
  from public, anon;
grant execute on function private.registrar_ultima_alteracao_das_anotacoes(), public.gravar_anotacoes_do_processo(uuid, text, text)
  to authenticated;
```

- [ ] **Passo 5: aplicar e ver o verde.** Commit da migração (ainda sem os tipos), `git push`; disparar `gh workflow run "Migrar banco de desenvolvimento" --ref processos-etapas-23 -f migracao=<nome do arquivo>.sql`; ler o resultado (esperado: aplicada, sem o aviso de "já aplicada"); depois `gh workflow run "Testes de banco" --ref processos-etapas-23` e ler. Esperado: o 50 com 57 de 57 e todos os outros arquivos verdes (o `10_privilegios_padrao` e o `46_funcoes_e_views_seguras` provam o `revoke` e o `grant`). Se algum teste antigo falhar, anotar qual e por quê antes de mexer.
- [ ] **Passo 6: tipos e registro.** Conferir o vínculo (`supabase/.temp/project-ref` com `yclkzyoebpsxmgpbcbus`), rodar `npm run db:types` e conferir que o diff de `src/types/database.ts` só traz as três colunas e a função (fim de linha CRLF/LF sem diferença real não conta). Acrescentar em `supabase/AMBIENTES.md`, na lista das migrações aplicadas, a linha `- <versão>_anotacoes_do_processo (2026-10-23; processos-etapas, ticket 23; teste 50 falhou antes, função e colunas inexistentes, e passou depois, 57 de 57, com os N arquivos verdes; aplicada pelo workflow "Migrar banco de desenvolvimento" e testada pelo "Testes de banco" na branch)`.
- [ ] **Passo 7:** `npm test`, `npm run lint`, `npm run typecheck` verdes. Commit: `Ticket 23 de processos-etapas: migração das Anotações, tipos e registro`.

---

### Tarefa 2: As regras puras (critério 3)

**Arquivos:** criar `src/processos/anotacoes.ts` e `src/processos/anotacoes.test.ts`.

**Produz:** `LIMITE_DAS_ANOTACOES = 2000`; `PAUSA_DA_GRAVACAO_MS = 1000`; `textoParaGravar(texto: string): string | null`; `precisaGravar(texto: string, gravado: string | null): boolean`; `contagemDasAnotacoes(texto: string): string | null`; `linhaDaUltimaAlteracao(nome: string | null, quando: string | null): string | null`.

- [x] **Passo 1: os testes que falham** em `anotacoes.test.ts`:

```ts
import { expect, test } from 'vitest'
import {
  LIMITE_DAS_ANOTACOES, PAUSA_DA_GRAVACAO_MS, contagemDasAnotacoes, linhaDaUltimaAlteracao, precisaGravar, textoParaGravar,
} from './anotacoes'

test('o limite é de 2.000 caracteres e a pausa, de 1 segundo', () => {
  expect(LIMITE_DAS_ANOTACOES).toBe(2000)
  expect(PAUSA_DA_GRAVACAO_MS).toBe(1000)
})

test('só espaços e quebras de linha viram nulo; o resto vai como foi digitado', () => {
  expect(textoParaGravar('')).toBeNull()
  expect(textoParaGravar('  \n \t')).toBeNull()
  expect(textoParaGravar('  com margem  ')).toBe('  com margem  ')
  expect(textoParaGravar('a')).toBe('a')
})

test.each<[string, string | null, boolean]>([
  ['', null, false],
  ['   ', null, false],
  ['a', null, true],
  ['a', 'a', false],
  ['', 'a', true],
  ['  ', 'a', true],
  ['  a', 'a', true],
])('precisaGravar(%j, %j) é %s', (texto, gravado, esperado) => {
  expect(precisaGravar(texto, gravado)).toBe(esperado)
})

test('a contagem só aparece a partir de 1.800 caracteres', () => {
  expect(contagemDasAnotacoes('a'.repeat(1799))).toBeNull()
  expect(contagemDasAnotacoes('a'.repeat(1800))).toBe('1.800 de 2.000')
  expect(contagemDasAnotacoes('a'.repeat(2000))).toBe('2.000 de 2.000')
})

test('a linha de quem alterou usa o horário de Brasília', () => {
  expect(linhaDaUltimaAlteracao('Ana Teste', '2026-10-23T17:30:00Z')).toBe('Alterado por Ana Teste em 23/10, 14:30')
  expect(linhaDaUltimaAlteracao('Ana Teste', '2026-10-24T02:05:00Z')).toBe('Alterado por Ana Teste em 23/10, 23:05')
})

test('sem o nome do autor a linha só traz a data; sem gravação não há linha', () => {
  expect(linhaDaUltimaAlteracao(null, '2026-10-23T17:30:00Z')).toBe('Alterado em 23/10, 14:30')
  expect(linhaDaUltimaAlteracao('Ana Teste', null)).toBeNull()
})
```

- [x] **Passo 2:** `npx vitest run src/processos/anotacoes.test.ts` — esperado: falha (módulo inexistente).
- [x] **Passo 3: implementar** `src/processos/anotacoes.ts`:

```ts
/** As regras das Anotações do processo que não dependem da tela (spec, "Anotações do processo"; ADR 0021). */
export const LIMITE_DAS_ANOTACOES = 2000
export const PAUSA_DA_GRAVACAO_MS = 1000
const CONTAGEM_A_PARTIR_DE = 1800

const FORMATO_DO_DIA_E_DA_HORA = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23', timeZone: 'America/Sao_Paulo',
})

/** O que vai ao banco: só espaços e quebras de linha contam como vazio (nulo); o resto segue como foi digitado. */
export function textoParaGravar(texto: string): string | null {
  return texto.trim() === '' ? null : texto
}

/** Há o que gravar: o texto digitado, como iria ao banco, difere do último texto lido ou gravado. */
export function precisaGravar(texto: string, gravado: string | null): boolean {
  return textoParaGravar(texto) !== gravado
}

/** "1.800 de 2.000" a partir de 1.800 caracteres; antes disso nada, para o bloco ficar limpo no uso comum. */
export function contagemDasAnotacoes(texto: string): string | null {
  if (texto.length < CONTAGEM_A_PARTIR_DE) return null
  return `${texto.length.toLocaleString('pt-BR')} de ${LIMITE_DAS_ANOTACOES.toLocaleString('pt-BR')}`
}

/** "Alterado por {nome} em {dd/mm}, {hh:mm}" (Brasília); sem gravação ainda, nada. */
export function linhaDaUltimaAlteracao(nome: string | null, quando: string | null): string | null {
  if (!quando) return null
  const partes = Object.fromEntries(FORMATO_DO_DIA_E_DA_HORA.formatToParts(new Date(quando)).map((parte) => [parte.type, parte.value]))
  const momento = `${partes.day}/${partes.month}, ${partes.hour}:${partes.minute}`
  return nome ? `Alterado por ${nome} em ${momento}` : `Alterado em ${momento}`
}
```

- [x] **Passo 4:** o arquivo de teste passa; `npm test`, `npm run lint`, `npm run typecheck` verdes. Commit: `Ticket 23 de processos-etapas: regras puras das Anotações`.

---

### Tarefa 3: O módulo de processos e a falsa (critérios 3 e 4, base dos testes de tela)

**Arquivos:** `src/processos/tipos.ts`, criar `src/processos/frasesDasAnotacoes.ts`, `src/processos/anotacoesSupabase.ts` e `.test.ts`, `src/processos/AnotacoesFalso.ts` e `.test.ts`; modificar `andamentosSupabase.ts`, `processosSupabase.ts`, `ProcessosFalso.ts`, `src/testes/processoNoVerso.tsx`.

**Produz** (em `tipos.ts`):

```ts
/** As Anotações de um processo (texto livre, único, sem histórico; ADR 0021) e quem as alterou por último. */
export type AnotacoesLidas = { texto: string | null; alteradoPor: string | null; alteradoEm: string | null }

/** Gravado: o texto como o banco o guardou, com o novo autor e a hora. Conflito: o texto no banco já não era o esperado. */
export type ResultadoDaGravacaoDasAnotacoes = { tipo: 'gravado'; anotacoes: AnotacoesLidas } | { tipo: 'conflito' }
```

e, em `ModuloDeProcessos`:

```ts
  /** null: o processo não existe (mais). Fora do ProcessoLido: o texto só o verso lê (ADR 0021). */
  lerAnotacoes(id: string): Promise<AnotacoesLidas | null>
  /**
   * Grava se o texto no banco ainda é `esperado` (o que a pessoa tinha ao começar a escrever; null: nenhum). Perfil e
   * processo arquivado chegam como TravaDoBanco; processo excluído, como CadastroInexistente; o conflito não é erro.
   */
  gravarAnotacoes(id: string, esperado: string | null, novo: string | null): Promise<ResultadoDaGravacaoDasAnotacoes>
```

- [x] **Passo 1: os testes que falham.**
  - `anotacoesSupabase.test.ts` (molde de `publicacaoSupabase.test.ts`: `criarProcessosSupabase(cliente as unknown as SupabaseClient<Database>)` e `ClienteSupabaseFalso`):
    - `lerAnotacoes('p1')` pede à tabela `processos` as colunas `anotacoes, anotacoes_alteradas_em, autor:usuarios(nome)` filtradas por `id = p1` e devolve `{ texto, alteradoPor: nome do autor, alteradoEm }` (resposta `processos.select` com uma linha); linha com `anotacoes: null` e `autor: null` devolve `{ texto: null, alteradoPor: null, alteradoEm: null }`; lista vazia devolve `null`; erro de leitura vira `Error` com "Falha ao ler as anotações do processo:" e a mensagem;
    - `gravarAnotacoes('p1', 'antes', 'depois')` chama `rpc` `gravar_anotacoes_do_processo` com `{ p_processo: 'p1', p_esperado: 'antes', p_novo: 'depois' }`, e com `null`s os manda como `null`; a resposta `rpc.gravar_anotacoes_do_processo` com `data: [{ texto: 'depois', alterado_em: '2026-10-13T17:30:00Z', alterado_por_nome: 'Ana Teste' }]` vira `{ tipo: 'gravado', anotacoes: { texto: 'depois', alteradoPor: 'Ana Teste', alteradoEm: '2026-10-13T17:30:00Z' } }`; `data` vazio lança `Error` com "O banco não devolveu a linha das anotações gravadas: recebido [], esperado uma linha com texto, alterado_em e alterado_por_nome.";
    - o erro `anotacoes_em_conflito` (P0001) devolve `{ tipo: 'conflito' }` sem lançar;
    - `test.each` das recusas: `processo_arquivado` (P0001) → `TravaDoBanco` com "Este processo está arquivado; desarquive-o para alterar."; `anotacoes_longas:2001` → `TravaDoBanco` "As anotações têm 2.001 caracteres; o limite é 2.000."; código `42501` → `TravaDoBanco` "Seu perfil não permite alterar os processos."; `registro_inexistente` → `CadastroInexistente`.
  - `AnotacoesFalso.test.ts`: `ler` devolve o vazio de processo sem anotação e `null` de processo inexistente; `gravar` com esperado certo guarda e devolve autor e hora fixos (`'2026-10-13T17:30:00Z'`); com esperado errado devolve `{ tipo: 'conflito' }` sem mudar; gravar o mesmo texto não muda autor nem hora; arquivado lança `TravaDoBanco`; `falhasProgramadas = 1` lança na próxima gravação e a seguinte funciona; `segurar = true` só responde depois de `liberar()`; `alterarComoOutraPessoa` troca texto e autor; processo e subprocesso guardam textos separados; cada gravação aparece em `gravacoes`.
- [x] **Passo 2:** `npx vitest run src/processos/anotacoesSupabase.test.ts src/processos/AnotacoesFalso.test.ts` — esperado: falham (módulos inexistentes).
- [x] **Passo 3: implementar.**
  - `tipos.ts`: os dois tipos e as duas operações acima.
  - `frasesDasAnotacoes.ts`:

```ts
import { LIMITE_DAS_ANOTACOES } from './anotacoes'

/** O banco recusa com 'anotacoes_longas:{n}'; a tela já não deixa chegar a isso (o campo tem maxLength). */
export function fraseDasAnotacoesLongas(tamanho: string): string {
  return `As anotações têm ${Number(tamanho).toLocaleString('pt-BR')} caracteres; o limite é ${LIMITE_DAS_ANOTACOES.toLocaleString('pt-BR')}.`
}
```

  - `andamentosSupabase.ts`: acrescentar `anotacoes_longas` à alternativa de `PADRAO_DA_RECUSA` (antes do `)(?::(.*))?$`: `+ '|anotacoes_longas'`), `anotacoes_longas: fraseDasAnotacoesLongas` em `FRASE_DA_RECUSA` e o `import`. Acrescentar também `anotacoes_longas` à lista de migrações do comentário ("... e anotacoes_do_processo"). O `anotacoes_em_conflito` **não** entra aqui: não é recusa com frase, é um resultado.
  - `anotacoesSupabase.ts`:

```ts
import type { RecusasDoModulo } from '../acesso/falhasDeGravacao'
import type { ClienteSupabase } from '../lib/supabase'
import { falhaDoAndamento } from './andamentosSupabase'
import type { ModuloDeProcessos } from './tipos'

type OperacoesDasAnotacoes = Pick<ModuloDeProcessos, 'lerAnotacoes' | 'gravarAnotacoes'>
type LinhaDasAnotacoes = { anotacoes: string | null; anotacoes_alteradas_em: string | null; autor: { nome: string } | null }
type RetornoDaGravacao = { texto: string | null; alterado_em: string | null; alterado_por_nome: string | null }

const CODIGO_DO_CONFLITO = 'anotacoes_em_conflito'

// As Anotações ficam fora da view do processo (ADR 0021): o verso as lê direto da tabela, com o nome de quem alterou.
// O supabase-js manda null como null; o tipo gerado não o admite nos parâmetros, como em avancar_etapa.
export function criarAnotacoesSupabase(cliente: ClienteSupabase, recusas: RecusasDoModulo): OperacoesDasAnotacoes {
  return {
    lerAnotacoes: async (id) => {
      const { data, error } = await cliente.from('processos')
        .select('anotacoes, anotacoes_alteradas_em, autor:usuarios(nome)').eq('id', id)
      if (error) throw new Error(`Falha ao ler as anotações do processo: ${error.message}`)
      const linha = (data as unknown as LinhaDasAnotacoes[])[0]
      if (!linha) return null
      return { texto: linha.anotacoes, alteradoPor: linha.autor?.nome ?? null, alteradoEm: linha.anotacoes_alteradas_em }
    },
    gravarAnotacoes: async (id, esperado, novo) => {
      const { data, error } = await cliente.rpc('gravar_anotacoes_do_processo',
        { p_processo: id, p_esperado: esperado as string, p_novo: novo as string })
      if (error?.message.includes(CODIGO_DO_CONFLITO)) return { tipo: 'conflito' }
      if (error) throw falhaDoAndamento(error, recusas)
      return { tipo: 'gravado', anotacoes: anotacoesGravadas(data) }
    },
  }
}

function anotacoesGravadas(data: unknown) {
  const linha = (data as RetornoDaGravacao[] | null)?.[0]
  if (!linha) {
    throw new Error(`O banco não devolveu a linha das anotações gravadas: recebido ${JSON.stringify(data)}, esperado uma linha com texto, alterado_em e alterado_por_nome.`)
  }
  return { texto: linha.texto, alteradoPor: linha.alterado_por_nome, alteradoEm: linha.alterado_em }
}
```

    Se o tipo gerado de `autor:usuarios(nome)` reclamar de relação ambígua (só há uma chave de `processos` para `usuarios`, a das Anotações; confira em `database.ts`), troque por `autor:usuarios!anotacoes_alteradas_por(nome)`.
  - `processosSupabase.ts`: `...criarAnotacoesSupabase(cliente, RECUSAS_DOS_PROCESSOS),` ao lado das outras e o `import`.
  - `AnotacoesFalso.ts`:

```ts
import { USUARIO_DE_TESTE } from '../acesso/AcessoFalso'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { conferirNaoArquivado } from './arquivamentoFalso'
import type { ProcessosFalso } from './ProcessosFalso'
import type { AnotacoesLidas, ResultadoDaGravacaoDasAnotacoes } from './tipos'

const SEM_ANOTACOES: AnotacoesLidas = { texto: null, alteradoPor: null, alteradoEm: null }
// Hora fixa (14:30 em Brasília): os testes de tela não dependem do relógio.
const AGORA = '2026-10-13T17:30:00Z'

/** As Anotações na falsa de processos: como as funções do banco, com a falha, a espera e o "outra pessoa alterou" programáveis. */
export class AnotacoesFalso {
  /** O que o banco guardaria por processo; sem entrada, o processo nunca teve anotação. */
  porProcesso: Record<string, AnotacoesLidas> = {}
  /** As gravações recebidas, na ordem: o texto que a pessoa tinha e o novo. */
  gravacoes: { id: string; esperado: string | null; novo: string | null }[] = []
  /** Quantas das próximas gravações falham (conexão fora do ar). */
  falhasProgramadas = 0
  /** Segura a resposta da gravação até `liberar()`: dá tempo de ver "Salvando…". */
  segurar = false
  /** O nome que o banco poria em "Alterado por" para quem está na tela. */
  autor = USUARIO_DE_TESTE.nome
  private liberacao: (() => void) | null = null
  private readonly processos: ProcessosFalso

  constructor(processos: ProcessosFalso) {
    this.processos = processos
  }

  async ler(id: string): Promise<AnotacoesLidas | null> {
    if (!this.existe(id)) return null
    return { ...(this.porProcesso[id] ?? SEM_ANOTACOES) }
  }

  async gravar(id: string, esperado: string | null, novo: string | null): Promise<ResultadoDaGravacaoDasAnotacoes> {
    this.gravacoes.push({ id, esperado, novo })
    if (this.segurar) await new Promise<void>((liberar) => { this.liberacao = liberar })
    if (this.falhasProgramadas > 0) {
      this.falhasProgramadas -= 1
      throw new Error('falha de conexão simulada')
    }
    const processo = this.processos.processos.find((outro) => outro.id === id)
    if (!processo) throw new CadastroInexistente()
    conferirNaoArquivado(processo)
    const atual = this.porProcesso[id] ?? SEM_ANOTACOES
    if (atual.texto !== esperado) return { tipo: 'conflito' }
    if (novo === atual.texto) return { tipo: 'gravado', anotacoes: { ...atual } }
    this.porProcesso[id] = { texto: novo, alteradoPor: this.autor, alteradoEm: AGORA }
    return { tipo: 'gravado', anotacoes: { ...this.porProcesso[id] } }
  }

  liberar(): void {
    this.liberacao?.()
    this.liberacao = null
  }

  /** O gesto "outra pessoa altera agora": muda o texto por fora da tela, como outra sessão faria. */
  alterarComoOutraPessoa(id: string, texto: string | null, autor: string): void {
    this.porProcesso[id] = { texto, alteradoPor: autor, alteradoEm: '2026-10-13T18:05:00Z' }
  }

  private existe(id: string): boolean {
    return this.processos.processos.some((processo) => processo.id === id)
  }
}
```

  - `ProcessosFalso.ts`: `anotacoes = new AnotacoesFalso(this)` ao lado de `catalogo`, e os dois métodos da interface: `lerAnotacoes = (id: string) => this.anotacoes.ler(id)` e `gravarAnotacoes = (id: string, esperado: string | null, novo: string | null) => this.anotacoes.gravar(id, esperado, novo)`. Se o `ProcessosFalso` passar de 300 linhas contadas pelo ESLint, mova os dois para métodos comuns de uma linha cada.
  - `src/testes/processoNoVerso.tsx`: `montarVerso` ganha o quarto parâmetro `preparar?: (falso: ProcessosFalso) => void`, chamado logo depois de `falso.etapasDoCatalogo = ...` e antes do `render(...)` (o bloco lê as Anotações ao montar, então o preparo tem de vir antes). Os usos atuais não mudam.
- [x] **Passo 4:** os dois arquivos novos passam; `npm test`, `npm run lint`, `npm run typecheck` verdes (o typecheck aponta qualquer outro objeto tipado como `ModuloDeProcessos` que precise dos dois métodos). Commit: `Ticket 23 de processos-etapas: módulo e falsa das Anotações`.

---

### Tarefa 4: O gravador (critério 3) e o hook

**Arquivos:** criar `src/processos/GravadorDeAnotacoes.ts` e `.test.ts`, `src/hooks/useAnotacoesDoProcesso.ts`.

**Consome:** `PAUSA_DA_GRAVACAO_MS`, `precisaGravar`, `textoParaGravar` (Tarefa 2); `AnotacoesLidas`, `ResultadoDaGravacaoDasAnotacoes` (Tarefa 3).
**Produz:** `type EstadoDaGravacao = 'ocioso' | 'salvando' | 'salvo' | 'falha' | 'conflito'`; `type SaidaDoGravador = { gravar(esperado, novo); ler(); aoSumir() }`; `class GravadorDeAnotacoes` com os campos `estado`, `digitado`, `lidas` e os métodos `digitar(texto)`, `sairDoCampo()`, `verTextoAtual()`, `pendente()`, `gravarAgora(): Promise<boolean>`, `ouvir(ouvinte): () => void`, `encerrar()`; e `useAnotacoesDoProcesso(processos, id, inicial, aoSumir): GravadorDeAnotacoes`.

- [x] **Passo 1: os testes que falham** em `GravadorDeAnotacoes.test.ts` (relógio simulado, sem React):

```ts
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { GravadorDeAnotacoes } from './GravadorDeAnotacoes'
import type { AnotacoesLidas, ResultadoDaGravacaoDasAnotacoes } from './tipos'

const SEM_ANOTACOES: AnotacoesLidas = { texto: null, alteradoPor: null, alteradoEm: null }
const gravado = (texto: string | null): ResultadoDaGravacaoDasAnotacoes =>
  ({ tipo: 'gravado', anotacoes: { texto, alteradoPor: 'Ana Teste', alteradoEm: '2026-10-13T17:30:00Z' } })

/** A saída do gravador nos testes: guarda cada gravação e responde com o que o teste programou, na ordem. */
class SaidaFalsa {
  gravacoes: { esperado: string | null; novo: string | null }[] = []
  respostas: (ResultadoDaGravacaoDasAnotacoes | Error)[] = []
  espera: Promise<void> | null = null
  lido: AnotacoesLidas | null = SEM_ANOTACOES
  falharALeitura = false
  sumiu = false

  async gravar(esperado: string | null, novo: string | null): Promise<ResultadoDaGravacaoDasAnotacoes> {
    this.gravacoes.push({ esperado, novo })
    if (this.espera) await this.espera
    const resposta = this.respostas.shift() ?? gravado(novo)
    if (resposta instanceof Error) throw resposta
    return resposta
  }

  async ler(): Promise<AnotacoesLidas | null> {
    if (this.falharALeitura) throw new Error('falha de conexão simulada')
    return this.lido
  }

  aoSumir(): void {
    this.sumiu = true
  }
}

let saida: SaidaFalsa
const criar = (inicial: AnotacoesLidas = SEM_ANOTACOES) => new GravadorDeAnotacoes(inicial, saida)
const passar = (ms: number) => vi.advanceTimersByTimeAsync(ms)

beforeEach(() => {
  vi.useFakeTimers()
  saida = new SaidaFalsa()
})
afterEach(() => vi.useRealTimers())

test('grava 1 segundo depois da última tecla, uma vez', async () => {
  const gravador = criar()
  gravador.digitar('Oi')
  await passar(999)
  expect(saida.gravacoes).toHaveLength(0)
  await passar(1)
  expect(saida.gravacoes).toEqual([{ esperado: null, novo: 'Oi' }])
  expect(gravador.estado).toBe('salvo')
})

test('cada tecla reinicia a pausa', async () => {
  const gravador = criar()
  gravador.digitar('O')
  await passar(600)
  gravador.digitar('Oi')
  await passar(600)
  expect(saida.gravacoes).toHaveLength(0)
  await passar(400)
  expect(saida.gravacoes).toEqual([{ esperado: null, novo: 'Oi' }])
})

test('sair do campo grava na hora, sem esperar a pausa', async () => {
  const gravador = criar()
  gravador.digitar('Oi')
  await gravador.sairDoCampo()
  expect(saida.gravacoes).toEqual([{ esperado: null, novo: 'Oi' }])
  await passar(2000)
  expect(saida.gravacoes).toHaveLength(1)
})

test('texto igual ao gravado e só espaços sem anotação não gravam', async () => {
  const gravador = criar({ texto: 'A', alteradoPor: null, alteradoEm: null })
  gravador.digitar('A')
  await gravador.sairDoCampo()
  const vazio = criar()
  vazio.digitar('  \n ')
  await vazio.sairDoCampo()
  expect(saida.gravacoes).toHaveLength(0)
})

test('apagar tudo grava nulo, com o texto que a pessoa tinha', async () => {
  const gravador = criar({ texto: 'A', alteradoPor: null, alteradoEm: null })
  gravador.digitar('')
  await gravador.sairDoCampo()
  expect(saida.gravacoes).toEqual([{ esperado: 'A', novo: null }])
})

test('uma gravação por vez: o que se digita durante uma vai na seguinte, com o texto que a anterior gravou', async () => {
  let liberar!: () => void
  saida.espera = new Promise<void>((resolve) => { liberar = resolve })
  const gravador = criar()
  gravador.digitar('A')
  await passar(1000)
  gravador.digitar('AB')
  await passar(1000)
  expect(saida.gravacoes).toHaveLength(1)
  saida.espera = null
  liberar()
  await passar(0)
  expect(saida.gravacoes).toEqual([{ esperado: null, novo: 'A' }, { esperado: 'A', novo: 'AB' }])
  expect(gravador.estado).toBe('salvo')
})

test('a falha mostra o estado e a próxima pausa tenta de novo', async () => {
  saida.respostas = [new Error('falha de conexão simulada')]
  const gravador = criar()
  gravador.digitar('A')
  await passar(1000)
  expect(gravador.estado).toBe('falha')
  expect(gravador.digitado).toBe('A')
  gravador.digitar('AB')
  await passar(1000)
  expect(gravador.estado).toBe('salvo')
  expect(saida.gravacoes).toEqual([{ esperado: null, novo: 'A' }, { esperado: null, novo: 'AB' }])
})

test('o conflito para as gravações até "Ver o texto atual", que troca o texto e o autor', async () => {
  saida.respostas = [{ tipo: 'conflito' }]
  const gravador = criar()
  gravador.digitar('Meu')
  await passar(1000)
  expect(gravador.estado).toBe('conflito')
  gravador.digitar('Meu texto')
  await passar(5000)
  await gravador.sairDoCampo()
  expect(saida.gravacoes).toHaveLength(1)
  expect(gravador.digitado).toBe('Meu texto')
  saida.lido = { texto: 'Do colega', alteradoPor: 'Bia Teste', alteradoEm: '2026-10-13T18:05:00Z' }
  await gravador.verTextoAtual()
  expect(gravador.estado).toBe('ocioso')
  expect(gravador.digitado).toBe('Do colega')
  expect(gravador.lidas.alteradoPor).toBe('Bia Teste')
  gravador.digitar('Do colega e eu')
  await passar(1000)
  expect(saida.gravacoes.at(-1)).toEqual({ esperado: 'Do colega', novo: 'Do colega e eu' })
})

test('se a leitura de "Ver o texto atual" falha, continua em conflito com o texto da pessoa', async () => {
  saida.respostas = [{ tipo: 'conflito' }]
  const gravador = criar()
  gravador.digitar('Meu')
  await passar(1000)
  saida.falharALeitura = true
  await gravador.verTextoAtual()
  expect(gravador.estado).toBe('conflito')
  expect(gravador.digitado).toBe('Meu')
})

test('processo excluído por outra pessoa avisa em vez de falhar', async () => {
  saida.respostas = [new CadastroInexistente()]
  const gravador = criar()
  gravador.digitar('A')
  await passar(1000)
  expect(saida.sumiu).toBe(true)
})

test('digitar depois de "Salvo" some com o "Salvo"', async () => {
  const gravador = criar()
  gravador.digitar('A')
  await passar(1000)
  expect(gravador.estado).toBe('salvo')
  gravador.digitar('AB')
  expect(gravador.estado).toBe('ocioso')
})

test('pendente e gravarAgora: grava na hora e diz se nada ficou para trás', async () => {
  const gravador = criar()
  expect(gravador.pendente()).toBe(false)
  gravador.digitar('A')
  expect(gravador.pendente()).toBe(true)
  expect(await gravador.gravarAgora()).toBe(true)
  expect(gravador.pendente()).toBe(false)
  expect(saida.gravacoes).toHaveLength(1)
})

test('gravarAgora diz que não gravou quando falha ou há conflito', async () => {
  saida.respostas = [new Error('falha de conexão simulada'), { tipo: 'conflito' }]
  const comFalha = criar()
  comFalha.digitar('A')
  expect(await comFalha.gravarAgora()).toBe(false)
  const comConflito = criar()
  comConflito.digitar('B')
  expect(await comConflito.gravarAgora()).toBe(false)
  expect(comConflito.pendente()).toBe(true)
})

test('os ouvintes são avisados a cada mudança e deixam de ser depois de ouvir()()', async () => {
  const gravador = criar()
  const avisos: number[] = []
  const parar = gravador.ouvir(() => avisos.push(1))
  gravador.digitar('A')
  expect(avisos.length).toBeGreaterThan(0)
  parar()
  const antes = avisos.length
  gravador.digitar('AB')
  expect(avisos).toHaveLength(antes)
})

test('encerrar cancela a pausa que estava correndo', async () => {
  const gravador = criar()
  gravador.digitar('A')
  gravador.encerrar()
  await passar(2000)
  expect(saida.gravacoes).toHaveLength(0)
})
```

- [x] **Passo 2:** `npx vitest run src/processos/GravadorDeAnotacoes.test.ts` — esperado: falha (módulo inexistente).
- [x] **Passo 3: implementar** `src/processos/GravadorDeAnotacoes.ts`:

```ts
import { CadastroInexistente } from '../cadastros/cadastroInexistente'
import { PAUSA_DA_GRAVACAO_MS, precisaGravar, textoParaGravar } from './anotacoes'
import type { AnotacoesLidas, ResultadoDaGravacaoDasAnotacoes } from './tipos'

export type EstadoDaGravacao = 'ocioso' | 'salvando' | 'salvo' | 'falha' | 'conflito'

/** O que o gravador pede ao mundo, já ligado a um processo: gravar, ler de novo e avisar que o processo sumiu. */
export type SaidaDoGravador = {
  gravar(esperado: string | null, novo: string | null): Promise<ResultadoDaGravacaoDasAnotacoes>
  ler(): Promise<AnotacoesLidas | null>
  aoSumir(): void
}

/**
 * O salvamento automático das Anotações (spec, "Verso do cartão", Anotações): grava 1 segundo depois da última tecla e
 * ao sair do campo, uma gravação por vez, e para no conflito até "Ver o texto atual". Fica fora do React para a ordem
 * das gravações poder ser testada com o relógio simulado; o hook só o liga à tela.
 */
export class GravadorDeAnotacoes {
  estado: EstadoDaGravacao = 'ocioso'
  /** O que a pessoa vê e edita no campo. */
  digitado: string
  /** O último texto lido ou gravado, com quem o alterou e quando. */
  lidas: AnotacoesLidas
  private gravado: string | null
  private fila: Promise<void> = Promise.resolve()
  private pausa: ReturnType<typeof setTimeout> | undefined
  private readonly ouvintes = new Set<() => void>()
  private readonly saida: SaidaDoGravador

  constructor(inicial: AnotacoesLidas, saida: SaidaDoGravador) {
    this.lidas = inicial
    this.gravado = inicial.texto
    this.digitado = inicial.texto ?? ''
    this.saida = saida
  }

  digitar(texto: string): void {
    this.digitado = texto
    clearTimeout(this.pausa)
    if (this.estado === 'salvo') this.estado = 'ocioso'
    if (this.estado !== 'conflito') this.pausa = setTimeout(() => void this.salvar(), PAUSA_DA_GRAVACAO_MS)
    this.avisar()
  }

  sairDoCampo(): Promise<void> {
    clearTimeout(this.pausa)
    return this.salvar()
  }

  /** Há texto que o banco ainda não tem (inclusive o de uma gravação em andamento). */
  pendente(): boolean {
    return precisaGravar(this.digitado, this.gravado)
  }

  /** Grava na hora; true quando nada ficou para trás (falha e conflito deixam o texto pendente). */
  async gravarAgora(): Promise<boolean> {
    await this.sairDoCampo()
    return !this.pendente()
  }

  /** No conflito: lê o texto gravado, troca o campo por ele e volta a gravar. A leitura que falha mantém o conflito. */
  async verTextoAtual(): Promise<void> {
    try {
      const lidas = await this.saida.ler()
      if (!lidas) return this.saida.aoSumir()
      this.lidas = lidas
      this.gravado = lidas.texto
      this.digitado = lidas.texto ?? ''
      this.mudarEstado('ocioso')
    } catch {
      // continua em conflito, com o texto de quem escrevia no campo; o botão tenta de novo
    }
  }

  ouvir(ouvinte: () => void): () => void {
    this.ouvintes.add(ouvinte)
    return () => {
      this.ouvintes.delete(ouvinte)
    }
  }

  encerrar(): void {
    clearTimeout(this.pausa)
  }

  // Uma gravação por vez: cada pedido entra na fila e confere de novo, quando chega a sua vez, se ainda há o que gravar.
  private salvar(): Promise<void> {
    this.fila = this.fila.then(() => this.gravarUmaVez())
    return this.fila
  }

  private async gravarUmaVez(): Promise<void> {
    const enviado = this.digitado
    if (this.estado === 'conflito' || !precisaGravar(enviado, this.gravado)) return
    this.mudarEstado('salvando')
    try {
      const resultado = await this.saida.gravar(this.gravado, textoParaGravar(enviado))
      if (resultado.tipo === 'conflito') return this.mudarEstado('conflito')
      this.lidas = resultado.anotacoes
      this.gravado = resultado.anotacoes.texto
      this.mudarEstado(precisaGravar(this.digitado, this.gravado) ? 'ocioso' : 'salvo')
    } catch (erro) {
      if (erro instanceof CadastroInexistente) return this.saida.aoSumir()
      this.mudarEstado('falha')
    }
  }

  private mudarEstado(estado: EstadoDaGravacao): void {
    this.estado = estado
    this.avisar()
  }

  private avisar(): void {
    this.ouvintes.forEach((ouvinte) => ouvinte())
  }
}
```

  Se algum teste mostrar que a falha deixou a fila rejeitada, o `catch` dentro de `gravarUmaVez` já a impede (nenhum erro sai dele).
- [x] **Passo 4: o hook** `src/hooks/useAnotacoesDoProcesso.ts` (até 40 linhas; sem teste próprio, os testes de tela das Tarefas 5 e 6 o exercitam):

```ts
import { useEffect, useReducer, useState } from 'react'
import { GravadorDeAnotacoes } from '../processos/GravadorDeAnotacoes'
import type { AnotacoesLidas, ModuloDeProcessos } from '../processos/tipos'

/**
 * Liga o gravador das Anotações do processo à tela: o componente relê o gravador a cada aviso dele e, enquanto houver
 * texto não gravado, o navegador pergunta antes de fechar a aba ou recarregar (spec, "Verso do cartão", Anotações).
 */
export function useAnotacoesDoProcesso(
  processos: ModuloDeProcessos, id: string, inicial: AnotacoesLidas, aoSumir: () => void,
): GravadorDeAnotacoes {
  const [, reler] = useReducer((vez: number) => vez + 1, 0)
  const [gravador] = useState(() => new GravadorDeAnotacoes(inicial, {
    gravar: (esperado, novo) => processos.gravarAnotacoes(id, esperado, novo),
    ler: () => processos.lerAnotacoes(id),
    aoSumir,
  }))

  useEffect(() => {
    const parar = gravador.ouvir(reler)
    return () => {
      parar()
      gravador.encerrar()
    }
  }, [gravador])

  useEffect(() => {
    const perguntar = (evento: BeforeUnloadEvent) => {
      if (!gravador.pendente()) return
      evento.preventDefault()
      evento.returnValue = '' // o Chrome antigo só pergunta com isto
    }
    window.addEventListener('beforeunload', perguntar)
    return () => window.removeEventListener('beforeunload', perguntar)
  }, [gravador])

  return gravador
}
```

- [x] **Passo 5:** `npx vitest run src/processos/GravadorDeAnotacoes.test.ts` passa; `npm test`, `npm run lint`, `npm run typecheck` verdes. Commit: `Ticket 23 de processos-etapas: gravador das Anotações`.

---

### Tarefa 5: O bloco na coluna direita (critérios 4, 6 e 8)

**Arquivos:** criar `src/components/processos/BlocoDasAnotacoes.tsx`, `src/components/processos/Anotacoes.css`, `src/hooks/useSaidaComAnotacoes.ts`, `src/testes/anotacoesNoVerso.tsx`, `src/App.anotacoesDoProcesso.test.tsx`; modificar `VersoDoCartao.tsx`.

**Consome:** `useAnotacoesDoProcesso`, `GravadorDeAnotacoes`, `EstadoDaGravacao` (Tarefa 4); `contagemDasAnotacoes`, `linhaDaUltimaAlteracao`, `LIMITE_DAS_ANOTACOES` (Tarefa 2); `lerAnotacoes` (Tarefa 3); `ErroAoCarregar`, `useCarregamento`.
**Produz:** `BlocoDasAnotacoes({ processo, processos, podeEscrever, guarda, aoSumir })`; `type GuardaDasAnotacoes = Pick<GravadorDeAnotacoes, 'pendente' | 'gravarAgora'>`; `useSaidaComAnotacoes()` que devolve `{ guarda, sair, seguir, desistir }` (nesta tarefa só o `guarda` é usado; a Tarefa 6 liga o resto).

- [x] **Passo 1: as ajudas de teste** em `src/testes/anotacoesNoVerso.tsx`:

```tsx
import { act, fireEvent, within } from '@testing-library/react'
import { vi } from 'vitest'
import { etapaDoProcesso, processoLido } from './processoNoVerso'
import { versoAberto } from './versoDoCartao'
import type { ProcessoLido } from '../processos/tipos'

export const ETAPAS_DAS_ANOTACOES = [etapaDoProcesso(1, 'modelagem', 'Modelagem piloto', { status: 'em_andamento', iniciadaEm: '2026-10-01' })]

export const processoDasAnotacoes = (mudancas: Partial<ProcessoLido> = {}): ProcessoLido => processoLido(ETAPAS_DAS_ANOTACOES, mudancas)

/** O bloco "Anotações" do verso aberto. */
export const blocoDasAnotacoes = async () => within(await (await versoAberto()).findByRole('region', { name: 'Anotações' }))

export const campoDasAnotacoes = async () => (await blocoDasAnotacoes()).findByRole('textbox', { name: 'Anotações' })

export const digitarNasAnotacoes = async (texto: string) => fireEvent.change(await campoDasAnotacoes(), { target: { value: texto } })

/** Deixa passar a pausa de 1 segundo do salvamento automático (o relógio simulado do Vitest). */
export const passarAPausa = () => act(() => vi.advanceTimersByTimeAsync(1000))
```

- [x] **Passo 2: os testes de tela que falham** em `src/App.anotacoesDoProcesso.test.tsx` (aplicativo inteiro por `montarVerso`; `shouldAdvanceTime` mantém o `findBy` funcionando com o relógio simulado):

```tsx
import { act, cleanup, fireEvent, screen, waitFor } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import { USUARIO_DE_TESTE } from './acesso/AcessoFalso'
import type { AnotacoesLidas, SituacaoDoProcesso } from './processos/tipos'
import {
  blocoDasAnotacoes, campoDasAnotacoes, digitarNasAnotacoes, passarAPausa, processoDasAnotacoes,
} from './testes/anotacoesNoVerso'
import { montarVerso } from './testes/processoNoVerso'
import { escolherNoMenuDoProcesso, versoAberto } from './testes/versoDoCartao'

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.location.hash = ''
})

const DA_BIA: AnotacoesLidas = { texto: 'Linha 1\nLinha 2', alteradoPor: 'Bia Teste', alteradoEm: '2026-10-12T15:05:00Z' }

test('o bloco é o primeiro da coluna direita, acima da Reunião, com o campo "Anotações" e a dica no vazio', async () => {
  montarVerso(processoDasAnotacoes())
  const campo = await campoDasAnotacoes()
  const coluna = campo.closest('.verso-contexto') as HTMLElement
  expect(coluna.firstElementChild?.querySelector('h3')?.textContent).toBe('Anotações')
  expect(campo.getAttribute('placeholder')).toBe('Escreva aqui as anotações do processo')
  const titulos = (await (await versoAberto()).findAllByRole('heading', { level: 3 })).map((titulo) => titulo.textContent)
  expect(titulos.indexOf('Anotações')).toBeLessThan(titulos.indexOf('Reunião'))
})

test('sem anotação gravada, a linha "Alterado por" não aparece; o estado fica vazio mas existe para o leitor de tela', async () => {
  montarVerso(processoDasAnotacoes())
  await campoDasAnotacoes()
  const bloco = await blocoDasAnotacoes()
  expect(bloco.queryByText(/^Alterado/)).toBeNull()
  expect(bloco.getByRole('status').textContent).toBe('')
})

test('digitar e parar grava uma vez, com "Salvando…" e depois "Salvo"', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  falso.anotacoes.segurar = true
  await digitarNasAnotacoes('Combinado com o setor')
  await passarAPausa()
  expect(await (await blocoDasAnotacoes()).findByText('Salvando…')).toBeTruthy()
  await act(async () => falso.anotacoes.liberar())
  expect(await (await blocoDasAnotacoes()).findByText('Salvo')).toBeTruthy()
  expect(falso.anotacoes.gravacoes).toEqual([{ id: 'p1', esperado: null, novo: 'Combinado com o setor' }])
})

test('digitar sem parar não grava a cada tecla', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  await digitarNasAnotacoes('A')
  await act(() => vi.advanceTimersByTimeAsync(600))
  await digitarNasAnotacoes('AB')
  await act(() => vi.advanceTimersByTimeAsync(600))
  await digitarNasAnotacoes('ABC')
  expect(falso.anotacoes.gravacoes).toHaveLength(0)
  await passarAPausa()
  await waitFor(() => expect(falso.anotacoes.gravacoes).toEqual([{ id: 'p1', esperado: null, novo: 'ABC' }]))
})

test('sair do campo grava sem esperar a pausa', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  await digitarNasAnotacoes('Ao sair')
  fireEvent.blur(await campoDasAnotacoes())
  await waitFor(() => expect(falso.anotacoes.gravacoes).toHaveLength(1))
})

test('depois de gravar aparece "Alterado por {nome} em {dd/mm}, {hh:mm}"', async () => {
  montarVerso(processoDasAnotacoes())
  await digitarNasAnotacoes('Texto')
  await passarAPausa()
  expect(await (await blocoDasAnotacoes()).findByText(`Alterado por ${USUARIO_DE_TESTE.nome} em 13/10, 14:30`)).toBeTruthy()
})

test('o texto gravado aparece ao abrir, com quem alterou', async () => {
  montarVerso(processoDasAnotacoes(), 'integrante_ep', [], (falso) => { falso.anotacoes.porProcesso.p1 = DA_BIA })
  expect(((await campoDasAnotacoes()) as HTMLTextAreaElement).value).toBe('Linha 1\nLinha 2')
  expect(await (await blocoDasAnotacoes()).findByText('Alterado por Bia Teste em 12/10, 12:05')).toBeTruthy()
})

test('a contagem some com 1.799 caracteres, aparece com 1.800, e o campo não passa de 2.000', async () => {
  montarVerso(processoDasAnotacoes())
  await digitarNasAnotacoes('a'.repeat(1799))
  expect((await blocoDasAnotacoes()).queryByText(/ de 2\.000$/)).toBeNull()
  await digitarNasAnotacoes('a'.repeat(1800))
  expect(await (await blocoDasAnotacoes()).findByText('1.800 de 2.000')).toBeTruthy()
  expect((await campoDasAnotacoes()).getAttribute('maxlength')).toBe('2000')
})

test('a Consulta lê o texto, com quebras de linha e "Alterado por", sem campo editável', async () => {
  montarVerso(processoDasAnotacoes(), 'consulta', [], (falso) => { falso.anotacoes.porProcesso.p1 = DA_BIA })
  const bloco = await blocoDasAnotacoes()
  expect((await bloco.findByText(/Linha 1/)).textContent).toBe('Linha 1\nLinha 2')
  expect(bloco.queryByRole('textbox')).toBeNull()
  expect(bloco.getByText('Alterado por Bia Teste em 12/10, 12:05')).toBeTruthy()
})

test('a Consulta vê "Sem anotações." quando está vazio, sem a linha "Alterado por"', async () => {
  montarVerso(processoDasAnotacoes(), 'consulta')
  const bloco = await blocoDasAnotacoes()
  expect(await bloco.findByText('Sem anotações.')).toBeTruthy()
  expect(bloco.queryByRole('textbox')).toBeNull()
  expect(bloco.queryByText(/^Alterado/)).toBeNull()
})

test('o arquivado só se lê, com a linha "Alterado por"', async () => {
  montarVerso(processoDasAnotacoes({ situacao: 'concluido', arquivadoEm: '2026-10-12T12:00:00Z' }), 'integrante_ep', [],
    (falso) => { falso.anotacoes.porProcesso.p1 = DA_BIA })
  const bloco = await blocoDasAnotacoes()
  expect((await bloco.findByText(/Linha 1/)).textContent).toBe('Linha 1\nLinha 2')
  expect(bloco.queryByRole('textbox')).toBeNull()
  expect(bloco.getByText('Alterado por Bia Teste em 12/10, 12:05')).toBeTruthy()
})

test.each<SituacaoDoProcesso>(['suspenso', 'cancelado', 'concluido'])('no processo %s ainda se escreve e grava', async (situacao) => {
  const falso = montarVerso(processoDasAnotacoes({ situacao }))
  await digitarNasAnotacoes('Por que parou')
  await passarAPausa()
  await waitFor(() => expect(falso.anotacoes.gravacoes).toHaveLength(1))
})

test('o subprocesso tem as suas Anotações, diferentes das do pai', async () => {
  const filho = processoDasAnotacoes({ id: 'p2', nome: 'Filho Teste', tipo: 'subprocesso', processoPaiId: 'p1' })
  montarVerso(processoDasAnotacoes(), 'integrante_ep', [filho], (falso) => {
    falso.anotacoes.porProcesso.p1 = { texto: 'Do pai', alteradoPor: null, alteradoEm: null }
    falso.anotacoes.porProcesso.p2 = { texto: 'Do filho', alteradoPor: null, alteradoEm: null }
  })
  expect(((await campoDasAnotacoes()) as HTMLTextAreaElement).value).toBe('Do pai')
  fireEvent.click(await (await versoAberto()).findByRole('link', { name: 'Filho Teste' }))
  await waitFor(async () => expect(((await campoDasAnotacoes()) as HTMLTextAreaElement).value).toBe('Do filho'))
})

test('o texto não vai ao Quadro nem à busca da Lista', async () => {
  montarVerso(processoDasAnotacoes(), 'integrante_ep', [], (falso) => {
    falso.anotacoes.porProcesso.p1 = { texto: 'Segredo do setor', alteradoPor: null, alteradoEm: null }
  })
  await campoDasAnotacoes()
  expect(screen.queryAllByText(/Segredo do setor/).filter((no) => no.tagName !== 'TEXTAREA' && no.closest('dialog') === null)).toHaveLength(0)
  window.location.hash = '#/processos/lista?busca=Segredo'
  expect(await screen.findByText('Nenhum processo com estes filtros.')).toBeTruthy()
})

test('gravar as Anotações não põe nada no Histórico do processo', async () => {
  montarVerso(processoDasAnotacoes())
  await digitarNasAnotacoes('Texto')
  await passarAPausa()
  await (await blocoDasAnotacoes()).findByText('Salvo')
  await escolherNoMenuDoProcesso('Histórico')
  expect(await screen.findByRole('heading', { name: 'Histórico' })).toBeTruthy()
  expect(screen.queryByText(/nota/i)).toBeNull()
})
```

  O último teste é uma garantia de tela (a falsa não gera evento); a prova de verdade de "sem evento" é o teste de banco da Tarefa 1. Se `Nenhum processo com estes filtros.` não for o texto exato de uma busca sem resultado, ajuste para o texto que `BuscaDaLista`/`FiltrosDosProcessos` mostram (veja `App.buscaNaLista.test.tsx`).
- [x] **Passo 3:** `npx vitest run src/App.anotacoesDoProcesso.test.tsx` — esperado: falham pelo motivo certo (sem a região "Anotações").
- [x] **Passo 4: implementar.**
  - `src/hooks/useSaidaComAnotacoes.ts`:

```ts
import { type MutableRefObject, useCallback, useRef, useState } from 'react'
import type { GravadorDeAnotacoes } from '../processos/GravadorDeAnotacoes'

/** O que o verso pergunta ao bloco das Anotações antes de deixar a pessoa sair: há texto sem gravar? grava na hora. */
export type GuardaDasAnotacoes = Pick<GravadorDeAnotacoes, 'pendente' | 'gravarAgora'>

export type SaidaComAnotacoes = {
  guarda: MutableRefObject<GuardaDasAnotacoes | null>
  /** Segue para `destino` se não há texto pendente ou se a gravação na hora deu certo; senão, guarda o destino e pede a confirmação. */
  sair: (destino: () => void) => void
  /** O destino que espera a confirmação; null sem confirmação aberta. */
  seguir: (() => void) | null
  desistir: () => void
}

export function useSaidaComAnotacoes(): SaidaComAnotacoes {
  const guarda = useRef<GuardaDasAnotacoes | null>(null)
  const [seguir, setSeguir] = useState<(() => void) | null>(null)
  const sair = useCallback((destino: () => void) => {
    const atual = guarda.current
    if (!atual?.pendente()) return destino()
    void atual.gravarAgora().then((gravou) => (gravou ? destino() : setSeguir(() => destino)))
  }, [])
  const desistir = useCallback(() => setSeguir(null), [])
  return { guarda, sair, seguir, desistir }
}
```

  - `Anotacoes.css` (importado por `BlocoDasAnotacoes.tsx`; só tokens que já existem em `src/styles/tokens.css`):

```css
/* O bloco Anotações, o primeiro da coluna direita do verso: quieto, só a falha (vermelho) e o conflito (amarelo) têm cor. */
.anotacoes-cabecalho {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  justify-content: space-between;
  gap: var(--esp-1) var(--esp-3);
}

.anotacoes-estado {
  color: var(--texto-2);
  font-size: var(--tam-secundario);
}

.anotacoes-campo {
  box-sizing: border-box;
  width: 100%;
  min-height: 3.5em;
  /* cerca de 12 linhas; depois disso o campo rola por dentro e não empurra a janela */
  max-height: 18em;
  padding: var(--esp-2);
  overflow-y: auto;
  resize: none;
  font: inherit;
  line-height: 1.5;
}

.anotacoes-contagem,
.anotacoes-autor {
  margin: 0;
  color: var(--texto-2);
  font-size: var(--tam-secundario);
}

.anotacoes-contagem {
  text-align: right;
}

.anotacoes-texto {
  margin: 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
}

.anotacoes-vazio {
  margin: 0;
  color: var(--texto-2);
}

.anotacoes-conflito {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--esp-2);
  padding: var(--esp-3);
  border: 1px solid var(--pendencia-borda);
  border-radius: var(--canto);
  background: var(--pendencia-fundo);
  color: var(--vencendo-texto);
}

.anotacoes-conflito p {
  margin: 0;
}
```

  - `BlocoDasAnotacoes.tsx`:

```tsx
import './Anotacoes.css'
import { type MutableRefObject, type ReactNode, useEffect, useId, useLayoutEffect, useRef, useCallback } from 'react'
import { useAnotacoesDoProcesso } from '../../hooks/useAnotacoesDoProcesso'
import { useCarregamento } from '../../hooks/useCarregamento'
import type { GuardaDasAnotacoes } from '../../hooks/useSaidaComAnotacoes'
import { LIMITE_DAS_ANOTACOES, contagemDasAnotacoes, linhaDaUltimaAlteracao } from '../../processos/anotacoes'
import type { EstadoDaGravacao, GravadorDeAnotacoes } from '../../processos/GravadorDeAnotacoes'
import type { AnotacoesLidas, ModuloDeProcessos, ProcessoLido } from '../../processos/tipos'
import { ErroAoCarregar } from '../cadastros/ErroAoCarregar'

type BlocoProps = {
  processo: ProcessoLido
  processos: ModuloDeProcessos
  /** Perfil que altera e processo não arquivado; senão, o bloco só mostra o texto. */
  podeEscrever: boolean
  guarda: MutableRefObject<GuardaDasAnotacoes | null>
  aoSumir: () => void
}

const SEM_ANOTACOES: AnotacoesLidas = { texto: null, alteradoPor: null, alteradoEm: null }

/** "Anotações" na coluna direita do verso: texto livre do processo, sem histórico (ADR 0021; spec, "Verso do cartão"). */
export function BlocoDasAnotacoes({ processo, processos, podeEscrever, guarda, aoSumir }: BlocoProps) {
  const idDoTitulo = useId()
  const ler = useCallback(() => processos.lerAnotacoes(processo.id), [processos, processo.id])
  const { estado, tentarDeNovo } = useCarregamento(ler)
  return (
    <section className="contexto-secao" aria-labelledby={idDoTitulo}>
      {estado.tipo === 'pronto'
        ? (
            podeEscrever
              ? <EditorDasAnotacoes idDoTitulo={idDoTitulo} inicial={estado.valor ?? SEM_ANOTACOES} processos={processos}
                  id={processo.id} guarda={guarda} aoSumir={aoSumir} />
              : <LeituraDasAnotacoes idDoTitulo={idDoTitulo} lidas={estado.valor ?? SEM_ANOTACOES} />
          )
        : (
            <>
              <CabecalhoDasAnotacoes idDoTitulo={idDoTitulo} />
              {estado.tipo === 'erro'
                ? <ErroAoCarregar alvo="as anotações" aoTentarDeNovo={tentarDeNovo} />
                : <p className="anotacoes-vazio" role="status">Carregando as anotações…</p>}
            </>
          )}
    </section>
  )
}

function CabecalhoDasAnotacoes({ idDoTitulo, children }: { idDoTitulo: string; children?: ReactNode }) {
  return (
    <div className="anotacoes-cabecalho">
      <h3 id={idDoTitulo} className="contexto-titulo">Anotações</h3>
      {children}
    </div>
  )
}

function LeituraDasAnotacoes({ idDoTitulo, lidas }: { idDoTitulo: string; lidas: AnotacoesLidas }) {
  return (
    <>
      <CabecalhoDasAnotacoes idDoTitulo={idDoTitulo} />
      {lidas.texto ? <p className="anotacoes-texto">{lidas.texto}</p> : <p className="anotacoes-vazio">Sem anotações.</p>}
      <QuemAlterouAsAnotacoes lidas={lidas} />
    </>
  )
}

function QuemAlterouAsAnotacoes({ lidas }: { lidas: AnotacoesLidas }) {
  const linha = linhaDaUltimaAlteracao(lidas.alteradoPor, lidas.alteradoEm)
  return linha && <p className="anotacoes-autor">{linha}</p>
}

type EditorProps = {
  idDoTitulo: string; inicial: AnotacoesLidas; processos: ModuloDeProcessos; id: string
  guarda: MutableRefObject<GuardaDasAnotacoes | null>; aoSumir: () => void
}

function EditorDasAnotacoes({ idDoTitulo, inicial, processos, id, guarda, aoSumir }: EditorProps) {
  const gravador = useAnotacoesDoProcesso(processos, id, inicial, aoSumir)
  useEffect(() => {
    guarda.current = gravador
    return () => {
      guarda.current = null
    }
  }, [gravador, guarda])
  const campo = useCampoQueCresce(gravador.digitado)
  const contagem = contagemDasAnotacoes(gravador.digitado)
  return (
    <>
      <CabecalhoDasAnotacoes idDoTitulo={idDoTitulo}><EstadoDasAnotacoes estado={gravador.estado} /></CabecalhoDasAnotacoes>
      <textarea ref={campo} className="anotacoes-campo" aria-labelledby={idDoTitulo} maxLength={LIMITE_DAS_ANOTACOES}
        placeholder="Escreva aqui as anotações do processo" value={gravador.digitado}
        onChange={(mudanca) => gravador.digitar(mudanca.target.value)} onBlur={() => void gravador.sairDoCampo()} />
      {contagem && <p className="anotacoes-contagem">{contagem}</p>}
      <AvisoDeConflito gravador={gravador} />
      <QuemAlterouAsAnotacoes lidas={gravador.lidas} />
    </>
  )
}

const TEXTO_DO_ESTADO: Record<EstadoDaGravacao, string> = { ocioso: '', salvando: 'Salvando…', salvo: 'Salvo', falha: '', conflito: '' }

// "Salvando…" e "Salvo" ficam numa região de status que já existe vazia (o leitor de tela a anuncia sem tirar o foco);
// a falha entra como alerta, que é anunciado ao aparecer.
function EstadoDasAnotacoes({ estado }: { estado: EstadoDaGravacao }) {
  if (estado === 'falha') {
    return <span role="alert" className="cadastros-falha">Não foi possível salvar. Seu texto continua aqui</span>
  }
  return <span role="status" className="anotacoes-estado">{TEXTO_DO_ESTADO[estado]}</span>
}

function AvisoDeConflito({ gravador }: { gravador: GravadorDeAnotacoes }) {
  if (gravador.estado !== 'conflito') return null
  return (
    <div className="anotacoes-conflito" role="alert">
      <p>Outra pessoa alterou as anotações enquanto você escrevia</p>
      <button type="button" className="botao botao-secundario" onClick={() => void gravador.verTextoAtual()}>Ver o texto atual</button>
    </div>
  )
}

// O campo cresce com o texto; a altura máxima e a rolagem por dentro são do CSS.
function useCampoQueCresce(texto: string) {
  const campo = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const elemento = campo.current
    if (!elemento) return
    elemento.style.height = 'auto'
    elemento.style.height = `${elemento.scrollHeight}px`
  }, [texto])
  return campo
}
```

    A divisão acima mantém cada componente curto (componentes `.tsx` não têm limite de linhas por função); o arquivo fica bem abaixo de 300. Se o `react-hooks` do ESLint reclamar de `guarda.current = gravador` no efeito, mantenha-o no efeito (escrever em ref fora da renderização é o permitido).
  - `VersoDoCartao.tsx`: chamar `const saida = useSaidaComAnotacoes()` em `VersoDoCartao` e passar `saida` a `ConteudoDoVerso` (acrescentar `saida: SaidaComAnotacoes` a `ConteudoProps`, e por ele a `ProcessoAbertoProps` e `CorpoProps`, que já recebem `{...verso}` e `{...props}`); em `ColunasDoVerso`, como primeiro filho de `verso-contexto`, antes da `ReuniaoDoProcesso`:

```tsx
        <BlocoDasAnotacoes key={processo.id} processo={processo} processos={processos} podeEscrever={alteravel}
          guarda={props.saida.guarda} aoSumir={aoSumir} />
```

    e o `import { BlocoDasAnotacoes } from './BlocoDasAnotacoes'` e o do tipo `SaidaComAnotacoes`/`useSaidaComAnotacoes`.
- [x] **Passo 5:** `npx vitest run src/App.anotacoesDoProcesso.test.tsx` passa; `npm test`, `npm run lint`, `npm run typecheck` verdes (conferir também que os testes de verso antigos, como `App.versoDoCartao` e `App.reuniaoDoProcesso`, seguem verdes: a coluna direita ganhou um bloco e a falsa responde às leituras sem preparo). Commit: `Ticket 23 de processos-etapas: bloco das Anotações no verso`.

---

### Tarefa 6: Falha, conflito e sair sem perder texto (critérios 5 e 6)

**Arquivos:** criar `src/components/processos/ConfirmarSaidaSemSalvar.tsx` e `src/App.anotacoesAoSair.test.tsx`; modificar `JanelaDeConfirmacao.tsx`, `VersoDoCartao.tsx`, `EstruturaDoProcesso.tsx`.

**Consome:** `SaidaComAnotacoes` (Tarefa 5), `JanelaDeConfirmacao`.
**Produz:** `JanelaDeConfirmacao` com a prop opcional `rotuloDoCancelar` (padrão "Cancelar"); `ConfirmarSaidaSemSalvar({ aberta, aoSair, aoContinuar })`; `EstruturaDoProcesso` com a prop `aoAbrir: (endereco: string) => void`.

- [x] **Passo 1: os testes que falham** em `src/App.anotacoesAoSair.test.tsx` (o arquivo abaixo já traz a moldura de `beforeEach`/`afterEach` da Tarefa 5):

```tsx
import { act, cleanup, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, beforeEach, expect, test, vi } from 'vitest'
import {
  blocoDasAnotacoes, campoDasAnotacoes, digitarNasAnotacoes, passarAPausa, processoDasAnotacoes,
} from './testes/anotacoesNoVerso'
import { montarVerso } from './testes/processoNoVerso'
import { escolherNoMenuDoProcesso, janelasPorCima, versoAberto } from './testes/versoDoCartao'

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
})
afterEach(() => {
  cleanup()
  vi.useRealTimers()
  window.location.hash = ''
})

const PERGUNTA = 'As anotações não foram salvas. Sair mesmo assim?'
const TEXTO_DA_FALHA = 'Não foi possível salvar. Seu texto continua aqui'
const TEXTO_DO_CONFLITO = 'Outra pessoa alterou as anotações enquanto você escrevia'
const fecharAJanela = async () => fireEvent.click((await versoAberto()).getByRole('button', { name: 'Fechar a janela' }))
const valorDoCampo = async () => ((await campoDasAnotacoes()) as HTMLTextAreaElement).value
const verso = () => screen.queryByRole('dialog', { name: /^Processo/ })

test('a falha mostra o aviso, mantém o texto e a próxima pausa tenta de novo', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  falso.anotacoes.falhasProgramadas = 1
  await digitarNasAnotacoes('Primeiro')
  await passarAPausa()
  expect((await (await blocoDasAnotacoes()).findByRole('alert')).textContent).toBe(TEXTO_DA_FALHA)
  expect(await valorDoCampo()).toBe('Primeiro')
  expect((await blocoDasAnotacoes()).queryByText('Salvo')).toBeNull()
  await digitarNasAnotacoes('Primeiro e segundo')
  await passarAPausa()
  expect(await (await blocoDasAnotacoes()).findByText('Salvo')).toBeTruthy()
  expect(falso.anotacoes.gravacoes.map((gravacao) => gravacao.novo)).toEqual(['Primeiro', 'Primeiro e segundo'])
})

test('o conflito avisa, mantém o texto, para de gravar e "Ver o texto atual" traz o texto e o autor da outra pessoa', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  await digitarNasAnotacoes('Meu texto')
  falso.anotacoes.alterarComoOutraPessoa('p1', 'Do colega', 'Bia Teste')
  await passarAPausa()
  expect((await (await blocoDasAnotacoes()).findByRole('alert')).textContent).toContain(TEXTO_DO_CONFLITO)
  expect(await valorDoCampo()).toBe('Meu texto')
  expect((await blocoDasAnotacoes()).queryByText('Salvo')).toBeNull()
  await digitarNasAnotacoes('Meu texto maior')
  await passarAPausa()
  expect(falso.anotacoes.gravacoes).toHaveLength(1)
  fireEvent.click((await blocoDasAnotacoes()).getByRole('button', { name: 'Ver o texto atual' }))
  await waitFor(async () => expect(await valorDoCampo()).toBe('Do colega'))
  expect((await blocoDasAnotacoes()).getByText('Alterado por Bia Teste em 13/10, 15:05')).toBeTruthy()
  await digitarNasAnotacoes('Do colega e eu')
  await passarAPausa()
  expect(await (await blocoDasAnotacoes()).findByText('Salvo')).toBeTruthy()
  expect(falso.anotacoes.gravacoes.at(-1)).toEqual({ id: 'p1', esperado: 'Do colega', novo: 'Do colega e eu' })
})

test('fechar o verso com texto pendente grava na hora e fecha, sem perguntar', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  await digitarNasAnotacoes('Pendente')
  await fecharAJanela()
  await waitFor(() => expect(verso()).toBeNull())
  expect(falso.anotacoes.gravacoes).toEqual([{ id: 'p1', esperado: null, novo: 'Pendente' }])
})

test('fechar sem texto pendente fecha na hora', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  await campoDasAnotacoes()
  await fecharAJanela()
  await waitFor(() => expect(verso()).toBeNull())
  expect(falso.anotacoes.gravacoes).toHaveLength(0)
})

test('Esc com texto pendente também grava e fecha', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  await digitarNasAnotacoes('Pendente')
  fireEvent(screen.getByRole('dialog', { name: /^Processo/ }), new Event('cancel', { cancelable: true }))
  await waitFor(() => expect(verso()).toBeNull())
  expect(falso.anotacoes.gravacoes).toHaveLength(1)
})

test('fechar com a gravação falhando pergunta; [Continuar escrevendo] mantém a janela e o texto', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  falso.anotacoes.falhasProgramadas = 1
  await digitarNasAnotacoes('Ainda não gravado')
  await fecharAJanela()
  const pergunta = within(await screen.findByRole('dialog', { name: PERGUNTA }))
  fireEvent.click(pergunta.getByRole('button', { name: 'Continuar escrevendo' }))
  await waitFor(() => expect(janelasPorCima()).toHaveLength(0))
  expect(verso()).not.toBeNull()
  expect(await valorDoCampo()).toBe('Ainda não gravado')
  await fecharAJanela()
  await waitFor(() => expect(verso()).toBeNull())
  expect(falso.anotacoes.gravacoes).toHaveLength(2)
})

test('fechar com a gravação falhando e escolher [Sair sem salvar] fecha sem gravar', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  falso.anotacoes.falhasProgramadas = 5
  await digitarNasAnotacoes('Perdido de propósito')
  await fecharAJanela()
  fireEvent.click(within(await screen.findByRole('dialog', { name: PERGUNTA })).getByRole('button', { name: 'Sair sem salvar' }))
  await waitFor(() => expect(verso()).toBeNull())
  expect(falso.anotacoes.porProcesso.p1).toBeUndefined()
})

test('fechar em conflito também pergunta', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  await digitarNasAnotacoes('Meu texto')
  falso.anotacoes.alterarComoOutraPessoa('p1', 'Do colega', 'Bia Teste')
  await fecharAJanela()
  expect(await screen.findByRole('dialog', { name: PERGUNTA })).toBeTruthy()
})

test('abrir um subprocesso com texto pendente grava antes de trocar', async () => {
  const filho = processoDasAnotacoes({ id: 'p2', nome: 'Filho Teste', tipo: 'subprocesso', processoPaiId: 'p1' })
  const falso = montarVerso(processoDasAnotacoes(), 'integrante_ep', [filho])
  await digitarNasAnotacoes('Do pai, pendente')
  fireEvent.click(await (await versoAberto()).findByRole('link', { name: 'Filho Teste' }))
  await waitFor(() => expect(window.location.hash).toBe('#/processos/p2'))
  expect(falso.anotacoes.porProcesso.p1?.texto).toBe('Do pai, pendente')
})

test('abrir o Histórico com a gravação falhando pergunta; [Sair sem salvar] abre o Histórico', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  falso.anotacoes.falhasProgramadas = 5
  await digitarNasAnotacoes('Pendente')
  await escolherNoMenuDoProcesso('Histórico')
  fireEvent.click(within(await screen.findByRole('dialog', { name: PERGUNTA })).getByRole('button', { name: 'Sair sem salvar' }))
  expect(await screen.findByRole('heading', { name: 'Histórico' })).toBeTruthy()
})

test('com texto pendente o navegador pergunta ao fechar a aba; sem pendência, não', async () => {
  montarVerso(processoDasAnotacoes())
  await digitarNasAnotacoes('Pendente')
  const comPendencia = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(comPendencia)
  expect(comPendencia.defaultPrevented).toBe(true)
  await passarAPausa()
  await (await blocoDasAnotacoes()).findByText('Salvo')
  const semPendencia = new Event('beforeunload', { cancelable: true })
  window.dispatchEvent(semPendencia)
  expect(semPendencia.defaultPrevented).toBe(false)
})

test('a falha e o conflito são avisos de alerta, e "Salvando…" e "Salvo" ficam numa região de status', async () => {
  const falso = montarVerso(processoDasAnotacoes())
  falso.anotacoes.segurar = true
  await digitarNasAnotacoes('A')
  await passarAPausa()
  expect((await blocoDasAnotacoes()).getByRole('status').textContent).toBe('Salvando…')
  falso.anotacoes.falhasProgramadas = 1
  await act(async () => falso.anotacoes.liberar())
  expect((await (await blocoDasAnotacoes()).findByRole('alert')).textContent).toBe(TEXTO_DA_FALHA)
})
```

  O teste do Esc usa o evento `cancel` do `<dialog>` (o jsdom não converte a tecla Esc nele); se o teste de Esc de outro arquivo do projeto usar outro gesto, siga o dele.
- [x] **Passo 2:** `npx vitest run src/App.anotacoesAoSair.test.tsx` — esperado: a falha e o conflito (que já funcionam pelo gravador) passam; os de fechar, Esc, subprocesso e Histórico falham (nada guarda a saída ainda) — conferir que falham pelo motivo certo (o verso fecha sem gravar; nenhum diálogo "As anotações não foram salvas").
- [x] **Passo 3: implementar.**
  - `JanelaDeConfirmacao.tsx`: nova prop `rotuloDoCancelar?: string` (padrão `'Cancelar'`) usada no segundo botão; os usos atuais não mudam.
  - `ConfirmarSaidaSemSalvar.tsx`:

```tsx
import { JanelaDeConfirmacao } from '../JanelaDeConfirmacao'

type ConfirmarSaidaSemSalvarProps = { aberta: boolean; aoSair: () => void; aoContinuar: () => void }

/** A confirmação simples (ADR 0003) de quem sai do verso com anotações que não foram gravadas. O foco abre em [Continuar escrevendo]. */
export function ConfirmarSaidaSemSalvar({ aberta, aoSair, aoContinuar }: ConfirmarSaidaSemSalvarProps) {
  return (
    <JanelaDeConfirmacao aberta={aberta} titulo="As anotações não foram salvas. Sair mesmo assim?" rotuloDaAcao="Sair sem salvar"
      rotuloDoCancelar="Continuar escrevendo" aoConfirmar={aoSair} aoFechar={aoContinuar} />
  )
}
```

  - `EstruturaDoProcesso.tsx`: a prop `aoAbrir: (endereco: string) => void` (repassada a `SecaoDaEstrutura`) e o link ganha o clique:

```tsx
// O pai e os subprocessos abrem na mesma janela; antes de trocar, o verso confere se há anotações sem gravar. Ctrl, Shift e
// o botão do meio seguem o comportamento normal do link (nova aba).
function abrirNaMesmaJanela(aoAbrir: (endereco: string) => void) {
  return (evento: MouseEvent<HTMLAnchorElement>) => {
    if (evento.button !== 0 || evento.ctrlKey || evento.metaKey || evento.shiftKey || evento.altKey) return
    evento.preventDefault()
    aoAbrir(evento.currentTarget.getAttribute('href') ?? '')
  }
}
```

    com `onClick={abrirNaMesmaJanela(aoAbrir)}` no `<a className="estrutura-link">` (importar `type MouseEvent` de `react`).
  - `VersoDoCartao.tsx`: em `VersoDoCartao`, `const fechar = () => saida.sair(aoFechar)`; passar `fechar` como `aoFechar` da `JanelaDoVerso` e `aoCancelar={modo === 'verso' ? fechar : () => aoMudarModo('verso')}`, e `aoFechar={fechar}` ao `ConteudoDoVerso` (o `...props` entra antes, o `aoFechar` guardado depois, para valer o guardado; o botão de fechar do cabeçalho, o `SemProcesso` e os demais caminhos do `aoFechar` passam a usá-lo); renderizar, depois do `ConteudoDoVerso`, dentro da `JanelaDoVerso`, `<ConfirmarSaidaSemSalvar aberta={saida.seguir !== null} aoSair={() => saida.seguir?.()} aoContinuar={saida.desistir} />`. Em `ProcessoAberto`: `aoAbrirHistorico={() => saida.sair(() => aoMudarModo('historico'))}` e `aoEditar={() => saida.sair(() => aoMudarModo('editar'))}`. Em `ColunasDoVerso`: `<EstruturaDoProcesso ... aoAbrir={(endereco) => saida.sair(() => { window.location.hash = endereco })} />`. O `aposExcluir` e os fechamentos que vêm de o processo ter sumido continuam chamando o `aoFechar` guardado ou o original conforme já estavam (excluir o processo torna o texto sem sentido; não precisa perguntar).
- [x] **Passo 4:** `npx vitest run src/App.anotacoesAoSair.test.tsx` passa; `npm test`, `npm run lint`, `npm run typecheck` verdes (os testes antigos que clicam nos links do pai e dos subprocessos, em `App.subprocessos.test.tsx`, seguem verdes: o clique agora acerta o `window.location.hash` em vez de seguir o link). Se `VersoDoCartao.tsx` passar de 300 linhas contadas, extraia `CorpoDoVerso`, `BotaoVoltarAoProcesso` e `EdicaoDoProcesso` para `CorpoDoVerso.tsx`. Commit: `Ticket 23 de processos-etapas: sair do verso sem perder as Anotações`.

---

### Tarefa 7: Conferência na tela e registros (critério 8, `[visual]`)

**Arquivos:** `.scratch/processos-etapas/desvios.md` (entrada nova, datada), `.scratch/processos-etapas/plano-23.md` (as caixas), `vitrine.local/main.tsx` (fora do git).

- [x] **Passo 1: conferir a tela** pela vitrine local com módulos falsos (como no ticket 22: servidor do Vite numa porta própria, por exemplo `npx vite --port 5175`, e a página `http://localhost:5175/vitrine.local/index.html`, no navegador do app, sem editar o `.claude/launch.json`; encerrar o servidor depois). Na `vitrine.local/main.tsx` (fora do git), dar Anotações a um processo (`proc.anotacoes.porProcesso.p1 = {...}` com texto inventado e autor) e deixar outro vazio. Conferir: o bloco como primeiro da coluna direita, acima da Reunião; o título e o "Salvando…/Salvo" lado a lado; o campo crescendo até cerca de 12 linhas e depois rolando por dentro, sem empurrar a janela; a linha "Alterado por" discreta abaixo; o aviso de falha em vermelho (`proc.anotacoes.falhasProgramadas = 1`) e o de conflito em amarelo com [Ver o texto atual] (`alterarComoOutraPessoa`); a Consulta e o arquivado só lendo; o texto longo com quebras de linha. Registrar o que foi visto e o que ficou presumido.
- [x] **Passo 2:** `desvios.md`: entrada datada "ticket 23" com as oito decisões deste plano, o que apareceu no caminho (vermelhos que vieram pelo motivo errado, ajustes de CSS depois da tela, testes antigos que mudaram) e a conferência da tela, com o que ficou **presumido**: a gravação e o conflito contra o banco de verdade na tela (a vitrine usa módulos falsos), o aviso nativo do navegador ao fechar a aba (o jsdom só prova o `preventDefault`) e o comportamento do botão Voltar do navegador com texto pendente.
- [x] **Passo 3:** `npm test` inteiro, `npm run lint`, `npm run typecheck`, `npm run check:circular` e a cobertura (`npm run test:coverage`) verdes. Commit: `Ticket 23 de processos-etapas: desvios e conferência`.
- [ ] **Passo 4:** (fora do plano de código, na branch principal, depois do merge, como manda o `/executar-complexo`) linha `Concluído em` no ticket 23, itens de `nao-testados.md` que aconteceram em `.scratch/melhorias-protocolo.md`, `.scratch/proximo-passo.md` e commit.

---

## Cobertura dos critérios do ticket 23

| Critério | Onde |
|-|-|
| 1. Teste de banco antes da migração, visto falhar (perfis, conflito, arquivado, limite, sem evento, autor e hora, pai e filho) | Tarefa 1 |
| 2. Fora das views, funções e pacote (teste de ausência) | Tarefa 1 (as duas últimas asserções; o `private.estado_do_processo` pelo teste do evento) |
| 3. Funções puras com testes unitários (quando gravar, limite e contagem, "Alterado por") | Tarefas 2 e 4 |
| 4. Testes de interface do aplicativo inteiro (bloco, "Salvando…/Salvo", dicas, Consulta, arquivado, subprocesso) | Tarefa 5 |
| 5. Falha, conflito, fechar o verso e aviso do navegador | Tarefa 6 |
| 6. Acessibilidade (nome "Anotações", região de status, alertas) | Tarefas 5 e 6 |
| 7. Migração não destrutiva, workflow "Migrar banco de desenvolvimento", "Testes de banco" e `db:types` | Tarefa 1 |
| 8. `[visual]` | Tarefa 7 |
