# Modelo de dados, em linguagem de manutenção

Tudo está no banco PostgreSQL do Supabase, no schema `public` (o que a plataforma enxerga) e no schema `private` (funções internas que a tela nunca alcança). A estrutura só muda por arquivo de migração em `supabase/migrations/`; nunca se edita uma migração que já foi aplicada, porque o banco ficaria diferente do arquivo: o conserto é uma migração nova. Os nomes e as colunas abaixo vêm de `src/types/database.ts`, que o comando `npm run db:types` regenera a partir do banco.

Termos usados aqui:

- **RLS (Row Level Security):** regra do próprio banco que decide quais linhas cada pessoa pode ver ou mexer. É ela que protege os dados: esconder um botão na tela não protege nada.
- **Política:** cada regra da RLS (por exemplo, "só o Administrador ativo lê esta tabela").
- **Gatilho (trigger):** trecho de código do banco que roda sozinho quando uma linha é criada, mudada ou apagada. Aqui eles gravam o histórico e impõem regras.
- **View:** consulta salva que se usa como se fosse uma tabela. Aqui, tudo que se calcula é view ou função, nunca uma coluna guardada.
- **Enum:** coluna que só aceita uma lista fechada de valores.

## Regras que valem em todo o banco

1. Toda tabela nasce com RLS ligada. O teste `supabase/tests/00_rls_ligada.test.sql` falha se alguma ficar sem.
2. A tela usa só a chave publicável do Supabase. A chave secreta (`sb_secret_…` ou `service_role`) não existe na plataforma.
3. Função que roda com poderes de quem a criou (`security definer`) fica só no schema `private`, com `search_path` vazio.
4. Toda view usa `security_invoker = true`, para respeitar a RLS de quem consulta.
5. O que se calcula (a etapa atual do processo, contagens) é view ou função. Duas fontes para a mesma informação acabam divergindo.
6. Cada mudança relevante grava uma linha em `eventos` (quem, quando, o que mudou). O histórico nunca é apagado.
7. Usuário que já entrou não se exclui, só se desativa (ADR 0002).

## Quem pode o quê

Três perfis (tipo `perfil`): **Administrador**, **Integrante do EP** e **Consulta**. Todo usuário novo nasce como Consulta.

| Perfil | Pode |
| --- | --- |
| Consulta | Ler processos, andamento, versões, setores, macroprocessos e o histórico. Não grava nada. |
| Integrante do EP | O de Consulta, mais criar e editar processos, mover etapas, enviar versões, registrar revisão e aprovação, e substituir arquivo. |
| Administrador | O de Integrante, mais usuários e autorizações, cadastros (setores e macroprocessos), catálogo de etapas e planilhas dos dashboards. |

Usuário **inativo** (`usuarios.ativo = false`) perde todo o acesso pela política; o registro e o histórico dele ficam.

A tabela "quem pode o quê" completa de cada funcionalidade está na spec dela, em `.scratch/<funcionalidade>/spec.md`, e cada célula tem teste em `supabase/tests/`.

## Tabelas (schema `public`)

### Acesso

| Tabela | O que guarda |
| --- | --- |
| `autorizacoes` | Quem pode entrar: e-mail institucional e perfil, cadastrados pelo Administrador antes do primeiro acesso. |
| `usuarios` | Quem já entrou: nome, perfil, ativo, foto e data do primeiro acesso. O `id` é o mesmo do login (`auth.users`). A linha nasce por gatilho no primeiro acesso. |
| `usuarios_emails` | O e-mail de cada usuário, em tabela própria: só o próprio usuário e o Administrador (ativos) o leem. |

### Cadastros

| Tabela | O que guarda |
| --- | --- |
| `setores` | Sigla e nome de cada setor, com `ativo`. |
| `macroprocessos` | Código, nome, categoria (`finalistico`, `apoio`, `gerencial`) e `ativo`. |
| `setores_envolvidos` | Quais setores participam de cada macroprocesso, com observação. |

### Processos e andamento

