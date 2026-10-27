# Arquivos que faltam pedem confirmação, e o número da versão se edita

Data: 2026-10-27.

Decisão do usuário (demanda travas-em-avisos). Substitui a parte de trava do ADR 0025: as etapas continuam esperando os mesmos arquivos (a Modelagem piloto, uma versão piloto; a Relatório e modelagem técnica, uma versão em sequência e um relatório), mas mover para a frente sem eles deixa de ser recusado. As regras de envio do ADR 0025 (onde cada tipo de versão entra e o número da piloto) continuam.

O trabalho real nem sempre segue a ordem dos arquivos: às vezes o processo precisa avançar e os arquivos chegam depois, e às vezes uma versão foi numerada errado. As travas obrigavam a contornar a plataforma. Agora ela avisa e deixa rastro:

- **Confirmação de arquivos:** ao mover para a frente de uma dessas etapas sem os arquivos, a tela pergunta, com [Enviar arquivos agora] [Avançar mesmo assim] [Cancelar], numa pergunta só se a ida passa pelas duas. Enviar usa a janela de envio que já existe; se depois do envio ainda faltar algo, a pergunta volta. O banco não recusa mais: o evento do movimento guarda o que faltava, calculado por ele, para o histórico não depender da tela.
- **Número da versão editável:** qualquer versão, inclusive a histórica, a aprovada e a de número dado pela plataforma, por Administrador ou Integrante do EP, com o processo em andamento, sem motivo. Muda só o número, nunca o tipo. Repetir o número de outra versão do processo continua recusado, porque "V3" precisa apontar para uma versão só. Quebrar a ordem histórica → piloto → em sequência, ou deixar um salto entre versões em sequência, gera um aviso que não impede. A versão mais recente segue sendo a de maior número, então a edição pode mudá-la. Os arquivos no Drive são renomeados para o número novo, em tudo ou nada, e o evento guarda o número anterior.

A trava do autor na Revisão interna já tinha saído no ADR 0023; o aviso de hoje fica como está.

## Opções consideradas

- Manter as travas e só melhorar a janela: preserva a ordem dos arquivos, mas continua barrando o que o usuário precisa fazer.
- Confirmação sem o "Enviar arquivos agora": mais simples, mas perde o caminho mais comum, que é enviar ali mesmo.
- Editar também o tipo da versão (V1F para V1): mudaria o que a versão aceita (somente leitura, .bpm exigido); deixado de fora até haver um caso real.
- Manter o nome antigo dos arquivos no Drive, como na troca de sigla: menos trabalho, mas o Drive compartilhado mostraria um número diferente do da plataforma, que é justamente o erro que a edição corrige.
- Versão mais recente pela data de envio: tiraria da edição o efeito de acertar a ordem.
