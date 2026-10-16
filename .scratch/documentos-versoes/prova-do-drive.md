# Prova do Drive — 2026-10-16

Feita pelo usuário no projeto de desenvolvimento (`yclkzyoebpsxmgpbcbus`), seguindo `docs/drive-conta-de-servico.md`, com a função `arquivos-no-drive` publicada a partir da branch `documentos-versoes-01` e o Drive compartilhado "EP – desenvolvimento".

## Preparação (passos 1 a 5 do roteiro)

- Conta de serviço `ep-drive` criada no projeto Google Cloud `plataforma-ep-dev`. A criação da chave estava bloqueada pela política da organização `iam.disableServiceAccountKeyCreation` (e pela versão `iam.managed...`), herdada da organização do usuário. O usuário deu a si o papel de Administrador de políticas da organização, desligou as duas regras só nesse projeto, criou a chave e religou as duas ("Herdar a política do pai"). A chave fica em `dados-reais/ep-drive.json`, fora do git.
- Drives compartilhados "EP – desenvolvimento" e "EP – produção" criados no Drive do CED, com a conta de serviço como Gerente de conteúdo. A janela "Gerenciar participantes" só abriu fora da janela normal do navegador (janela anônima, outro navegador ou painel de detalhes).
- Segredos gravados e função publicada. O primeiro `secrets set` falhou sem gravar nada: o `ReadAllBytes` do .NET procura o arquivo em `C:\Windows\system32`, e não na pasta do terminal. O roteiro passou a usar `Resolve-Path`.
- O provedor Email do Supabase de desenvolvimento estava desligado e foi ligado para a prova. O roteiro manda desligá-lo de novo na seção 7.

## Script `scripts/prova-do-drive.mjs` (passo 6)

- **Integrante:** o usuário relatou todas as linhas OK, sem colar a saída.
- **Consulta**, saída colada pelo usuário:

```
OK      consulta é recusada no envio (403 sem_permissao)
OK      consulta baixa o arquivo enviado pelo integrante (bytes iguais aos enviados)
OK      consulta confere o arquivo enviado com o Drive (situação 'ok' para o arquivo enviado)
OK      conferir sem login é recusado (401 sem_login)
OK      arquivo que não existe é recusado (403 sem_permissao)
OK      sem login é recusado (401 sem_login)
OK      substituir por outro tipo é recusado (409 tipo_de_arquivo_diferente)
OK      sessão de envio do .bpmn (TST_V1_teste1.bpmn)
OK      bytes do .bpmn enviados direto ao Drive (tamanho 164, md5 informado)
OK      a substituição usa o mesmo arquivo do Drive (mesmo identificador)
OK      integrante substitui o arquivo (hash novo, mesmo nome e mesmo identificador)
OK      depois da troca, o arquivo segue ok (o banco guarda o MD5 novo) (situação 'ok' para o arquivo enviado)
```

## Conferências à mão

- **6.1, marcas do Drive:** o arquivo `TST2_V1F_teste2.bpm` (versão histórica V1F) mandado para a lixeira apareceu como "Não encontrado no Drive". Restaurado, a marca sumiu. Com uma nova versão enviada pelo próprio Drive ("Gerenciar versões", mesmo identificador), apareceu "Alterado fora da plataforma". Um arquivo novo com o mesmo nome conta como arquivo diferente (outro identificador) e dá "Não encontrado".
- **6.2, a pasta acompanha a renomeação:** com o processo renomeado e uma versão nova enviada, a pasta do processo passou a ter o nome novo (a mesma pasta, sem uma segunda). Os arquivos antigos mantiveram o nome antigo, e os novos usaram o nome novo. A troca de sigla e a mudança de setor (opcionais) não foram feitas.

## Pendente

- Seção 7 do roteiro (arrumação): adiada pelo usuário em 2026-10-16, registrada no `.scratch/backlog.md` para antes do `/ship`.
- Fecho: Tarefa 9 do `plano-01.md` e o `Concluído em` dos tickets 01 a 08, conferindo esta saída contra os critérios de prova de cada um.
