# A versão aprovada não tem arquivo substituído; o Drive guarda o substituído por 30 dias

Data: 2026-10-16.

Complementa o ADR 0007. Nenhum arquivo de uma versão aprovada (a que foi ao E-protocolo) pode ser substituído; o banco recusa. Uma versão que foi ao setor numa rodada continua aceitando substituição, porque o ajuste pequeno já é feito sem reenviar ao setor.

A substituição grava o conteúdo novo por cima do arquivo no Drive, e o Google guarda o conteúdo anterior por 30 dias, em "Gerenciar versões" do arquivo. Quem tem acesso ao Drive compartilhado recupera um engano nesse prazo, sem código na plataforma. Depois disso, o anterior se perde, como diz o ADR 0007; o hash no histórico continua dizendo se o arquivo mudou.

## Opções consideradas

- Travar também a versão que foi a uma rodada: protege o que o setor recebeu, mas é mais rígido que o trabalho real.
- Não travar: a versão do E-protocolo poderia mudar sem que o número mudasse.
- Guardar o substituído na plataforma por 30 dias e apagar depois: repetiria o que o Drive já faz.
