# 01: Setores: ver e cadastrar

**Como resolve a sua parte.** É o primeiro caminho completo da funcionalidade: o item Setores da faixa lateral passa a abrir a área Setores, e a equipe do EP vê a lista dos setores e cadastra um novo, com a sigla conferida na tela e no banco. Este ticket cria a base que os outros usam: a área com as três abas no endereço, a tabela `setores` com as regras de perfil, os gatilhos de evento e o módulo de cadastros por onde a interface fala com o banco.

**What to build:** área Setores (`#/setores`) com as abas Setores, Macroprocessos e Histórico (só a primeira com conteúdo neste ticket); lista dos setores ativos ordenada pela sigla; [Novo setor] com o formulário de nome, sigla e observações; recusa de sigla e nome repetidos; a Consulta vê a lista sem botões. Spec: `.scratch/cadastros-basicos/spec.md` (histórias 1, 4 a 9, 19, 41 a 44; seções "Interface", "Modelo de dados" e "Quem pode o quê").

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Testes pgTAP antes da migração: cada célula de `setores` da tabela "quem pode o quê" (Administrador, Integrante, Consulta, inativo e visitante), inclusive alterar `id` e `criado_em` recusado; e as regras de sigla (formato, maiúsculas, " cee " guardada como "CEE", recusas de "C E", "CEE_PR", "CÊE", "C" e de 16 caracteres), sigla única e nome único sem diferenciar maiúsculas e espaços nas pontas.
- [ ] Migração não destrutiva cria `setores` com RLS ligada, `revoke all` de visitante e logado e concessão de volta só de ler, incluir, alterar e apagar a logado; `00_rls_ligada` e `10_privilegios_padrao` continuam passando sem mudança.
- [ ] Gatilhos de `setores` gravam em `eventos` (entidade `setor`) a criação, a edição, a desativação, a reativação e a exclusão, com autor e antes e depois legíveis; teste pgTAP de cada ação. (A tela dessas ações chega no 02; o gatilho nasce aqui para o histórico ficar completo desde o início.)
- [ ] Módulo de cadastros novo, separado do módulo de acesso e injetado no aplicativo: listar setores e criar setor, com implementação real pela chave publicável e implementação falsa nomeada com falhas programáveis.
- [ ] Recusas do banco viram as mensagens da spec ("Já existe um setor com a sigla {SIGLA}.", "Já existe um setor com o nome {nome}.", "Seu perfil não permite alterar os cadastros."), com teste do módulo real e o cliente Supabase simulado.
- [ ] Validação da sigla na tela (tira espaços das pontas, converte para maiúsculas, confere o formato) com a mensagem que inclui o valor recebido; teste unitário da função pura.
- [ ] Área Setores no endereço, sobrevivendo ao recarregar, com as três abas e a atual destacada; a aba atual também fica no endereço; o item da faixa lateral aparece para os três perfis.
- [ ] Lista compacta no padrão da lista de usuários (sigla, nome); estados "Carregando setores…" com linhas-fantasma, "Nenhum setor cadastrado ainda." e erro de carregamento com [Tentar de novo].
- [ ] Erro de gravação mostra "A alteração não foi salva: {motivo}. Seus dados continuam no formulário." em vermelho, com o formulário preenchido.
- [ ] Testes de interface com o aplicativo inteiro e os dois módulos falsos: lista, ordem, criar com sucesso e com falha, cada recusa, validação da sigla, estados, e a Consulta sem [Novo setor].
