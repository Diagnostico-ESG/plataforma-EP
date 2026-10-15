# 01: Ligação com o Drive (prova técnica)

**Como resolve a sua parte.** Os arquivos das versões vão morar no Drive compartilhado do CED, e não no Supabase (ADR 0008). Antes de construir qualquer tela, este ticket prova que a plataforma consegue guardar e trazer de volta um arquivo do Drive do jeito decidido: uma conta de serviço do EP, cuja chave fica só numa função do servidor (a primeira Edge Function do projeto), que confere quem chamou antes de agir. Ao final, um arquivo de teste vai ao Drive de desenvolvimento, na pasta `SIGLA / Nome do processo`, e volta pela função, com o login de um usuário inventado. A tela ainda não muda.

**What to build:** os passos do usuário fora da sessão, num roteiro; a função `arquivos-no-drive` com as ações `iniciar_envio` (sessão de envio resumível no Drive, com a pasta do setor e do processo criada se faltar) e `baixar` (por identificador do Drive, ainda sem a conferência pela RLS de `arquivos_da_versao`, que nasce no 02); o arquivo puro de decisão "quem pode" testado no Vitest; a tabela `pastas_no_drive` com RLS, privilégios e testes. Spec: `.scratch/documentos-versoes/spec.md` (histórias 36, 37, 40 e 43; seções "Função do servidor", "Pastas no Drive" e "Modelo de dados", tabela `pastas_no_drive`).

**Blocked by:** nenhum (pode começar já).

**Status:** ready-for-agent

## Critérios de aceite

- [ ] Antes de escrever a função, confirmado na documentação atual do Supabase como a Edge Function autentica o usuário e quais variáveis ele injeta (regra de `.claude/regras/banco.md`); o que foi confirmado fica registrado no ticket.
- [ ] Roteiro para o usuário, em linguagem simples, com: criar a conta de serviço do EP no projeto Google Cloud pessoal (o mesmo do login) e gerar a chave; criar "EP – desenvolvimento" e "EP – produção" no Drive do CED e adicionar a conta como membro com o papel que permite criar, renomear e mover pastas e arquivos (conferir na documentação do Google qual basta); gravar os segredos no projeto Supabase de desenvolvimento no próprio terminal (a chave nunca vem para a conversa); aprovar a publicação da função.
- [ ] Segredos lidos num único ponto da função: e-mail e chave da conta de serviço, identificador da raiz do ambiente e origens aceitas. Nada disso no código, no `.env.example` ou no git.
- [ ] Arquivo puro de decisão, sem dependência do Deno, testado no Vitest: cada célula da tabela da função da spec (Administrador, Integrante, Consulta, inativo, sem login, por ação), processo fora de andamento recusado no envio, extensão e tamanho (até 20 MB) recusados, e entradas inválidas (campo faltando, tipo errado) recusadas com código. O ESLint e o pré-commit alcançam esse arquivo.
- [ ] A função confere, antes de qualquer ação com o Drive, que quem chamou está logado, ativo e com o perfil exigido, lendo `usuarios` com o login de quem chamou; a chave secreta do Supabase não é usada.
- [ ] `iniciar_envio` garante a pasta do setor (sigla) e a do processo (nome) na raiz do ambiente, grava os identificadores em `pastas_no_drive` e devolve o endereço de uma sessão de envio resumível com o nome padrão; o subprocesso tem a pasta dentro da do setor dele.
- [ ] Função pura do nome padrão (sigla, número com F opcional, nome do processo, `_Relatório` no relatório, acentos mantidos, caracteres que não valem em nome de arquivo e de controle trocados por `-`, espaços repetidos reduzidos) com testes unitários, usada pela função.
- [ ] `pastas_no_drive`: testes pgTAP antes da migração, um por célula de "quem pode o quê" (ler: perfis ativos; criar e alterar `drive_id`: Administrador e Integrante; apagar: ninguém; inativo e visitante: nada); `00_rls_ligada` e `10_privilegios_padrao` passando; migração aplicada pelo workflow "Migrar banco de desenvolvimento" e registrada em `supabase/AMBIENTES.md`.
- [ ] Resposta e logs da função sem dado pessoal; erro com código e mensagem genérica; erro de cota do Drive vira o código "sem espaço no Drive".
- [ ] Prova de ponta a ponta no projeto de desenvolvimento, com a função publicada (vínculo conferido, aprovação do usuário): um usuário inventado Integrante envia um arquivo de teste inventado e o baixa de volta, igual; um usuário inventado Consulta é recusado no envio. O resultado da prova fica registrado no ticket.
