# 01: Cartão e verso mais limpos

**What to build:** o cartão do Quadro e o verso deixam de mostrar o que só ocupa espaço. No cartão, saem os selos "Modelagem hoje", "Modelagem dd/mm" e "Sem responsável". Sem responsável, a frente não mostra ninguém, e a foto (ou a bolinha com a letra) passa de 20 para 24 px. A coluna "Sem responsável" do Quadro agrupado por responsável continua. No verso, o topo perde o subtítulo (a bolinha da cor do macroprocesso, o macroprocesso e o tipo) e ficam o selo do setor, o nome, a pílula de situação, o "⋯" e o fechar. O responsável no Agora aparece pela foto (32 px) e pelo nome, sem o tempo na etapa e sem o "Trocar". O nome é o botão que abre a lista suspensa de hoje (escolher grava, Esc fecha só a lista, o foco volta ao nome), com o nome acessível "Trocar o responsável: <nome>". Sem responsável, aparece um botão discreto "Escolher responsável". Na Consulta, o nome é só texto e, sem responsável, nada aparece. O "(Inativo)", o [Assumir] e o aviso de processo parado continuam. A seção "Arquivos" do verso passa a se chamar "Documentos do Mapeamento", e o nome acessível da região muda junto. A legenda "Arquivos" do envio de versão não muda. Não há mudança no banco. Regras completas na spec: seções "Cartão do Quadro" e "Verso do cartão" (histórias 29 a 40) e nas decisões "Selos do cartão", "Responsável no verso", "Tamanho da foto", "Cabeçalho do verso" e "Seção de arquivos do verso".

**Blocked by:** None (can start immediately)

**Status:** ready-for-agent

- [ ] Os tipos de selo `modelagem` e `sem_responsavel` e as funções deles saem, e a ordem dos demais selos não muda. Os testes unitários dos selos estão atualizados.
- [ ] Nenhum cartão mostra "Modelagem hoje", "Modelagem dd/mm" nem "Sem responsável", com data no passado, hoje e no futuro.
- [ ] O cartão sem responsável não mostra foto nem selo, e a coluna "Sem responsável" do agrupamento por responsável continua.
- [ ] O topo do verso não mostra o macroprocesso nem o tipo.
- [ ] No verso, o responsável aparece sem o tempo e sem o "Trocar". Clicar no nome abre a escolha, escolher grava, e Esc fecha só a lista e devolve o foco ao nome.
- [ ] Sem responsável, Administrador e Integrante veem "Escolher responsável", que abre a mesma escolha. A Consulta não vê nada, e com responsável vê o nome sem botão.
- [ ] O responsável inativo continua com "(Inativo)". Falha ao gravar mantém o responsável anterior e mostra o aviso de hoje.
- [ ] A seção se chama "Documentos do Mapeamento", no título e no nome acessível.
- [ ] Os testes que cobriam os selos que saem e o "Trocar" foram reescritos para o comportamento novo. `npm test` verde.
- [ ] `[visual]` A foto está maior na frente do cartão e no verso, sem desalinhar a linha.
- [ ] `[visual]` "Escolher responsável" aparece discreto, sem competir com o botão principal do Agora.
