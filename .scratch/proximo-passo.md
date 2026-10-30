# Próximo passo (2026-10-30)

**Comando:** `/polir` (Sonnet), para a funcionalidade `responsavel-inicial-por-etapa`: ela mexeu na interface (coluna Responsável inicial do Catálogo de etapas). Depois, `/ship` (Sonnet; Opus na revisão de segurança) para a entrega, já que há migração nova.

**Já feito:** responsavel-inicial-por-etapa implementada e na `main` (commit da tarefa 5: 6cbba30; merge 51b5ed2). Banco: coluna, regra no mover/cadastro/retomar e evento da etapa; pgTAP 73 (34 asserções) verde no Docker local (1.757 ok) e "Testes de banco" verde no GitHub; migração aplicada no desenvolvimento remoto pelo workflow. Tela: coluna no Catálogo, histórico com o nome. 3.252 testes e cobertura 99,2%.

**Depende do usuário:** conferir o Catálogo na tela real (só vista na vitrine local); escolher o responsável inicial de cada etapa (hoje todas começam vazias, então mover e cadastrar deixam o processo **sem responsável** até a escolha); processos já existentes ficam como estão.

**Pendências de ambiente (não desta entrega):** migrações anteriores ainda sem aplicar no remoto de desenvolvimento (fim_do_arquivado, tirar_e_voltar_ao_quadro, se ainda for o caso) e funções arquivos-no-drive / planilhas-dos-dashboards sem nova publicação.
