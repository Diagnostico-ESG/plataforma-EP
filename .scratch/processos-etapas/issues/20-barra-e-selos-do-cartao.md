# 20: A barra de progresso e os selos do cartão do Quadro

**Como resolve a sua parte.** Hoje o cartão do Quadro diz de quem é o processo, mas não onde ele está no caminho nem se algo foge do normal; para saber, é preciso abrir cada um. Este ticket traz do banco o que falta (início e status da etapa atual, o caminho de etapas, a última versão e a contagem de subprocessos) e mostra no cartão uma barra discreta com um pedaço por etapa e, só quando há algo a dizer, selos: processo parado, relatório pendente, etapa sem responsável, reunião próxima, versão e subprocessos. O cartão normal continua limpo.

**What to build:** migração não destrutiva que recria a view `processos_com_andamento` com os campos novos acrescentados no fim (etapa_atual_status, etapa_atual_iniciada_em, responsavel_ativo, caminho, ultima_versao_numero, ultima_versao_historica, ultima_versao_tem_relatorio, subprocessos_quantidade), com `security_invoker = true` e o mesmo `revoke` de visitante; teste de banco antes da migração, pelo GitHub Actions, e migração pelo workflow "Migrar banco de desenvolvimento", com o registro em `supabase/AMBIENTES.md`. O módulo de processos (real e falso) passa os campos à tela. No cartão: a barra de progresso (resolvidas preenchidas em cinza-escuro, a atual em azul, as seguintes em cinza-claro, nome acessível "Etapa {n} de {total}: {etapa}") e os selos na ordem dias parado, Relatório pendente, Sem responsável, Reunião, versão, subprocessos, cada um com a regra da spec. Spec: `.scratch/processos-etapas/spec.md` (histórias 141 a 154; "Interface", Quadro, itens Barra de progresso e Selos; "Modelo de dados", campos novos da view e "Migração da parte 4"; "Decisões de teste", cartão do Quadro, barra e selos, e parte 4 do banco; "Observações", parte 4).

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Teste de banco da view prova cada campo novo (início e status da etapa atual, caminho na ordem do catálogo, última versão histórica e não histórica, relatório presente e ausente, subprocesso cancelado fora da contagem, responsável inativo), que a Consulta lê os mesmos valores, e o `10_privilegios_padrao` continua passando; falhou antes da migração e passou depois, pelo GitHub Actions.
- [ ] Migração aplicada no desenvolvimento pelo workflow e registrada em `supabase/AMBIENTES.md`.
- [ ] A tradução da view para os tipos da tela cobre os campos novos, inclusive vazios.
- [ ] Funções puras com testes unitários: a barra a partir do caminho e os selos de um processo (quais e em que ordem).
- [ ] Barra em todo cartão, inclusive no suspenso, com dispensada e realizada anteriormente contando como resolvidas, e o nome acessível.
- [ ] Selo de dias com 16 dias e ausente com 15, no suspenso e na etapa atual pendente.
- [ ] Relatório pendente ausente na Relatório e modelagem técnica, presente na Revisão interna sem relatório, ausente com relatório e na última versão histórica.
- [ ] Sem responsável, Reunião (hoje, futura; ausente na passada), versão ("V3", "V5F", ausente sem versão) e subprocessos (cancelado fora da contagem; só no pai).
- [ ] Testes de interface com o aplicativo inteiro cobrindo os itens acima, para Integrante e Consulta.
- [ ] `[visual]` O cartão normal fica limpo: barra fina em cinza e azul e, no máximo, versão e subprocessos em texto neutro; só "{n} dias nesta etapa" e "Relatório pendente" em âmbar; os selos quebram de linha sem estourar a coluna.

Concluído em 2026-10-19 (commit cf06df0)
