# 02: Etapas do setor

**Como resolve a sua parte.** Antes de qualquer processo, cada setor passa uma única vez pelas etapas do setor: identificação dos responsáveis, sensibilização e identificação dos processos. Este ticket cria o catálogo de etapas no banco (com as 9 etapas da fase 1, ainda sem tela de administração) e dá a cada setor as suas etapas, registradas na tela do setor com a sequência garantida pelo banco e cada mudança no histórico. É a base para o processo saber quando o setor está pronto e para o caminho de etapas de todo o resto.

**What to build:** tabela `etapas` com a carga inicial; tabela `andamentos` (só a parte do setor neste ticket); andamentos criados para cada setor novo e para os existentes; na tela do setor, a seção "Etapas do setor" com Iniciar, Concluir, Dispensar (só opcional, com nota) e Realizada anteriormente (com nota); a janela com campo obrigatório (nota ou motivo) que os tickets seguintes reaproveitam; eventos no Histórico da área Setores. Datas de início e conclusão gravadas com o dia da ação (a correção é o ticket 06). Spec: `.scratch/processos-etapas/spec.md` (histórias 31, 33, 35 a 37, 45, 69, 79, 83 a 85; seções "Interface", "Modelo de dados", "Regras que o banco impõe" e "Regras de estado").

**Blocked by:** 01 (Peças comuns de acesso ao banco).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Testes pgTAP antes da migração: cada célula de `etapas` (ler; criar e alterar só administrador; código e nível imutáveis) e de `andamentos` (ler; alterar status e nota por Administrador e Integrante; criar e apagar direto recusados) da tabela "quem pode o quê"; setor novo nasce com 3 andamentos pendentes; sair de pendente com a anterior não resolvida recusado; segunda etapa em andamento no mesmo setor recusada; dispensar obrigatória recusado; dispensada e realizada anteriormente sem nota recusadas; transição não permitida recusada; cada ação gera o evento esperado.
- [ ] Migração não destrutiva cria os tipos `nivel_da_etapa` e `status_da_etapa`, as tabelas `etapas` (com as 9 etapas, códigos e marcações da spec) e `andamentos` (com as colunas da spec; `processo_id` pode nascer agora ou no ticket 04), RLS ligada, `revoke all` e privilégios mínimos; cria os andamentos dos setores existentes. `00_rls_ligada` e `10_privilegios_padrao` passam.
- [ ] Testes antigos que contam linhas de tabelas inteiras conferidos (o andamento nasce junto com o setor).
- [ ] Eventos com entidade `andamento`, guardando o id do setor, o nome e o código da etapa, antes, depois e a nota em `detalhes.motivo`; a política de leitura de eventos libera a entidade a todo perfil ativo.
- [ ] Módulo de processos (real e falso) nasce com: ler as etapas do setor e iniciar, concluir, dispensar e registrar como realizada anteriormente, usando as peças do ticket 01; recusas traduzidas para as mensagens da spec ("A etapa {anterior} ainda não foi resolvida.", "A etapa {nome} é obrigatória e não pode ser dispensada.", "Seu perfil não permite alterar os processos.").
- [ ] Janela com campo obrigatório no padrão do ADR 0003: foco no campo, botão de confirmar com o verbo e desabilitado com o campo vazio, Esc fecha sem gravar.
- [ ] Tela do setor: caminho das etapas do setor com status, datas e nota; ações só na etapa que pode andar; estados "Carregando etapas do setor…" e erro com [Tentar de novo]; a Consulta vê sem ações.
- [ ] Histórico da área Setores mostra os eventos das etapas do setor com os textos da spec e entra no filtro pelo setor.
- [ ] Testes de interface com o aplicativo inteiro: cada ação com sucesso e com falha, a janela de nota (vazia, Esc), a sequência recusada, a Consulta e os estados.
