# Próximo passo

Registro de onde a última sessão parou e do que vem a seguir. Cada sessão que terminar recomendando um próximo passo sobrescreve este arquivo antes de encerrar. Valem os arquivos se divergir do git.

Atualizado em 2026-10-28 (/demanda: Quadro por setor e etiquetas)

- **Demanda classificada, aguardando confirmação do usuário:** mudança em funcionalidade existente no `visual-do-cartao` (entregue em 2026-10-27, commit 764e74d). Duas partes: (1) no Quadro por setor, o usuário escolheu a **opção B, coluna tingida**: a coluna ganha um fundo claro na cor do setor e um cabeçalho colorido de ponta a ponta, com a sigla centralizada e o nome do setor embaixo; o cartão perde a faixa larga e o nome do processo volta a 15px, alinhado à esquerda; (2) as etiquetas (A fazer, Em andamento, Concluído) ficam mais fortes, com letra branca, porque hoje se confundem com as cores claras dos setores. A maquete traz quatro opções de etiqueta; nenhuma foi escolhida ainda.
- **Maquetes:** `.scratch/visual-do-cartao/imagens/maquete-por-setor.html` (opções A a D do Quadro por setor) e `.scratch/visual-do-cartao/imagens/maquete-etiquetas.html` (hoje e as opções 1 a 4 das etiquetas).
- **Próximo:** `/planejar` do visual-do-cartao no modo curto (Sonnet), com a opção B e a etiqueta escolhida. ADR novo (muda a frente do cartão por setor e as etiquetas vivas decididas antes); spec com `Em revisão desde 2026-10-28`. Depois `/executar-simples`, `/polir` e `/ship`.
- **Ainda do visual-do-cartao entregue:** o `[visual]` presumido (faixa nas 30 cores, selos, quadradinhos, grade de cores) segue para conferir com o login real; a divergência do Reclassificar sem campo Setor está em `desvios.md`.
- **Pendente do usuário (segue valendo):** publicar de novo `arquivos-no-drive` e `planilhas-dos-dashboards` no desenvolvimento; conferir o papel da conta de serviço nos Drives compartilhados; provar anexos no Drive real; conferir as telas com o login real; conferir no painel do Supabase de desenvolvimento que o cadastro aberto por e-mail segue desligado; apagar `.scratch/handoff-2026-10-20.md`. `src/types/database.ts` pode aparecer modificado só por fim de linha.
