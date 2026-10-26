# O anexo se retira, e o arquivo vai para a lixeira do Drive

Data: 2026-10-26.

Decisão do usuário (iniciativa quadro-livre, parte 4). Abre uma exceção ao "nunca se apaga" das versões (ADR 0005 e seguintes), só para o anexo.

O anexo (arquivo avulso do processo, fora da numeração de versões) não se substitui: Administrador ou Integrante do EP o retira, com o processo em andamento, depois de uma confirmação e sem motivo. Ele sai da lista, o arquivo vai para a lixeira do Drive compartilhado, que o apaga de vez em 30 dias, e o histórico do processo guarda o nome do arquivo, quem retirou e quando. Para trocar um anexo, retira-se e envia-se de novo. Versão, relatório e .pdf da aprovação continuam sem nunca sair.

O motivo: o anexo é livre e não tem número, então um envio por engano (arquivo de outro processo, e-mail errado) não tem como ser corrigido por uma versão nova. Mantê-lo para sempre deixaria o erro na lista e, no caso de um .eml com nomes e conversas de pessoas, guardaria dado pessoal sem necessidade (LGPD). A lixeira dá 30 dias para desfazer um engano na retirada.

## Opções consideradas

- Nunca sai, como a versão: o engano fica para sempre, e com ele o dado pessoal.
- Substituir, como o arquivo da versão: não resolve o anexo que nem deveria estar ali.
- Retirar só da lista, deixando o arquivo no Drive: o dado pessoal continuaria guardado sem uso.
- Exigir motivo na retirada: mover entre etapas também não pede motivo (ADR 0022), e o histórico já diz quem retirou.
