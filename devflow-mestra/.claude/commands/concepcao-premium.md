---
description: Roda frontend-design seguido de apple-design-skill para estruturar o layout segundo o HIG da Apple.
---

Leia `.claude/regras/interface.md` e execute em duas etapas, nesta ordem:

1. Ative `frontend-design` para definir a identidade de marca e o conceito visual exclusivo do projeto descrito em `.scratch/projeto.md` e nesta conversa. Valem as mesmas regras do `/concepcao-livre` sobre imagens de referência, limite de rodadas, formato de tela que depende de funcionalidade e consolidação de protótipos já aprovados. Se o `/concepcao-livre` já rodou nesta conversa e eu não rejeitei o conceito, reaproveite-o como esta etapa e me avise, em vez de gerar outro do zero.
2. Em seguida, ative a skill `apple-design-skill` (Human Interface Guidelines) para estruturar esse layout segundo os padrões da Apple: grid de 8px, tipografia dinâmica, uso de materiais/desfoques e minimalismo. Este é um projeto web — adapte os princípios do HIG para HTML/CSS, sem replicar literalmente componentes SwiftUI/UIKit.

Apresente o resultado combinado antes de gerar qualquer código de interface.

Depois que eu aprovar a proposta, salve a versão combinada aprovada em `.scratch/identidade-visual.md` (substituindo a do `/concepcao-livre`, se existir) com tudo que o `/implementar-identidade` precisa: paleta com os códigos de cor, fontes, escala de tamanhos, espaçamentos, layout, o elemento marcante, o estilo dos controles e os textos-padrão dos estados de carregando, vazio e erro. Mostre-me o que gravou, grave o próximo passo em `.scratch/proximo-passo.md` e comite. Depois, lembre que o próximo passo é `/implementar-identidade`, com o modelo da tabela do Funil de Trabalho.
