# Plano do ticket 24: banco das passagens (Andamento livre)

> Executar com `superpowers:executing-plans`. Marcar `- [x]` ao fim de cada tarefa.

**Ticket:** `.scratch/processos-etapas/issues/24-banco-das-passagens.md` (os requisitos estão lá e na spec; aqui só a execução).
**Spec:** `.scratch/processos-etapas/spec.md`, seção "Andamento livre" (Modelo de dados, Quem pode o quê, Regras que o banco impõe, Regras de estado, Migração); `.scratch/publicacao-e-arquivamento/spec.md`, seção "Andamento livre" (Modelo de dados e Migração dos dados). ADRs 0022, 0023 e 0024.
**Branch:** `quadro-livre-parte-1`, criada da `main`, com o marco `marco/2026-10-24-inicio-quadro-livre-parte-1`. Sem worktree.

## Regras de `.claude/regras/banco.md` que valem aqui

- Estrutura muda só por migração nova (`npx supabase migration new`); nenhuma migração antiga é editada.
- `passagens` nasce com RLS ligada, políticas, o `revoke` padrão do visitante e os testes antes (teste visto falhar).
- A view recriada leva `security_invoker = true`; nenhuma função nova `security definer` (o pacote das planilhas continua o único, em `private`, com `search_path` vazio).
- Não guarde o que se calcula: a etapa atual é a passagem aberta, nunca uma coluna de `processos`.
- Cada célula de "quem pode o quê" vira teste com Administrador, Integrante, Consulta, inativo e visitante.
- Alvo conferido (`supabase/AMBIENTES.md` e `supabase/.temp/project-ref`) antes de qualquer comando que fale com o banco. **Este ticket não aplica nada no desenvolvimento** (a migração vai no ticket 04 de publicacao-e-arquivamento).

## Decisões de execução

1. **Ensaio automático (escolha do usuário em 2026-10-24).** O `scripts/testar-banco.mjs` passa a rodar, antes de cada arquivo de teste e dentro da mesma transação que o teste desfaz, as migrações da pasta com versão maior que a última registrada em `supabase_migrations.schema_migrations`. O banco de desenvolvimento não muda. Arquivo de teste com a linha `-- ensaio: migrações pendentes aqui` recebe as migrações nesse ponto, em vez de antes de tudo (é o caso do teste da conversão, que monta os dados no modelo antigo antes da migração). Depois da aplicação no ticket 04, não sobra pendência e o script volta ao comportamento de hoje.
2. **Três migrações, nesta ordem** (cada uma numa transação, eventos desligados com `session_replication_role = replica` só onde converte e apaga):
   - `andamento_livre_passagens`: tipo `etiqueta_da_etapa`, tabela `passagens` (RLS, políticas, índice único parcial, `revoke`), `processos.responsavel_id`, colunas de publicação, etapas fixas com catálogo renumerado, restrição da fase, **conversão** dos processos e da publicação (precisa do modelo antigo ainda de pé);
   - `andamento_livre_sai_o_modelo_anterior`: apaga os eventos antigos, as funções e gatilhos do modelo anterior, `andamentos`, `status_da_etapa`, `etapas.obrigatoria`, `vai_para_publicacao`; recria a view, `acrescentar_etapa`, `mover_etapa`, os gatilhos do catálogo, o estado do processo nos eventos e o pacote das planilhas (ver 4);
   - `andamento_livre_mover`: `mover_processo`, gatilho do cadastro, gatilho da etiqueta, responsável (gatilho de validação levado a `processos` e evento próprio), congelamento de suspenso, cancelado e arquivado, eventos da passagem.
