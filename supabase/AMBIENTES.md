# Ambientes do banco

- desenvolvimento: remoto, projeto plataforma-ep-dev (ref yclkzyoebpsxmgpbcbus), região sa-east-1
- produção: ainda não criado
- vínculo atual: yclkzyoebpsxmgpbcbus
- última migração publicada em produção: nenhuma
- último backup de produção: nenhum
- último teste de restauração: nenhum

Observação (2026-10-06): na rede do escritório, só a porta 443 abre. Migrações e testes de banco vão à mão pelo SQL Editor do painel (ver `.scratch/inicio-projeto.md`).

Atualização (2026-10-09): os testes de banco passaram a rodar pelo GitHub Actions (workflow "Testes de banco", botão "Run workflow" ou envio na `main` que mexa em `supabase/`). A cadeia do Session pooler do projeto de desenvolvimento fica no segredo `SUPABASE_DB_URL` do repositório. Migrações continuam sendo aplicadas à mão no SQL Editor.

Migrações aplicadas à mão no dev pelo SQL Editor (fora do histórico da CLI; registrar com `npx supabase migration repair --status applied <versão>` numa rede liberada, antes da primeira publicação em produção):

- 20261007200505_login_perfis (2026-10-07; testes 02 e 03 passaram pelo SQL Editor)
- 20261007214206_autorizar_emails (2026-10-07; testes 04, 02 e 03 passaram pelo SQL Editor)
- 20261008125853_gerir_usuarios (2026-10-08; testes 05, 02, 03 e 04 passaram pelo SQL Editor)
- 20261008143706_historico_usuarios (2026-10-08; testes 06, 02, 03, 04 e 05 passaram pelo SQL Editor)
- 20261008154647_foto_acompanha_google (2026-10-08; testes 07, 05, 02, 03, 04 e 06 passaram pelo SQL Editor)
- 20261008155748_foto_a_cada_entrada (2026-10-08; correção do gatilho da foto; testes 07, 05, 02, 03, 04 e 06 passaram pelo SQL Editor)
- 20261008193100_sem_truncate (2026-10-08; bug do truncate; teste 08 falhou antes, 5 de 6, e passou depois, 6 de 6, pelo SQL Editor)
- 20261008205500_foto_pela_identidade (2026-10-08; achado da revisão de segurança do /ship; teste 07 falhou antes, 7 de 8, e passou depois, 8 de 8, pelo SQL Editor)
- 20261010012539_sem_privilegios_padrao (2026-10-09; bug das permissões padrão; teste 10 falhou antes, 15 permissões sobrando, e passou depois, pelo GitHub Actions)
- 20261013123327_setores (2026-10-13; cadastros-basicos, ticket 01; testes 11, 00 e 10 pelo GitHub Actions)
- 20261013133248_macroprocessos (2026-10-13; cadastros-basicos, ticket 03; teste 12 falhou antes, tabela inexistente, e passou depois, 48 de 48, com os 13 arquivos verdes, pelo GitHub Actions)
- 20261013150735_setores_envolvidos (2026-10-13; cadastros-basicos, ticket 04; aplicada pelo workflow "Migrar banco de desenvolvimento", o primeiro uso dele; teste 13 falhou antes, tabela inexistente, e passou depois, 56 de 56, com os 14 arquivos verdes, pelo GitHub Actions)
- 20261013163113_historico_dos_cadastros (2026-10-13; cadastros-basicos, ticket 05; teste 14 falhou antes, 23 de 25 (Integrante e Consulta sem leitura), e passou depois, 25 de 25, com os 15 arquivos verdes; aplicada pelo workflow "Migrar banco de desenvolvimento", sem o aviso de já aplicada, e testada pelo "Testes de banco" na branch)
- 20261013203452_etapas_do_setor (2026-10-13; processos-etapas, ticket 02; teste 15 falhou antes, tabela inexistente, e passou depois, 81 de 81, com os 16 arquivos verdes; aplicada pelo workflow "Migrar banco de desenvolvimento", sem o aviso de já aplicada, e testada pelo "Testes de banco" na branch)
- 20261013211710_responsaveis_do_setor (2026-10-13; processos-etapas, ticket 03; aplicada pelo workflow "Migrar banco de desenvolvimento", disparado pelo usuário no celular; o SQL Editor, rodado depois, recusou com "already exists", sem mudar nada; tabela confirmada pelo db:types; teste 16 falhou antes, tabela inexistente; depois, com o 11 e o 13 ajustados ao "antes" novo da exclusão do setor, os 17 arquivos verdes, o 16 com 49 de 49, pelo "Testes de banco" na branch)
- 20261014130147_processos (2026-10-14; processos-etapas, ticket 04; teste 17 falhou antes, tabela inexistente, e, depois da migração, uma vez por erro do próprio teste (subconsulta de exclusão sem filtro, corrigida); passou com os 18 arquivos verdes; aplicada pelo workflow "Migrar banco de desenvolvimento", disparado pelo navegador do app, e testada pelo "Testes de banco" na branch)
- 20261014135657_andamento_do_processo (2026-10-14; processos-etapas, ticket 05; teste 18 falhou antes, nos casos de sequência, evento e conclusão (a migração ainda não existia), e, depois da migração, o "Testes de banco" terminou com sucesso (teste 18 novo e teste 17 ajustado); aplicada pelo workflow "Migrar banco de desenvolvimento", disparado pelo navegador do app, na branch; sem mudança nos tipos do db:types)
- 20261014143045_voltar_datas_responsavel (2026-10-14; processos-etapas, ticket 06; teste 19 falhou antes, função inexistente, e depois da migração falhou uma vez por erro do próprio teste (as etapas do setor eram resolvidas num só comando, e o teste do inativo passava a descrição no lugar da mensagem esperada); com os dois ajustes, os 20 arquivos verdes, o 19 com 38 de 38; aplicada pelo workflow "Migrar banco de desenvolvimento", disparado pelo navegador do app, na branch; tipos regenerados com `db:types`: entrou `voltar_a_etapa` em `Functions`)
- 20261014201236_situacao_do_processo (2026-10-14; processos-etapas, ticket 07; teste 20 falhou antes, função inexistente (e o 17, nos dois casos da situação direta), e depois da migração falhou uma vez por um caso antigo do 17 (etapa de processo suspenso, agora congelada); com o 17 ajustado, os 21 arquivos verdes, o 20 com 31 de 31; aplicada pelo workflow "Migrar banco de desenvolvimento", disparado pelo navegador do app, na branch; tipos regenerados com `db:types`: entraram `suspender_processo`, `cancelar_processo` e `retomar_processo` em `Functions`)
- 20261014204810_subprocessos_e_reclassificacao (2026-10-14; processos-etapas, ticket 08; teste 21 falhou antes, função inexistente (e o 17, nos dois pontos ajustados: tipo e pai direto e a inclusão com pai); a primeira tentativa do workflow "Migrar banco de desenvolvimento" recusou o nome com a pasta (nada aplicado), a segunda aplicou; depois, os 22 arquivos verdes, o 21 com 34 de 34, pelo "Testes de banco" na branch; tipos regenerados com `db:types`: entrou `reclassificar_processo` em `Functions`)
- 20261014232135_catalogo_de_etapas (2026-10-14; processos-etapas, ticket 10; teste 22 falhou antes e passou depois, com os 23 arquivos verdes, pelo "Testes de banco" na branch (#53) e na `main` (#54); tipos regenerados com `db:types`)
- 20261015020342_reunioes (2026-10-15; reunioes, ticket 01; teste 23 falhou antes, tabelas e função inexistentes, aplicada pelo workflow "Migrar banco de desenvolvimento" na branch; o `SET CONSTRAINTS` da função de salvar precisou de nome qualificado, corrigido pela migração abaixo)
- 20261015022307_reunioes_salvar_com_nomes_qualificados (2026-10-15; reunioes, ticket 01; correção da função `salvar_reuniao`; o teste 23 e os demais passaram pelo "Testes de banco" na branch)
- 20261015034752_reunioes_participantes (2026-10-15; reunioes, ticket 03; teste 24 novo e teste 23 com os dois argumentos novos nas chamadas falharam antes, função de 11 parâmetros e tabelas inexistentes (42883); aplicada pelo workflow "Migrar banco de desenvolvimento", disparado pelo navegador do app, na branch; depois, os 25 arquivos verdes, o 23 com 66 de 66 e o 24 com 54 de 54, pelo "Testes de banco" na branch; tipos regenerados com `db:types`: entraram `reunioes_usuarios` e `reunioes_responsaveis` em `Tables` e `p_usuarios` e `p_responsaveis` em `salvar_reuniao`)
