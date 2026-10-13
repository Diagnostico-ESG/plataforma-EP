# 03: Responsáveis do setor

**Como resolve a sua parte.** A primeira etapa do setor é identificar quem responde por ele junto ao EP, e hoje esses nomes ficam em anotações soltas. Este ticket dá a cada setor a sua lista de responsáveis (nenhum ou vários, com nome, e-mail e cargo), mantida na tela do setor por Administrador e Integrante e vista por todos os perfis, com cada mudança no histórico.

**What to build:** tabela `responsaveis_do_setor`; seção "Responsáveis do setor" na tela do setor com [Novo responsável], [Editar] e [Excluir] (com confirmação); eventos no Histórico da área Setores. Spec: `.scratch/processos-etapas/spec.md` (histórias 48 a 52, 79, 83 a 85; seções "Interface", "Modelo de dados" e "Regras que o banco impõe").

**Blocked by:** 01 (Peças comuns de acesso ao banco).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Testes pgTAP antes da migração: cada célula de `responsaveis_do_setor` da tabela "quem pode o quê"; e-mail guardado em minúsculas, vazio vira nulo, mal formado recusado; excluir o setor apaga os responsáveis; cada ação gera o evento esperado, com o setor e o nome legíveis.
- [ ] Migração não destrutiva cria a tabela com RLS ligada, `revoke all` e privilégios mínimos; a política de leitura de eventos libera a entidade `responsavel_do_setor` a todo perfil ativo. `00_rls_ligada` e `10_privilegios_padrao` passam.
- [ ] O "antes" do evento de exclusão de setor passa a trazer a lista dos responsáveis; teste pgTAP.
- [ ] Módulo de processos (real e falso) ganha ler, criar, editar e excluir responsável; a recusa do e-mail vira "O e-mail deve ter o formato nome@dominio. Recebido: "{valor}"."; o e-mail também é conferido na tela antes de enviar; nome obrigatório conferido na tela.
- [ ] Tela do setor: lista com nome, e-mail e cargo; "Nenhum responsável cadastrado ainda."; "Carregando responsáveis…"; erro ao carregar com [Tentar de novo]; erro de gravação mantém o formulário; janela "Excluir o responsável {nome}?" [Excluir responsável] [Cancelar].
- [ ] A Consulta vê nome, e-mail e cargo, sem botões.
- [ ] Histórico da área Setores mostra os eventos dos responsáveis e entra no filtro pelo setor.
- [ ] Testes de interface com o aplicativo inteiro: criar, editar e excluir com sucesso e com falha, a validação do e-mail com o valor recebido, a janela (Cancelar e Esc sem gravar), a Consulta e os estados.
