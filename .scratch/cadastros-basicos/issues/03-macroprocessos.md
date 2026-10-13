# 03: Macroprocessos: ver, cadastrar, editar, desativar, reativar e excluir

**Como resolve a sua parte.** Os macroprocessos da Cadeia de Valor ganham, na aba Macroprocessos, o mesmo cadastro que os setores têm depois do 01 e do 02: lista, criação, edição, desativação, reativação e exclusão, com nome único, código opcional e categoria, e cada mudança no histórico.

**What to build:** aba Macroprocessos com a lista (código, nome, categoria, situação) e o macroprocesso aberto com código, nome, descrição e categoria; ciclo de vida completo; recusas de nome e código repetidos. Spec: `.scratch/cadastros-basicos/spec.md` (histórias 20 a 25, 32, 33, 41 a 44; seções "Interface", "Modelo de dados" e "Quem pode o quê").

**Blocked by:** 01 (Setores: ver e cadastrar). Pode correr em paralelo com o 02, mas usa a janela de confirmação compartilhada que o 02 move; se o 02 ainda não tiver terminado, faça o 02 antes.

**Status:** ready-for-agent

## Critérios de aceite

- [x] Testes pgTAP antes da migração: cada célula de `macroprocessos` da tabela "quem pode o quê", inclusive alterar `id` e `criado_em` recusado; e as regras de nome único (sem diferenciar maiúsculas e espaços nas pontas), código único quando preenchido, "" guardado como nulo e vários sem código aceitos.
- [x] Migração não destrutiva cria o tipo `categoria_macroprocesso` e a tabela `macroprocessos` com RLS ligada e os mesmos privilégios do 01; os testes gerais continuam passando sem mudança.
- [x] Gatilhos gravam em `eventos` (entidade `macroprocesso`) criar, editar, desativar, reativar e excluir, com antes e depois legíveis; teste pgTAP de cada ação.
- [x] Módulo de cadastros ganha as operações de macroprocesso (real e falso); recusas viram "Já existe um macroprocesso com o nome {nome}." e "Já existe um macroprocesso com o código {código}.", com teste do módulo real.
- [x] Lista ordenada pelo código, com os sem código depois, em ordem alfabética; "Mostrar inativos" e a pílula; estados "Carregando macroprocessos…", "Nenhum macroprocesso cadastrado ainda.", erro de carregamento com [Tentar de novo].
- [x] Formulário com seletor de categoria ("Sem categoria", Finalístico, Apoio, Gerencial); só o nome obrigatório.
- [x] Excluir com a janela "Excluir o macroprocesso {nome}?" (neste ticket com zero setores envolvidos), [Excluir macroprocesso] e [Cancelar]; Desativar e Reativar sem confirmação; item que não existe mais com [Voltar à lista].
- [x] A Consulta vê a aba sem botões nem campos editáveis.
- [x] Testes de interface com o aplicativo inteiro cobrindo lista, ordem, criar, editar, desativar, reativar e excluir com sucesso e com falha, cada recusa, a janela, os estados e a Consulta.
