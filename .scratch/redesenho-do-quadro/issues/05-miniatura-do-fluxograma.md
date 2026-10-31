# 05: Miniatura do fluxograma no verso

**Como resolve a sua parte:** para lembrar como é o fluxo, hoje é preciso abrir o .png. Este ticket mostra no verso a imagem da versão mais recente, buscada no Drive pela mesma ação de baixar que o botão de abrir já usa, sem nada novo no banco.

**What to build:** no lugar da miniatura do verso enxuto, a imagem (.png) da versão mais recente, com os estados de carregando, sem .png e erro, e que abre o .png inteiro ao clicar. Spec: seção "Redesenho do Quadro" de `.scratch/processos-etapas/spec.md`, histórias 75 a 80.

**Blocked by:** 04 (a miniatura mora no verso enxuto).

**Status:** ready-for-agent

- [ ] Ao abrir o verso, se a versão mais recente tem .png, a imagem é buscada pelo módulo de versões que já baixa arquivos e aparece na miniatura; nada é guardado, e o endereço temporário da imagem é liberado ao fechar o verso.
- [ ] Enquanto carrega, um quadro cinza do mesmo tamanho (o verso não pula).
- [ ] Sem .png: quadro com o ícone do fluxograma e "Sem imagem (.png) nesta versão".
- [ ] Erro, inclusive sem conexão: "Não foi possível carregar a imagem." no quadro, sem impedir o resto do verso.
- [ ] Clicar abre o .png inteiro pelo caminho de abrir que já existe.
- [ ] Texto alternativo "Fluxograma {versão} de {processo}".
- [ ] Testes de tela dos cinco estados (sem versão, carregando, sem .png, erro e imagem) e do clique, com o módulo falso de versões.
- [ ] Ressalva para o `/ship`: a prova com o login real depende de a função `arquivos-no-drive` estar publicada no desenvolvimento.
