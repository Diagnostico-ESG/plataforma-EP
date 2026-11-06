---
description: Cria identidade visual conceitual do zero, sem depender de um projeto existente. Também consolida protótipos já aprovados num redesenho.
---

Leia `.claude/regras/interface.md` e ative a skill `frontend-design` para criar uma identidade visual conceitual para o projeto descrito em `.scratch/projeto.md` e nesta conversa: paleta de cores, tipografia e estilo geral, partindo do zero. Evite o visual genérico de "SaaS boilerplate" (fontes padrão, gradientes roxos, cards dentro de cards). A identidade inclui o estilo dos controles (caixa de seleção, seletor de data, botões) e os textos-padrão dos estados de carregando, vazio e erro.

**Imagens de referência.** Posso trazer imagens ou endereços de sites de que gosto; use-os como ponto de partida e diga o que tirou de cada um. Limite as rodadas: depois de quatro ou cinco amostras, monte um quadro comparativo das finalistas para eu escolher, em vez de gerar mais.

**Formato de tela que depende de funcionalidade.** Se a proposta implica um formato que só existe com uma funcionalidade (quadro com arrastar, painel lateral, tabela editável), avise qual funcionalidade ela pressupõe, para o `/planejar` saber.

**Redesenho com direção já escolhida em protótipos.** Se eu já tenho protótipos aprovados (arquivos HTML ou imagens), não faça uma rodada de conceitos: consolide a direção escolhida direto em tokens (cores, tipografia, espaçamentos), confira o contraste e liste as decisões que ainda estão pendentes para eu fechar.

Apresente a proposta antes de gerar qualquer código de interface.

Depois que eu aprovar a proposta, salve-a em `.scratch/identidade-visual.md` com tudo que o `/implementar-identidade` precisa: paleta com os códigos de cor, fontes, escala de tamanhos, espaçamentos, layout, o elemento marcante, o estilo dos controles e os textos-padrão dos estados de carregando, vazio e erro. Mostre-me o que gravou, grave o próximo passo em `.scratch/proximo-passo.md` e comite. Depois, lembre que o próximo passo é `/implementar-identidade`, com o modelo da tabela do Funil de Trabalho.