| Tabela / view | O que guarda |
| --- | --- |
| `processos` | Cada processo, subprocesso ou item "a classificar": nome, tipo, setor, macroprocesso, processo pai, situação guardada (`em_andamento`, `suspenso`, `cancelado`), motivo, observações, origem (`novo` ou `retomado`) a data da modelagem piloto (campo único, pode ficar vazio) e a **data da validação** (o dia em que o setor validou o fluxo; opcional, só se grava pela função `registrar_data_da_validacao`, com o processo na Validação com o setor, e nunca no futuro). |
| `etapas` | O **catálogo de etapas**: código, nome, ordem, obrigatória ou opcional, ativa e a **fase do Regimento** (IV a IX). O Administrador muda o catálogo sem mexer no código (ADR 0004). |
| `andamentos` | Uma linha por processo e etapa: status (`pendente`, `em_andamento`, `concluida`, `realizada_anteriormente`, `dispensada`), responsável, datas e nota. |
| `processos_com_andamento` (view) | O que a tela lê: o processo com a etapa atual, o responsável, o setor, o macroprocesso, a última versão e a situação já calculada. Traz também `tem_versao_piloto`, `tem_versao_em_sequencia` e `tem_relatorio_numerado`, que a tela lê para decidir a janela da trava de arquivos. |
| `eventos` | O histórico de tudo: autor, data, ação, entidade e detalhes. Quase só se lê. |

### Versões e arquivos

| Tabela | O que guarda |
| --- | --- |
| `versoes` | A versão do processo: número sequencial por processo, quem enviou, em que etapa, se é histórica ou piloto (ADR 0005 e 0025). |
| `arquivos_da_versao` | Os arquivos de cada versão: papel (`bpm`, `png`, `bpmn`, `relatorio`), nome, formato, tamanho, hash MD5 e o identificador do arquivo **no Drive**. O relatório de versão que não é histórica tem ainda o número próprio (`numero_do_relatorio`: Relatório V1, V2…, dado pelo banco, único por processo, ADR 0026). O arquivo em si não está no banco (ADR 0008). |
| `pastas_no_drive` | A pasta do Drive de cada processo e setor, criada no primeiro envio. |
| `revisoes_internas` | Cada revisão interna: versão revisada, resultado (`sem_alteracao` ou `corrigida`), escopo, comentário e revisor (ADRs 0009 e 0015). |
| `aprovacoes` | A aprovação: versão aprovada, número e link do E-protocolo e data (todos opcionais, ADR 0015). |
| `pdfs_da_aprovacao` | O .pdf protocolado de cada aprovação, no Drive (nome `{sigla}_V8_{processo}_Aprovação.pdf`, tamanho, MD5 e identificador no Drive). Um atual por aprovação; quando uma aprovação nova toma o lugar da anterior, o .pdf da anterior fica guardado (`guardado_em`) e aparece no histórico. Nada se apaga. |

### Planilhas dos dashboards

| Objeto | O que guarda |
| --- | --- |
| `atualizacoes_das_planilhas` | Cada tentativa de atualizar as duas planilhas: origem (`automatica` ou `botao`), quem pediu, início, fim, resultado e motivo. Só o Administrador lê. |
| `resultado_das_atualizacoes_das_planilhas` (view) | A mesma lista, com o resultado já traduzido e o nome de quem pediu. |

Veja `06-planilhas-e-dashboards.md`.

## Funções que a tela chama (`public`)

Cada uma faz a regra inteira de uma vez: ou tudo acontece, ou nada muda.

| Grupo | Funções |
| --- | --- |
| Etapas | `avancar_etapa` (resolve a atual e inicia a próxima), `voltar_a_etapa`, `mover_etapa`, `acrescentar_etapa` (catálogo; recebe a fase) |
| Processo | `suspender_processo`, `retomar_processo`, `cancelar_processo`, `reclassificar_processo` |
| Versões | `registrar_versao`, `registrar_versao_historica`, `enviar_relatorio`, `acrescentar_arquivo`, `substituir_arquivo` |
| Revisão e aprovação | `concluir_revisao_interna`, `concluir_aprovacao` |
| Data da validação e .pdf da aprovação | `registrar_data_da_validacao`, `registrar_pdf_da_aprovacao`, `substituir_pdf_da_aprovacao` |
| Planilhas | `pedir_atualizacao_das_planilhas` (botão), `links_das_planilhas`, `registrar_resultado_das_planilhas` (chamada pela função do servidor, sem login) |