3. **Revisão e aprovação:** saem `concluir_revisao_interna`, `concluir_aprovacao`, o "apagar a aprovação na volta" e os gatilhos de `andamentos` (`conferir_conclusao_da_etapa`, `conferir_autor_da_revisao_interna`). `conferir_revisao_interna_em_andamento` e `conferir_aprovacao_em_andamento` são recriadas lendo a passagem aberta, para os gatilhos de inclusão das duas tabelas não quebrarem até o ticket 05. As tabelas e os gatilhos de edição ficam; as funções novas chegam no ticket 05 de revisoes-aprovacao.
4. **Pacote das planilhas:** apagar `andamentos` quebraria `private.montar_pacote_das_planilhas` (teste 44). Ele é recriado com o mínimo para não ler o que saiu: `passagens` no lugar de `andamentos` (processo, etapa, entrou, saiu, etiqueta, concluído em; sem `movido_por`) e `publicado_em` no lugar de `vai_para_publicacao`. Suspensos fora, validação e o resto do conteúdo ficam no ticket 06 de exportacao-e-manutencao. Registrar no `desvios.md`.
5. **Tipos e tela:** o usuário preferiu não usar o Docker (2026-10-24): sem banco local, os testes de banco rodam só pelo Actions e `src/types/database.ts` é ajustado à mão, seguindo as migrações (o `db:types` remoto leria o banco antigo). Na tela, só o mínimo para `tsc` e `npm test` passarem (o ticket 25 reescreve a tela); cada remendo anotado no `desvios.md`.

6. **Testes antigos guiados pela falha:** os quatro arquivos novos vêm antes da migração e são vistos falhar. Os antigos são ajustados depois das migrações escritas, a partir das falhas da bateria com o ensaio: prever cada ajuste em 25 arquivos sem ver a falha custaria mais rodadas.

## Tarefas

### Tarefa 1: ensaio automático no executor dos testes de banco

**Arquivos:** `scripts/migracoesPendentes.mjs` (novo, função pura), `scripts/migracoesPendentes.test.mjs` (novo), `scripts/testar-banco.mjs`.

- [x] Teste Vitest que falha: `migracoesPendentes(arquivos, ultimaAplicada)` devolve, em ordem, só os `AAAAMMDDHHMMSS_nome.sql` com versão maior que `ultimaAplicada`; sem registro (`null`) recusa com mensagem que cita o valor recebido (rodar tudo apagaria o banco); ignora nomes fora do formato. E `comEnsaio(sqlDoTeste, pendentes)` devolve o teste intacto quando ele tem a linha `-- ensaio: sem migrações pendentes` ou quando não há pendentes, e senão `begin;` + migrações + teste.
- [x] Implementar as duas funções; `testar-banco.mjs` lê `max(version)` de `supabase_migrations.schema_migrations` uma vez, lista as pendentes e mostra quais vão no ensaio (só os nomes).
- [x] `npm test` verde; commit.

### Tarefa 2: testes de banco do modelo novo, vistos falhar

**Arquivos novos em `supabase/tests/`:**
- `51_passagens_e_perfis.test.sql`: cada célula de "quem pode o quê" (ler passagens, mover, etiqueta, incluir/apagar/alterar direto, `responsavel_id`, catálogo, view com os campos novos, eventos novos), com os cinco perfis;
- `52_mover_processo.test.sql`: regras de mover (cadastro em Não iniciados; frente e trás; etapa inativa; própria etapa sem passagem nem evento; fecha e abre; responsável e `movido_por`; um evento só; suspenso, cancelado e arquivado recusados; chegada a Concluídos sem nada, com data, com explicação, com data já registrada; explicação vazia e 2.001 caracteres; data futura e link `ftp://`; saída de Concluídos apagando a explicação e mantendo a data; `situacao = concluido` na view);
- `53_etiqueta_e_responsavel.test.sql`: etiqueta só na aberta, `concluido_em` preenchido e esvaziado, fixa em Concluídos, segunda passagem aberta recusada pelo índice; responsável Consulta e inativo recusados, evento próprio fora do movimento; congelamento nos três estados;
- `54_catalogo_com_fixas.test.sql`: fixas sem renomear, mover, desativar, apagar; nada antes de Não iniciados nem depois de Concluídos; etapa com processo dentro recusada com a contagem; etapa com passagem não se apaga e se desativa; as seis com campos próprios; fase vazia só nas fixas; etapa nova sem passagem; sem `obrigatoria`.

