# 13: Retirar anexo

**Como resolve a sua parte.** O anexo é livre e não tem número, então um envio por engano (arquivo de outro processo, e-mail errado) não se corrige com uma versão nova, e um .eml enviado por erro guardaria dado pessoal sem necessidade. Este ticket faz a **retirada** (ADR 0027): Administrador ou Integrante, com o processo em andamento, retira o anexo depois de uma confirmação, sem motivo; o anexo sai da lista, o arquivo vai para a lixeira do Drive (que o apaga de vez em 30 dias) e o histórico guarda o nome, quem retirou e quando.

**What to build:** a retirada de ponta a ponta (banco, função do servidor, tela e testes).

- **Banco:**
  - política de apagar em `anexos` para Administrador e Integrante ativos; gatilho que recusa com o processo fora de andamento ou arquivado;
  - evento no histórico na retirada, com o nome guardado mesmo depois de apagada a linha.
- **Função `arquivos-no-drive`:** ação `retirar`: confere quem pede e a situação do processo, confere que o arquivo está debaixo da raiz do ambiente, manda o arquivo para a lixeira do Drive e então apaga o registro com o token de quem pediu; se o banco falhar, tira o arquivo da lixeira e devolve a recusa. O arquivo puro de decisão ganha a ação, com a tabela de perfis de sempre.
- **Conta de serviço:** conferir se o papel dela no Drive compartilhado permite mandar à lixeira ("Gerente de conteúdo" ou acima); se não permitir, registrar o passo ao usuário no roteiro em `docs/` e no `desvios.md`.
- **Tela:**
  - [Retirar] em cada linha da seção, para Administrador e Integrante com o processo em andamento;
  - confirmação na moldura que já existe: "Retirar '{nome}'? O arquivo vai para a lixeira do Drive e some em 30 dias.";
  - cancelar não muda nada; sucesso tira a linha; falha mostra a mensagem em vermelho com o anexo ainda na lista;
  - o texto do evento: "Retirou o anexo '{nome}'".
- **Recusas:** anexo já retirado (por exemplo, em duas abas), processo fora de andamento ou arquivado, perfil sem permissão.

Spec: `.scratch/documentos-versoes/spec.md`, seção "Outros anexos (mudança de 2026-10-26)" (histórias 125 a 129, 131, 132 e 134; decisões 1, 2 e 6). ADR 0027.

**Branch:** `quadro-livre-parte-4`. A migração vai ao banco de desenvolvimento pelo workflow "Migrar banco de desenvolvimento"; a função precisa ser publicada de novo pelo usuário, e a lixeira e a volta da lixeira se provam no Drive real.

**Blocked by:** 12 (Enviar, ver e baixar anexos): a retirada age sobre a tabela, a seção e a função criadas nele.

**Status:** ready-for-agent

## Critérios de aceite

- [x] Testes pgTAP escritos antes da migração e vistos falhar: apagar em `anexos` com Administrador e Integrante aceito; com Consulta, inativo e visitante recusado; com o processo suspenso, cancelado, concluído e arquivado recusado; evento da retirada com o nome; exclusão do processo aceita depois de retirado o último anexo.
- [x] Testes de interface com o aplicativo inteiro: retirar com a confirmação e a linha sumindo; cancelar a confirmação; falha da retirada com o anexo na lista e a mensagem; anexo já retirado; Consulta e processo suspenso, concluído e arquivado sem [Retirar]; o evento no histórico; versão, relatório e .pdf da aprovação continuam sem retirada.
- [x] O arquivo puro de decisão tem testes da ação `retirar` por perfil e situação; os testes do módulo real provam a retirada e as frases das recusas.
- [ ] `[visual]` A confirmação da retirada mostra o nome do arquivo e a frase da lixeira sem passar da altura do notebook (1366×768).

O critério `[visual]` fica sem marca: a janela de confirmação foi montada numa vitrine local com um nome de 118 caracteres e só medida (258 px de altura em 768 px, 328 px de largura, sem estouro lateral, foco no Cancelar; a captura de tela deu tempo esgotado), não vista no app real nem com o login real (ver `.scratch/documentos-versoes/desvios.md`, 2026-10-26, ticket 13). A função `arquivos-no-drive` precisa ser publicada de novo pelo usuário, e a lixeira se prova no Drive real.
Concluído em 2026-10-26 (commit df2f0cf)
