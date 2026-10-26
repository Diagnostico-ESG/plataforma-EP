# 12: Enviar, ver e baixar anexos

**Como resolve a sua parte.** Os arquivos avulsos de um processo (o e-mail com a resposta do setor, a planilha, a foto, um .pdf de apoio) hoje ficam fora da plataforma. Este ticket cria o **anexo** de ponta a ponta: a seção "Outros anexos" no verso, em todas as etapas, onde Administrador e Integrante enviam um arquivo de cada vez com o nome original, marcado com a etapa em que o processo estava, e onde todo perfil vê e baixa. O arquivo vai para a subpasta "Anexos" da pasta do processo no Drive, entra na conferência com o Drive e no histórico. Ainda sem retirada (ticket 13).

**What to build:** o anexo de ponta a ponta (banco, função do servidor, módulo, seção no verso e testes).

- **Banco:**
  - tabela `anexos` (processo, etapa do envio, nome original, formato, tamanho, hash, `drive_id`, autor e data), com RLS: todo perfil ativo lê; Administrador e Integrante ativos incluem; ninguém altera; ninguém apaga (a retirada vem no 13);
  - gatilhos: processo em andamento e não arquivado; etapa, autor e data preenchidos pelo banco; evento no histórico com o nome e a etapa;
  - restrições: formatos .pdf, .docx, .xlsx, .png, .jpg, .jpeg e .eml; 1 byte a 20 MB; nome até 300 caracteres;
  - processo com anexo não se exclui (a recusa da exclusão conta os anexos);
  - coluna `processos.drive_pasta_dos_anexos` (identificador da subpasta).
- **Função `arquivos-no-drive`:** papel `anexo` em `iniciar_envio`, `registrar`, `baixar` e `conferir`; nome original (sem nome padrão, só a regra de caracteres e o limite de 300); subpasta "Anexos" criada no primeiro envio e guardada no processo; o arquivo puro de decisão com o papel novo e a tabela de perfis de sempre; logs e mensagens de erro sem o nome do anexo (pode trazer nome de pessoa), só o identificador.
- **Tela:**
  - módulo de anexos (listar, enviar, baixar) com a tradução das recusas e a falsa nomeada;
  - seção "Outros anexos" abaixo das versões, na coluna esquerda do verso: lista do mais recente ao mais antigo (nome, etapa, autor, data, [Baixar]), "Nenhum anexo.", carregando, erro com [Tentar de novo], marcas da conferência;
  - [Enviar anexo] para Administrador e Integrante com o processo em andamento: formulário que abre e fecha e rola até aparecer inteiro, campo nativo com `accept`, aviso de formato e tamanho antes do envio, progresso, falha sem perder o arquivo escolhido;
  - Consulta, processo suspenso, cancelado, concluído ou arquivado: sem [Enviar anexo];
  - os textos do evento no histórico: "Enviou o anexo '{nome}' ({etapa})".
- **Recusas:** "O anexo precisa ser .pdf, .docx, .xlsx, .png, .jpg, .jpeg ou .eml; recebido: {extensão}.", "O anexo pode ter até 20 MB; recebido: {tamanho}.", processo fora de andamento ou arquivado, perfil sem permissão.

Spec: `.scratch/documentos-versoes/spec.md`, seção "Outros anexos (mudança de 2026-10-26)" (histórias 112 a 124, 130 a 134; decisões 3 a 5). ADR 0027 e sabatina `.scratch/quadro-livre/sabatina-parte-4.md`.

**Branch:** `quadro-livre-parte-4`. A migração vai ao banco de desenvolvimento pelo workflow "Migrar banco de desenvolvimento"; a função precisa ser publicada de novo pelo usuário.

**Blocked by:** None (can start immediately).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Testes pgTAP escritos antes da migração e vistos falhar: cada célula de "quem pode o quê" de `anexos` (ler, criar, alterar) com Administrador, Integrante, Consulta, inativo e visitante; envio recusado em processo suspenso, cancelado, concluído e arquivado; .exe, 0 byte e 20 MB + 1 byte recusados; etapa, autor e data preenchidos pelo banco (etapa enviada ignorada); alteração do nome recusada; evento com o nome e a etapa; exclusão do processo com anexo recusada. `10_privilegios_padrao` e `46_funcoes_e_views_seguras` continuam passando.
- [ ] Testes de interface com o aplicativo inteiro: a seção em Não iniciados, Modelagem piloto, Validação com o setor e Concluídos; enviar e ver a linha nova com a etapa; o anexo mantendo a etapa depois de mover o processo; formato e tamanho recusados antes do envio; falha do envio sem perder o arquivo; dois anexos com o mesmo nome; baixar; "Nenhum anexo."; erro com [Tentar de novo]; Consulta e processo suspenso, concluído e arquivado sem [Enviar anexo]; subprocesso com os próprios anexos e o pai sem os dos filhos; o evento no histórico; a marca da conferência num anexo sumido.
- [ ] O arquivo puro de decisão da função tem testes do papel `anexo` por perfil e situação e da regra do nome original; os testes do módulo real provam o envio e as frases das recusas.
- [ ] `[visual]` A seção fica abaixo das versões, com as linhas no padrão da lista de versões (nome, etapa, autor, data em mono), e o nome longo se corta sem quebrar a linha.
- [ ] `[visual]` O formulário de envio aberto rola até aparecer inteiro e fecha pelo mesmo botão.