**Testes antigos** (a lista final do que foi reescrito e do que foi apagado vai para a seção "O que saiu dos testes", no fim deste plano):
- apagar os que provam regra que saiu: `18`, `19`, `35`, `36`, `48`;
- reescrever para as passagens: `17`, `20`, `21`, `22`, `34`, `37`, `45`, `49` (fica só o arquivamento e a trava do arquivado; registrar publicação sai até o ticket 04), `50`;
- ajustar os que só montam processos pelos andamentos: `27` a `32`, `38` a `41` (só o que não depende de `concluir_*`), `44` (só a troca de `andamentos` por `passagens` e de `vai_para_publicacao` por `publicado_em`).

- [ ] Escrever os quatro novos e os ajustes; `git push` da branch e disparar "Testes de banco": vermelho esperado (sem migração pendente ainda, as tabelas novas não existem). Anotar no plano a execução e as falhas principais.
- [ ] Commit dos testes.

### Tarefa 3: ensaio da conversão (teste temporário)

**Arquivo:** `supabase/tests/99_ensaio_conversao.test.sql`, com `-- ensaio: sem migrações pendentes`.

- [ ] Montar, no modelo antigo, processos com: Modelagem piloto pendente; etapa em andamento com responsável; concluído com escolha "sim" (Publicação concluída) e com escolha "não"; escolha "sim" com Publicação em andamento; arquivado; suspenso; eventos de cadastro, versão, andamento e escolha.
- [ ] Colar as três migrações (lidas dos arquivos, na ordem) e conferir passagem, etiqueta, responsável, entrada, `publicado_em`, explicação, arquivado e eventos (andamento e escolha sumiram; cadastro e versão ficaram).
- [ ] Fica vermelho até a Tarefa 4; apagado em commit à parte na Tarefa 6.

### Tarefa 4: as três migrações

**Arquivos:** `supabase/migrations/<data>_andamento_livre_passagens.sql`, `<data>_andamento_livre_sai_o_modelo_anterior.sql`, `<data>_andamento_livre_mover.sql` (todas por `npx supabase migration new`).

- [ ] Ler as migrações antigas que criam o que vai sair ou mudar (inventário: `20261013203452` a `20261023175017`) antes de escrever cada `drop`.
- [ ] Escrever as três migrações pela ordem da decisão 2.
- [ ] `git push` e "Testes de banco" na branch: todos os arquivos verdes, inclusive `00_rls_ligada`, `10_privilegios_padrao`, `46_funcoes_e_views_seguras` e o `99_ensaio_conversao`. Anotar a execução no plano.
- [ ] Commit da migração junto com os testes ajustados que ela fez passar e os tipos (Tarefa 5), conforme a regra do mesmo commit; se o workflow precisar da migração na branch antes dos tipos, migração e tipos em commits seguidos, como nos tickets anteriores.

### Tarefa 5: tipos e o mínimo na tela

**Arquivos:** `src/types/database.ts` e o que o `tsc` apontar (esperados: `src/processos/andamentosSupabase.ts`, `andamentoDoBanco.ts`, `catalogoSupabase.ts` e os tipos do catálogo).

- [ ] Gerar os tipos pela decisão 5.
- [ ] `npm run typecheck`: corrigir cada erro com o menor remendo (o ticket 25 reescreve); nunca `any`.
- [ ] `npm test` e `npm run lint` verdes; commit; remendos anotados no `desvios.md`.

### Tarefa 6: fechamento

- [ ] Apagar `99_ensaio_conversao.test.sql` (commit à parte) e rodar "Testes de banco" de novo: verde.
- [ ] `desvios.md`: ensaio automático, pacote mínimo, remendos da tela, o que saiu dos testes.
- [ ] Conferir os critérios do ticket um a um.

## O que saiu dos testes

(Preenchido na execução.)

## Execuções do "Testes de banco"

(Preenchido na execução.)
