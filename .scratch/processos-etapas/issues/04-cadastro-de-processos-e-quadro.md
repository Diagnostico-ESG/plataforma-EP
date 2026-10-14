# 04: Cadastro de processos e o Quadro

**Como resolve a sua parte.** Com os setores e as etapas do setor prontos, a equipe precisa cadastrar os processos que vai mapear e vê-los num lugar só. Este ticket cria o processo (do tipo Processo ou "A classificar"), ligado ao setor dono e a um macroprocesso em que esse setor é envolvido, e mostra todos no Quadro, cada um na coluna da etapa atual ou em "Aguardando o setor". O painel do processo abre com os dados, o caminho de etapas (ainda só para leitura) e o histórico, e os cadastros passam a recusar apagar o que um processo usa.

**What to build:** tabela `processos` e os andamentos do processo; view `processos_com_andamento`; cadastrar, editar (inclusive mover de macroprocesso, com o setor incluído como envolvido se faltar) e excluir (com confirmação) processo; Quadro com colunas e cartões; painel com dados, caminho de etapas só para leitura (as do setor com "Ver no setor") e aba Histórico; recusas de excluir setor ou macroprocesso com processo e de tirar setor envolvido com processos. Subprocessos ficam para o ticket 08. Spec: `.scratch/processos-etapas/spec.md` (histórias 1 a 7, 12 a 15, 17 a 20, 23, 28, 29, 44, 47, 78, 80, 83 a 87; seções "Interface", "Modelo de dados", "Regras que o banco impõe").

**Blocked by:** 02 (Etapas do setor).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Testes pgTAP antes da migração: cada célula de `processos` e de `processos_com_andamento` da tabela "quem pode o quê"; nome único por setor sem diferenciar maiúsculas (aceito em outro setor); processo novo nasce com 6 andamentos pendentes; setor fora do macroprocesso é incluído como envolvido, com o evento; tirar setor envolvido com processos recusado; excluir setor e macroprocesso com processo recusado; mudar `tipo` direto recusado; cada ação gera o evento esperado e a exclusão traz os andamentos no "antes".
- [ ] Migração não destrutiva cria os tipos `tipo_de_processo`, `origem_do_processo` e `situacao_guardada`, a tabela `processos` (com a referência composta a `setores_envolvidos`) e a view com `security_invoker = true`, RLS ligada, `revoke all` e privilégios mínimos. `00_rls_ligada` e `10_privilegios_padrao` passam.
- [ ] A view devolve a etapa atual, a indicação de "aguardando o setor", o responsável da etapa atual e a situação calculada da spec.
- [ ] Módulo de processos (real e falso) ganha listar, ler, criar, editar e excluir processo; recusas traduzidas: "Já existe um processo com o nome {nome} no setor {SIGLA}.", "Não é possível excluir: {setor | macroprocesso} tem {n} processos ligados.", "O setor {SIGLA} tem {n} processos neste macroprocesso; mova-os ou exclua-os antes.".
- [ ] Formulário: nome, setor e macroprocesso (só ativos), tipo (Processo ou A classificar, padrão A classificar), origem (padrão Novo), contexto e observações; aviso amarelo de setor que será incluído; erro de gravação mantém os dados.
- [ ] Quadro (`#/processos`): colunas "Aguardando o setor" e uma por etapa ativa do processo; cartão com sigla, nome, macroprocesso, pílula "A classificar" e responsável; rolagem lateral; o estado vazio existente com [Cadastrar processo] passa a funcionar; "Carregando processos…" com colunas-fantasma; erro com [Tentar de novo].
- [ ] Painel (`#/processos/<id>`): cabeçalho, dados com [Editar] e [Excluir], caminho de etapas só para leitura, aba Histórico com os textos da spec; "Carregando processo…"; "Este processo não existe mais…" com [Voltar].
- [ ] Janela "Excluir o processo {nome}?" com [Excluir processo] [Cancelar].
- [ ] A Consulta vê Quadro e painel sem botões.
- [ ] Testes de interface com o aplicativo inteiro: cadastrar, editar, mover de macroprocesso e excluir com sucesso e com falha, cada recusa, o aviso de setor incluído, as colunas, a Consulta e os estados.

Concluído em 2026-10-14 (commit 947b1df)
