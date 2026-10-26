# O relatório tem numeração própria e continua valendo nas versões seguintes

Data: 2026-10-25.

Decisão do usuário (iniciativa quadro-livre, parte 3). Muda o ADR 0005 só no relatório (deixa de ser um arquivo dentro da versão, com o número dela) e tira "relatório pendente" e "sem alteração de conteúdo".

O relatório (.docx; o .pdf deixa de ser aceito nos envios novos) tem a sua sequência por processo, Relatório V1, V2…, e se envia sozinho ou com uma versão, na Relatório e modelagem técnica ou na Revisão interna. Fica ligado à versão mais recente no momento do envio ("Relatório V2, acompanha a V8"). Versão sem relatório próprio continua valendo com o último: a tela mostra "Relatório V2 (da V7)". O nome no Drive é `SIGLA_V8_Nome do processo_Relatório V2.docx`. O relatório da versão histórica e os .pdf já gravados ficam sem número próprio; no desenvolvimento, os relatórios atuais ganham números na ordem do envio, e os "sem alteração de conteúdo" passam a ser o relatório anterior continuando a valer.

O motivo: o relatório muda menos que o fluxograma, e numerá-lo pela versão obrigava a registrar, a cada versão nova, um relatório "pendente" ou uma cópia "sem alteração". Com numeração própria, cada relatório enviado é um relatório de fato, e a versão nova não deixa nada pendente.

## Opções consideradas

- Manter o relatório com o número da versão: duas ações a mais (acrescentar ou marcar sem alteração) a cada versão nova.
- Numerar também o relatório da versão histórica, com número digitado: mais um número a digitar para arquivos de antes da plataforma.
- Tirar o relatório da versão histórica e tratá-lo como outro anexo: perderia a ligação com a versão.
