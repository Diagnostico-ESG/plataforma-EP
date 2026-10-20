# 03: As duas planilhas atualizadas de ponta a ponta

**Como resolve a sua parte.** É o ticket que elimina o preenchimento à mão: o botão (e o robô das 6h) passa a escrever de verdade a Planilha interna e a Planilha pública, com as regras de fase, rótulo, datas e contagens da sabatina, sem nenhum nome de pessoa.

**What to build:** no banco, o pacote de dados montado pela função privada do ticket 02 (data e hora da geração; etapas ativas com código, ordem e fase; processos com identificador, nome, tipo, sigla do setor, macroprocesso, situação guardada, se está concluído, observações, data da reunião e número da última versão não histórica; andamentos com status, início e resolução; nenhum nome nem e-mail de usuário). A Edge Function `planilhas-dos-dashboards`, na ordem configuração → senha interna → validação do pacote → montagem → escrita → resultado ao banco, sem ler o banco e sem a chave secreta do Supabase. Decisão pura testada no Vitest:

- validação do pacote (recusa com o campo, o valor recebido e o esperado);
- montagem das abas Processos e Fases da planilha interna: cancelados fora, suspensos dentro, subprocesso e "a classificar" contando um cada; fases I a III concluídas; situação de cada fase IV a VII; Publicação dispensada como "Dispensada"; fase sem etapa ativa como "Sem etapa"; rótulos "Publicado", "Concluído", "Em andamento · fase", "Próxima · fase" e "Suspenso · fase"; data da modelagem piloto pela reunião ou, sem ela, pela conclusão da etapa; data da publicação; "V7" como última versão; identificador do processo nas duas abas; data de conclusão da fase;
- montagem da planilha pública: total de processos, total de setores distintos, concluídos e total por fase I a VII, data e hora da atualização;
- motivo da falha do Google num código curto.

Escrita com uma atualização em lote do Sheets por planilha (garante as abas, troca o conteúdo, apaga as linhas que sobram); a interna primeiro, depois a pública; falha da pública com a interna já escrita fica "Falhou" com o motivo da pública. Segredo novo da senha interna; conta de serviço do Drive reaproveitada com o escopo do Sheets. Logs e respostas sem nome de processo, observação, identificador de planilha nem token. Roteiro dos passos do usuário: criar as duas planilhas em branco no Drive compartilhado, ligar o Sheets no projeto do Google Cloud, gravar o segredo e os identificadores no cofre, publicar a função no desenvolvimento (`functions deploy ... --use-api`). Spec: histórias 9 a 27, 30 e 34.

**Blocked by:** 01 (a fase de cada etapa), 02 (a tentativa, a ficha e o envio pelo banco).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Banco: testes antes da migração: a função que monta o pacote não é chamável pela tela; o pacote traz as etapas ativas com a fase, os processos (inclusive os cancelados, que a montagem tira) e os andamentos, sem nome nem e-mail de usuário.
- [ ] Vitest da decisão pura, com pacotes inventados: cada regra da situação da fase, a Publicação dispensada, cada rótulo, cancelados fora e suspensos dentro, os três tipos, as duas datas, a última versão, a fase "Sem etapa", o identificador nas duas abas, as contagens públicas, nenhum nome de pessoa nas linhas, a validação do pacote e a senha errada recusada antes de qualquer chamada ao Google.
- [ ] No desenvolvimento, com a função publicada pelo usuário: apertar [Atualizar planilhas agora] preenche as abas Processos e Fases da planilha interna e a planilha pública, e a tentativa aparece "Concluída"; uma falha provocada (por exemplo, a conta de serviço sem acesso à planilha pública) aparece "Falhou" com a frase do motivo, e a planilha que falhou fica como estava.
- [ ] Roteiro dos passos do usuário escrito: lista numerada, um passo por linha, com o caminho completo de arquivo ou pasta e o endereço direto de cada página.
