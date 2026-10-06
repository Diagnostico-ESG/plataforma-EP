# Início do projeto

Registro das perguntas iniciais do `/setup` (2026-10-06).

- **Dados pessoais ou sensíveis:** sim (nomes e e-mails de servidores e de responsáveis de setores, arquivos .eml; LGPD). Sugeri desativar o claude-mem; decisão: **manter ligado por ora**, porque nesta fase só entram dados inventados. Rever antes de qualquer contato com dado real.
- **Auditoria dos pacotes de terceiros:** sim, relatório abaixo.
- **Ambiente de banco de desenvolvimento:** remoto de desenvolvimento (escolha minha; o Docker está instalado, mas não é usado para o banco).

## Auditoria dos plugins (2026-10-06)

| Plugin | O que roda sozinho (hooks) | Internet | Arquivos que grava | Dados que envia |
| --- | --- | --- | --- | --- |
| superpowers 6.3.0 | No início da sessão, lê um arquivo de instruções do próprio plugin e o injeta na conversa. | Não. | Nenhum. | Nenhum. |
| ponytail 4.8.4 | No início da sessão, em subagentes e a cada mensagem: injeta instruções e guarda o "nível" escolhido. | Não. | Um arquivo de configuração e de estado, na pasta do usuário. | Nenhum. |
| claude-mem 13.25.2 | Em quase todo evento (início e fim de sessão, cada mensagem, cada uso de ferramenta): manda o que acontece na sessão a um processo local que resume e guarda. | Sim: os resumos são feitos por um modelo Claude (Haiku 4.5), pela sua assinatura da Anthropic. Sincronização em nuvem e "Pro memory" estão **desligadas** (sem token). Telemetria **desligada**. | Banco local em `C:\Users\alexmacedo\.claude-mem\` (SQLite e índice de busca), com o conteúdo resumido das sessões. | Trechos da conversa e do resultado das ferramentas vão à Anthropic para serem resumidos. É o ponto de atenção para dado pessoal. |
| impeccable 4.3.1 | Depois de cada edição de arquivo e ao fim de cada resposta: roda um programa próprio que confere a interface. | Só para baixar o próprio programa do GitHub (releases do `pbakaus/impeccable`), se ele faltar. | Cache do programa na pasta do usuário. | Nenhum dado do projeto encontrado sendo enviado. |
| mattpocock-skills, apple-design-skill, frontend-design, code-review, project-artifact, typesafe | Nenhum: só instruções (skills e comandos), acionadas quando chamadas. | Não por conta própria. | Só o que a skill pedir quando chamada. | Nenhum por conta própria. |
| supabase (conector) | Nenhum hook. Conector para `mcp.supabase.com`, ainda não autorizado. | Sim, quando autorizado e usado. | Nenhum. | O que for consultado no projeto Supabase. |
| github (conector) | Nenhum hook. Conector para `api.githubcopilot.com`; falha ao conectar (token mal configurado). | Sim, quando funcionar. | Nenhum. | O que for consultado no GitHub. |

Conclusão: o único plugin que envia conteúdo da sessão para fora é o claude-mem (à Anthropic, para resumir). Os demais trabalham localmente.

## Banco

- banco: remoto de desenvolvimento
- banco: testes pelo script (sem Docker)
- banco: login preparado (cadastro aberto desligado no config.toml e no painel; teste de cadastro recusado com signup_disabled em 2026-10-06)
- banco: arquivos preparados (teste `01_buckets_privados` criado; conferido junto com `00_rls_ligada` pelo SQL Editor em 2026-10-06: 0 tabelas sem RLS, 0 buckets públicos)
- **Rede bloqueia o banco (2026-10-06):** nesta rede só a porta 443 abre; as portas 5432 e 6543 do Supabase estão fechadas. `npm run test:db`, `npx supabase db push` e `db query --linked` não conectam daqui (o `db:types` funciona, pela 443). **Decisão do usuário:** migrações e testes de banco são aplicados à mão no SQL Editor do painel do projeto dev, com o usuário relatando o resultado. Consequência: as migrações aplicadas assim não entram no histórico da CLI; antes da primeira publicação em produção será preciso registrá-las (`migration repair`) de uma rede com as portas liberadas. Em rede liberada, `npm run test:db` volta a funcionar sem mudança.

setup concluído em 2026-10-06