As funções do schema `private` (conferências, gatilhos, a montagem do pacote das planilhas) não aparecem para a tela.

## Regras de negócio que moram no banco

- **No máximo uma etapa em andamento por processo** (índice único em `andamentos`).
- **Revisão e aprovação travam a conclusão**: não se conclui a revisão interna sem uma revisão da versão mais recente; revisão pelo setor e aprovação exigem versão completa (`.bpm`, `.png` e relatório); a aprovação não se faz sem versão (ADRs 0009, 0012, 0015 e 0016).
- **Trava de arquivos** (ADR 0025): `mover_processo` recusa mover o processo para a frente da Modelagem piloto sem uma versão piloto (uma versão em sequência também basta) e para a frente da Relatório e modelagem técnica sem uma versão em sequência e um relatório numerado (`private.conferir_trava_de_arquivos`). Voltar, a mesma etapa, o processo que já estava adiante e a etapa desativada no catálogo não travam. A recusa vem como `trava_piloto` ou `trava_tecnica:versao|relatorio|versao_e_relatorio`.
- **Data da validação e .pdf da aprovação** (migração `20261026164641_data_da_validacao_e_pdf_da_aprovacao`): a data só se grava na Validação com o setor, com o processo em andamento, e não pode ser futura; o .pdf só entra numa aprovação que existe, com a versão aprovada no nome, com o processo em andamento ou concluído (nunca arquivado), e se substitui sem guardar o conteúdo anterior (ADR 0007); o .pdf de uma aprovação trocada fica guardado.
- **Autor não revisa a própria versão** (ADR 0014), conferido na hora de escolher o responsável.
- **Versão aprovada não tem arquivo substituído** (ADR 0011).
- **Etapas de revisão e de aprovação não se desativam nem se excluem** (gatilho `bloquear_etapa_protegida`).
- **Datas no fuso de Brasília** (`private.hoje()`).
- **O identificador do Drive de cada arquivo tem formato** conferido pelo banco (migração `20261016200000_drive_id_com_formato`).

## Objetos que existiram e foram apagados

Por decisão do usuário (ADR 0013), as migrações `20261018123613_data_da_reuniao`, `20261018132857_responsaveis_do_setor_saem` e `20261018141346_sem_etapas_do_setor` apagaram as tabelas de reuniões, de participantes, de responsáveis do setor e as etapas do setor. Se você as encontrar nas primeiras migrações, é histórico; não existem mais no banco.

A data do encontro do EP com o setor é a **Data da modelagem piloto**, a coluna `processos.data_da_modelagem_piloto` (opcional). Ela se chamava `data_da_reuniao` até a migração `20261025194034_data_da_modelagem_piloto`, que só renomeou a coluna e recriou a view `processos_com_andamento` e a função do pacote das planilhas. Os eventos do histórico gravados antes dessa migração continuam com a chave antiga `data_da_reuniao`; a tela lê as duas.

## Como conferir o banco real

1. No painel do Supabase do ambiente, abra **SQL Editor**.
2. Rode `select table_name from information_schema.tables where table_schema = 'public' order by 1;` e compare com as tabelas acima.
3. Rode `select tablename from pg_tables where schemaname = 'public' and not rowsecurity;`. O resultado deve vir vazio (toda tabela com RLS).
4. No projeto, rode `npm run db:types` com o vínculo conferido e veja se o `git diff` de `src/types/database.ts` está vazio.

Em produção (ainda não existe): **conferir no `/ship` de produção** que o resultado do passo 2 é o mesmo do desenvolvimento.
