# Próximo passo (2026-11-02)

**Situação:** os 5 tickets do `redesenho-do-quadro` estão concluídos na `main` (ticket 05 no commit `fe9cd2c`). O verso mostra agora a imagem (.png) da versão mais recente no lugar do ícone, com os estados carregando, sem .png, erro e clique que abre o .png inteiro. A imagem é pedida ao módulo de versões ao abrir o verso, nada é guardado e o endereço temporário é liberado ao fechar. A suíte passou (263 arquivos, 3357 testes). Efeito colateral: abrir o verso agora faz um pedido a mais (o .png da miniatura); o teste de `App.baixarArquivo` foi ajustado.

**Próximo comando:** `/polir` (Sonnet) na interface do redesenho, depois `/ship` (Sonnet). Ressalva para o `/ship`: a prova da miniatura com o login real depende de a função `arquivos-no-drive` estar publicada no desenvolvimento (foi em 2026-11-01).

**Depende do usuário:** ver o verso e a miniatura com o login real (o `[visual]` do 05 não foi visto no navegador, só por testes); ler as "Decisões a confirmar" da spec e do `plano-04.md`; ver as Linhas e os ícones com o login real; conferir o Catálogo de etapas; escolher o responsável inicial de cada etapa.
