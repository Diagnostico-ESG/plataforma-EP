# Decisões do projeto (índice dos ADRs)

Um **ADR** (registro de decisão de arquitetura) é um texto curto que guarda uma escolha difícil de adivinhar só olhando o código: o que foi decidido, por quê e o que se perdeu com a escolha. Os ADRs ficam em `docs/adr/`, um arquivo por decisão, e nunca se editam depois de escritos: quando uma decisão muda, nasce um ADR novo que diz qual ele substitui.

Leia o índice antes de mudar uma regra do sistema. Se a mudança que você quer contraria um ADR, o caminho é escrever um ADR novo.

| ADR | Data | Decisão em uma linha | Relação com outros |
| --- | --- | --- | --- |
| [0001](../adr/0001-login-google-institucional-com-autorizacao.md) | 2026-10-07 | O login é só pelo Google, só com conta `@ccivil.pr.gov.br`, e só entra quem o Administrador autorizou antes (o banco recusa o resto). | Base de todos os outros. |
| [0002](../adr/0002-usuario-que-ja-entrou-nao-se-exclui.md) | 2026-10-07 | Quem já entrou não se exclui, só se desativa, para o nome continuar no histórico. | |
| [0003](../adr/0003-foto-acompanha-google-e-confirmacao-na-administracao.md) | 2026-10-08 | A foto acompanha a conta Google a cada entrada; na Administração, escolher não grava, só o Salvar; só Excluir autorização e Desativar pedem confirmação. | Ajusta o 0001. |
| [0004](../adr/0004-catalogo-muda-o-caminho-dos-processos-em-andamento.md) | 2026-10-13 | Etapa nova do catálogo entra como pendente em todos os processos em andamento; desativar a tira de onde ainda estava pendente. | Base dos 0009, 0012 e 0017. |
| [0005](../adr/0005-versao-do-processo-com-os-arquivos-dentro.md) | 2026-10-15 | A versão pertence ao processo, tem número sequencial e guarda os arquivos dentro (sem "documento" como nível separado). | |
| [0006](../adr/0006-envio-de-versao-nao-muda-a-etapa.md) | 2026-10-15 | Enviar uma versão só registra a versão; quem move as etapas é o andamento. | |
| [0007](../adr/0007-arquivo-da-versao-se-substitui-sem-guardar-o-anterior.md) | 2026-10-15 | A versão existe para sempre, mas um arquivo dela pode ser substituído por outro do mesmo tipo, sem guardar o anterior (o histórico registra a troca). | Limitado pelo 0011. |
| [0008](../adr/0008-arquivos-no-drive-compartilhado-por-conta-de-servico.md) | 2026-10-15 | Os arquivos ficam no Drive compartilhado do CED, enviados por uma conta de serviço; o Supabase não guarda arquivo. A chave da conta vive só numa função do servidor. | Reaproveitado pelo 0017. |
| [0009](../adr/0009-conclusao-das-etapas-de-revisao-com-trava.md) | 2026-10-16 | As etapas de revisão e aprovação só se concluem à mão, com trava no banco; registrar não muda etapa. | Em parte substituído pelo 0012 e pelo 0015. |
| [0010](../adr/0010-emails-da-rodada-fora-da-plataforma.md) | 2026-10-16 | A plataforma não guarda e-mails das conversas com os setores (LGPD). | Ficou sem objeto com o 0012. |
| [0011](../adr/0011-versao-aprovada-nao-tem-arquivo-substituido.md) | 2026-10-16 | Arquivo de versão aprovada não se substitui; o Drive guarda o substituído por 30 dias nas outras versões. | Complementa o 0007. |
| [0012](../adr/0012-revisao-pelo-setor-sem-rodadas.md) | 2026-10-17 | A revisão pelo setor é só uma etapa, sem rodadas; concluí-la exige a versão mais recente completa. | Substitui parte do 0009. |
| [0013](../adr/0013-etapas-do-setor-responsaveis-e-reunioes-saem.md) | 2026-10-18 | Saem as etapas do setor, os responsáveis do setor e a área de Reuniões; sobra a data da modelagem piloto no próprio processo. | Apaga tabelas por migração. |
| [0014](../adr/0014-resolver-etapa-avanca-e-trava-do-autor-na-escolha.md) | 2026-10-18 | Resolver a etapa atual já inicia a próxima, numa função só; quem enviou a versão não pode ser o revisor interno dela (conferido na escolha). | |
| [0015](../adr/0015-revisao-e-aprovacao-gravadas-no-concluir.md) | 2026-10-19 | A revisão interna e a aprovação se gravam no próprio Concluir; número, link e data do E-protocolo são opcionais. | Substitui parte do 0009. |
| [0016](../adr/0016-versao-exige-bpm-e-png-sem-visualizador-de-bpmn.md) | 2026-10-20 | A versão nova exige o `.bpm` (Bizagi) e o `.png`; o `.bpmn` fica opcional e o visualizador de `.bpmn` sai da v1. | Muda a "versão completa" do 0009. |
| [0017](../adr/0017-planilhas-alimentadas-pela-plataforma-e-dashboards-no-data-studio.md) | 2026-10-20 | A plataforma escreve duas planilhas do Google (interna e pública) todo dia às 6h; os dashboards passam do Power BI ao Data Studio; cada etapa do catálogo tem uma fase do Regimento. | Usa o 0008 e o 0004. |
| [0018](../adr/0018-banco-agenda-e-entrega-os-dados-das-planilhas.md) | 2026-10-20 | O próprio banco agenda a atualização (`pg_cron`), monta o pacote e o envia à função (`pg_net`), com senha interna no cofre; a chave secreta do Supabase não entra na plataforma. | Completa o 0017. |

## Quando escrever um ADR novo

- Uma regra do sistema muda e há um ADR que dizia o contrário.
- Entra uma dependência de produção nova (o que faz, por que o recurso nativo da web não basta, o tamanho que acrescenta).
- Entra um segredo ou uma permissão nova no projeto.
- Uma escolha foi difícil e quem vier depois vai perguntar "por que é assim?".

O nome do arquivo segue `docs/adr/NNNN-titulo-curto.md`, com o próximo número livre. Não edite nem apague ADR antigo.
